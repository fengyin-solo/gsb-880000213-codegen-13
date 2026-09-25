import { computed, reactive, ref } from 'vue'

import {
  restorationClaims,
  restorationRestorers,
  restorationTasks,
  restorationUsers,
} from '../data/restorationData'
import { slotLabel } from '../utils/restorationFormatters'

const STORAGE_KEY = 'restoration-allocation-v1'
const HISTORY_LIMIT = 20

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function stamp() {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
}

function seedState() {
  return {
    tasks: clone(restorationTasks),
    claims: clone(restorationClaims),
  }
}

function loadPersisted() {
  const seed = seedState()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return seed
    }

    const saved = JSON.parse(raw)
    if (!Array.isArray(saved.tasks) || !Array.isArray(saved.claims)) {
      return seed
    }

    return { tasks: saved.tasks, claims: saved.claims }
  } catch {
    return seed
  }
}

const persisted = loadPersisted()

// 单例 store：任务清单与工作台共用同一份响应式状态，
// 任何落单 / 撤销结果在两处视图保持一致。
const state = reactive({
  tasks: persisted.tasks,
  claims: persisted.claims,
  currentUserId: restorationUsers[0].id,
})

// 撤销栈只保留最近一次落单前的任务与认领快照（内存态）
const history = ref([])

function persist() {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ tasks: state.tasks, claims: state.claims }),
    )
  } catch {
    // 本地存储不可用时看板仍可在当前会话内使用
  }
}

function restorerById(restorerId) {
  return restorationRestorers.find((item) => item.id === restorerId) ?? null
}

function taskById(taskId) {
  return state.tasks.find((item) => item.id === taskId) ?? null
}

const pendingTasks = computed(() =>
  state.tasks.filter((task) => task.status === 'pending'),
)
const activeTasks = computed(() =>
  state.tasks.filter((task) => task.status === 'active'),
)
const archivedTasks = computed(() =>
  state.tasks.filter((task) => task.status === 'archived'),
)

const currentUser = computed(
  () => restorationUsers.find((user) => user.id === state.currentUserId) ?? restorationUsers[0],
)
const canAssign = computed(() => currentUser.value.role === 'coordinator')

function switchUser(userId) {
  state.currentUserId = userId
}

function resetDemo() {
  const seed = seedState()
  state.tasks = seed.tasks
  state.claims = seed.claims
  history.value = []
  persist()
}

// 每个修复师当前在办量（历史任务不计负载）
const ownerLoads = computed(() =>
  restorationRestorers.map((restorer) => ({
    restorer,
    activeCount: state.tasks.filter(
      (task) => task.status === 'active' && task.ownerId === restorer.id,
    ).length,
  })),
)

function openClaimsForTask(taskId) {
  return state.claims.filter(
    (claim) => claim.taskId === taskId && claim.status === 'open',
  )
}

function slotConflict(taskId, restorerId, slotId) {
  return state.tasks.some(
    (task) =>
      task.id !== taskId &&
      task.status === 'active' &&
      task.ownerId === restorerId &&
      task.slotId === slotId,
  )
}

// 某条待分配任务的可行落单候选：修复师启用、覆盖该时段、且无在办时段冲突
function buildOptions(task) {
  const loadMap = new Map(
    ownerLoads.value.map((entry) => [entry.restorer.id, entry.activeCount]),
  )
  const candidateSlotIds = task.preferredSlotIds?.length
    ? task.preferredSlotIds
    : restorationRestorers.flatMap((restorer) => restorer.slotIds)

  const uniqueSlotIds = [...new Set(candidateSlotIds)]
  const openClaims = openClaimsForTask(task.id)

  const options = []
  for (const restorer of restorationRestorers.filter((item) => item.active)) {
    for (const slotId of uniqueSlotIds) {
      if (!restorer.slotIds.includes(slotId)) {
        continue
      }
      if (slotConflict(task.id, restorer.id, slotId)) {
        continue
      }
      options.push({
        ownerId: restorer.id,
        slotId,
        activeCount: loadMap.get(restorer.id) ?? 0,
        claimIds: openClaims
          .filter(
            (claim) =>
              claim.restorerId === restorer.id && claim.slotId === slotId,
          )
          .map((claim) => claim.id),
      })
    }
  }

  return options.sort(
    (a, b) =>
      b.claimIds.length - a.claimIds.length ||
      a.activeCount - b.activeCount ||
      a.ownerId.localeCompare(b.ownerId),
  )
}

function optionLabel(option) {
  const restorer = restorerById(option.ownerId)
  return `${restorer?.name ?? '未知修复师'} · ${slotLabel(option.slotId)}（在办 ${option.activeCount} 件）`
}

