<script setup>
import { computed, reactive } from 'vue'
import {
  restorationSlots,
} from '../../data/restorationData'
import {
  riskMeta,
  slotLabel,
  slotLabelByIds,
} from '../../utils/restorationFormatters'
import { useAssignmentStore } from '../../composables/useAssignmentStore'

const props = defineProps({
  task: {
    type: Object,
    required: true,
  },
})

const {
  restorers,
  canAssign,
  assign,
  suggestionFor,
  restorerById,
  openClaimsForTask,
} = useAssignmentStore()

const suggestion = computed(() => suggestionFor(props.task))
const openClaims = computed(() => openClaimsForTask(props.task.id))

function initialDraft() {
  if (suggestion.value.earliestClaim) {
    const claim = suggestion.value.earliestClaim
    return { ownerId: claim.restorerId, slotId: claim.slotId, resolution: null }
  }

  const first = suggestion.value.options[0]
  return {
    ownerId: first?.ownerId ?? '',
    slotId: first?.slotId ?? '',
    resolution: null,
  }
}

const draft = reactive(initialDraft())
const errorBox = reactive({ issue: null })

function isPreferred(slotId) {
  return props.task.preferredSlotIds.includes(slotId)
}

const selectableSlots = computed(() => {
  const preferred = restorationSlots.filter((slot) =>
    props.task.preferredSlotIds.includes(slot.id),
  )
  const rest = restorationSlots.filter(
    (slot) => !props.task.preferredSlotIds.includes(slot.id),
  )
  return [
    ...preferred.map((slot) => ({ ...slot, preferred: true })),
    ...rest.map((slot) => ({ ...slot, preferred: false })),
  ]
})

function adoptClaim(claim) {
  draft.ownerId = claim.restorerId
  draft.slotId = claim.slotId
  draft.resolution = { type: 'adopt', claimId: claim.id }
  errorBox.issue = null
}

function rejectClaims() {
  draft.resolution = { type: 'reject' }
  errorBox.issue = null
}

function clearIssue() {
  errorBox.issue = null
}

function applyChoice(choice) {
  if (choice.type === 'adopt') {
    const claim = openClaims.value.find((item) => item.id === choice.claimId)
    if (claim) {
      adoptClaim(claim)
    }
    return
  }

  if (choice.type === 'reject') {
    rejectClaims()
    return
  }

  draft.ownerId = choice.ownerId
  draft.slotId = choice.slotId
  // 手动选择备选后，若任务存在双认领，需要协调员重新确认裁定方式
  draft.resolution = null
  errorBox.issue = null
}

function confirmAssign() {
  if (!canAssign.value) {
    return
  }

  const result = assign(props.task.id, {
    ownerId: draft.ownerId || null,
    slotId: draft.slotId || null,
    resolution: draft.resolution,
  })

  if (!result.ok) {
    errorBox.issue = result.error
  }
}

const risk = computed(() => riskMeta(props.task.risk))
</script>

<template>
  <article class="assign-card">
    <header class="assign-head">
      <div>
        <div class="assign-title-row">
          <h4>{{ task.title }}</h4>
          <span :class="['risk-tag', `risk-tag--${risk.tone}`]">{{ risk.label }}风险</span>
        </div>
        <p class="assign-stage">{{ task.stage }} · {{ task.note }}</p>
      </div>
      <span v-if="task.preferredSlotIds.length" class="prefer-pill">
        期望 {{ slotLabelByIds(task.preferredSlotIds) }}
      </span>
    </header>

    <div v-if="openClaims.length" class="claim-box" :class="{ 'claim-box--double': openClaims.length >= 2 }">
      <p class="claim-title">
        {{ openClaims.length >= 2 ? '⚠ 双认领冲突：同一任务被两人同时认领，落单前必须裁定' : '已有 1 人认领' }}
      </p>
      <ul class="claim-list">
        <li v-for="claim in openClaims" :key="claim.id">
          <label class="claim-item">
            <input
              type="radio"
              :name="`claim-${task.id}`"
              :checked="draft.resolution?.type === 'adopt' && draft.resolution.claimId === claim.id"
              :disabled="!canAssign"
              @change="adoptClaim(claim)"
            />
            <span>
              <strong>{{ restorerById(claim.restorerId)?.name ?? '未知' }}</strong>
              认领 {{ slotLabel(claim.slotId) }}
              <em>{{ claim.createdAt }} 提交</em>
            </span>
          </label>
        </li>
      </ul>
      <label v-if="openClaims.length >= 2" class="claim-reject">
        <input
          type="radio"
          :name="`claim-${task.id}`"
          :checked="draft.resolution?.type === 'reject'"
          :disabled="!canAssign"
          @change="rejectClaims"
        />
        <span>驳回两人的认领，按下方选择另行落单</span>
      </label>
    </div>

    <div v-if="canAssign" class="assign-form">
      <label class="field">
        <span>修复师</span>
        <select v-model="draft.ownerId" @change="clearIssue">
          <option value="" disabled>请选择修复师</option>
          <option v-for="person in restorers" :key="person.id" :value="person.id">
            {{ person.name }}{{ person.active ? '' : '（已停用）' }}
          </option>
        </select>
      </label>
      <label class="field">
        <span>排期时段</span>
        <select v-model="draft.slotId" @change="clearIssue">
          <option value="" disabled>请选择时段</option>
          <option v-for="slot in selectableSlots" :key="slot.id" :value="slot.id">
            {{ slot.label }}{{ slot.preferred ? ' · 任务期望' : '' }}
          </option>
        </select>
      </label>
      <button type="button" class="confirm-btn" @click="confirmAssign">
        确认落单
      </button>
    </div>

    <div v-else class="readonly-hint">
      <span class="lock-badge">只读</span>
      当前身份仅可查看建议，无法落单或裁定认领。
    </div>

    <div class="suggest-row">
      <span class="suggest-label">系统建议</span>
      <template v-if="suggestion.options.length">
        <button
          v-for="(option, index) in suggestion.options"
          :key="`${option.ownerId}-${option.slotId}`"
          type="button"
          class="suggest-chip"
          :disabled="!canAssign"
          :title="canAssign ? '采用此建议' : '只读身份不能采用建议'"
          @click="applyChoice({ type: 'option', ownerId: option.ownerId, slotId: option.slotId })"
        >
          {{ restorerById(option.ownerId)?.name }} · {{ slotLabel(option.slotId) }}
          <small>在办 {{ option.activeCount }} 件{{ index === 0 ? ' · 首选' : '' }}</small>
        </button>
      </template>
      <span v-else class="suggest-empty">当前没有无冲突的可行组合，请先释放冲突时段</span>
    </div>

    <div v-if="errorBox.issue" class="issue-box" role="alert">
      <p class="issue-message">✕ {{ errorBox.issue.message }}</p>
      <div v-if="errorBox.issue.choices?.length" class="issue-choices">
        <span>可回退选择：</span>
        <button
          v-for="(choice, index) in errorBox.issue.choices"
          :key="`${choice.type}-${choice.claimId ?? ''}-${choice.ownerId ?? ''}-${choice.slotId ?? ''}-${index}`"
          type="button"
          class="choice-btn"
          @click="applyChoice(choice)"
        >
          {{ choice.label }}
        </button>
      </div>
    </div>
  </article>
