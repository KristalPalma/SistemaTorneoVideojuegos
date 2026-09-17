import { obtenerJugadores } from '../api/jugadoresApi.js'
import { obtenerVideojuegos } from '../api/videojuegosApi.js'

export function validateScore(form) {
  const errors = {}
  for (const [field, label] of [['ID_jugador', 'un jugador'], ['ID_videojuego', 'un videojuego']]) {
    const value = String(form[field] ?? '').trim()
    if (!value) errors[field] = `Selecciona ${label}.`
    else if (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > 2147483647) errors[field] = `Selecciona ${label} válido.`
  }
  const score = String(form.puntuacion ?? '').trim()
  if (!score) errors.puntuacion = 'Ingresa la puntuación.'
  else if (!Number.isFinite(Number(score))) errors.puntuacion = 'Ingresa una puntuación numérica válida.'
  else if (Number(score) < 0) errors.puntuacion = 'La puntuación no puede ser negativa.'
  else if (!/^\d+$/.test(score) || !Number.isInteger(Number(score))) errors.puntuacion = 'La puntuación debe ser un número entero.'
  else if (Number(score) > 2147483647) errors.puntuacion = 'La puntuación no puede superar 2147483647.'
  return errors
}

export function scorePayload(form) {
  return { ID_jugador: Number(form.ID_jugador), ID_videojuego: Number(form.ID_videojuego), puntuacion: Number(form.puntuacion) }
}

async function allOptions(list, signal) {
  const items = new Map()
  for (let page = 1; page <= 10000; page++) {
    signal?.throwIfAborted()
    const { data } = await list({ page, limit: 100 })
    signal?.throwIfAborted()
    if (!Array.isArray(data) || data.some(item => !Number.isInteger(item.ID) || item.ID < 1 || typeof item.nombre !== 'string')) {
      throw new Error('No fue posible leer las opciones del formulario.')
    }
    for (const item of data) items.set(item.ID, item)
    if (data.length < 100) return [...items.values()]
  }
  throw new Error('No fue posible cargar el catálogo completo.')
}

export async function loadScoreOptions(signal, players = obtenerJugadores, games = obtenerVideojuegos) {
  const [jugadores, videojuegos] = await Promise.all([allOptions(players, signal), allOptions(games, signal)])
  return { jugadores, videojuegos }
}
