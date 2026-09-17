import { useEffect, useState } from 'react'
import Estadisticas from '../estadisticas/Estadisticas.jsx'
import { obtenerJugadores } from '../api/jugadoresApi.js'
import { formatPlayerDate } from '../jugadores/consultaService.js'
import '../puntuaciones/ConsultaPuntuaciones.css'
import './Dashboard.css'

export default function Dashboard({ user }) {
  const admin = user?.role === 'Administrador'
  const allowed = admin || user?.role === 'Superadministrador'
  const [state, setState] = useState({ loading: true, rows: [] })
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    if (!admin) return
    let active = true
    obtenerJugadores({ page: 1, limit: 5 }).then(result => {
      if (active) setState({ rows: result.data })
    }).catch(error => { if (active) setState({ rows: [], error: error.message }) })
    return () => { active = false }
  }, [admin, retry])

  if (!allowed) return null
  return <div className="dashboard-page">
    <header className="dashboard-heading">
      <p className="eyebrow">{admin ? 'ADMIN' : 'SUPER ADMIN'} — INICIO</p>
      <h1>Bienvenido, {user.name}</h1>
      <p>Consulta el resumen del torneo y los registros más recientes.</p>
    </header>
    <Estadisticas dashboard />
    <section className="module-panel" aria-labelledby="recent-title">
      <h2 id="recent-title">Últimos {admin ? 'jugadores' : 'administradores'} registrados</h2>
      {!admin && <p role="status">La consulta de administradores estará disponible cuando el servidor permita obtener sus datos y fecha de registro.</p>}
      {admin && state.loading && <p role="status">Cargando jugadores…</p>}
      {admin && state.error && <div className="auth-error" role="alert"><p>{state.error}</p>
        <button className="login-button" onClick={() => { setState({ rows: [], loading: true }); setRetry(value => value + 1) }}>Reintentar</button></div>}
      {admin && !state.loading && !state.error && !state.rows.length && <p role="status">Todavía no hay jugadores registrados.</p>}
      <div className="scores-table-scroll"><table className="scores-table">
        <thead><tr><th>{admin ? 'Nombre / Gamertag' : 'Nombre'}</th><th>Correo</th><th>Fecha de registro</th></tr></thead>
        <tbody>{admin && state.rows.map(player => <tr key={player.ID}>
          <td><strong>{player.nombre}</strong><small>{player.gamertag}</small></td>
          <td>{player.correo}</td><td>{formatPlayerDate(player.fecha_registro)}</td>
        </tr>)}</tbody>
      </table></div>
    </section>
  </div>
}
