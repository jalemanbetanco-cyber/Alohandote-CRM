import assert from 'node:assert/strict'
import fs from 'node:fs'

import { formatShortDate, rangesOverlap, isDateInsideRange, monthTitle } from '../src/dateUtils.js'
import { normalizeStatus as normalizeDomainStatus, isRecordCancelled } from '../src/domain/maintenance.js'

import {
  amountBs,
  euroRateValue,
  paymentBucket,
  paymentAmountUsd,
  paymentAmountBs,
  pendingAmount,
  frozenEuroRateForRecord,
} from '../src/domain/money.js'

import {
  normalizeRole,
  roleHasPermission,
  roleLabel,
} from '../src/domain/roles.js'

import {
  normalizeStatus,
  isIcalImportedRecord,
  isMaintenanceRecord,
  maintenancePaymentBucket,
  maintenanceBsCost,
} from '../src/domain/maintenance.js'

import {
  generatePublicToken,
  isPublicLogisticsOperation,
  publicOperationButtonLabel,
  publicSubmissionLabel,
  publicSubmissionAsset,
  publicTaskSnapshot,
} from '../src/services/publicOperationsService.js'

import {
  validateReservationCritical,
  validateLodgingCritical,
  validateVehicleOperationCritical,
  validateCleaningCritical,
  validatePublicSubmissionCritical,
  intervalsOverlapWithTime,
  validateNoDateConflict,
} from '../src/domain/validations.js'

import {
  buildBackupManifest,
  buildBackupPayload,
  sanitizeForBackup,
  backupFileName,
} from '../src/services/backupService.js'

import {
  buildHealthEvent,
  buildHealthSnapshot,
  healthRecommendations,
  healthStatus,
  severityForEvent,
} from '../src/services/healthService.js'

import {
  readableEmptyState,
  shouldUseCardTable,
  touchTargetSize,
  uxChecklist,
  uxDensityForWidth,
} from '../src/services/uxService.js'

import {
  CRITICAL_MANUAL_FLOWS,
  PRODUCTION_CHECKLIST,
  deploymentCommands,
  productionReadinessStatus,
  rollbackPlan,
} from '../src/services/productionChecklistService.js'

function test(name, fn) {
  try {
    fn()
    console.log(`✓ ${name}`)
  } catch (error) {
    console.error(`✗ ${name}`)
    throw error
  }
}

const rates = { bcvEuro: 120, bcvDollar: 110 }

test('pagos: pago en Bs se convierte correctamente a USD equivalente', () => {
  assert.equal(paymentBucket('Pago en BS'), 'Bs')
  assert.equal(paymentAmountUsd(1200, 'Pago en BS', rates), 10)
  assert.equal(paymentAmountBs(1200, 'Pago en BS', rates), 1200)
})

test('pagos: pago en USD/Zelle mantiene monto USD y calcula Bs con tasa congelada', () => {
  assert.equal(paymentBucket('Zelle'), 'Zelle')
  assert.equal(paymentAmountUsd(50, 'Zelle', rates), 50)
  assert.equal(paymentAmountBs(50, 'Zelle', rates, 100), 5000)
  assert.equal(amountBs(20, rates, 100), 2000)
})

test('pagos: pendiente por cobrar usa abono equivalente según método', () => {
  assert.equal(pendingAmount({ totalAmount: 100, amount: 6000, paymentMethod: 'Pago en BS', bcvEuroRate: 120 }, rates), 50)
  assert.equal(pendingAmount({ totalAmount: 100, amount: 40, paymentMethod: 'Zelle', bcvEuroRate: 120 }, rates), 60)
})

test('pagos: tasa congelada prioriza la tasa guardada del registro', () => {
  assert.equal(frozenEuroRateForRecord({ bcvEuroRate: 95 }, rates), 95)
  assert.equal(euroRateValue(rates, 95), 95)
})

