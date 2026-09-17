import test from 'node:test'
import assert from 'node:assert/strict'
import { createApiClient } from './apiClient.js'
import { actualizarJugador, eliminarJugador, obtenerJugadores } from './jugadoresApi.js'
import { actualizarVideojuego, eliminarVideojuego, obtenerVideojuego } from './videojuegosApi.js'

for (const [name, update, remove] of [['jugadores', actualizarJugador, eliminarJugador], ['videojuegos', actualizarVideojuego, eliminarVideojuego]]) {
  test(`${name}: PATCH documentado y DELETE 204`, async () => {
    const client = createApiClient({ baseUrl: 'https://api.example.test/api', fetchImpl: async (url, options) => {
      assert.equal(url, `https://api.example.test/api/${name}/1`)
      assert.equal(options.headers.Authorization, 'Basic test')
      if (options.method === 'DELETE') return new Response(null, { status: 204 })
      assert.equal(options.method, 'PATCH')
      assert.deepEqual(JSON.parse(options.body), { nombre: 'Nuevo' })
      return new Response(JSON.stringify({ data: { ID: 1, nombre: 'Nuevo' } }))
    } })
    client.setAuthorization('Basic test')
    assert.equal((await update(1, { nombre: ' Nuevo ' }, client)).data.ID, 1)
    assert.equal(await remove(1, client), null)
    await assert.rejects(update(1, { IdRol: 1 }, client))
    await assert.rejects(update(1, {}, client))
    await assert.rejects(remove(-1, client))
  })
}
test('GET publico no incluye credenciales; valida paginacion', async () => {
  const client = createApiClient({ baseUrl: 'https://api.example.test/api', fetchImpl: async (_, options) => {
    assert.equal(options.headers.Authorization, undefined)
    return new Response(JSON.stringify({ data: [] }))
  } })
  client.setAuthorization('Basic test')
  await obtenerJugadores({}, client)
  await obtenerVideojuego(1, client)
  await assert.rejects(obtenerJugadores({ limit: 101 }, client))
})
test('errores HTTP conservan codigo y referencia sin exponer detalles de 500', async () => {
  for (const status of [400, 401, 403, 404, 409, 422, 429, 500, 503]) {
    const client = createApiClient({ baseUrl: 'https://api.example.test/api', fetchImpl: async () =>
      new Response(JSON.stringify({ error: { code: 'TEST', message: 'Mensaje controlado' }, requestId: 'ref-test' }), { status }) })
    await assert.rejects(client.request('/jugadores'), error => {
      assert.equal(error.status, status)
      assert.equal(error.requestId, 'ref-test')
      if (status === 409) assert.equal(error.message, 'Mensaje controlado')
      if (status === 500) assert.notEqual(error.message, 'Mensaje controlado')
      return true
    })
  }
})
