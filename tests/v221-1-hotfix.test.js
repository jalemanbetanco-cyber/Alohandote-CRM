import assert from 'node:assert/strict'
import fs from 'node:fs'

const app = fs.readFileSync('src/App.jsx','utf8')
const tpl = fs.readFileSync('src/modules/documents/v211Templates.js','utf8')

assert.ok(app.includes('frozenPaidUsdForDisplay'), 'Debe existir cálculo congelado para abono equivalente USD')
assert.ok(app.includes('frozenPendingUsdForDisplay'), 'Debe existir cálculo congelado para diferencia pendiente')
assert.ok(app.includes('setIcalSyncingAccommodationId'), 'Debe existir bloqueo de doble clic/sincronización iCal')
assert.ok(app.includes('No se eliminaron los bloqueos anteriores ni se desvinculó el calendario'), 'Sync iCal no debe desvincular ante error')
assert.ok(!tpl.includes('Formato genérico'), 'PDF no debe mostrar Formato genérico')
assert.ok(!tpl.includes('<strong>Documento</strong><small>Formato genérico</small>'), 'PDF no debe mostrar Documento/Formato genérico')
console.log('V221.1 hotfix tests OK')
