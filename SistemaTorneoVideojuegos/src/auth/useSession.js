import { useState } from 'react'
import { loginApi } from '../api/authApi.js'
import { apiClient } from '../api/apiClient.js'
import { scoreDemoEnabled } from '../puntuaciones/scoreService.js'

export function useSession() {
  const [user, setUser] = useState(null)
  async function login(email, password) {
    const authenticated = await loginApi(email, password)
    setUser(authenticated)
    return authenticated
  }
  function logout() {
    apiClient.clearAuthorization()
    setUser(null)
  }
  function enterScoreDemo() {
    if (!scoreDemoEnabled) return
    apiClient.clearAuthorization()
    setUser({ id: 'demo', name: 'Admin de demostración', role: 'admin', demo: true })
  }
  return { user, login, logout, enterScoreDemo }
}
