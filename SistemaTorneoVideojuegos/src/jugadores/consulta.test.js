import test from 'node:test'
import assert from 'node:assert/strict'
import { createConsultaService, formatPlayerDate } from './consultaService.js'
import { obtenerJugador, obtenerJugadores } from '../api/jugadoresApi.js'
import { createApiClient } from '../api/apiClient.js'
import { resolveRoute } from '../auth/routes.js'

test('busca parcialmente nombre y gamertag, ignora mayusculas y no busca correo', async () => {
  const service = createConsultaService(true)
  assert.equal((await service.list({ buscar: 'ANA' })).data[0].ID, 1)
  assert.equal((await service.list({ buscar: 'RIVAL' })).data[0].ID, 1)
  assert.equal((await service.list({ buscar: '@example.test' })).data.length, 0)
  assert.equal((await service.list({ buscar: '' })).data.length, 3)
  assert.equal((await service.detail(2)).correo, 'carlos@example.test')
  await assert.rejects(service.detail(99))
})
test('pagina sin total, ordena ID descendente y admite catalogo vacio', async () => {
  const service = createConsultaService(true)
  assert.equal((await service.list({ page: 1, limit: 1 })).data[0].ID, 3)
  assert.equal((await service.list({ page: 2, limit: 1 })).data[0].ID, 2)
  assert.equal((await createConsultaService(true, []).list({})).data.length, 0)
})
test('GET publico codifica buscar y nunca envia Authorization aunque exista sesion', async () => {
  const client = createApiClient({ baseUrl: 'https://api.example.test/api', fetchImpl: async (url, options) => {
    assert.equal(options.headers.Authorization, undefined)
    if (url.includes('?')) {
      const parsed = new URL(url)
      assert.equal(parsed.searchParams.get('buscar'), 'ana & %')
      assert.deepEqual([...parsed.searchParams.keys()], ['buscar', 'page', 'limit'])
      return new Response(JSON.stringify({ data: [] }))
    }
    assert.ok(url.endsWith('/jugadores/1'))
    return new Response(JSON.stringify({ data: { ID: 1 } }))
  } })
  client.setAuthorization('Basic test')
  await obtenerJugadores({ buscar: 'ana & %' }, client)
  assert.equal((await obtenerJugador(1, client)).ID, 1)
  await assert.rejects(obtenerJugadores({ page: 10001 }, client))
})
test('fecha invalida no se inventa ni cambia zona horaria', () => {
  assert.equal(formatPlayerDate('2026-09-14 12:00:00'), '14/09/2026 12:00')
  for (const date of [null, '', 'incorrecta', '2026-02-31 12:00:00']) assert.equal(formatPlayerDate(date), 'Fecha no disponible')
})
test('la consulta esta disponible para publico y ambos roles', () => {
  for (const user of [null, { role: 'admin' }, { role: 'superadmin' }]) assert.ok(resolveRoute('/jugadores', user).route)
})
