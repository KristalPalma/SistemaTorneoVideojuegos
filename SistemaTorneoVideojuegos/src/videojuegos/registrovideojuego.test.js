import test from 'node:test'
import assert from 'node:assert/strict'
import { createGameRegistry, validateGame } from './registrovideojuego.js'
import { navigationFor, resolveRoute } from '../auth/routes.js'

test('respeta los limites de nombre y genero de la API', () => {
  assert.deepEqual(validateGame({ name: 'a'.repeat(100), genre: 'b'.repeat(50) }), {})
  assert.ok(validateGame({ name: 'a'.repeat(101), genre: 'Lucha' }).name)
  assert.ok(validateGame({ name: 'Tekken', genre: 'b'.repeat(51) }).genre)
  assert.ok(validateGame({ name: 'Tek\nken', genre: 'Lucha' }).name)
})

test('nombre y genero son obligatorios y no aceptan solo espacios', () => {
  for (const value of ['', '   ']) {
    assert.deepEqual(Object.keys(validateGame({ name: value, genre: value })), ['name', 'genre'])
  }
  assert.deepEqual(validateGame({ name: 'Valorant', genre: 'Disparos' }), {})
})

test('guarda datos limpios, genera IDs distintos y rechaza duplicados', async () => {
  const registry = createGameRegistry()
  const first = await registry.register({ name: ' Valorant ', genre: ' Disparos ' })
  assert.equal(first.game.name, 'Valorant')
  assert.equal(first.game.genre, 'Disparos')
  assert.match(first.game.id, /^[0-9a-f-]{36}$/)
  assert.ok((await registry.register({ name: ' VALORANT ', genre: 'Otro' })).errors.name)
  const second = await registry.register({ name: 'Tekken', genre: 'Lucha' })
  assert.notEqual(first.game.id, second.game.id)
})

test('un registro invalido no reserva el nombre', async () => {
  const registry = createGameRegistry()
  assert.ok((await registry.register({ name: 'Valorant', genre: '' })).errors.genre)
  assert.ok((await registry.register({ name: 'Valorant', genre: 'Disparos' })).game)
})

test('el menu y la ruta permiten registrar videojuegos solo a Superadmin', () => {
  const path = '/superadmin/videojuegos'
  assert.equal(resolveRoute(path, null).redirect, '/login')
  assert.equal(resolveRoute(path, { role: 'admin' }).redirect, '/admin')
  assert.equal(resolveRoute(path, { role: 'superadmin' }).route.path, path)
  assert.ok(navigationFor({ role: 'superadmin' }).some(item => item.path === path))
  assert.ok(!navigationFor({ role: 'admin' }).some(item => item.path === path))
})
