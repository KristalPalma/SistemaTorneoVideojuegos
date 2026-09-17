import { obtenerPuntuaciones } from '../api/puntuacionesApi.js'
import { obtenerJugador } from '../api/jugadoresApi.js'
import { obtenerVideojuego } from '../api/videojuegosApi.js'

export async function loadAllScores(query, list = obtenerPuntuaciones, signal) {
  const rows = new Map()
  for (let page = 1; page <= 10000; page++) {
    signal?.throwIfAborted()
    const batch = await list({ ID_jugador: query.ID_jugador, ID_videojuego: query.ID_videojuego, page, limit: 100 })
    signal?.throwIfAborted()
    for (const row of batch) rows.set(row.ID, row)
    if (batch.length < 100) return [...rows.values()]
  }
  throw new Error('No se pudo cargar la colección completa para ordenar. Reduce los resultados con los filtros.')
}

export function sortScores(rows, order = 'recent') {
  const date = value => typeof value === 'string' && value.trim() ? Date.parse(value.replace(' ', 'T')) : NaN
  return [...rows].sort((a, b) => {
    const byScore = order === 'highest' || order === 'lowest'
    const x = byScore ? Number(a.puntuacion) : date(a.fecha)
    const y = byScore ? Number(b.puntuacion) : date(b.fecha)
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      if (Number.isFinite(x)) return -1
      if (Number.isFinite(y)) return 1
      return b.ID - a.ID
    }
    return (order === 'oldest' || order === 'lowest' ? x - y : y - x) || b.ID - a.ID
  })
}

export async function loadScores(query, list = obtenerPuntuaciones, getPlayer = obtenerJugador, getGame = obtenerVideojuego) {
  const rows = await list(query)
  const players = new Map(), games = new Map()
  await Promise.all([
    ...[...new Set(rows.map(row => row.ID_jugador))].map(async id => {
      try { players.set(id, await getPlayer(id)) } catch { /* Conservamos el ID si el nombre no está disponible. */ }
    }),
    ...[...new Set(rows.map(row => row.ID_videojuego))].map(async id => {
      try { games.set(id, (await getGame(id)).data) } catch { /* El registro sigue siendo consultable. */ }
    }),
  ])
  return rows.map(row => ({ ...row,
    jugador: players.get(row.ID_jugador)?.nombre || `Jugador #${row.ID_jugador}`,
    gamertag: players.get(row.ID_jugador)?.gamertag || '',
    videojuego: games.get(row.ID_videojuego)?.nombre || `Videojuego #${row.ID_videojuego}`,
  }))
}
