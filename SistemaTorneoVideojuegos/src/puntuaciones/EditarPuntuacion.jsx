import { useEffect, useRef, useState } from 'react'
import { actualizarPuntuacion } from '../api/puntuacionesApi.js'
import { canEditScore, validateScoreEdit } from './editarPuntuacion.js'
import './EditarPuntuacion.css'

export default function EditarPuntuacion({ user, playerName, score, onCancel, onSuccess, onBusy }) {
  const [value, setValue] = useState(String(score.puntuacion))
  const [error, setError] = useState('')
  const [failure, setFailure] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [saving, setSaving] = useState(false)
  const pending = useRef(false)
  const input = useRef(null)
  const confirmation = useRef(null)

  useEffect(() => { input.current?.focus() }, [])
  useEffect(() => { if (confirming) confirmation.current?.focus() }, [confirming])

  function review(event) {
    event.preventDefault()
    if (pending.current || !canEditScore(user)) return
    const message = validateScoreEdit(value, score.puntuacion)
    setError(message)
    if (message) { input.current?.focus(); return }
    setFailure('')
    setConfirming(true)
  }

  async function save() {
    if (!confirming || pending.current || !canEditScore(user) || validateScoreEdit(value, score.puntuacion)) return
    pending.current = true
    setSaving(true)
    onBusy(true)
    setFailure('')
    try {
      const updated = await actualizarPuntuacion(score.ID, Number(value))
      onSuccess(updated)
    } catch (error) {
      setFailure(error.message || 'No se pudo guardar la puntuación. Intenta nuevamente.')
    } finally {
      pending.current = false
      setSaving(false)
      onBusy(false)
    }
  }

  if (!canEditScore(user)) return null
  return <section className="score-edit" aria-labelledby="edit-score-title" aria-busy={saving}>
    <h3 id="edit-score-title">Editar puntuación</h3>
    <dl><dt>Jugador</dt><dd>{playerName}</dd><dt>Videojuego</dt><dd>{score.videojuego}</dd>
      <dt>Puntuación actual</dt><dd>{score.puntuacion}</dd></dl>
    <form onSubmit={review} noValidate>
      <label htmlFor="edit-score-value">Nueva puntuación *</label>
      <input ref={input} id="edit-score-value" type="text" inputMode="numeric" required
        value={value} readOnly={confirming || saving} aria-invalid={Boolean(error)}
        aria-describedby={error ? 'edit-score-error' : 'edit-score-help'}
        onChange={event => { setValue(event.target.value); setError(''); setFailure('') }} />
      <small id="edit-score-help">Ingresa una cantidad entera.</small>
      {error && <p id="edit-score-error" className="player-field-error" role="alert">{error}</p>}
      {confirming && <div ref={confirmation} tabIndex={-1} className="score-edit-confirmation">
        <p>¿Cambiar la puntuación de {playerName} en {score.videojuego} de <strong>{score.puntuacion}</strong> a <strong>{Number(value)}</strong>?</p>
      </div>}
      {failure && <p className="auth-error" role="alert">{failure}</p>}
      <div className="player-actions">
        {confirming ? <>
          <button type="button" className="login-button" disabled={saving} onClick={save}>{saving ? 'Guardando…' : 'Confirmar cambio'}</button>
          <button type="button" className="login-button" disabled={saving} onClick={() => { setConfirming(false); input.current?.focus() }}>Volver</button>
        </> : <button className="login-button" type="submit">Guardar cambios</button>}
        <button className="login-button" type="button" disabled={saving} onClick={() => { if (!pending.current) onCancel() }}>Cancelar</button>
      </div>
    </form>
  </section>
}
