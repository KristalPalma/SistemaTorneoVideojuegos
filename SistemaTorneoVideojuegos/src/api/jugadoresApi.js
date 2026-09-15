import { apiClient, ApiError } from './apiClient.js'
import { validateId, validatePagination, validatePatch } from './validation.js'

export async function obtenerJugadores({ buscar = '', page = 1, limit = 20 } = {}, client = apiClient) {
  validatePagination(page, limit)
  const query = new URLSearchParams({ buscar: buscar.trim(), page: String(page), limit: String(limit) })
  return client.request(`/jugadores?${query}`, { auth: '' })
}

export async function obtenerJugador(id, client = apiClient) {
  validateId(id)
  return client.request(`/jugadores/${id}`, { auth: '' })
}

export async function actualizarJugador(id, changes, client = apiClient) {
  validateId(id)
  const body = validatePatch(changes, { nombre: 100, gamertag: 50, correo: 150 })
  return client.request(`/jugadores/${id}`, { method: 'PATCH', body })
}

export async function eliminarJugador(id, client = apiClient) {
  validateId(id)
  return client.request(`/jugadores/${id}`, { method: 'DELETE' })
}

export async function registerPlayer(form, client = apiClient) {
  // Comprobacion previa paginada: ayuda a detectar correo y gamertag repetidos.
  // La garantia frente a concurrencia necesita indices UNIQUE en el backend.
  for (let page = 1; page <= 10000; page++) {
    const { data } = await client.request(`/jugadores?page=${page}&limit=100`)
    if (!Array.isArray(data)) throw new ApiError('No se pudo comprobar si el jugador ya existe.', 0, 'RESPONSE')
    const errors = {}
    for (const player of data) {
      if (player.gamertag.trim().toLowerCase() === form.gamertag.trim().toLowerCase()) errors.gamertag = 'Este gamertag ya está registrado.'
      if (player.correo.trim().toLowerCase() === form.email.trim().toLowerCase()) errors.email = 'Este correo electrónico ya está registrado.'
    }
    if (Object.keys(errors).length) return { errors }
    if (data.length < 100) break
    if (page === 10000) throw new ApiError('No se pudo completar la comprobación de duplicados.', 0, 'PAGINATION')
  }
  try {
    const { data } = await client.request('/jugadores', { method: 'POST', body: {
      nombre: form.name.trim(), gamertag: form.gamertag.trim(), correo: form.email.trim(),
    } })
    if (!Number.isInteger(data?.ID) || data.ID <= 0) throw new ApiError('No se pudo confirmar el ID del jugador.', 0, 'RESPONSE')
    return { player: { id: data.ID, name: data.nombre, gamertag: data.gamertag, email: data.correo, registeredAt: data.fecha_registro } }
  } catch (error) {
    if (error.status === 409) throw new ApiError('El correo o gamertag ya está registrado. Revisa ambos campos.', 409, error.code, error.requestId)
    throw error
  }
}
