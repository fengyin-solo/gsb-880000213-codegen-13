<script setup>
import PanelSection from '../components/common/PanelSection.vue'
import TaskTable from '../components/restoration/TaskTable.vue'
import AssignmentConsole from '../components/restoration/AssignmentConsole.vue'
import OwnerLoadList from '../components/restoration/OwnerLoadList.vue'
import { useAssignmentStore } from '../composables/useAssignmentStore'

const { boardTasks, ownerLoads, slots } = useAssignmentStore()
</script>

<template>
  <div class="view-stack">
    <PanelSection title="负责人负载分配" badge="受控操作">
      <AssignmentConsole />
    </PanelSection>

    <PanelSection title="修复师当前负载与可用时段" badge="在办量实时同步">
      <OwnerLoadList :loads="ownerLoads" :slots="slots" />
    </PanelSection>

    <PanelSection title="任务清单" badge="待分配 · 在办 · 历史">
      <TaskTable :rows="boardTasks" />
    </PanelSection>
  </div>
</template>

<style scoped>
.view-stack {
  display: grid;
  gap: 24px;
}
</style>
