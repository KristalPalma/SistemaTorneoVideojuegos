import { useEffect, useRef, useState } from 'react'
import { resolveRoute } from '../auth/routes.js'
import { obtenerAdministradores, actualizarAdministrador, eliminarAdministrador } from '../api/administradoresApi.js'
import { administradoresContrato } from '../api/administradoresContrato.js'
import RegistroAdministrador from './RegistroAdministrador.jsx'
import '../jugadores/ConsultaJugadores.css'

function AccionAdministrador({ account, action, onCancel, onSuccess }) {
  const [form, setForm] = useState({ nombre: account.nombre, correo: account.correo })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const pending = useRef(false)
  const focus = useRef(null)
  const deleting = action === 'delete'
  const contract = administradoresContrato[deleting ? 'remove' : 'update']
  useEffect(() => { focus.current?.focus() }, [])
  async function submit(event) {
    event.preventDefault()
    if (pending.current || !contract) return
    pending.current = true; setSaving(true); setError('')
    try {
      if (deleting) await eliminarAdministrador(account.id)
      else await actualizarAdministrador(account.id, form)
      onSuccess()
    } catch (error) {
      setError(error.status === 409 ? 'La cuenta entra en conflicto con otros datos. Revisa el correo o las restricciones de eliminación.' : error.message)
    } finally { pending.current = false; setSaving(false) }
  }
  return <section className={deleting ? 'player-delete-panel' : 'module-panel player-registration'} aria-busy={saving}>
    <h2 tabIndex={-1} ref={focus}>{deleting ? '¿Eliminar administrador?' : 'Editar administrador'}</h2>
    <p>{account.nombre} — {account.correo}</p>
    {!contract && <p role="status">Esta operación todavía no está disponible en el servidor.</p>}
    <form onSubmit={submit}>
      {deleting ? <p>Confirma que deseas eliminar esta cuenta. Esta acción no se puede deshacer.</p> :
        ['nombre', 'correo'].map(field => <div key={field}>
          <label htmlFor={`edit-admin-${field}`}>{field === 'nombre' ? 'Nombre' : 'Correo electrónico'}</label>
          <input id={`edit-admin-${field}`} type={field === 'correo' ? 'email' : 'text'} required
            maxLength={field === 'correo' ? 150 : 100} value={form[field]}
            readOnly={saving || !contract?.fields?.includes(field)}
            onChange={event => setForm(current => ({ ...current, [field]: event.target.value }))} />
        </div>)}
      {error && <p role="alert" className="auth-error">{error}</p>}
      <div className="player-actions">
        <button className="login-button" type="button" disabled={saving} onClick={onCancel}>Cancelar</button>
        <button className={`login-button ${deleting ? 'player-delete' : ''}`} disabled={saving || !contract}>
          {saving ? 'Procesando…' : deleting ? 'Eliminar' : 'Guardar cambios'}</button>
      </div>
    </form>
  </section>
}

export default function GestionAdministradores({ user }) {
  const allowed = Boolean(resolveRoute('/superadmin/administradores', user).route)
  const [state, setState] = useState({ loading: true, rows: [] })
  const [retry, setRetry] = useState(0)
  const [text, setText] = useState('')
  const [page, setPage] = useState(1)
  const [panel, setPanel] = useState(null)
  const [notice, setNotice] = useState('')
  const trigger = useRef(null)
  const heading = useRef(null)
  useEffect(() => {
    if (!allowed) return
    const controller = new AbortController()
    obtenerAdministradores(controller.signal).then(rows => {
      if (!controller.signal.aborted) setState({ rows })
    }).catch(error => {
      if (!controller.signal.aborted) setState({ rows: [], error: error.message })
    })
    return () => controller.abort()
  }, [allowed, retry])
  function reload() { setState({ loading: true, rows: [] }); setRetry(value => value + 1) }
  function open(action, account, event) { trigger.current = event.currentTarget; setNotice(''); setPanel({ action, account }) }
  function close() {
    setPanel(null)
    requestAnimationFrame(() => { if (trigger.current?.isConnected) trigger.current.focus(); else heading.current?.focus() })
  }
  function complete() {
    setNotice(panel.action === 'create' ? 'Administrador creado correctamente.' : panel.action === 'delete' ? 'Administrador eliminado correctamente.' : 'Administrador actualizado correctamente.')
    close(); setPage(1); reload()
  }
  if (!allowed) return null
  if (panel?.action === 'create') return <RegistroAdministrador user={user} onCancel={close} onSuccess={complete} />
  const normalize = value => value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const rows = state.rows.filter(account => normalize(`${account.nombre} ${account.correo}`).includes(normalize(text)))
  return <section className="module-panel player-consultation" aria-labelledby="admins-title">
    <div className="players-heading"><h1 id="admins-title" tabIndex={-1} ref={heading}>Administradores</h1>
      <button className="login-button" disabled={Boolean(panel)} onClick={event => open('create', null, event)}>+ Registrar administrador</button></div>
    <p>Gestiona las cuentas de administradores del sistema.</p>
    {notice && <p className="players-feedback" role="status">{notice}</p>}
    {panel && <div className="player-management-panel"><AccionAdministrador key={`${panel.action}-${panel.account.id}`}
      account={panel.account} action={panel.action} onCancel={close} onSuccess={complete} /></div>}
    <div className="player-search"><label htmlFor="admin-search">Buscar por nombre o correo</label>
      <input id="admin-search" type="search" placeholder="Buscar administrador…" value={text} disabled={Boolean(panel)}
        onChange={event => { setText(event.target.value); setPage(1) }} /></div>
    {state.loading ? <p role="status">Cargando administradores…</p> : state.error ? <div className="auth-error" role="alert">
      <p>{state.error}</p><button className="login-button" disabled={Boolean(panel)} onClick={reload}>Reintentar consulta</button></div> :
      !rows.length ? <p role="status">{text ? 'No se encontraron coincidencias.' : 'No hay administradores registrados.'}</p> :
        <ul className="player-list">{rows.slice((page - 1) * 20, page * 20).map(account => <li key={account.id}>
          <div><strong>{account.nombre}</strong><p>{account.correo}</p></div>
          <div className="player-actions">
            <button className="login-button" disabled={Boolean(panel)} onClick={event => open('edit', account, event)}>Editar</button>
            <button className="login-button player-delete" disabled={Boolean(panel)} onClick={event => open('delete', account, event)}>Eliminar</button>
          </div></li>)}</ul>}
    <nav className="player-pagination" aria-label="Páginas de administradores">
      <button className="login-button" disabled={Boolean(panel) || state.loading || page === 1} onClick={() => setPage(value => value - 1)}>Anterior</button>
      <span>Página {page}</span>
      <button className="login-button" disabled={Boolean(panel) || state.loading || page * 20 >= rows.length} onClick={() => setPage(value => value + 1)}>Siguiente</button>
    </nav>
  </section>
}
