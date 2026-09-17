import { useEffect, useState } from 'react'
import { loadGameCatalog } from '../videojuegos/consultaVideojuegosService.js'
import { comparisonRows, loadStatistics } from './estadisticasService.js'
import './Estadisticas.css'

const format = value => value === null ? '—' : value.toLocaleString('es-MX', { maximumFractionDigits: 2 })

function StatIcon({ type }) {
  const paths = {
    players: <><circle cx="12" cy="7" r="4" /><path d="M4 22v-3a8 8 0 0 1 16 0v3" /></>,
    games: <><path d="M7 6h10c3 0 4 4 5 10s-2 7-5 2l-1-1H8l-1 1c-3 5-6 4-5-2S4 6 7 6Z" /><path d="M7 9v6m-3-3h6m6-1h.1m3 3h.1" /></>,
    scores: <><path d="M7 3h10v6a5 5 0 0 1-10 0V3Zm0 2H3v3a4 4 0 0 0 4 4m10-7h4v3a4 4 0 0 1-4 4m-5 2v6m-5 1h10" /></>,
    average: <><path d="M4 21V12h3v9m4 0V7h3v14m4 0V3h3v18" /></>,
    max: <path d="M12 21V3m-7 7 7-7 7 7" />,
    min: <path d="M12 3v18m-7-7 7 7 7-7" />,
  }
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[type]}</svg>
}

export function StatisticsResults({ metrics, games, gameId }) {
  const rows = comparisonRows(games, metrics, gameId)
  const highest = rows.reduce((max, row) => Math.max(max, row.average ?? 0), 0)
  const cards = [
    ['players', 'Jugadores participantes', metrics.participants, 'purple'],
    ['games', 'Videojuegos', rows.length, 'blue'],
    ['scores', 'Puntuaciones registradas', metrics.total, 'gold'],
    ['average', 'Puntuación promedio', metrics.average, 'purple'],
    ['max', 'Puntuación más alta', metrics.max, 'cyan'],
    ['min', 'Puntuación más baja', metrics.min, 'blue'],
  ]
  return <>
    <div className="statistics-grid">{cards.map(([icon, label, value, color]) => <article className="statistics-card" key={label}>
      <span className={`statistics-icon statistics-${color}`}><StatIcon type={icon} /></span>
      <div><strong>{format(value)}</strong><h2>{label}</h2></div>
    </article>)}</div>
    {!metrics.total && <p role="status" className="statistics-empty">{gameId === undefined ? 'Todavía no hay puntuaciones registradas en el torneo.' : 'Este videojuego todavía no tiene puntuaciones registradas.'}</p>}
    <section className="statistics-chart" aria-labelledby="chart-title">
      <h2 id="chart-title">Promedio por videojuego</h2>
      <p>Comparación de las puntuaciones registradas.</p>
      {!rows.length ? <p className="statistics-empty">No hay videojuegos registrados.</p> : <ul>{rows.map(row => <li key={row.id}>
        <div className="statistics-bar-label"><span>{row.name}</span><strong>{row.average === null ? 'Sin puntuaciones' : format(row.average)}</strong></div>
        <div className="statistics-track" aria-hidden="true"><div style={{ width: `${highest && row.average !== null ? row.average / highest * 100 : 0}%` }} /></div>
      </li>)}</ul>}
    </section>
  </>
}

export default function Estadisticas() {
  const [games, setGames] = useState({ loading: true, data: [] })
  const [selected, setSelected] = useState('')
  const [state, setState] = useState({ loading: true })
  const [retry, setRetry] = useState(0)
  const gameId = selected ? Number(selected) : undefined
  useEffect(() => {
    const controller = new AbortController()
    loadGameCatalog(undefined, controller.signal).then(data => {
      if (!controller.signal.aborted) setGames({ data })
    }).catch(() => { if (!controller.signal.aborted) setGames({ data: [], error: true }) })
    return () => controller.abort()
  }, [retry])
  useEffect(() => {
    const controller = new AbortController()
    loadStatistics(gameId, controller.signal).then(metrics => {
      if (!controller.signal.aborted) setState({ metrics })
    }).catch(() => { if (!controller.signal.aborted) setState({ error: true }) })
    return () => controller.abort()
  }, [gameId, retry])

  function change(value) { if (value !== selected) { setState({ loading: true }); setSelected(value) } }
  function reload() { setGames({ loading: true, data: [] }); setState({ loading: true }); setRetry(value => value + 1) }
  return <section className="module-panel statistics-page" aria-labelledby="statistics-title">
    <p className="eyebrow">EL TORNEO EN NÚMEROS</p>
    <h1 id="statistics-title">Estadísticas del torneo</h1>
    <p>Resumen de los resultados registrados. Explora los datos de cada videojuego.</p>
    <div className="statistics-filter">
      <div><label htmlFor="statistics-game">Videojuego</label>
        <select id="statistics-game" value={selected} disabled={games.loading || games.error} onChange={event => change(event.target.value)}>
          <option value="">Todos los videojuegos</option>
          {games.data.map(game => <option key={game.ID} value={game.ID}>{game.nombre}</option>)}
        </select>
      </div>
      <button className="login-button" disabled={!selected} onClick={() => change('')}>Restablecer filtro</button>
    </div>
    {state.error || games.error ? <div className="auth-error" role="alert"><p>No fue posible cargar las estadísticas. Comprueba la conexión e intenta nuevamente.</p><button className="login-button" onClick={reload}>Reintentar</button></div>
      : state.loading || games.loading ? <p className="statistics-loading" role="status">Cargando estadísticas…</p>
        : <StatisticsResults metrics={state.metrics} games={games.data} gameId={gameId} />}
  </section>
}
