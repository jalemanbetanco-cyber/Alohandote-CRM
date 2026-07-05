import assert from 'node:assert/strict'
import fs from 'node:fs'
import { operationalCurrencyForMethod } from '../src/modules/financial/currencyCore.js'
import { normalizePayments, paymentMutationGuard, totalPaidUsd } from '../src/modules/financial/paymentCore.js'
import { buildReceivableRecord, calculateReceivable } from '../src/modules/accountsReceivable/accountsReceivableCore.js'
import { buildPayableRecord } from '../src/modules/accountsPayable/accountsPayableCore.js'

assert.equal(operationalCurrencyForMethod('Pago en Bs'), 'Bs')
assert.equal(operationalCurrencyForMethod('Zelle'), 'USD')
assert.equal(operationalCurrencyForMethod('USDT'), 'USD')
assert.equal(operationalCurrencyForMethod('$ efectivo'), 'USD')

const payments = normalizePayments([{ method: 'Zelle', rawAmount: 40 }], 700)
assert.equal(payments[0].amountUsd, 40)
assert.equal(payments[0].amountBs, 28000)
assert.equal(totalPaidUsd(payments, 700), 40)

const edited = [{ method: 'USDT', rawAmount: 20 }]
const original = [{ method: 'USDT', rawAmount: 20 }, { method: 'Zelle', rawAmount: 10 }]
assert.deepEqual(paymentMutationGuard({ originalPayments: original, visibleDraftPayments: edited, paymentsEdited: true }), edited)

const receivableUsd = calculateReceivable({ totalUsd: 100, payments: [{ method: 'USDT', rawAmount: 25 }], paymentMethod: 'USDT', exchangeRate: 700, reservationId: 'R1', module: 'rentcar' })
assert.equal(receivableUsd.shouldRegister, true)
assert.equal(receivableUsd.pendingCurrency, 'USD')
assert.equal(receivableUsd.pendingAmount, 75)

const receivableBs = calculateReceivable({ totalUsd: 100, payments: [{ method: 'Pago en Bs', rawAmount: 17500 }], paymentMethod: 'Pago en Bs', exchangeRate: 700, reservationId: 'R2', module: 'lodging' })
assert.equal(receivableBs.shouldRegister, true)
assert.equal(receivableBs.pendingCurrency, 'Bs')
assert.equal(receivableBs.pendingAmount, 52500)

assert.equal(buildReceivableRecord({ totalUsd: 100, payments: [], paymentMethod: 'Zelle', exchangeRate: 700 }), null)
assert.deepEqual(buildReceivableRecord({ totalUsd: 100, payments: [{ method: 'Zelle', rawAmount: 50 }], paymentMethod: 'Zelle', exchangeRate: 700, reservationId: 'R3' })?.currency, 'USD')
assert.equal(buildPayableRecord({ ownerShareUsd: 80, collectedUsd: 50, totalUsd: 100, paymentMethod: 'Zelle', exchangeRate: 700, reservationId: 'R4' })?.amount, 40)

const app = fs.readFileSync('src/App.jsx', 'utf8')
assert.match(app, /V211\.1 Hotfix/, 'V213 no debe remover hotfix financiero V211.1')

console.log('✅ V213 Núcleo financiero puro validado')
