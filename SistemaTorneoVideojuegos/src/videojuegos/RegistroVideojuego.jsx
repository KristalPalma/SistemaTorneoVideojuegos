import { useEffect, useRef, useState } from 'react'
import { gameRegistry } from './registrovideojuego.js'
import GeneroAutocomplete from './GeneroAutocomplete.jsx'
import '../jugadores/RegistroJugador.css'

const emptyForm = { name: '', genre: '' }

export default function RegistroVideojuego({ game, onSuccess, onCancel }) {
  const editing = Boolean(game)
  const titleRef = useRef(null)
  const [form, setForm] = useState(() => game ? { name: game.nombre, genre: game.genero } : emptyForm)
  const [errors, setErrors] = useState({})
  const [notice, setNotice] = useState(null)
  const [saving, setSaving] = useState(false)
  const submitting = useRef(false)
  useEffect(() => { titleRef.current?.focus() }, [])

  function updateField(event) {
    const { name, value } = event.target
    setForm(current => ({ ...current, [name]: value }))
    setErrors(current => ({ ...current, [name]: undefined }))
    setNotice(null)
  }

  async function submit(event) {
    event.preventDefault()
    if (submitting.current) return
    submitting.current = true
    setSaving(true)
    setErrors({})
    setNotice(null)
    try {
      const result = editing ? await gameRegistry.update(game.ID, form) : await gameRegistry.register(form)
      if (result.errors) {
        setErrors(result.errors)
        setNotice({ type: 'error', message: Object.values(result.errors).join(' ') })
        document.getElementById(`game-${Object.keys(result.errors)[0]}`)?.focus()
        return
      }
      if (!editing) setForm(emptyForm)
      setNotice({ type: 'success', message: `¡Videojuego ${editing ? 'actualizado' : 'registrado'}! ${result.game.name} se guardó correctamente.`, game: result.game })
      onSuccess?.(result.game)
    } catch (error) {
      setNotice({ type: 'error', message: error.message || 'No se pudo completar el registro.' })
    } finally {
      submitting.current = false
      setSaving(false)
    }
  }

  return (
    <section className="module-panel player-registration game-registration" aria-labelledby="game-title">
      <p className="eyebrow">VIDEOJUEGOS DEL TORNEO</p>
      <h1 id="game-title" ref={titleRef} tabIndex={-1}>{editing ? 'Editar videojuego' : 'Registrar videojuego'}</h1>
      <p>{editing ? 'Actualiza el nombre y género.' : 'Agrega un nuevo videojuego al torneo.'} Los campos con * son obligatorios.</p>
      <form onSubmit={submit} noValidate aria-busy={saving}>
        <label htmlFor="game-name">Nombre del videojuego *</label>
        <input id="game-name" name="name" type="text" placeholder="Ej. Valorant"
          value={form.name} onChange={updateField} readOnly={saving} required
          aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'game-name-error' : undefined} />
        {errors.name && <p className="player-field-error" id="game-name-error">{errors.name}</p>}

        <label htmlFor="game-genre">Género *</label>
        <GeneroAutocomplete value={form.genre} disabled={saving} error={errors.genre}
          onChange={value => updateField({ target: { name: 'genre', value } })} />
        {errors.genre && <p className="player-field-error" id="game-genre-error">{errors.genre}</p>}

        {notice && <div className={notice.type === 'error' ? 'auth-error' : 'player-success'}
          role={notice.type === 'error' ? 'alert' : 'status'}>
          <p>{notice.message}</p>
          {notice.game && <p>ID: {notice.game.id}</p>}
        </div>}
        <button className="auth-primary" type="submit" disabled={saving}>{saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Guardar videojuego'}</button>
        {onCancel && <button type="button" className="login-button" disabled={saving} onClick={onCancel}>Cancelar</button>}
      </form>
      <p className="demo-note">Los registros se guardan en el servidor configurado.</p>
    </section>
  )
}
