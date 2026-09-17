import { useRef, useState } from 'react'
import { crearAdministrador } from '../api/administradoresApi.js'
import { resolveRoute } from '../auth/routes.js'
import '../jugadores/RegistroJugador.css'

const empty = { nombre: '', correo: '', contrasena: '', confirmacion: '' }

export default function RegistroAdministrador({ user }) {
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState({})
  const [notice, setNotice] = useState(null)
  const [saving, setSaving] = useState(false)
  const [visible, setVisible] = useState({})
  const pending = useRef(false)
  const allowed = Boolean(resolveRoute('/superadmin/administradores', user).route)

  function change(event) {
    const { name, value } = event.target
    setForm(current => ({ ...current, [name]: value }))
    setErrors(current => ({ ...current, [name]: undefined }))
    setNotice(null)
  }
  async function submit(event) {
    event.preventDefault()
    if (pending.current || !allowed) return
    pending.current = true
    setSaving(true)
    setNotice(null)
    setErrors({})
    try {
      const result = await crearAdministrador(form)
      if (result.errors) {
        setErrors(result.errors)
        document.getElementById(`administrator-${Object.keys(result.errors)[0]}`)?.focus()
        return
      }
      setForm(empty)
      setVisible({})
      setNotice({ success: true, message: `Administrador creado correctamente: ${result.account.nombre} (${result.account.correo}).` })
      document.getElementById('administrator-nombre')?.focus()
    } catch (error) {
      setNotice({ message: error.message })
    } finally {
      pending.current = false
      setSaving(false)
    }
  }
  if (!allowed) return null
  return <section className="module-panel player-registration" aria-labelledby="administrator-title">
    <p className="eyebrow">ACCESO EXCLUSIVO DEL SUPERADMINISTRADOR</p>
    <h1 id="administrator-title">Administradores</h1>
    <p>Crea una cuenta para gestionar el torneo. Rol de la nueva cuenta: <strong>Administrador</strong>.</p>
    <form onSubmit={submit} noValidate aria-busy={saving}>
      {[
        ['nombre', 'Nombre', 'text', 'name', 100],
        ['correo', 'Correo electrónico', 'email', 'off', 150],
        ['contrasena', 'Contraseña', 'password', 'new-password', 512],
        ['confirmacion', 'Confirmación de contraseña', 'password', 'new-password', 512],
      ].map(([name, label, type, autoComplete, maxLength]) => <div key={name}>
        <label htmlFor={`administrator-${name}`}>{label} *</label>
        <div className={type === 'password' ? 'password-field' : undefined}>
        <input id={`administrator-${name}`} name={name} type={type === 'password' && visible[name] ? 'text' : type} autoComplete={autoComplete}
          maxLength={maxLength} value={form[name]} onChange={change} readOnly={saving} required
          aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `administrator-${name}-error` : name === 'contrasena' ? 'administrator-password-help' : undefined} />
        {type === 'password' && <button type="button" aria-controls={`administrator-${name}`}
          aria-label={`${visible[name] ? 'Ocultar' : 'Mostrar'} ${label.toLowerCase()}`}
          aria-pressed={Boolean(visible[name])} onClick={() => setVisible(current => ({ ...current, [name]: !current[name] }))}>
          {visible[name] ? 'Ocultar' : 'Mostrar'}
        </button>}
        </div>
        {name === 'contrasena' && <p className="player-help" id="administrator-password-help">Entre 15 y 512 caracteres. Puedes usar una frase larga.</p>}
        {errors[name] && <p className="player-field-error" role="alert" id={`administrator-${name}-error`}>{errors[name]}</p>}
      </div>)}
      {notice && <p className={notice.success ? 'player-success' : 'auth-error'} role={notice.success ? 'status' : 'alert'}>{notice.message}</p>}
      <button className="auth-primary" type="submit" disabled={saving}>{saving ? 'Creando cuenta…' : 'Crear administrador'}</button>
    </form>
  </section>
}
