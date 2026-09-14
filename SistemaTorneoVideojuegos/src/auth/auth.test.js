import test from 'node:test'
import assert from 'node:assert/strict'
import { authenticate, clearSession, readSession, saveSession, SESSION_KEY } from './session.js'
import { dashboardPath, navigationFor, resolveRoute, routes } from './routes.js'

function memoryStorage() {
  const values = new Map()
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
  }
}

const admin = authenticate('admin', 'Admin123!')
const superadmin = authenticate('superadmin', 'Superadmin123!')

test('login validates credentials without exposing the password in the session', () => {
  assert.equal(admin.role, 'admin')
  assert.equal(superadmin.role, 'superadmin')
  assert.equal('password' in admin, false)
  assert.throws(() => authenticate('admin', 'wrong'), /incorrectos/)
  assert.throws(() => authenticate('unknown', 'Admin123!'), /incorrectos/)
  assert.throws(() => authenticate('admin', ''), /incorrectos/)
})

test('session restores, expires, and is removed on logout', () => {
  const storage = memoryStorage()
  const session = saveSession(admin, storage, 100)
  assert.deepEqual(readSession(storage, 101).user, admin)
  assert.equal(readSession(storage, session.expiresAt), null)
  saveSession(superadmin, storage)
  clearSession(storage)
  assert.equal(readSession(storage), null)
})

test('invalid or inconsistent stored sessions are rejected', () => {
  const storage = memoryStorage()
  storage.setItem(SESSION_KEY, '{broken')
  assert.equal(readSession(storage), null)
  const session = saveSession(admin, storage)
  session.user.role = 'superadmin'
  storage.setItem(SESSION_KEY, JSON.stringify(session))
  assert.equal(readSession(storage), null)
  storage.setItem(SESSION_KEY, JSON.stringify({ user: admin, expiresAt: 'invalid' }))
  assert.equal(readSession(storage), null)
})

test('every private URL requires a session and its exact role', () => {
  for (const route of routes.filter(route => route.role)) {
    assert.equal(resolveRoute(route.path, null).redirect, '/login')
    const allowed = route.role === 'admin' ? admin : superadmin
    const denied = route.role === 'admin' ? superadmin : admin
    assert.equal(resolveRoute(route.path, allowed).route, route)
    assert.equal(resolveRoute(route.path, denied).redirect, dashboardPath(denied))
  }
})

test('public URLs stay public, login redirects signed-in users, unknown URLs stay closed', () => {
  for (const path of ['/', '/jugadores', '/clasificacion', '/estadisticas']) {
    assert.ok(resolveRoute(path, null).route)
  }
  assert.equal(resolveRoute('/login', admin).redirect, '/admin')
  assert.equal(resolveRoute('/login', superadmin).redirect, '/superadmin')
  assert.equal(resolveRoute('/admin/no-existe', null).notFound, true)
})

test('navigation exposes only the options assigned to each access type', () => {
  assert.deepEqual(navigationFor(null).map(route => route.path), ['/', '/clasificacion', '/jugadores', '/estadisticas'])
  assert.deepEqual(navigationFor(admin).map(route => route.path), ['/admin', '/admin/jugadores', '/admin/puntuaciones', '/admin/clasificacion', '/admin/estadisticas'])
  assert.deepEqual(navigationFor(superadmin).map(route => route.path), ['/superadmin', '/superadmin/administradores', '/superadmin/videojuegos', '/superadmin/clasificacion', '/superadmin/estadisticas'])
})
