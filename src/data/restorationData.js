export const restorationNavigation = [
  { label: '修复总览', to: '/' },
  { label: '批次档案', to: '/batches' },
  { label: '任务清单', to: '/tasks' },
]

export const restorationHero = {
  title: '古籍虫蛀修复批次板',
  description:
    '聚焦修复批次、控湿参数和文献归档风险，适合作为修复工作室内部业务系统的前端原型。',
  backlogLabel: '待处理批次',
  backlogValue: '12 册',
  note: '高湿季节前优先清理虫道扩散页。',
}

export const restorationBatches = [
  {
    code: 'A-03',
    title: '明抄本县志残卷',
    pages: '17-29',
    risk: 'high',
    status: '补纸前',
    note: '虫道集中在装订线外沿。',
  },
  {
    code: 'B-11',
    title: '碑帖拓片册页',
    pages: '5-14',
    risk: 'medium',
    status: '控湿中',
    note: '需先降湿 48 小时，再进入纤维加固。',
  },
  {
    code: 'C-02',
    title: '戏曲抄本散页',
    pages: '1-9',
    risk: 'low',
    status: '归档前',
    note: '边角缺损明显，建议先做透明托裱。',
  },
]

export const restorationEnvironment = [
  {
    label: '相对湿度',
    value: '52%',
    note: '控制线 50% - 55%',
  },
  {
    label: '纸浆补配',
    value: '2 批',
    note: '桑皮纤维待过滤',
  },
  {
    label: '紫外检查',
    value: '4 页',
    note: '夜间统一复核霉斑残留',
  },
]

export const restorationSteps = [
  '拍照建档并标注虫蛀起止页。',
  '低压吸附除尘，保留边角碎纤维。',
  '喷雾回软后局部补纸，不做整页过度清洗。',
  '平整定型 8 小时后转入无酸盒暂存。',
]

// ---------------------------------------------------------------------------
// 负责人负载分配：修复师、可用时段与任务
//
// 时段目录（周一至周五，上午 / 下午）。任务一旦占用某修复师的某个时段，
// 其他任务再落同一时段即视为冲突，需要改选可回退的空闲时段。
// ---------------------------------------------------------------------------

export const restorationSlots = [
  { id: 'mon-am', label: '周一上午' },
  { id: 'mon-pm', label: '周一下午' },
  { id: 'tue-am', label: '周二上午' },
  { id: 'tue-pm', label: '周二下午' },
  { id: 'wed-am', label: '周三上午' },
  { id: 'wed-pm', label: '周三下午' },
  { id: 'thu-am', label: '周四上午' },
  { id: 'thu-pm', label: '周四下午' },
  { id: 'fri-am', label: '周五上午' },
  { id: 'fri-pm', label: '周五下午' },
]

// active=false 表示负责人已停用：不得承接新任务；
// 其名下历史任务继续保留原负责人，仅在历史区只读展示。
export const restorationRestorers = [
  {
    id: 'r-han',
    name: '韩澈',
    active: true,
    capacity: 3,
    availableSlots: ['mon-am', 'tue-am', 'wed-am', 'thu-am', 'fri-am'],
  },
  {
    id: 'r-lu',
    name: '陆宁',
    active: true,
    capacity: 3,
    availableSlots: ['mon-pm', 'wed-pm', 'fri-pm'],
  },
  {
    id: 'r-zhou',
    name: '周恬',
    active: true,
    capacity: 3,
    availableSlots: ['tue-pm', 'thu-pm', 'fri-pm'],
  },
  {
    id: 'r-shen',
    name: '沈砚',
    active: true,
    capacity: 3,
    availableSlots: ['mon-am', 'wed-am', 'fri-pm'],
  },
  {
    id: 'r-ge',
    name: '葛青',
    active: false,
    capacity: 3,
    availableSlots: ['tue-am', 'thu-pm'],
  },
]

// 任务状态：
// - pending   待分配：等待落单，可进入分配台
// - active    在办中：已落单，计入负责人当前在办量
// - archived  历史任务：只读，永远保留 originalOwner
export const restorationAssignableTasks = [
  {
    id: 't1',
    title: '明抄本县志残卷',
    stage: '补纸前',
    risk: 'high',
    status: 'active',
    ownerId: 'r-han',
    slotId: 'mon-am',
    claims: [],
    note: '虫道贯穿标题栏，需先固色。',
  },
  {
    id: 't2',
    title: '碑帖拓片册页',
    stage: '控湿中',
    risk: 'medium',
    status: 'active',
    ownerId: 'r-lu',
    slotId: 'mon-pm',
    claims: [],
    note: '边缘卷曲，可延后压平。',
  },
  {
    id: 't3',
    title: '戏曲抄本散页',
    stage: '归档前',
    risk: 'low',
    status: 'active',
    ownerId: 'r-zhou',
    slotId: 'tue-pm',
    claims: [],
    note: '等待封套尺寸确认。',
  },
  {
    id: 't4',
    title: '敦煌残经缀合页',
    stage: '除尘前',
    risk: 'high',
    status: 'pending',
    ownerId: null,
    slotId: null,
    claims: ['r-lu', 'r-zhou'],
    note: '陆宁、周恬同时认领，须先裁定再落单。',
  },
  {
    id: 't5',
    title: '活字本族谱虫道页',
    stage: '补纸前',
    risk: 'medium',
    status: 'pending',
    ownerId: null,
    slotId: null,
    claims: [],
    note: '虫道沿版框分布，需要整托补。',
  },
  {
    id: 't6',
    title: '彩绘戏曲脸谱页',
    stage: '固色中',
    risk: 'medium',
    status: 'pending',
    ownerId: null,
    slotId: null,
    claims: [],
    note: '矿物色料遇水易晕染，先做固色试验。',
  },
  {
    id: 't7',
    title: '明版线装医书',
    stage: '已归档',
    risk: 'low',
    status: 'archived',
    ownerId: null,
    originalOwnerId: 'r-ge',
    slotId: null,
    claims: [],
    note: '上季度归档，历史任务保留原负责人。',
  },
  {
    id: 't8',
    title: '清代信札册',
    stage: '已归档',
    risk: 'low',
    status: 'archived',
    ownerId: null,
    originalOwnerId: 'r-han',
    slotId: null,
    claims: [],
    note: '去年完成修复，历史任务保留原负责人。',
  },
]

// 向后兼容旧视图的静态任务摘要（新代码请统一使用分配 store）。
export const restorationTasks = restorationAssignableTasks
  .filter((item) => item.status !== 'archived')
  .map((item) => ({
    title: item.title,
    stage: item.stage,
    risk: item.risk,
    owner: item.ownerId ? ownerNameOf(item.ownerId) : '待分配',
    note: item.note,
  }))

function ownerNameOf(ownerId) {
  return restorationRestorers.find((item) => item.id === ownerId)?.name ?? '待分配'
}
