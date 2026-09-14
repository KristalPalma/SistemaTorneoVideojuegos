import { obtenerJugador, obtenerJugadores } from '../api/jugadoresApi.js'
import { jugadoresMock } from '../mocks/jugadoresMock.js'

// Sin URL, solo en desarrollo se muestran ejemplos. Un fallo de API no activa mocks.
export const consultaDemo = Boolean(import.meta.env?.DEV && !import.meta.env?.VITE_API_URL?.trim())

export function createConsultaService(demo = consultaDemo, players = jugadoresMock) {
  return {
    async list({ buscar = '', page = 1, limit = 20 }) {
      if (!demo) return obtenerJugadores({ buscar, page, limit })
      const text = buscar.trim().toLowerCase()
      const filtered = players.filter(player => player.nombre.toLowerCase().includes(text) || player.gamertag.toLowerCase().includes(text))
        .slice().sort((a, b) => b.ID - a.ID)
      return { data: filtered.slice((page - 1) * limit, page * limit), pagination: { page, limit } }
    },
    async detail(id) {
      if (!demo) return obtenerJugador(id)
      const player = players.find(item => item.ID === id)
      if (!player) throw new Error('El jugador ya no está disponible.')
      return player
    },
  }
}

export function formatPlayerDate(value) {
  if (typeof value !== 'string') return 'Fecha no disponible'
  const match = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/.exec(value)
  if (!match) return 'Fecha no disponible'
  const [, year, month, day, hour, minute, second] = match
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
  if (date.getUTCFullYear() !== Number(year) || date.getUTCMonth() !== Number(month) - 1 || date.getUTCDate() !== Number(day) || Number(hour) > 23 || Number(minute) > 59 || Number(second) > 59) return 'Fecha no disponible'
  // Presento la hora del servidor sin inventar una zona horaria.
  return `${day}/${month}/${year} ${hour}:${minute}`
}

export const consultaService = createConsultaService()
