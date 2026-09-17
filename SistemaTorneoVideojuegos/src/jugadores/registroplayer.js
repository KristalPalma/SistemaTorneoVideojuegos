import { registerPlayer } from '../api/jugadoresApi.js'
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

export const playerRegistry = {
  async register(form) {
    const errors = validatePlayer(form)
    if (form.name.trim().length > 100) errors.name = 'El nombre admite hasta 100 caracteres.'
    if (form.gamertag.trim().length > 50) errors.gamertag = 'El gamertag admite hasta 50 caracteres.'
    if (form.email.trim().length > 150) errors.email = 'El correo admite hasta 150 caracteres.'
    if (Object.keys(errors).length) return { errors }
    return registerPlayer(form)
  },
}