// 落单前校验：停用、时段不覆盖、时段冲突、双认领都以阻断问题返回，
// 并附带可直接回退采用的备选 choice。
function evaluate(taskId, draft) {
  const task = taskById(taskId)
  const issues = []

  if (!task) {
    return { issues: [{ code: 'task_missing', message: '任务不存在。', choices: [] }] }
  }

  const openClaims = openClaimsForTask(taskId)

  if (!draft.ownerId) {
    return {
      issues: [
        {
          code: 'owner_required',
          message: '请先选择修复师，再确认落单。',
          choices: buildOptions(task).slice(0, 3).map((option) => ({
            type: 'option',
            label: optionLabel(option),
            ownerId: option.ownerId,
            slotId: option.slotId,
          })),
        },
      ],
    }
  }

  const restorer = restorerById(draft.ownerId)
  const choices = buildOptions(task)

  if (!restorer || !restorer.active) {
    issues.push({
      code: 'owner_inactive',
      message: `${restorer?.name ?? '该修复师'}已停用，不能承接新任务。`,
      choices: choices.slice(0, 3).map((option) => ({
        type: 'option',
        label: optionLabel(option),
        ownerId: option.ownerId,
        slotId: option.slotId,
      })),
    })
  }

  if (restorer?.active && draft.slotId && !restorer.slotIds.includes(draft.slotId)) {
    const sameOwnerChoices = choices.filter(
      (option) => option.ownerId === restorer.id,
    )
    issues.push({
      code: 'slot_unavailable',
      message: `${restorer.name}在${slotLabel(draft.slotId)}没有可用排班，不能落单。`,
      choices: [
        ...sameOwnerChoices.slice(0, 2).map((option) => ({
          type: 'option',
          label: optionLabel(option),
          ownerId: option.ownerId,
          slotId: option.slotId,
        })),
        ...choices
          .filter((option) => option.ownerId !== restorer.id)
          .slice(0, 2)
          .map((option) => ({
            type: 'option',
            label: optionLabel(option),
            ownerId: option.ownerId,
            slotId: option.slotId,
          })),
      ],
    })
  }

  if (
    restorer?.active &&
    draft.slotId &&
    restorer.slotIds.includes(draft.slotId) &&
    slotConflict(taskId, draft.ownerId, draft.slotId)
  ) {
    issues.push({
      code: 'slot_conflict',
      message: `${restorer.name}在${slotLabel(draft.slotId)}已有在办任务，同一时段不能重复落单。`,
      choices: [
        ...choices
          .filter((option) => option.ownerId === restorer.id)
          .slice(0, 2)
          .map((option) => ({
            type: 'option',
            label: optionLabel(option),
            ownerId: option.ownerId,
            slotId: option.slotId,
          })),
        ...choices
          .filter((option) => option.ownerId !== restorer.id)
          .slice(0, 2)
          .map((option) => ({
            type: 'option',
            label: optionLabel(option),
            ownerId: option.ownerId,
            slotId: option.slotId,
          })),
      ],
    })
  }

  if (openClaims.length >= 2) {
    const claimChoices = openClaims.map((claim) => {
      const claimant = restorerById(claim.restorerId)
      return {
        type: 'adopt',
        claimId: claim.id,
        ownerId: claim.restorerId,
        slotId: claim.slotId,
        label: `采用${claimant?.name ?? '认领人'}的认领（${slotLabel(claim.slotId)}，${claim.createdAt}）`,
      }
    })
    claimChoices.push({
      type: 'reject',
      label: '驳回两人的认领，按当前选择的修复师和时段另行落单',
    })

    if (!draft.resolution) {
      issues.push({
        code: 'double_claim',
        message: `该任务被 ${openClaims.length} 名修复师同时认领，必须先裁定再落单。`,
        choices: claimChoices,
      })
    } else if (draft.resolution.type === 'adopt') {
      const adopted = openClaims.find(
        (claim) => claim.id === draft.resolution.claimId,
      )
      if (
        !adopted ||
        adopted.restorerId !== draft.ownerId ||
        adopted.slotId !== draft.slotId
      ) {
        issues.push({
          code: 'claim_mismatch',
          message: '当前选择与已采用的认领不一致，请重新确认。',
          choices: claimChoices,
        })
      }
    }
  }

  return { issues }
}

// 查看者看到的分配建议：优先在办量最轻的可行候选；
// 双认领任务给出最早认领建议，但仍需协调员裁定。
function suggestionFor(task) {
  const options = buildOptions(task)
  const openClaims = openClaimsForTask(task.id)
  const earliestClaim = [...openClaims].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  )[0]

  return {
    options: options.slice(0, 3),
    openClaims,
    doubleClaim: openClaims.length >= 2,
    earliestClaim,
  }
}

function assign(taskId, draft) {
  if (!canAssign.value) {
    return { ok: false, error: { code: 'no_permission', message: '当前身份只有查看权限，不能改动分配。' } }
  }

  const task = taskById(taskId)
  if (!task) {
    return { ok: false, error: { code: 'task_missing', message: '任务不存在。' } }
  }

  const { issues } = evaluate(taskId, draft)
  if (issues.length > 0) {
    return { ok: false, error: issues[0] }
  }

  const previous = { tasks: clone(state.tasks), claims: clone(state.claims) }

  task.status = 'active'
  task.ownerId = draft.ownerId
  task.slotId = draft.slotId

  const openClaims = openClaimsForTask(taskId)
  const rejectAll = draft.resolution?.type === 'reject'
  for (const claim of openClaims) {
    if (
      !rejectAll &&
      claim.restorerId === draft.ownerId &&
      claim.slotId === draft.slotId
    ) {
      claim.status = 'accepted'
    } else {
      claim.status = 'rejected'
    }
  }

  const restorer = restorerById(draft.ownerId)
  history.value.unshift({
    label: `${task.title} → ${restorer?.name} · ${slotLabel(draft.slotId)}`,
    at: stamp(),
    previous,
  })
  history.value = history.value.slice(0, HISTORY_LIMIT)

  persist()
  return { ok: true }
}

function undoLast() {
  if (!canAssign.value || history.value.length === 0) {
    return false
  }

  const entry = history.value.shift()
  state.tasks = entry.previous.tasks
  state.claims = entry.previous.claims
  persist()
  return true
}

export function useAssignmentStore() {
  return {
    // 静态名册
    restorers: restorationRestorers,
    users: restorationUsers,
    // 状态
    state,
    currentUser,
    canAssign,
    history,
    // 派生集合
    pendingTasks,
    activeTasks,
    archivedTasks,
    ownerLoads,
    // 查询
    restorerById,
    taskById,
    openClaimsForTask,
    suggestionFor,
    evaluate,
    // 操作
    switchUser,
    assign,
    undoLast,
    resetDemo,
  }
}
