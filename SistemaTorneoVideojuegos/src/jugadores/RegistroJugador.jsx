import { useRef, useState } from 'react'
import { playerRegistry } from './registroplayer'
import './RegistroJugador.css'


//cAMBIAR EN CUANTO SE TENGA EL BACK
const emptyForm = { name: '', gamertag: '', email: '' }

export default function RegistroJugador() {
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
    if (submitting.current) return
    submitting.current = true
    setSaving(true)
    setNotice(null)
    setErrors({})
    try {
      const result = await playerRegistry.register(form)
      if (result.errors) {
        setErrors(result.errors)
        setNotice({ type: 'error', message: Object.values(result.errors).join(' ') })
        document.getElementById(`player-${Object.keys(result.errors)[0]}`)?.focus()
        return
      }
      setForm(emptyForm)
      setNotice({ type: 'success', message: `¡Jugador registrado! ${result.player.gamertag} se guardó correctamente.`, player: result.player })
    } catch {
      setNotice({ type: 'error', message: 'Ocurrió un error interno al guardar el jugador. No es un error de formato de tus datos; el formulario conserva lo que escribiste.' })
    } finally {
      submitting.current = false
      setSaving(false)
    }
  }

  return (
    <section className="module-panel player-registration" aria-labelledby="player-title">
      <p className="eyebrow">REGISTRO DE JUGADORES</p>
      <h1 id="player-title">Registrar jugador</h1>
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

        <label htmlFor="player-date">Fecha de registro</label>
        <input id="player-date" value={new Date().toLocaleDateString('es-MX')} readOnly aria-describedby="player-date-help" />

        {notice && <div className={notice.type === 'error' ? 'auth-error' : 'player-success'}
          role={notice.type === 'error' ? 'alert' : 'status'}>
          <p>{notice.message}</p>
          {notice.player && <>
            <p>ID: {notice.player.id}</p>
            <p>Fecha de registro: {new Date(notice.player.registeredAt).toLocaleString('es-MX')}</p>
          </>}
        </div>}
        <button className="auth-primary" type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Guardar jugador'}</button>
      </form>
    </section>
  )
}
