import { DATASET_SIZE, PERFORMANCE_SEVERITY } from './performanceTypes.js'

export function classifyDatasetSize(items = []) {
  const size = Array.isArray(items) ? items.length : 0
  if (size >= 250) return DATASET_SIZE.LARGE
  if (size >= 75) return DATASET_SIZE.MEDIUM
  return DATASET_SIZE.SMALL
}

export function shouldVirtualizeList(items = [], threshold = 120) {
  return Array.isArray(items) && items.length > threshold
}

export function buildStableMemoKey(parts = []) {
  return parts
    .map((part) => {
      if (part === null || part === undefined) return ''
      if (typeof part === 'object') return JSON.stringify(part, Object.keys(part).sort())
      return String(part)
    })
    .join('|')
}

export function getRenderRisk({ items = [], filters = {}, hasNestedMaps = false } = {}) {
  const size = Array.isArray(items) ? items.length : 0
  const activeFilters = Object.values(filters || {}).filter(Boolean).length
  const score = size + activeFilters * 25 + (hasNestedMaps ? 100 : 0)

  if (score >= 300) {
    return {
      severity: PERFORMANCE_SEVERITY.HIGH,
      recommendation: 'Use memoized selectors, pagination or virtualization before adding new UI logic.',
      score,
    }
  }

  if (score >= 125) {
    return {
      severity: PERFORMANCE_SEVERITY.MEDIUM,
      recommendation: 'Use stable memo keys and avoid recalculating filtered collections on every render.',
      score,
    }
  }

  return {
    severity: PERFORMANCE_SEVERITY.LOW,
    recommendation: 'Current rendering risk is acceptable.',
    score,
  }
}
