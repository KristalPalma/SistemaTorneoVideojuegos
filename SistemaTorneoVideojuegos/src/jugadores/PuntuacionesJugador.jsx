import { useEffect, useRef, useState } from 'react'
import EditarPuntuacion from '../puntuaciones/EditarPuntuacion.jsx'
import { canEditScore } from '../puntuaciones/editarPuntuacion.js'
import { loadPlayerScores } from './puntuacionesJugador.js'
import { formatPlayerDate } from './consultaService.js'

export default function PuntuacionesJugador({ id, playerName, user, onBusy }) {
  const [editing, setEditing] = useState(null)
  const [notice, setNotice] = useState('')
  const trigger = useRef(null)

  function closeEditor() {
    setEditing(null)
    requestAnimationFrame(() => trigger.current?.focus())
  }

  function updated(score) {
    setState(current => ({ ...current, scores: current.scores.map(item => item.ID === score.ID ? { ...item, ...score } : item) }))
    setNotice(`Puntuación de ${playerName} actualizada correctamente: ${score.puntuacion}.`)
    closeEditor()
  }
  const [page, setPage] = useState(1)
  const [retry, setRetry] = useState(0)
  const [state, setState] = useState({ loading: true, scores: [] })
  useEffect(() => {
    let active = true
    loadPlayerScores(id, page).then(scores => { if (active) setState({ scores }) })
      .catch(error => { if (active) setState({ scores: [], error: error.message }) })
    return () => { active = false }
  }, [id, page, retry])

  function move(next) {
    setState({ loading: true, scores: [] })
    setPage(next)
  }

  return <section className="player-score-history" aria-labelledby="player-scores-title">
    <h3 id="player-scores-title">Puntuaciones por videojuego</h3>
    {notice && <p className="players-feedback" role="status">{notice}</p>}
    {state.loading ? <p role="status">Cargando puntuaciones…</p> : state.error ? <div role="alert" className="auth-error">
      <p>{state.error}</p><button className="login-button" onClick={() => { setState({ loading: true, scores: [] }); setRetry(value => value + 1) }}>Reintentar</button>
    </div> : !state.scores.length ? <p role="status">{page === 1 ? 'Este jugador todavía no tiene puntuaciones registradas.' : 'No hay más puntuaciones.'}</p> :
      <ul>{state.scores.map(score => <li key={score.ID}>
        <div><strong>{score.videojuego}</strong><small>{playerName}</small><small>{formatPlayerDate(score.fecha)}</small></div>
        <span className="player-score-value">{score.puntuacion.toLocaleString('es-MX')} <small>pts</small></span>
        {canEditScore(user) && <button className="login-button" disabled={Boolean(editing)}
          aria-label={`Editar puntuación de ${playerName} en ${score.videojuego}, registro ${score.ID}`}
          onClick={event => { trigger.current = event.currentTarget; setNotice(''); setEditing(score) }}>Editar puntuación</button>}
      </li>)}</ul>}
    {editing && canEditScore(user) && <EditarPuntuacion key={editing.ID} user={user} playerName={playerName}
      score={editing} onCancel={closeEditor} onSuccess={updated} onBusy={onBusy} />}
    {(page > 1 || state.scores.length === 5) && <nav aria-label="Páginas de puntuaciones" className="player-score-pagination">
      <button className="login-button" disabled={Boolean(editing) || state.loading || page === 1} onClick={() => move(page - 1)}>Anterior</button>
      <span>Página {page}</span>
      <button className="login-button" disabled={Boolean(editing) || state.loading || Boolean(state.error) || state.scores.length < 5 || page >= 10000} onClick={() => move(page + 1)}>Siguiente</button>
    </nav>}
  </section>
}
