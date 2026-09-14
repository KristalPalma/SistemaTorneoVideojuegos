import test from 'node:test'
import assert from 'node:assert/strict'
import { validateScore, loadScoreCatalogs, startScoreOperation } from './scoreService.js'
import { resolveRoute } from '../auth/routes.js'

test('valida selecciones, limites y cero sin confundirlo con vacio', async () => {
  const { players, games } = await loadScoreCatalogs(true)
  for (const score of ['', '-1', '1.5', '2147483648', 'abc']) {
    assert.ok(validateScore({ player: '1', game: '1', score }, players, games).score)
  }
  assert.deepEqual(validateScore({ player: '1', game: '1', score: '0' }, players, games), {})
  assert.deepEqual(validateScore({ player: '1', game: '1', score: '2147483647' }, players, games), {})
  assert.ok(validateScore({ player: '99', game: '99', score: '5' }, players, games).player)
  assert.equal(Object.keys(validateScore({ player: '', game: '', score: '' }, players, games)).length, 3)
})

test('demo reutiliza la operacion y una nueva puntuacion recibe otra clave', async () => {
  const body = { ID_jugador: 1, ID_videojuego: 1, puntuacion: 0 }
  const operation = startScoreOperation(body, true)
  const first = await operation.submit()
  assert.deepEqual(first, { demo: true })
  assert.deepEqual(await operation.submit(), first)
  assert.match(operation.key, /^[0-9a-f-]{36}$/)
  assert.notEqual(startScoreOperation(body, true).key, operation.key)
})

test('solo Admin accede a puntuaciones', () => {
  assert.equal(resolveRoute('/admin/puntuaciones', null).redirect, '/login')
  assert.equal(resolveRoute('/admin/puntuaciones', { role: 'superadmin' }).redirect, '/superadmin')
  assert.ok(resolveRoute('/admin/puntuaciones', { role: 'admin' }).route)
})
