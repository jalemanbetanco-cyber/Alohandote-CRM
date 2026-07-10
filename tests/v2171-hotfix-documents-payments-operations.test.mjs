import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const app = readFileSync('src/App.jsx', 'utf8')
const template = readFileSync('src/modules/documents/v211Templates.js', 'utf8')
const branding = readFileSync('src/modules/documents/branding.js', 'utf8')

assert.ok(template.includes('display:none'), 'V217.1 debe eliminar la línea naranja bajo el título del documento')
assert.ok(branding.includes('📷 @alohandote'), 'Footer PDF debe incluir emoji Instagram')
assert.ok(branding.includes('📱 04248639102'), 'Footer PDF debe incluir emoji WhatsApp')
assert.ok(branding.includes('✉️ ventas@alohandote.com'), 'Footer PDF debe incluir emoji correo')
assert.ok(app.includes('function documentMoneyValue'), 'Debe existir helper para mostrar solo USD cuando el método no es Bs')
assert.ok(app.includes('function documentFinancialAmountLabel'), 'Debe existir encabezado financiero dinámico para PDF')
assert.ok(app.includes('Ingresar abono para reservar.'), 'Debe bloquear reserva sin abono')
assert.ok(app.includes('expiresInDays: 30'), 'Link público de operaciones debe extender vigencia a 30 días')

console.log('V217.1 hotfix documentos, abono obligatorio y operaciones OK')
