<script setup>
import { computed } from 'vue'

import {
  riskMeta,
  taskStatusMeta,
} from '../../utils/restorationFormatters'
import { useAssignmentStore } from '../../composables/useAssignmentStore'

const props = defineProps({
  rows: {
    type: Array,
    required: true,
  },
})

const { taskOwnerName, taskSlotLabel } = useAssignmentStore()

// 统一在共享 store 上解析负责人 / 时段，保证与工作台完全一致。
const enrichedRows = computed(() =>
  props.rows.map((row) => ({
    ...row,
    ownerLabel: taskOwnerName(row),
    slotLabel: taskSlotLabel(row),
    statusMeta: taskStatusMeta(row.status),
  })),
)
</script>

<template>
  <div class="task-table">
    <div class="task-row task-head">
      <span>对象</span>
      <span>阶段</span>
      <span>状态</span>
      <span>风险</span>
      <span>负责人</span>
      <span>负责时段</span>
      <span>说明</span>
    </div>
    <div v-for="row in enrichedRows" :key="row.id" class="task-row">
      <span>{{ row.title }}</span>
      <span>{{ row.stage }}</span>
      <span :class="['status-tag', `status-tag--${row.statusMeta.tone}`]">
        {{ row.statusMeta.label }}
      </span>
      <span :class="['risk-tag', `risk-tag--${riskMeta(row.risk).tone}`]">
        {{ riskMeta(row.risk).label }}
      </span>
      <span>
        {{ row.ownerLabel }}
        <small v-if="row.status === 'archived'" class="owner-hint">（原负责人，已封存）</small>
      </span>
      <span>{{ row.slotLabel }}</span>
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
  grid-template-columns: 1.2fr 0.7fr 0.6fr 0.5fr 0.9fr 0.8fr 1.3fr;
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
  background: #e8e0cf;
  color: #6a5439;
}

.status-tag--active {
  background: #dce8f0;
  color: #315870;
}

.status-tag--archived {
  background: #ece4db;
  color: #7c6a55;
}

.owner-hint {
  color: #82684b;
  font-size: 0.74rem;
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