test('roles: operator legacy mantiene acceso operativo', () => {
  assert.equal(normalizeRole('operator'), 'operator_general')
  assert.equal(normalizeRole('operador'), 'operator_general')
  assert.equal(roleHasPermission('operator', 'writeOperations'), true)
  assert.equal(roleHasPermission('operator', 'viewHr'), false)
})

test('roles: admin y contabilidad tienen permisos correctos', () => {
  assert.equal(roleHasPermission('admin', 'manageHr'), true)
  assert.equal(roleHasPermission('Contabilidad', 'viewAdmin'), true)
  assert.equal(roleHasPermission('Contabilidad', 'manageHr'), false)
  assert.equal(roleLabel({ role: 'solo lectura' }), 'Solo lectura')
})

test('mantenimiento: iCal/Airbnb nunca clasifica como mantenimiento', () => {
  assert.equal(isIcalImportedRecord({ source: 'ical', status: 'maintenance', maintenanceCost: 100 }), true)
  assert.equal(isMaintenanceRecord({ source: 'ical', status: 'maintenance', maintenanceCost: 100 }), false)
  assert.equal(isMaintenanceRecord({ channel: 'Airbnb', maintenancePaymentMethod: 'Zelle', maintenanceCost: 50 }), false)
})

test('mantenimiento: maintenanceType solo no basta para mantenimiento', () => {
  assert.equal(isMaintenanceRecord({ maintenanceType: 'Preventivo', status: 'reserved' }), false)
  assert.equal(isMaintenanceRecord({ status: 'maintenance' }), true)
  assert.equal(isMaintenanceRecord({ status: 'reserved', maintenanceCost: 45 }), true)
  assert.equal(normalizeStatus('No disponible'), 'pending')
})

test('mantenimiento: costo Bs usa tasa dólar BCV para mantenimiento', () => {
  assert.equal(maintenancePaymentBucket('Pago en BS'), 'Bs')
  assert.equal(maintenancePaymentBucket('USDT Binance'), 'Binance')
  assert.equal(maintenanceBsCost({ maintenanceCost: 10, bcvDollarRate: 90 }, rates), 1100)
})

test('operaciones públicas: token y snapshot son estables', () => {
  const token = generatePublicToken()
  assert.equal(typeof token, 'string')
  assert.ok(token.length >= 10)

  const task = publicTaskSnapshot({
    id: 'abc',
    reservationId: 'res-1',
    reservationType: 'vehicle',
    operation: 'delivery',
    assetName: 'Saipa Quick',
    customerName: 'Cliente',
  })
  assert.deepEqual(Object.keys(task).sort(), [
    'accommodationId', 'amount', 'assetLabel', 'assetName', 'customerName', 'group', 'id',
    'operation', 'operationDate', 'reservationId', 'reservationType', 'title', 'totalAmount', 'vehicleId',
  ].sort())
})

test('operaciones públicas: clasificación y etiquetas correctas', () => {
  assert.equal(isPublicLogisticsOperation({ reservationType: 'vehicle', operation: 'delivery' }), true)
  assert.equal(isPublicLogisticsOperation({ reservationType: 'vehicle', operation: 'reception' }), true)
  assert.equal(isPublicLogisticsOperation({ reservationType: 'lodging', operation: 'reception' }), true)
  assert.equal(isPublicLogisticsOperation({ reservationType: 'lodging', operation: 'delivery' }), false)
  assert.equal(publicOperationButtonLabel({ reservationType: 'vehicle', operation: 'reception' }), 'Abrir recepción')
  assert.equal(publicSubmissionLabel({ kind: 'lodging_cleaning' }), 'Limpieza alojamiento')
  assert.equal(publicSubmissionAsset({ payload: { assetName: 'Apto K-22' } }), 'Apto K-22')
})

console.log('\nPruebas de negocio aprobadas.')


