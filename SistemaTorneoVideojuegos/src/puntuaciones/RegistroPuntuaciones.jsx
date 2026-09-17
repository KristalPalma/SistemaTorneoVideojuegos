import { useEffect, useRef, useState } from 'react'
import { createScoreOperation } from '../api/puntuacionesApi.js'
import { loadScoreOptions, scorePayload, validateScore } from './registroPuntuaciones.js'
import '../jugadores/RegistroJugador.css'
import './RegistroPuntuaciones.css'
import BuscarOpcion from './BuscarOpcion.jsx'

const emptyForm = { ID_jugador: '', ID_videojuego: '', puntuacion: '' }

export default function RegistroPuntuaciones({ onCancel, onSuccess }) {
  const [form, setForm] = useState(emptyForm)
  const [options, setOptions] = useState({ loading: true, jugadores: [], videojuegos: [] })
  const [revision, setRevision] = useState(0)
  const [errors, setErrors] = useState({})
  const [notice, setNotice] = useState(null)
  const [saving, setSaving] = useState(false)
  const pending = useRef(false)
  const operation = useRef(null)
  const playerRef = useRef(null)

  useEffect(() => {
    const controller = new AbortController()
    loadScoreOptions(controller.signal).then(result => {
      if (!controller.signal.aborted) setOptions({ ...result, loading: false })
    }).catch(error => {
      if (!controller.signal.aborted) setOptions({ loading: false, jugadores: [], videojuegos: [], error: error.message })
    })
    return () => controller.abort()
  }, [revision])

  function change(event) {
    const { name, value } = event.target
    setForm(current => ({ ...current, [name]: value }))
    setErrors(current => ({ ...current, [name]: undefined }))
    setNotice(null)
  }

  async function submit(event) {
    event.preventDefault()
    if (pending.current || options.loading || options.error) return
    const validation = validateScore(form)
    if (!validation.ID_jugador && !options.jugadores.some(item => item.ID === Number(form.ID_jugador))) validation.ID_jugador = 'Selecciona un jugador de la lista.'
    if (!validation.ID_videojuego && !options.videojuegos.some(item => item.ID === Number(form.ID_videojuego))) validation.ID_videojuego = 'Selecciona un videojuego de la lista.'
    setErrors(validation)
    setNotice(null)
    if (Object.keys(validation).length) {
      document.getElementById(`score-${Object.keys(validation)[0]}`)?.focus()
      return
    }
    pending.current = true
    setSaving(true)
    try {
      const payload = scorePayload(form)
      const signature = JSON.stringify(payload)
      // Conserva la misma operación al reintentar el mismo registro tras un error.
      if (operation.current?.signature !== signature) operation.current = { signature, request: createScoreOperation(payload) }
      const result = await operation.current.request.submit()
      if (!Number.isInteger(result?.data?.ID) || result.data.ID < 1) throw new Error('No se pudo confirmar el registro. Intenta nuevamente con los mismos datos.')
      setNotice({ type: 'success', message: `Puntuación registrada correctamente. ID: ${result.data.ID}.` })
      setForm(emptyForm)
      operation.current = null
      if (onSuccess) { onSuccess(result.data); return }
      playerRef.current?.focus()
    } catch (error) {
      setNotice({ type: 'error', message: error.message || 'No fue posible guardar la puntuación.' })
    } finally {
      pending.current = false
      setSaving(false)
    }
  }

  const unavailable = options.loading || Boolean(options.error) || !options.jugadores.length || !options.videojuegos.length
  return <section className="module-panel player-registration score-registration" aria-labelledby="score-title">
    <p className="eyebrow">PUNTUACIONES DEL TORNEO</p>
    <h1 id="score-title">Registrar puntuación</h1>
    <p>Selecciona al jugador y el videojuego para registrar su resultado.</p>
    {options.loading && <p className="player-help" role="status">Cargando jugadores y videojuegos…</p>}
    {options.error && <div className="auth-error" role="alert"><p>{options.error}</p>
      <button className="login-button" onClick={() => { setOptions({ loading: true, jugadores: [], videojuegos: [] }); setRevision(value => value + 1) }}>Reintentar carga</button>
    </div>}
    {!options.loading && !options.error && unavailable && <p className="player-help" role="status">
      {!options.jugadores.length ? 'No hay jugadores registrados. Registra un jugador antes de continuar.' : 'No hay videojuegos registrados. Solicita al superadministrador que agregue uno.'}
    </p>}
    <form onSubmit={submit} noValidate aria-busy={saving || options.loading}>
      <label htmlFor="score-ID_jugador">Jugador *</label>
      <BuscarOpcion id="score-ID_jugador" inputRef={playerRef} items={options.jugadores}
        value={form.ID_jugador} onChange={value => change({ target: { name: 'ID_jugador', value } })}
        placeholder="Escribe el nombre o gamertag..." disabled={saving || unavailable}
        errorId={errors.ID_jugador ? 'score-player-error' : undefined} />
      {errors.ID_jugador && <p className="player-field-error" id="score-player-error">{errors.ID_jugador}</p>}
      <label htmlFor="score-ID_videojuego">Videojuego *</label>
      <BuscarOpcion id="score-ID_videojuego" items={options.videojuegos}
        value={form.ID_videojuego} onChange={value => change({ target: { name: 'ID_videojuego', value } })}
        placeholder="Escribe el nombre del videojuego..." disabled={saving || unavailable}
        errorId={errors.ID_videojuego ? 'score-game-error' : undefined} />
      {errors.ID_videojuego && <p className="player-field-error" id="score-game-error">{errors.ID_videojuego}</p>}
      <label htmlFor="score-puntuacion">Puntuación *</label>
      <input id="score-puntuacion" name="puntuacion" type="text" inputMode="numeric" placeholder="Ej. 950" value={form.puntuacion} onChange={change} readOnly={saving} disabled={unavailable} required
        aria-invalid={Boolean(errors.puntuacion)} aria-describedby={errors.puntuacion ? 'score-value-error' : 'score-value-help'} />
      {errors.puntuacion && <p className="player-field-error" id="score-value-error">{errors.puntuacion}</p>}
      <p className="player-help" id="score-value-help">Usa un número entero igual o mayor que cero. La fecha y el ID se asignan al guardar.</p>
      {notice && <div className={notice.type === 'error' ? 'auth-error' : 'player-success'} role={notice.type === 'error' ? 'alert' : 'status'}>{notice.message}</div>}
      <button className="auth-primary" type="submit" disabled={saving || unavailable}>{saving ? 'Guardando…' : 'Guardar puntuación'}</button>
      {onCancel && <button className="login-button" type="button" disabled={saving} onClick={onCancel}>Cancelar</button>}
    </form>
  </section>
}
