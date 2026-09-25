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

const riskRank = { high: 0, medium: 1, low: 2 }

export function riskOrder(risk) {
  return riskRank[risk] ?? 99
}

export function taskStatusMeta(status) {
  const map = {
    pending: { label: '待分配', tone: 'pending' },
    active: { label: '在办中', tone: 'active' },
    archived: { label: '历史', tone: 'archived' },
  }

  return map[status] ?? { label: status, tone: 'pending' }
}
