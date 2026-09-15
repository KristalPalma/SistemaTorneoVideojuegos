import test from 'node:test'
import assert from 'node:assert/strict'
import { clearSession } from './session.js'
import { resolveRoute, routes, dashboardPath } from './routes.js'
import { createApiClient } from '../api/apiClient.js'
import { loginApi } from '../api/authApi.js'

for (const [rol, role] of [['Administrador', 'admin'], ['Superadministrador', 'superadmin']]) {
  test(`login real adapta ${rol} y logout descarta Basic`, async () => {
    const client = createApiClient({ baseUrl: 'https://api.example.test/api', fetchImpl: async () =>
      new Response(JSON.stringify({ data: { id: 7, nombre: 'Cuenta de prueba', correo: 'test@example.test', rol } })) })
    const user = await loginApi('test@example.test', 'solo-test', client)
    assert.equal(user.role, role)
    assert.equal(user.password, undefined)
    assert.ok(client.getAuthorization())
    clearSession(client)
    assert.equal(client.getAuthorization(), '')
  })
}
test('roles sin herencia y GET publico disponible para todos', () => {
  for (const route of routes.filter(item => item.role)) {
    const other = { role: route.role === 'admin' ? 'superadmin' : 'admin' }
    assert.equal(resolveRoute(route.path, null).redirect, '/login')
    assert.equal(resolveRoute(route.path, other).redirect, dashboardPath(other))
    assert.ok(resolveRoute(route.path, { role: route.role }).route)
  }
  assert.ok(resolveRoute('/jugadores', null).route)
})
