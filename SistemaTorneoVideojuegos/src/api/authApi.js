import { apiClient, ApiError, basicAuthorization } from './apiClient.js'

export async function loginApi(email, password, client = apiClient) {
  client.clearAuthorization()
  const authorization = basicAuthorization(email, password)
  const { data } = await client.request('/auth/me', { auth: authorization })
  // La guia no especifica el JSON exacto de /auth/me: este adaptador debe verificarse con el equipo.
  const roleName = data?.rol ?? data?.role
  const role = { Administrador: 'admin', Superadministrador: 'superadmin' }[roleName]
  if (!role) throw new ApiError('El servidor no devolvió un rol reconocido. Solicita revisar el contrato de /auth/me.', 0, 'ROLE')
  const user = { id: data.ID ?? data.id, name: data.nombre ?? data.name ?? email, role }
  client.setAuthorization(authorization)
  return user
}
