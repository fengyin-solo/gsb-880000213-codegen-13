import { restorationSlots } from '../data/restorationData'

export function riskMeta(risk) {
  const map = {
    high: {
      label: '高',
      tone: 'high',
    },
    medium: {
      label: '中',
      tone: 'medium',
    },
    low: {
      label: '低',
      tone: 'low',
    },
  }

  return map[risk] ?? map.low
}

export function taskStatusMeta(status) {
  const map = {
    pending: { label: '待分配', tone: 'pending' },
    active: { label: '在办', tone: 'active' },
    archived: { label: '历史', tone: 'archived' },
  }

  return map[status] ?? { label: status, tone: 'pending' }
}

export function slotLabel(slotId) {
  if (!slotId) {
    return '未排时段'
  }

  return restorationSlots.find((slot) => slot.id === slotId)?.label ?? slotId
}

export function slotLabelByIds(slotIds = []) {
  return slotIds.map((id) => slotLabel(id)).join('、')
}
