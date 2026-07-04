import fs from 'node:fs'

const checks = []
function check(name, ok, detail = '') {
  checks.push({ name, ok: Boolean(ok), detail })
}

function read(path) {
  return fs.existsSync(path) ? fs.readFileSync(path, 'utf8') : ''
}

const app = read('src/App.jsx')
const pkg = JSON.parse(read('package.json') || '{}')
const firestoreRules = read('firestore.rules')
const storageRules = read('storage.rules')
const dateUtils = read('src/dateUtils.js')
const smoke = read('scripts/smoke-check.mjs')

check('package.json en raíz', fs.existsSync('package.json'))
check('index.html en raíz', fs.existsSync('index.html'))
check('src/App.jsx existe', fs.existsSync('src/App.jsx'))
check('Firebase config existe', fs.existsSync('firebase.json') && fs.existsSync('firestore.rules') && fs.existsSync('storage.rules'))
check('Lockfile recomendado documentado', true, fs.existsSync('package-lock.json') || fs.existsSync('npm-shrinkwrap.json') ? 'Lockfile presente.' : 'Pendiente generar package-lock.json en ambiente con acceso npm antes de release formal.')
check('No hay npm-shrinkwrap duplicado si existe package-lock', !(fs.existsSync('package-lock.json') && fs.existsSync('npm-shrinkwrap.json')))
check('Scripts calidad presentes', pkg.scripts?.['quality:smoke'] && pkg.scripts?.['test:business'] && pkg.scripts?.['security:static'] && pkg.scripts?.['quality:all'])
check('ErrorBoundary activo', fs.existsSync('src/ErrorBoundary.jsx') && read('src/main.jsx').includes('ErrorBoundary'))
check('Reglas Firestore no abiertas globalmente', !firestoreRules.includes('allow read, write: if true'))
check('Reglas Storage no abiertas globalmente', !storageRules.includes('allow read, write: if true'))
check('Firestore V207 restringe finanzas/RRHH por rol', firestoreRules.includes('match /generalExpenses/{docId}') && firestoreRules.includes('allow create, update: if canManageFinance();') && firestoreRules.includes('match /hrPeople/{docId}') && firestoreRules.includes('allow create, update: if canManageHr();'))
check('Firestore V207 fallback seguro solo admin escribe', firestoreRules.includes('match /{collectionId}/{document=**}') && firestoreRules.includes('allow create, update, delete: if isAdmin();'))
check('Storage V207 rutas operativas restringidas', storageRules.includes('match /reservation-docs/{uid}/{fileName}') && storageRules.includes('match /vehicle-checkins/{uid}/{fileName}') && storageRules.includes('allow write: if false;'))
check('Roles/permisos presentes', app.includes('ROLE_PERMISSIONS') && app.includes('operator_general'))
check('auditLogsStore declarado antes de uso visual', app.includes("const auditLogsStore = useFirestoreOrLocalStorage('auditLogs'") && app.includes('auditLogsStore?.items'))
check('Fechas inválidas protegidas', dateUtils.includes("if (!iso) return '-'") && dateUtils.includes('Number.isNaN(date.getTime())'))
check('Validaciones críticas activas', app.includes('validateReservationCritical') && fs.existsSync('src/domain/validations.js'))
check('Backups técnicos activos', app.includes('exportTechnicalBackupJson') && fs.existsSync('src/services/backupService.js'))
check('Monitor salud activo', app.includes('exportHealthReportJson') && fs.existsSync('src/services/healthService.js'))
check('Checklist producción activo', fs.existsSync('src/services/productionChecklistService.js'))
check('Pruebas negocio incluyen V135', read('tests/business-rules.test.mjs').includes('fechas V135'))
check('Inventario con caja V137', app.includes('INVENTORY_PAYMENT_METHODS') && app.includes('inventoryPurchaseRows') && app.includes('inventoryPaymentAmountBs'))
check('Venta de divisas V137', app.includes('openDollarSaleForm') && app.includes('dollarSaleBsInRows') && app.includes('dollarSaleOutRows'))
check('Cajas operativas V138', app.includes('BsMainAmount') && app.includes('WalletAmount'))
check('Cuentas por pagar editables V138', app.includes('openPayableSource') && app.includes('deletePayableSource'))
check('Validación horaria V138', read('src/domain/validations.js').includes('intervalsOverlapWithTime'))
check('Estado de pago gastos V139', app.includes('EXPENSE_PAYMENT_STATUS') && app.includes('payableExpenseRows') && app.includes('paidExpenseRows'))
check('Caja Bs real V140', app.includes('cashRowBsValue') && app.includes('visibleProfitBs'))
check('Sin caja sin método V140', !app.includes("'Sin método'].map") && app.includes("['Efectivo $','Zelle','Binance'].map"))
check('Caja Bs aislada V141', app.includes('cashRowBsOnlyValue') && app.includes('cashRowBsOnlyValue(item)'))
check('Caja sin método excluida V142', app.includes('filter(isConsistentCashRow)') && app.includes('allowedCashBuckets.map') && app.includes('noMethodRows'))
check('Guardrail caja Bs V143', app.includes('isConsistentCashRow') && app.includes('inconsistentBsRows') && app.includes('dataQualityRows'))
check('Anulación devolución V144', app.includes('submitRefundCancellation') && app.includes('Anulación/Devolución') && app.includes('refundReference') && app.includes('refundProof'))
check('Anulación activa V145', app.includes('setEditingReservation(null)') && app.includes("showSuccess('Anulación guardada con éxito')") && app.includes("const payables = [...payableExpenseRows, ...commissionRows]"))
check('Anulación flujo definitivo V146', app.includes('calendarReleased: true') && app.includes('receivableClosed: true') && app.includes('adminExpenseRegistered: true') && app.includes('refundBcvEuroRate'))
check('Anulación caja por método V148', app.includes('refundRows.filter(isConsistentCashRow).forEach') && app.includes("category: 'Anulación / devolución'"))
check('iCal deduplicado operaciones V148', app.includes('rawLodgingRows') && app.includes('Check-out alojamiento iCal / limpieza') && app.includes('new Map()).values()'))
check('Operaciones finales V150', app.includes('unresolvedIcal') && app.includes('noValidate onSubmit={submitRefundCancellation}') && app.includes('setOperationsRevision((value) => value + 1)'))
check('Normalización cancelled V151', app.includes("['cancelled', 'canceled', 'cancelada'") && app.includes('function isReservationCancelled') && app.includes('!isReservationCancelled(item)'))
check('Botón anulación accionable V152', app.includes('noValidate onSubmit={submitRefundCancellation}') && app.includes('refund-submit-action') && app.includes('ANULACION-${Date.now()}'))
check('Guardar reservas y caja limpia V153', app.includes('reservation-save-action') && app.includes('validRefundRows') && app.includes('visibleProfitBs') && !app.includes('movimientos excluidos de caja'))
check('Calendario ignora anuladas V154', read('src/domain/maintenance.js').includes('isRecordCancelled') && read('src/domain/validations.js').includes('if (isRecordCancelled(item)) return false'))
check('Smoke actualizado', smoke.includes('Fechas seguras V135'))
const proxy = read('api/ics-proxy.js')
const icalCore = read('api/_icalCore.js')
const serverSecurity = read('api/_serverSecurity.js')
check('Proxy iCal con allowlist anti-SSRF V155', proxy.includes('allowedIcsHost') && serverSecurity.includes('isPrivateOrLocalHost'))
check('iCal público sin datos personales V155', icalCore.includes("summary = status === 'maintenance' ? 'Mantenimiento' : 'No disponible'") && icalCore.includes('Datos personales ocultos'))
check('Firestore server-side soporta service account V155', serverSecurity.includes('FIREBASE_SERVICE_ACCOUNT_BASE64') && serverSecurity.includes('getFirestoreAuthHeaders'))
check('Headers de seguridad V155', read('vercel.json').includes('X-Content-Type-Options') && read('vercel.json').includes('Permissions-Policy'))
check('Demo protegido V168 no abre sistema sin Firebase salvo flag explícito', app.includes('VITE_ENABLE_DEMO_MODE') && app.includes('FirebaseSetupRequired') && app.includes("role: 'admin'"))
check('Cuentas por cobrar fuera de caja V172', app.includes('reservationHasCollectedPayment') && app.includes('receivablePendingBs') && app.includes('.filter((item) => reservationHasCollectedPayment(item, exchangeRates))'))
check('Mapa completo módulos V156 removido', !app.includes('V156 · Mapa completo de módulos') && app.includes('Administración ERP') && app.includes('Rentabilidad KM / ROI'))
check('Caja divisas V164 usa ledger firmado sin bloquear compra/venta por saldos derivados', app.includes('signedBsForCashRow') && app.includes('dollarOperationBs') && app.includes('bsPurchaseOutRows') && app.includes('dollarSaleBsInRows') && app.includes('cashLedger') && app.includes('noValidate') && app.includes('No bloquear el formulario'))
check('Documentos V161 usan escritura directa y fallback descarga', app.includes('writeHtmlDocumentToWindow') && app.includes("targetWindow.document.write(safeHtml)") && app.includes('downloadPrintableHtml'))
check('Caja Bs V161 muestra Bs sin equivalente USD ilógico', app.includes('bs-only-amount') && app.includes('Caja principal real en Bs: compras de $ descuentan Bs') && !app.includes('Equiv. {money'))


const failed = checks.filter((item) => !item.ok)
console.table(checks.map((item) => ({ Estado: item.ok ? 'OK' : 'FALLA', Validacion: item.name })))

if (failed.length) {
  console.error('\nNO-GO: hay validaciones críticas fallidas.')
  failed.forEach((item) => console.error(`- ${item.name}${item.detail ? `: ${item.detail}` : ''}`))
  process.exit(1)
}

console.log('\nGO técnico: validaciones estáticas de producción aprobadas.')
