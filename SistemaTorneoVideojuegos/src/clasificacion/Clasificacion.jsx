import { useEffect, useState } from 'react'
import { obtenerClasificacion } from '../api/clasificacionApi.js'
import { loadGameCatalog } from '../videojuegos/consultaVideojuegosService.js'
import { formatPlayerDate } from '../jugadores/consultaService.js'
import BuscarOpcion from '../puntuaciones/BuscarOpcion.jsx'
import './Clasificacion.css'
import { loadScores } from '../puntuaciones/consultaPuntuaciones.js'

export default function Clasificacion() {
  const [games, setGames] = useState({ loading: true, data: [] })
  const [selected, setSelected] = useState('')
  const [page, setPage] = useState(1)
  const [retry, setRetry] = useState(0)
  const [catalogRetry, setCatalogRetry] = useState(0)
  const [state, setState] = useState({ rows: [], loading: true })
  const game = games.data.find(item => String(item.ID) === selected)

  useEffect(() => {
    const controller = new AbortController()
    loadGameCatalog(undefined, controller.signal).then(data => {
      if (!controller.signal.aborted) setGames({ data })
    }).catch(error => {
      if (!controller.signal.aborted) setGames({ data: [], error: error.message })
    })
    return () => controller.abort()
  }, [catalogRetry])

  useEffect(() => {
    const controller = new AbortController()
    const request = selected
      ? obtenerClasificacion(Number(selected), page, controller.signal)
      : loadScores({ page, limit: 20 }).then(rows => ({ rows, hasNext: rows.length === 20 && page < 10000 }))
    request.then(result => {
      if (!controller.signal.aborted) setState(result)
    }).catch(error => {
      if (!controller.signal.aborted) setState({ rows: [], error: error.status === 404
        ? 'El videojuego seleccionado ya no existe o no está disponible.' : error.message })
    })
    return () => controller.abort()
  }, [selected, page, retry])

  function choose(value) {
    if (value === selected) return
    setState({ rows: [], loading: true })
    setPage(1)
    setSelected(value)
  }
  function refresh() { setState({ rows: [], loading: true }); setRetry(value => value + 1) }
  function move(next) { setState({ rows: [], loading: true }); setPage(next) }

  return <section className="module-panel ranking-page" aria-labelledby="ranking-title">
    <p className="eyebrow">LAS MEJORES MARCAS DEL TORNEO</p>
    <h1 id="ranking-title">Clasificación</h1>
    <p>Cada videojuego tiene su propia clasificación. Se muestra la mejor puntuación de cada jugador.</p>
    <div className="ranking-filter">
      <div><label htmlFor="ranking-game">Videojuego</label>
        <BuscarOpcion id="ranking-game" items={games.data} required={false} value={selected} onChange={choose}
          disabled={games.loading || Boolean(games.error)} placeholder="Escribe para seleccionar un videojuego…" />
      </div>
      <button className="login-button" disabled={state.loading} onClick={refresh}>Actualizar</button>
    </div>
    {games.loading && <p role="status">Cargando videojuegos…</p>}
    {games.error && <div className="auth-error" role="alert"><p>{games.error}</p>
      <button className="login-button" onClick={() => { setGames({ loading: true, data: [] }); setCatalogRetry(value => value + 1) }}>Reintentar catálogo</button></div>}
    {!games.loading && !games.error && !games.data.length && <p role="status">Todavía no hay videojuegos registrados.</p>}
    {!selected && <p className="ranking-empty" role="status">Selecciona un videojuego para consultar sus posiciones.</p>}
    {<>
      <h2>{selected ? game?.nombre || 'Videojuego seleccionado' : 'Puntuaciones registradas'}</h2>
      {selected && <p className="ranking-help">En empates se respeta la marca más antigua; si coincide la fecha, el ID de puntuación menor.</p>}
      {state.loading ? <p role="status">Cargando clasificación…</p> : state.error ?
        <div className="auth-error" role="alert"><p>{state.error}</p><button className="login-button" onClick={refresh}>Reintentar</button></div> :
        !state.rows.length ? <p className="ranking-empty" role="status">{page > 1 ? 'No hay más jugadores clasificados.' : 'Este videojuego no tiene puntuaciones válidas ni jugadores clasificados todavía.'}</p> :
          <div className="ranking-scroll"><table className="ranking-table">
            <thead><tr><th>Posición</th><th>Jugador</th><th>Mejor puntuación</th><th>Fecha de la marca</th></tr></thead>
            <tbody>{state.rows.map(row => <tr key={selected ? row.ID_jugador : row.ID}>
              {selected && <td><span className={`ranking-place place-${row.posicion}`}>{Number(row.posicion) <= 3 && <span aria-hidden="true">{['🥇', '🥈', '🥉'][Number(row.posicion) - 1]} </span>}{row.posicion}</span></td>}
              <td>{row.gamertag || row.jugador || `Jugador #${row.ID_jugador}`}</td>
              {!selected && <td>{row.videojuego}</td>}
              <td className="ranking-score">{Number(row.puntuacion).toLocaleString('es-MX')} <small>PTS</small></td>
              <td>{formatPlayerDate(row.fecha)}</td>
            </tr>)}</tbody>
          </table></div>}
      <nav className="ranking-pagination" aria-label="Páginas de clasificación">
        <button className="login-button" disabled={state.loading || page === 1} onClick={() => move(page - 1)}>Anterior</button>
        <span>Página {page}</span>
        <button className="login-button" disabled={state.loading || Boolean(state.error) || !state.hasNext} onClick={() => move(page + 1)}>Siguiente</button>
      </nav>
    </>}
  </section>
}
