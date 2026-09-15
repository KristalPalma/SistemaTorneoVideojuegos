import { useState } from 'react'
import { loginApi } from '../api/authApi.js'
import { clearSession } from './session.js'

export function useSession() {
  const [user, setUser] = useState(null)
  async function login(email, password) {
    const authenticated = await loginApi(email, password)
    setUser(authenticated)
    return authenticated
  }
  function logout() {
    clearSession()
    setUser(null)
  }
  return { user, login, logout }
}
