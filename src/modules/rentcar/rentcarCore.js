// V212: núcleo puro de Renta Car.
// Mantiene aisladas las reglas de fechas, tarifas, disponibilidad y normalización del módulo.

const DEFAULT_KM_RATE = 0.3

function num(value) {
  const parsed = Number(String(value ?? '').replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : 0
}

export function vehicleKmRate(vehicle = {}) {
  return Number(vehicle?.pricePerKm || vehicle?.kmRate || vehicle?.costPerKm || DEFAULT_KM_RATE) || DEFAULT_KM_RATE
}

export function vehicleDayRate(vehicle = {}) {
  return Number(vehicle?.dailyRentalRate || vehicle?.dayRate || vehicle?.dailyRate || 0) || 0
}

export function dayCount(startDate, endDate) {
  if (!startDate || !endDate) return 0
  const start = new Date(`${String(startDate).slice(0, 10)}T00:00:00`)
  const end = new Date(`${String(endDate).slice(0, 10)}T00:00:00`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0
  const diffDays = Math.round((end - start) / 86400000)
  return Math.max(1, diffDays || 1)
}

export function rentalDaysForReservation(reservation = {}) {
  return Number(dayCount(reservation.startDate, reservation.endDate) || reservation.rentalDays || 0)
}

export function quoteBaseFromDays(days, dailyRate) {
  return Number((num(days) * num(dailyRate)).toFixed(2))
}

export function quoteFromKm(km, rate = DEFAULT_KM_RATE) {
  return Number((num(km) * num(rate || DEFAULT_KM_RATE)).toFixed(2))
}

export function calculateRentCarQuote({ startDate, endDate, dailyRate = 0, approxKm = 0, pricePerKm = DEFAULT_KM_RATE } = {}) {
  const days = rentalDaysForReservation({ startDate, endDate })
  const baseAmount = quoteBaseFromDays(days, dailyRate)
  const kmAmount = quoteFromKm(approxKm, pricePerKm)
  return {
    rentalDays: days,
    baseAmount,
    kmAmount,
    totalAmount: Number((baseAmount + kmAmount).toFixed(2)),
  }
}

export function normalizeRentCarReservationDraft(draft = {}, vehicle = {}) {
  const pricePerKm = num(draft.pricePerKm || vehicleKmRate(vehicle))
  const dailyRate = num(draft.dailyRate || vehicleDayRate(vehicle))
  const quote = calculateRentCarQuote({
    startDate: draft.startDate,
    endDate: draft.endDate,
    dailyRate,
    approxKm: draft.approxKm,
    pricePerKm,
  })
  return {
    ...draft,
    reservationType: 'vehicle',
    accommodationId: '',
    vehicleId: draft.vehicleId || vehicle.id || '',
    dailyRate,
    pricePerKm,
    rentalDays: draft.rentalDays || String(quote.rentalDays || ''),
    totalAmount: draft.totalAmount || quote.totalAmount,
  }
}

export function rentCarConflicts(records = [], draft = {}) {
  const vehicleId = draft.vehicleId || ''
  if (!vehicleId || !draft.startDate || !draft.endDate) return []
  return (Array.isArray(records) ? records : []).filter((record) => {
    if (!record || record.id === draft.id) return false
    if ((record.vehicleId || '') !== vehicleId) return false
    const status = String(record.status || '').toLowerCase()
    if (status === 'cancelled' || record.cancelledAt || record.calendarReleased) return false
    const startA = String(draft.startDate).slice(0, 10)
    const endA = String(draft.endDate).slice(0, 10)
    const startB = String(record.startDate || '').slice(0, 10)
    const endB = String(record.endDate || '').slice(0, 10)
    if (!startB || !endB) return false
    return startA < endB && endA > startB
  })
}
