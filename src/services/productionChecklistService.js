// V132 - Checklist técnico de producción
// Funciones puras para evaluar readiness sin tocar la lógica operativa.

export const PRODUCTION_CHECKLIST = [
  { id: 'smoke', area: 'Calidad', title: 'Smoke test aprobado', command: 'npm run quality:smoke', required: true },
  { id: 'business', area: 'Calidad', title: 'Pruebas de negocio aprobadas', command: 'npm run test:business', required: true },
  { id: 'build', area: 'Calidad', title: 'Build productivo aprobado', command: 'npm run build', required: true },
  { id: 'rules', area: 'Seguridad', title: 'Reglas Firebase desplegadas', command: 'firebase deploy --only firestore:rules,storage --project alohandote-rent-calendar', required: true },
  { id: 'roles', area: 'Seguridad', title: 'Roles y permisos validados con usuarios reales', command: '', required: true },
  { id: 'backup', area: 'Continuidad', title: 'Backup JSON/Excel descargado y resguardado', command: '', required: true },
  { id: 'health', area: 'Observabilidad', title: 'Monitor de salud sin eventos críticos', command: '', required: true },
  { id: 'manual_regression', area: 'QA manual', title: 'Regresión manual de flujos críticos completada', command: '', required: true },
  { id: 'mobile', area: 'UX', title: 'Prueba mobile real completada', command: '', required: true },
  { id: 'rollback', area: 'Operación', title: 'Plan de reversa documentado', command: '', required: true },
  { id: 'v164_cash', area: 'QA funcional', title: 'Compra/Venta de $ validadas según V164', command: '', required: true },
  { id: 'documents', area: 'QA funcional', title: 'Cotización, contrato, recibo y catálogos validados', command: '', required: true },
  { id: 'preview', area: 'DevOps', title: 'Vercel Preview aprobado antes de producción', command: 'npm run release:go-no-go', required: true },
]

export const CRITICAL_MANUAL_FLOWS = [
  'Login admin, supervisor y operador',
  'Crear reserva Renta Car',
  'Editar reserva Renta Car',
  'Entregar vehículo',
  'Recibir vehículo',
  'Crear reserva de alojamiento',
  'Validar bloqueo iCal/Airbnb',
  'Marcar limpieza/check-out',
  'Registrar mantenimiento',
  'Validar caja y cuentas por cobrar',
  'Crear movimiento de inventario',
  'Generar backup técnico',
  'Revisar auditoría',
  'Revisar monitor de salud',
  'Generar link público seguro',
  'Sincronizar operación pública',
  'Compra de $ suma USD y descuenta Bs',
  'Venta de $ descuenta USD y suma Bs',
  'Anulación con devolución en Bs descuenta caja disponible',
  'Cotización, contrato y recibo abren con contenido',
  'Catálogo Renta Car y Alojamientos se ven bien en mobile',
]

export function productionReadinessStatus(results = {}) {
  const required = PRODUCTION_CHECKLIST.filter((item) => item.required)
  const passed = required.filter((item) => results[item.id] === true).length
  const failed = required.filter((item) => results[item.id] === false).length
  const pending = required.length - passed - failed
  const percent = required.length ? Math.round((passed / required.length) * 100) : 0

  if (failed > 0) return { status: 'NO-GO', percent, passed, failed, pending, label: 'No liberar a producción' }
  if (pending > 0) return { status: 'PENDING', percent, passed, failed, pending, label: 'Pendiente por validar' }
  return { status: 'GO', percent, passed, failed, pending, label: 'Apto para producción controlada' }
}

export function deploymentCommands() {
  return [
    'npm run quality:all',
    'npm run release:go-no-go',
    'git init',
    'git remote remove origin',
    'git remote add origin https://github.com/jalemanbetanco-cyber/alohandote-rent-calendar.git',
    'git branch -M main',
    'git add .',
    'git commit -m "Go-Live readiness V165"',
    'git push -u origin main --force',
    'firebase deploy --only firestore:rules,storage --project alohandote-rent-calendar',
  ]
}

export function rollbackPlan() {
  return [
    'Conservar ZIP estable anterior antes de subir nueva versión.',
    'Conservar backup JSON/Excel previo al despliegue.',
    'Si Vercel falla, restaurar commit anterior desde GitHub.',
    'Si reglas Firebase bloquean operación, re-desplegar reglas anteriores.',
    'Probar login admin antes de operar con clientes.',
  ]
}
