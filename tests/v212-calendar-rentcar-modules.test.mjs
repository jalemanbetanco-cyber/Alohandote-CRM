import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  calendarOperationGroup,
  isCancelledCalendarRecord,
  reservationTouchesDate,
  reservationsForCalendarDate,
  buildCalendarAssetLabel,
} from '../src/modules/calendar/calendarCore.js'
import {
  calculateRentCarQuote,
  normalizeRentCarReservationDraft,
  rentCarConflicts,
  rentalDaysForReservation,
  vehicleDayRate,
  vehicleKmRate,
} from '../src/modules/rentcar/rentcarCore.js'

assert.equal(isCancelledCalendarRecord({ status: 'cancelled' }), true)
assert.equal(isCancelledCalendarRecord({ status: 'reserved' }), false)
assert.equal(reservationTouchesDate({ status: 'reserved', startDate: '2026-06-22', endDate: '2026-06-24' }, '2026-06-23'), true)
assert.equal(reservationTouchesDate({ status: 'cancelled', startDate: '2026-06-22', endDate: '2026-06-24' }, '2026-06-23'), false)
assert.equal(reservationsForCalendarDate([
  { id: 'ok', status: 'reserved', startDate: '2026-06-22', endDate: '2026-06-24' },
  { id: 'cancel', status: 'cancelled', startDate: '2026-06-22', endDate: '2026-06-24' },
], '2026-06-23').length, 1)
assert.equal(calendarOperationGroup('2026-06-21', new Date('2026-06-21T10:00:00')), 'today')
assert.equal(buildCalendarAssetLabel({ vehicleId: 'car-1' }), 'Renta Car')
assert.equal(buildCalendarAssetLabel({ accommodationId: 'apt-1' }), 'Alojamiento')

assert.equal(vehicleKmRate({ pricePerKm: 0.45 }), 0.45)
assert.equal(vehicleDayRate({ dailyRentalRate: 50 }), 50)
assert.equal(rentalDaysForReservation({ startDate: '2026-06-22', endDate: '2026-06-24' }), 2)
assert.deepEqual(calculateRentCarQuote({ startDate: '2026-06-22', endDate: '2026-06-24', dailyRate: 40, approxKm: 100, pricePerKm: 0.2 }), {
  rentalDays: 2,
  baseAmount: 80,
  kmAmount: 20,
  totalAmount: 100,
})
assert.deepEqual(normalizeRentCarReservationDraft({ startDate: '2026-06-22', endDate: '2026-06-23', approxKm: 50 }, { id: 'car-1', dailyRentalRate: 40, pricePerKm: 0.2 }), {
  startDate: '2026-06-22',
  endDate: '2026-06-23',
  approxKm: 50,
  reservationType: 'vehicle',
  accommodationId: '',
  vehicleId: 'car-1',
  dailyRate: 40,
  pricePerKm: 0.2,
  rentalDays: '1',
  totalAmount: 50,
})
assert.equal(rentCarConflicts([
  { id: 'r1', vehicleId: 'car-1', status: 'reserved', startDate: '2026-06-22', endDate: '2026-06-24' },
  { id: 'r2', vehicleId: 'car-1', status: 'cancelled', startDate: '2026-06-22', endDate: '2026-06-24' },
], { vehicleId: 'car-1', startDate: '2026-06-23', endDate: '2026-06-25' }).length, 1)

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
assert.match(pkg.version, /^1\.0\.(21[2-9]|2[2-9][0-9]|[3-9][0-9]{2,})$/)
assert.match(pkg.scripts['production:check'], /test:v212/)

console.log('✅ V212 módulos calendario/renta car validados')
