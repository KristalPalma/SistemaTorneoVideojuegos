import { apiClient, ApiError } from './apiClient.js'

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
