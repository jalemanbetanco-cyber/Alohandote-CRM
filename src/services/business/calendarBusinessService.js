// V224 Sprint 5 - Servicio de negocio calendario.
// Mantiene aisladas reglas puras de disponibilidad, reservas activas y clasificación operativa.

import {
  normalizeCalendarStatus,
  isCancelledCalendarRecord,
  toCalendarDate,
  dateIsInsideRange,
  reservationTouchesDate,
  reservationsForCalendarDate,
  calendarOperationGroup,
  buildCalendarAssetLabel,
} from '../../modules/calendar/calendarCore.js'

export {
  normalizeCalendarStatus,
  isCancelledCalendarRecord,
  toCalendarDate,
  dateIsInsideRange,
  reservationTouchesDate,
  reservationsForCalendarDate,
  calendarOperationGroup,
  buildCalendarAssetLabel,
}

export function buildCalendarDayContext({ records = [], date = '', inclusiveEnd = false, today = new Date() } = {}) {
  const activeRecords = reservationsForCalendarDate(records, date, { inclusiveEnd })
  return {
    date: toCalendarDate(date),
    operationGroup: calendarOperationGroup(date, today),
    records: activeRecords,
    count: activeRecords.length,
    assetLabels: [...new Set(activeRecords.map(buildCalendarAssetLabel))],
  }
}
