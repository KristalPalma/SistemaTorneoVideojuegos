import { obtenerPuntuacionesJugador } from '../api/puntuacionesApi.js'
import { obtenerVideojuego } from '../api/videojuegosApi.js'

export async function loadPlayerScores(id, page, list = obtenerPuntuacionesJugador, getGame = obtenerVideojuego) {
  const scores = await list(id, { page, limit: 5 })
  const names = new Map()
  await Promise.all([...new Set(scores.map(score => score.ID_videojuego))].map(async gameId => {
    try {
      const result = await getGame(gameId)
      names.set(gameId, result?.data?.nombre || `Videojuego #${gameId}`)
    } catch {
      names.set(gameId, `Videojuego #${gameId} (nombre no disponible)`)
    }
  }))
  return scores.map(score => ({ ...score, videojuego: names.get(score.ID_videojuego) }))
}
