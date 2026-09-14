import test from 'node:test'
import assert from 'node:assert/strict'
import { validateGame } from './registrovideojuego.js'
import { resolveRoute } from '../auth/routes.js'

test('RF02 valida campos y limites antes de enviar', () => {
  assert.equal(Object.keys(validateGame({ name: ' ', genre: '' })).length, 2)
  assert.ok(validateGame({ name: 'a'.repeat(101), genre: 'Lucha' }).name)
  assert.ok(validateGame({ name: 'Tekken', genre: 'b'.repeat(51) }).genre)
  assert.deepEqual(validateGame({ name: 'Tekken', genre: 'Lucha' }), {})
})
test('solo Superadmin accede al formulario', () => {
  assert.equal(resolveRoute('/superadmin/videojuegos', null).redirect, '/login')
  assert.equal(resolveRoute('/superadmin/videojuegos', { role: 'admin' }).redirect, '/admin')
  assert.ok(resolveRoute('/superadmin/videojuegos', { role: 'superadmin' }).route)
})
