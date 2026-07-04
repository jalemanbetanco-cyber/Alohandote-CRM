// V126 - Dominio de pagos y montos
// Servicios puros para facilitar pruebas y mantenimiento.
// No usa React ni Firebase.

export function num(value) {
  return Number(value || 0)
}

export function euroRateValue(exchangeRates, fallback = '') {
  return Number(fallback || exchangeRates?.bcvEuro || 0)
}

export function dollarRateValue(exchangeRates, fallback = '') {
  return Number(exchangeRates?.bcvDollar || fallback || exchangeRates?.bcvEuro || 0)
}

export function amountBs(value, exchangeRates, fallbackRate = '') {
  return Number((num(value) * euroRateValue(exchangeRates, fallbackRate)).toFixed(2))
}

export function paymentBucket(method = '') {
  const key = String(method || '').toLowerCase()
  if (key.includes('zelle')) return 'Zelle'
  if (key.includes('binance') || key.includes('usdt')) return 'Binance'
  if (key.includes('bs') || key.includes('bolivar') || key.includes('bolívar') || key.includes('pago móvil') || key.includes('pago movil') || key.includes('transferencia')) return 'Bs'
  if (key.includes('efectivo') || key.includes('cash') || key.includes('dólar') || key.includes('dolar')) return 'Efectivo $'
  return 'Sin método'
}

export function isBsPaymentMethod(method = '') {
  return paymentBucket(method) === 'Bs'
}

export function paymentAmountUsd(rawAmount, method, exchangeRates, fallbackRate = '') {
  const raw = num(rawAmount)
  if (!raw) return 0
  const rate = euroRateValue(exchangeRates, fallbackRate)
  return isBsPaymentMethod(method) && rate ? Number((raw / rate).toFixed(2)) : raw
}

export function paymentAmountBs(rawAmount, method, exchangeRates, fallbackRate = '') {
  const raw = num(rawAmount)
  if (!raw) return 0
  return isBsPaymentMethod(method) ? raw : amountBs(raw, exchangeRates, fallbackRate)
}

export function pendingAmount(reservation, exchangeRates = null) {
  return Math.max(0, num(reservation.totalAmount) - paymentAmountUsd(reservation.amount, reservation.paymentMethod, exchangeRates, reservation.bcvEuroRate))
}

export function moneyDual(value, exchangeRates, fallbackRate = '') {
  return `${value} USD / ${amountBs(value, exchangeRates, fallbackRate)} Bs`
}

export function frozenEuroRateForRecord(record = {}, exchangeRates = null) {
  return euroRateValue(exchangeRates, record.bcvEuroRate || record.exchangeRateSnapshot || '')
}
