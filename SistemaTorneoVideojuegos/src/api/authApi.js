import { apiClient, ApiError, basicAuthorization } from './apiClient.js'

export async function loginApi(email, password, client = apiClient) {
  client.clearAuthorization()
  const authorization = basicAuthorization(email, password)
  const { data } = await client.request('/auth/me', { auth: authorization })
  // Contrato confirmado en AuthService del backend: id, nombre, correo y rol.
  const roleName = data?.rol
  const role = { Administrador: 'admin', Superadministrador: 'superadmin' }[roleName]
  if (!role) throw new ApiError('El servidor no devolvió un rol reconocido. Solicita revisar el contrato de /auth/me.', 0, 'ROLE')
  const user = { id: data.id, name: data.nombre, email: data.correo, role }
  if (!Number.isInteger(user.id) || user.id <= 0 || typeof user.name !== 'string' || typeof user.email !== 'string') {
    throw new ApiError('La API devolvió datos de cuenta incompletos.', 0, 'RESPONSE')
  }
  client.setAuthorization(authorization)
  return user
}
