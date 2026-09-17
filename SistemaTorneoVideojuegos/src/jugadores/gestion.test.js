import test from 'node:test'
import assert from 'node:assert/strict'
import { canManagePlayers, queryAfterMutation } from './gestionJugadores.js'
import { playerRegistry } from './registroplayer.js'
import { apiClient } from '../api/apiClient.js'

test('solo Administrador gestiona jugadores; publico y superadmin solo consultan', () => {
  assert.equal(canManagePlayers({ role: 'Administrador' }), true)
  for (const user of [null, undefined, { role: 'Superadministrador' }, { role: 'desconocido' }]) {
    assert.equal(canManagePlayers(user), false)
  }
})

test('alta vuelve a la primera pagina sin filtros; editar conserva busqueda; borrar corrige ultima pagina vacia', () => {
  const query = { buscar: 'ana', page: 3, limit: 20 }
  assert.deepEqual(queryAfterMutation(query, 'create', 5), { buscar: '', page: 1, limit: 20 })
  assert.deepEqual(queryAfterMutation(query, 'edit', 5), query)
  assert.deepEqual(queryAfterMutation(query, 'delete', 1), { ...query, page: 2 })
  assert.deepEqual(queryAfterMutation({ ...query, page: 1 }, 'delete', 1), { ...query, page: 1 })
  assert.equal(query.page, 3)
})

test('editar reutiliza validaciones y hace un solo PATCH con los tres campos permitidos', async () => {
  const original = apiClient.request
  const calls = []
  apiClient.request = async (path, options) => {
    calls.push({ path, options })
    return { data: { ID: 8 } }
  }
  try {
    const invalid = await playerRegistry.update(8, { name: '', gamertag: 'X', email: 'incorrecto' })
    assert.ok(invalid.errors.name)
    assert.ok(invalid.errors.email)
    assert.equal(calls.length, 0)
    const result = await playerRegistry.update(8, { name: ' Ana ', gamertag: ' Shadow ', email: ' ana@example.test ' })
    assert.equal(result.player.id, 8)
    assert.deepEqual(calls, [{ path: '/jugadores/8', options: {
      method: 'PATCH', body: { nombre: 'Ana', gamertag: 'Shadow', correo: 'ana@example.test' },
    } }])
    apiClient.request = async () => { throw new Error('Conflicto: gamertag duplicado') }
    await assert.rejects(playerRegistry.update(8, { name: 'Ana', gamertag: 'Shadow', email: 'ana@example.test' }), /duplicado/)
  } finally { apiClient.request = original }
})
