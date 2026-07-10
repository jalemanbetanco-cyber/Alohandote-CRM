// V128 - Validaciones críticas antes de guardar
// Funciones puras para bloquear datos incompletos o inconsistentes antes de entrar a la base.

import { num, paymentAmountUsd } from './money.js'
import { normalizeStatus, isIcalImportedRecord, isRecordCancelled, isNonBlockingShortMaintenance } from './maintenance.js'

export function isValidISODate(value = '') {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))
}

export function validateDateRange(startDate, endDate, labels = { start: 'fecha inicial', end: 'fecha final' }) {
  if (!startDate || !endDate) return `Debes indicar ${labels.start} y ${labels.end}.`
  if (!isValidISODate(startDate) || !isValidISODate(endDate)) return 'Las fechas deben tener formato válido.'
  if (startDate > endDate) return `La ${labels.start} no puede ser mayor que la ${labels.end}.`
  return ''
}

export function validatePositiveAmount(value, label = 'monto') {
  if (value === '' || value === null || value === undefined) return ''
  if (Number.isNaN(Number(value))) return `El ${label} debe ser numérico.`
  if (Number(value) < 0) return `El ${label} no puede ser negativo.`
  return ''
}

export function validatePaymentConsistency(record = {}, exchangeRates = null) {
  const status = normalizeStatus(record.status)
  if (status !== 'reserved') return ''
  const total = num(record.totalAmount)
  const paid = paymentAmountUsd(record.amount || 0, record.paymentMethod || '', exchangeRates, record.bcvEuroRate)
  if (total < 0) return 'El monto total no puede ser negativo.'
  if (paid < 0) return 'El abono no puede ser negativo.'
  // V221.10: permitir abono exactamente igual al total y tolerar redondeos Bs/USD.
  // Compatibilidad V221.9: antes era paid > total + 0.01; ahora se amplía para redondeos reales.
  // El bloqueo solo aplica si realmente supera el total por más de 0,50 USD.
  if (total && paid > total + 0.50) return 'El abono no puede ser mayor al total de la reserva.'
  return ''
}


export function timeToMinutes(value = '00:00') {
  const [hour = '0', minute = '0'] = String(value || '00:00').split(':')
  return (Number(hour) || 0) * 60 + (Number(minute) || 0)
}

export function dateTimeValue(date = '', time = '00:00') {
  if (!isValidISODate(date)) return null
  return `${date}T${String(time || '00:00').slice(0,5)}`
}

export function intervalsOverlapWithTime(payload = {}, item = {}, options = {}) {
  const startField = options.startField || 'startDate'
  const endField = options.endField || 'endDate'
  const startTimeField = options.startTimeField || 'deliveryTime'
  const endTimeField = options.endTimeField || 'returnTime'
  const payloadStart = dateTimeValue(payload[startField], payload[startTimeField] || '00:00')
  const payloadEnd = dateTimeValue(payload[endField], payload[endTimeField] || '23:59')
  const itemStart = dateTimeValue(item[startField], item[startTimeField] || '00:00')
  const itemEnd = dateTimeValue(item[endField], item[endTimeField] || '23:59')
  if (!payloadStart || !payloadEnd || !itemStart || !itemEnd) return false
  return payloadStart < itemEnd && payloadEnd > itemStart
}

export function validateNoDateConflict(payload = {}, items = [], options = {}) {
  const {
    idField = 'id',
    assetField = 'vehicleId',
    startField = 'startDate',
    endField = 'endDate',
    ignoreIcal = false,
    useTime = false,
    endExclusive = false,
  } = options

  const payloadRecordId = String(payload.__docId || payload._editingOriginalId || payload[idField] || payload.id || payload.docId || payload.reservationId || '').trim()

  return items.find((item) => {
    const itemIds = [item.__docId, item._editingOriginalId, item[idField], item.id, item.docId, item.reservationId]
      .filter((value) => value !== undefined && value !== null && String(value).trim() !== '')
      .map((value) => String(value).trim())
    if (payloadRecordId && itemIds.includes(payloadRecordId)) return false
    if (isRecordCancelled(item)) return false
    if (isNonBlockingShortMaintenance(item)) return false
    if (ignoreIcal && isIcalImportedRecord(item)) return false
    if (item[assetField] !== payload[assetField]) return false
    if (useTime) return intervalsOverlapWithTime(payload, item, options)
    if (endExclusive) return payload[startField] < item[endField] && payload[endField] > item[startField]
    return payload[startField] <= item[endField] && payload[endField] >= item[startField]
  }) || null
}

