import assert from 'node:assert/strict'
import fs from 'node:fs'

import {
  buildReleaseChecklist,
  evaluateReleaseReadiness,
  formatGitCommands,
  GITHUB_REQUIRED_CHECKS,
  RELEASE_VALIDATION_COMMANDS,
  STABLE_VERSION_POLICY,
} from '../src/services/versionGovernanceService.js'

function test(name, fn) {
  try {
    fn()
    console.log(`✓ ${name}`)
  } catch (error) {
    console.error(`✗ ${name}`)
    throw error
  }
}

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
const app = fs.readFileSync('src/App.jsx', 'utf8')
const workflow = fs.readFileSync('.github/workflows/production-quality.yml', 'utf8')
const releaseWorkflow = fs.readFileSync('.github/workflows/release-candidate.yml', 'utf8')

test('V210: versión y scripts DevOps quedan registrados sin tocar App.jsx', () => {
  assert.ok(/^1\.0\.(21[0-9]|2[2-9][0-9]|[3-9][0-9]{2,})$/.test(pkg.version))
  assert.ok(pkg.scripts['test:v210'])
  assert.ok(pkg.scripts['ci:quality'])
  assert.ok(pkg.scripts['release:stable'])
  assert.ok(pkg.scripts['production:check'].includes('test:v210'))
  assert.ok(app.includes('Alohandote') || app.length > 1000)
})

test('V210: comandos de validación conservan despliegue estable', () => {
  assert.deepEqual(RELEASE_VALIDATION_COMMANDS, [
    'npm install',
    'npm run production:check',
    'npm run build',
    'vercel --prod',
  ])
  assert.ok(GITHUB_REQUIRED_CHECKS.includes('qa:regression'))
  assert.equal(STABLE_VERSION_POLICY.baseline, 'V209')
})

test('V210: checklist GO/NO-GO bloquea congelar sin QA usuario', () => {
  const draft = buildReleaseChecklist({ deployed: true, qaApproved: false })
  const noGo = evaluateReleaseReadiness(draft)
  assert.equal(noGo.decision, 'NO-GO')
  assert.ok(noGo.failedIds.includes('qa-user'))

  const approved = draft.map((item) => ({ ...item, passed: true }))
  const go = evaluateReleaseReadiness(approved)
  assert.equal(go.decision, 'GO')
})

test('V210: workflow CI ejecuta quality gate y build en main/PR', () => {
  assert.ok(workflow.includes('pull_request'))
  assert.ok(workflow.includes('branches: [ main ]'))
  assert.ok(workflow.includes('npm run production:check'))
  assert.ok(workflow.includes('npm run build'))
})

test('V210: workflow release candidate no despliega automáticamente producción', () => {
  assert.ok(releaseWorkflow.includes('workflow_dispatch'))
  assert.ok(releaseWorkflow.includes('npm run qa:regression'))
  assert.ok(releaseWorkflow.includes('npm run build'))
  assert.ok(!releaseWorkflow.includes('vercel --prod'))
})

test('V210: comandos Git documentan tag estable posterior a QA', () => {
  const commands = formatGitCommands('1.0.210')
  assert.ok(commands.includes('git tag v210'))
  assert.ok(commands.includes('git push origin v210'))
})

console.log('\nOK V210: DevOps, CI/CD y gobernanza de versiones aprobados.')