</template>

<style scoped>
.assign-card {
  display: grid;
  gap: 14px;
  padding: 18px;
  border-radius: 18px;
  border: 1px solid rgba(79, 57, 32, 0.12);
  background: rgba(255, 255, 255, 0.78);
}

.assign-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.assign-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

h4 {
  margin: 0;
  font-size: 1.05rem;
}

.assign-stage {
  margin: 6px 0 0;
  font-size: 0.84rem;
  color: #6f5d44;
}

.prefer-pill {
  padding: 5px 11px;
  border-radius: 999px;
  background: #efe2ca;
  color: #7e6038;
  font-size: 0.76rem;
  white-space: nowrap;
}

.risk-tag {
  display: inline-flex;
  padding: 3px 10px;
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

.claim-box {
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(221, 231, 243, 0.55);
  border: 1px solid rgba(52, 80, 122, 0.18);
}

.claim-box--double {
  background: rgba(239, 208, 201, 0.55);
  border-color: rgba(145, 61, 47, 0.35);
}

.claim-title {
  margin: 0 0 8px;
  font-size: 0.86rem;
  color: #4a3417;
  font-weight: 700;
}

.claim-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 6px;
}

.claim-item,
.claim-reject {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.86rem;
  cursor: pointer;
}

.claim-item em {
  font-style: normal;
  color: #8a7456;
  font-size: 0.78rem;
  margin-left: 6px;
}

.claim-reject {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed rgba(79, 57, 32, 0.2);
  font-size: 0.84rem;
}

.assign-form {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 10px;
  align-items: end;
}

.field {
  display: grid;
  gap: 5px;
  font-size: 0.8rem;
  color: #6f5d44;
}

.field select {
  padding: 9px 11px;
  border-radius: 10px;
  border: 1px solid rgba(79, 57, 32, 0.22);
  background: #fffdf8;
  color: #2d2418;
  font-family: inherit;
  font-size: 0.88rem;
}

.confirm-btn {
  padding: 10px 20px;
  border-radius: 10px;
  border: none;
  background: #5d4322;
  color: #fff8eb;
  font-family: inherit;
  font-size: 0.9rem;
  cursor: pointer;
}

.confirm-btn:hover {
  background: #4a3417;
}

.readonly-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px 14px;
  border-radius: 12px;
  background: rgba(231, 224, 211, 0.7);
  color: #6f6049;
  font-size: 0.85rem;
}

.lock-badge {
  padding: 2px 9px;
  border-radius: 999px;
  background: #b7a486;
  color: #fff8eb;
  font-size: 0.72rem;
}

.suggest-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.suggest-label {
  font-size: 0.76rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #8a7456;
}

.suggest-chip {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  padding: 7px 12px;
  border-radius: 999px;
  border: 1px solid rgba(54, 99, 56, 0.3);
  background: rgba(217, 234, 217, 0.7);
  color: #366338;
  font-family: inherit;
  font-size: 0.83rem;
  cursor: pointer;
}

.suggest-chip small {
  font-size: 0.72rem;
  opacity: 0.8;
}

.suggest-chip:disabled {
  cursor: default;
  opacity: 0.85;
}

.suggest-empty {
  font-size: 0.82rem;
  color: #913d2f;
}

.issue-box {
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(239, 208, 201, 0.7);
  border: 1px solid rgba(145, 61, 47, 0.4);
}

.issue-message {
  margin: 0 0 8px;
  font-size: 0.86rem;
  font-weight: 700;
  color: #913d2f;
}

.issue-choices {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: #6f3a2d;
}

.choice-btn {
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid rgba(145, 61, 47, 0.4);
  background: #fff8eb;
  color: #913d2f;
  font-family: inherit;
  font-size: 0.8rem;
  cursor: pointer;
}

.choice-btn:hover {
  background: #f6e8d4;
}

@media (max-width: 900px) {
  .assign-form {
    grid-template-columns: 1fr;
  }
}
</style>