test('validaciones V128: reserva bloquea fechas inválidas y abonos mayores al total', () => {
  assert.equal(validateReservationCritical({ vehicleId: 'v1', startDate: '2026-06-12', endDate: '2026-06-11', status: 'reserved', customerName: 'Jose' }), 'La fecha de inicio no puede ser mayor que la fecha final.')
  assert.equal(validateReservationCritical({ vehicleId: 'v1', startDate: '2026-06-12', endDate: '2026-06-13', status: 'reserved', customerName: 'Jose', totalAmount: 100, amount: 150, paymentMethod: 'Zelle' }, { exchangeRates: rates }), 'El abono no puede ser mayor al total de la reserva.')
})

test('validaciones V128: alojamiento ignora iCal en conflictos internos', () => {
  const error = validateLodgingCritical(
    { id: 'new', accommodationId: 'a1', startDate: '2026-06-12', endDate: '2026-06-14', status: 'reserved', customerName: 'Huésped' },
    { items: [{ id: 'ical1', accommodationId: 'a1', startDate: '2026-06-12', endDate: '2026-06-14', source: 'ical', status: 'reserved', customerName: 'Airbnb' }], exchangeRates: rates }
  )
  assert.equal(error, '')
})

test('validaciones V128: operaciones públicas exigen datos críticos', () => {
  assert.equal(validateVehicleOperationCritical({ vehicleId: 'v1', currentKm: '' }, 'delivery'), 'Debes colocar el kilometraje de salida.')
  assert.equal(validateCleaningCritical({ reservationId: 'r1', responsible: '' }), 'Selecciona el responsable de limpieza.')
  assert.equal(validatePublicSubmissionCritical('vehicle_reception', { taskId: 't1', vehicleId: 'v1', currentKm: '5000' }), '')
})


test('backups V129: manifiesto cuenta colecciones y registros', () => {
  const manifest = buildBackupManifest({ reservations: [{ id: '1' }, { id: '2' }], vehicles: [{ id: 'v1' }] })
  assert.equal(manifest.totalCollections, 2)
  assert.equal(manifest.totalRecords, 3)
  assert.equal(manifest.version, 'V129')
})

test('backups V129: sanitiza datos sensibles antes de exportar', () => {
  const clean = sanitizeForBackup({ customerName: 'Jose', customerId: 'V12345678', phone: '04141234567', nested: { paymentReference: 'ABC123456' } })
  assert.equal(clean.customerName, 'Jose')
  assert.notEqual(clean.customerId, 'V12345678')
  assert.notEqual(clean.phone, '04141234567')
  assert.equal(clean.nested.paymentReference.includes('****'), true)
})

test('backups V129: payload técnico incluye manifest y colecciones', () => {
  const payload = buildBackupPayload({ reservations: [{ id: '1', customerId: 'ABC123456' }] }, { sanitize: true })
  assert.equal(payload.manifest.totalRecords, 1)
  assert.equal(Array.isArray(payload.collections.reservations), true)
  assert.notEqual(payload.collections.reservations[0].customerId, 'ABC123456')
  assert.equal(backupFileName('test').startsWith('test-'), true)
})


test('salud V130: clasifica severidad de eventos críticos', () => {
  assert.equal(severityForEvent({ message: 'permission-denied Firebase' }), 'critical')
  assert.equal(severityForEvent({ message: 'Storage upload error' }), 'high')
  assert.equal(severityForEvent({ message: 'timeout de carga' }), 'medium')
})

test('salud V130: genera estado operativo según eventos', () => {
  const status = healthStatus([buildHealthEvent({ message: 'permission-denied', module: 'Firebase' })], { firebaseReady: true })
  assert.equal(status.status, 'critical')
  const ok = healthStatus([], { firebaseReady: true })
  assert.equal(ok.status, 'ok')
})

test('salud V130: snapshot y recomendaciones se generan correctamente', () => {
  const snapshot = buildHealthSnapshot({ events: [], stores: { reservations: [{ id: '1' }], auditLogs: [] }, context: { firebaseReady: true } })
  assert.equal(snapshot.collections.reservations, 1)
  assert.equal(Array.isArray(healthRecommendations(snapshot)), true)
})


