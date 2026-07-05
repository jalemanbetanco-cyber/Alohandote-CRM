// V126 - Dominio de mantenimiento
// Funciones puras para clasificar mantenimientos sin contaminar reservas iCal.

import { num, dollarRateValue } from './money.js'

export function normalizeStatus(value) {
  const raw = String(value || '').trim().toLowerCase()
  if (['cancelled', 'canceled', 'cancelada', 'cancelado', 'anulada', 'anulado', 'anulada / devolución', 'anulacion', 'anulación', 'devolucion', 'devolución', 'devuelto / anulado'].includes(raw)) return 'cancelled'
  if (['returned', 'devuelto', 'devuelta', 'completado', 'completada', 'finalizado', 'finalizada', 'cerrado', 'cerrada'].includes(raw)) return 'returned'
  if (['maintenance', 'mantenimiento', 'correctivo', 'preventivo'].includes(raw)) return 'maintenance'
  if (['pending', 'pre-reserva', 'prereserva', 'pre reserva', 'no disponible', 'nodisponible', 'bloqueado'].includes(raw)) return 'pending'
  if (['reserved', 'reservado', 'reservada', 'reserva'].includes(raw)) return 'reserved'
  return 'reserved'
}

export function isRecordCancelled(item = {}) {
  return normalizeStatus(item.status) === 'cancelled'
    || Boolean(item.cancelledAt || item.refundAt || item.receivableClosed || item.calendarReleased || item.cancellationType === 'annulment_refund')
}

export function isIcalImportedRecord(item = {}) {
  const channel = String(item?.channel || '').toLowerCase()
  const note = String(item?.note || item?.notes || '').toLowerCase()
  const customer = String(item?.customerName || '').toLowerCase()
  const source = String(item?.source || item?.sourceType || '').toLowerCase()
  return source === 'ical'
    || channel.includes('ical')
    || channel.includes('airbnb')
    || channel.includes('booking')
    || note.includes('ical')
    || note.includes('airbnb')
    || note.includes('booking')
    || customer.includes('airbnb')
    || customer.includes('not available')
    || Boolean(item?.externalUid)
}

export function isMaintenanceRecord(item = {}) {
  if (isIcalImportedRecord(item)) return false
  const status = normalizeStatus(item.status)
  const hasMaintenanceCost = num(item.maintenanceCost) > 0 || num(item.maintenanceLaborCost) > 0 || num(item.maintenancePartsCost) > 0
  const hasMaintenanceEvidence = !!item.maintenancePaymentMethod || (Array.isArray(item.maintenanceInvoices) && item.maintenanceInvoices.length > 0)
  return status === 'maintenance' || hasMaintenanceCost || hasMaintenanceEvidence
}


export function maintenanceCalendarDurationDays(item = {}) {
  const start = String(item?.startDate || '').slice(0, 10)
  const end = String(item?.endDate || start || '').slice(0, 10)
  if (!start || !/^\d{4}-\d{2}-\d{2}$/.test(start)) return 0
  const safeEnd = /^\d{4}-\d{2}-\d{2}$/.test(end) ? end : start
  const startDate = new Date(`${start}T00:00:00`)
  const endDate = new Date(`${safeEnd}T00:00:00`)
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return 0
  const diffDays = Math.round((endDate - startDate) / 86400000)
  return Math.max(1, diffDays || 1)
}

export function isNonBlockingShortMaintenance(item = {}) {
  return isMaintenanceRecord(item) && maintenanceCalendarDurationDays(item) <= 1
}

export function maintenancePaymentBucket(method = '') {
  const key = String(method || '').toLowerCase()
  if (key.includes('zelle')) return 'Zelle'
  if (key.includes('usdt')) return 'Binance'
  if (key.includes('bs')) return 'Bs'
  if (key.includes('efectivo')) return 'Efectivo $'
  return 'Sin método'
}

export function maintenanceUsdCost(item = {}) {
  return num(item.maintenanceCost || 0)
}

export function maintenanceBsCost(item = {}, exchangeRates = null) {
  const rate = dollarRateValue(exchangeRates, item.bcvDollarRate || item.bcvUsdRate || '')
  return Number((maintenanceUsdCost(item) * rate).toFixed(2))
}
