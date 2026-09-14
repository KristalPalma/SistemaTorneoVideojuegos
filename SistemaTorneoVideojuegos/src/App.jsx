import './App.css'

function App() {
  return (
    <div className="app">
      <header className="header">
        <a className="brand" href="#inicio" aria-label="TORNEA, inicio">
          <svg viewBox="0 0 48 36" fill="none" aria-hidden="true">
            <path d="M14 7h20c5 0 7 5 9 15s-3 14-8 8l-5-6H18l-5 6C8 36 3 32 5 22S9 7 14 7Z" />
            <path d="M15 12v10m-5-5h10" />
            <circle cx="33" cy="14" r="1.5" />
            <circle cx="37" cy="19" r="1.5" />
          </svg>
          <span>TORNEO GAMER</span>
        </a>

        <nav className="navigation" aria-label="Navegación principal">
          <a className="active" href="#inicio" aria-current="page">Inicio</a>
          <button disabled>Clasificación</button>
          <button disabled>Jugadores</button>
          <button disabled>Estadísticas</button>
        </nav>

        <button className="login-button" disabled>Iniciar sesión</button>
      </header>

      <main id="inicio">
        <section className="welcome" aria-labelledby="welcome-title">
          <div className="welcome-content">
            <p className="eyebrow">BIENVENIDO A</p>
            <h1 id="welcome-title">TORNEO GAMER</h1>
            <p className="subtitle">SISTEMA DE TORNEOS DE VIDEOJUEGOS</p>
            <div className="accent-line" />
            <p className="description">Un espacio para jugar, competir y compartir.</p>
          </div>
          <div className="welcome-art" aria-hidden="true">
            <svg className="gamepad" viewBox="0 0 240 180" fill="none">
              <path className="gamepad-body" d="M69 39h102c24 0 35 19 45 72s-15 66-38 38l-23-28H85l-23 28c-23 28-48 15-38-38S45 39 69 39Z" />
              <path className="gamepad-detail" d="M70 61v42M49 82h42" />
              <circle className="gamepad-button" cx="168" cy="66" r="8" />
              <circle className="gamepad-button" cx="188" cy="86" r="8" />
              <circle className="gamepad-stick" cx="98" cy="110" r="13" />
              <circle className="gamepad-stick" cx="143" cy="110" r="13" />
              <path className="gamepad-detail" d="M112 69h16" />
            </svg>
            <span>La pasión del gaming nos une.</span>
          </div>
        </section>

        <section className="intro" aria-labelledby="intro-title">
          <span className="intro-mark" aria-hidden="true">＋</span>
          <div>
            <h2 id="intro-title">Todo comienza con una partida.</h2>
            <p>Bienvenido al punto de encuentro de nuestra comunidad.</p>
          </div>
        </section>
      </main>

      <footer>
        <span>TORNEO GAMER <span className="footer-divider">/</span> La pasión del gaming nos une.</span>
      </footer>
    </div>
  )
}

export default App
