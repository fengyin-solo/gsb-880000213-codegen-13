<script setup>
import { riskMeta, slotLabel, taskStatusMeta } from '../../utils/restorationFormatters'
import { useAssignmentStore } from '../../composables/useAssignmentStore'

defineProps({
  tasks: {
    type: Array,
    required: true,
  },
  archived: {
    type: Boolean,
    default: false,
  },
})

const { restorerById } = useAssignmentStore()
</script>

<template>
  <div class="board-list">
    <article v-for="task in tasks" :key="task.id" class="board-item">
      <div class="item-main">
        <span :class="['status-tag', `status-tag--${taskStatusMeta(task.status).tone}`]">
          {{ taskStatusMeta(task.status).label }}
        </span>
        <strong class="item-title">{{ task.title }}</strong>
        <span class="item-stage">{{ task.stage }}</span>
        <span :class="['risk-tag', `risk-tag--${riskMeta(task.risk).tone}`]">
          {{ riskMeta(task.risk).label }}
        </span>
      </div>
      <div class="item-side">
        <span class="item-owner">
          {{ restorerById(task.ownerId)?.name ?? '未分配' }}
          <em v-if="archived && restorerById(task.ownerId) && !restorerById(task.ownerId).active">
            （已停用，历史留档）
          </em>
        </span>
        <span class="item-slot">{{ slotLabel(task.slotId) }}</span>
      </div>
    </article>
    <p v-if="tasks.length === 0" class="board-empty">暂无任务</p>
  </div>
</template>

<style scoped>
.board-list {
  display: grid;
  gap: 10px;
}

.board-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  padding: 12px 15px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(79, 57, 32, 0.1);
}

.item-main {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.item-title {
  font-size: 0.95rem;
}

.item-stage {
  font-size: 0.82rem;
  color: #82684b;
}

.item-side {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 0.86rem;
  color: #5c4a33;
}

.item-owner em {
  font-style: normal;
  color: #9a7a55;
  font-size: 0.78rem;
}

.status-tag,
.risk-tag {
  display: inline-flex;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.72rem;
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

.board-empty {
  margin: 0;
  padding: 14px;
  text-align: center;
  color: #8a7456;
  font-size: 0.86rem;
}
</style>