test('ux V131: densidad mobile/web y targets táctiles correctos', () => {
  assert.equal(uxDensityForWidth(390), 'compact')
  assert.equal(uxDensityForWidth(800), 'comfortable')
  assert.equal(uxDensityForWidth(1200), 'desktop')
  assert.equal(touchTargetSize(390), 44)
  assert.equal(shouldUseCardTable(700), true)
  assert.equal(shouldUseCardTable(1000), false)
})

test('ux V131: estados vacíos y checklist se generan correctamente', () => {
  assert.equal(readableEmptyState(0, 'reservas'), 'No hay reservas para mostrar.')
  assert.equal(readableEmptyState(3, 'reservas'), '3 reservas')
  assert.equal(Array.isArray(uxChecklist()), true)
  assert.ok(uxChecklist().length >= 5)
})


test('producción V132: checklist y readiness calculan GO/NO-GO/PENDING', () => {
  assert.ok(PRODUCTION_CHECKLIST.length >= 8)
  const pending = productionReadinessStatus({})
  assert.equal(pending.status, 'PENDING')
  const failed = productionReadinessStatus({ smoke: true, business: false })
  assert.equal(failed.status, 'NO-GO')
  const allPassed = Object.fromEntries(PRODUCTION_CHECKLIST.map((item) => [item.id, true]))
  assert.equal(productionReadinessStatus(allPassed).status, 'GO')
})

test('producción V132: comandos y rollback quedan documentados', () => {
  assert.ok(deploymentCommands().some((cmd) => cmd.includes('quality:all')))
  assert.ok(deploymentCommands().some((cmd) => cmd.includes('firebase deploy')))
  assert.ok(rollbackPlan().length >= 4)
  assert.ok(CRITICAL_MANUAL_FLOWS.includes('Crear reserva Renta Car'))
})


test('fechas V135: formato de fechas inválidas no rompe la interfaz', () => {
  assert.equal(formatShortDate(''), '-')
  assert.equal(formatShortDate(undefined), '-')
  assert.equal(formatShortDate('Sin fecha'), '-')
  assert.equal(monthTitle('fecha mala'), '-')
})

test('fechas V135: rangos inválidos no generan errores', () => {
  assert.equal(rangesOverlap('', '', '2026-06-01', '2026-06-02'), false)
  assert.equal(isDateInsideRange('', '2026-06-01', '2026-06-02'), false)
})


test('inventario y divisas V137: App contiene reglas de caja para materiales y venta de dólares', () => {
  const appSource = fs.readFileSync('src/App.jsx', 'utf8')
  assert.equal(appSource.includes('INVENTORY_PAYMENT_METHODS'), true)
  assert.equal(appSource.includes('inventoryPurchaseRows'), true)
  assert.equal(appSource.includes('inventoryPaymentAmountBs'), true)
  assert.equal(appSource.includes('openDollarSaleForm'), true)
  assert.equal(appSource.includes('dollarSaleBsInRows'), true)
  assert.equal(appSource.includes('dollarSaleOutRows'), true)
})


test('operación V138: permite misma fecha si devolución ocurre antes de la siguiente entrega', () => {
  const current = { id: 'new', vehicleId: 'v1', startDate: '2026-06-11', endDate: '2026-06-12', deliveryTime: '09:00', returnTime: '09:00' }
  const next = { id: 'old', vehicleId: 'v1', startDate: '2026-06-12', endDate: '2026-06-15', deliveryTime: '12:00', returnTime: '12:00', status: 'reserved' }
  assert.equal(intervalsOverlapWithTime(current, next), false)
  assert.equal(validateNoDateConflict(current, [next], { assetField: 'vehicleId', useTime: true, startTimeField: 'deliveryTime', endTimeField: 'returnTime' }), null)
})

