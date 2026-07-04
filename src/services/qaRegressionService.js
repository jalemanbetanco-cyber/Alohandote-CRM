// V209 - Servicio puro de matriz QA/regresión.
// No modifica flujos de App.jsx. Sirve para automatizar criterios GO/NO-GO antes de desplegar.

export const REGRESSION_CRITICAL_FLOWS = [
  { id: 'auth-login', module: 'Autenticación', name: 'Login aprobado', severity: 'critical' },
  { id: 'rentcar-calendar-open-date', module: 'Renta Car', name: 'Abrir cualquier fecha del calendario sin error visual', severity: 'critical' },
  { id: 'rentcar-quote', module: 'Renta Car', name: 'Generar cotización Renta Car', severity: 'critical' },
  { id: 'rentcar-reservation', module: 'Renta Car', name: 'Crear reserva Renta Car', severity: 'critical' },
  { id: 'payments-no-duplicate', module: 'Abonos', name: 'Guardar/editar sin duplicar abonos', severity: 'critical' },
  { id: 'payments-edit-delete', module: 'Abonos', name: 'Editar y eliminar abonos en ambos módulos', severity: 'high' },
  { id: 'cashbox-by-method', module: 'Caja', name: 'Caja respeta método de pago', severity: 'critical' },
  { id: 'lodging-allied', module: 'Alojamientos', name: 'Alojamiento aliado calcula ingreso real y propietario', severity: 'critical' },
  { id: 'pdf-documents', module: 'Documentos', name: 'PDF recibo/cotización con branding aprobado', severity: 'high' },
  { id: 'ical-regression', module: 'iCal', name: 'Sin regresión en import/export iCal', severity: 'high' },
]

const normalizeStatus = (value = '') => String(value || '').trim().toLowerCase()

export function buildRegressionMatrix(results = []) {
  const byId = new Map(results.map((item) => [item.id, item]))
  return REGRESSION_CRITICAL_FLOWS.map((flow) => {
    const result = byId.get(flow.id) || {}
    const status = normalizeStatus(result.status || 'pending')
    return {
      ...flow,
      status: status || 'pending',
      passed: ['pass', 'passed', 'ok', 'aprobado'].includes(status),
      failed: ['fail', 'failed', 'error', 'fallido', 'bloqueado'].includes(status),
      evidence: result.evidence || '',
      owner: result.owner || 'QA',
    }
  })
}

export function evaluateRegressionGoNoGo(results = []) {
  const matrix = buildRegressionMatrix(results)
  const executed = matrix.filter((item) => item.status !== 'pending')
  const passed = matrix.filter((item) => item.passed)
  const failed = matrix.filter((item) => item.failed)
  const criticalFailed = failed.filter((item) => item.severity === 'critical')
  const passRate = matrix.length ? Number(((passed.length / matrix.length) * 100).toFixed(2)) : 0

  let decision = 'NO-GO'
  if (!criticalFailed.length && passRate >= 90) decision = 'GO'
  else if (!criticalFailed.length && passRate >= 75) decision = 'GO_CON_OBSERVACIONES'

  return {
    decision,
    passRate,
    total: matrix.length,
    executed: executed.length,
    passed: passed.length,
    failed: failed.length,
    pending: matrix.length - executed.length,
    criticalFailed: criticalFailed.map((item) => item.id),
    matrix,
  }
}

export function regressionChecklistMarkdown(results = []) {
  const report = evaluateRegressionGoNoGo(results)
  const rows = report.matrix.map((item) => `| ${item.module} | ${item.name} | ${item.severity} | ${item.status} | ${item.evidence || '-'} |`)
  return [
    `# Reporte de Regresión V209`,
    ``,
    `Decisión: **${report.decision}**`,
    `Cobertura aprobada: **${report.passRate}%**`,
    ``,
    `| Módulo | Flujo | Severidad | Estado | Evidencia |`,
    `|---|---|---:|---:|---|`,
    ...rows,
  ].join('\n')
}

export const v209ValidationCommands = [
  'npm install',
  'npm run production:check',
  'npm run build',
  'vercel --prod',
]
