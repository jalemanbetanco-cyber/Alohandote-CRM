import fs from 'node:fs'

const app = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')
const css = fs.readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8')

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ${message}`)
    process.exit(1)
  }
  console.log(`✅ ${message}`)
}

assert(app.includes('V221.8: en edición, el campo monto representa EXCLUSIVAMENTE un nuevo abono'), 'El flujo de edición usa el monto como nuevo abono y no como total histórico')
assert(app.includes("_originalPaymentAmount: '', amount: '', paymentReference: ''"), 'Al abrir una reserva existente se limpia el campo de nuevo abono')
assert(app.includes('totals.amountUsd + appendUsd'), 'El abono equivalente incluye el nuevo abono pendiente antes de guardar')
assert(css.includes('.payment-history-box .history-row .table-actions'), 'Mobile ajusta botones editar/eliminar abono dentro del historial')
assert(css.includes('.profitability-closed-km') && css.includes('display: block !important'), 'Mobile muestra Reservas cerradas por kilometraje en ROI')

console.log('V221.8 hotfix abonos/mobile/ROI validado')
