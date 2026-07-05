import { AUDIT_VERSION } from './auditTypes.js'

const REDACTED = '[redactado]'
const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'apiKey',
  'secret',
  'authorization',
  'vercelOidcToken',
  'VERCEL_OIDC_TOKEN'
])

export function stableNow() {
  return new Date().toISOString()
}

export function sanitizeAuditValue(value, depth = 0) {
  if (value == null) return value
  if (depth > 4) return '[profundidad_maxima]'
  if (Array.isArray(value)) return value.slice(0, 50).map((item) => sanitizeAuditValue(item, depth + 1))
  if (value instanceof Date) return value.toISOString()
  if (typeof value !== 'object') return value

  return Object.fromEntries(
    Object.entries(value).map(([key, val]) => {
      if (SENSITIVE_KEYS.has(key) || /password|token|secret|apikey|authorization/i.test(key)) {
        return [key, REDACTED]
      }
      return [key, sanitizeAuditValue(val, depth + 1)]
    })
  )
}

export function diffKeys(before = {}, after = {}) {
  const keys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})])
  return [...keys].filter((key) => JSON.stringify(before?.[key] ?? null) !== JSON.stringify(after?.[key] ?? null)).sort()
}

export function buildAuditLog({
  modulo,
  accion,
  entidadId = '',
  usuario = 'Sistema',
  userId = '',
  descripcion = '',
  antes = null,
  despues = null,
  metadata = {},
  origen = 'web',
  fecha = stableNow(),
  versionSistema = AUDIT_VERSION
}) {
  const safeBefore = sanitizeAuditValue(antes)
  const safeAfter = sanitizeAuditValue(despues)
  return {
    modulo,
    accion,
    entidadId: entidadId || '',
    usuario: usuario || 'Sistema',
    userId: userId || '',
    fecha,
    descripcion: descripcion || `${accion} en ${modulo}`,
    antes: safeBefore,
    despues: safeAfter,
    cambios: safeBefore && safeAfter ? diffKeys(safeBefore, safeAfter) : [],
    metadata: sanitizeAuditValue(metadata || {}),
    versionSistema,
    origen,
    immutable: true
  }
}

export function shouldAudit(action) {
  return Boolean(action?.modulo && action?.accion)
}
