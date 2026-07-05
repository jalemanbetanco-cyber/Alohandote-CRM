// V126 - Servicio de operaciones públicas
// Capa independiente para tokenizar y preparar tareas de logística pública.

export function generatePublicToken() {
  const raw = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`
  return raw.replace(/[^a-zA-Z0-9]/g, '').slice(0, 32)
}

export function publicTaskSnapshot(item = {}) {
  return {
    id: item.id || '',
    reservationId: item.reservationId || '',
    reservationType: item.reservationType || '',
    operation: item.operation || '',
    group: item.group || '',
    operationDate: item.operationDate || '',
    assetLabel: item.assetLabel || '',
    assetName: item.assetName || '',
    vehicleId: item.vehicleId || '',
    accommodationId: item.accommodationId || '',
    customerName: item.customerName || '',
    title: item.title || '',
    totalAmount: item.totalAmount || '',
    amount: item.amount || '',
  }
}

export function isPublicLogisticsOperation(item = {}) {
  if (item.reservationType === 'vehicle' && ['delivery','reception'].includes(item.operation)) return true
  if (item.reservationType === 'lodging' && item.operation === 'reception') return true
  return false
}

export function publicOperationButtonLabel(item = {}) {
  if (item.reservationType === 'vehicle' && item.operation === 'reception') return 'Abrir recepción'
  if (item.reservationType === 'vehicle' && item.operation === 'delivery') return 'Abrir entrega'
  if (item.reservationType === 'lodging' && item.operation === 'reception') return 'Marcar limpieza'
  return 'Abrir'
}

export function publicSubmissionLabel(item = {}) {
  const kind = String(item.kind || '')
  if (kind === 'vehicle_delivery') return 'Entrega vehículo'
  if (kind === 'vehicle_reception') return 'Recepción vehículo'
  if (kind === 'lodging_cleaning') return 'Limpieza alojamiento'
  return kind || 'Operación'
}

export function publicSubmissionAsset(item = {}) {
  const payload = item.payload || {}
  return payload.assetName || payload.vehicleName || payload.accommodationName || payload.assetLabel || item.taskId || '-'
}