test('operación V138: bloquea misma fecha si devolución ocurre después de la siguiente entrega', () => {
  const current = { id: 'new', vehicleId: 'v1', startDate: '2026-06-11', endDate: '2026-06-12', deliveryTime: '09:00', returnTime: '14:00' }
  const next = { id: 'old', vehicleId: 'v1', startDate: '2026-06-12', endDate: '2026-06-15', deliveryTime: '12:00', returnTime: '12:00', status: 'reserved' }
  assert.equal(intervalsOverlapWithTime(current, next), true)
})


test('gastos V139: inventario y mantenimiento tienen estado de pago para no crear cuentas por pagar pagadas', () => {
  const appSource = fs.readFileSync('src/App.jsx', 'utf8')
  assert.equal(appSource.includes('EXPENSE_PAYMENT_STATUS'), true)
  assert.equal(appSource.includes('expenseStatus'), true)
  assert.equal(appSource.includes('payableExpenseRows'), true)
  assert.equal(appSource.includes('paidExpenseRows'), true)
})


test('caja V140: caja principal usa Bs reales y no muestra caja sin método', () => {
  const appSource = fs.readFileSync('src/App.jsx', 'utf8')
  assert.equal(appSource.includes('cashRowBsValue'), true)
  assert.equal(appSource.includes('dollarPurchaseOutBs'), true)
  assert.equal(appSource.includes("['Efectivo $','Zelle','Binance'].map"), true)
  assert.equal(appSource.includes("'Sin método'].map"), false)
})


test('caja V141: balance principal Bs no convierte cajas USD a bolívares', () => {
  const appSource = fs.readFileSync('src/App.jsx', 'utf8')
  assert.equal(appSource.includes('cashRowBsOnlyValue'), true)
  assert.equal(appSource.includes('cashRowBsOnlyValue(item)'), true)
  assert.equal(appSource.includes('expensesBs = expenseRowsForTotals.reduce'), true)
})


test('caja V142: movimientos sin método no se suman ni se muestran como caja', () => {
  const appSource = fs.readFileSync('src/App.jsx', 'utf8')
  assert.equal(appSource.includes("return 'Sin método'"), true)
  assert.equal(appSource.includes('filter(isConsistentCashRow)'), true)
  assert.equal(appSource.includes('allowedCashBuckets.map'), true)
  assert.equal(appSource.includes('noMethodRows'), true)
})


test('caja V143: movimientos Bs inconsistentes se excluyen de caja', () => {
  const appSource = fs.readFileSync('src/App.jsx', 'utf8')
  assert.equal(appSource.includes('isConsistentCashRow'), true)
  assert.equal(appSource.includes('cashRowUsdEquivalent'), true)
  assert.equal(appSource.includes('inconsistentBsRows'), true)
  assert.equal(appSource.includes('dataQualityRows: []'), true)
})


test('anulación V144: devolución cancela reserva y exige referencia/comprobante', () => {
  const appSource = fs.readFileSync('src/App.jsx', 'utf8')
  assert.equal(appSource.includes('Anulación/Devolución'), true)
  assert.equal(appSource.includes('submitRefundCancellation'), true)
  assert.equal(appSource.includes('refundReference'), true)
  assert.equal(appSource.includes('refundProof'), true)
  assert.equal(appSource.includes("status: 'cancelled'"), true)
  assert.equal(appSource.includes("category: 'Anulación / devolución'"), true)
})


test('anulación V145: botón abre formulario usable y devolución no queda como cuenta por pagar', () => {
  const appSource = fs.readFileSync('src/App.jsx', 'utf8')
  assert.equal(appSource.includes('setEditingReservation(null)'), true)
  assert.equal(appSource.includes('setEditingLodging(null)'), true)
  assert.equal(appSource.includes('comprobante-anulacion-devolucion'), true)
  assert.equal(appSource.includes("showSuccess('Anulación guardada con éxito')"), true)
  assert.equal(appSource.includes("const payables = [...payableExpenseRows, ...commissionRows]"), true)
  assert.equal(appSource.includes('...validRefundRows, ...commissionRows]'), true)
})


