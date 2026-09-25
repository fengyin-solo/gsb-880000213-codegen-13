<script setup>
import PanelSection from '../components/common/PanelSection.vue'
import RoleSwitcher from '../components/restoration/RoleSwitcher.vue'
import RestorerLoadGrid from '../components/restoration/RestorerLoadGrid.vue'
import PendingAssignmentCard from '../components/restoration/PendingAssignmentCard.vue'
import AssignmentBoardList from '../components/restoration/AssignmentBoardList.vue'
import { useAssignmentStore } from '../composables/useAssignmentStore'

const {
  pendingTasks,
  activeTasks,
  archivedTasks,
  history,
  canAssign,
  undoLast,
  resetDemo,
} = useAssignmentStore()
</script>

<template>
  <div class="view-stack">
    <RoleSwitcher />

    <PanelSection title="待分配任务" :badge="`${pendingTasks.length} 件待落单`">
      <div class="pending-grid">
        <PendingAssignmentCard
          v-for="task in pendingTasks"
          :key="task.id"
          :task="task"
        />
        <p v-if="pendingTasks.length === 0" class="all-clear">
          待分配任务已全部落单，可在下方查看在办归属，或撤销最近一次分配。
        </p>
      </div>
    </PanelSection>

    <PanelSection title="修复师负载与可用时段" badge="集中查看">
      <RestorerLoadGrid />
    </PanelSection>

    <div class="board-columns">
      <PanelSection title="当前在办" :badge="`${activeTasks.length} 件`">
        <AssignmentBoardList :tasks="activeTasks" />
      </PanelSection>

      <PanelSection title="历史任务" badge="原负责人留档">
        <AssignmentBoardList :tasks="archivedTasks" archived />
      </PanelSection>
    </div>

    <PanelSection title="分配记录" badge="可回退">
      <div class="history-bar">
        <button
          type="button"
          class="ghost-btn"
          :disabled="!canAssign || history.length === 0"
          @click="undoLast"
        >
          撤销最近一次落单
        </button>
        <button type="button" class="ghost-btn ghost-btn--muted" @click="resetDemo">
          重置演示数据
        </button>
        <p v-if="!canAssign" class="history-note">只读身份不能撤销分配。</p>
      </div>
      <ol v-if="history.length" class="history-list">
        <li v-for="entry in history" :key="`${entry.at}-${entry.label}`">
          <span class="history-at">{{ entry.at }}</span>
          <span>{{ entry.label }}</span>
        </li>
      </ol>
      <p v-else class="history-note">本会话内尚无新的落单记录。</p>
    </PanelSection>
  </div>
</template>

<style scoped>
.view-stack {
  display: grid;
  gap: 24px;
}

.pending-grid {
  display: grid;
  gap: 14px;
}

.all-clear {
  margin: 0;
  padding: 20px;
  text-align: center;
  color: #366338;
  background: rgba(217, 234, 217, 0.5);
  border-radius: 16px;
  font-size: 0.9rem;
}

.board-columns {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 24px;
}

.history-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.ghost-btn {
  padding: 9px 16px;
  border-radius: 10px;
  border: 1px solid rgba(145, 61, 47, 0.45);
  background: #fff8eb;
  color: #913d2f;
  font-family: inherit;
  font-size: 0.86rem;
  cursor: pointer;
}

.ghost-btn:disabled {
  opacity: 0.45;
  cursor: default;
}

.ghost-btn--muted {
  border-color: rgba(79, 57, 32, 0.3);
  color: #6f5d44;
}

.history-note {
  margin: 0;
  font-size: 0.82rem;
  color: #82684b;
}

.history-list {
  list-style: none;
  margin: 14px 0 0;
  padding: 0;
  display: grid;
  gap: 8px;
}

.history-list li {
  display: flex;
  gap: 12px;
  font-size: 0.86rem;
  color: #5c4a33;
}

.history-at {
  color: #8a7456;
  font-size: 0.8rem;
  min-width: 96px;
}

@media (max-width: 980px) {
  .board-columns {
    grid-template-columns: 1fr;
  }
}
</style>
