export function prepareRestorePlan({ snapshot, targetEnvironment = 'staging' } = {}) {
  const manifest = snapshot?.manifest || null
  return {
    ready: Boolean(manifest && Array.isArray(manifest.collections)),
    targetEnvironment,
    mode: 'dry-run-only',
    warning: 'V220 prepara restauración, no ejecuta escrituras automáticas.',
    collections: manifest?.collections || [],
    steps: [
      'Validar checksum del snapshot',
      'Restaurar primero en staging',
      'Comparar conteos por colección',
      'Solicitar aprobación manual antes de producción',
    ],
  }
}
