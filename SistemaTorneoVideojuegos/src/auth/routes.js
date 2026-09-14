export const routes = [
  { path: '/', label: 'Inicio', home: true },
  { path: '/clasificacion', label: 'Clasificación' },
  { path: '/jugadores', label: 'Jugadores' },
  { path: '/estadisticas', label: 'Estadísticas' },
  { path: '/login', label: 'Iniciar sesión', login: true },
  { path: '/admin', label: 'Inicio', title: 'Dashboard Admin', role: 'admin', dashboard: true },
  { path: '/admin/jugadores', label: 'Registrar jugadores', role: 'admin' },
  { path: '/admin/puntuaciones', label: 'Registrar puntuaciones', role: 'admin' },
  { path: '/admin/clasificacion', label: 'Clasificación', role: 'admin' },
  { path: '/admin/estadisticas', label: 'Estadísticas', role: 'admin' },
  { path: '/superadmin', label: 'Inicio', title: 'Dashboard Superadmin', role: 'superadmin', dashboard: true },
  { path: '/superadmin/administradores', label: 'Agregar administradores', role: 'superadmin' },
  { path: '/superadmin/videojuegos', label: 'Registrar videojuegos', role: 'superadmin' },
  { path: '/superadmin/clasificacion', label: 'Clasificación', role: 'superadmin' },
  { path: '/superadmin/estadisticas', label: 'Estadísticas', role: 'superadmin' },
]

export function dashboardPath(user) {
  return user?.role === 'admin' ? '/admin' : user?.role === 'superadmin' ? '/superadmin' : '/'
}

export function navigationFor(user) {
  return routes.filter(route => user ? route.role === user.role : !route.role && !route.login)
}

export function resolveRoute(path, user) {
  const route = routes.find(item => item.path === path)
  if (!route) return { notFound: true }
  if (route.role && !user) return { redirect: '/login' }
  if (route.role && route.role !== user.role) return { redirect: dashboardPath(user) }
  if (route.login && user) return { redirect: dashboardPath(user) }
  return { route }
}
