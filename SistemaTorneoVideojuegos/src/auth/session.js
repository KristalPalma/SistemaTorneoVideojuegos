// Simulación temporal
const accounts = [
  { id: 1, username: 'admin', password: 'Admin123!', name: 'Administrador', role: 'admin' },
  { id: 2, username: 'superadmin', password: 'Superadmin123!', name: 'Superadministrador', role: 'superadmin' },
]

export const SESSION_KEY = 'torneo-gamer.session'
const SESSION_DURATION = 8 * 60 * 60 * 1000

export function authenticate(username, password) {
  const account = accounts.find(user => user.username === username.trim() && user.password === password)
  if (!account) throw new Error('Usuario o contraseña incorrectos.')
  return { id: account.id, username: account.username, name: account.name, role: account.role }
}

export function saveSession(user, storage, now = Date.now()) {
  const session = { user: { ...user }, expiresAt: now + SESSION_DURATION }
  storage.setItem(SESSION_KEY, JSON.stringify(session))
  return session
}

export function readSession(storage, now = Date.now()) {
  try {
    const session = JSON.parse(storage.getItem(SESSION_KEY))
    const account = accounts.find(user => user.id === session?.user?.id)
    if (!account || account.role !== session.user.role || account.username !== session.user.username ||
        !Number.isFinite(session.expiresAt) || session.expiresAt <= now || session.expiresAt > now + SESSION_DURATION) {
      storage.removeItem(SESSION_KEY)
      return null
    }
    return { user: { id: account.id, username: account.username, name: account.name, role: account.role }, expiresAt: session.expiresAt }
  } catch {
    return null
  }
}

export function clearSession(storage) {
  storage.removeItem(SESSION_KEY)
}
