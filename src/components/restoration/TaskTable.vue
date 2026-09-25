<script setup>
import { riskMeta, slotLabel, taskStatusMeta } from '../../utils/restorationFormatters'
import { useAssignmentStore } from '../../composables/useAssignmentStore'

const props = defineProps({
  rows: {
    type: Array,
    required: true,
  },
})

const { restorerById } = useAssignmentStore()

function ownerCell(row) {
  if (!row.ownerId) {
    return { name: '待分配', inactive: false, unassigned: true }
  }

  const restorer = restorerById(row.ownerId)
  return {
    name: restorer?.name ?? row.ownerId,
    inactive: restorer ? !restorer.active : false,
    unassigned: false,
  }
}
</script>

<template>
  <div class="task-table">
    <div class="task-row task-head">
      <span>对象</span>
      <span>阶段</span>
      <span>状态</span>
      <span>风险</span>
      <span>负责人</span>
      <span>时段</span>
      <span>说明</span>
    </div>
    <div v-for="row in props.rows" :key="row.id" class="task-row">
      <span>{{ row.title }}</span>
      <span>{{ row.stage }}</span>
      <span :class="['status-tag', `status-tag--${taskStatusMeta(row.status).tone}`]">
        {{ taskStatusMeta(row.status).label }}
      </span>
      <span :class="['risk-tag', `risk-tag--${riskMeta(row.risk).tone}`]">
        {{ riskMeta(row.risk).label }}
      </span>
      <span class="owner-cell">
        {{ ownerCell(row).name }}
        <em v-if="ownerCell(row).inactive" class="owner-flag">已停用 · 历史留档</em>
        <em v-else-if="ownerCell(row).unassigned" class="owner-flag owner-flag--pending">等待落单</em>
      </span>
      <span>{{ slotLabel(row.slotId) }}</span>
      <span>{{ row.note }}</span>
    </div>
  </div>
</template>

<style scoped>
.task-table {
  overflow: hidden;
  border: 1px solid rgba(79, 57, 32, 0.1);
  border-radius: 18px;
}

.task-row {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr 0.6fr 0.5fr 0.9fr 0.7fr 1.3fr;
  gap: 12px;
  align-items: center;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.72);
}

.task-row + .task-row {
  border-top: 1px solid rgba(79, 57, 32, 0.08);
}

.task-head {
  background: #efe1c6;
  color: #775936;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.76rem;
}

.owner-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.owner-flag {
  font-style: normal;
  font-size: 0.72rem;
  color: #9a7a55;
}

.owner-flag--pending {
  color: #a35a2a;
}

.risk-tag,
.status-tag {
  display: inline-flex;
  justify-content: center;
  width: fit-content;
  padding: 6px 10px;
  border-radius: 999px;
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

.status-tag--pending {
  background: #f4dfca;
  color: #9a5520;
}

.status-tag--active {
  background: #dde7f3;
  color: #34507a;
}

.status-tag--archived {
  background: #e7e0d3;
  color: #6f6049;
}

@media (max-width: 900px) {
  .task-table {
    overflow-x: auto;
  }

  .task-row {
    min-width: 920px;
  }
}
</style>
