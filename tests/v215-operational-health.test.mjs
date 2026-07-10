import assert from 'node:assert/strict'
import { buildOperationalHealthReport, detectOpenReceivablesMismatch, detectReservationsWithoutCashMovement } from '../src/modules/health/healthCore.js'
import { shouldBlockReleaseByHealth } from '../src/modules/health/healthService.js'

const reservations = [
  { id: 'RES-1', total: 100, paidAmount: 50, status: 'active' },
  { id: 'RES-2', total: 80, paidAmount: 80, status: 'active' },
  { id: 'RES-3', total: 70, paidAmount: 20, status: 'cancelled' }
]

const paymentIssues = detectReservationsWithoutCashMovement({ reservations, cashMovements: [{ reservationId: 'RES-2' }] })
assert.equal(paymentIssues.length, 1)
assert.equal(paymentIssues[0].entityId, 'RES-1')
assert.equal(paymentIssues[0].status, 'critical')

const cxcIssues = detectOpenReceivablesMismatch({ reservations, receivables: [] })
assert.equal(cxcIssues.length, 1)
assert.equal(cxcIssues[0].code, 'PENDING_BALANCE_WITHOUT_CXC')

const healthyCxc = detectOpenReceivablesMismatch({ reservations, receivables: [{ reservationId: 'RES-1', amount: 50, status: 'open' }] })
assert.equal(healthyCxc.length, 0)

const report = buildOperationalHealthReport({
  reservations,
  cashMovements: [{ reservationId: 'RES-2' }],
  receivables: [],
  allyReservations: [{ id: 'ALLY-1', tipoPropiedad: 'aliada', montoPropietario: 25 }],
  payables: [],
  icalEvents: [{ id: 'ICAL-1', accommodationId: 'APT-1', startDate: '2026-06-01', endDate: '2026-06-02' }]
})
assert.equal(report.version, 'V215')
assert.equal(report.summary.critical >= 1, true)
assert.equal(shouldBlockReleaseByHealth(report), true)

const cleanReport = buildOperationalHealthReport({ reservations: [], cashMovements: [], receivables: [], allyReservations: [], payables: [], icalEvents: [] })
assert.equal(cleanReport.summary.status, 'ok')
assert.equal(shouldBlockReleaseByHealth(cleanReport), false)

console.log('V215 operational health tests passed')
