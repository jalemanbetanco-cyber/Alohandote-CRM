import fs from 'node:fs'
import assert from 'node:assert/strict'

const app = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')
const css = fs.readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8')

assert.match(app, /function publicOperationRowActions\(item = \{\}\)/, 'Debe existir el bloque de acciones de tareas públicas')
assert.match(app, /Contrato PDF<\/button>/, 'Debe existir el botón Contrato PDF')
assert.match(css, /\.public-op-actions[\s\S]*@media \(max-width: 768px\)/, 'Las acciones deben ser visibles y adaptables en mobile')

assert.match(app, /addCanvasToSinglePdfPage\(mobilePdf,mobileCanvas,210,297,4\)/, 'El contrato mobile debe usar una sola página A4')
assert.match(app, /var sideMargin=5;/, 'El PDF mobile debe usar margen lateral mínimo')
assert.match(app, /page\.style\.padding='8mm 8mm 7mm 8mm'/, 'La captura mobile debe reducir márgenes HTML')

assert.match(app, /apt\?\.id && apt\?\.active !== false && accommodationIcalUrls\(apt\)\.length/, 'El scheduler debe excluir alojamientos inactivos')
assert.match(app, /return isDayWindow \? 60 \* 60 \* 1000 : 3 \* 60 \* 60 \* 1000/, 'Propios deben usar 1h diurna y 3h nocturna')
assert.match(app, /if \(isAlly\) return 3 \* 60 \* 60 \* 1000/, 'Aliados deben usar intervalo de 3h')

assert.match(app, /previousImportedByIdentity/, 'La reconciliación iCal debe preservar estado operativo')
assert.match(app, /preservedOperationalState/, 'Los registros recreados deben recuperar marcas completadas')
assert.match(app, /'cleaningCompletedAt'/, 'Debe preservarse limpieza completada')
assert.match(app, /'checkInDoneAt'/, 'Debe preservarse check-in completado')
assert.match(app, /'checkOutDoneAt'/, 'Debe preservarse check-out completado')

console.log('✓ V223.5.10 hotfix regression checks passed')
