import fs from 'node:fs'
const docs = [
  ['Runbook', 'docs/GO_LIVE_RUNBOOK_V166.md'],
  ['Checklist QA', 'docs/QA_REGRESSION_CHECKLIST_V166.md'],
  ['Rollback', 'docs/ROLLBACK_PLAN_V166.md'],
  ['Informe ejecutivo', 'INFORME_EJECUTIVO_FINAL_V166.md'],
]
console.log('Alohandote V166 · Documentación Go-Live')
for (const [name, path] of docs) console.log(`${fs.existsSync(path) ? 'OK' : 'PENDIENTE'} ${name}: ${path}`)
console.log('\nComando Go/No-Go: npm run release:go-no-go')
