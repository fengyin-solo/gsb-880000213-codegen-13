import { computed } from 'vue'

import {
  restorationBatches,
  restorationEnvironment,
} from '../data/restorationData'
import { useAssignmentStore } from './useAssignmentStore'

export function useRestorationOverview() {
  const { activeTasks, pendingTasks, state } = useAssignmentStore()

  const batchCount = computed(() => restorationBatches.length)
  const highRiskCount = computed(
    () => state.tasks.filter((item) => item.risk === 'high').length,
  )
  const environmentCount = computed(() => restorationEnvironment.length)
  // 口径与任务清单、分配看板一致：统计当前在办任务的不重复负责人，
  // 待分配任务不计入，历史任务保留原负责人但不占当前负载。
  const ownerCount = computed(
    () => new Set(activeTasks.value.map((item) => item.ownerId)).size,
  )
  const pendingCount = computed(() => pendingTasks.value.length)
  const activeCount = computed(() => activeTasks.value.length)

  return {
    batchCount,
    highRiskCount,
    environmentCount,
    ownerCount,
    pendingCount,
    activeCount,
  }
}
