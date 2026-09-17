import { useEffect, useRef, useState } from 'react'
import { consultaService, formatPlayerDate } from './consultaService.js'
import RegistroJugador from './RegistroJugador.jsx'
import EliminarJugador from './EliminarJugador.jsx'
import PuntuacionesJugador from './PuntuacionesJugador.jsx'
import { canManagePlayers, queryAfterMutation } from './gestionJugadores.js'
import './ConsultaJugadores.css'

function DetalleJugador({ id, onClose }) {
  const dialogRef = useRef(null)
  const [state, setState] = useState({ loading: true })
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    const dialog = dialogRef.current
    const trigger = document.activeElement
    const previousOverflow = document.body.style.overflow
    dialog.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      dialog.close()
      document.body.style.overflow = previousOverflow
      if (trigger?.isConnected) trigger.focus({ preventScroll: true })
    }
  }, [])
  useEffect(() => {
    let active = true
    consultaService.detail(id).then(player => { if (active) setState({ player }) })
      .catch(error => { if (active) setState({ error: error.message }) })
    return () => { active = false }
  }, [id, retry])
  return <dialog ref={dialogRef} className="player-detail" aria-labelledby="detail-title"
    onCancel={event => { event.preventDefault(); onClose() }}
    onClick={event => {
      if (event.target !== event.currentTarget) return
      const rect = event.currentTarget.getBoundingClientRect()
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose()
    }}>
    <div className="player-detail-heading">
      <div><p className="player-detail-label">PERFIL DEL JUGADOR</p><h2 id="detail-title">Información del jugador</h2></div>
      <button className="player-detail-close" aria-label="Cerrar detalle" onClick={onClose} autoFocus>×</button>
    </div>
    {state.loading ? <p role="status">Cargando detalle…</p> : state.error ? <div role="alert" className="auth-error">
      <p>{state.error}</p><button className="login-button" onClick={() => { setState({ loading: true }); setRetry(value => value + 1) }}>Reintentar</button>
    </div> : <>
      <div className="player-detail-identity">
        <span className="player-detail-avatar" aria-hidden="true">{state.player.nombre?.trim().slice(0, 1).toUpperCase() || '?'}</span>
        <div><strong>{state.player.gamertag}</strong><p>Participante del torneo</p></div>
      </div>
      <dl>
      <dt>Nombre</dt><dd>{state.player.nombre}</dd>
      <dt>Gamertag</dt><dd>{state.player.gamertag}</dd>
      <dt>Correo</dt><dd>{state.player.correo || 'No disponible'}</dd>
      <dt>Fecha de registro</dt><dd>{formatPlayerDate(state.player.fecha_registro)}</dd>
    </dl><PuntuacionesJugador key={id} id={id} /></>}
  </dialog>
}

