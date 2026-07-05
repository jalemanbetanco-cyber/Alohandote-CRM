export function normalizeLimit(value, fallback = 100, max = 500) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric <= 0) return fallback
  return Math.min(Math.floor(numeric), max)
}

export function buildDateRangeQueryPlan({ collectionName, startDate, endDate, orderBy = 'date', limit = 100 } = {}) {
  if (!collectionName) throw new Error('collectionName is required')

  return {
    collectionName,
    constraints: [
      startDate ? { type: 'where', field: orderBy, operator: '>=', value: startDate } : null,
      endDate ? { type: 'where', field: orderBy, operator: '<=', value: endDate } : null,
      { type: 'orderBy', field: orderBy, direction: 'desc' },
      { type: 'limit', value: normalizeLimit(limit) },
    ].filter(Boolean),
  }
}

export function recommendIndexFields(queryPlan = {}) {
  const fields = []
  for (const constraint of queryPlan.constraints || []) {
    if ((constraint.type === 'where' || constraint.type === 'orderBy') && constraint.field) {
      fields.push(constraint.field)
    }
  }
  return [...new Set(fields)]
}

export function shouldUsePagedReads({ totalItems = 0, activeRangeDays = 0 } = {}) {
  return Number(totalItems) > 500 || Number(activeRangeDays) > 45
}
