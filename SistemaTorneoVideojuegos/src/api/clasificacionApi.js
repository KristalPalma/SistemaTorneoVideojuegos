import { apiClient, ApiError } from './apiClient.js'
import { validateId, validatePagination } from './validation.js'

export async function obtenerMejoresPorJuego(games, signal, client = apiClient) {
  const rows = []
  for (const game of games) {
    signal?.throwIfAborted()
    const result = await obtenerClasificacion(game.ID, 1, signal, client)
    signal?.throwIfAborted()
    // Las posiciones vienen del backend: solo presentamos el primer lugar de cada juego.
    rows.push(...result.rows.filter(row => Number(row.posicion) === 1))
  }
  return { rows, hasNext: false }
}

export async function obtenerClasificacion(gameId, page = 1, signal, client = apiClient) {
  validateId(gameId)
  validatePagination(page, 20)
  const query = new URLSearchParams({ ID_videojuego: String(gameId), page: String(page), limit: '20' })
  const result = await client.request(`/clasificacion?${query}`, { auth: '', signal })
  if (!Array.isArray(result?.data)) throw new ApiError('No fue posible leer la clasificación.', 0, 'RESPONSE')
  // Contrato GET /api/clasificacion: { data, pagination }; requiere ID_videojuego.
  // Se conservan las posiciones, el orden y los campos calculados por el backend.
  const rows = result.data
  if (rows.some(row => !row || Number(row.ID_videojuego) !== gameId ||
      !Number.isInteger(Number(row.posicion)) || Number(row.posicion) < 1 ||
      typeof row.jugador !== 'string' || typeof row.videojuego !== 'string' ||
      !['number', 'string'].includes(typeof row.puntuacion) ||
      String(row.puntuacion).trim() === '' || !Number.isInteger(Number(row.puntuacion)) ||
      Number(row.puntuacion) < 0 || Number(row.puntuacion) > 2147483647) ||
      new Set(rows.map(row => String(row.ID_jugador))).size !== rows.length) {
    throw new ApiError('La API devolvió una clasificación inconsistente. Intenta actualizar.', 0, 'RESPONSE')
  }
  return { rows, hasNext: result.data.length === 20 && page < 10000 }
}
