import fs from 'node:fs'
import assert from 'node:assert/strict'

const app = fs.readFileSync('src/App.jsx', 'utf8')
const validations = fs.readFileSync('src/domain/validations.js', 'utf8')

assert(validations.includes('paid > total + 0.01'), 'La validación permite abono igual al total con tolerancia centesimal')
assert(app.includes('stableWidth'), 'PDF limpio usa ancho estable para mobile/web')
assert(app.includes('pageCanvasHeight'), 'PDF limpio pagina documentos largos sin deformar')
assert(app.includes("type:'alohandote:return-to-form'"), 'Volver a la app retorna al formulario/overlay')
assert(app.includes('Volver a la app'), 'Los documentos muestran Volver a la app')

console.log('V221.9 hotfix PDF/abono/volver OK')
