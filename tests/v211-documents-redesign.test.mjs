import fs from 'node:fs'
import assert from 'node:assert/strict'

const app = fs.readFileSync('src/App.jsx', 'utf8')
const branding = fs.readFileSync('src/modules/documents/branding.js', 'utf8')
const template = fs.readFileSync('src/modules/documents/v211Templates.js', 'utf8')
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))

assert.ok(/^1\.0\.(211|21[2-9]|2[2-9][0-9]|[3-9][0-9]{2,})$/.test(pkg.version), 'package.json debe declarar versión V211 o superior')
assert.ok(app.includes('buildV211DocumentHtml'), 'App debe usar plantillas V211 en documentos de reserva/cotización')
assert.ok(template.includes('Cotización de alojamiento') === false, 'La plantilla debe ser genérica y no acoplar textos por módulo')
assert.ok(branding.includes('Alojamientos & Rent a Car'), 'Branding debe usar el subtítulo corporativo oficial')
assert.ok(branding.includes('04248639102'), 'Footer debe mantener teléfono oficial')
assert.ok(branding.includes('@alohandote'), 'Footer debe mantener Instagram oficial')
assert.ok(!app.includes('Documento comercial genérico'), 'V211 elimina Documento comercial genérico de cotizaciones/recibos')
assert.ok(!app.includes('Alojamiento vacacional'), 'V211 elimina subtítulo redundante Alojamiento vacacional')
assert.ok(!app.includes('Este comprobante confirma el bloqueo de fechas del vehículo'), 'V211 elimina bloque de políticas del recibo Renta Car')
assert.ok(!app.includes('La reserva queda sujeta a condiciones del servicio'), 'V211 elimina textos legales/políticas visibles en comprobantes')
console.log('✅ V211 documentos minimalistas: pruebas OK')
