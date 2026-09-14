import { useState } from 'react'

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [visible, setVisible] = useState(false)
  const [error, setError] = useState('')

  function submit(event) {
    event.preventDefault()
    setError('')
    if (!username.trim() || !password) {
      setError('Ingresa tu usuario y contraseña.')
      return
    }
    try {
      onLogin(username, password)
    } catch (error) {
      setError(error.message)
      setPassword('')
    }
  }

  return (
    <section className="login-card" aria-labelledby="login-title">
      <p className="eyebrow">TORNEO GAMER</p>
      <h1 id="login-title">Iniciar sesión</h1>
      <p className="auth-description">Accede con tu cuenta de administrador.</p>
      <form onSubmit={submit}>
        <label htmlFor="username">Usuario</label>
        <input id="username" name="username" autoComplete="username" autoCapitalize="none" spellCheck={false}
          value={username} onChange={event => { setUsername(event.target.value); setError('') }} required autoFocus />
        <label htmlFor="password">Contraseña</label>
        <div className="password-field">
          <input id="password" name="password" type={visible ? 'text' : 'password'} autoComplete="current-password"
            value={password} onChange={event => { setPassword(event.target.value); setError('') }} required />
          <button type="button" aria-controls="password" aria-pressed={visible} onClick={() => setVisible(!visible)}>
            {visible ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button className="auth-primary" type="submit">Iniciar sesión</button>
      </form>
      <a className="back-link" href="#/">← Volver al inicio</a>
      <p className="demo-note">Acceso de demostración. La conexión con el servidor se incorporará después.</p>
    </section>
  )
}
