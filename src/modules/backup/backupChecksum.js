import { createHash } from 'node:crypto'

export function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`
}

export function sha256(value) {
  const payload = typeof value === 'string' ? value : stableStringify(value)
  return createHash('sha256').update(payload).digest('hex')
}

export function buildBackupChecksum(files = {}) {
  const normalized = Object.fromEntries(
    Object.entries(files).map(([name, content]) => [name, sha256(content)])
  )
  return {
    algorithm: 'sha256',
    files: normalized,
    checksum: sha256(normalized),
  }
}
