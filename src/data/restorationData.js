export const restorationNavigation = [
  { label: '修复总览', to: '/' },
  { label: '批次档案', to: '/batches' },
  { label: '任务清单', to: '/tasks' },
  { label: '负载分配', to: '/allocation' },
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

// 可排工作时段：周一至周五，上午 / 下午各一档
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

// 修复师名册：active=false 表示已停用，不允许再接收新任务
export const restorationRestorers = [
  {
    id: 'r-han',
    name: '韩澈',
    title: '资深修复师',
    active: true,
    slotIds: ['mon-am', 'tue-am', 'wed-pm', 'fri-am'],
  },
  {
    id: 'r-lu',
    name: '陆宁',
    title: '修复师',
    active: true,
    slotIds: ['tue-pm', 'wed-am', 'thu-am', 'fri-pm'],
  },
  {
    id: 'r-zhou',
    name: '周恬',
    title: '修复师',
    active: true,
    slotIds: ['mon-pm', 'thu-pm', 'fri-am'],
  },
  {
    id: 'r-gu',
    name: '顾洵',
    title: '修复师',
    active: true,
    slotIds: ['mon-am', 'tue-pm', 'thu-am'],
  },
  {
    id: 'r-shen',
    name: '沈蕴',
    title: '返聘顾问',
    active: false,
    slotIds: ['mon-am', 'wed-am'],
  },
]

// 任务三态：
// - pending：待分配，ownerId / slotId 均为空
// - active：已落单在办，负责人与时段确定
// - archived：历史任务，负责人记录冻结，不再随名册状态改变
export const restorationTasks = [
  {
    id: 't-01',
    title: '明抄本县志残卷',
    stage: '补纸前',
    risk: 'high',
    status: 'active',
    ownerId: 'r-han',
    slotId: 'wed-pm',
    preferredSlotIds: [],
    note: '虫道贯穿标题栏，需先固色。',
  },
  {
    id: 't-02',
    title: '碑帖拓片册页',
    stage: '控湿中',
    risk: 'medium',
    status: 'active',
    ownerId: 'r-lu',
    slotId: 'tue-pm',
    preferredSlotIds: [],
    note: '边缘卷曲，可延后压平。',
  },
  {
    id: 't-03',
    title: '戏曲抄本散页',
    stage: '归档前',
    risk: 'low',
    status: 'active',
    ownerId: 'r-zhou',
    slotId: 'fri-am',
    preferredSlotIds: [],
    note: '等待封套尺寸确认。',
  },
  {
    id: 't-04',
    title: '清代族谱函套',
    stage: '除尘待检',
    risk: 'medium',
    status: 'active',
    ownerId: 'r-gu',
    slotId: 'thu-am',
    preferredSlotIds: [],
    note: '函套表面虫粪较多，先低压除尘。',
  },
  {
    id: 't-05',
    title: '线装医书虫损页',
    stage: '补纸前',
    risk: 'high',
    status: 'pending',
    ownerId: null,
    slotId: null,
    preferredSlotIds: ['mon-am'],
    note: '书口虫道连片，两名修复师同时认领，需协调员裁定。',
  },
  {
    id: 't-06',
    title: '地方志舆图残页',
    stage: '纤维加固',
    risk: 'medium',
    status: 'pending',
    ownerId: null,
    slotId: null,
    preferredSlotIds: ['thu-am'],
    note: '图心折痕处纤维粉化，建议周四上午集中处理。',
  },
  {
    id: 't-07',
    title: '民国字帖托裱',
    stage: '归档前',
    risk: 'low',
    status: 'pending',
    ownerId: null,
    slotId: null,
    preferredSlotIds: ['fri-pm'],
    note: '仅余托裱收尾，可排在周五下午。',
  },
  {
    id: 't-08',
    title: '明版佛经残册',
    stage: '已归档',
    risk: 'medium',
    status: 'archived',
    ownerId: 'r-shen',
    slotId: 'mon-am',
    preferredSlotIds: [],
    note: '修复记录随册归档，历史负责人留档显示。',
  },
]

// 认领记录：open 待处理，accepted / rejected 已裁定
// t-05 被两人同时认领同一时段，是落单前必须处理的冲突样本
export const restorationClaims = [
  {
    id: 'c-01',
    taskId: 't-05',
    restorerId: 'r-han',
    slotId: 'mon-am',
    createdAt: '09-23 10:20',
    status: 'open',
  },
  {
    id: 'c-02',
    taskId: 't-05',
    restorerId: 'r-gu',
    slotId: 'mon-am',
    createdAt: '09-23 10:42',
    status: 'open',
  },
]

// 看板演示身份：协调员可分配，查看者只能查看建议
export const restorationUsers = [
  { id: 'u-coordinator', name: '沈协调', role: 'coordinator', roleLabel: '分配协调员' },
  { id: 'u-viewer', name: '实习生', role: 'viewer', roleLabel: '只读查看者' },
]
