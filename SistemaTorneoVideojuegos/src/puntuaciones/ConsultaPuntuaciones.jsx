import { useEffect, useRef, useState } from 'react'
import { loadScores, loadAllScores, sortScores } from './consultaPuntuaciones.js'
import { loadScoreOptions } from './registroPuntuaciones.js'
import { canEditScore } from './editarPuntuacion.js'
import { formatPlayerDate } from '../jugadores/consultaService.js'
import EditarPuntuacion from './EditarPuntuacion.jsx'
import RegistroPuntuaciones from './RegistroPuntuaciones.jsx'
import './ConsultaPuntuaciones.css'
import BuscarOpcion from './BuscarOpcion.jsx'

export default function ConsultaPuntuaciones({ user }) {
  const writable = canEditScore(user)
  const [page, setPage] = useState(1)
  const [order, setOrder] = useState('recent')
  const [reset, setReset] = useState(0)
  const [query, setQuery] = useState({ page: 1, limit: 12 })
  const [options, setOptions] = useState({ jugadores: [], videojuegos: [], loading: true })
  const [optionsRetry, setOptionsRetry] = useState(0)
  const [state, setState] = useState({ loading: true, rows: [] })
  const [editor, setEditor] = useState(null)
  const [creating, setCreating] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const trigger = useRef(null)

  useEffect(() => {
    const controller = new AbortController()
    loadScoreOptions(controller.signal).then(data => {
      if (!controller.signal.aborted) setOptions(data)
    }).catch(error => {
      if (!controller.signal.aborted) setOptions({ jugadores: [], videojuegos: [], error: error.message })
    })
    return () => controller.abort()
  }, [optionsRetry])

  useEffect(() => {
    let active = true
    const controller = new AbortController()
    loadScores(query, filters => loadAllScores(filters, undefined, controller.signal)).then(rows => { if (active) setState({ rows }) })
      .catch(error => { if (active) setState({ rows: [], error: error.message }) })
    return () => { active = false; controller.abort() }
  }, [query])

  function load(next) {
    setPage(1)
    setState({ loading: true, rows: [] })
    setQuery(next)
  }
  function filter(field, value) {
    const next = value ? Number(value) : undefined
    if (query[field] !== next) load({ ...query, [field]: next })
  }
  function close() {
    setEditor(null)
    setCreating(false)
    requestAnimationFrame(() => trigger.current?.focus())
  }
  function saved(score) {
    setState(current => ({ ...current, rows: current.rows.map(row => row.ID === score.ID ? { ...row, ...score } : row) }))
    setNotice('Puntuación actualizada correctamente.')
    close()
  }
  const visibleRows = sortScores(state.rows, order).slice((page - 1) * 12, page * 12)
  const locked = Boolean(editor) || creating

  return <section className="module-panel scores-consultation" aria-labelledby="scores-title">
    <div className="players-heading">
      <div><p className="eyebrow">HISTORIAL DEL TORNEO</p><h1 id="scores-title">Puntuaciones</h1></div>
      {writable && <button className="login-button" disabled={locked} onClick={event => {
        trigger.current = event.currentTarget; setNotice(''); setCreating(true)
      }}>+ Registrar puntuación</button>}
    </div>
    <p>Consulta las marcas de los jugadores por videojuego.</p>
    {notice && <p className="players-feedback" role="status">{notice}</p>}
    {creating && writable && <RegistroPuntuaciones onCancel={close} onSuccess={() => {
      close(); setNotice('Puntuación registrada correctamente.'); load({ page: 1, limit: 12 })
    }} />}
    {editor && writable && <EditarPuntuacion user={user} score={editor} playerName={editor.jugador}
      onBusy={setBusy} onCancel={close} onSuccess={saved} />}
    <fieldset className="scores-filters" disabled={locked || options.loading || Boolean(options.error)}>
      <legend>Filtrar puntuaciones</legend>
      <div className="scores-filter-field"><label htmlFor="filter-player">Jugador</label>
        <BuscarOpcion key={`player-${reset}`} id="filter-player" items={options.jugadores} required={false}
          value={String(query.ID_jugador || '')} onChange={value => filter('ID_jugador', value)} placeholder="Todos los jugadores: escribe para buscar" />
      </div>
      <div className="scores-filter-field"><label htmlFor="filter-game">Videojuego</label>
        <BuscarOpcion key={`game-${reset}`} id="filter-game" items={options.videojuegos} required={false}
          value={String(query.ID_videojuego || '')} onChange={value => filter('ID_videojuego', value)} placeholder="Todos los videojuegos: escribe para buscar" />
      </div>
      <label className="scores-order">Ordenar por<select value={order} onChange={event => { setOrder(event.target.value); setPage(1) }}>
        <option value="recent">Más reciente</option><option value="oldest">Más antigua</option>
        <option value="highest">Puntuación más alta</option><option value="lowest">Puntuación más baja</option>
      </select></label>
      <button className="login-button" onClick={() => { setOrder('recent'); setReset(value => value + 1); load({ page: 1, limit: 12 }) }}>Limpiar filtros</button>
    </fieldset>
    {options.loading && <p role="status">Cargando filtros…</p>}
    {options.error && <div className="auth-error" role="alert">{options.error} <button className="login-button" disabled={locked} onClick={() => {
      setOptions({ jugadores: [], videojuegos: [], loading: true }); setOptionsRetry(value => value + 1)
    }}>Reintentar filtros</button></div>}
    {state.loading ? <p role="status">Cargando puntuaciones…</p> : state.error ? <div className="auth-error" role="alert">
      {state.error} <button className="login-button" onClick={() => load({ ...query })}>Reintentar</button>
    </div> : !state.rows.length ? <p role="status">No hay puntuaciones para mostrar. Prueba con otros filtros.</p> :
      <div className="scores-table-scroll"><table className="scores-table">
        <thead><tr><th>Jugador</th><th>Videojuego</th><th>Puntuación</th><th>Fecha</th>{writable && <th>Acciones</th>}</tr></thead>
        <tbody>{visibleRows.map(score => <tr key={score.ID}>
          <td><strong>{score.jugador}</strong><small>{score.gamertag} · Registro #{score.ID}</small></td>
          <td>{score.videojuego}</td><td className="player-score-value">{score.puntuacion.toLocaleString('es-MX')} <small>PTS</small></td>
          <td>{formatPlayerDate(score.fecha)}</td>
          {writable && <td><button className="login-button" disabled={locked || busy} aria-label={`Editar puntuación ${score.ID} de ${score.jugador}`} onClick={event => {
            trigger.current = event.currentTarget; setNotice(''); setEditor(score)
          }}>Editar puntuación</button></td>}
        </tr>)}</tbody>
      </table></div>}
    <nav className="player-pagination" aria-label="Páginas de puntuaciones">
      <button className="login-button" disabled={locked || state.loading || page === 1} onClick={() => setPage(value => value - 1)}>Anterior</button>
      <span>Página {page}</span>
      <button className="login-button" disabled={locked || state.loading || Boolean(state.error) || page * 12 >= state.rows.length} onClick={() => setPage(value => value + 1)}>Siguiente</button>
    </nav>
  </section>
}
