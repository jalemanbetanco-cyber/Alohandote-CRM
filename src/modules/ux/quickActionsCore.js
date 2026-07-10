import { UX_MODULES } from './uxTypes.js'

const normalize = value => String(value || '').trim().toLowerCase()

export function buildQuickAction({ id, label, module, priority = 50, enabled = true, reason = '' }) {
  return { id, label, module, priority, enabled, reason }
}

export function getOperationalQuickActions({ todayReservations = [], pendingReceivables = [], pendingPayables = [], healthIssues = [] } = {}) {
  const actions = []

  if (todayReservations.length > 0) {
    actions.push(buildQuickAction({ id: 'today-checkins', label: 'Ver reservas de hoy', module: UX_MODULES.CALENDAR, priority: 10 }))
  }

  if (pendingReceivables.length > 0) {
    actions.push(buildQuickAction({ id: 'pending-cxc', label: 'Revisar cuentas por cobrar', module: UX_MODULES.CASHBOX, priority: 20 }))
  }

  if (pendingPayables.length > 0) {
    actions.push(buildQuickAction({ id: 'pending-cxp', label: 'Revisar cuentas por pagar', module: UX_MODULES.CASHBOX, priority: 30 }))
  }

  const criticalHealth = healthIssues.filter(issue => normalize(issue.status) === 'critical')
  if (criticalHealth.length > 0) {
    actions.push(buildQuickAction({ id: 'health-critical', label: 'Resolver alertas críticas', module: 'salud_operacional', priority: 5, reason: `${criticalHealth.length} alerta(s) crítica(s)` }))
  }

  return actions.sort((a, b) => a.priority - b.priority)
}

export function buildEmptyState({ module, hasFilters = false } = {}) {
  if (hasFilters) {
    return {
      title: 'No hay resultados con estos filtros',
      message: 'Limpia los filtros o amplía el rango de búsqueda.',
      action: 'Limpiar filtros'
    }
  }

  const labels = {
    [UX_MODULES.LODGING]: ['Aún no hay alojamientos cargados', 'Agrega tu primer alojamiento para comenzar a reservar.', 'Crear alojamiento'],
    [UX_MODULES.RENTCAR]: ['Aún no hay vehículos cargados', 'Agrega tu primer vehículo para comenzar a reservar.', 'Crear vehículo'],
    [UX_MODULES.CALENDAR]: ['No hay eventos para esta fecha', 'Selecciona otra fecha o crea una nueva reserva.', 'Crear reserva'],
    [UX_MODULES.DOCUMENTS]: ['No hay documentos generados', 'Genera una cotización o recibo desde una reserva.', 'Generar documento']
  }

  const [title, message, action] = labels[module] || ['Sin información disponible', 'Cuando existan datos, aparecerán en esta sección.', 'Actualizar']
  return { title, message, action }
}
