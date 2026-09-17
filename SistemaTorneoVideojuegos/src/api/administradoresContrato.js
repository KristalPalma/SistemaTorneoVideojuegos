// Completar SOLO cuando backend confirme cada contrato. Las rutas son relativas a VITE_API_URL.
// list: { path: '/ruta-confirmada', query: (page, limit) => ({ ... }),
//   read: response => ({ rows: [...], hasNext: false }) }
// Cada fila debe mapearse a { id, nombre, correo }. Incluir únicamente cuentas Administrador.
// read debe respetar la paginación real; hasNext indica si quedan páginas.
// update: { path: id => '/ruta-confirmada', method: 'METODO_CONFIRMADO',
//   fields: ['nombre', 'correo'] (solo los admitidos), body: form => ({ ... }),
//   read: response => ({ id, nombre, correo }) }
// remove: { path: id => '/ruta-confirmada', method: 'METODO_CONFIRMADO' }
// No mapear ni enviar contraseñas, roles o hashes desde edición/listado.
export const administradoresContrato = { list: null, update: null, remove: null }
