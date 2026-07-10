// V129 - Servicio de backups y exportación técnica
// Funciones puras para preparar snapshots, sanitizar datos y generar manifiestos.

export const SENSITIVE_KEYS = [
  'customerId',
  'document',
  'idDoc',
  'licenseDoc',
  'paymentProof',
  'paymentReference',
  'phone',
  'email',
  'customerAddress',
  'contractCity',
  'address',
  'identification',
]

export function maskValue(value = '') {
  const raw = String(value || '')
  if (!raw) return ''
  if (raw.length <= 4) return '****'
  return `${raw.slice(0, 2)}****${raw.slice(-2)}`
}

export function sanitizeForBackup(value) {
  if (Array.isArray(value)) return value.map(sanitizeForBackup)
  if (!value || typeof value !== 'object') return value

  return Object.fromEntries(Object.entries(value).map(([key, entry]) => {
    const normalized = String(key || '').toLowerCase()
    const isSensitive = SENSITIVE_KEYS.some((sensitiveKey) => normalized.includes(String(sensitiveKey).toLowerCase()))
    if (isSensitive) return [key, typeof entry === 'object' ? '[archivo/dato sensible protegido]' : maskValue(entry)]
    return [key, sanitizeForBackup(entry)]
  }))
}

export function buildBackupManifest(collections = {}) {
  const createdAt = new Date().toISOString()
  const entries = Object.entries(collections).map(([name, rows]) => ({
    collection: name,
    count: Array.isArray(rows) ? rows.length : 0,
  }))
  return {
    app: 'Alohandote V2',
    type: 'technical-backup',
    version: 'V129',
    createdAt,
    totalCollections: entries.length,
    totalRecords: entries.reduce((sum, item) => sum + item.count, 0),
    entries,
  }
}

export function buildBackupPayload(collections = {}, options = {}) {
  const sanitize = options.sanitize !== false
  const payloadCollections = Object.fromEntries(
    Object.entries(collections).map(([name, rows]) => [
      name,
      Array.isArray(rows) ? rows.map((item) => sanitize ? sanitizeForBackup(item) : item) : [],
    ])
  )
  return {
    manifest: buildBackupManifest(payloadCollections),
    collections: payloadCollections,
  }
}

export function rowsToWorksheetRows(rows = [], moduleName = '') {
  return rows.map((item) => ({
    Modulo: moduleName,
    ID: item.id || '',
    Estado: item.status || '',
    Nombre: item.customerName || item.name || item.itemName || item.assetName || '',
    Activo: item.vehicleName || item.accommodationName || item.assetName || '',
    Fecha_Inicio: item.startDate || item.date || item.createdAt || '',
    Fecha_Fin: item.endDate || '',
    Monto_USD: item.totalAmount || item.amount || item.maintenanceCost || '',
    Metodo_Pago: item.paymentMethod || item.maintenancePaymentMethod || '',
    Creado: item.createdAt || '',
    Actualizado: item.updatedAt || '',
  }))
}

export function backupFileName(prefix = 'alohandote-backup') {
  return `${prefix}-${new Date().toISOString().slice(0, 10)}`
}
