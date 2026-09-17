import { useEffect, useRef, useState } from 'react'
import { eliminarJugador } from '../api/jugadoresApi.js'

export default function EliminarJugador({ player, onSuccess, onCancel }) {
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
      await eliminarJugador(player.ID)
      onSuccess(player)
    } catch (error) {
      setError(error.message || 'No fue posible eliminar al jugador.')
    } finally {
      pending.current = false
      setSaving(false)
    }
  }

  return <section className="player-delete-panel" aria-labelledby="delete-player-title" aria-busy={saving}>
    <h2 id="delete-player-title">¿Eliminar jugador?</h2>
    <p>Vas a eliminar a <strong>{player.nombre}</strong> ({player.gamertag}). Esta acción no se puede deshacer.</p>
    {error && <p className="auth-error" role="alert">{error}</p>}
    <div className="player-actions">
      <button ref={cancelRef} className="login-button" disabled={saving} onClick={onCancel}>Cancelar</button>
      <button className="login-button player-delete" disabled={saving} onClick={confirm}>{saving ? 'Eliminando…' : 'Eliminar'}</button>
    </div>
  </section>
}
