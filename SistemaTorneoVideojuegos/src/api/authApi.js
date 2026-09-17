import { apiClient, ApiError, basicAuthorization } from './apiClient.js'

// La API local devuelve los nombres del catálogo en mayúsculas.
// Admitimos solo los valores documentados y los observados; conservamos el original.
const roles = new Map([
  ['Administrador', 'Administrador'],
  ['Superadministrador', 'Superadministrador'],
  ['ADMINISTRADOR', 'Administrador'],
  ['SUPER ADMINISTRADOR', 'Superadministrador'],
])

export async function loginApi(email, password, client = apiClient, signal) {
  client.clearAuthorization()
  const version = client.getAuthorizationVersion()
  const authorization = basicAuthorization(email, password)
  const response = await client.request('/auth/me', { auth: authorization, signal })
  if (signal?.aborted || version !== client.getAuthorizationVersion()) {
    throw new ApiError('El inicio de sesión fue cancelado. Intenta nuevamente.', 0, 'CANCELLED')
  }
  const data = response?.data
  // Contrato confirmado en AuthService del backend: id, nombre, correo y rol.
  const role = roles.get(data?.rol)
  if (!role) throw new ApiError('El servidor no devolvió un rol reconocido. Solicita revisar el contrato de /auth/me.', 0, 'ROLE')
  const user = { id: data.id, name: data.nombre, email: data.correo, role, backendRole: data.rol }
  if (!Number.isInteger(user.id) || user.id <= 0 || typeof user.name !== 'string' || !user.name.trim() || typeof user.email !== 'string' || !user.email.trim()) {
    throw new ApiError('La API devolvió datos de cuenta incompletos.', 0, 'RESPONSE')
  }
  client.setAuthorization(authorization)
  return user
}
