import { buildBackupChecksum, sha256, stableStringify } from './backupChecksum.js'

export const BACKUP_COLLECTIONS = Object.freeze([
  'reservations',
  'cashMovements',
  'payments',
  'accountsReceivable',
  'accountsPayable',
  'inventoryItems',
  'hrPeople',
  'lodgings',
  'vehicles',
  'auditLogs',
])

export function normalizeCollectionName(name = '') {
  return String(name).trim().replace(/[^a-zA-Z0-9_/-]/g, '')
}

export function sanitizeBackupRecord(record = {}) {
  const blocked = new Set(['password', 'token', 'secret', 'apiKey', 'privateKey'])
  return Object.fromEntries(
    Object.entries(record || {}).filter(([key]) => !blocked.has(String(key).toLowerCase()))
  )
}

export function buildBackupFileName({ module = 'snapshot', version = 'V220', date = new Date() } = {}) {
  const safeModule = normalizeCollectionName(module) || 'snapshot'
  const iso = new Date(date).toISOString().slice(0, 10).replaceAll('-', '_')
  return `Alohandote_${version}_${safeModule}_${iso}`
}

export function normalizeBackupDataset(dataset = {}) {
  return Object.fromEntries(
    Object.entries(dataset).map(([collection, rows]) => [
      normalizeCollectionName(collection),
      Array.isArray(rows) ? rows.map(sanitizeBackupRecord) : [],
    ])
  )
}

export function buildBackupManifest({ version = 'V220', generatedAt = new Date().toISOString(), dataset = {}, operator = 'system' } = {}) {
  const normalized = normalizeBackupDataset(dataset)
  const collections = Object.keys(normalized).sort()
  const counts = Object.fromEntries(collections.map((name) => [name, normalized[name].length]))
  return {
    product: 'Alohandote CRM',
    version,
    generatedAt,
    operator,
    collections,
    counts,
    totalRecords: Object.values(counts).reduce((sum, count) => sum + count, 0),
    integrity: sha256({ version, generatedAt, collections, counts }),
  }
}

export function buildBackupSnapshot({ version = 'V220', generatedAt = new Date().toISOString(), dataset = {}, operator = 'system' } = {}) {
  const normalized = normalizeBackupDataset(dataset)
  const files = Object.fromEntries(
    Object.entries(normalized).map(([name, rows]) => [`${name}.json`, stableStringify(rows)])
  )
  const manifest = buildBackupManifest({ version, generatedAt, dataset: normalized, operator })
  files['manifest.json'] = stableStringify(manifest)
  files['backup.sha256.json'] = stableStringify(buildBackupChecksum(files))
  return {
    name: buildBackupFileName({ module: 'snapshot', version, date: generatedAt }),
    manifest,
    files,
  }
}
