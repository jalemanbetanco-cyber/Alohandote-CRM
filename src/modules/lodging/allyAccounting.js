// V208 - Dominio puro para alojamientos aliados.
// No modifica flujos actuales. Deja la regla financiera aislada para futuras versiones.

const num = (value) => Number(value || 0)

export function isAlliedAccommodation(apt = {}) {
  return String(apt.ownershipType || apt.accommodationType || '')
    .trim()
    .toLowerCase() === 'aliado'
}

export function allyIncomeTargetUsd(total = 0, mode = 'fixed', value = 0) {
  const t = num(total)
  const v = num(value)
  if (!t) return 0
  if (String(mode || '').toLowerCase().includes('percent')) {
    return Number(Math.min(t, Math.max(0, (t * v) / 100)).toFixed(2))
  }
  return Number(Math.min(t, Math.max(0, v)).toFixed(2))
}

export function calculateAllyBreakdown({ totalAmount = 0, paidUsd = 0, paidBs = 0, profitMode = 'fixed', profitValue = 0, isAlly = false } = {}) {
  const total = num(totalAmount)
  const targetIncome = isAlly ? allyIncomeTargetUsd(total, profitMode, profitValue) : total
  const ownerTarget = isAlly ? Math.max(0, Number((total - targetIncome).toFixed(2))) : 0
  const ratio = total > 0 ? Math.min(1, num(paidUsd) / total) : 0
  const alohandoteCollectedUsd = isAlly ? Number((targetIncome * ratio).toFixed(2)) : num(paidUsd)
  const ownerPayableUsd = isAlly ? Number((ownerTarget * ratio).toFixed(2)) : 0
  const alohandoteCollectedBs = num(paidUsd) > 0 ? Number((num(paidBs) * (alohandoteCollectedUsd / num(paidUsd))).toFixed(2)) : 0
  const ownerPayableBs = num(paidUsd) > 0 ? Number((num(paidBs) * (ownerPayableUsd / num(paidUsd))).toFixed(2)) : 0
  return { isAlly, targetIncome, ownerTarget, alohandoteCollectedUsd, ownerPayableUsd, alohandoteCollectedBs, ownerPayableBs }
}
