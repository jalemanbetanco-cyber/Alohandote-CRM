// V213 - Núcleo puro de cuentas por pagar.
// Preparado para alojamientos aliados y futuros proveedores sin alterar la UI actual.

import { operationalCurrencyForMethod, roundMoney, convertUsdToBs } from '../financial/currencyCore.js'

export function calculatePayable({ ownerShareUsd = 0, collectedUsd = 0, totalUsd = 0, paymentMethod = '', exchangeRate = 0, reservationId = '', ownerId = '' } = {}) {
  const total = roundMoney(totalUsd)
  const ratio = total > 0 ? Math.min(1, Number(collectedUsd || 0) / total) : 0
  const payableUsd = roundMoney(Math.max(0, Number(ownerShareUsd || 0) * ratio))
  const currency = operationalCurrencyForMethod(paymentMethod)
  const amount = currency === 'Bs' ? convertUsdToBs(payableUsd, exchangeRate) : payableUsd

  return {
    shouldRegister: payableUsd > 0,
    reservationId,
    ownerId,
    payableUsd,
    currency,
    amount: roundMoney(amount),
  }
}

export function buildPayableRecord(input = {}) {
  const result = calculatePayable(input)
  if (!result.shouldRegister) return null
  return {
    type: 'accountsPayable',
    status: 'pending',
    reservationId: result.reservationId,
    ownerId: result.ownerId,
    amount: result.amount,
    currency: result.currency,
    payableUsd: result.payableUsd,
  }
}
