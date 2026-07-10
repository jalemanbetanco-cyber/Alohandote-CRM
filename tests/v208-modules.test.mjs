import assert from 'node:assert/strict'
import { cleanPrintCss, alohandotePdfHeader, alohandoteContactFooter } from '../src/modules/documents/branding.js'
import { appendPaymentOnce, dedupePaymentHistory, shouldAppendPaymentOnSave } from '../src/modules/payments/paymentHistory.js'
import { allyIncomeTargetUsd, calculateAllyBreakdown, isAlliedAccommodation } from '../src/modules/lodging/allyAccounting.js'

assert.ok(cleanPrintCss.includes('alohandote-doc-brand'))
assert.ok(alohandotePdfHeader('Recibo <test>').includes('&lt;test&gt;'))
assert.ok(alohandoteContactFooter().includes('@alohandote'))

const payment = { date: '2026-06-21T10:00:00.000Z', method: 'Zelle', rawAmount: 50, amountUsd: 50, amountBs: 0, reference: 'A1' }
assert.equal(appendPaymentOnce([payment], { ...payment }).length, 1)
assert.equal(dedupePaymentHistory([payment, { ...payment }]).length, 1)
assert.equal(shouldAppendPaymentOnSave({ _paymentsEdited: true, amount: 10 }, 'r1'), false)
assert.equal(shouldAppendPaymentOnSave({ amount: 10, _originalPaymentAmount: 5 }, 'r1'), true)

assert.equal(isAlliedAccommodation({ ownershipType: 'Aliado' }), true)
assert.equal(allyIncomeTargetUsd(500, 'percent', 20), 100)
assert.deepEqual(calculateAllyBreakdown({ totalAmount: 500, paidUsd: 250, paidBs: 25000, profitMode: 'fixed', profitValue: 100, isAlly: true }), {
  isAlly: true,
  targetIncome: 100,
  ownerTarget: 400,
  alohandoteCollectedUsd: 50,
  ownerPayableUsd: 200,
  alohandoteCollectedBs: 5000,
  ownerPayableBs: 20000,
})

console.log('OK V208 módulos puros: documentos, abonos y aliados.')
