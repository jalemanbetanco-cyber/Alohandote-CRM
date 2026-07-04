import { HEALTH_STATUS, HEALTH_MODULES } from './healthTypes.js'

const toNumber = value => Number.isFinite(Number(value)) ? Number(value) : 0
const normalizeId = value => value == null ? '' : String(value).trim()
const isCancelled = item => ['cancelled', 'canceled', 'anulada', 'anulado', 'void'].includes(String(item?.status || item?.estado || '').toLowerCase())
const isPaid = item => ['paid', 'pagado', 'cerrado', 'closed'].includes(String(item?.status || item?.estado || '').toLowerCase())
const hasValue = value => normalizeId(value).length > 0

export function createHealthIssue({ module, code, status = HEALTH_STATUS.WARNING, title, description, entityId = '', metadata = {} }) {
  return {
    module,
    code,
    status,
    title,
    description,
    entityId: normalizeId(entityId),
    metadata: metadata && typeof metadata === 'object' ? metadata : {}
  }
}

export function detectReservationsWithoutCashMovement({ reservations = [], cashMovements = [] } = {}) {
  const movementReservationIds = new Set(cashMovements.map(item => normalizeId(item?.reservationId || item?.bookingId)).filter(Boolean))

  return reservations
    .filter(item => !isCancelled(item))
    .filter(item => toNumber(item?.paidAmount ?? item?.abono ?? item?.amountPaid) > 0)
    .filter(item => !movementReservationIds.has(normalizeId(item?.id)))
    .map(item => createHealthIssue({
      module: HEALTH_MODULES.PAYMENTS,
      code: 'PAYMENT_WITHOUT_CASH_MOVEMENT',
      status: HEALTH_STATUS.CRITICAL,
      title: 'Abono sin movimiento de caja',
      description: 'Existe una reserva con abono registrado pero sin movimiento de caja asociado.',
      entityId: item?.id,
      metadata: { paidAmount: toNumber(item?.paidAmount ?? item?.abono ?? item?.amountPaid) }
    }))
}

export function detectOpenReceivablesMismatch({ reservations = [], receivables = [] } = {}) {
  const receivableByReservation = new Map()
  for (const receivable of receivables) {
    const reservationId = normalizeId(receivable?.reservationId || receivable?.bookingId)
    if (!reservationId || isPaid(receivable) || isCancelled(receivable)) continue
    receivableByReservation.set(reservationId, (receivableByReservation.get(reservationId) || 0) + toNumber(receivable?.amount ?? receivable?.amountUsd ?? receivable?.saldo ?? receivable?.pendingAmount))
  }

  return reservations
    .filter(item => !isCancelled(item))
    .map(item => {
      const total = toNumber(item?.total ?? item?.totalAmount ?? item?.totalUsd)
      const paid = toNumber(item?.paidAmount ?? item?.amountPaid ?? item?.abono)
      const pending = Math.max(0, total - paid)
      const cxc = receivableByReservation.get(normalizeId(item?.id)) || 0
      if (pending <= 0 || cxc > 0) return null
      return createHealthIssue({
        module: HEALTH_MODULES.ACCOUNTS_RECEIVABLE,
        code: 'PENDING_BALANCE_WITHOUT_CXC',
        status: HEALTH_STATUS.CRITICAL,
        title: 'Saldo pendiente sin cuenta por cobrar',
        description: 'La reserva mantiene saldo pendiente, pero no existe CxC abierta asociada.',
        entityId: item?.id,
        metadata: { total, paid, pending }
      })
    })
    .filter(Boolean)
}

export function detectOwnerPayablesMismatch({ allyReservations = [], payables = [] } = {}) {
  const payableReservationIds = new Set(
    payables
      .filter(item => !isPaid(item) && !isCancelled(item))
      .map(item => normalizeId(item?.reservationId || item?.bookingId))
      .filter(Boolean)
  )

  return allyReservations
    .filter(item => !isCancelled(item))
    .filter(item => String(item?.propertyType || item?.tipoPropiedad || '').toLowerCase() === 'aliada' || item?.isAlly === true)
    .filter(item => toNumber(item?.ownerPayable ?? item?.montoPropietario ?? item?.ownerAmount) > 0)
    .filter(item => !payableReservationIds.has(normalizeId(item?.id)))
    .map(item => createHealthIssue({
      module: HEALTH_MODULES.ACCOUNTS_PAYABLE,
      code: 'ALLY_OWNER_PAYABLE_MISSING',
      status: HEALTH_STATUS.WARNING,
      title: 'Alojamiento aliado sin CxP abierta',
      description: 'Existe monto por pagar al propietario, pero no hay cuenta por pagar asociada.',
      entityId: item?.id,
      metadata: { ownerPayable: toNumber(item?.ownerPayable ?? item?.montoPropietario ?? item?.ownerAmount) }
    }))
}

export function detectIcalConflicts({ reservations = [], icalEvents = [] } = {}) {
  const reservationKeys = new Set(reservations.filter(item => !isCancelled(item)).map(item => `${normalizeId(item?.assetId || item?.vehicleId || item?.accommodationId)}|${normalizeId(item?.startDate || item?.checkIn)}|${normalizeId(item?.endDate || item?.checkOut)}`))

  return icalEvents
    .filter(event => !isCancelled(event))
    .map(event => {
      const key = `${normalizeId(event?.assetId || event?.vehicleId || event?.accommodationId)}|${normalizeId(event?.startDate || event?.checkIn)}|${normalizeId(event?.endDate || event?.checkOut)}`
      if (!hasValue(key.replace(/\|/g, '')) || reservationKeys.has(key)) return null
      return createHealthIssue({
        module: HEALTH_MODULES.ICAL,
        code: 'ICAL_EVENT_WITHOUT_LOCAL_RESERVATION',
        status: HEALTH_STATUS.WARNING,
        title: 'Evento iCal sin reserva local equivalente',
        description: 'Se detectó un bloqueo iCal que no coincide con una reserva local activa.',
        entityId: event?.id,
        metadata: { key }
      })
    })
    .filter(Boolean)
}

export function calculateHealthSummary(issues = []) {
  const summary = {
    total: issues.length,
    critical: 0,
    warning: 0,
    ok: 0,
    byModule: {}
  }

  for (const issue of issues) {
    if (issue.status === HEALTH_STATUS.CRITICAL) summary.critical += 1
    else if (issue.status === HEALTH_STATUS.WARNING) summary.warning += 1
    else summary.ok += 1
    summary.byModule[issue.module] = (summary.byModule[issue.module] || 0) + 1
  }

  return {
    ...summary,
    status: summary.critical > 0 ? HEALTH_STATUS.CRITICAL : summary.warning > 0 ? HEALTH_STATUS.WARNING : HEALTH_STATUS.OK
  }
}

export function buildOperationalHealthReport(input = {}) {
  const issues = [
    ...detectReservationsWithoutCashMovement(input),
    ...detectOpenReceivablesMismatch(input),
    ...detectOwnerPayablesMismatch(input),
    ...detectIcalConflicts(input)
  ]

  return {
    generatedAt: new Date().toISOString(),
    version: 'V215',
    status: calculateHealthSummary(issues).status,
    summary: calculateHealthSummary(issues),
    issues
  }
}
