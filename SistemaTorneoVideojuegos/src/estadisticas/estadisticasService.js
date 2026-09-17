import { apiClient } from '../api/apiClient.js'
import { obtenerPuntuaciones } from '../api/puntuacionesApi.js'
import { validateId } from '../api/validation.js'

export function numeric(value) {
  if (typeof value !== 'number' && typeof value !== 'string') return null
  if (typeof value === 'string' && !value.trim()) return null
  const result = Number(value)
  return Number.isFinite(result) && result >= 0 ? result : null
}

export function summarizeScores(rows, gameId) {
  const valid = rows.flatMap(row => {
    const score = numeric(row?.puntuacion)
    const player = numeric(row?.ID_jugador)
    const game = numeric(row?.ID_videojuego)
    if (score === null || score > 2147483647 || !Number.isInteger(player) || player < 1 || !Number.isInteger(game) || game < 1 ||
        (gameId !== undefined && game !== gameId)) return []
    return [{ score, player, game }]
  })
  const groups = new Map()
  let sum = 0, max = null, min = null
  for (const item of valid) {
    sum += item.score
    max = max === null ? item.score : Math.max(max, item.score)
    min = min === null ? item.score : Math.min(min, item.score)
    const group = groups.get(item.game) || { total: 0, sum: 0 }
    group.total++
    group.sum += item.score
    groups.set(item.game, group)
  }
  return {
    total: valid.length, participants: new Set(valid.map(item => item.player)).size,
    average: valid.length ? sum / valid.length : null, max, min,
    groups: [...groups].map(([id, group]) => ({ id, total: group.total, average: group.sum / group.total })),
  }
}

export async function loadStatistics(gameId, signal, client = apiClient) {
  if (gameId !== undefined) validateId(gameId)
  const query = gameId === undefined ? '' : `?ID_videojuego=${gameId}`
  async function scores() {
    const rows = new Map()
    for (let page = 1; page <= 10000; page++) {
      signal?.throwIfAborted()
      const data = await obtenerPuntuaciones({ ID_videojuego: gameId, page, limit: 100 }, client)
      signal?.throwIfAborted()
      for (const row of data) {
        const id = numeric(row?.ID)
        if (Number.isInteger(id) && id > 0) rows.set(id, row)
      }
      if (data.length < 100) return [...rows.values()]
    }
    throw new Error('No se pudieron cargar todas las puntuaciones.')
  }
  const [summary, rows] = await Promise.all([client.request(`/estadisticas${query}`, { auth: '' }), scores()])
  signal?.throwIfAborted()
  if (!summary?.data || typeof summary.data !== 'object' || Array.isArray(summary.data)) throw new Error('No se pudieron leer las estadísticas.')
  const calculated = summarizeScores(rows, gameId)
  // El total general de jugadores de la API incluye personas sin puntuaciones.
  // Los participantes y extremos se obtienen de los resultados válidos, sin duplicar jugadores.
  const total = numeric(summary.data.totalPuntuaciones)
  const average = numeric(summary.data.puntuacionPromedio)
  return { ...calculated,
    total: Number.isInteger(total) ? total : calculated.total,
    average: calculated.total && average !== null ? average : calculated.average,
  }
}

export function comparisonRows(games, metrics, gameId) {
  const known = new Map(games.map(game => [game.ID, game.nombre]))
  for (const group of metrics.groups) if (!known.has(group.id)) known.set(group.id, `Videojuego #${group.id}`)
  const values = new Map(metrics.groups.map(group => [group.id, group]))
  return [...known].filter(([id]) => gameId === undefined || id === gameId)
    .map(([id, name]) => ({ id, name, ...values.get(id), average: values.get(id)?.average ?? null }))
}
