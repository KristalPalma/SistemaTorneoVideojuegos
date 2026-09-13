import { useState } from 'react'
import { Gamepad2, User, Mail, CalendarDays } from 'lucide-react'
import { createPlayer, validatePlayer } from './registroplayer.js'
import './App.css'
import RegistroVideojuego from './RegistroVideojuego.jsx'


const emptyForm = {
  name: '',
  gamertag: '',
  email: '',
}

function App() {
  // Solo cambio la pantalla visible; los datos siguen en memoria.
  const [screen, setScreen] = useState('players')
  const [games, setGames] = useState([])

  const [form, setForm] = useState(emptyForm)
  const [players, setPlayers] = useState([])
  const [errors, setErrors] = useState({})
  const [notice, setNotice] = useState(null)

  function updateField(event) {
    const { name, value } = event.target

    // actualiza solamente el campo que se esta escribiendo.
    setForm(current => ({
      ...current,
      [name]: value,
    }))

    // quita el error del campo mientras se corrige.
    setErrors(current => ({
      ...current,
      [name]: undefined,
    }))

    setNotice(null)
  }

  function registerPlayer(event) {
    event.preventDefault()

    const validation = validatePlayer(form, players)

    setErrors(validation)

    // Si hay errores, no registra al jugador
    if (Object.keys(validation).length) {
      setNotice({
        type: 'error',
        message:
          'No se pudo registrar al jugador. Revisa los campos indicados.',
      })

      // Esto coloca el cursor en el primer campo en el q dio error
      document
        .getElementById(Object.keys(validation)[0])
        ?.focus()

      return
    }

    try {
      const player = createPlayer(form)

      // agrega el nuevo jugador a la lista.
      setPlayers(current => [...current, player])

      setForm(emptyForm)

      setNotice({
        type: 'success',
        message: `¡Jugador registrado! ${player.gamertag} ya forma parte de TORNEO GAMING :)`,
        player,
      })
    } catch {
      setNotice({
        type: 'error',
        message:
          'No se pudo guardar el jugador. Intenta de nuevo.',
      })
    }
  }

  
  const fields = [
    {
      name: 'name',
      label: 'Nombre',
      placeholder: 'Ej. Ana Torres',
      icon: User,
      autoComplete: 'name',
      type: 'text',
    },
    {
      name: 'gamertag',
      label: 'Gamertag / Alias',
      placeholder: 'Ej. MonitaGamer',
      icon: Gamepad2,
      autoComplete: 'off',
      type: 'text',
    },
    {
      name: 'email',
      label: 'Correo electrónico',
      placeholder: 'Ej. ana@email.com',
      icon: Mail,
      autoComplete: 'email',
      type: 'email',
    },
  ]

  return (
    <div className="app-shell">
      <aside className="sidebar">

        <div className="brand">
          <Gamepad2 size={20} />
          <span>TORNEO GAMING</span>
        </div>

        <div className="nav-label">
          TORNEO DE VIDEOJUEGOS :D
        </div>

        <nav aria-label="Navegación principal">
          <a
            className={`nav-item ${screen === 'players' ? 'active' : ''}`}
            href="#registro"
            onClick={() => setScreen('players')}
            aria-current={screen === 'players' ? 'page' : undefined}
          >
            <User size={20} />
            Registro jugadores
          </a>
          <a
            className={`nav-item ${screen === 'games' ? 'active' : ''}`}
            href="#videojuegos"
            onClick={() => setScreen('games')}
            aria-current={screen === 'games' ? 'page' : undefined}
          >
            <Gamepad2 size={20} />
            Videojuegos
          </a>
        </nav>

      </aside>

      <div className="workspace">

        <main id="registro" hidden={screen !== 'players'}>

          <div className="breadcrumb">
            Jugadores <span>/</span> <strong>Registro</strong>
          </div>

          <div className="page-heading">
            <div>
              <h1>Registrar jugador</h1>
              <p>Completa la información del nuevo jugador.</p>
            </div>
          </div>

          <section
            className="registration-card"
            aria-labelledby="form-title"
          >

            <div className="card-heading">

              <span className="card-icon">
                <User size={20} />
              </span>

              <div>
                <h2 id="form-title">
                  Información del jugador
                </h2>

                <p>
                  Los campos con{' '}
                  <span className="required">*</span>{' '}
                  son obligatorios.
                </p>
              </div>

            </div>
            {/*FORMULARIO*/}
            <form onSubmit={registerPlayer} noValidate>

              {fields.map(field => {
                const FieldIcon = field.icon

                return (
                  <div
                    className="field"
                    key={field.name}
                  >

                    <label htmlFor={field.name}>
                      {field.label}{' '}
                      <span className="required">*</span>
                    </label>

                    <div
                      className={`input-wrap ${
                        errors[field.name] ? 'invalid' : ''
                      }`}
                    >

                      <FieldIcon size={20} />

                      <input
                        id={field.name}
                        name={field.name}
                        type={field.type}
                        autoComplete={field.autoComplete}
                        placeholder={field.placeholder}
                        value={form[field.name]}
                        onChange={updateField}
                        required
                        aria-invalid={Boolean(
                          errors[field.name]
                        )}
                        aria-describedby={
                          errors[field.name]
                            ? `${field.name}-error`
                            : undefined
                        }
                      />

                    </div>

                    {errors[field.name] && (
                      <p
                        className="field-error"
                        id={`${field.name}-error`}
                      >
                        {errors[field.name]}
                      </p>
                    )}

                  </div>
                )
              })}

              <div className="field">

                <label htmlFor="registered-at">
                  Fecha de registro
                </label>

                <div className="input-wrap readonly">

                  <CalendarDays size={20} />

                  <input
                    id="registered-at"
                    value={new Date().toLocaleDateString(
                      'es-MX',
                      {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      }
                    )}
                    readOnly
                    aria-describedby="date-help"
                  />

                  <span className="automatic">
                    Automática
                  </span>

                </div>

                <p
                  className="field-hint"
                  id="date-help"
                >
                  Se asigna al guardar el jugador.
                </p>

              </div>

              
              {notice && (
                <div
                  className={`notice ${notice.type}`}
                  role={
                    notice.type === 'error'
                      ? 'alert'
                      : 'status'
                  }
                >

                  <strong>
                    {notice.message}
                  </strong>

                  {notice.player && (
                    <>
                      <span>
                        ID: {notice.player.id}
                      </span>

                      <span>
                        Fecha de registro:{' '}
                        {new Date(
                          notice.player.registeredAt
                        ).toLocaleString('es-MX')}
                      </span>
                    </>
                  )}

                </div>
              )}

              <button
                className="save-button"
                type="submit"
              >
                Guardar jugador
              </button>

            </form>

          </section>

        </main>

        <main id="videojuegos" hidden={screen !== 'games'}>
          <RegistroVideojuego games={games} setGames={setGames} />
        </main>

        <footer>
          TORNEO GAMING
          <span>
            Sistema de torneo de videojuegos
          </span>
        </footer>

      </div>

    </div>
  )
}

export default App