export default function ConsultaJugadores({ user }) {
  const canManage = canManagePlayers(user)
  const headingRef = useRef(null)
  const actionRef = useRef(null)
  const [panel, setPanel] = useState(null)
  const [feedback, setFeedback] = useState('')
  const [text, setText] = useState('')
  const [query, setQuery] = useState({ buscar: '', page: 1, limit: 20 })
  const [state, setState] = useState({ loading: true, data: [] })
  const [selected, setSelected] = useState(null)
  useEffect(() => {
    const buscar = text.trim()
    if (panel || buscar === query.buscar) return
    const timer = setTimeout(() => {
      setSelected(null)
      setState({ loading: true, data: [] })
      setQuery(current => ({ ...current, buscar, page: 1 }))
    }, 300)
    return () => clearTimeout(timer)
  }, [text, query.buscar, panel])

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

  function openPanel(action, player, event) {
    if (!canManage) return
    actionRef.current = event.currentTarget
    setSelected(null)
    setFeedback('')
    setPanel({ action, player })
  }

  function closePanel() {
    setPanel(null)
    requestAnimationFrame(() => {
      if (actionRef.current?.isConnected) actionRef.current.focus()
      else headingRef.current?.focus()
    })
  }

  function complete(action, player) {
    if (!canManage) return
    setPanel(null)
    setFeedback(`Jugador ${player.gamertag} ${action === 'create' ? 'registrado' : action === 'edit' ? 'actualizado' : 'eliminado'} correctamente.`)
    if (action === 'create') setText('')
    load(queryAfterMutation(query, action, state.data.length))
    requestAnimationFrame(() => headingRef.current?.focus())
  }

  if (canManage && panel && panel.action !== 'delete') {
    return <RegistroJugador key={panel.player?.ID || 'new'} player={panel.player}
      onCancel={closePanel} onSuccess={player => complete(panel.action, player)} />
  }

  return <section className="module-panel player-consultation" aria-labelledby="players-title">
    <div className="players-heading">
      <h1 id="players-title" tabIndex={-1} ref={headingRef}>Jugadores</h1>
      {canManage && <button className="login-button" disabled={Boolean(panel)} onClick={event => openPanel('create', null, event)}>+ Agregar jugador</button>}
    </div>
    <p>{canManage ? 'Consulta y administra los jugadores registrados.' : 'Consulta los participantes registrados en el torneo.'}</p>
    {feedback && <p className="players-feedback" role="status">{feedback}</p>}
    {canManage && panel && <div className="player-management-panel">
      <EliminarJugador player={panel.player} onCancel={closePanel} onSuccess={player => complete('delete', player)} />
    </div>}
    <form className="player-search" onSubmit={event => { event.preventDefault(); load({ ...query, buscar: text.trim(), page: 1 }) }}>
      <label htmlFor="player-search">Buscar por nombre o gamertag</label>
      <input id="player-search" type="search" disabled={Boolean(panel)} placeholder="Buscar por nombre o gamertag..." value={text} onChange={event => setText(event.target.value)} />
      <button className="login-button" type="submit" disabled={Boolean(panel)}>Buscar</button>
      <button className="login-button" type="button" disabled={Boolean(panel)} onClick={() => { setText(''); load({ ...query, buscar: '', page: 1 }) }}>Limpiar</button>
    </form>
    {state.loading ? <p role="status">Cargando jugadores…</p> : state.error ? <div className="auth-error" role="alert">
      <p>No fue posible cargar los jugadores. {state.error}</p>
      <button className="login-button" onClick={() => load({ ...query })}>Reintentar</button>
    </div> : !state.data.length ? <p role="status">{query.buscar ? 'No se encontraron jugadores para esta búsqueda.' : query.page > 1 ? 'No hay más jugadores en esta página.' : 'No hay jugadores registrados.'}</p> :
      <ul className="player-list">{state.data.map(player => <li key={player.ID}>
        <div><strong>{player.nombre}</strong><p>{player.gamertag}</p></div>
        {canManage && <div className="player-contact">
          <div><span className="player-field-label">Correo</span><p>{player.correo || 'No disponible'}</p></div>
          <div><span className="player-field-label">Fecha de registro</span><p>{formatPlayerDate(player.fecha_registro)}</p></div>
        </div>}
        <div className="player-actions">
          <button className="login-button" disabled={Boolean(panel)} aria-label={`Ver detalle de ${player.nombre}`} aria-haspopup="dialog" onClick={() => setSelected(player.ID)}>Ver detalle</button>
          {canManage && <>
            <button className="login-button" disabled={Boolean(panel)} aria-label={`Editar a ${player.nombre}`} onClick={event => openPanel('edit', player, event)}>Editar</button>
            <button className="login-button player-delete" disabled={Boolean(panel)} aria-label={`Eliminar a ${player.nombre}`} onClick={event => openPanel('delete', player, event)}>Eliminar</button>
          </>}
        </div>
      </li>)}</ul>}
    <nav className="player-pagination" aria-label="Páginas de jugadores">
      <button className="login-button" disabled={Boolean(panel) || state.loading || query.page <= 1} onClick={() => load({ ...query, page: query.page - 1 })}>Anterior</button>
      <span>Página {query.page}</span>
      <button className="login-button" disabled={Boolean(panel) || state.loading || Boolean(state.error) || state.data.length < query.limit || query.page >= 10000} onClick={() => load({ ...query, page: query.page + 1 })}>Siguiente</button>
    </nav>
    {selected !== null && <DetalleJugador key={selected} id={selected} onClose={() => setSelected(null)} />}
  </section>
}
