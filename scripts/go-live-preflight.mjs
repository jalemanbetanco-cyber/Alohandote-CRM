import fs from 'node:fs'

const checks = []
const warnings = []
function ok(name, passed, detail = '') { checks.push({ name, passed: Boolean(passed), detail }) }
function warn(name, detail = '') { warnings.push({ name, detail }) }
function read(path) { return fs.existsSync(path) ? fs.readFileSync(path, 'utf8') : '' }
function has(path) { return fs.existsSync(path) }

const pkg = JSON.parse(read('package.json') || '{}')
const vercel = read('vercel.json')
const firestore = read('firestore.rules')
const storage = read('storage.rules')
const app = read('src/App.jsx')
const envExample = read('.env.example') + '\n' + read('.env.production.example')

ok('Versión V203 configurada', pkg.version === '1.0.203')
ok('Scripts críticos disponibles', Boolean(pkg.scripts?.['production:check'] && pkg.scripts?.['quality:all'] && pkg.scripts?.['release:go-no-go']))
ok('Build configurado en Vercel', vercel.includes('npm run build') && vercel.includes('dist'))
ok('Headers de seguridad activos', ['X-Content-Type-Options', 'Referrer-Policy', 'X-Frame-Options', 'Permissions-Policy'].every((h) => vercel.includes(h)))
ok('Cache de API desactivado', vercel.includes('/api/(.*)') && vercel.includes('no-store'))
ok('Firestore sin regla global abierta', !firestore.includes('allow read, write: if true'))
ok('Storage sin regla global abierta', !storage.includes('allow read, write: if true'))
ok('Variables Firebase documentadas', ['VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_AUTH_DOMAIN', 'VITE_FIREBASE_PROJECT_ID', 'VITE_FIREBASE_STORAGE_BUCKET', 'VITE_FIREBASE_APP_ID'].every((v) => envExample.includes(v)))
ok('Backend seguro documentado', envExample.includes('FIREBASE_SERVICE_ACCOUNT_BASE64') && envExample.includes('LEGACY_FIRESTORE_REST_FALLBACK=false'))
ok('Runbook Go-Live presente', has('docs/GO_LIVE_RUNBOOK_V166.md'))
ok('Checklist regresión presente', has('docs/QA_REGRESSION_CHECKLIST_V166.md'))
ok('Rollback documentado', has('docs/ROLLBACK_PLAN_V166.md'))
ok('Workflow CI presente', has('.github/workflows/production-quality.yml'))
ok('Caja validada por V164 preservada', app.includes('No bloquear el formulario') && app.includes('dollarOperationBs') && app.includes('signedBsForCashRow'))
ok('Documentos imprimibles preservados', app.includes('writeHtmlDocumentToWindow') && app.includes('downloadPrintableHtml'))

if (!has('package-lock.json')) warn('Lockfile pendiente', 'Generar package-lock.json con npm install antes del tag final si el repo aún no lo tiene.')
if (!envExample.includes('SENTRY')) warn('Observabilidad externa opcional', 'Puedes agregar Sentry/LogRocket luego; el monitor interno y exportación de salud quedan activos.')

console.table(checks.map((item) => ({ Estado: item.passed ? 'OK' : 'FALLA', Validación: item.name })))
if (warnings.length) {
  console.log('\nAdvertencias no bloqueantes:')
  warnings.forEach((item) => console.log(`- ${item.name}: ${item.detail}`))
}
const failed = checks.filter((item) => !item.passed)
if (failed.length) {
  console.error('\nNO-GO Go-Live: fallan validaciones de preflight.')
  failed.forEach((item) => console.error(`- ${item.name}${item.detail ? `: ${item.detail}` : ''}`))
  process.exit(1)
}
console.log('\nGO-LIVE PREFLIGHT OK: la versión cumple controles técnicos previos al despliegue controlado.')
