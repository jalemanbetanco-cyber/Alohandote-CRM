export function toISODate(date) {
  const safeDate = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(safeDate.getTime())) return ''
  const year = safeDate.getFullYear()
  const month = String(safeDate.getMonth() + 1).padStart(2, '0')
  const day = String(safeDate.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function isValidDateValue(value) {
  if (!value) return false
  const date = value instanceof Date ? value : new Date(value)
  return !Number.isNaN(date.getTime())
}

export function parseISODate(iso) {
  if (!iso || typeof iso !== 'string') return new Date(NaN)
  const [year, month, day] = iso.split('-').map(Number)
  if (!year || !month || !day) return new Date(NaN)
  return new Date(year, month - 1, day)
}

export function addDays(date, days) {
  const base = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(base.getTime())) return new Date(NaN)
  const next = new Date(base)
  next.setDate(next.getDate() + days)
  return next
}

export function getMonthDays(year, monthIndex) {
  const firstDay = new Date(year, monthIndex, 1)
  const startOffset = (firstDay.getDay() + 6) % 7
  const gridStart = addDays(firstDay, -startOffset)
  const days = []
  for (let i = 0; i < 42; i++) days.push(addDays(gridStart, i))
  return days
}

function occupiedEndInclusive(start, end) {
  if (!start || !end) return end || start || ''
  if (end > start) return toISODate(addDays(parseISODate(end), -1))
  return start
}

export function rangesOverlap(startA, endA, startB, endB) {
  if (!startA || !endA || !startB || !endB) return false
  const occupiedEndA = occupiedEndInclusive(startA, endA)
  const occupiedEndB = occupiedEndInclusive(startB, endB)
  if (!occupiedEndA || !occupiedEndB) return false
  return startA <= occupiedEndB && startB <= occupiedEndA
}

export function isDateInsideRange(isoDate, start, end) {
  if (!isoDate || !start || !end) return false
  const occupiedEnd = occupiedEndInclusive(start, end)
  if (!occupiedEnd) return false
  return isoDate >= start && isoDate <= occupiedEnd
}

export function formatShortDate(iso) {
  if (!iso) return '-'
  const stringValue = String(iso)
  const isoDate = stringValue.includes('T') ? stringValue.slice(0, 10) : stringValue
  const date = parseISODate(isoDate)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('es-VE', { day: 'numeric', month: 'short' }).format(date)
}

export function monthTitle(date) {
  const safeDate = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(safeDate.getTime())) return '-'
  return new Intl.DateTimeFormat('es-VE', { month: 'long', year: 'numeric' }).format(safeDate)
}
