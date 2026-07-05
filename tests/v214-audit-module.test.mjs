import assert from 'node:assert/strict'
import { buildAuditLog, diffKeys, sanitizeAuditValue } from '../src/modules/audit/auditHelpers.js'
import { AUDIT_ACTIONS, AUDIT_MODULES, AUDIT_VERSION } from '../src/modules/audit/auditTypes.js'
import { createPaymentAudit, recordAudit } from '../src/modules/audit/auditService.js'

const sanitized = sanitizeAuditValue({
  cliente: 'Jose',
  token: 'abc',
  nested: { apiKey: 'secret', amount: 10 }
})
assert.equal(sanitized.token, '[redactado]')
assert.equal(sanitized.nested.apiKey, '[redactado]')
assert.equal(sanitized.nested.amount, 10)

assert.deepEqual(diffKeys({ a: 1, b: 2 }, { a: 1, b: 3, c: 4 }), ['b', 'c'])

const log = buildAuditLog({
  modulo: AUDIT_MODULES.RENTCAR,
  accion: AUDIT_ACTIONS.UPDATE,
  entidadId: 'RES-1',
  usuario: 'Jose Aleman',
  userId: 'uid-1',
  antes: { total: 100, estado: 'pendiente' },
  despues: { total: 100, estado: 'confirmada' }
})
assert.equal(log.versionSistema, AUDIT_VERSION)
assert.equal(log.immutable, true)
assert.deepEqual(log.cambios, ['estado'])

const paymentLog = createPaymentAudit({
  action: AUDIT_ACTIONS.PAYMENT_DELETE,
  reservationId: 'R-1',
  paymentId: 'P-1',
  before: { amount: 20, method: 'zelle' },
  after: null,
  user: { displayName: 'Jose', uid: 'u1' }
})
assert.equal(paymentLog.entidadId, 'P-1')
assert.equal(paymentLog.metadata.reservationId, 'R-1')

let savedLog = null
const savedId = await recordAudit({ modulo: AUDIT_MODULES.CASHBOX, accion: AUDIT_ACTIONS.CASHBOX_CHANGE }, {
  save: async (entry) => {
    savedLog = entry
    return 'audit-1'
  }
})
assert.equal(savedId, 'audit-1')
assert.equal(savedLog.modulo, AUDIT_MODULES.CASHBOX)

const skipped = await recordAudit({ modulo: '', accion: '' }, { save: async () => 'bad' })
assert.equal(skipped, null)

console.log('V214 audit module tests passed')
