import test from 'node:test'
import assert from 'node:assert/strict'
import { canManageGames, filterGames, loadGameCatalog } from './consultaVideojuegosService.js'
import { matchingGenres } from './generos.js'
import { gameRegistry } from './registrovideojuego.js'
import { apiClient } from '../api/apiClient.js'
import { navigationFor, resolveRoute } from '../auth/routes.js'

const game = { ID: 8, nombre: 'Tekken 8', genero: 'Lucha' }

test('publico consulta; solo superadmin gestiona; admin no tiene videojuegos en menu', () => {
  assert.ok(navigationFor(null).some(route => route.path === '/videojuegos'))
  assert.ok(resolveRoute('/videojuegos', null).route)
  assert.equal(canManageGames(null), false)
  assert.equal(canManageGames({ role: 'Administrador' }), false)
  assert.equal(canManageGames({ role: 'Superadministrador' }), true)
  assert.ok(navigationFor({ role: 'Superadministrador' }).some(route => route.path === '/superadmin/videojuegos/gestion'))
  assert.equal(navigationFor({ role: 'Administrador' }).some(route => route.path.includes('videojuegos')), false)
  assert.equal(resolveRoute('/superadmin/videojuegos/gestion', { role: 'Administrador' }).redirect, '/admin')
})

test('catalogo recorre las paginas existentes, busca tambien en la ultima y no envia buscar a la API', async () => {
  const calls = []
  const games = await loadGameCatalog(async options => {
    calls.push(options)
    return { data: options.page === 1
      ? Array.from({ length: 100 }, (_, index) => ({ ID: index + 1, nombre: `Juego ${index}`, genero: 'Acción' }))
      : [{ ID: 101, nombre: 'Tekken 8', genero: 'Lucha' }] }
  })
  assert.equal(games.length, 101)
  assert.deepEqual(calls, [{ page: 1, limit: 100 }, { page: 2, limit: 100 }])
  assert.equal(filterGames(games, ' TEK ')[0].ID, 101)
  assert.equal(filterGames(games, 'lucha').length, 1)
  assert.equal(filterGames(games, 'accion').length, 100)
  assert.equal(filterGames(games, 'no existe').length, 0)
})

test('catalogo vacio, fallo y cancelacion no se convierten en datos inventados', async () => {
  assert.deepEqual(await loadGameCatalog(async () => ({ data: [] })), [])
  await assert.rejects(loadGameCatalog(async () => ({ data: {} })), /catálogo/)
  await assert.rejects(loadGameCatalog(async () => ({ data: [{ ID: 1 }] })), /incompleto/)
  await assert.rejects(loadGameCatalog(async () => { throw new Error('Sin conexión') }), /conexión/)
  const controller = new AbortController()
  controller.abort()
  await assert.rejects(loadGameCatalog(() => assert.fail('No debe consultar'), controller.signal))
})

test('unico catalogo de generos filtra mayusculas y acentos de forma predecible', () => {
  assert.deepEqual(matchingGenres('LUC'), ['Lucha'])
  assert.deepEqual(matchingGenres('aven'), ['Aventura', 'Aventura gráfica'])
  assert.deepEqual(matchingGenres('accion'), ['Acción'])
  assert.deepEqual(matchingGenres('género personalizado'), [])
})

test('editar usa un unico PATCH, valida antes de enviar y comunica conflictos', async () => {
  const original = apiClient.request
  const calls = []
  apiClient.request = async (path, options) => { calls.push({ path, options }); return { data: game } }
  try {
    const invalid = await gameRegistry.update(8, { name: '', genre: 'Lucha' })
    assert.ok(invalid.errors.name)
    assert.equal(calls.length, 0)
    const updated = await gameRegistry.update(8, { name: ' Tekken 8 ', genre: ' Lucha ' })
    assert.equal(updated.game.id, 8)
    assert.deepEqual(calls, [{ path: '/videojuegos/8', options: { method: 'PATCH', body: { nombre: 'Tekken 8', genero: 'Lucha' } } }])
    apiClient.request = async () => { throw Object.assign(new Error('Duplicado'), { status: 409 }) }
    assert.ok((await gameRegistry.update(8, { name: 'Tekken 8', genre: 'Lucha' })).errors.name)
    apiClient.request = async () => { throw new Error('Sin permiso') }
    await assert.rejects(gameRegistry.update(8, { name: 'Tekken 8', genre: 'Lucha' }), /permiso/)
  } finally { apiClient.request = original }
})
