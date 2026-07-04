import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const app = readFileSync('src/App.jsx', 'utf8')

assert.ok(app.includes('email: \'\''), 'V218.1 debe agregar email a los drafts de reservas/cotizaciones')
assert.ok(app.includes("Correo electrónico<input"), 'V218.1 debe mostrar campo correo electrónico en formularios')
assert.ok(app.includes("email: (isMaintenance || isNoDisponible) ? '' : (editingReservation.email || '').trim()"), 'Renta Car debe persistir email del cliente')
assert.ok(app.includes("email: status === 'reserved' ? (editingLodging.email || '').trim() : ''"), 'Alojamientos debe persistir email del huésped')
assert.ok(app.includes('function formatDocumentDayDate'), 'V218.1 debe incluir formato de fecha con día para documentos')
assert.ok(app.includes("{ label: 'Entrega', value: formatDocumentDayDate(reservation.startDate) }"), 'PDF Renta Car debe usar fecha con día en entrega')
assert.ok(app.includes("{ label: 'Devolución', value: formatDocumentDayDate(reservation.endDate) }"), 'PDF Renta Car debe usar fecha con día en devolución')
assert.ok(app.includes("{ label: 'Check In', value: formatDocumentDayDate(reservation.startDate) }"), 'PDF alojamiento debe usar fecha con día en check in')
assert.ok(app.includes("{ label: 'Check Out', value: formatDocumentDayDate(reservation.endDate) }"), 'PDF alojamiento debe usar fecha con día en check out')
assert.ok(!app.includes("{ label: 'Kilometraje aproximado', value: reservation.approxKm ? `${reservation.approxKm} km` : 'No indicado' }"), 'Cotización/recibo Renta Car no debe mostrar kilometraje aproximado')
const contractStart = app.indexOf('function generateContract')
const contractEnd = app.indexOf('function handleKmChange')
const contractBlock = app.slice(contractStart, contractEnd)
assert.ok(!contractBlock.includes('alohandoteContactFooter()'), 'Contrato Renta Car no debe incluir bloque de contacto inferior')

console.log('V218.1 hotfix documentos, email y fechas OK')
