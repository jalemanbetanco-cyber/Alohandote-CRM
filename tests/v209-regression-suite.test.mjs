import assert from 'node:assert/strict'
import fs from 'node:fs'

import {
  appendPaymentOnce,
  dedupePaymentHistory,
  paymentTraceKey,
  removePaymentAt,
  summarizePaymentsByMethod,
  updatePaymentAt,
} from '../src/modules/payments/paymentHistory.js'

import {
  buildRegressionMatrix,
  evaluateRegressionGoNoGo,
  regressionChecklistMarkdown,
  REGRESSION_CRITICAL_FLOWS,
  v209ValidationCommands,
} from '../src/services/qaRegressionService.js'

function test(name, fn) {
  try {
    fn()
    console.log(`✓ ${name}`)
  } catch (error) {
    console.error(`✗ ${name}`)
    throw error
  }
}

const app = fs.readFileSync('src/App.jsx', 'utf8')
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))

test('V209: versión y scripts de regresión quedan registrados', () => {
  assert.ok(/^1\.0\.(209|21[0-9]|2[2-9][0-9]|[3-9][0-9]{2,})$/.test(pkg.version))
  assert.ok(pkg.scripts['test:v209'])
  assert.ok(pkg.scripts['qa:regression'])
  assert.ok(pkg.scripts['production:check'].includes('test:v209'))
})

test('V209: Renta Car conserva modal y abonos sin depender de alojamiento', () => {
  assert.ok(app.includes('setEditingReservation'))
  assert.ok(app.includes('renderPaymentHistoryManager(editingReservation, setEditingReservation, editingReservationReadOnly)'))
  assert.ok(app.includes('emptyReservation'))
  assert.ok(!app.includes('editingLodging && editingRenta'))
})

test('V209: gestión de abonos evita duplicados y permite edición/eliminación pura', () => {
  const base = { date: '2026-06-21T10:00:00.000Z', method: 'USDT', rawAmount: 100, amountUsd: 100, amountBs: 0, reference: 'A1' }
  const next = appendPaymentOnce([base], { ...base })
  assert.equal(next.length, 1)
  assert.equal(paymentTraceKey(base), paymentTraceKey({ ...base }))

  const edited = updatePaymentAt(next, 0, { rawAmount: 80, amountUsd: 80, reference: 'A1-editado' })
  assert.equal(edited.length, 1)
  assert.equal(edited[0].amountUsd, 80)
  assert.equal(edited[0].reference, 'A1-editado')

  const removed = removePaymentAt(edited, 0)
  assert.deepEqual(removed, [])
})

test('V209: resumen de abonos respeta método y moneda real', () => {
  const payments = dedupePaymentHistory([
    { method: '$ Efectivo', amountUsd: 50, amountBs: 0, reference: 'cash' },
    { method: 'Zelle', amountUsd: 75, amountBs: 0, reference: 'zelle' },
    { method: 'Pago en BS', amountUsd: 10, amountBs: 1200, reference: 'bs' },
  ])
  const summary = summarizePaymentsByMethod(payments)
  assert.equal(summary['$ Efectivo'].amountUsd, 50)
  assert.equal(summary.Zelle.amountUsd, 75)
  assert.equal(summary['Pago en BS'].amountBs, 1200)
})

test('V209: matriz QA aplica regla GO/NO-GO usada para despliegues', () => {
  const allPass = REGRESSION_CRITICAL_FLOWS.map((flow) => ({ id: flow.id, status: 'pass', evidence: 'ok' }))
  const go = evaluateRegressionGoNoGo(allPass)
  assert.equal(go.decision, 'GO')
  assert.equal(go.criticalFailed.length, 0)

  const blocked = evaluateRegressionGoNoGo([{ id: 'rentcar-reservation', status: 'failed', evidence: 'error visual' }])
  assert.equal(blocked.decision, 'NO-GO')
  assert.ok(blocked.criticalFailed.includes('rentcar-reservation'))

  const matrix = buildRegressionMatrix([{ id: 'auth-login', status: 'aprobado' }])
  assert.equal(matrix.find((item) => item.id === 'auth-login').passed, true)
  assert.ok(regressionChecklistMarkdown(allPass).includes('Reporte de Regresión V209'))
})

test('V209: comandos de validación conservan flujo estable de despliegue', () => {
  assert.deepEqual(v209ValidationCommands, [
    'npm install',
    'npm run production:check',
    'npm run build',
    'vercel --prod',
  ])
})

console.log('\nOK V209: suite de regresión y automatización QA aprobada.')
