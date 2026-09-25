<script setup>
import { computed, ref, watch } from 'vue'

import { riskMeta } from '../../utils/restorationFormatters'
import { useAssignmentStore } from '../../composables/useAssignmentStore'

const {
  role,
  lastAction,
  slots,
  pendingTasks,
  ownerLoads,
  suggestionsForTask,
  assessAssignment,
  assignTask,
  resolveClaims,
  undoLast,
  setRole,
  restorerName,
  slotLabel,
  slotOccupiedBy,
} = useAssignmentStore()

const selectedTaskId = ref(null)
const draftOwnerId = ref('')
const draftSlotId = ref('')
const feedback = ref('')

const isAssigner = computed(() => role.value === 'assigner')
const selectedTask = computed(
  () => pendingTasks.value.find((item) => item.id === selectedTaskId.value) ?? null,
)

const draftLoad = computed(
  () => ownerLoads.value.find((item) => item.id === draftOwnerId.value) ?? null,
)

// 选中任务后重置草稿；若认领冲突已被裁定为单人，默认带出该认领人。
watch(
  selectedTaskId,
  () => {
    draftOwnerId.value = ''
    draftSlotId.value = ''
    feedback.value = ''
    const task = pendingTasks.value.find((item) => item.id === selectedTaskId.value)
    if (task && task.claims.length === 1) {
      draftOwnerId.value = task.claims[0]
    }
  },
  { flush: 'sync' },
)

// 修复师下拉保留停用、满载选项：允许选中后由校验层给出明确阻断原因，
// 并展示可回退的建议，而不是静默禁用。
const ownerOptions = computed(() =>
  ownerLoads.value.map((load) => ({
    id: load.id,
    name: load.name,
    hint: !load.active
      ? '已停用'
      : load.overloaded
        ? `在办已满 ${load.activeCount}/${load.capacity}`
        : `在办 ${load.activeCount}/${load.capacity}`,
  })),
)

// 时段下拉列出该修复师全部可用时段；已被占用的保留但标记冲突，
// 选中后由校验层阻断并提示可回退时段。
const slotOptions = computed(() => {
  if (!draftLoad.value) return []
  return draftLoad.value.availableSlots.map((slotId) => ({
    id: slotId,
    label: slotLabel(slotId),
    busy: slotOccupiedBy(draftLoad.value.id, slotId, selectedTaskId.value),
  }))
})

// flush: sync —— adoptOption 同步写入负责人与时段时，避免先重置时段。
watch(draftOwnerId, () => {
  draftSlotId.value = ''
}, { flush: 'sync' })

const assessment = computed(() => {
  if (!selectedTask.value) return null
  return assessAssignment(selectedTask.value.id, {
    ownerId: draftOwnerId.value || null,
    slotId: draftSlotId.value || null,
    // 单人认领视为冲突已裁定；两人同时认领必须显式处理。
    claimResolved: selectedTask.value.claims.length < 2,
  })
})

const suggestions = computed(() =>
  selectedTask.value ? suggestionsForTask(selectedTask.value) : [],
)

const hardBlockers = computed(() =>
  (assessment.value?.blockers ?? []).filter(
    (item) => item.code !== 'no-owner' && item.code !== 'no-slot',
  ),
)

const hasDoubleClaim = computed(
  () => (selectedTask.value?.claims.length ?? 0) >= 2,
)
const resolvedClaimId = computed(
  () =>
    selectedTask.value && selectedTask.value.claims.length === 1
      ? selectedTask.value.claims[0]
      : null,
)

function adoptOption(option) {
  draftOwnerId.value = option.restorerId
  draftSlotId.value = option.slotId
  feedback.value = ''
}

function adoptKeptClaim() {
  if (!resolvedClaimId.value) return
  draftOwnerId.value = resolvedClaimId.value
  const load = ownerLoads.value.find((item) => item.id === draftOwnerId.value)
  const free = load?.availableSlots.find(
    (slotId) => !slotOccupiedBy(load.id, slotId, selectedTask.value.id),
  )
  draftSlotId.value = free ?? ''
}

function keepClaim(claimId) {
  try {
    resolveClaims(selectedTask.value.id, { keepClaimId: claimId })
    feedback.value = `已采用 ${restorerName(claimId)} 的认领，其余认领已释放，仍需选定时段后落单。`
  } catch (error) {
    feedback.value = error.message
  }
}