test('anulación V146: flujo cierra modal, libera calendario y registra egreso', () => {
  const appSource = fs.readFileSync('src/App.jsx', 'utf8')
  assert.equal(appSource.includes('setEditingReservation(null)'), true)
  assert.equal(appSource.includes('setEditingLodging(null)'), true)
  assert.equal(appSource.includes('calendarReleased: true'), true)
  assert.equal(appSource.includes('receivableClosed: true'), true)
  assert.equal(appSource.includes('adminExpenseRegistered: true'), true)
  assert.equal(appSource.includes('refundBcvEuroRate'), true)
  assert.equal(appSource.includes('function isReservationCancelled'), true)
})



test('ical operaciones V148: iCal aparece deduplicado y con alojamiento resuelto', () => {
  const appSource = fs.readFileSync('src/App.jsx', 'utf8')
  assert.equal(appSource.includes('rawLodgingRows'), true)
  assert.equal(appSource.includes('new Map()).values()'), true)
  assert.equal(appSource.includes('Check-out alojamiento iCal / limpieza'), true)
  assert.equal(appSource.includes('resolvedAccommodationName'), true)
})

test('anulación V148: devolución descuenta caja por método y queda en movimientos derivados', () => {
  const appSource = fs.readFileSync('src/App.jsx', 'utf8')
  assert.equal(appSource.includes('refundRows.filter(isConsistentCashRow).forEach'), true)
  assert.equal(appSource.includes("category: 'Anulación / devolución'"), true)
  assert.equal(appSource.includes('refundBcvEuroRate'), true)
})


test('operaciones finales V150: iCal sin vincular no aparece y anulación ejecuta flujo directo', () => {
  const appSource = fs.readFileSync('src/App.jsx', 'utf8')
  assert.equal(appSource.includes('unresolvedIcal'), true)
  assert.equal(appSource.includes('if (unresolvedIcal) return []'), true)
  assert.equal(appSource.includes('noValidate onSubmit={submitRefundCancellation}'), true)
  assert.equal(appSource.includes('event?.preventDefault?.()'), true)
  assert.equal(appSource.includes('setOperationsRevision((value) => value + 1)'), true)
  assert.equal(appSource.includes('!isReservationCancelled(item) && pendingAmount'), true)
})


test('normalización V151: cancelled deja de comportarse como reservado', () => {
  const appSource = fs.readFileSync('src/App.jsx', 'utf8')
  assert.equal(appSource.includes("['cancelled', 'canceled', 'cancelada'"), true)
  assert.equal(appSource.includes('function isReservationCancelled'), true)
  assert.equal(appSource.includes('const vehicleReservations = reservationsStore.items.filter((reservation) => reservation.vehicleId === selectedVehicle?.id && !isReservationCancelled(reservation))'), true)
  assert.equal(appSource.includes('const accommodationReservations = lodgingStore.items.filter((reservation) => reservation.accommodationId === selectedAccommodation?.id && !isReservationCancelled(reservation))'), true)
  assert.equal(appSource.includes('.filter((item) => isReservationCancelled(item) && num(item.refundAmount) > 0)'), true)
  assert.equal(appSource.includes('.filter((item) => !isReservationCancelled(item) && pendingAmount(item, exchangeRates) > 0)'), true)
})


test('anulación V152: botón guardar siempre accionable y referencia automática', () => {
  const appSource = fs.readFileSync('src/App.jsx', 'utf8')
  assert.equal(appSource.includes('noValidate onSubmit={submitRefundCancellation}'), true)
  assert.equal(appSource.includes('refund-submit-action'), true)
  assert.equal(appSource.includes('ANULACION-${Date.now()}'), true)
  assert.equal(appSource.includes('Debes colocar número de referencia'), false)
  assert.equal(appSource.includes("method: item.refundPaymentMethod || item.paymentMethod || 'Pago en BS'"), true)
})


