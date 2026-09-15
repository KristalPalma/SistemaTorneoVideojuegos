import { apiClient, ApiError } from './apiClient.js'
import { validateId, validatePagination, validatePatch } from './validation.js'

export async function obtenerVideojuegos({ page = 1, limit = 20 } = {}, client = apiClient) {
  validatePagination(page, limit)
  const query = new URLSearchParams({ page: String(page), limit: String(limit) })
  return client.request(`/videojuegos?${query}`, { auth: '' })
}

export async function obtenerVideojuego(id, client = apiClient) {
  validateId(id)
  return client.request(`/videojuegos/${id}`, { auth: '' })
}

export async function actualizarVideojuego(id, changes, client = apiClient) {
  validateId(id)
  const body = validatePatch(changes, { nombre: 100, genero: 50 })
  return client.request(`/videojuegos/${id}`, { method: 'PATCH', body })
}

export async function eliminarVideojuego(id, client = apiClient) {
  validateId(id)
  return client.request(`/videojuegos/${id}`, { method: 'DELETE' })
}

export async function registerGame(form, client = apiClient) {
  try {
    const { data } = await client.request('/videojuegos', {
      method: 'POST', body: { nombre: form.name.trim(), genero: form.genre.trim() },
    })
    if (!Number.isInteger(data?.ID) || data.ID <= 0) throw new ApiError('No se pudo confirmar el ID del videojuego.', 0, 'RESPONSE')
    return { game: { id: data.ID, name: data.nombre, genre: data.genero } }
  } catch (error) {
    if (error.status === 409) return { errors: { name: 'Este nombre de videojuego ya está registrado.' } }
    throw error
  }
}
