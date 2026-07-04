// V213 - Núcleo puro de cuentas por cobrar.
// Regla: toda reserva con abono real y saldo pendiente debe generar CxC,
// independientemente de si el abono fue en Bs, Zelle, USDT o efectivo USD.

import { operationalCurrencyForMethod, roundMoney, convertUsdToBs } from '../financial/currencyCore.js'
import { totalPaidUsd } from '../financial/paymentCore.js'

export function calculateReceivable({ totalUsd = 0, payments = [], paymentMethod = '', exchangeRate = 0, reservationId = '', module = '' } = {}) {
  const total = roundMoney(totalUsd)
  const paidUsd = totalPaidUsd(payments, exchangeRate)
  const pendingUsd = roundMoney(Math.max(0, total - paidUsd))
  const hasCollectedPayment = paidUsd > 0
  const pendingCurrency = operationalCurrencyForMethod(paymentMethod || payments?.[0]?.method || payments?.[0]?.paymentMethod || '')
  const pendingAmount = pendingCurrency === 'Bs' ? convertUsdToBs(pendingUsd, exchangeRate) : pendingUsd

  return {
    shouldRegister: hasCollectedPayment && pendingUsd > 0,
    reservationId,
    module,
    totalUsd: total,
    paidUsd,
    pendingUsd,
    pendingCurrency,
    pendingAmount: roundMoney(pendingAmount),
  }
}

export function buildReceivableRecord(input = {}) {
  const result = calculateReceivable(input)
  if (!result.shouldRegister) return null
  return {
    type: 'accountsReceivable',
    status: 'pending',
    reservationId: result.reservationId,
    module: result.module,
    amount: result.pendingAmount,
    currency: result.pendingCurrency,
    pendingUsd: result.pendingUsd,
    paidUsd: result.paidUsd,
    totalUsd: result.totalUsd,
  }
}
