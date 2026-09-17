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

  </div>
}
