import fs from 'node:fs'

const requiredFiles = [
  'package.json',
  'index.html',
  'src/main.jsx',
  'src/App.jsx',
  'src/ErrorBoundary.jsx',
  'src/domain/money.js',
  'src/domain/roles.js',
  'src/domain/maintenance.js',
  'src/domain/validations.js',
  'src/services/publicOperationsService.js',
  'src/services/backupService.js',
  'src/services/healthService.js',
  'src/services/uxService.js',
  'src/services/productionChecklistService.js',
  'tests/business-rules.test.mjs',
  'scripts/production-gate.mjs',
  'firestore.rules',
  'storage.rules',
  'firebase.json',
]

const missing = requiredFiles.filter((file) => !fs.existsSync(file))
if (missing.length) {
  console.error('Smoke check falló. Faltan archivos:', missing.join(', '))
  process.exit(1)
}

const app = fs.readFileSync('src/App.jsx', 'utf8')
const main = fs.readFileSync('src/main.jsx', 'utf8')
const firestore = fs.readFileSync('firestore.rules', 'utf8')
const storage = fs.readFileSync('storage.rules', 'utf8')

const checks = [
  ['App principal exportado', app.includes('export default function App')],
  ['ErrorBoundary montado', main.includes('ErrorBoundary')],
  ['Reglas Firestore sin if true', !firestore.includes('if true')],
  ['Reglas Storage sin if true', !storage.includes('if true')],
  ['Detector iCal global', app.includes('function isIcalImportedRecord')],
  ['Mantenimiento no usa helper fuera de alcance', !app.includes('if (isIcalImportedBlock(item)) return false')],
  ['Compatibilidad operator', app.includes('operator_general')],
  ['Tokens públicos seguros', app.includes('publicReceptionTokens') && app.includes('publicOperationSubmissions')],
  ['Sincronización submissions públicas', app.includes('syncPublicOperationSubmission') && app.includes('Operaciones públicas pendientes')],
  ['Servicios separados V126', fs.existsSync('src/domain/money.js') && fs.existsSync('src/domain/roles.js') && fs.existsSync('src/domain/maintenance.js') && fs.existsSync('src/services/publicOperationsService.js')],
  ['Pruebas de negocio V127', fs.existsSync('tests/business-rules.test.mjs') && fs.readFileSync('package.json', 'utf8').includes('test:business')],
  ['Validaciones críticas V128', fs.existsSync('src/domain/validations.js') && app.includes('validateReservationCritical')],
  ['Backups V129', fs.existsSync('src/services/backupService.js') && app.includes('exportTechnicalBackupJson') && app.includes('Backups técnicos')],
  ['Monitor salud V130', fs.existsSync('src/services/healthService.js') && app.includes('Monitor de salud') && app.includes('exportHealthReportJson')],
  ['UX V131', fs.existsSync('src/services/uxService.js') && fs.readFileSync('src/styles.css', 'utf8').includes('V131 - Optimización mobile/web')],
  ['Checklist producción V132', fs.existsSync('src/services/productionChecklistService.js')],
  ['Fix auditLogs V133', app.includes("const auditLogsStore = useFirestoreOrLocalStorage('auditLogs'") && app.includes('auditLogsStore?.items')],
  ['Fix auditLogs V134', app.indexOf("const auditLogsStore = useFirestoreOrLocalStorage('auditLogs'") > app.indexOf("const publicOperationSubmissionsStore")],
  ['Fechas seguras V135', fs.readFileSync('src/dateUtils.js', 'utf8').includes("if (!iso) return '-'") && fs.readFileSync('src/dateUtils.js', 'utf8').includes('Number.isNaN(date.getTime())')],
  ['Gate producción V136', fs.existsSync('scripts/production-gate.mjs') && fs.readFileSync('package.json', 'utf8').includes('production:check')],
  ['Caja inventario y venta V137', app.includes('INVENTORY_PAYMENT_METHODS') && app.includes('openDollarSaleForm') && app.includes('inventoryPurchaseRows')],
  ['Operación final V138', app.includes('BsMainAmount') && app.includes('WalletAmount') && app.includes('openPayableSource') && fs.readFileSync('src/domain/validations.js', 'utf8').includes('intervalsOverlapWithTime')],
  ['Estado pago gastos V139', app.includes('EXPENSE_PAYMENT_STATUS') && app.includes('payableExpenseRows') && app.includes('paidExpenseRows')],
  ['Caja Bs real V140', app.includes('cashRowBsValue') && app.includes('dollarPurchaseOutBs') && app.includes("['Efectivo $','Zelle','Binance'].map") && !app.includes("'Sin método'].map")],
  ['Caja Bs aislada V141', app.includes('cashRowBsOnlyValue') && app.includes('cashRowBsOnlyValue(item)')],
  ['Auditoría funcional', app.includes('async function logAudit') && app.includes('auditLogsStore') && app.includes('Auditoría reciente')],
]

const failed = checks.filter(([, ok]) => !ok)
if (failed.length) {
  console.error('Smoke check falló:')
  failed.forEach(([name]) => console.error(`- ${name}`))
  process.exit(1)
}

console.log('Smoke check aprobado: estructura, seguridad base y arranque protegidos.')
