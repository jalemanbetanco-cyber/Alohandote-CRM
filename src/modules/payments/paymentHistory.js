// V208 - Servicios puros para historial de abonos.
// Este módulo encapsula reglas ya estabilizadas para pruebas y futura extracción gradual desde App.jsx.

export function paymentTraceKey(payment = {}) {
  return payment.paymentTraceId || `${String(payment.date || '').slice(0, 19)}|${payment.method || ''}|${Number(payment.rawAmount || 0)}|${Number(payment.amountBs || 0)}|${Number(payment.amountUsd || 0)}|${payment.reference || ''}`
}

export function dedupePaymentHistory(payments = []) {
  const seen = new Set()
  return payments.filter((payment) => {
    const key = paymentTraceKey(payment)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function appendPaymentOnce(existingPayments = [], newPayment = null) {
  if (!newPayment) return existingPayments
  const key = paymentTraceKey(newPayment)
  return existingPayments.some((payment) => paymentTraceKey(payment) === key)
    ? existingPayments
    : [...existingPayments, newPayment]
}

export function shouldAppendPaymentOnSave(draft = {}, resolvedEditingId = '') {
  if (draft?._paymentsEdited) return false
  const raw = Number(draft.amount || 0)
  if (!raw) return false
  if (!resolvedEditingId) return true
  const original = Number(draft._originalPaymentAmount || 0)
  return Math.abs(raw - original) > 0.009
}

export function updatePaymentAt(payments = [], index = -1, patch = {}) {
  if (!Array.isArray(payments)) return []
  return dedupePaymentHistory(payments.map((payment, currentIndex) => (
    currentIndex === index ? { ...payment, ...patch, updatedAt: patch.updatedAt || new Date(0).toISOString() } : payment
  )))
}

export function removePaymentAt(payments = [], index = -1) {
  if (!Array.isArray(payments)) return []
  return payments.filter((_, currentIndex) => currentIndex !== index)
}

export function summarizePaymentsByMethod(payments = []) {
  return dedupePaymentHistory(payments).reduce((acc, payment) => {
    const method = payment.method || payment.paymentMethod || 'Sin método'
    const current = acc[method] || { method, count: 0, amountUsd: 0, amountBs: 0 }
    current.count += 1
    current.amountUsd = Number((current.amountUsd + Number(payment.amountUsd || 0)).toFixed(2))
    current.amountBs = Number((current.amountBs + Number(payment.amountBs || 0)).toFixed(2))
    acc[method] = current
    return acc
  }, {})
}
