// V213 - Núcleo financiero puro para moneda operativa.
// No depende de React/Firebase. Sirve para blindar pagos, CxC y CxP sin tocar flujos estables.

export const USD_METHODS = ['efectivo', 'efectivo usd', '$ efectivo', 'zelle', 'usdt', 'usd']
export const BS_METHODS = ['bs', 'bolivares', 'bolívares', 'pago en bs', 'transferencia bs', 'pago movil', 'pago móvil']

export function normalizePaymentMethod(method = '') {
  return String(method || '').trim().toLowerCase()
}

export function isBsPaymentMethod(method = '') {
  const value = normalizePaymentMethod(method)
  return BS_METHODS.some((candidate) => value === candidate || value.includes(candidate))
}

export function isUsdPaymentMethod(method = '') {
  const value = normalizePaymentMethod(method)
  return USD_METHODS.some((candidate) => value === candidate || value.includes(candidate))
}

export function operationalCurrencyForMethod(method = '') {
  return isBsPaymentMethod(method) ? 'Bs' : 'USD'
}

export function roundMoney(value = 0, decimals = 2) {
  const factor = 10 ** decimals
  return Math.round((Number(value || 0) + Number.EPSILON) * factor) / factor
}

export function convertUsdToBs(amountUsd = 0, exchangeRate = 0) {
  return roundMoney(Number(amountUsd || 0) * Number(exchangeRate || 0))
}

export function convertBsToUsd(amountBs = 0, exchangeRate = 0) {
  const rate = Number(exchangeRate || 0)
  if (!rate) return 0
  return roundMoney(Number(amountBs || 0) / rate)
}
