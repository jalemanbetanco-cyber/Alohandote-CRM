import { buildAuditLog, shouldAudit } from './auditHelpers.js'

export function createAuditEntry(input) {
  return buildAuditLog(input)
}

async function defaultSaveAuditLog(log) {
  const { saveAuditLog } = await import('./auditRepository.js')
  return saveAuditLog(log)
}

export async function recordAudit(input, options = {}) {
  if (!shouldAudit(input)) return null
  const log = buildAuditLog(input)
  const save = options.save || defaultSaveAuditLog
  return save(log)
}

export function createReservationAudit({ moduleName, action, reservationId, before, after, user }) {
  return buildAuditLog({
    modulo: moduleName,
    accion: action,
    entidadId: reservationId || after?.id || before?.id || '',
    usuario: user?.displayName || user?.email || 'Sistema',
    userId: user?.uid || '',
    descripcion: `${action} reserva`,
    antes: before,
    despues: after
  })
}

export function createPaymentAudit({ action, reservationId, paymentId, before, after, user, moduleName = 'abonos' }) {
  return buildAuditLog({
    modulo: moduleName,
    accion: action,
    entidadId: paymentId || after?.id || before?.id || reservationId || '',
    usuario: user?.displayName || user?.email || 'Sistema',
    userId: user?.uid || '',
    descripcion: `${action} abono`,
    antes: before,
    despues: after,
    metadata: { reservationId }
  })
}
