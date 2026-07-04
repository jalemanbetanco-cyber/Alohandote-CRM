const DEFAULT_TTL_MS = 60 * 1000

export function createCacheEntry(value, ttlMs = DEFAULT_TTL_MS, now = Date.now()) {
  return {
    value,
    createdAt: now,
    expiresAt: now + ttlMs,
  }
}

export function isCacheEntryValid(entry, now = Date.now()) {
  return Boolean(entry && Number(entry.expiresAt) > now)
}

export function readCacheEntry(entry, now = Date.now()) {
  return isCacheEntryValid(entry, now) ? entry.value : null
}

export function invalidateCacheByPrefix(cache = {}, prefix = '') {
  return Object.fromEntries(
    Object.entries(cache).filter(([key]) => !key.startsWith(prefix)),
  )
}
