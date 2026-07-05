import { FIELD_SEVERITY, UX_STATUS } from './uxTypes.js'

const isEmpty = value => value == null || String(value).trim() === ''
const toNumber = value => Number.isFinite(Number(value)) ? Number(value) : 0

export function createFieldHint({ field, label, message, severity = FIELD_SEVERITY.REQUIRED }) {
  return { field, label, message, severity }
}

export function buildReservationFormGuidance({ module = 'alojamientos', data = {} } = {}) {
  const hints = []
  const isRentCar = String(module).toLowerCase().includes('renta') || String(module).toLowerCase().includes('rent')

  if (isEmpty(data.clientName || data.guestName || data.nombreCliente || data.huesped)) {
    hints.push(createFieldHint({ field: 'clientName', label: isRentCar ? 'Cliente' : 'Huésped', message: 'Completa el nombre para identificar la reserva.' }))
  }

  if (isEmpty(data.phone || data.telefono)) {
    hints.push(createFieldHint({ field: 'phone', label: 'Teléfono', message: 'Agrega un teléfono para contacto operativo y documentos.' }))
  }

  if (isRentCar) {
    if (isEmpty(data.vehicleId || data.vehicle || data.vehiculo)) {
      hints.push(createFieldHint({ field: 'vehicleId', label: 'Vehículo', message: 'Selecciona el vehículo antes de reservar.' }))
    }
    if (isEmpty(data.startDate || data.fechaEntrega)) {
      hints.push(createFieldHint({ field: 'startDate', label: 'Entrega', message: 'Define la fecha de entrega.' }))
    }
    if (isEmpty(data.endDate || data.fechaDevolucion)) {
      hints.push(createFieldHint({ field: 'endDate', label: 'Devolución', message: 'Define la fecha de devolución.' }))
    }
  } else {
    if (isEmpty(data.accommodationId || data.alojamiento)) {
      hints.push(createFieldHint({ field: 'accommodationId', label: 'Alojamiento', message: 'Selecciona el alojamiento antes de reservar.' }))
    }
    if (isEmpty(data.checkIn)) {
      hints.push(createFieldHint({ field: 'checkIn', label: 'Check In', message: 'Define la fecha de entrada.' }))
    }
    if (isEmpty(data.checkOut)) {
      hints.push(createFieldHint({ field: 'checkOut', label: 'Check Out', message: 'Define la fecha de salida.' }))
    }
  }

  if (toNumber(data.total || data.totalAmount || data.totalUsd) <= 0) {
    hints.push(createFieldHint({ field: 'total', label: 'Total', message: 'El total debe ser mayor a cero.' }))
  }

  return {
    module,
    status: hints.length > 0 ? UX_STATUS.WARNING : UX_STATUS.READY,
    canSubmit: hints.length === 0,
    hints
  }
}

export function buildPaymentFormGuidance({ data = {} } = {}) {
  const hints = []

  if (toNumber(data.amount || data.monto) <= 0) {
    hints.push(createFieldHint({ field: 'amount', label: 'Monto', message: 'El abono debe ser mayor a cero.' }))
  }

  if (isEmpty(data.method || data.metodoPago || data.paymentMethod)) {
    hints.push(createFieldHint({ field: 'method', label: 'Método de pago', message: 'Selecciona Bs, efectivo, Zelle o USDT.' }))
  }

  if (isEmpty(data.date || data.fecha)) {
    hints.push(createFieldHint({ field: 'date', label: 'Fecha', message: 'Registra la fecha del abono.' }))
  }

  return {
    module: 'abonos',
    status: hints.length > 0 ? UX_STATUS.WARNING : UX_STATUS.READY,
    canSubmit: hints.length === 0,
    hints
  }
}
