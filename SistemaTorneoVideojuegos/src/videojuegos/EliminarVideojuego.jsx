import { useEffect, useRef, useState } from 'react'
import { eliminarVideojuego } from '../api/videojuegosApi.js'

export default function EliminarVideojuego({ game, onCancel, onSuccess }) {
  const pending = useRef(false)
  const cancelRef = useRef(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { cancelRef.current?.focus() }, [])

  async function confirm() {
    if (pending.current) return
    pending.current = true
    setSaving(true)
    setError('')
    try {
      await eliminarVideojuego(game.ID)
      onSuccess(game)
    } catch (error) {
      setError(error.message || 'No fue posible eliminar el videojuego.')
    } finally {
      pending.current = false
      setSaving(false)
    }
  }

  return <section className="game-delete-panel" aria-labelledby="game-delete-title" aria-busy={saving}>
    <h2 id="game-delete-title">¿Eliminar videojuego?</h2>
    <p>Estás a punto de eliminar <strong>{game.nombre}</strong>. Esta acción no se puede deshacer.</p>
    {error && <p className="auth-error" role="alert">{error}</p>}
    <div className="game-actions">
      <button ref={cancelRef} className="login-button" disabled={saving} onClick={onCancel}>Cancelar</button>
      <button className="login-button game-delete" disabled={saving} onClick={confirm}>{saving ? 'Eliminando…' : 'Eliminar'}</button>
    </div>
  </section>
}
