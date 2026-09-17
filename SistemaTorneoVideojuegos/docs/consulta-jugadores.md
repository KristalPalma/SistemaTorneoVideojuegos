# RF04 / RF07 Consulta de jugadores

Ejecutar npm run dev y entrar en Jugadores sin iniciar sesion. En desarrollo, VITE_API_URL vacio activa datos de ejemplo claramente identificados. Estan aislados en src/mocks/jugadoresMock.js; esta rama no contenia torneoMock.js. Para conectar el backend, configurar la URL real incluyendo /api y reiniciar Vite. En produccion no se activa la demostracion. Un error del servidor nunca se sustituye por mocks.

La ruta /jugadores es publica para todos. Se agrego un enlace Consultar jugadores a los menus privados sin cambiar permisos de registro. Lista y detalle usan jugadoresApi.js y el cliente existente; auth vacio omite Authorization incluso con una sesion iniciada.

Buscar envia buscar, page y limit, solo al pulsar Buscar. Limpiar reinicia texto y pagina. Los ejemplos filtran parcialmente nombre/gamertag sin distinguir mayusculas, nunca correo. La API define la comparacion real mediante su collation.

Pagina de 20 registros, Anterior/Siguiente sin total inventado. Si una pagina trae exactamente 20 puede existir una siguiente vacia: se informa y se permite regresar. Cambiar busqueda reinicia pagina y cierra detalle. Las respuestas obsoletas se ignoran para evitar que una busqueda anterior reemplace a la ultima.

El panel de detalle usa GET /jugadores/:id; muestra nombre, gamertag, correo y fecha SQL sin conversion de zona horaria. Datos faltantes o fechas invalidas se presentan como no disponibles. Lista y detalle tienen estados de carga/error y reintento; listado vacio diferencia busqueda sin coincidencias de catalogo vacio.

Prueba manual pendiente en navegador: abrir Jugadores; buscar Ana, RIVAL y un texto sin coincidencias; Limpiar; Ver detalle y Cerrar detalle. Comprobar escritorio/movil y acceso de ambos roles cuando este disponible el login real. Pruebas automatizadas cubren busqueda, paginacion, vacios, fecha, detalle y ausencia de Authorization.

Pendiente API real: conectividad/CORS, contratos efectivos, errores 404/429/500, paginacion con volumen real y acceso de cuentas reales. La guia no confirma el JSON exacto de /auth/me; sigue siendo una dependencia heredada del login, no de esta consulta publica. RF04 es listado/detalle y RF07 busqueda; no se agregaron edicion, eliminacion ni otros modulos.