test('V153: guardar reserva accionable y caja limpia sin saldos negativos visibles', () => {
  const appSource = fs.readFileSync('src/App.jsx', 'utf8')
  assert.equal(appSource.includes('noValidate onSubmit={saveReservation}'), true)
  assert.equal(appSource.includes('reservation-save-action'), true)
  assert.equal(appSource.includes('onClick={()=>saveReservation()}'), true)
  assert.equal(appSource.includes('const validRefundRows = refundRows.filter(isConsistentCashRow)'), true)
  assert.equal(appSource.includes('visibleProfitBs = Math.max(0, incomeBs - expensesBs)'), true)
  assert.equal(appSource.includes('movimientos excluidos de caja'), false)
})


test('V154: validaciones de calendario ignoran anuladas/devoluciones', () => {
  assert.equal(normalizeDomainStatus('cancelled'), 'cancelled')
  assert.equal(normalizeDomainStatus('Anulada / devolución'), 'cancelled')
  assert.equal(isRecordCancelled({ status: 'reserved', refundAt: '2026-06-13T00:00:00.000Z' }), true)
  const validationsSource = fs.readFileSync('src/domain/validations.js', 'utf8')
  assert.equal(validationsSource.includes('if (isRecordCancelled(item)) return false'), true)
})

import { isNonBlockingShortMaintenance, maintenanceCalendarDurationDays } from '../src/domain/maintenance.js'

test('V177: mantenimiento menor o igual a 1 día no bloquea calendario ni conflictos', () => {
  const shortMaintenance = { id: 'm1', vehicleId: 'v1', status: 'maintenance', startDate: '2026-06-14', endDate: '2026-06-15', maintenanceCost: 20 }
  assert.equal(maintenanceCalendarDurationDays(shortMaintenance), 1)
  assert.equal(isNonBlockingShortMaintenance(shortMaintenance), true)
  const conflict = validateNoDateConflict(
    { id: 'new', vehicleId: 'v1', status: 'reserved', startDate: '2026-06-14', endDate: '2026-06-15' },
    [shortMaintenance],
    { assetField: 'vehicleId' }
  )
  assert.equal(conflict, null)
})

test('V177: mantenimiento mayor a 1 día sigue bloqueando calendario', () => {
  const longMaintenance = { id: 'm2', vehicleId: 'v1', status: 'maintenance', startDate: '2026-06-14', endDate: '2026-06-16', maintenanceCost: 20 }
  assert.equal(maintenanceCalendarDurationDays(longMaintenance), 2)
  assert.equal(isNonBlockingShortMaintenance(longMaintenance), false)
  const conflict = validateNoDateConflict(
    { id: 'new', vehicleId: 'v1', status: 'reserved', startDate: '2026-06-14', endDate: '2026-06-15' },
    [longMaintenance],
    { assetField: 'vehicleId' }
  )
  assert.equal(conflict?.id, 'm2')
})

test('seguridad V207: Firestore restringe escrituras sensibles por rol', () => {
  const rules = fs.readFileSync('firestore.rules', 'utf8')
  assert.ok(rules.includes('match /generalExpenses/{docId}'))
  assert.ok(rules.includes('match /dollarPurchases/{docId}'))
  assert.ok(rules.includes('match /hrPeople/{docId}'))
  assert.ok(rules.includes('allow create, update: if canManageFinance();'))
  assert.ok(rules.includes('allow create, update: if canManageHr();'))
  assert.ok(rules.includes('allow create, update, delete: if isAdmin();'))
})

test('seguridad V207: Storage restringe rutas conocidas y bloquea fallback', () => {
  const rules = fs.readFileSync('storage.rules', 'utf8')
  assert.ok(rules.includes('match /reservation-docs/{uid}/{fileName}'))
  assert.ok(rules.includes('match /vehicle-checkins/{uid}/{fileName}'))
  assert.ok(rules.includes('match /catalog-photos/{assetId}/{fileName}'))
  assert.ok(rules.includes('allow write: if false;'))
})
