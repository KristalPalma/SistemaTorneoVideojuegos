import './App.css'
import Home from './components/Home'
import Brand from './components/Brand'
import Login from './auth/Login'
import { useSession } from './auth/useSession'
import { dashboardPath, navigationFor, resolveRoute } from './auth/routes'
import { navigate, useHashPath } from './auth/navigation'
import Redirect from './auth/Redirect'
import RegistroJugador from './jugadores/RegistroJugador'
import RegistroVideojuego from './videojuegos/RegistroVideojuego.jsx'
import ConsultaJugadores from './jugadores/ConsultaJugadores.jsx'

function App() {
  const { user, login, logout } = useSession()
  const path = useHashPath()
  const { route, redirect, notFound } = resolveRoute(path, user)

  async function handleLogin(email, password, signal) {
    const authenticatedUser = await login(email, password, signal)
    navigate(dashboardPath(authenticatedUser), true)
  }

  function handleLogout() {
    logout()
    navigate('/', true)
  }

  return (
    <div className="app">
      <header className="header">
        <Brand />
        {!user && <nav className="navigation" aria-label="Navegación principal">
          {navigationFor(null).map(item => <a key={item.path} href={`#${item.path}`}
            className={path === item.path ? 'active' : undefined}
            aria-current={path === item.path ? 'page' : undefined}>{item.label}</a>)}
        </nav>}
        {user ? <div className="session-controls">
          <span className="session-name">{user.name}<small>{user.role === 'Administrador' ? 'ADMIN' : 'SUPERADMIN'}</small></span>
          <button className="login-button" onClick={handleLogout}>Cerrar sesión</button>
        </div> : <a className="login-button" href="#/login">Iniciar sesión</a>}
      </header>

      <div className={user ? 'private-layout' : 'public-layout'}>
        {user && <aside className="sidebar">
          <p className="sidebar-label">MI PANEL</p>
          <nav aria-label="Navegación de administración">
            <a href="#/jugadores" className={path === '/jugadores' ? 'active' : undefined} aria-current={path === '/jugadores' ? 'page' : undefined}>Consultar jugadores</a>
            {navigationFor(user).map(item => <a key={item.path} href={`#${item.path}`}
              className={path === item.path ? 'active' : undefined}
              aria-current={path === item.path ? 'page' : undefined}>{item.label}</a>)}
          </nav>
        </aside>}
        <main id="contenido">
          {redirect ? <Redirect to={redirect} /> : notFound ? <section className="module-panel">
            <h1>Página no encontrada</h1><p>La dirección solicitada no existe.</p>
            <a className="back-link" href={`#${dashboardPath(user)}`}>Volver al inicio →</a>
          </section> : route.login ? <Login onLogin={handleLogin} /> : route.home ? <Home /> :
            route.path === '/admin/jugadores' ? <RegistroJugador /> :
            route.path === '/jugadores' ? <ConsultaJugadores /> :
            route.path === '/superadmin/videojuegos' ? <RegistroVideojuego /> :
            <section className="module-panel" aria-labelledby="page-title">
              <p className="eyebrow">{route.role ? 'PANEL DE ADMINISTRACIÓN' : 'TORNEO GAMER'}</p>
              <h1 id="page-title">{route.title || route.label}</h1>
              {route.dashboard ? <>
                <p>Bienvenido, {user.name}. Tu sesión está activa.</p>
                <div className="access-summary">
                  <h2>Acceso de tu cuenta</h2>
                  <p>{user.role === 'Administrador'
                    ? 'Registro de jugadores y puntuaciones, consulta de clasificación y estadísticas.'
                    : 'Registro de administradores y videojuegos, consulta de clasificación y estadísticas.'}</p>
                </div>
                <p className="demo-note">Los módulos se incorporarán en las siguientes etapas.</p>
              </> : <><p>Esta sección estará disponible próximamente.</p>
                <p className="demo-note">Por ahora solo está preparada la navegación.</p></>}
            </section>}
        </main>
      </div>
      <footer><span>TORNEO GAMER <span className="footer-divider">/</span> La pasión del gaming nos une.</span></footer>
    </div>
  )
}

export default App
