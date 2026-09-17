export const GENEROS = Object.freeze([
  'Acción', 'Aventura', 'Aventura gráfica', 'Battle Royale', 'Carreras',
  'Deportes', 'Estrategia', 'Lucha', 'MMORPG', 'Plataformas', 'Puzzle',
  'RPG', 'Simulación', 'Shooter', 'Survival Horror',
])

export function searchText(value) {
  return value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

export function matchingGenres(value) {
  const query = searchText(value)
  return GENEROS.filter(genre => searchText(genre).includes(query))
}
