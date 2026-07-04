const normalize = value => String(value ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()

export function matchesSearch(item = {}, query = '', fields = []) {
  const term = normalize(query)
  if (!term) return true
  return fields.some(field => normalize(item?.[field]).includes(term))
}

export function applyStatusFilter(items = [], status = 'todos') {
  const selected = normalize(status)
  if (!selected || selected === 'todos') return items
  return items.filter(item => normalize(item?.status || item?.estado) === selected)
}

export function applyModuleSearch(items = [], { query = '', fields = [], status = 'todos' } = {}) {
  return applyStatusFilter(items, status).filter(item => matchesSearch(item, query, fields))
}

export function getFilterSummary({ query = '', status = 'todos', total = 0, visible = 0 } = {}) {
  const active = Boolean(normalize(query)) || normalize(status) !== 'todos'
  return {
    active,
    query: String(query || ''),
    status,
    total,
    visible,
    label: active ? `${visible} de ${total} resultado(s)` : `${total} resultado(s)`
  }
}
