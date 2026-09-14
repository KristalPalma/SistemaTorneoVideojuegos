// @ts-nocheck TS1149: the workspace is referenced with inconsistent directory casing.
import { useEffect, useState } from 'react'
import { authenticate, clearSession, readSession, saveSession } from './session'

export function useSession() {
  const [session, setSession] = useState(() => {
    try { return readSession(window.sessionStorage) } catch { return null }
  })

  useEffect(() => {
    if (!session) return
    const timer = window.setTimeout(() => {
      try { clearSession(window.sessionStorage) } catch {}
      setSession(null)
    }, Math.max(0, session.expiresAt - Date.now()))
    return () => window.clearTimeout(timer)
  }, [session])

  function login(username, password) {
    const user = authenticate(username, password)
    try {
      setSession(saveSession(user, window.sessionStorage))
    } catch {
      throw new Error('No se pudo guardar la sesión. Habilita el almacenamiento del navegador e intenta de nuevo.')
    }
    return user
  }

  function logout() {
    try { clearSession(window.sessionStorage) } catch { /* El almacenamiento puede estar bloqueado. */ }
    setSession(null)
  }

  return { user: session?.user ?? null, login, logout }
}
