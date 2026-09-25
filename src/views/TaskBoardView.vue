<script setup>
import { computed } from 'vue'
import PanelSection from '../components/common/PanelSection.vue'
import TaskTable from '../components/restoration/TaskTable.vue'
import { useAssignmentStore } from '../composables/useAssignmentStore'

const { state, ownerLoads, archivedTasks, pendingTasks, activeTasks } =
  useAssignmentStore()

const riskOrder = { high: 0, medium: 1, low: 2 }
const statusOrder = { pending: 0, active: 1, archived: 2 }

// 待分配集中置顶，其后在办，历史任务沉底
const orderedTasks = computed(() =>
  [...state.tasks].sort(
    (a, b) =>
      statusOrder[a.status] - statusOrder[b.status] ||
      riskOrder[a.risk] - riskOrder[b.risk] ||
      a.id.localeCompare(b.id),
  ),
)

const loadSummary = computed(() =>
  ownerLoads.value
    .filter((entry) => entry.activeCount > 0)
    .map((entry) => ({
      id: entry.restorer.id,
      name: entry.restorer.name,
      count: entry.activeCount,
    })),
)
</script>

<template>
  <div class="view-stack">
    <PanelSection title="负责人负载概览" badge="与工作台同源">
      <div class="load-strip">
        <div class="load-chip load-chip--pending">
          <strong>{{ pendingTasks.length }}</strong>
          <span>待分配</span>
        </div>
        <div
          v-for="item in loadSummary"
          :key="item.id"
          class="load-chip"
        >
          <strong>{{ item.count }}</strong>
          <span>{{ item.name }} · 在办</span>
        </div>
        <div class="load-note">
          在办 {{ activeTasks.length }} 件 ·
          在办负责人 {{ loadSummary.length }} 人 ·
          历史归档 {{ archivedTasks.length }} 件保留原负责人
        </div>
      </div>
    </PanelSection>

    <PanelSection title="任务清单" badge="待分配优先 · 按风险排序">
      <TaskTable :rows="orderedTasks" />
    </PanelSection>
  </div>
</template>

<style scoped>
.view-stack {
  display: grid;
  gap: 24px;
}

.load-strip {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.load-chip {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  padding: 9px 14px;
  border-radius: 999px;
  background: rgba(221, 231, 243, 0.7);
  color: #34507a;
}

.load-chip--pending {
  background: #f4dfca;
  color: #9a5520;
}

.load-chip strong {
  font-size: 1.15rem;
}

.load-chip span {
  font-size: 0.85rem;
}

.load-note {
  width: 100%;
  margin-top: 4px;
  font-size: 0.82rem;
  color: #82684b;
}
</style>
