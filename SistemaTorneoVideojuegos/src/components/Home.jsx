export default function Home() {
  return <>
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

        
  </>
}

