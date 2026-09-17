import { useEffect, useRef, useState } from 'react'

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [visible, setVisible] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const pending = useRef(false)
  const request = useRef(null)

  useEffect(() => () => request.current?.abort(), [])

  async function submit(event) {
    event.preventDefault()
    if (pending.current) return
    setError('')
    if (!username.trim() || !password) {
      setError('Ingresa tu correo y contraseña.')
      return
    }
    setSaving(true)
    pending.current = true
    const controller = new AbortController()
    request.current = controller
    try {
      await onLogin(username, password, controller.signal)
    } catch (error) {
      if (controller.signal.aborted) return
      setError(error.message)
      setPassword('')
    } finally {
      pending.current = false
      if (!controller.signal.aborted) setSaving(false)
    }
  }

  return (
    <section className="login-card" aria-labelledby="login-title">
      <p className="eyebrow">TORNEO GAMER</p>
      <h1 id="login-title">Iniciar sesión</h1>
      <p className="auth-description">Accede con el correo de tu cuenta de administrador o superadministrador.</p>
      <form onSubmit={submit} aria-busy={saving}>
        <label htmlFor="username">Correo electrónico</label>
        <input id="username" name="username" type="email" readOnly={saving} autoComplete="username" autoCapitalize="none" spellCheck={false}
          value={username} onChange={event => { setUsername(event.target.value); setError('') }} required autoFocus />
        <label htmlFor="password">Contraseña</label>
        <div className="password-field">
          <input id="password" name="password" readOnly={saving} type={visible ? 'text' : 'password'} autoComplete="current-password"
            value={password} onChange={event => { setPassword(event.target.value); setError('') }} required />
          <button type="button" aria-controls="password" aria-pressed={visible} onClick={() => setVisible(!visible)}>
            {visible ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button className="auth-primary" type="submit" disabled={saving}>{saving ? 'Iniciando sesión…' : 'Iniciar sesión'}</button>
      </form>
    </section>
  )
}
