export function canManagePlayers(user) {
  return user?.role === 'Administrador'
}

export function queryAfterMutation(query, action, visibleCount) {
  if (action === 'create') return { ...query, buscar: '', page: 1 }
  if (action === 'delete' && visibleCount === 1 && query.page > 1) return { ...query, page: query.page - 1 }
  return { ...query }
}
