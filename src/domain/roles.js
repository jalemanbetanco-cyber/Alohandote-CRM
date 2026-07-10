// V126 - Dominio de roles y permisos
// Mantiene compatibilidad con perfiles antiguos: operator / operador.

export function normalizeRole(value) {
  const raw = String(value || '').trim().toLowerCase()
  if (['admin', 'administrador', 'administrator'].includes(raw)) return 'admin'
  if (['supervisor', 'coordinador', 'coordinadora'].includes(raw)) return 'supervisor'
  if (['vendedor', 'seller', 'comercial', 'ventas'].includes(raw)) return 'seller'
  if (['operator', 'operador'].includes(raw)) return 'operator_general'
  if (['operador renta car', 'operador rentacar', 'renta car'].includes(raw)) return 'operator_rentcar'
  if (['operador alojamientos', 'alojamientos', 'hospedaje'].includes(raw)) return 'operator_lodging'
  if (['recepción vehículos', 'recepcion vehiculos', 'recepcionista vehiculos', 'recepción vehiculos'].includes(raw)) return 'vehicle_reception'
  if (['limpieza', 'cleaning'].includes(raw)) return 'cleaning'
  if (['mantenimiento', 'maintenance'].includes(raw)) return 'maintenance'
  if (['contabilidad', 'contador', 'administracion', 'administración', 'accounting'].includes(raw)) return 'accounting'
  if (['solo lectura', 'lector', 'read only', 'readonly'].includes(raw)) return 'readonly'
  return 'seller'
}

export const ROLE_LABELS = {
  admin: 'Administrador',
  supervisor: 'Supervisor',
  seller: 'Vendedor',
  operator_general: 'Operador',
  operator_rentcar: 'Operador Renta Car',
  operator_lodging: 'Operador Alojamientos',
  vehicle_reception: 'Recepción vehículos',
  cleaning: 'Limpieza',
  maintenance: 'Mantenimiento',
  accounting: 'Contabilidad',
  readonly: 'Solo lectura',
}

export const ROLE_PERMISSIONS = {
  admin: ['*'],
  supervisor: ['viewCars','viewLodging','viewCommercial','viewAdmin','viewInventory','viewHr','viewMaintenance','viewProfitability','manageAssets','manageInventory','manageHr','carLogistics','lodgingLogistics','export','writeCommercial','writeOperations'],
  seller: ['viewCars','viewLodging','viewCommercial','writeCommercial'],
  operator_general: ['viewCars','viewLodging','viewCommercial','carLogistics','lodgingLogistics','writeCommercial','writeOperations'],
  operator_rentcar: ['viewCars','viewCommercial','carLogistics','writeOperations'],
  operator_lodging: ['viewLodging','lodgingLogistics','writeOperations'],
  vehicle_reception: ['viewCars','carLogistics','writeOperations'],
  cleaning: ['viewLodging','lodgingLogistics','viewInventory','writeOperations'],
  maintenance: ['viewCars','viewMaintenance','viewInventory','carLogistics','writeOperations','manageInventory'],
  accounting: ['viewCommercial','viewAdmin','viewProfitability','export'],
  readonly: ['viewCars','viewLodging','viewCommercial','viewAdmin','viewInventory','viewMaintenance','viewProfitability'],
}

export function roleLabel(profile) {
  return ROLE_LABELS[normalizeRole(profile?.role)] || 'Usuario'
}

export function roleHasPermission(role, permission) {
  const perms = ROLE_PERMISSIONS[normalizeRole(role)] || []
  return perms.includes('*') || perms.includes(permission)
}
