import assert from 'node:assert/strict'
import {
  buildBackupFileName,
  buildBackupManifest,
  buildBackupReadiness,
  buildBackupSnapshot,
  buildExportDescriptor,
  prepareRestorePlan,
  sha256,
  toCsv,
  validateBackupDataset,
} from '../src/modules/backup/index.js'

const dataset = {
  reservations: [{ id: 'r1', guest: 'Cliente', password: 'no-exportar' }],
  cashMovements: [{ id: 'c1', amount: 100 }],
  payments: [{ id: 'p1', amount: 50, method: 'zelle' }],
  accountsReceivable: [{ id: 'ar1', pending: 50 }],
  accountsPayable: [{ id: 'ap1', pending: 30 }],
  inventoryItems: [],
  hrPeople: [],
  lodgings: [],
  vehicles: [],
  auditLogs: [],
}

assert.equal(sha256('alohandote').length, 64)
assert.equal(buildBackupFileName({ module: 'reservations', version: 'V220', date: '2026-06-22T00:00:00.000Z' }), 'Alohandote_V220_reservations_2026_06_22')

const manifest = buildBackupManifest({ version: 'V220', generatedAt: '2026-06-22T00:00:00.000Z', dataset, operator: 'Jose' })
assert.equal(manifest.totalRecords, 5)
assert.equal(manifest.counts.reservations, 1)

const snapshot = buildBackupSnapshot({ version: 'V220', generatedAt: '2026-06-22T00:00:00.000Z', dataset })
assert.equal(Boolean(snapshot.files['reservations.json']), true)
assert.equal(snapshot.files['reservations.json'].includes('password'), false)
assert.equal(Boolean(snapshot.files['backup.sha256.json']), true)

const csv = toCsv([{ name: 'Alohandote', amount: 100 }])
assert.equal(csv.includes('name,amount'), true)

const descriptor = buildExportDescriptor({ collection: 'reservations', rows: dataset.reservations, format: 'csv' })
assert.equal(descriptor.format, 'csv')
assert.equal(descriptor.rowCount, 1)

const validation = validateBackupDataset(dataset)
assert.equal(validation.status, 'VALID')

const noGo = buildBackupReadiness({ dataset, productionCheck: true, build: false, lastBackupAt: '2026-06-22T00:00:00.000Z' })
assert.equal(noGo.status, 'NO_GO')

const go = buildBackupReadiness({ dataset, productionCheck: true, build: true, lastBackupAt: '2026-06-22T00:00:00.000Z' })
assert.equal(go.status, 'GO')

const restore = prepareRestorePlan({ snapshot })
assert.equal(restore.ready, true)
assert.equal(restore.mode, 'dry-run-only')

console.log('✅ V220 backup/export/recovery tests passed')
