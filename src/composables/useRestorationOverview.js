import { computed } from 'vue'

import {
  restorationBatches,
  restorationEnvironment,
} from '../data/restorationData'
import { useAssignmentStore } from './useAssignmentStore'

// 统计与任务清单共用同一个分配 store，保证两处数字、归属一致。
export function useRestorationOverview() {
  const { highRiskCount, activeOwnerCount, pendingCount, activeCount } =
    useAssignmentStore()

  const batchCount = computed(() => restorationBatches.length)
  const environmentCount = computed(() => restorationEnvironment.length)

  return {
    batchCount,
    environmentCount,
    highRiskCount,
    ownerCount: activeOwnerCount,
    pendingCount,
    activeCount,
  }
}
