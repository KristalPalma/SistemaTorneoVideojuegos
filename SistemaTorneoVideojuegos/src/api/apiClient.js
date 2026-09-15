export class ApiError extends Error {
  constructor(message, status = 0, code = '', requestId = '') {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.requestId = requestId
  }
}

export function basicAuthorization(email, password) {
  const bytes = new TextEncoder().encode(`${email.trim().toLowerCase()}:${password}`)
  return `Basic ${btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join(''))}`
}

export function createApiClient({ baseUrl, fetchImpl = globalThis.fetch } = {}) {
  // Las credenciales solo viven en memoria, nunca en storage ni en variables VITE.
  let authorization = ''
  return {
    setAuthorization(value) { authorization = value },
    clearAuthorization() { authorization = '' },
    getAuthorization() { return authorization },
    async request(path, { method = 'GET', body, auth, idempotencyKey, signal } = {}) {
      if (!baseUrl?.trim()) throw new ApiError('Falta configurar VITE_API_URL. Solicita la URL al equipo de backend.', 0, 'CONFIG')
      let url
      try { url = new URL(baseUrl.trim()) } catch {
        throw new ApiError('VITE_API_URL no es una URL válida.', 0, 'CONFIG')
      }
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
        throw new ApiError('VITE_API_URL debe ser una URL HTTP(S) sin credenciales, query ni fragmento.', 0, 'CONFIG')
      }
      const headers = { Accept: 'application/json' }
      // Las consultas publicas no necesitan credenciales. /auth/me las pasa explicitamente.
      const credential = auth ?? (method === 'GET' ? '' : authorization)
      if (credential) headers.Authorization = credential
      if (body !== undefined) headers['Content-Type'] = 'application/json'
      if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey
      let response
      try {
        response = await fetchImpl(`${baseUrl.trim().replace(/\/+$/, '')}${path}`, {
          method, headers, body: body === undefined ? undefined : JSON.stringify(body),
          signal: signal ?? AbortSignal.timeout(15000), credentials: 'omit', redirect: 'error', cache: 'no-store',
        })
      } catch {
        throw new ApiError(method === 'GET'
          ? 'No se pudo consultar la API. Comprueba que el backend esté encendido y que permita el origen del frontend.'
          : 'No se pudo confirmar la respuesta del servidor. Revisa la conexión; la operación podría haberse guardado.', 0, 'NETWORK')
      }
      const requestId = response.headers.get('X-Request-Id') || ''
      if (response.status === 204) return null
      let payload
      try { payload = await response.json() } catch { /* Algunos errores no devuelven JSON. */ }
      if (!response.ok) {
        const messages = {
          400: 'El servidor rechazó los datos enviados.',
          401: 'Correo o contraseña incorrectos. Vuelve a iniciar sesión.',
          403: 'Tu cuenta no tiene permiso para esta operación.',
          404: 'No se encontró el recurso solicitado.',
          409: 'El registro entra en conflicto con datos existentes.',
          413: 'La solicitud es demasiado grande.',
          422: 'El jugador o videojuego indicado no existe.',
          429: 'Demasiadas solicitudes. Espera antes de intentar de nuevo.',
          503: 'El servidor no está disponible temporalmente.',
        }
        // Solo mensajes controlados de errores de negocio, nunca detalles de un 500.
        const businessMessage = [400, 404, 409, 422].includes(response.status) &&
          typeof payload?.error?.message === 'string' && payload.error.message.length <= 300
          ? payload.error.message : null
        throw new ApiError(businessMessage || messages[response.status] || 'Ocurrió un error en el servidor.', response.status,
          payload?.error?.code || '', payload?.requestId || requestId)
      }
      if (!payload || !Object.hasOwn(payload, 'data')) throw new ApiError('La respuesta del servidor no tiene el formato esperado.', response.status, 'RESPONSE', requestId)
      return payload
    },
  }
}

export const apiClient = createApiClient({ baseUrl: import.meta.env?.VITE_API_URL })
