export const STABLE_VERSION_POLICY = Object.freeze({
  currentVersion: '1.0.210',
  baseline: 'V209',
  target: 'V210',
  principle: 'No alterar flujos estables; agregar controles de entrega y gobernanza.',
})

export const RELEASE_VALIDATION_COMMANDS = Object.freeze([
  'npm install',
  'npm run production:check',
  'npm run build',
  'vercel --prod',
])

export const GITHUB_REQUIRED_CHECKS = Object.freeze([
  'production:check',
  'build',
  'qa:regression',
])

export function buildReleaseChecklist({ version = STABLE_VERSION_POLICY.currentVersion, deployed = false, qaApproved = false } = {}) {
  return [
    { id: 'env', label: '.env.local obtenido desde Vercel con variables reales', required: true, passed: true },
    { id: 'production-check', label: 'npm run production:check aprobado', required: true, passed: false },
    { id: 'build', label: 'npm run build aprobado', required: true, passed: false },
    { id: 'deploy', label: `Despliegue ${version} ejecutado en Vercel`, required: true, passed: Boolean(deployed) },
    { id: 'qa-user', label: 'Pruebas de usuario aprobadas antes de congelar versión', required: true, passed: Boolean(qaApproved) },
    { id: 'git-tag', label: `Tag Git ${version.replace('1.0.', 'v')} creado solo después de QA`, required: true, passed: false },
  ]
}

export function evaluateReleaseReadiness(items = []) {
  const required = items.filter((item) => item.required)
  const failed = required.filter((item) => !item.passed)
  return {
    decision: failed.length === 0 ? 'GO' : 'NO-GO',
    totalRequired: required.length,
    failedIds: failed.map((item) => item.id),
  }
}

export function formatGitCommands(version = STABLE_VERSION_POLICY.currentVersion) {
  const tag = version.replace('1.0.', 'v')
  return [
    'git status',
    'git add .',
    `git commit -m "${tag.toUpperCase()} estable - DevOps y gobernanza"`,
    `git tag ${tag}`,
    'git push origin main',
    `git push origin ${tag}`,
  ]
}
