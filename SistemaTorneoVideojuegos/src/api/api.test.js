import test from 'node:test'
import assert from 'node:assert/strict'
import { createApiClient } from './apiClient.js'
import { registerGame } from './videojuegosApi.js'
import { registerPlayer } from './jugadoresApi.js'
import { createScoreOperation } from './puntuacionesApi.js'
import { loginApi } from './authApi.js'

test('login real consulta auth/me y conserva Basic solo tras validar el rol', async () => {
  const client = createApiClient({ baseUrl: 'https://api.example.test/api', fetchImpl: async (url, options) => {
    assert.ok(url.endsWith('/auth/me'))
    assert.ok(options.headers.Authorization.startsWith('Basic '))
    return reply({ id: 1, nombre: 'Ana', correo: 'ana@example.test', rol: 'Superadministrador' })
  } })
  assert.equal((await loginApi('ana@example.test', 'test-password', client)).role, 'superadmin')
  assert.ok(client.getAuthorization())
  client.clearAuthorization()
  assert.equal(client.getAuthorization(), '')
})

test('login rechaza roles desconocidos sin guardar credenciales', async () => {
  const client = createApiClient({ baseUrl: 'https://api.example.test/api', fetchImpl: async () => reply({ rol: 'Otro' }) })
  await assert.rejects(loginApi('ana@example.test', 'test-password', client), /rol/)
  assert.equal(client.getAuthorization(), '')
})

const reply = (data, status = 200) => new Response(JSON.stringify({ data }), { status, headers: { 'Content-Type': 'application/json' } })

test('sin URL no realiza solicitudes', async () => {
  const client = createApiClient({ fetchImpl: () => assert.fail('No debe enviar') })
  await assert.rejects(client.request('/videojuegos'), /VITE_API_URL/)
})

test('videojuegos envia contrato real y utiliza ID del servidor', async () => {
  const client = createApiClient({ baseUrl: 'https://api.example.test/api', fetchImpl: async (url, options) => {
    assert.equal(url, 'https://api.example.test/api/videojuegos')
    assert.deepEqual(JSON.parse(options.body), { nombre: 'Tekken', genero: 'Lucha' })
    assert.equal(options.headers.Authorization, 'Basic test')
    assert.equal(options.headers['Idempotency-Key'], undefined)
    return reply({ ID: 12, nombre: 'Tekken', genero: 'Lucha' }, 201)
  } })
  client.setAuthorization('Basic test')
  assert.equal((await registerGame({ name: ' Tekken ', genre: ' Lucha ' }, client)).game.id, 12)
})

test('errores HTTP y respuestas no JSON conservan mensajes comprensibles', async () => {
  const client = createApiClient({ baseUrl: 'https://api.example.test/api', fetchImpl: async () => new Response('limite', { status: 429 }) })
  await assert.rejects(client.request('/videojuegos'), error => error.status === 429)
})

test('correo duplicado en paginas posteriores impide POST', async () => {
  let calls = 0
  const client = { async request(path, options) {
    assert.equal(options, undefined)
    calls++
    return { data: calls === 1 ? Array.from({ length: 100 }, () => ({ gamertag: 'otro', correo: 'otro@test.com' })) : [{ gamertag: 'otro', correo: 'ANA@test.com' }] }
  } }
  assert.ok((await registerPlayer({ name: 'Ana', gamertag: 'ana', email: 'ana@test.com' }, client)).errors.email)
  assert.equal(calls, 2)
})

test('idempotencia mantiene clave y cuerpo al reintentar y bloquea cambio de usuario', async () => {
  let auth = 'Basic test'
  const calls = []
  const client = { getAuthorization: () => auth, async request(path, options) {
    calls.push(options)
    if (calls.length === 1) throw new Error('red')
    return { data: { ID: 4 } }
  } }
  const body = { ID_jugador: 1, ID_videojuego: 2, puntuacion: 50 }
  const operation = createScoreOperation(body, client)
  body.puntuacion = 99
  await assert.rejects(operation.submit())
  await operation.submit()
  assert.equal(calls[0].idempotencyKey, calls[1].idempotencyKey)
  assert.match(operation.key, /^[0-9a-f-]{36}$/)
  assert.equal(calls[1].body.puntuacion, 50)
  await operation.submit()
  assert.equal(calls.length, 2)
  auth = ''
  await assert.rejects(operation.submit(), /sesión/)
})
