import { getFirestoreAuthHeaders, setSecurityHeaders, safeSlug } from './_serverSecurity.js'

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || 'alohandote-rent-calendar'
const API_KEY = process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY || ''

export function addDaysToIsoDate(value, days = 1) {
  if (!value) return ''
  const [year, month, day] = String(value).slice(0, 10).split('-').map(Number)
  if (!year || !month || !day) return ''
  const date = new Date(Date.UTC(year, month - 1, day))
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export function normalizeExclusiveEndDate(startDate, endDate) {
  if (!startDate) return ''
  if (!endDate || String(endDate).slice(0, 10) <= String(startDate).slice(0, 10)) return addDaysToIsoDate(startDate, 1)
  return String(endDate).slice(0, 10)
}


export function calendarDurationDays(start = '', end = '') {
  const safeStart = String(start || '').slice(0, 10)
  const safeEnd = String(end || safeStart || '').slice(0, 10)
  if (!safeStart) return 0
  const startDate = new Date(`${safeStart}T00:00:00Z`)
  const endDate = new Date(`${safeEnd}T00:00:00Z`)
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return 0
  const diffDays = Math.round((endDate - startDate) / 86400000)
  return Math.max(1, diffDays || 1)
}

export function formatDate(value) {
  return value ? String(value).slice(0, 10).replace(/-/g, '') : ''
}

export function escapeIcal(value = '') {
  return String(value).replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n')
}

export function fieldValue(fields = {}, key) {
  const field = fields[key] || {}
  return field.stringValue ?? field.integerValue ?? field.doubleValue ?? field.booleanValue ?? ''
}

export function isImportedIcalFields(fields = {}) {
  // Hotfix iCal export: no excluir reservas internas solo porque el canal diga Airbnb/Booking.
  // Una reserva creada manualmente en Alohandote puede venir del canal Airbnb y debe exportarse
  // como bloqueo público. Solo se excluyen registros importados realmente desde iCal externo.
  const source = String(fieldValue(fields, 'source') || '').toLowerCase()
  const sourceType = String(fieldValue(fields, 'sourceType') || '').toLowerCase()
  const icalSourceKey = String(fieldValue(fields, 'icalSourceKey') || '')
  const icalSourceUrl = String(fieldValue(fields, 'icalSourceUrl') || '')
  const externalUid = String(fieldValue(fields, 'externalUid') || '')

  return (
    source === 'ical' ||
    sourceType === 'ical' ||
    Boolean(icalSourceKey) ||
    Boolean(icalSourceUrl) ||
    Boolean(externalUid)
  )
}

export async function fetchAllDocuments(collectionName) {
  const docs = []
  let pageToken = ''
  const auth = await getFirestoreAuthHeaders()
  do {
    const token = pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''
    const key = auth.queryKey && API_KEY ? `&key=${encodeURIComponent(API_KEY)}` : ''
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collectionName}?pageSize=300${token}${key}`
    const response = await fetch(url, { headers: auth.headers })
    if (!response.ok) throw new Error(`Firestore REST ${response.status} (${auth.mode})`)
    const data = await response.json()
    docs.push(...(data.documents || []))
    pageToken = data.nextPageToken || ''
  } while (pageToken)
  return docs
}

async function fetchLodgingIcalDocuments() {
  // V185: para Airbnb/Booking priorizamos la colección pública mínima.
  // Evitamos depender de reservas privadas protegidas por login.
  try {
    const publicDocs = await fetchAllDocuments('publicIcalBlocks')
    if (publicDocs.length) return publicDocs
  } catch (error) {
    console.warn('iCal publicIcalBlocks no disponible:', error?.message || error)
  }
  try {
    return await fetchAllDocuments('lodgingReservations')
  } catch (error) {
    console.warn('iCal lodgingReservations no disponible:', error?.message || error)
    return []
  }
}

// Datos personales ocultos: el feed iCal publica solo disponibilidad.
export async function buildLodgingIcalBody(rawAccommodationId) {
  const accommodationId = safeSlug(rawAccommodationId)
  if (!accommodationId) throw new Error('Missing accommodationId')

  const docs = await fetchLodgingIcalDocuments()
  const events = []
  for (const doc of docs) {
    const fields = doc.fields || {}
    if (String(fieldValue(fields, 'accommodationId')) !== accommodationId) continue
    if (isImportedIcalFields(fields)) continue

    const status = String(fieldValue(fields, 'status') || 'reserved').toLowerCase()
    if (['cancelled', 'canceled', 'cancelada', 'anulada'].includes(status)) continue

    const start = String(fieldValue(fields, 'startDate') || '').slice(0, 10)
    const rawEnd = String(fieldValue(fields, 'endDate') || '').slice(0, 10)
    const end = normalizeExclusiveEndDate(start, rawEnd)
    if (!start || !end) continue
    if (status === 'maintenance' && calendarDurationDays(start, rawEnd || start) <= 1) continue

    const summary = status === 'maintenance' ? 'Mantenimiento' : 'No disponible'
    const id = doc.name?.split('/').pop() || `${accommodationId}-${start}-${end}`
    events.push([
      'BEGIN:VEVENT',
      `UID:${escapeIcal(id)}@alohandote-rent-calendar`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')}`,
      `DTSTART;VALUE=DATE:${formatDate(start)}`,
      `DTEND;VALUE=DATE:${formatDate(end)}`,
      'SUMMARY:Reserved',
      'END:VEVENT',
    ].join('\r\n'))
  }

  if (!events.length) {
    // Algunos importadores externos rechazan feeds completamente vacíos.
    // Evento histórico inocuo: no bloquea disponibilidad futura.
    events.push([
      'BEGIN:VEVENT',
      `UID:alohandote-empty-feed-${escapeIcal(accommodationId)}@alohandote-rent-calendar`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')}`,
      'DTSTART;VALUE=DATE:20000101',
      'DTEND;VALUE=DATE:20000102',
      'SUMMARY:Reserved',
      'END:VEVENT',
    ].join('\r\n'))
  }

  // V187: feed minimalista para máxima compatibilidad Airbnb/Estei.
  // Algunos importadores rechazan propiedades opcionales aunque el .ics sea válido.
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Alohandote//iCal Export//EN',
    'CALSCALE:GREGORIAN',
    ...events,
    'END:VCALENDAR',
    '',
  ].join('\r\n')
}

export async function sendLodgingIcal(req, res, rawAccommodationId) {
  try {
    const accommodationId = safeSlug(rawAccommodationId)
    if (!accommodationId) {
      setSecurityHeaders(res)
      res.status(400).send('Missing accommodationId')
      return
    }
    const body = await buildLodgingIcalBody(accommodationId)
    setSecurityHeaders(res, { calendar: true })
    // V187: headers estrictos para importadores externos.
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="alohandote-${accommodationId}.ics"`)
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60, stale-while-revalidate=30')
    res.setHeader('X-Robots-Tag', 'noindex')
    if (req.method === 'HEAD') {
      res.status(200).end()
      return
    }
    res.status(200).send(body)
  } catch (err) {
    console.error('lodging iCal error:', err)
    setSecurityHeaders(res)
    res.status(500).send('Could not generate iCal')
  }
}
