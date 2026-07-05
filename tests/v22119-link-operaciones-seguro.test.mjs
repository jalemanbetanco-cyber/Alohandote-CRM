import fs from 'node:fs'
import assert from 'node:assert/strict'

const app = fs.readFileSync('src/App.jsx', 'utf8')
const rules = fs.readFileSync('firestore.rules', 'utf8')

assert.match(app, /function operationsPublicLink\(token = ''\)/, 'Debe existir generador de link corto')
assert.doesNotMatch(app, /url\.searchParams\.set\('ops'/, 'El link de operaciones no debe incluir ops embebido')
assert.match(app, /setDoc\(doc\(db, 'publicReceptionTokens', token\), payload\)/, 'Debe guardar tareas bajo el token en Firestore')
assert.match(app, /await getDoc\(doc\(db, 'publicReceptionTokens', publicOperationsToken\)\)/, 'El link público debe leer por token corto')
assert.match(rules, /match \/publicReceptionTokens\/\{tokenId\}/, 'Reglas deben exponer tokens públicos')
assert.match(rules, /allow get: if resource\.data\.active == true/, 'Debe permitirse get público de tokens activos')
assert.match(rules, /allow list: if false/, 'No debe permitirse listar tokens públicos')

console.log('V221.19 link operaciones seguro OK')
