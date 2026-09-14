import { registerGame } from '../api/videojuegosApi.js'
export function validateGame(form, games = []) {
  const errors = {}
  const name = form.name.trim()
  if (!name) {
    errors.name = 'Ingresa el nombre del videojuego.'
  } else if (name.length > 100) {
    errors.name = 'El nombre no puede tener más de 100 caracteres.'
  } else if (hasControlCharacters(name)) {
    errors.name = 'El nombre no puede incluir saltos de línea ni caracteres de control.'
  } else {
    // Comparo sin mayusculas ni espacios exteriores para evitar nombres repetidos.
    for (const game of games) {
      if (game.name.trim().toLowerCase() === name.toLowerCase()) {
        errors.name = 'Este videojuego ya está registrado. Ingresa otro nombre.'
        break
      }
    }
  }
  if (!form.genre.trim()) errors.genre = 'Ingresa el género del videojuego.'
  else if (form.genre.trim().length > 50) errors.genre = 'El género no puede tener más de 50 caracteres.'
  else if (hasControlCharacters(form.genre.trim())) errors.genre = 'El género no puede incluir saltos de línea ni caracteres de control.'
  return errors
}

function hasControlCharacters(value) {
  for (const character of value) {
    const code = character.charCodeAt(0)
    if (code < 32 || code === 127) return true
  }
  return false
}

export const gameRegistry = {
  async register(form) {
    const errors = validateGame(form)
    if (Object.keys(errors).length) return { errors }
    return registerGame(form)
  },
}