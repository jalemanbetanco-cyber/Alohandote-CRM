import assert from 'node:assert/strict'
import fs from 'node:fs'
import { buildFinancialSettlement } from '../src/services/business/financeEngine.js'
import { buildCalendarDayContext } from '../src/services/business/calendarBusinessService.js'
import { normalizeIcalUrlList, buildIcalDisconnectPlan, buildIcalSyncPlan } from '../src/services/business/icalSyncService.js'
import { buildDocumentGenerationContext } from '../src/services/business/documentGenerationService.js'

const settlement = buildFinancialSettlement({ totalUsd: 100, payments: [{ method: 'Zelle', rawAmount: 40 }], paymentMethod: 'Zelle', exchangeRate: 700, reservationId: 'R-V224-5', module: 'rentcar' })
assert.equal(settlement.paidUsd, 40)
assert.equal(settlement.pendingUsd, 60)
assert.equal(settlement.paymentCurrency, 'USD')
assert.equal(settlement.receivable.shouldRegister, true)

const day = buildCalendarDayContext({ date: '2026-07-10', today: new Date('2026-07-04T12:00:00Z'), records: [
  { id: '1', startDate: '2026-07-10', endDate: '2026-07-12', vehicleId: 'car-1' },
  { id: '2', startDate: '2026-07-10', endDate: '2026-07-12', status: 'cancelled', accommodationId: 'apt-1' },
] })
assert.equal(day.count, 1)
assert.deepEqual(day.assetLabels, ['Renta Car'])

assert.deepEqual(normalizeIcalUrlList([' https://airbnb.example/ical.ics ', '', null]), ['https://airbnb.example/ical.ics'])
assert.equal(buildIcalSyncPlan({ accommodationId: 'apt-1', urls: ['https://a.test/1.ics'] }).shouldSync, true)
assert.equal(buildIcalDisconnectPlan({ accommodationId: 'apt-1', importedBlocks: [{ id: 'b1' }] }).releaseCount, 1)

assert.equal(buildDocumentGenerationContext({ role: 'vendedor alojamiento' }).useGenericBranding, true)

const app = fs.readFileSync('src/App.jsx', 'utf8')
assert.match(app, /ErpModuleShell/, 'Sprint 5 no debe revertir Sprint 4 ERP')
assert.match(app, /OperationForms/, 'Sprint 5 no debe revertir Sprint 3 Operaciones')
assert.ok(fs.existsSync('src/services/business/index.js'), 'Debe existir fachada de servicios de negocio')

console.log('✅ V224 Sprint 5 servicios de negocio validado')
