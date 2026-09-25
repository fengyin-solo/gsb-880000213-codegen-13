import { computed, ref } from 'vue'

import {
  restorationAssignableTasks,
  restorationRestorers,
  restorationSlots,
} from '../data/restorationData'

// 模块级单例：任务清单（/tasks）与工作台（/）共用同一份响应式状态，
// 任何一处落单或回退后，两处的负责人统计与任务归属保持一致。
const tasks = ref(clone(restorationAssignableTasks))
const restorers = clone(restorationRestorers)
const slots = clone(restorationSlots)

// assigner 具备分配权限；viewer 只能查看建议，不能改动。
const role = ref('viewer')

// 最近一次可回退的操作：{ label, undo() }
const lastAction = ref(null)
let undoStack = []

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function findTask(taskId) {
  return tasks.value.find((item) => item.id === taskId) ?? null
}

export function useAssignmentStore() {
  // ---- 基础查询 -----------------------------------------------------------

  const slotLabel = (slotId) =>
    slots.find((item) => item.id === slotId)?.label ?? '—'

  const restorerById = (restorerId) =>
    restorers.find((item) => item.id === restorerId) ?? null

  const restorerName = (restorerId) =>
    restorerById(restorerId)?.name ?? '待分配'

  // 任务展示用的负责人：历史任务永远取 originalOwnerId，不受负责人停用影响。
  const taskOwnerName = (task) => {
    if (task.status === 'archived') {
      return task.originalOwnerId ? restorerName(task.originalOwnerId) : '—'
    }
    return task.ownerId ? restorerName(task.ownerId) : '待分配'
  }

  const taskSlotLabel = (task) =>
    task.status === 'active' && task.slotId ? slotLabel(task.slotId) : '—'

  // ---- 派生列表 -----------------------------------------------------------

  const pendingTasks = computed(() =>
    tasks.value
      .filter((item) => item.status === 'pending')
      .sort(
        (a, b) => a.claims.length < b.claims.length
          ? 1
          : a.claims.length > b.claims.length
            ? -1
            : 0,
      ),
  )

  const activeTasks = computed(() =>
    tasks.value.filter((item) => item.status === 'active'),
  )

  const archivedTasks = computed(() =>
    tasks.value.filter((item) => item.status === 'archived'),
  )

  // 清单视图：待分配 → 在办中 → 历史，同组内按风险排序。
  const boardTasks = computed(() => {
    const groupRank = { pending: 0, active: 1, archived: 2 }
    const riskRank = { high: 0, medium: 1, low: 2 }
    return [...tasks.value].sort((a, b) => {
      if (groupRank[a.status] !== groupRank[b.status]) {
        return groupRank[a.status] - groupRank[b.status]
      }
      return riskRank[a.risk] - riskRank[b.risk]
    })
  })

  // 某修复师在该时段是否已被在办任务占用。
  function slotOccupiedBy(restorerId, slotId, excludeTaskId = null) {
    return activeTasks.value.some(
      (item) =>
        item.id !== excludeTaskId &&
        item.ownerId === restorerId &&
        item.slotId === slotId,
    )
  }

  // 每个修复师的当前在办量与负载情况。
  const ownerLoads = computed(() =>
    restorers.map((restorer) => {
      const activeCount = activeTasks.value.filter(
        (item) => item.ownerId === restorer.id,
      ).length
      const activeTaskIds = activeTasks.value
        .filter((item) => item.ownerId === restorer.id)
        .map((item) => item.id)
      const occupiedSlotIds = activeTasks.value
        .filter((item) => item.ownerId === restorer.id)
        .map((item) => item.slotId)
      return {
        ...restorer,
        activeCount,
        remaining: Math.max(0, restorer.capacity - activeCount),
        overloaded: activeCount >= restorer.capacity,
        activeTaskIds,
        occupiedSlotIds,
      }
    }),
  )

  // ---- 统计（两处视图统一来源） -------------------------------------------

  const pendingCount = computed(() => pendingTasks.value.length)
  const activeCount = computed(() => activeTasks.value.length)
  const highRiskCount = computed(
    () => tasks.value.filter((item) => item.risk === 'high').length,
  )
  const activeOwnerCount = computed(
    () =>
      new Set(
        activeTasks.value
          .map((item) => item.ownerId)
          .filter((ownerId) => ownerId),
      ).size,
  )

  // ---- 分配建议（查看者可见，不可改动） -----------------------------------

  // 给某修复师挑一个仍空闲的可用时段，没有则返回 null。
  function firstFreeSlot(restorer, excludeTaskId = null) {
    return (
      restorer.availableSlots.find(
        (slotId) => !slotOccupiedBy(restorer.id, slotId, excludeTaskId),
      ) ?? null
    )
  }

  // 为单个待分配任务生成建议候选：在职、有负载余量，按在办量升序。
  // 已被两人同时认领的任务不自动推荐，必须先裁定认领冲突。
  function suggestionsForTask(task) {
    if (task.status !== 'pending' || task.claims.length >= 2) {
      return []
    }
    return ownerLoads.value
      .filter(
        (load) =>
          load.active &&
          !load.overloaded &&
          firstFreeSlot(load, task.id) !== null,
      )
      .sort((a, b) => a.activeCount - b.activeCount)
      .map((load) => ({
        restorerId: load.id,
        restorerName: load.name,
        activeCount: load.activeCount,
        slotId: firstFreeSlot(load, task.id),
      }))
  }

  // ---- 落单前校验：返回阻断原因列表与可回退的候选方案 ---------------------

  function assessAssignment(taskId, { ownerId, slotId, claimResolved = false }) {
    const task = findTask(taskId)
    const blockers = []

    if (!task) {
      return { ok: false, blockers: [{ code: 'missing', message: '任务不存在。' }], options: [] }
    }
    if (task.status === 'archived') {
      blockers.push({
        code: 'archived',
        message: '该任务为历史任务，负责人已封存，不允许重新分配。',
      })
    }
    if (task.status !== 'pending') {
      blockers.push({
        code: 'not-pending',
        message: '仅待分配任务可以落单，在办任务无需重复分配。',
      })
    }
    if (task.claims.length >= 2 && !claimResolved) {
      blockers.push({
        code: 'double-claim',
        message:
          `该任务被 ${task.claims
            .map((id) => restorerName(id))
            .join('、')} 同时认领，须先裁定归属，不能直接落单。`,
      })
    }
    if (!ownerId) {
      blockers.push({ code: 'no-owner', message: '尚未选择负责人。' })
    }
    if (!slotId) {
      blockers.push({ code: 'no-slot', message: '尚未选择修复时段。' })
    }

    const owner = ownerId ? restorerById(ownerId) : null
    if (ownerId && !owner) {
      blockers.push({ code: 'owner-invalid', message: '所选负责人不存在。' })
    }
    if (owner && !owner.active) {
      blockers.push({
        code: 'owner-inactive',
        message: `负责人 ${owner.name} 已停用，不得承接新任务。`,
      })
    }
    if (owner && owner.active) {
      const load = ownerLoads.value.find((item) => item.id === owner.id)
      if (load?.overloaded) {
        blockers.push({
          code: 'owner-overloaded',
          message: `${owner.name} 当前在办量已达上限（${load.activeCount}/${owner.capacity}）。`,
        })
      }
      if (slotId && !owner.availableSlots.includes(slotId)) {
        blockers.push({
          code: 'slot-unavailable',
          message: `${slotLabel(slotId)} 不在 ${owner.name} 的可用时段内。`,
        })
      }
      if (
        slotId &&
        owner.availableSlots.includes(slotId) &&
        slotOccupiedBy(ownerId, slotId, taskId)
      ) {
        blockers.push({
          code: 'slot-conflict',
          message: `${owner.name} 在 ${slotLabel(slotId)} 已有在办任务，时段冲突。`,
        })
      }
    }

    // 可回退的选择：改派给在职、有空闲时段且有余量的修复师。
    const fallbackOptions = suggestionsForTask(task)

    return {
      ok: blockers.length === 0,
      blockers,
      options: fallbackOptions,
    }
  }

  // ---- 变更操作（均带权限校验；落单 / 裁定可一键回退） --------------------

  function pushUndo(label, undo) {
    undoStack.push({ label, undo })
    if (undoStack.length > 20) undoStack.shift()
    lastAction.value = { label, canUndo: true }
  }

  function requireAssigner() {
    if (role.value !== 'assigner') {
      throw new Error('当前为查看者身份，仅具备分配权限的人员可以改动。')
    }
  }

  // 落单：通过全部校验后任务进入在办中。
  function assignTask(taskId, payload) {
    requireAssigner()
    const task = findTask(taskId)
    if (!task) return { ok: false, blockers: [], options: [] }

    const assessment = assessAssignment(taskId, payload)
    if (!assessment.ok) {
      return assessment
    }

    const previous = {
      status: task.status,
      ownerId: task.ownerId,
      slotId: task.slotId,
      claims: clone(task.claims),
    }

    task.status = 'active'
    task.ownerId = payload.ownerId
    task.slotId = payload.slotId
    task.claims = []

    pushUndo(`撤回对「${task.title}」的分配`, () => {
      task.status = previous.status
      task.ownerId = previous.ownerId
      task.slotId = previous.slotId
      task.claims = previous.claims
    })

    return { ok: true, blockers: [], options: [] }
  }

  // 裁定同时认领：采用某位认领人（其余认领释放），随后仍需选定时段落单；
  // 或直接释放全部认领，改按建议分配。两种选择都可回退。
  function resolveClaims(taskId, { keepClaimId = null } = {}) {
    requireAssigner()
    const task = findTask(taskId)
    if (!task || task.claims.length < 2) return

    const previousClaims = clone(task.claims)
    task.claims = keepClaimId ? [keepClaimId] : []

    const keptName = keepClaimId ? restorerName(keepClaimId) : null
    pushUndo(
      keptName
        ? `恢复「${task.title}」的两人同时认领状态`
        : `撤销「${task.title}」的认领释放`,
      () => {
        task.claims = previousClaims
      },
    )
  }

  function undoLast() {
    requireAssigner()
    const action = undoStack.pop()
    if (!action) return
    action.undo()
    lastAction.value = undoStack.length
      ? { label: undoStack[undoStack.length - 1].label, canUndo: true }
      : null
  }

  function setRole(next) {
    role.value = next === 'assigner' ? 'assigner' : 'viewer'
  }

  return {
    // 状态
    role,
    lastAction,
    restorers,
    slots,
    // 派生
    tasks,
    pendingTasks,
    activeTasks,
    archivedTasks,
    boardTasks,
    ownerLoads,
    pendingCount,
    activeCount,
    highRiskCount,
    activeOwnerCount,
    // 查询
    slotLabel,
    restorerById,
    restorerName,
    taskOwnerName,
    taskSlotLabel,
    slotOccupiedBy,
    suggestionsForTask,
    assessAssignment,
    // 操作
    assignTask,
    resolveClaims,
    undoLast,
    setRole,
  }
}
