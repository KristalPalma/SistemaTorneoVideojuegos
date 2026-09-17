# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.

## Login y conexión real con la API

Configura únicamente `VITE_API_URL` en `.env.local` usando `.env.example` como referencia.
Para el servidor local: `VITE_API_URL=http://127.0.0.1:3000/api`.
Inicia la API y ejecuta `npm run dev`; abre `http://localhost:5173`.
Si cambias la URL, reinicia Vite. El origen debe coincidir con `FRONTEND_ORIGIN` del backend.

El login requiere **correo y contraseña**, no el nombre de usuario. Envía HTTP Basic
mediante `GET /api/auth/me` y acepta únicamente una cuenta válida con el rol
`Administrador` o `Superadministrador`. La API local devuelve `ADMINISTRADOR` y
`SUPER ADMINISTRADOR`: se adaptan explícitamente a los dos nombres documentados para
la navegación y se conserva el valor original en `user.backendRole`.
El backend decide el rol; no hay selector ni cuentas simuladas.
Un 401 indica credenciales incorrectas; un 403 indica falta de permiso. Los errores de red se muestran por separado.

La cabecera Basic se conserva en la memoria del cliente compartido `apiClient` y el usuario
en el estado de React. No se guardan credenciales en archivos, variables de entorno, cookies,
localStorage ni sessionStorage. Recargar requiere iniciar sesión otra vez. Cerrar sesión
limpia ambos estados e invalida respuestas de autenticación pendientes.

- Público: navegación pública, sin controles administrativos. Los GET de recursos omiten Authorization.
- Administrador: dashboard `/admin`, registro de jugadores y acceso reservado a puntuaciones.
- Superadministrador: dashboard `/superadmin`, registro de videojuegos y acceso reservado a administradores.
- No existe herencia de permisos entre los roles. Las vistas pendientes siguen siendo temporales.

`RegistroJugador → playerRegistry → registerPlayer` envía `POST /api/jugadores`
con `{ nombre, gamertag, correo }`. `RegistroVideojuego → gameRegistry → registerGame`
envía `POST /api/videojuegos` con `{ nombre, genero }`. Ambos utilizan el mismo
cliente autenticado, que añade Basic al POST. El backend valida los permisos.

El catálogo de la API local devuelve los roles en mayúsculas. La copia local del backend
ahora reconoce esos dos nombres explícitamente en `src/domain/roles.js`, conservando
los permisos separados. Reinicia la API para cargar la corrección; si ejecutas otra copia
del backend, aplica allí el mismo cambio. Los POST reales no se probaron para evitar insertar datos.

### Verificación manual

1. Sin sesión, abrir enlaces públicos y comprobar que las rutas privadas redirigen al login.
2. Iniciar sesión con cada cuenta real usando su correo; comprobar el dashboard y menú correspondientes.
3. Intentar acceder a rutas del otro rol: debe regresar al dashboard propio.
4. Cerrar sesión y usar Atrás: las páginas privadas deben seguir bloqueadas.
5. Recargar estando autenticado: debe solicitar nuevamente el login.
6. Probar contraseña incorrecta y API detenida: deben mostrarse mensajes diferentes.
7. Cuando se autorice insertar datos, probar ambos formularios y comprobar el POST en Network.

Validación automatizada: `npm run lint`, `npm run build` y
`node --test src/auth/auth.test.js src/api/api.test.js src/api/resources.test.js src/videojuegos/registrovideojuego.test.js`.
Las pruebas usan respuestas simuladas y no modifican la base de datos.
