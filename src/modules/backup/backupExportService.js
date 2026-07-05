export function toCsv(rows = []) {
  const list = Array.isArray(rows) ? rows : []
  const headers = [...new Set(list.flatMap((row) => Object.keys(row || {})))]
  const escape = (value) => {
    const text = value === null || value === undefined ? '' : String(value)
    return /[",\n;]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
  }
  return [headers.join(','), ...list.map((row) => headers.map((key) => escape(row?.[key])).join(','))].join('\n')
}

export function toJsonExport(rows = []) {
  return JSON.stringify(Array.isArray(rows) ? rows : [], null, 2)
}

export function buildExportDescriptor({ collection, rows = [], format = 'json', fileName } = {}) {
  const safeFormat = ['json', 'csv', 'xlsx'].includes(format) ? format : 'json'
  return {
    collection,
    format: safeFormat,
    fileName: fileName || `${collection}.${safeFormat}`,
    rowCount: Array.isArray(rows) ? rows.length : 0,
    content: safeFormat === 'csv' ? toCsv(rows) : toJsonExport(rows),
  }
}
