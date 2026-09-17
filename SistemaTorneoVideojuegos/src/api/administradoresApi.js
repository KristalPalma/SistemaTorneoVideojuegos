import { apiClient, ApiError } from './apiClient.js'
import { validarAdministrador } from '../administradores/registroAdministrador.js'
import { administradoresContrato } from './administradoresContrato.js'
import { validateId, validatePatch } from './validation.js'

function pendingContract(operation) {
  const contract = administradoresContrato[operation]
  if (!contract) throw new ApiError('Esta operación estará disponible cuando se conecte el servicio de administradores.', 0, 'PENDING_CONTRACT')
  return contract
}

function safeAccount(row) {
  validateId(row?.id)
  if (typeof row.nombre !== 'string' || typeof row.correo !== 'string') throw new ApiError('La respuesta de administradores está incompleta.', 0, 'RESPONSE')
  return { id: row.id, nombre: row.nombre, correo: row.correo }
}

export async function obtenerAdministradores(signal) {
  const contract = pendingContract('list')
  const accounts = new Map()
  const auth = apiClient.getAuthorization()
  if (!auth) throw new ApiError('Vuelve a iniciar sesión.', 401)
  for (let page = 1; page <= 10000; page++) {
    signal?.throwIfAborted()
    if (apiClient.getAuthorization() !== auth) throw new ApiError('La sesión cambió. Vuelve a consultar.', 401)
    const query = new URLSearchParams(contract.query(page, 100)).toString()
    const result = contract.read(await apiClient.request(`${contract.path}${query ? `?${query}` : ''}`, { auth, signal }))
    if (!Array.isArray(result?.rows) || typeof result.hasNext !== 'boolean') throw new ApiError('No fue posible leer el listado de administradores.', 0, 'RESPONSE')
    for (const row of result.rows) { const account = safeAccount(row); accounts.set(account.id, account) }
    if (!result.hasNext) return [...accounts.values()]
  }
  throw new ApiError('No fue posible cargar todos los administradores.', 0, 'PAGINATION')
}

export async function actualizarAdministrador(id, form) {
  validateId(id)
  const contract = pendingContract('update')
  const limits = { nombre: 100, correo: 150 }
  const changes = {}
  for (const field of contract.fields) {
    if (!Object.hasOwn(limits, field)) throw new ApiError('El contrato de edición requiere revisión.', 0, 'CONFIG')
    changes[field] = field === 'correo' ? form[field].trim().toLowerCase() : form[field]
  }
  const body = contract.body(validatePatch(changes, limits))
  const result = await apiClient.request(contract.path(id), { method: contract.method, body })
  const account = safeAccount(contract.read(result))
  if (account.id !== id) throw new ApiError('No se pudo confirmar la cuenta actualizada.', 0, 'RESPONSE')
  return account
}

export async function eliminarAdministrador(id) {
  validateId(id)
  const contract = pendingContract('remove')
  await apiClient.request(contract.path(id), { method: contract.method })
}

export async function crearAdministrador(form) {
  const errors = validarAdministrador(form)
  if (Object.keys(errors).length) return { errors }
  try {
    // El servidor fija el rol. La confirmación solo se usa en el formulario.
    const result = await apiClient.request('/usuarios', { method: 'POST', body: {
      nombre: form.nombre.trim(), correo: form.correo.trim().toLowerCase(), contrasena: form.contrasena,
    } })
    const data = result?.data
    if (!Number.isInteger(data?.ID) || data.ID < 1 || typeof data.Nombre !== 'string' || typeof data.Correo !== 'string') {
      throw new ApiError('No se pudo confirmar la cuenta creada. Comprueba con el equipo antes de reintentar.', 0, 'RESPONSE')
    }
    return { account: { id: data.ID, nombre: data.Nombre, correo: data.Correo } }
  } catch (error) {
    if (error.status === 409) return { errors: { correo: 'Este correo ya está registrado. Usa otro correo.' } }
    // No mostramos el cuerpo ni mensajes que puedan repetir la contraseña enviada.
    const messages = {
      400: 'El servidor rechazó los datos. Revisa los campos del formulario.',
      422: 'El servidor rechazó los datos. Revisa los campos del formulario.',
      401: 'Tu sesión no es válida. Vuelve a iniciar sesión.',
      403: 'Tu cuenta no tiene permiso para crear administradores.',
      429: 'Demasiadas solicitudes. Espera antes de reintentar.',
    }
    if (error.code === 'RESPONSE') throw error
    throw new ApiError(messages[error.status] || (error.status >= 500
      ? 'El servidor no pudo completar la operación. Intenta más tarde.'
      : 'No se pudo confirmar la creación. Comprueba la conexión; la cuenta podría haberse guardado.'), error.status)
  }
}
