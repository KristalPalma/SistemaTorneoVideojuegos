import { ApiError } from './apiClient.js'

export function validateId(id) {
  if (!Number.isInteger(id) || id < 1 || id > 2147483647) throw new ApiError('El identificador debe ser un entero positivo válido.', 0, 'VALIDATION')
}

export function validatePagination(page, limit) {
  if (!Number.isInteger(page) || page < 1 || page > 10000 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new ApiError('La página o el tamaño de página no son válidos.', 0, 'VALIDATION')
  }
}

// PATCH solo permite campos documentados; nunca mandar ID, fecha ni roles.
export function validatePatch(data, limits) {
  if (!data || typeof data !== 'object' || Array.isArray(data) || !Object.keys(data).length) throw new ApiError('Indica al menos un campo para actualizar.', 0, 'VALIDATION')
  const body = {}
  for (const key of Object.keys(data)) {
    if (!Object.hasOwn(limits, key) || typeof data[key] !== 'string' || !data[key].trim() || data[key].trim().length > limits[key]) {
      throw new ApiError('Los campos de actualización no son válidos.', 0, 'VALIDATION')
    }
    body[key] = data[key].trim()
  }
  if (body.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.correo)) throw new ApiError('El correo electrónico no es válido.', 0, 'VALIDATION')
  return body
}
