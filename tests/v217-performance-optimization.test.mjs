import assert from 'node:assert/strict'
import {
  buildDateRangeQueryPlan,
  buildStableMemoKey,
  classifyDatasetSize,
  createCacheEntry,
  getRenderRisk,
  invalidateCacheByPrefix,
  isCacheEntryValid,
  normalizeLimit,
  recommendIndexFields,
  readCacheEntry,
  shouldUsePagedReads,
  shouldVirtualizeList,
} from '../src/modules/performance/index.js'

const largeList = Array.from({ length: 151 }, (_, index) => ({ id: index }))
assert.equal(shouldVirtualizeList(largeList, 120), true)
assert.equal(classifyDatasetSize(largeList), 'medium')

const memoKeyA = buildStableMemoKey(['renta', { b: 2, a: 1 }, '2026-06'])
const memoKeyB = buildStableMemoKey(['renta', { a: 1, b: 2 }, '2026-06'])
assert.equal(memoKeyA, memoKeyB)

const renderRisk = getRenderRisk({ items: Array.from({ length: 350 }), filters: { module: 'renta' }, hasNestedMaps: true })
assert.equal(renderRisk.severity, 'high')

assert.equal(normalizeLimit(900, 100, 500), 500)
assert.equal(normalizeLimit('bad', 75, 500), 75)

const plan = buildDateRangeQueryPlan({ collectionName: 'reservations', startDate: '2026-06-01', endDate: '2026-06-30', orderBy: 'checkIn', limit: 80 })
assert.deepEqual(recommendIndexFields(plan), ['checkIn'])
assert.equal(shouldUsePagedReads({ totalItems: 600, activeRangeDays: 10 }), true)

const entry = createCacheEntry({ ok: true }, 1000, 100)
assert.equal(isCacheEntryValid(entry, 500), true)
assert.deepEqual(readCacheEntry(entry, 500), { ok: true })
assert.equal(readCacheEntry(entry, 1200), null)

const cache = { 'reservations:1': entry, 'vehicles:1': entry }
assert.deepEqual(Object.keys(invalidateCacheByPrefix(cache, 'reservations:')), ['vehicles:1'])

console.log('✅ V217 performance optimization tests passed')
