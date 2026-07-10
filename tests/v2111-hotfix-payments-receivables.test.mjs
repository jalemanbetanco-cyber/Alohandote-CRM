import fs from 'node:fs'
import assert from 'node:assert/strict'

const app = fs.readFileSync('src/App.jsx', 'utf8')

assert.match(app, /V211\.1 Hotfix: si el usuario editó o eliminó abonos/, 'V211.1 debe documentar que los abonos editados/eliminados usan el borrador visible como fuente de verdad')
assert.match(app, /editingLodging\?\._paymentsEdited \? normalizePaymentHistory\(editingLodging\)/, 'Alojamientos debe persistir cambios de edición/eliminación de abonos sin releer el registro viejo')
assert.match(app, /V211\.1 Hotfix: Cuentas por cobrar debe existir para cualquier reserva con saldo pendiente/, 'V211.1 debe ampliar CxC a reservas con saldo pendiente en divisas')
assert.match(app, /reservationHasCollectedPayment\(item, exchangeRates\)/, 'CxC debe exigir que exista abono real antes de registrar saldo por cobrar')
assert.match(app, /pendingCurrency: isBsPaymentMethod\(method\) \? 'Bs' : 'USD'/, 'CxC debe conservar moneda operativa Bs/USD según método de pago')

console.log('✅ V211.1 Hotfix pagos/CxC validado')
