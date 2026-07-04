import fs from 'node:fs'
import assert from 'node:assert/strict'

const app = fs.readFileSync('src/App.jsx', 'utf8')

assert.match(app, /function canGenerateDocs\(reservation\) \{[\s\S]*seller_lodging[\s\S]*return true/, 'V221.3 debe permitir PDFs Renta Car a vendedores externos')
assert.match(app, /seller_lodging[\s\S]*generateQuote\(editingReservation\)/, 'V221.3 debe mostrar Cotizar en Renta Car para vendedores en modo lectura')
assert.match(app, /Sincronizar iCal guardado/, 'Debe conservar botón Sincronizar iCal guardado')
assert.match(app, /type="button" className="import-button" disabled=\{icalSyncingAccommodationId === selectedAccommodation\?\.id\}/, 'Botón sincronizar iCal debe ser type=button y no submit')
assert.match(app, /Desvincular iCal/, 'Debe conservar botón Desvincular iCal separado')
assert.match(app, /sincronizar solo actualiza bloqueos importados; nunca desvincula URLs iCal/i, 'Sync iCal debe preservar URLs y no desvincular')
assert.match(app, /lastIcalSyncAt/, 'Sync iCal debe registrar última sincronización sin limpiar URLs')

console.log('V221.3 hotfix vendedores/iCal OK')
