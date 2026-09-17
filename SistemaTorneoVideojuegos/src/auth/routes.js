export const routes = [
  { path: '/', label: 'Inicio', home: true },
  { path: '/clasificacion', label: 'Clasificación' },
  { path: '/jugadores', label: 'Jugadores' },
  { path: '/videojuegos', label: 'Videojuegos' },
  { path: '/puntuaciones', label: 'Puntuaciones' },
  { path: '/estadisticas', label: 'Estadísticas' },
  { path: '/login', label: 'Iniciar sesión', login: true },
  { path: '/admin', label: 'Inicio', title: 'Dashboard Admin', role: 'Administrador', dashboard: true },
  { path: '/admin/jugadores', label: 'Registrar jugadores', role: 'Administrador' },
  { path: '/admin/puntuaciones', label: 'Puntuaciones', role: 'Administrador' },
  { path: '/superadmin/puntuaciones', label: 'Puntuaciones', role: 'Superadministrador' },
  { path: '/admin/estadisticas', label: 'Estadísticas', role: 'Administrador' },
  { path: '/superadmin', label: 'Inicio', title: 'Dashboard Superadmin', role: 'Superadministrador', dashboard: true },
  { path: '/superadmin/administradores', label: 'Agregar administradores', role: 'Superadministrador' },
  { path: '/superadmin/videojuegos/gestion', label: 'Videojuegos', role: 'Superadministrador' },
  { path: '/superadmin/estadisticas', label: 'Estadísticas', role: 'Superadministrador' },
]

export function dashboardPath(user) {
  return user?.role === 'Administrador' ? '/admin' : user?.role === 'Superadministrador' ? '/superadmin' : '/'
}

export function navigationFor(user) {
  const items = routes.filter(route => user ? route.role === user.role : !route.role && !route.login)
  if (user?.role === 'Administrador') items.push(routes.find(route => route.path === '/clasificacion'))
  if (user?.role === 'Superadministrador') items.push(routes.find(route => route.path === '/jugadores'))
  return items.sort((a, b) => Number(Boolean(b.dashboard || b.home)) - Number(Boolean(a.dashboard || a.home)))
}

export function resolveRoute(path, user) {
  const route = routes.find(item => item.path === path)
  if (!route) return { notFound: true }
  if (route.role && !user) return { redirect: '/login' }
  if (route.role && route.role !== user.role) return { redirect: dashboardPath(user) }
  if (route.login && user) return { redirect: dashboardPath(user) }
  return { route }
}
