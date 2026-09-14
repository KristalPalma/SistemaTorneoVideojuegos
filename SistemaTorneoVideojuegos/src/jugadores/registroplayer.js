export function validatePlayer(form, players = []) {
  const errors = {}
  const gamertag = form.gamertag.trim()
  // los espacios vacios no cuentan como datos.
  if (!form.name.trim()) errors.name = 'Ingresa el nombre del jugador.'
  if (!gamertag) {
    errors.gamertag = 'Ingresa el gamertag o alias.'
  } else {
    for (const player of players) {
      if (player.gamertag.toLowerCase() === gamertag.toLowerCase()) {
        errors.gamertag = 'Este gamertag ya está registrado. Elige otro alias.'
        break
      }
    }
  }
  if (!form.email.trim()) {
    errors.email = 'Ingresa el correo electrónico.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'El correo debe tener un formato como nombre@dominio.com, sin espacios.'
  }
  return errors
}

export function createPlayer(form) {
  return {
    id: crypto.randomUUID(),
    name: form.name.trim(),
    gamertag: form.gamertag.trim(),
    email: form.email.trim(),
    registeredAt: new Date().toISOString(),
  }
}

export function createPlayerRegistry() {
  // Pendiente: conectar el backend. Mientras tanto guardo los jugadores en esta lista.
  const players = []
  return {
    async register(form) {
      const errors = validatePlayer(form, players)
      if (Object.keys(errors).length) return { errors }
      const player = createPlayer(form)
      players.push(player)
      return { player }
    },
  }
}

// reemplazar
export const playerRegistry = createPlayerRegistry()
