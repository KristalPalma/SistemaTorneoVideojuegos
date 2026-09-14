import { useEffect, useRef, useState } from 'react'
import { loadScoreCatalogs, startScoreOperation, validateScore } from './scoreService.js'
import '../jugadores/RegistroJugador.css'
import './RegistroPuntuacion.css'

const empty = { player: '', game: '', score: '' }

export default function RegistroPuntuacion({ demo = false }) {
  const [form, setForm] = useState(empty)
  const [catalogs, setCatalogs] = useState({ players: [], games: [] })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reload, setReload] = useState(0)
  const [errors, setErrors] = useState({})
  const [notice, setNotice] = useState(null)
  const [saving, setSaving] = useState(false)
  const [hasOperation, setHasOperation] = useState(false)
  const operation = useRef(null)
  const busy = useRef(false)

  useEffect(() => {
    let active = true
    loadScoreCatalogs(demo).then(data => { if (active) setCatalogs(data) })
      .catch(error => { if (active) setLoadError(error.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [demo, reload])

  function change(event) {
    const { name, value } = event.target
    setForm(current => ({ ...current, [name]: value }))
    setErrors({})
    setNotice(null)
  }

  async function submit(event) {
    event.preventDefault()
    if (busy.current || loading || loadError) return
    const validation = validateScore(form, catalogs.players, catalogs.games)
    setErrors(validation)
    if (Object.keys(validation).length) {
      document.getElementById(`score-${Object.keys(validation)[0]}`)?.focus()
      return
    }
    busy.current = true
    setSaving(true)
    setNotice(null)
    try {
      // Mientras haya una operacion pendiente los campos quedan bloqueados: retry usa el mismo body.
      if (!operation.current) operation.current = startScoreOperation({
        ID_jugador: Number(form.player), ID_videojuego: Number(form.game), puntuacion: Number(form.score),
      }, demo)
      setHasOperation(true)
      const result = await operation.current.submit()
      if (!demo && !Number.isInteger(result?.data?.ID)) throw new Error('No se pudo confirmar el resultado del registro.')
      setNotice({ success: true, text: demo
        ? 'Puntuación preparada correctamente en modo demostración. No se guardó ni se sincronizará con MySQL.'
        : 'Puntuación registrada correctamente.' })
      operation.current = null
      setHasOperation(false)
      setForm(empty)
    } catch (error) {
      setNotice({ success: false, text: error.status === 422 ? 'El jugador o videojuego seleccionado ya no existe.' : error.message })
    } finally {
      busy.current = false
      setSaving(false)
    }
  }

  function newOperation() {
    operation.current = null
    setHasOperation(false)
    setNotice(null)
    setErrors({})
  }

  const locked = saving || hasOperation
  return <section className="module-panel player-registration score-registration" aria-labelledby="score-title">
    <p className="eyebrow">{demo ? '' : 'REGISTRO DE PUNTUACIONES'}</p>
    <h1 id="score-title">Registrar puntuación</h1>
    <p>Registra el resultado obtenido por un jugador en un videojuego.</p>
    {loading ? <p role="status">Cargando jugadores y videojuegos…</p> : loadError ? <div className="auth-error" role="alert">
      <p>{loadError}</p><button type="button" className="auth-primary" onClick={() => { setLoading(true); setLoadError(''); setReload(value => value + 1) }}>Reintentar carga</button>
    </div> : <form onSubmit={submit} noValidate>
      <label htmlFor="score-player">Jugador *</label>
      <select id="score-player" name="player" value={form.player} onChange={change} disabled={locked} aria-invalid={Boolean(errors.player)} aria-describedby={errors.player ? 'score-player-error' : undefined}>
        <option value="">Seleccionar jugador</option>
        {catalogs.players.map(player => <option key={player.ID} value={player.ID}>{player.nombre} - {player.gamertag}</option>)}
      </select>
      {errors.player && <p id="score-player-error" className="player-field-error">{errors.player}</p>}
      <label htmlFor="score-game">Videojuego *</label>
      <select id="score-game" name="game" value={form.game} onChange={change} disabled={locked} aria-invalid={Boolean(errors.game)} aria-describedby={errors.game ? 'score-game-error' : undefined}>
        <option value="">Seleccionar videojuego</option>
        {catalogs.games.map(game => <option key={game.ID} value={game.ID}>{game.nombre}</option>)}
      </select>
      {errors.game && <p id="score-game-error" className="player-field-error">{errors.game}</p>}
      <label htmlFor="score-score">Puntuación *</label>
      <input id="score-score" name="score" inputMode="numeric" value={form.score} onChange={change} readOnly={locked} aria-invalid={Boolean(errors.score)} aria-describedby={errors.score ? 'score-value-error' : undefined} />
      {errors.score && <p id="score-value-error" className="player-field-error">{errors.score}</p>}
      {(!catalogs.players.length || !catalogs.games.length) && <p className="demo-note">Necesitas jugadores y videojuegos registrados para continuar.</p>}
      {notice && <div role={notice.success ? 'status' : 'alert'} className={notice.success ? 'player-success' : 'auth-error'}>{notice.text}</div>}
      <button className="auth-primary" disabled={saving || !catalogs.players.length || !catalogs.games.length}>{saving ? 'Registrando…' : hasOperation ? 'Reintentar la misma puntuación' : 'Registrar puntuación'}</button>
      {hasOperation && !saving && <>
        <p className="demo-note">El registro anterior podría haberse guardado. Reintentar conserva la misma clave. Inicia otro únicamente si deseas una operación diferente.</p>
        <button type="button" className="login-button" onClick={newOperation}>Iniciar otra operación</button>
      </>}
    </form>}
  </section>
}
