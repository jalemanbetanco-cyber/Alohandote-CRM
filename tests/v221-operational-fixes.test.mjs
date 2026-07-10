import fs from 'node:fs'
import assert from 'node:assert/strict'

const app = fs.readFileSync('src/App.jsx', 'utf8')
const template = fs.readFileSync('src/modules/documents/v211Templates.js', 'utf8')
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))

assert.equal(pkg.version, '1.0.221', 'package version debe ser 1.0.221')
assert.ok(pkg.scripts['test:v221'], 'script test:v221 requerido')
assert.ok(pkg.scripts['production:check'].includes('test:v221'), 'production:check debe incluir V221')

assert.ok(app.includes('paymentAppendRawAmountOnSave'), 'V221 debe recalcular abono incremental después de editar/eliminar')
assert.ok(app.includes('paymentValidationDraft'), 'V221 debe validar abonos contra historial real')
assert.ok(app.includes('buildPaymentEntry(paymentAppendRawAmountOnSave(editingLodging'), 'alojamientos deben registrar solo diferencial de abono nuevo')
assert.ok(app.includes('buildPaymentEntry(paymentAppendRawAmountOnSave(editingReservation'), 'renta car debe registrar solo diferencial de abono nuevo')

assert.ok(template.includes('generic = false'), 'template debe soportar documento genérico')
assert.ok(!template.includes('Formato genérico'), 'PDF genérico no debe mostrar texto Formato genérico')
assert.ok(app.includes('usesGenericSellerDocuments(profile)'), 'App debe aplicar PDF genérico para vendedores')

assert.ok(app.includes('setInterval(() => { syncAllExternalIcalsSilent() }, 10 * 60 * 1000)'), 'sincronización iCal debe ejecutarse cada 10 minutos')
assert.ok(app.includes('accommodationOverride'), 'sync iCal debe poder sincronizar todos los alojamientos sin depender del seleccionado')

assert.ok(app.includes('publicOperationsMode && isAlliedVehicle(vehicle)'), 'operaciones públicas deben excluir vehículos aliados')
assert.ok(app.includes('publicOperationsMode && isAlliedAccommodation(apt)'), 'operaciones públicas deben excluir alojamientos aliados')

assert.ok(app.includes('microwave') && app.includes('Microondas'), 'formulario alojamiento debe incluir microondas')
assert.ok(app.includes('airFryer') && app.includes('Air fryer'), 'formulario alojamiento debe incluir Air fryer')

assert.ok(app.includes('ownershipType: editingVehicle.ownershipType') && app.includes('ownerPayableVehicleAlly'), 'renta car debe soportar aliado y CxP propietario')
console.log('✅ V221 correcciones operativas y aliados Renta Car validadas')
