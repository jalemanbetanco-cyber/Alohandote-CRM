// V212: núcleo puro de Calendario.
// Objetivo: aislar reglas de agenda/disponibilidad sin modificar el comportamiento estable de App.jsx.

export function normalizeCalendarStatus(value = '') {
  return String(value || '').trim().toLowerCase()
}

export function isCancelledCalendarRecord(record = {}) {
  const status = normalizeCalendarStatus(record.status)
  return status === 'cancelled' || Boolean(
    record.cancelledAt ||
    record.refundAt ||
    record.receivableClosed ||
    record.calendarReleased ||
    record.cancellationType === 'annulment_refund'
  )
}

export function toCalendarDate(value = '') {
  if (!value) return ''
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10)
  return String(value || '').slice(0, 10)
}

export function dateIsInsideRange(date, startDate, endDate, { inclusiveEnd = false } = {}) {
  const target = toCalendarDate(date)
  const start = toCalendarDate(startDate)
  const end = toCalendarDate(endDate)
  if (!target || !start || !end) return false
  return inclusiveEnd ? target >= start && target <= end : target >= start && target < end
}

export function reservationTouchesDate(record = {}, date, options = {}) {
  if (!record || isCancelledCalendarRecord(record)) return false
  return dateIsInsideRange(date, record.startDate, record.endDate, options)
}

export function reservationsForCalendarDate(records = [], date, options = {}) {
  return (Array.isArray(records) ? records : []).filter((record) => reservationTouchesDate(record, date, options))
}

export function calendarOperationGroup(operationDate, today = new Date()) {
  const date = toCalendarDate(operationDate)
  const current = toCalendarDate(today)
  if (!date || !current) return 'ignore'
  if (date < current) return 'past'
  if (date === current) return 'today'
  return 'future'
}

export function buildCalendarAssetLabel(record = {}) {
  if (record.reservationType === 'vehicle' || record.vehicleId) return 'Renta Car'
  if (record.reservationType === 'lodging' || record.accommodationId) return 'Alojamiento'
  return 'Reserva'
}
