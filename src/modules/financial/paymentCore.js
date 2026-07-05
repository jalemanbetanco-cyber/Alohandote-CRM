// V213 - Núcleo financiero puro para normalización de abonos.
// Mantiene compatibilidad con estructuras históricas usadas por App.jsx.

import { convertBsToUsd, convertUsdToBs, operationalCurrencyForMethod, roundMoney } from './currencyCore.js'

export function normalizePaymentAmount(payment = {}, exchangeRate = 0) {
  const method = payment.method || payment.paymentMethod || payment.formaPago || ''
  const currency = payment.currency || payment.paymentCurrency || operationalCurrencyForMethod(method)
  const rawAmount = Number(payment.rawAmount ?? payment.amount ?? payment.amountPaid ?? 0)
  const amountUsd = Number(payment.amountUsd ?? (currency === 'Bs' ? convertBsToUsd(rawAmount, exchangeRate) : rawAmount) ?? 0)
  const amountBs = Number(payment.amountBs ?? (currency === 'Bs' ? rawAmount : convertUsdToBs(rawAmount, exchangeRate)) ?? 0)

  return {
    ...payment,
    method,
    paymentCurrency: currency,
    rawAmount: roundMoney(rawAmount),
    amountUsd: roundMoney(amountUsd),
    amountBs: roundMoney(amountBs),
  }
}

export function normalizePayments(payments = [], exchangeRate = 0) {
  if (!Array.isArray(payments)) return []
  return payments.map((payment) => normalizePaymentAmount(payment, exchangeRate))
}

export function totalPaidUsd(payments = [], exchangeRate = 0) {
  return roundMoney(normalizePayments(payments, exchangeRate).reduce((sum, payment) => sum + Number(payment.amountUsd || 0), 0))
}

export function totalPaidBs(payments = [], exchangeRate = 0) {
  return roundMoney(normalizePayments(payments, exchangeRate).reduce((sum, payment) => sum + Number(payment.amountBs || 0), 0))
}

export function paymentMutationGuard({ originalPayments = [], visibleDraftPayments = [], paymentsEdited = false } = {}) {
  // Si el usuario editó o eliminó abonos, el borrador visible manda.
  // Esta regla evita que al guardar vuelva a persistirse el historial viejo.
  return paymentsEdited ? visibleDraftPayments : originalPayments
}
