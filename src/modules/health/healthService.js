import { buildOperationalHealthReport } from './healthCore.js'

export function createHealthSnapshot(dataSources = {}) {
  return buildOperationalHealthReport(dataSources)
}

export function shouldBlockReleaseByHealth(report, { blockOnWarnings = false } = {}) {
  if (!report || !report.summary) return true
  if (report.summary.critical > 0) return true
  if (blockOnWarnings && report.summary.warning > 0) return true
  return false
}
