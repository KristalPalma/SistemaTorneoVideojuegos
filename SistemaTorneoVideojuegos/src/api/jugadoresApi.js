import { apiClient, ApiError } from './apiClient.js'
import { validatePatch } from './validation.js'

export async function obtenerJugadores(
  { buscar = '', page = 1, limit = 20 } = {},
  client = apiClient
) {
  if (
    !Number.isInteger(page) ||
    page < 1 ||
    page > 10000 ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100
  ) {
    throw new Error('Paginación inválida.')
  }

  const query = new URLSearchParams({
    buscar: buscar.trim(),
    page: String(page),
    limit: String(limit),
  })

  const response = await client.request(`/jugadores?${query}`, {
    auth: '',
  })

  if (!Array.isArray(response?.data)) {
    throw new Error('No fue posible leer el listado de jugadores.')
  }

  return response
}

export async function obtenerJugador(id, client = apiClient) {
  if (!Number.isInteger(id) || id < 1 || id > 2147483647) {
    throw new Error('ID de jugador inválido.')
  }

  const response = await client.request(`/jugadores/${id}`, {
    auth: '',
  })

  if (!response?.data || response.data.ID !== id) {
    throw new Error('No fue posible leer los datos del jugador.')
  }

  return response.data
}

export async function actualizarJugador(id, changes, client = apiClient) {
  if (!Number.isInteger(id) || id < 1 || id > 2147483647) {
    throw new Error('ID de jugador inválido.')
  }

  return client.request(`/jugadores/${id}`, {
    method: 'PATCH',
    body: validatePatch(changes, { nombre: 100, gamertag: 50, correo: 150 }),
  })
}

export async function eliminarJugador(id, client = apiClient) {
  if (!Number.isInteger(id) || id < 1 || id > 2147483647) {
    throw new Error('ID de jugador inválido.')
  }

  return client.request(`/jugadores/${id}`, {
    method: 'DELETE',
  })
}

export async function registerPlayer(form, client = apiClient) {
  // Comprobación previa paginada:
  // ayuda a detectar correo y gamertag repetidos.
  // La garantía frente a concurrencia necesita índices UNIQUE en el backend.

  for (let page = 1; page <= 10000; page++) {
    const { data } = await client.request(
      `/jugadores?page=${page}&limit=100`
    )

    if (!Array.isArray(data)) {
      throw new ApiError(
        'No se pudo comprobar si el jugador ya existe.',
        0,
        'RESPONSE'
      )
    }

    const errors = {}

    for (const player of data) {
      if (
        player.gamertag.trim().toLowerCase() ===
        form.gamertag.trim().toLowerCase()
      ) {
        errors.gamertag = 'Este gamertag ya está registrado.'
      }

      if (
        player.correo.trim().toLowerCase() ===
        form.email.trim().toLowerCase()
      ) {
        errors.email = 'Este correo electrónico ya está registrado.'
      }
    }

    if (Object.keys(errors).length) {
      return { errors }
    }

    if (data.length < 100) {
      break
    }

    if (page === 10000) {
      throw new ApiError(
        'No se pudo completar la comprobación de duplicados.',
        0,
        'PAGINATION'
      )
    }
  }

  try {
    const { data } = await client.request('/jugadores', {
      method: 'POST',
      body: {
        nombre: form.name.trim(),
        gamertag: form.gamertag.trim(),
        correo: form.email.trim(),
      },
    })

    if (!Number.isInteger(data?.ID) || data.ID <= 0) {
      throw new ApiError(
        'No se pudo confirmar el ID del jugador.',
        0,
        'RESPONSE'
      )
    }

    return {
      player: {
        id: data.ID,
        name: data.nombre,
        gamertag: data.gamertag,
        email: data.correo,
        registeredAt: data.fecha_registro,
      },
    }
  } catch (error) {
    if (error.status === 409) {
      throw new ApiError(
        'El correo o gamertag ya está registrado. Revisa ambos campos.',
        409,
        error.code,
        error.requestId
      )
    }

    throw error
  }
}
