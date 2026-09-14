import { apiClient, ApiError } from './apiClient.js'

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
