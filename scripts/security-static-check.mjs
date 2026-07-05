import fs from 'node:fs'

function read(path) { return fs.existsSync(path) ? fs.readFileSync(path, 'utf8') : '' }
function fail(name, detail = '') { failures.push({ name, detail }) }
const failures = []

const proxy = read('api/ics-proxy.js')
const icalCore = read('api/_icalCore.js')
const serverSecurity = read('api/_serverSecurity.js')
const firestore = read('firestore.rules')
const storage = read('storage.rules')

if (!proxy.includes('allowedIcsHost') || !serverSecurity.includes('isPrivateOrLocalHost')) fail('Proxy iCal sin allowlist SSRF')
if (proxy.includes("fetch(url") || proxy.includes('fetch(parsed.toString()') === false) fail('Proxy iCal no usa URL parseada segura')
if (icalCore.includes('customerName ||') || icalCore.includes('SUMMARY:${escapeIcal(customerName')) fail('iCal expone nombre de cliente')
if (!icalCore.includes('Datos personales ocultos')) fail('iCal no declara ocultamiento de datos personales')
if (!serverSecurity.includes('FIREBASE_SERVICE_ACCOUNT_BASE64')) fail('Acceso Firestore server-side no soporta service account')
if (firestore.includes('allow read, write: if true')) fail('Firestore contiene regla abierta global')
if (storage.includes('allow read, write: if true')) fail('Storage contiene regla abierta global')
if (!read('vercel.json').includes('X-Content-Type-Options')) fail('Vercel no define headers básicos de seguridad')

if (!firestore.includes('match /generalExpenses/{docId}') || !firestore.includes('allow create, update: if canManageFinance();')) fail('Firestore V207 no restringe gastos/caja por rol financiero')
if (!firestore.includes('match /hrPeople/{docId}') || !firestore.includes('allow create, update: if canManageHr();')) fail('Firestore V207 no restringe RRHH por rol')
if (!firestore.includes('match /{collectionId}/{document=**}') || !firestore.includes('allow create, update, delete: if isAdmin();')) fail('Firestore V207 no tiene fallback seguro de escritura admin')
if (!storage.includes('match /reservation-docs/{uid}/{fileName}') || !storage.includes('match /vehicle-checkins/{uid}/{fileName}')) fail('Storage V207 no restringe rutas operativas conocidas')
if (!storage.includes('allow write: if false;')) fail('Storage V207 no bloquea fallback de rutas nuevas')


if (failures.length) {
  console.error('Security static check falló:')
  failures.forEach((item) => console.error(`- ${item.name}${item.detail ? `: ${item.detail}` : ''}`))
  process.exit(1)
}
console.log('Security static check aprobado: SSRF, iCal PII, headers y backend seguro cubiertos.')
