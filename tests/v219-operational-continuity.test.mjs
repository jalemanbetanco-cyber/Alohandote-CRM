import assert from 'node:assert/strict'
import {
  buildDataBackupManifest,
  buildDeploymentReadinessChecklist,
  buildRollbackPlan,
  classifyOperationalRisk,
  isStableVersionTag,
  normalizeVersionTag,
} from '../src/modules/ops/index.js'

assert.equal(normalizeVersionTag('V218.1'), 'v218.1')
assert.equal(isStableVersionTag('v219'), true)
assert.equal(isStableVersionTag('feature/calendar'), false)

const noGo = buildDeploymentReadinessChecklist({
  productionCheck: true,
  build: false,
  vercelProjectLinked: true,
  environmentVariables: ['VITE_FIREBASE_API_KEY'],
  manualRegression: false,
})
assert.equal(noGo.status, 'NO_GO')
assert.equal(noGo.blockers.length >= 1, true)

const go = buildDeploymentReadinessChecklist({
  productionCheck: true,
  build: true,
  vercelProjectLinked: true,
  environmentVariables: [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
  ],
  firebaseProjectId: 'alohandote-prod',
  githubMainSynced: true,
  tagCreated: true,
  manualRegression: true,
})
assert.equal(go.status, 'GO')

const rollback = buildRollbackPlan({ currentVersion: 'V219', previousStableVersion: 'V218.1', currentDomain: 'alohandote-rent-calendaralohandote.vercel.app' })
assert.equal(rollback.ready, true)
assert.equal(rollback.steps.length, 4)

const manifest = buildDataBackupManifest({
  collections: ['reservations', 'cashMovements', 'reservations', 'users'],
  storagePaths: ['payment-proofs', 'documents'],
  generatedAt: '2026-06-22T00:00:00.000Z',
})
assert.deepEqual(manifest.collections, ['cashMovements', 'reservations', 'users'])
assert.equal(manifest.recommendedCadence, 'daily')

assert.equal(classifyOperationalRisk({ blockers: 0, warnings: 1, openHotfixes: 0 }), 'low')
assert.equal(classifyOperationalRisk({ blockers: 0, warnings: 3, openHotfixes: 0 }), 'medium')
assert.equal(classifyOperationalRisk({ blockers: 1, warnings: 0, openHotfixes: 0 }), 'high')

console.log('✅ V219 operational continuity tests passed')
