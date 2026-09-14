import { useEffect, useState } from 'react'
import { consultaDemo, consultaService, formatPlayerDate } from './consultaService.js'
import './ConsultaJugadores.css'

function DetalleJugador({ id, onClose }) {
  const [state, setState] = useState({ loading: true })
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let active = true
    consultaService.detail(id).then(player => { if (active) setState({ player }) })
      .catch(error => { if (active) setState({ error: error.message }) })
    return () => { active = false }
  }, [id, retry])
  return <section className="player-detail" aria-labelledby="detail-title">
    <h2 id="detail-title">Información del jugador</h2>
    <button className="login-button" onClick={onClose}>Cerrar detalle</button>
    {state.loading ? <p role="status">Cargando detalle…</p> : state.error ? <div role="alert" className="auth-error">
      <p>{state.error}</p><button className="login-button" onClick={() => { setState({ loading: true }); setRetry(value => value + 1) }}>Reintentar</button>
    </div> : <dl>
      <dt>Nombre</dt><dd>{state.player.nombre}</dd>
      <dt>Gamertag</dt><dd>{state.player.gamertag}</dd>
      <dt>Correo</dt><dd>{state.player.correo || 'No disponible'}</dd>
      <dt>Fecha de registro</dt><dd>{formatPlayerDate(state.player.fecha_registro)}</dd>
    </dl>}
  </section>
}

export default function ConsultaJugadores() {
  const [text, setText] = useState('')
  const [query, setQuery] = useState({ buscar: '', page: 1, limit: 20 })
  const [state, setState] = useState({ loading: true, data: [] })
  const [selected, setSelected] = useState(null)
  useEffect(() => {
    let active = true
    consultaService.list(query).then(result => { if (active) setState({ data: result.data }) })
      .catch(error => { if (active) setState({ data: [], error: error.message }) })
    return () => { active = false }
  }, [query])

  function load(next) {
    setSelected(null)
    setState({ loading: true, data: [] })
    setQuery(next)
  }

  return <section className="module-panel player-consultation" aria-labelledby="players-title">
    <h1 id="players-title">Jugadores</h1>
    <p>Consulta los participantes registrados en el torneo.</p>
    <form className="player-search" onSubmit={event => { event.preventDefault(); load({ ...query, buscar: text.trim(), page: 1 }) }}>
      <label htmlFor="player-search">Buscar por nombre o gamertag</label>
      <input id="player-search" type="search" placeholder="Buscar por nombre o gamertag..." value={text} onChange={event => setText(event.target.value)} />
      <button className="login-button" type="submit">Buscar</button>
      <button className="login-button" type="button" onClick={() => { setText(''); load({ ...query, buscar: '', page: 1 }) }}>Limpiar</button>
    </form>
    {state.loading ? <p role="status">Cargando jugadores…</p> : state.error ? <div className="auth-error" role="alert">
      <p>No fue posible cargar los jugadores. {state.error}</p>
      <button className="login-button" onClick={() => load({ ...query })}>Reintentar</button>
    </div> : !state.data.length ? <p role="status">{query.buscar ? 'No se encontraron jugadores para esta búsqueda.' : query.page > 1 ? 'No hay más jugadores en esta página.' : 'No hay jugadores registrados.'}</p> :
      <ul className="player-list">{state.data.map(player => <li key={player.ID}>
        <div><strong>{player.nombre}</strong><p>{player.gamertag}</p></div>
        <button className="login-button" aria-label={`Ver detalle de ${player.nombre}`} aria-expanded={selected === player.ID} onClick={() => setSelected(player.ID)}>Ver detalle</button>
      </li>)}</ul>}
    <nav className="player-pagination" aria-label="Páginas de jugadores">
      <button className="login-button" disabled={state.loading || query.page <= 1} onClick={() => load({ ...query, page: query.page - 1 })}>Anterior</button>
      <span>Página {query.page}</span>
      <button className="login-button" disabled={state.loading || Boolean(state.error) || state.data.length < query.limit || query.page >= 10000} onClick={() => load({ ...query, page: query.page + 1 })}>Siguiente</button>
    </nav>
    {selected !== null && <DetalleJugador key={selected} id={selected} onClose={() => setSelected(null)} />}
  </section>
}
