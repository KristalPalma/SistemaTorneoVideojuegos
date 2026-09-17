import { useEffect, useRef, useState } from 'react'
import { playerRegistry } from './registroplayer'
import './RegistroJugador.css'


// Los campos se envian a la API mediante playerRegistry.
const emptyForm = { name: '', gamertag: '', email: '' }

export default function RegistroJugador({ player, onSuccess, onCancel }) {
  const editing = Boolean(player)
  const titleRef = useRef(null)
  const [form, setForm] = useState(() => player
    ? { name: player.nombre, gamertag: player.gamertag, email: player.correo || '' }
    : emptyForm)
  const [errors, setErrors] = useState({})
  const [notice, setNotice] = useState(null)
  const [saving, setSaving] = useState(false)
  const submitting = useRef(false)
  useEffect(() => { if (onCancel) titleRef.current?.focus() }, [onCancel])

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
    setNotice(null)
    setErrors({})
    try {
      const result = editing ? await playerRegistry.update(player.ID, form) : await playerRegistry.register(form)
      if (result.errors) {
        setErrors(result.errors)
        setNotice({ type: 'error', message: Object.values(result.errors).join(' ') })
        document.getElementById(`player-${Object.keys(result.errors)[0]}`)?.focus()
        return
      }
      if (!editing) setForm(emptyForm)
      setNotice({ type: 'success', message: `¡Jugador ${editing ? 'actualizado' : 'registrado'}! ${result.player.gamertag} se guardó correctamente.`, player: result.player })
      onSuccess?.(result.player)
    } catch (error) {
      setNotice({ type: 'error', message: error.message || 'No se pudo completar el registro.' })
    } finally {
      submitting.current = false
      setSaving(false)
    }
  }

  return (
    <section className="module-panel player-registration" aria-labelledby="player-title">
      <p className="eyebrow">{editing ? 'EDICIÓN DE JUGADOR' : 'REGISTRO DE JUGADORES'}</p>
      <h1 id="player-title" ref={titleRef} tabIndex={-1}>{editing ? 'Editar jugador' : 'Registrar jugador'}</h1>
      <p>Completa la información del nuevo jugador. Los campos con * son obligatorios.</p>
      <form onSubmit={submit} noValidate aria-busy={saving}>
        <label htmlFor="player-name">Nombre *</label>
        <input id="player-name" name="name" autoComplete="name" value={form.name}
          onChange={updateField} readOnly={saving} required aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? 'player-name-error' : undefined} />
        {errors.name && <p className="player-field-error" id="player-name-error">{errors.name}</p>}

        <label htmlFor="player-gamertag">Gamertag / Alias *</label>
        <input id="player-gamertag" name="gamertag" autoComplete="off" value={form.gamertag}
          onChange={updateField} readOnly={saving} required aria-invalid={Boolean(errors.gamertag)}
          aria-describedby={errors.gamertag ? 'player-gamertag-error' : undefined} />
        {errors.gamertag && <p className="player-field-error" id="player-gamertag-error">{errors.gamertag}</p>}

        <label htmlFor="player-email">Correo electrónico *</label>
        <input id="player-email" name="email" type="email" autoComplete="email" value={form.email}
          onChange={updateField} readOnly={saving} required aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'player-email-error' : undefined} />
        {errors.email && <p className="player-field-error" id="player-email-error">{errors.email}</p>}

        {!editing && <><label htmlFor="player-date">Fecha de registro</label>
        <input id="player-date" value={new Date().toLocaleDateString('es-MX')} readOnly aria-describedby="player-date-help" />
        <p id="player-date-help" className="player-help">La fecha definitiva y el ID los asigna el servidor al guardar.</p></>}

        {notice && <div className={notice.type === 'error' ? 'auth-error' : 'player-success'}
          role={notice.type === 'error' ? 'alert' : 'status'}>
          <p>{notice.message}</p>
          {notice.player && <>
            <p>ID: {notice.player.id}</p>
            <p>Fecha de registro: {new Date(notice.player.registeredAt).toLocaleString('es-MX')}</p>
          </>}
        </div>}
        <button className="auth-primary" type="submit" disabled={saving}>{saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Guardar jugador'}</button>
        {onCancel && <button className="login-button" type="button" disabled={saving} onClick={onCancel}>Cancelar</button>}
      </form>
    </section>
  )
}
