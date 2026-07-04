// V224 Sprint 5 - Servicio de negocio financiero.
// Capa orquestadora pura: reutiliza núcleos existentes sin cambiar reglas estables de App.jsx.

import { roundMoney, convertBsToUsd, convertUsdToBs, operationalCurrencyForMethod } from '../../modules/financial/currencyCore.js'
import { normalizePaymentAmount, normalizePayments, totalPaidUsd, totalPaidBs, paymentMutationGuard } from '../../modules/financial/paymentCore.js'
import { calculateReceivable, buildReceivableRecord } from '../../modules/accountsReceivable/accountsReceivableCore.js'
import { buildPayableRecord } from '../../modules/accountsPayable/accountsPayableCore.js'

export {
  roundMoney,
  convertBsToUsd,
  convertUsdToBs,
  operationalCurrencyForMethod,
  normalizePaymentAmount,
  normalizePayments,
  totalPaidUsd,
  totalPaidBs,
  paymentMutationGuard,
  calculateReceivable,
  buildReceivableRecord,
  buildPayableRecord,
}

export function buildFinancialSettlement({ totalUsd = 0, payments = [], paymentMethod = '', exchangeRate = 0, reservationId = '', module = '', ownerShareUsd = 0 } = {}) {
  const normalizedPayments = normalizePayments(payments, exchangeRate)
  const paidUsd = totalPaidUsd(normalizedPayments, exchangeRate)
  const paidBs = totalPaidBs(normalizedPayments, exchangeRate)
  const receivable = calculateReceivable({ totalUsd, payments: normalizedPayments, paymentMethod, exchangeRate, reservationId, module })
  const payable = buildPayableRecord({ ownerShareUsd, collectedUsd: paidUsd, totalUsd, paymentMethod, exchangeRate, reservationId, module })

  return {
    totalUsd: roundMoney(totalUsd),
    paidUsd,
    paidBs,
    pendingUsd: roundMoney(Math.max(0, Number(totalUsd || 0) - paidUsd)),
    paymentCurrency: operationalCurrencyForMethod(paymentMethod),
    payments: normalizedPayments,
    receivable,
    payable,
  }
}
