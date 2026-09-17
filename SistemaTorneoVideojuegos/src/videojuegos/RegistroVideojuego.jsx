import { useRef, useState } from 'react'
import { gameRegistry } from './registrovideojuego.js'
import '../jugadores/RegistroJugador.css'

const emptyForm = { name: '', genre: '' }

export default function RegistroVideojuego() {
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [notice, setNotice] = useState(null)
  const [saving, setSaving] = useState(false)
  const submitting = useRef(false)

  function updateField(event) {
    const { name, value } = event.target
    setForm(current => ({ ...current, [name]: value }))
    setErrors(current => ({ ...current, [name]: undefined }))
    setNotice(null)
  }

  async function submit(event) {
    event.preventDefault()
    // Evito guardar dos veces mientras se procesa el registro.
    if (submitting.current) return
    submitting.current = true
    setSaving(true)
    setErrors({})
    setNotice(null)
    try {
      const result = await gameRegistry.register(form)
      if (result.errors) {
        setErrors(result.errors)
        setNotice({ type: 'error', message: Object.values(result.errors).join(' ') })
        document.getElementById(`game-${Object.keys(result.errors)[0]}`)?.focus()
        return
      }
      setForm(emptyForm)
      setNotice({ type: 'success', message: `¡Videojuego registrado! ${result.game.name} se guardó correctamente.`, game: result.game })
    } catch (error) {
      setNotice({ type: 'error', message: error.message || 'No se pudo completar el registro.' })
    } finally {
      submitting.current = false
      setSaving(false)
    }
  }

  // Reutilizo las clases de RF01 para mantener el mismo diseño.
  return (
    <section className="module-panel player-registration" aria-labelledby="game-title">
      <p className="eyebrow">REGISTRO DE VIDEOJUEGOS · RF02</p>
      <h1 id="game-title">Registrar videojuego</h1>
      <p>Agrega un nuevo videojuego al torneo. Los campos con * son obligatorios.</p>
      <form onSubmit={submit} noValidate aria-busy={saving}>
        <label htmlFor="game-name">Nombre del videojuego *</label>
        <input id="game-name" name="name" type="text" placeholder="Ej. Valorant"
          value={form.name} onChange={updateField} readOnly={saving} required
          aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'game-name-error' : undefined} />
        {errors.name && <p className="player-field-error" id="game-name-error">{errors.name}</p>}

        <label htmlFor="game-genre">Género *</label>
        <input id="game-genre" name="genre" type="text" placeholder="Ej. Disparos"
          value={form.genre} onChange={updateField} readOnly={saving} required
          aria-invalid={Boolean(errors.genre)} aria-describedby={errors.genre ? 'game-genre-error' : undefined} />
        {errors.genre && <p className="player-field-error" id="game-genre-error">{errors.genre}</p>}

        <p className="player-help">El ID se asigna automáticamente al guardar.</p>
        {notice && <div className={notice.type === 'error' ? 'auth-error' : 'player-success'}
          role={notice.type === 'error' ? 'alert' : 'status'}>
          <p>{notice.message}</p>
          {notice.game && <p>ID: {notice.game.id}</p>}
        </div>}
        <button className="auth-primary" type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Guardar videojuego'}</button>
      </form>
      <p className="demo-note">Los registros se guardan en el servidor configurado.</p>
    </section>
  )
}