function releaseAllClaims() {
  try {
    resolveClaims(selectedTask.value.id, { keepClaimId: null })
    feedback.value = '已释放全部认领，可按下方建议重新选择负责人。'
  } catch (error) {
    feedback.value = error.message
  }
}

function confirmAssign() {
  if (!selectedTask.value || !isAssigner.value) return
  try {
    const result = assignTask(selectedTask.value.id, {
      ownerId: draftOwnerId.value || null,
      slotId: draftSlotId.value || null,
      claimResolved: selectedTask.value.claims.length < 2,
    })
    if (result.ok) {
      feedback.value = '已落单，任务进入在办中；如需更正可立即回退。'
      selectedTaskId.value = null
    } else {
      feedback.value = '存在阻断项，未能落单，请改用下方可回退选择。'
    }
  } catch (error) {
    feedback.value = error.message
  }
}

function rollback() {
  try {
    undoLast()
    feedback.value = '已回退最近一次操作。'
  } catch (error) {
    feedback.value = error.message
  }
}
</script>

<template>
  <div class="assign-console">
    <header class="console-toolbar">
      <div class="role-switch" role="group" aria-label="身份切换">
        <button
          type="button"
          :class="['role-btn', { 'role-btn--active': role === 'viewer' }]"
          @click="setRole('viewer')"
        >
          查看者（只读建议）
        </button>
        <button
          type="button"
          :class="['role-btn', { 'role-btn--active': role === 'assigner' }]"
          @click="setRole('assigner')"
        >
          分配员（可落单）
        </button>
      </div>
      <button
        type="button"
        class="undo-btn"
        :disabled="!isAssigner || !lastAction"
        @click="rollback"
      >
        ↩ 回退最近操作
      </button>
    </header>

    <p v-if="!isAssigner" class="readonly-note">
      当前为查看者身份：可查看负责人负载、可用时段与系统建议，不能改动归属。
    </p>

    <div class="console-grid">
      <!-- 待分配任务 -->
      <section class="console-col">
        <h4 class="col-title">待分配任务（{{ pendingTasks.length }}）</h4>
        <div v-if="pendingTasks.length" class="pending-list">
          <button
            v-for="task in pendingTasks"
            type="button"
            :key="task.id"
            :class="[
              'pending-item',
              { 'pending-item--active': task.id === selectedTaskId },
            ]"
            @click="selectedTaskId = task.id"
          >
            <span class="pending-item-main">
              <strong>{{ task.title }}</strong>
              <small>{{ task.stage }}</small>
            </span>
            <span :class="['risk-tag', `risk-tag--${riskMeta(task.risk).tone}`]">
              {{ riskMeta(task.risk).label }}
            </span>
            <span v-if="task.claims.length >= 2" class="claim-flag">两人同时认领</span>
          </button>
        </div>
        <p v-else class="empty-note">所有任务均已落单。</p>
      </section>

      <!-- 分配草稿 / 建议 -->
      <section class="console-col console-col--wide">
        <template v-if="selectedTask">
          <div class="draft-head">
            <h4 class="col-title">{{ selectedTask.title }}</h4>
            <small class="draft-note">{{ selectedTask.note }}</small>
          </div>

          <!-- 两人同时认领 -->
          <div v-if="hasDoubleClaim" class="claim-banner">
            <p>
              ⚠ 两人同时认领：
              <template v-for="(claimId, index) in selectedTask.claims" :key="claimId">
                <strong>{{ restorerName(claimId) }}</strong>
                <span v-if="index < selectedTask.claims.length - 1"> / </span>
              </template>
              ，不得直接落单，请先裁定：
            </p>
            <div v-if="isAssigner" class="claim-actions">
              <button
                v-for="claimId in selectedTask.claims"
                :key="claimId"
                type="button"
                class="ghost-btn"
                @click="keepClaim(claimId)"
              >
                采用 {{ restorerName(claimId) }}，释放其余认领
              </button>
              <button type="button" class="ghost-btn ghost-btn--danger" @click="releaseAllClaims">
                释放全部认领，改按建议分配
              </button>
            </div>
            <p v-else class="readonly-note">查看者只能查看建议，认领裁定需分配员处理。</p>
          </div>

          <div v-if="resolvedClaimId" class="resolved-banner">
            已裁定采用 <strong>{{ restorerName(resolvedClaimId) }}</strong> 的认领。
            <button
              v-if="isAssigner"
              type="button"
              class="link-btn"
              @click="adoptKeptClaim"
            >
              带出该负责人与首个空闲时段
            </button>
          </div>

          <!-- 负责人 / 时段选择 -->
          <div class="draft-form">
            <label class="field">
              <span>负责人</span>
              <select v-model="draftOwnerId" :disabled="!isAssigner">
                <option value="" disabled>选择负责人</option>
                <option
                  v-for="option in ownerOptions"
                  :key="option.id"
                  :value="option.id"
                >
                  {{ option.name }}（{{ option.hint }}）
                </option>
              </select>
            </label>

            <label class="field">
              <span>修复时段</span>
              <select v-model="draftSlotId" :disabled="!isAssigner || !draftOwnerId">
                <option value="" disabled>
                  {{ draftOwnerId ? '选择时段' : '请先选择负责人' }}
                </option>
                <option
                  v-for="option in slotOptions"
                  :key="option.id"
                  :value="option.id"
                >
                  {{ option.label }}{{ option.busy ? '（已占用·冲突）' : '' }}
                </option>
              </select>
            </label>
          </div>

          <!-- 阻断原因 -->
          <ul v-if="hardBlockers.length" class="blocker-list">
            <li v-for="blocker in hardBlockers" :key="blocker.code" class="blocker-item">
              {{ blocker.message }}
            </li>
          </ul>

          <!-- 可回退的选择（建议候选） -->
          <div class="suggest-box">
            <p class="suggest-title">
              {{ isAssigner ? '可回退的建议选择' : '建议（只读）' }}
            </p>
            <div v-if="suggestions.length" class="suggest-list">
              <button
                v-for="option in suggestions"
                :key="option.restorerId"
                type="button"
                class="suggest-chip"
                :disabled="!isAssigner"
                @click="adoptOption(option)"
              >
                <strong>{{ option.restorerName }}</strong>
                <small>
                  在办 {{ option.activeCount }} · {{ slotLabel(option.slotId) }} 空闲
                </small>
              </button>
            </div>
            <p v-else class="empty-note">
              {{ hasDoubleClaim ? '请先裁定认领冲突，再给出建议。' : '暂无可承接的空闲修复师。' }}
            </p>
          </div>

          <div class="draft-footer">
            <button
              type="button"
              class="confirm-btn"
              :disabled="!isAssigner || !assessment?.ok"
              @click="confirmAssign"
            >
              确认落单
            </button>
            <p v-if="feedback" class="feedback">{{ feedback }}</p>
          </div>
        </template>

        <div v-else class="empty-note">
          从左侧选择一条待分配任务，查看负载建议并完成落单。
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.assign-console {
  display: grid;
  gap: 16px;
}

