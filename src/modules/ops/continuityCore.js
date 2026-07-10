const STABLE_RELEASE_PATTERN = /^v?\d+(\.\d+)?$/i

export function normalizeVersionTag(version = '') {
  return String(version || '').trim().replace(/^V/, 'v')
}

export function isStableVersionTag(version = '') {
  return STABLE_RELEASE_PATTERN.test(normalizeVersionTag(version))
}

export function buildDeploymentReadinessChecklist({
  productionCheck = false,
  build = false,
  vercelProjectLinked = false,
  environmentVariables = [],
  firebaseProjectId = '',
  githubMainSynced = false,
  tagCreated = false,
  manualRegression = false,
} = {}) {
  const requiredEnv = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
  ]

  const envSet = new Set(environmentVariables)
  const missingEnv = requiredEnv.filter((key) => !envSet.has(key))

  const checks = [
    { id: 'production-check', label: 'production:check aprobado', ok: Boolean(productionCheck), severity: 'critical' },
    { id: 'build', label: 'build aprobado', ok: Boolean(build), severity: 'critical' },
    { id: 'vercel-link', label: 'Vercel vinculado al proyecto correcto', ok: Boolean(vercelProjectLinked), severity: 'critical' },
    { id: 'env', label: 'Variables Firebase Production completas', ok: missingEnv.length === 0, severity: 'critical', details: missingEnv },
    { id: 'firebase-project', label: 'Proyecto Firebase identificado', ok: Boolean(firebaseProjectId), severity: 'medium' },
    { id: 'github-main', label: 'GitHub main sincronizado', ok: Boolean(githubMainSynced), severity: 'medium' },
    { id: 'tag', label: 'Tag de versión creado', ok: Boolean(tagCreated), severity: 'medium' },
    { id: 'manual-regression', label: 'Regresión manual aprobada', ok: Boolean(manualRegression), severity: 'critical' },
  ]

  const blockers = checks.filter((check) => !check.ok && check.severity === 'critical')
  const warnings = checks.filter((check) => !check.ok && check.severity !== 'critical')

  return {
    version: 'V219',
    status: blockers.length > 0 ? 'NO_GO' : warnings.length > 0 ? 'GO_WITH_WARNINGS' : 'GO',
    blockers,
    warnings,
    checks,
  }
}

export function buildRollbackPlan({ currentVersion, previousStableVersion, currentDomain, previousDeploymentUrl } = {}) {
  return {
    version: 'V219',
    currentVersion: normalizeVersionTag(currentVersion),
    previousStableVersion: normalizeVersionTag(previousStableVersion),
    currentDomain: currentDomain || '',
    previousDeploymentUrl: previousDeploymentUrl || '',
    steps: [
      'Confirmar impacto real en producción y detener nuevos cambios.',
      'Revertir alias de producción al deployment estable anterior en Vercel.',
      'Validar login, reservas, caja, abonos, documentos y operaciones.',
      'Registrar incidente y congelar hotfix antes de nuevo despliegue.',
    ],
    ready: Boolean(previousStableVersion && currentDomain),
  }
}

export function buildDataBackupManifest({ collections = [], storagePaths = [], generatedAt = new Date().toISOString() } = {}) {
  const uniqueCollections = [...new Set(collections.filter(Boolean))].sort()
  const uniqueStoragePaths = [...new Set(storagePaths.filter(Boolean))].sort()

  return {
    version: 'V219',
    generatedAt,
    collections: uniqueCollections,
    storagePaths: uniqueStoragePaths,
    totals: {
      collections: uniqueCollections.length,
      storagePaths: uniqueStoragePaths.length,
    },
    recommendedCadence: uniqueCollections.some((name) => ['reservations', 'cashMovements', 'accountsReceivable', 'accountsPayable'].includes(name))
      ? 'daily'
      : 'weekly',
  }
}

export function classifyOperationalRisk({ blockers = 0, warnings = 0, openHotfixes = 0 } = {}) {
  if (blockers > 0 || openHotfixes > 1) return 'high'
  if (warnings > 2 || openHotfixes === 1) return 'medium'
  return 'low'
}
