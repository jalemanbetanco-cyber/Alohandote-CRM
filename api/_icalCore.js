import { getFirestoreAuthHeaders, setSecurityHeaders, safeSlug } from './_serverSecurity.js'

// V223.5.2.8 HOTFIX DEFINITIVO iCal
// El backend iCal debe leer SIEMPRE el proyecto real de Firestore.
// No usamos VITE_FIREBASE_PROJECT_ID como prioridad porque en algunos entornos
// quedó apuntando al proyecto antiguo `alohandote-rent-calendar`, lo que generaba
// feeds vacíos/intermitentes aunque las reservas existieran en `alohandote-produccion`.
const ENV_FIREBASE_PROJECT_ID = String(process.env.FIREBASE_PROJECT_ID || '').trim()
const VITE_FIREBASE_PROJECT_ID = String(process.env.VITE_FIREBASE_PROJECT_ID || '').trim()
const PROJECT_ID = ENV_FIREBASE_PROJECT_ID || (VITE_FIREBASE_PROJECT_ID === 'alohandote-produccion' ? VITE_FIREBASE_PROJECT_ID : 'alohandote-produccion')
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
  return field.stringValue ?? field.integerValue ?? field.doubleValue ?? field.booleanValue ?? field.timestampValue ?? ''
}

export function isImportedIcalFields(fields = {}) {
  const source = String(fieldValue(fields, 'source') || '').toLowerCase()
  const channel = String(fieldValue(fields, 'channel') || '').toLowerCase()
  const note = String(fieldValue(fields, 'note') || fieldValue(fields, 'notes') || '').toLowerCase()
  const customer = String(fieldValue(fields, 'customerName') || '').toLowerCase()
  const externalUid = String(fieldValue(fields, 'externalUid') || '')
  return source === 'ical' || channel.includes('ical') || channel.includes('airbnb') || channel.includes('booking') || note.includes('ical') || note.includes('airbnb') || note.includes('booking') || customer.includes('airbnb') || customer.includes('not available') || Boolean(externalUid)
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
  // V223.5.2.8: export iCal autocurativo.
  // Antes se devolvía publicIcalBlocks si la colección tenía cualquier documento.
  // Eso podía dejar feeds vacíos/intermitentes cuando publicIcalBlocks estaba incompleto
  // para un alojamiento específico. Ahora combinamos fuente pública + reservas internas.
  const docs = []
  try {
    const publicDocs = await fetchAllDocuments('publicIcalBlocks')
    docs.push(...publicDocs)
  } catch (error) {
    console.warn('iCal publicIcalBlocks no disponible:', error?.message || error)
  }
  try {
    const privateDocs = await fetchAllDocuments('lodgingReservations')
    docs.push(...privateDocs)
  } catch (error) {
    console.warn('iCal lodgingReservations no disponible:', error?.message || error)
  }
  console.log(
  "ICAL_DOC_SAMPLE",
  JSON.stringify(
    docs.slice(0,3).map(doc => ({
      name: doc.name,
      fields: Object.keys(doc.fields || {})
    })),
    null,
    2
  )
)
  return docs
}

// Datos personales ocultos: el feed iCal publica solo disponibilidad.
export async function buildLodgingIcalBody(rawAccommodationId) {
  const accommodationId = safeSlug(rawAccommodationId)
  if (!accommodationId) throw new Error('Missing accommodationId')

  const docs = await fetchLodgingIcalDocuments()
  const events = []
  const seen = new Set()
  for (const doc of docs) {
    const fields = doc.fields || {}
    const rowAccommodationCandidates = [
  fieldValue(fields, 'accommodationId'),
  fieldValue(fields, 'lodgingId'),
  fieldValue(fields, 'propertyId'),
  fieldValue(fields, 'assetId'),
  fieldValue(fields, 'roomId'),
  fieldValue(fields, 'accommodationSlug'),
  fieldValue(fields, 'icalSlug'),
  fieldValue(fields, 'publicIcalSlug'),
  fieldValue(fields, 'publicIcalId'),
].map((value) => String(value || '').trim()).filter(Boolean)

const matchesAccommodation = rowAccommodationCandidates.some((value) =>
  value === accommodationId || safeSlug(value) === accommodationId
)

if (!matchesAccommodation) continue
    const isPublicIcalBlock = String(doc.name || '').includes('/publicIcalBlocks/')

    // Si viene de publicIcalBlocks, debe exportarse siempre.
    // Si viene de lodgingReservations, evitamos reexportar bloqueos importados desde OTAs.
    if (!isPublicIcalBlock && isImportedIcalFields(fields)) continue

    const status = String(fieldValue(fields, 'status') || 'reserved').toLowerCase()
    if (['cancelled', 'canceled', 'cancelada', 'anulada'].includes(status)) continue

    const start = String(
  fieldValue(fields, 'startDate') ||
  fieldValue(fields, 'checkIn') ||
  fieldValue(fields, 'checkin') ||
  fieldValue(fields, 'from') ||
  fieldValue(fields, 'dateFrom') ||
  fieldValue(fields, 'deliveryDate') ||
  ''
).slice(0, 10)

const rawEnd = String(
  fieldValue(fields, 'endDate') ||
  fieldValue(fields, 'checkOut') ||
  fieldValue(fields, 'checkout') ||
  fieldValue(fields, 'to') ||
  fieldValue(fields, 'dateTo') ||
  fieldValue(fields, 'cleaningDate') ||
  ''
).slice(0, 10)
    const end = normalizeExclusiveEndDate(start, rawEnd)
    if (!start || !end) continue
    if (status === 'maintenance' && calendarDurationDays(start, rawEnd || start) <= 1) continue

    // Evita duplicados cuando el mismo bloqueo existe en publicIcalBlocks y lodgingReservations.
    const dedupeKey = `${accommodationId}|${start}|${end}|${status === 'maintenance' ? 'maintenance' : 'reserved'}`
    if (seen.has(dedupeKey)) continue
    seen.add(dedupeKey)

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
console.log('ICAL_DEBUG', {
  projectId: PROJECT_ID,
  requestedAccommodationId: accommodationId,
  docsRead: docs.length,
  candidates: docs.slice(0, 20).map((doc) => ({
    name: doc.name,
    accommodationId: fieldValue(doc.fields || {}, 'accommodationId'),
    lodgingId: fieldValue(doc.fields || {}, 'lodgingId'),
    propertyId: fieldValue(doc.fields || {}, 'propertyId'),
    startDate: fieldValue(doc.fields || {}, 'startDate'),
    endDate: fieldValue(doc.fields || {}, 'endDate'),
    status: fieldValue(doc.fields || {}, 'status'),
  })),
})
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
    res.setHeader('X-Alohandote-Ical-Project', PROJECT_ID)
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="alohandote-${accommodationId}.ics"`)
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Cache-Control', 'public, max-age=15, s-maxage=15, stale-while-revalidate=15')
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