.console-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.role-switch {
  display: inline-flex;
  border: 1px solid rgba(79, 57, 32, 0.18);
  border-radius: 999px;
  overflow: hidden;
}

.role-btn {
  padding: 9px 16px;
  border: none;
  background: rgba(255, 255, 255, 0.6);
  color: #6a5439;
  font-family: inherit;
  font-size: 0.85rem;
  cursor: pointer;
}

.role-btn--active {
  background: #5d4322;
  color: #fff8eb;
}

.undo-btn {
  padding: 9px 16px;
  border-radius: 999px;
  border: 1px solid rgba(79, 57, 32, 0.22);
  background: #fbf5ea;
  color: #5d4322;
  font-family: inherit;
  font-size: 0.85rem;
  cursor: pointer;
}

.undo-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.readonly-note {
  margin: 0;
  padding: 10px 14px;
  border-radius: 12px;
  background: #f0e9d8;
  color: #6f5a3c;
  font-size: 0.84rem;
}

.console-grid {
  display: grid;
  grid-template-columns: 0.9fr 1.3fr;
  gap: 18px;
}

.console-col {
  border: 1px solid rgba(79, 57, 32, 0.1);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.62);
  padding: 16px;
}

.col-title {
  margin: 0 0 12px;
  font-size: 0.98rem;
}

