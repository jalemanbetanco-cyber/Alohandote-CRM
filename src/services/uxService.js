// V131 - Servicio UX
// Funciones puras para mejorar consistencia mobile/web sin tocar lógica operativa.

export function uxDensityForWidth(width = 1200) {
  const value = Number(width || 0)
  if (value <= 480) return 'compact'
  if (value <= 900) return 'comfortable'
  return 'desktop'
}

export function touchTargetSize(width = 1200) {
  return uxDensityForWidth(width) === 'desktop' ? 40 : 44
}

export function readableEmptyState(count = 0, label = 'registros') {
  return Number(count || 0) === 0 ? `No hay ${label} para mostrar.` : `${count} ${label}`
}

export function shouldUseCardTable(width = 1200) {
  return Number(width || 0) <= 760
}

export function uxChecklist() {
  return [
    'Botones táctiles mínimos de 44px en mobile',
    'Tablas con scroll horizontal controlado',
    'Estados focus visibles para teclado',
    'Modales con altura máxima y scroll interno',
    'Inputs a 16px para evitar zoom accidental en iOS',
    'Acciones principales legibles en mobile',
  ]
}
