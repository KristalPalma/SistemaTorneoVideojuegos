import { apiClient } from '../api/apiClient.js'

// No hay sesion persistente: el cliente conserva Basic solamente en memoria.
export function clearSession(client = apiClient) {
  client.clearAuthorization()
}
