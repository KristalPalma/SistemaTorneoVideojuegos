import { useState } from 'react'
import { Gamepad2 } from 'lucide-react'
import { createGame, validateGame } from './registrovideojuego.js'

const emptyForm = { name: '', genre: '' }

function RegistroVideojuego({ games, setGames }) {
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [notice, setNotice] = useState(null)

  function updateField(event) {
    const { name, value } = event.target
    setForm(current => ({ ...current, [name]: value }))
    setErrors(current => ({ ...current, [name]: undefined }))
    setNotice(null)
  }

  function registerGame(event) {
    event.preventDefault()
    const validation = validateGame(form, games)
    setErrors(validation)

    if (Object.keys(validation).length) {
      setNotice({ type: 'error', message: 'No se pudo registrar el videojuego. Revisa los campos indicados.' })
      document.getElementById(`game-${Object.keys(validation)[0]}`)?.focus()
      return
    }

    try {
      const game = createGame(form)
      setGames(current => [...current, game])
      setForm(emptyForm)
      setNotice({ type: 'success', message: `¡Videojuego registrado! ${game.name} se guardó correctamente.`, game })
    } catch {
      setNotice({ type: 'error', message: 'No se pudo guardar el videojuego. Intenta de nuevo.' })
    }
  }

  return (
    <>
      <div className="breadcrumb">
        Videojuegos <span>/</span> <strong>Registro</strong>
      </div>
      <div className="page-heading">
        <div>
          <h1>Registrar videojuego</h1>
          <p>Agrega un nuevo videojuego al torneo.</p>
        </div>
      </div>
      <section className="registration-card" aria-labelledby="game-form-title">
        <div className="card-heading">
          <span className="card-icon"><Gamepad2 size={20} /></span>
          <div>
            <h2 id="game-form-title">Información del videojuego</h2>
            <p>Los campos con <span className="required">*</span> son obligatorios.</p>
          </div>
        </div>

        <form onSubmit={registerGame} noValidate>
          <div className="field">
            <label htmlFor="game-name">Nombre del videojuego <span className="required">*</span></label>
            <div className={`input-wrap ${errors.name ? 'invalid' : ''}`}>
              <Gamepad2 size={20} />
              <input
                id="game-name"
                name="name"
                type="text"
                placeholder="Ej. Valorant"
                value={form.name}
                onChange={updateField}
                required
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? 'game-name-error' : undefined}
              />
            </div>
            {errors.name && <p className="field-error" id="game-name-error">{errors.name}</p>}
          </div>

          <div className="field">
            <label htmlFor="game-genre">Género <span className="required">*</span></label>
            <div className={`input-wrap ${errors.genre ? 'invalid' : ''}`}>
              <input
                id="game-genre"
                name="genre"
                type="text"
                placeholder="Ej. Simulación"
                value={form.genre}
                onChange={updateField}
                required
                aria-invalid={Boolean(errors.genre)}
                aria-describedby={errors.genre ? 'game-genre-error' : undefined}
              />
            </div>
            {errors.genre && <p className="field-error" id="game-genre-error">{errors.genre}</p>}
          </div>

          {notice && (
            <div className={`notice ${notice.type}`} role={notice.type === 'error' ? 'alert' : 'status'}>
              <strong>{notice.message}</strong>
              {notice.game && <span>ID: {notice.game.id}</span>}
            </div>
          )}
          <button className="save-button" type="submit">Guardar videojuego</button>
        </form>
      </section>
      <p className="session-note">Los videojuegos se conservan durante esta sesión y se pierden al recargar la página.</p>
    </>
  )
}

export default RegistroVideojuego
