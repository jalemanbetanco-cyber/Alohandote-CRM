import { buildBackupReadiness } from '../src/modules/backup/index.js'

const required = {
  reservations: [],
  cashMovements: [],
  payments: [],
  accountsReceivable: [],
  accountsPayable: [],
  inventoryItems: [],
  hrPeople: [],
  lodgings: [],
  vehicles: [],
  auditLogs: [],
}

const result = buildBackupReadiness({
  dataset: required,
  productionCheck: true,
  build: true,
  lastBackupAt: new Date().toISOString(),
})

if (result.status !== 'GO') {
  console.error('❌ Backup validation failed', result)
  process.exit(1)
}

console.log('✅ Backup validation passed')
