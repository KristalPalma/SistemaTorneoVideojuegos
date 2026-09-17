import { useEffect, useRef, useState } from 'react'
import RegistroVideojuego from './RegistroVideojuego.jsx'
import EliminarVideojuego from './EliminarVideojuego.jsx'
import { canManageGames, filterGames, loadGameCatalog } from './consultaVideojuegosService.js'
import './Videojuegos.css'

export function ListaVideojuegos({ games, user, disabled = false, onAction }) {
  return <ul className="game-list">{games.map(game => <li key={game.ID}>
    <div className="game-list-info"><strong>{game.nombre}</strong><span className="game-genre">{game.genero}</span></div>
    {canManageGames(user) && <div className="game-actions">
      <button className="login-button" disabled={disabled} aria-label={`Editar ${game.nombre}`} onClick={event => onAction('edit', game, event)}>Editar</button>
      <button className="login-button game-delete" disabled={disabled} aria-label={`Eliminar ${game.nombre}`} onClick={event => onAction('delete', game, event)}>Eliminar</button>
    </div>}
  </li>)}</ul>
}

export default function ConsultaVideojuegos({ user }) {
  const canManage = canManageGames(user)
  const [state, setState] = useState({ loading: true, games: [] })
  const [revision, setRevision] = useState(0)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [panel, setPanel] = useState(null)
  const [feedback, setFeedback] = useState('')
  const headingRef = useRef(null)
  const triggerRef = useRef(null)
  const filtered = filterGames(state.games, query)
  const pages = Math.max(1, Math.ceil(filtered.length / 20))
  const currentPage = Math.min(page, pages)
  const visible = filtered.slice((currentPage - 1) * 20, currentPage * 20)

  useEffect(() => {
    const controller = new AbortController()
    loadGameCatalog(undefined, controller.signal)
      .then(games => { if (!controller.signal.aborted) setState({ games, loading: false }) })
      .catch(error => { if (!controller.signal.aborted) setState({ games: [], error: error.message, loading: false }) })
    return () => controller.abort()
  }, [revision])

  function reload() {
    setState({ games: [], loading: true })
    setRevision(value => value + 1)
  }

  function openPanel(action, game, event) {
    if (!canManage) return
    triggerRef.current = event.currentTarget
    setFeedback('')
    setPanel({ action, game })
  }

  function closePanel() {
    setPanel(null)
    requestAnimationFrame(() => {
      if (triggerRef.current?.isConnected) triggerRef.current.focus()
      else headingRef.current?.focus()
    })
  }

  function complete(action, game) {
    if (!canManage) return
    setPanel(null)
    setFeedback(`Videojuego ${game.name || game.nombre} ${action === 'create' ? 'registrado' : action === 'edit' ? 'actualizado' : 'eliminado'} correctamente.`)
    if (action === 'create') { setQuery(''); setPage(1) }
    reload()
    requestAnimationFrame(() => headingRef.current?.focus())
  }

  if (canManage && panel && panel.action !== 'delete') {
    return <RegistroVideojuego key={panel.game?.ID || 'new'} game={panel.game}
      onCancel={closePanel} onSuccess={game => complete(panel.action, game)} />
  }

  return <section className="module-panel game-consultation" aria-labelledby="games-title">
    <div className="games-heading">
      <h1 id="games-title" ref={headingRef} tabIndex={-1}>{canManage ? 'Videojuegos' : 'Videojuegos del torneo'}</h1>
      {canManage && <button className="login-button" disabled={Boolean(panel)} onClick={event => openPanel('create', null, event)}>+ Agregar videojuego</button>}
    </div>
    <p>{canManage ? 'Gestiona los videojuegos disponibles en el torneo.' : 'Consulta los videojuegos disponibles y encuentra tu próximo juego.'}</p>
    {feedback && <p className="games-feedback" role="status">{feedback}</p>}
    {canManage && panel && <EliminarVideojuego game={panel.game} onCancel={closePanel} onSuccess={game => complete('delete', game)} />}
    <form className="game-search" onSubmit={event => { event.preventDefault(); setPage(1) }}>
      <label htmlFor="game-search">Buscar por nombre o género</label>
      <input id="game-search" type="search" placeholder="Buscar videojuego..." value={query} disabled={Boolean(panel)} onChange={event => { setQuery(event.target.value); setPage(1) }} />
      <button className="login-button" disabled={Boolean(panel)} type="submit">Buscar</button>
      <button className="login-button" disabled={Boolean(panel)} type="button" onClick={() => { setQuery(''); setPage(1) }}>Limpiar</button>
    </form>
    {state.loading ? <p role="status">Cargando videojuegos…</p> : state.error ? <div className="auth-error" role="alert">
      <p>No fue posible cargar los videojuegos. {state.error}</p>
      <button className="login-button" disabled={Boolean(panel)} onClick={reload}>Reintentar</button>
    </div> : !filtered.length ? <p role="status">{query ? 'No se encontraron videojuegos para esta búsqueda.' : 'No hay videojuegos registrados.'}</p>
      : <ListaVideojuegos games={visible} user={user} disabled={Boolean(panel)} onAction={openPanel} />}
    {!state.loading && !state.error && filtered.length > 0 && <nav className="game-pagination" aria-label="Páginas de videojuegos">
      <button className="login-button" disabled={Boolean(panel) || currentPage === 1} onClick={() => setPage(currentPage - 1)}>Anterior</button>
      <span>Página {currentPage} de {pages}</span>
      <button className="login-button" disabled={Boolean(panel) || currentPage === pages} onClick={() => setPage(currentPage + 1)}>Siguiente</button>
    </nav>}
  </section>
}
