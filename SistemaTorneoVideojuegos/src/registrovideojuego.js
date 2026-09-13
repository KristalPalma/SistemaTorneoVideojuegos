export function validateGame(form, games) {
  const errors = {}
  const name = form.name.trim()

  if (!name) {
    errors.name = 'Ingresa el nombre del videojuego.'
  } else {
//comparo en minusculas para no registrar el mismo juego dos veces
    for (const game of games) {
      if (game.name.trim().toLowerCase() === name.toLowerCase()) {
        errors.name = 'Este videojuego ya está registrado. Ingresa otro nombre.'
        break
      }
    }
  }

  if (!form.genre.trim()) {
    errors.genre = 'Ingresa el género del videojuego.'
  }

  return errors
}

// PENDIENTE: backend
export function createGame(form) {
  return {
    id: crypto.randomUUID(),
    name: form.name.trim(),
    genre: form.genre.trim(),
  }
}
