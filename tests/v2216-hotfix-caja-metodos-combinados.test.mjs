import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'

const source = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')

assert(source.includes('V221.6 Hotfix Caja Métodos Combinados'), 'Debe documentarse la corrección V221.6')
assert(source.includes('.flatMap((item) => {'), 'incomeRows debe generar filas por abono, no una sola fila por reserva')
assert(source.includes('normalizePaymentHistory(item)'), 'Debe usar historial de abonos congelado como fuente de verdad')
assert(source.includes('method: paymentMethod'), 'Cada fila de caja debe conservar el método real del abono')
assert(source.includes('amountBsManual: alohandoteBs'), 'Cada fila debe conservar Bs congelados del abono')
assert(source.includes('paymentId:'), 'Cada fila de caja debe ser trazable al abono específico')

console.log('V221.6 OK: caja distribuye abonos combinados por método real')
