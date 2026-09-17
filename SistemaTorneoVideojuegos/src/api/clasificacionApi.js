import { apiClient, ApiError } from './apiClient.js'
import { validateId, validatePagination } from './validation.js'

export async function obtenerClasificacion(gameId, page = 1, signal) {
  validateId(gameId)
  validatePagination(page, 20)
  const query = new URLSearchParams({ ID_videojuego: String(gameId), page: String(page), limit: '20' })
  const result = await apiClient.request(`/clasificacion?${query}`, { auth: '', signal })
  if (!Array.isArray(result?.data)) throw new ApiError('No fue posible leer la clasificación.', 0, 'RESPONSE')
  // Las posiciones y desempates ya vienen calculados por el servidor sobre todos los resultados.
  const rows = result.data.filter(row => row && row.puntuacion !== null &&
    ['number', 'string'].includes(typeof row.puntuacion) && String(row.puntuacion).trim() &&
    Number.isInteger(Number(row.puntuacion)) && Number(row.puntuacion) >= 0 && Number(row.puntuacion) <= 2147483647)
    .map(row => ({ ...row, puntuacion: Number(row.puntuacion) }))
  if (rows.some(row => Number(row.ID_videojuego) !== gameId || !Number.isInteger(Number(row.posicion)) || Number(row.posicion) < 1) ||
      new Set(rows.map(row => String(row.ID_jugador))).size !== rows.length) {
    throw new ApiError('La API devolvió una clasificación inconsistente. Intenta actualizar.', 0, 'RESPONSE')
  }
  return { rows, hasNext: result.data.length === 20 && page < 10000 }
}