.pending-list {
  display: grid;
  gap: 8px;
}

.pending-item {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 6px 10px;
  align-items: center;
  text-align: left;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(79, 57, 32, 0.12);
  background: #fbf5ea;
  font-family: inherit;
  cursor: pointer;
}

.pending-item--active {
  border-color: #5d4322;
  box-shadow: 0 0 0 2px rgba(93, 67, 34, 0.18);
}

.pending-item-main {
  display: grid;
  gap: 2px;
}

.pending-item-main small {
  color: #82684b;
}

.claim-flag {
  grid-column: 1 / -1;
  justify-self: start;
  padding: 3px 9px;
  border-radius: 999px;
  background: #efd0c9;
  color: #913d2f;
  font-size: 0.72rem;
}

.risk-tag {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.74rem;
}

.risk-tag--high {
  background: #efd0c9;
  color: #913d2f;
}

.risk-tag--medium {
  background: #f6e5b9;
  color: #8b6314;
}

.risk-tag--low {
  background: #d9ead9;
  color: #366338;
}

.draft-head {
  display: grid;
  gap: 4px;
  margin-bottom: 12px;
}

.draft-note {
  color: #82684b;
}

.claim-banner,
.resolved-banner {
  padding: 12px 14px;
  border-radius: 14px;
  margin-bottom: 12px;
  font-size: 0.88rem;
}

.claim-banner {
  background: #f8e4dd;
  border: 1px solid rgba(145, 61, 47, 0.28);
  color: #7d382b;
}

.claim-banner p {
  margin: 0;
}

.claim-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.ghost-btn {
  padding: 7px 12px;
  border-radius: 10px;
  border: 1px solid rgba(125, 56, 43, 0.3);
  background: rgba(255, 255, 255, 0.7);
  color: #7d382b;
  font-family: inherit;
  font-size: 0.8rem;
  cursor: pointer;
}

.ghost-btn--danger {
  border-color: rgba(125, 56, 43, 0.45);
}

.resolved-banner {
  background: #e7f0e2;
  border: 1px solid rgba(54, 99, 56, 0.24);
  color: #366338;
}

.link-btn {
  border: none;
  background: none;
  text-decoration: underline;
  color: #366338;
  font-family: inherit;
  cursor: pointer;
  padding: 0 4px;
}

.draft-form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.field {
  display: grid;
  gap: 6px;
}

.field span {
  font-size: 0.76rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #82684b;
}

.field select {
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(79, 57, 32, 0.2);
  background: #fffdf7;
  font-family: inherit;
  color: #2d2418;
}

.field select:disabled {
  opacity: 0.6;
}

.blocker-list {
  margin: 12px 0 0;
  padding-left: 18px;
  display: grid;
  gap: 6px;
  color: #913d2f;
  font-size: 0.86rem;
}

.suggest-box {
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: 14px;
  background: #f4ebda;
}

.suggest-title {
  margin: 0 0 10px;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #7e6038;
}

.suggest-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.suggest-chip {
  display: grid;
  gap: 2px;
  text-align: left;
  padding: 9px 13px;
  border-radius: 12px;
  border: 1px solid rgba(93, 67, 34, 0.22);
  background: #fffdf7;
  font-family: inherit;
  cursor: pointer;
}

.suggest-chip:disabled {
  cursor: default;
  opacity: 0.85;
}

.suggest-chip small {
  color: #6a5439;
}

.draft-footer {
  margin-top: 14px;
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.confirm-btn {
  padding: 11px 22px;
  border-radius: 999px;
  border: none;
  background: #5d4322;
  color: #fff8eb;
  font-family: inherit;
  font-size: 0.9rem;
  cursor: pointer;
}

.confirm-btn:disabled {
  opacity: 0.42;
  cursor: not-allowed;
}

.feedback {
  margin: 0;
  font-size: 0.84rem;
  color: #4d5f35;
}

.empty-note {
  margin: 0;
  color: #82684b;
  font-size: 0.86rem;
}

@media (max-width: 980px) {
  .console-grid,
  .draft-form {
    grid-template-columns: 1fr;
  }
}
</style>
