import { apiClient, ApiError } from './apiClient.js'
import { validarAdministrador } from '../administradores/registroAdministrador.js'

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
