// V130 - Servicio de salud del sistema
// Funciones puras para monitorear errores, estado operativo y señales de riesgo.

export function severityForEvent(event = {}) {
  const text = `${event.level || ''} ${event.type || ''} ${event.message || ''}`.toLowerCase()
  if (text.includes('permission') || text.includes('denied') || text.includes('seguridad')) return 'critical'
  if (text.includes('firebase') || text.includes('storage') || text.includes('auth') || text.includes('token')) return 'high'
  if (text.includes('warning') || text.includes('timeout') || text.includes('fallback')) return 'medium'
  return event.severity || 'low'
}

export function buildHealthEvent(input = {}) {
  const createdAt = input.createdAt || new Date().toISOString()
  return {
    id: input.id || `health-${createdAt}-${Math.random().toString(36).slice(2, 8)}`,
    type: input.type || 'system',
    level: input.level || 'info',
    severity: input.severity || severityForEvent(input),
    message: String(input.message || 'Evento del sistema'),
    module: input.module || 'Sistema',
    detail: input.detail || '',
    source: input.source || 'client',
    createdAt,
    userEmail: input.userEmail || '',
    userRole: input.userRole || '',
  }
}

export function healthStatus(events = [], context = {}) {
  const recent = Array.isArray(events) ? events : []
  const critical = recent.filter((event) => severityForEvent(event) === 'critical').length
  const high = recent.filter((event) => severityForEvent(event) === 'high').length
  const medium = recent.filter((event) => severityForEvent(event) === 'medium').length

  if (context.firebaseReady === false && context.demoMode) return { status: 'ok', label: 'Modo demo local', critical, high, medium }
  if (context.firebaseReady === false) return { status: 'warning', label: 'Firebase no disponible', critical, high, medium }
  if (critical > 0) return { status: 'critical', label: 'Revisar permisos / seguridad', critical, high, medium }
  if (high > 2) return { status: 'warning', label: 'Errores altos acumulados', critical, high, medium }
  if (medium > 5) return { status: 'warning', label: 'Advertencias acumuladas', critical, high, medium }
  return { status: 'ok', label: 'Sistema operativo', critical, high, medium }
}

export function buildHealthSnapshot(input = {}) {
  const events = input.events || []
  const stores = input.stores || {}
  const status = healthStatus(events, input.context || {})
  const collections = Object.fromEntries(Object.entries(stores).map(([name, rows]) => [name, Array.isArray(rows) ? rows.length : 0]))

  return {
    generatedAt: new Date().toISOString(),
    status,
    collections,
    eventsCount: events.length,
    latestEvents: events.slice(0, 20),
  }
}

export function healthRecommendations(snapshot = {}) {
  const recommendations = []
  const status = snapshot.status || {}
  if (status.critical > 0) recommendations.push('Revisar reglas Firebase, roles y permisos.')
  if (status.high > 0) recommendations.push('Revisar conexión Firebase, Storage o Auth.')
  if ((snapshot.collections?.auditLogs || 0) === 0) recommendations.push('Confirmar que la auditoría esté registrando eventos.')
  if ((snapshot.collections?.publicOperationSubmissions || 0) > 20) recommendations.push('Sincronizar operaciones públicas pendientes.')
  if (!recommendations.length) recommendations.push('Mantener backups semanales y ejecutar quality:all antes de desplegar.')
  return recommendations
}
