import { useState } from 'react'
import { loginApi } from '../api/authApi.js'
import { apiClient } from '../api/apiClient.js'

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
  return { user, login, logout }
}