export function validateReservationCritical(payload = {}, context = {}) {
  if (!payload.vehicleId) return 'Debes seleccionar un vehículo.'
  const dateError = validateDateRange(payload.startDate, payload.endDate, { start: 'fecha de inicio', end: 'fecha final' })
  if (dateError) return dateError
  const status = normalizeStatus(payload.status)
  if (status === 'reserved' && !String(payload.customerName || '').trim()) return 'Debes colocar el nombre del cliente.'
  if (status === 'reserved') {
    const amountError = validatePositiveAmount(payload.totalAmount, 'total')
      || validatePositiveAmount(payload.amount, 'abono')
      || validatePaymentConsistency(payload, context.exchangeRates)
    if (amountError) return amountError
  }
  if (status === 'maintenance') {
    const costError = validatePositiveAmount(payload.maintenanceCost, 'costo de mantenimiento')
      || validatePositiveAmount(payload.maintenanceLaborCost, 'mano de obra')
      || validatePositiveAmount(payload.maintenancePartsCost, 'repuestos')
    if (costError) return costError
  }
  const conflict = validateNoDateConflict(payload, context.items || [], { assetField: 'vehicleId', useTime: true, startTimeField: 'deliveryTime', endTimeField: 'returnTime' })
  if (conflict) return context.conflictMessage ? context.conflictMessage(conflict) : 'Ese rango choca con otro registro.'
  return ''
}

export function validateLodgingCritical(payload = {}, context = {}) {
  if (!payload.accommodationId) return 'Debes seleccionar un alojamiento.'
  const dateError = validateDateRange(payload.startDate, payload.endDate, { start: 'fecha de check in', end: 'fecha de check out' })
  if (dateError) return dateError
  const status = normalizeStatus(payload.status)
  if (status === 'reserved' && !String(payload.customerName || '').trim()) return 'Debes colocar el nombre del huésped.'
  if (status === 'reserved') {
    const amountError = validatePositiveAmount(payload.totalAmount, 'total')
      || validatePositiveAmount(payload.amount, 'abono')
      || validatePaymentConsistency(payload, context.exchangeRates)
    if (amountError) return amountError
  }
  const conflict = validateNoDateConflict(payload, context.items || [], { assetField: 'accommodationId', ignoreIcal: true, endExclusive: true })
  if (conflict) return context.conflictMessage ? context.conflictMessage(conflict) : 'Ese rango choca con otra reserva.'
  return ''
}

export function validateVehicleOperationCritical(payload = {}, type = 'reception') {
  if (!payload.vehicleId) return 'Debes seleccionar un vehículo.'
  if (!payload.currentKm) return type === 'delivery' ? 'Debes colocar el kilometraje de salida.' : 'Debes colocar el kilometraje recibido.'
  if (Number.isNaN(Number(payload.currentKm))) return 'El kilometraje debe ser numérico.'
  if (Number(payload.currentKm) < 0) return 'El kilometraje no puede ser negativo.'
  return ''
}

export function validateCleaningCritical(payload = {}) {
  if (!payload.reservationId) return 'No se encontró la reserva del alojamiento.'
  if (!String(payload.responsible || '').trim()) return 'Selecciona el responsable de limpieza.'
  if (payload.quantity !== '' && payload.quantity !== undefined && Number(payload.quantity) < 0) return 'La cantidad de inventario no puede ser negativa.'
  return ''
}

export function validatePublicSubmissionCritical(kind = '', payload = {}) {
  if (!kind) return 'Tipo de operación pública no definido.'
  if (!payload.taskId && !payload.reservationId && !payload.id) return 'La operación pública no tiene identificador de tarea.'
  if (kind === 'vehicle_delivery') return validateVehicleOperationCritical(payload, 'delivery')
  if (kind === 'vehicle_reception') return validateVehicleOperationCritical(payload, 'reception')
  if (kind === 'lodging_cleaning') return validateCleaningCritical(payload)
  return 'Tipo de operación pública no reconocido.'
}
