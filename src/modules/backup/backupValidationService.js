import { BACKUP_COLLECTIONS, buildBackupManifest, normalizeBackupDataset } from './backupCore.js'

export function validateBackupDataset(dataset = {}, requiredCollections = BACKUP_COLLECTIONS) {
  const normalized = normalizeBackupDataset(dataset)
  const missing = requiredCollections.filter((name) => !(name in normalized))
  const invalid = Object.entries(normalized).filter(([, rows]) => !Array.isArray(rows)).map(([name]) => name)
  return {
    status: missing.length === 0 && invalid.length === 0 ? 'VALID' : 'INVALID',
    missing,
    invalid,
    collections: Object.keys(normalized).sort(),
  }
}

export function buildBackupReadiness({ dataset = {}, productionCheck = false, build = false, lastBackupAt = null } = {}) {
  const validation = validateBackupDataset(dataset)
  const blockers = []
  if (!productionCheck) blockers.push('production_check_required')
  if (!build) blockers.push('build_required')
  if (validation.status !== 'VALID') blockers.push('backup_dataset_incomplete')
  if (!lastBackupAt) blockers.push('recent_backup_required')
  return {
    status: blockers.length ? 'NO_GO' : 'GO',
    blockers,
    validation,
    manifest: buildBackupManifest({ dataset }),
  }
}
