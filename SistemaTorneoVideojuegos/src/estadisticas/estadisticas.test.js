import test from 'node:test'
import assert from 'node:assert/strict'
import { numeric, summarizeScores, loadStatistics, comparisonRows } from './estadisticasService.js'
import { createApiClient } from '../api/apiClient.js'
import { resolveRoute } from '../auth/routes.js'

const rows = [
  { ID: 1, ID_jugador: '1', ID_videojuego: '8', puntuacion: '0' },
  { ID: 2, ID_jugador: 1, ID_videojuego: 8, puntuacion: 100 },
  { ID: 3, ID_jugador: 2, ID_videojuego: 9, puntuacion: 200 },
]

test('normaliza cadenas sin convertir nulos, vacios o booleanos en cero', () => {
  assert.equal(numeric('0'), 0)
  assert.equal(numeric('12.5'), 12.5)
  for (const value of [null, undefined, '', ' ', true, [], 'NaN', Infinity, '-1']) assert.equal(numeric(value), null)
})

test('calcula participantes unicos, promedio, extremos y grupos sin clasificacion', () => {
  const result = summarizeScores(rows)
  assert.equal(result.total, 3)
  assert.equal(result.participants, 2)
  assert.equal(result.average, 100)
  assert.equal(result.min, 0)
  assert.equal(result.max, 200)
  const filtered = summarizeScores(rows, 8)
  assert.equal(filtered.total, 2)
  assert.equal(filtered.participants, 1)
  assert.equal(filtered.average, 50)
  assert.equal(filtered.groups.length, 1)
})

test('ignora resultados invalidos y no divide entre cero', () => {
  const invalid = [null, ...[null, 'NaN', Infinity, -5, '', 1e308].map(puntuacion => ({ ID_jugador: 1, ID_videojuego: 8, puntuacion }))]
  assert.deepEqual(summarizeScores(invalid), { total: 0, participants: 0, average: null, min: null, max: null, groups: [] })
})

test('comparacion conserva videojuegos sin puntuaciones y filtra por ID', () => {
  const games = [{ ID: 8, nombre: 'Juego A' }, { ID: 10, nombre: 'Juego vacío' }]
  const result = comparisonRows(games, summarizeScores(rows))
  assert.equal(result.find(row => row.id === 10).average, null)
  assert.equal(result.find(row => row.id === 9).name, 'Videojuego #9')
  assert.equal(comparisonRows(games, summarizeScores(rows, 8), 8).length, 1)
})

test('usa estadisticas y puntuaciones publicas filtradas sin Authorization', async () => {
  const calls = []
  const client = createApiClient({ baseUrl: 'https://api.example.test/api', fetchImpl: async (url, options) => {
    calls.push(url)
    assert.equal(options.headers.Authorization, undefined)
    const parsed = new URL(url)
    assert.equal(parsed.searchParams.get('ID_videojuego'), '8')
    return new Response(JSON.stringify({ data: parsed.pathname.endsWith('/estadisticas')
      ? { totalPuntuaciones: '2', puntuacionPromedio: '50', totalJugadores: 500 }
      : rows.slice(0, 2) }))
  } })
  client.setAuthorization('Basic test')
  const result = await loadStatistics(8, undefined, client)
  assert.equal(calls.length, 2)
  assert.equal(result.participants, 1)
  assert.equal(result.total, 2)
  assert.equal(result.average, 50)
})

test('incluye todas las paginas y propaga errores sin mocks', async () => {
  let pages = 0
  const client = { async request(path) {
    if (path.startsWith('/estadisticas')) return { data: { totalPuntuaciones: 101, puntuacionPromedio: 1 } }
    pages++
    return { data: pages === 1 ? Array.from({ length: 100 }, (_, i) => ({ ID: i + 1, ID_jugador: 1, ID_videojuego: 8, puntuacion: 1 }))
      : [{ ID: 101, ID_jugador: 2, ID_videojuego: 8, puntuacion: 1 }] }
  } }
  const result = await loadStatistics(undefined, undefined, client)
  assert.equal(pages, 2)
  assert.equal(result.participants, 2)
  assert.equal(result.total, 101)
  await assert.rejects(loadStatistics(undefined, undefined, { async request() { throw new Error('Red') } }), /Red/)
})

test('estadisticas publicas disponibles sin login y para ambos roles', () => {
  for (const user of [null, { role: 'Administrador' }, { role: 'Superadministrador' }]) assert.ok(resolveRoute('/estadisticas', user).route)
})
