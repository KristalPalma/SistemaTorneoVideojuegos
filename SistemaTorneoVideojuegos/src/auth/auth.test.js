import test from 'node:test'
import assert from 'node:assert/strict'
import { clearSession } from './session.js'
import { resolveRoute, routes, dashboardPath } from './routes.js'
import { createApiClient } from '../api/apiClient.js'
import { loginApi } from '../api/authApi.js'

for (const [rol, role] of [['Administrador', 'Administrador'], ['Superadministrador', 'Superadministrador'], ['ADMINISTRADOR', 'Administrador'], ['SUPER ADMINISTRADOR', 'Superadministrador']]) {
  test(`login real adapta ${rol} y logout descarta Basic`, async () => {
    const client = createApiClient({ baseUrl: 'https://api.example.test/api', fetchImpl: async () =>
      new Response(JSON.stringify({ data: { id: 7, nombre: 'Cuenta de prueba', correo: 'test@example.test', rol } })) })
    const user = await loginApi('test@example.test', 'solo-test', client)
    assert.equal(user.role, role)
    assert.equal(user.backendRole, rol)
    assert.equal(user.password, undefined)
    assert.ok(client.getAuthorization())
    clearSession(client)
    assert.equal(client.getAuthorization(), '')
  })
}
test('roles sin herencia y GET publico disponible para todos', () => {
  for (const route of routes.filter(item => item.role)) {
    const other = { role: route.role === 'Administrador' ? 'Superadministrador' : 'Administrador' }
    assert.equal(resolveRoute(route.path, null).redirect, '/login')
    assert.equal(resolveRoute(route.path, other).redirect, dashboardPath(other))
    assert.ok(resolveRoute(route.path, { role: route.role }).route)
  }
  assert.ok(resolveRoute('/jugadores', null).route)
})

for (const status of [401, 403, 500]) {
  test(`login HTTP ${status} no conserva credenciales anteriores`, async () => {
    const client = createApiClient({ baseUrl: 'https://api.example.test/api', fetchImpl: async () =>
      new Response(JSON.stringify({ error: { message: 'Detalle interno' } }), { status }) })
    client.setAuthorization('Basic anterior')
    await assert.rejects(loginApi('test@example.test', 'solo-test', client), error => {
      assert.equal(error.status, status)
      if (status === 401) assert.match(error.message, /incorrectos/)
      if (status === 403) assert.match(error.message, /permiso/)
      return true
    })
    assert.equal(client.getAuthorization(), '')
  })
}

test('error de red durante login deja acceso publico sin credenciales', async () => {
  const client = createApiClient({ baseUrl: 'https://api.example.test/api', fetchImpl: async () => { throw new TypeError('Failed to fetch') } })
  await assert.rejects(loginApi('test@example.test', 'solo-test', client), error => error.code === 'NETWORK')
  assert.equal(client.getAuthorization(), '')
})

test('cuenta incompleta o rol desconocido no habilitan la sesion', async () => {
  for (const data of [null, { rol: 'toString' }, { rol: 'Administrador' }, { id: 1, nombre: '', correo: 'a@example.test', rol: 'Administrador' }]) {
    const client = createApiClient({ baseUrl: 'https://api.example.test/api', fetchImpl: async () =>
      new Response(JSON.stringify({ data })) })
    await assert.rejects(loginApi('test@example.test', 'solo-test', client))
    assert.equal(client.getAuthorization(), '')
  }
})

test('logout invalida un login que aun no recibe respuesta', async () => {
  let respond
  const client = createApiClient({ baseUrl: 'https://api.example.test/api', fetchImpl: () => new Promise(resolve => { respond = resolve }) })
  const pending = loginApi('test@example.test', 'solo-test', client)
  clearSession(client)
  respond(new Response(JSON.stringify({ data: { id: 1, nombre: 'Prueba', correo: 'test@example.test', rol: 'Administrador' } })))
  await assert.rejects(pending, error => error.code === 'CANCELLED')
  assert.equal(client.getAuthorization(), '')
})

test('abandonar login cancela la autenticacion aunque llegue una respuesta valida', async () => {
  let respond
  const controller = new AbortController()
  const client = createApiClient({ baseUrl: 'https://api.example.test/api', fetchImpl: (_, options) => {
    assert.equal(options.signal, controller.signal)
    return new Promise(resolve => { respond = resolve })
  } })
  const pending = loginApi('test@example.test', 'solo-test', client, controller.signal)
  controller.abort()
  respond(new Response(JSON.stringify({ data: { id: 1, nombre: 'Prueba', correo: 'test@example.test', rol: 'Administrador' } })))
  await assert.rejects(pending, error => error.code === 'CANCELLED')
  assert.equal(client.getAuthorization(), '')
})

test('un cliente nuevo no restaura las credenciales de otro', () => {
  const first = createApiClient()
  first.setAuthorization('Basic prueba')
  const refreshed = createApiClient()
  assert.equal(refreshed.getAuthorization(), '')
})
