import { useEffect, useState } from 'react'
import { loadPlayerScores } from './puntuacionesJugador.js'
import { formatPlayerDate } from './consultaService.js'

export default function PuntuacionesJugador({ id }) {
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
    {state.loading ? <p role="status">Cargando puntuaciones…</p> : state.error ? <div role="alert" className="auth-error">
      <p>{state.error}</p><button className="login-button" onClick={() => { setState({ loading: true, scores: [] }); setRetry(value => value + 1) }}>Reintentar</button>
    </div> : !state.scores.length ? <p role="status">{page === 1 ? 'Este jugador todavía no tiene puntuaciones registradas.' : 'No hay más puntuaciones.'}</p> :
      <ul>{state.scores.map(score => <li key={score.ID}>
        <div><strong>{score.videojuego}</strong><small>{formatPlayerDate(score.fecha)}</small></div>
        <span className="player-score-value">{score.puntuacion.toLocaleString('es-MX')} <small>pts</small></span>
      </li>)}</ul>}
    {(page > 1 || state.scores.length === 5) && <nav aria-label="Páginas de puntuaciones" className="player-score-pagination">
      <button className="login-button" disabled={state.loading || page === 1} onClick={() => move(page - 1)}>Anterior</button>
      <span>Página {page}</span>
      <button className="login-button" disabled={state.loading || Boolean(state.error) || state.scores.length < 5 || page >= 10000} onClick={() => move(page + 1)}>Siguiente</button>
    </nav>}
  </section>
}
