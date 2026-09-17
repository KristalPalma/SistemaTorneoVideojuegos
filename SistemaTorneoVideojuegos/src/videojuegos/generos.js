export function searchText(value) {
  return value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

export function matchingGenres(value, genres = []) {
  const query = searchText(value)
  return query ? genres.filter(genre => searchText(genre).includes(query)).slice(0, 10) : []
}
