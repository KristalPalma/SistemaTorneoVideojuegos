export function validatePlayer(form, players) {
  // aQUI SE GUARDAN LOS ERRORES
  // TRIM QUITA ESPACIOS EXTERIORES PQ NO CUENTAN
  const errors = {}
  if (!form.name.trim()) errors.name = 'Ingresa el nombre del jugador.'
  if (!form.gamertag.trim()) {
    errors.gamertag = 'Ingresa un gamertag o alias.'
    //CHECAR SI YA HAY ALGUIEN CON ESE GAMETAG
  } else if (players.some(player => player.gamertag.toLowerCase() === form.gamertag.trim().toLowerCase())) {
    errors.gamertag = 'Este gamertag ya está registrado. Elige otro alias.'
  }

    if (!form.email.trim()) {
    errors.email = 'Ingresa el correo electrónico.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'Ingresa un correo electrónico válido.'
  }
  return errors
}

export function createPlayer(form) {
  return {
    // se egenera un id random
    id: crypto.randomUUID(),
    name: form.name.trim(),
    gamertag: form.gamertag.trim(),
    email: form.email.trim(),
    // se gurda la fecha actual en formato estándar
    registeredAt: new Date().toISOString(),
  }
}
