import { obtenerVideojuegos } from '../api/videojuegosApi.js'
import { searchText } from './generos.js'

export function canManageGames(user) {
  return user?.role === 'Superadministrador'
}

// La API pagina, pero no ofrece búsqueda. Reunimos el catálogo antes de filtrar.
export async function loadGameCatalog(list = obtenerVideojuegos, signal) {
  const games = new Map()
  for (let page = 1; page <= 10000; page++) {
    signal?.throwIfAborted()
    const result = await list({ page, limit: 100 })
    signal?.throwIfAborted()
    if (!Array.isArray(result?.data)) throw new Error('No fue posible leer el catálogo de videojuegos.')
    for (const game of result.data) {
      if (!Number.isInteger(game?.ID) || game.ID <= 0 || typeof game.nombre !== 'string' || typeof game.genero !== 'string') {
        throw new Error('La API devolvió un videojuego incompleto.')
      }
      games.set(game.ID, game)
    }
    if (result.data.length < 100) return [...games.values()].sort((a, b) => b.ID - a.ID)
  }
  throw new Error('El catálogo es demasiado grande para cargarlo completo. Intenta nuevamente más tarde.')
}

export function filterGames(games, query) {
  const text = searchText(query)
  return games.filter(game => searchText(game.nombre).includes(text) || searchText(game.genero).includes(text))
}
