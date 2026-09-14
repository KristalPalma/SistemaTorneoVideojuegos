# Registro de puntuaciones RF03 / RF05

Para demostrar sin API, crear .env.local con VITE_SCORE_DEMO=true, mantener VITE_API_URL vacio y ejecutar npm run dev. En Iniciar sesion aparece Probar puntuaciones como Admin (sin API). Solo existe en desarrollo; no proporciona credenciales Basic ni acceso al backend. No activar esta opcion en el despliegue.

Los catalogos de ejemplo estan en src/mocks/torneoMock.js. El resultado indica expresamente que no se guarda ni se sincroniza en MySQL. No hay cola pendiente de sincronizacion.

Para usar API real, dejar VITE_SCORE_DEMO=false, configurar VITE_API_URL y reiniciar Vite. Iniciar sesion con una cuenta real Admin. Los catalogos se cargan paginados desde GET /jugadores y GET /videojuegos. No se mezclan datos de prueba con solicitudes reales ni se recurre a mocks si falla la API.

El body lleva exclusivamente ID_jugador, ID_videojuego y puntuacion como enteros. La fecha pertenece al servidor. Se reutiliza createScoreOperation: crypto.randomUUID() por nueva intencion, misma instancia para reintentos. Tras error los campos quedan bloqueados para preservar cuerpo y clave; puede reintentarse o iniciar explicitamente otra operacion. Al salir de la pantalla se pierde la operacion en memoria: resolver los errores de red antes de navegar para no perder su clave.

Prueba manual: entrar al modo demo, enviar vacio, seleccionar jugador y juego, probar negativos/decimales/fuera de rango y finalmente 0 o 8500. Revisar confirmacion demo y limpieza. Con API real verificar carga vacia/error, 401/403/409/422/429/503, reintentos y persistencia MySQL. Pruebas automatizadas cubren validaciones, claves, acceso y el servicio previo prueba conservacion de clave/cuerpo ante fallo de red.

RF03/RF05 quedan cubiertos como registro de puntuacion desde interfaz. No se agregan edicion, eliminacion ni otras funciones. La estructura exacta de /auth/me sigue pendiente de confirmacion con backend, como se documento en conexion-backend.
