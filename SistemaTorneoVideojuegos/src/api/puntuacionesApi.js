import { apiClient, ApiError } from './apiClient.js'
import { validateId, validatePagination } from './validation.js'

export async function actualizarPuntuacion(id, puntuacion, client = apiClient) {
  validateId(id)
  if (!Number.isInteger(puntuacion) || puntuacion < 0 || puntuacion > 2147483647) {
    throw new ApiError('La puntuación debe ser un entero entre 0 y 2147483647.', 0, 'VALIDATION')
  }
  // Solo mandamos el valor: el jugador y el videojuego no se editan aquí.
  const result = await client.request(`/puntuaciones/${id}`, { method: 'PATCH', body: { puntuacion } })
  if (result?.data?.ID !== id || result.data.puntuacion !== puntuacion) {
    throw new ApiError('No se pudo confirmar el cambio. Consulta la puntuación antes de reintentar.', 0, 'RESPONSE')
  }
  return result.data
}

export async function obtenerPuntuaciones({ ID_jugador, ID_videojuego, page = 1, limit = 100 } = {}, client = apiClient) {
  validatePagination(page, limit)
  const query = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (ID_jugador !== undefined) {
    validateId(ID_jugador)
    query.set('ID_jugador', String(ID_jugador))
  }
  if (ID_videojuego !== undefined) {
    validateId(ID_videojuego)
    query.set('ID_videojuego', String(ID_videojuego))
  }
  const result = await client.request(`/puntuaciones?${query}`, { auth: '' })
  if (!Array.isArray(result?.data)) throw new ApiError('No fue posible leer las puntuaciones.', 0, 'RESPONSE')
  return result.data
}

export async function obtenerPuntuacionesJugador(id, { page = 1, limit = 5 } = {}, client = apiClient) {
  validateId(id)
  validatePagination(page, limit)
  const query = new URLSearchParams({ ID_jugador: String(id), page: String(page), limit: String(limit) })
  const result = await client.request(`/puntuaciones?${query}`, { auth: '' })
  if (!Array.isArray(result?.data)) throw new ApiError('No fue posible leer las puntuaciones.', 0, 'RESPONSE')
  return result.data
}

// Crear una operacion por intencion. Reusar su submit() conserva clave, cuerpo y usuario.
export function createScoreOperation(body, client = apiClient) {
  for (const key of ['ID_jugador', 'ID_videojuego', 'puntuacion']) {
    if (!Number.isInteger(body[key]) || body[key] < (key === 'puntuacion' ? 0 : 1) || body[key] > 2147483647) {
      throw new ApiError('La puntuación y las referencias deben ser enteros válidos.', 0, 'VALIDATION')
    }
  }
  const snapshot = { ID_jugador: body.ID_jugador, ID_videojuego: body.ID_videojuego, puntuacion: body.puntuacion }
  const key = crypto.randomUUID()
  const authorization = client.getAuthorization()
  let pending
  let result
  return {
    key,
    async submit() {
      if (!authorization || client.getAuthorization() !== authorization) throw new ApiError('La sesión cambió. No se puede reintentar esta operación con otra cuenta.', 0, 'SESSION')
      if (result) return result
      if (pending) return pending
      pending = client.request('/puntuaciones', { method: 'POST', body: snapshot, idempotencyKey: key })
      try { result = await pending; return result } finally { pending = null }
    },
  }
}
