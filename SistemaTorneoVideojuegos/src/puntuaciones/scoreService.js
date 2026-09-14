import { apiClient } from '../api/apiClient.js'
import { createScoreOperation } from '../api/puntuacionesApi.js'
import { jugadoresMock, videojuegosMock } from '../mocks/torneoMock.js'

export const scoreDemoEnabled = Boolean(import.meta.env?.DEV && import.meta.env?.VITE_SCORE_DEMO === 'true')

async function listAll(path) {
  const items = []
  for (let page = 1; page <= 10000; page++) {
    const { data } = await apiClient.request(`${path}?page=${page}&limit=100`)
    if (!Array.isArray(data)) throw new Error('El catálogo no tiene el formato esperado.')
    items.push(...data)
    if (data.length < 100) return items
  }
  throw new Error('No se pudo completar la carga del catálogo.')
}

export async function loadScoreCatalogs(demo) {
  if (demo) return { players: jugadoresMock, games: videojuegosMock }
  const [players, games] = await Promise.all([listAll('/jugadores'), listAll('/videojuegos')])
  return { players, games }
}

export function validateScore(form, players, games) {
  const errors = {}
  if (!players.some(player => player.ID === Number(form.player))) errors.player = 'Selecciona un jugador válido.'
  if (!games.some(game => game.ID === Number(form.game))) errors.game = 'Selecciona un videojuego válido.'
  if (!form.score.trim()) errors.score = 'Ingresa la puntuación.'
  else if (!/^\d+$/.test(form.score) || Number(form.score) > 2147483647) errors.score = 'Ingresa un entero entre 0 y 2147483647.'
  return errors
}

export function startScoreOperation(body, demo) {
  if (!demo) return createScoreOperation(body)
  // Reutilizo la generacion de clave y el control de reintentos. Este cliente NO usa fetch.
  return createScoreOperation(body, {
    getAuthorization: () => 'demo-local',
    async request() { return { demo: true } },
  })
}
