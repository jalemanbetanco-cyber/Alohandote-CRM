import assert from 'node:assert/strict'
import { buildPaymentFormGuidance, buildReservationFormGuidance } from '../src/modules/ux/formGuidanceCore.js'
import { buildEmptyState, getOperationalQuickActions } from '../src/modules/ux/quickActionsCore.js'
import { applyModuleSearch, getFilterSummary } from '../src/modules/ux/searchFilterCore.js'

const lodgingGuidance = buildReservationFormGuidance({ module: 'alojamientos', data: { guestName: 'Orlando', phone: '0424', accommodationId: 'APT-1', checkIn: '2026-06-22', checkOut: '2026-06-23', total: 45 } })
assert.equal(lodgingGuidance.canSubmit, true)
assert.equal(lodgingGuidance.status, 'ready')

const rentCarGuidance = buildReservationFormGuidance({ module: 'renta_car', data: { clientName: 'Orlando', phone: '0424', vehicleId: '', startDate: '2026-06-22', endDate: '2026-06-23', total: 40 } })
assert.equal(rentCarGuidance.canSubmit, false)
assert.equal(rentCarGuidance.hints.some(item => item.field === 'vehicleId'), true)

const paymentGuidance = buildPaymentFormGuidance({ data: { amount: 20, method: 'Zelle', date: '2026-06-22' } })
assert.equal(paymentGuidance.canSubmit, true)

const actions = getOperationalQuickActions({ todayReservations: [{ id: 'R1' }], pendingReceivables: [{ id: 'CXC1' }], healthIssues: [{ status: 'critical' }] })
assert.equal(actions[0].id, 'health-critical')
assert.equal(actions.some(item => item.id === 'today-checkins'), true)

const empty = buildEmptyState({ module: 'renta_car' })
assert.equal(empty.action, 'Crear vehículo')

const rows = [
  { name: 'Girasol Suites', status: 'activo' },
  { name: 'Toyota Corolla', status: 'activo' },
  { name: 'Anulada vieja', status: 'anulado' }
]
const filtered = applyModuleSearch(rows, { query: 'toyota', fields: ['name'], status: 'activo' })
assert.equal(filtered.length, 1)
assert.equal(filtered[0].name, 'Toyota Corolla')

const summary = getFilterSummary({ query: 'toyota', status: 'activo', total: 3, visible: 1 })
assert.equal(summary.active, true)
assert.equal(summary.label, '1 de 3 resultado(s)')

console.log('V216 UX operativa tests passed')
