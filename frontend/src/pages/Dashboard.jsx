import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import ModalRealizar from '../components/ModalRealizar'
import ModalNueva from '../components/ModalNueva'

export default function Dashboard() {
  const [capacitaciones, setCapacitaciones] = useState([])
  const [tab, setTab] = useState('programadas')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalRealizar, setModalRealizar] = useState(null)
  const [modalNueva, setModalNueva] = useState(false)
  const [msg, setMsg] = useState('')
  const [filtroPersna, setFiltroPersna] = useState('')
  const [filtroTema, setFiltroTema] = useState('')
  const [filtroDesde, setFiltroDesde] = useState('')
  const [filtroHasta, setFiltroHasta] = useState('')
  const sector = localStorage.getItem('cap_sector')
  const navigate = useNavigate()
  const token = localStorage.getItem('cap_token')
  const headers = { Authorization: `Bearer ${token}` }

  async function cargar() {
    setLoading(true)
    setError('')
    try {
      const { data } = await axios.get('/api/capacitaciones', { headers })
      setCapacitaciones(data)
    } catch (err) {
      setError(err.response?.data?.error || 'Error cargando datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  function logout() {
    localStorage.removeItem('cap_token')
    localStorage.removeItem('cap_sector')
    navigate('/login')
  }

  async function handleRealizar(rowIndex, evaluacion, fechaRealizacion) {
    try {
      await axios.put(`/api/capacitaciones/${rowIndex}/realizar`, { evaluacion, fechaRealizacion }, { headers })
      setMsg('Capacitación marcada como realizada')
      setModalRealizar(null)
      cargar()
      setTimeout(() => setMsg(''), 3000)
    } catch (err) {
      alert(err.response?.data?.error || 'Error al actualizar')
    }
  }

  async function handleNueva(datos) {
    try {
      await axios.post('/api/capacitaciones', datos, { headers })
      setMsg('Capacitación programada correctamente')
      setModalNueva(false)
      cargar()
      setTimeout(() => setMsg(''), 3000)
    } catch (err) {
      alert(err.response?.data?.error || 'Error al guardar')
    }
  }

  function limpiarFiltros() {
    setFiltroPersna('')
    setFiltroTema('')
    setFiltroDesde('')
    setFiltroHasta('')
  }

  const programadas = capacitaciones.filter(c => c['Estado']?.toLowerCase().includes('programad'))
  const realizadas = capacitaciones.filter(c => c['Estado']?.toLowerCase().includes('realizad'))
  const base = tab === 'programadas' ? programadas : realizadas

  const lista = base.filter(c => {
    const nombre = (c['Apellido y Nombre'] || '').toLowerCase()
    const tema = (c['Tema a capacitar'] || '').toLowerCase()
    const fechaStr = c['Fecha de Programacion'] ? String(c['Fecha de Programacion']).split('T')[0] : ''

    if (filtroPersna && !nombre.includes(filtroPersna.toLowerCase())) return false
    if (filtroTema && !tema.includes(filtroTema.toLowerCase())) return false
    if (filtroDesde && fechaStr && fechaStr < filtroDesde) return false
    if (filtroHasta && fechaStr && fechaStr > filtroHasta) return false
    return true
  })

  const hayFiltros = filtroPersna || filtroTema || filtroDesde || filtroHasta

  return (
    <div>
      <div className="topbar">
        <h1>🎓 Capacitaciones — {sector}</h1>
        <button className="btn btn-outline" style={{ color: 'white', borderColor: 'white' }} onClick={logout}>
          Salir
        </button>
      </div>

      <div style={{ padding: '24px 28px' }}>
        {msg && <div className="alert alert-success">{msg}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        {/* Filtros */}
        <div className="card" style={{ marginBottom: 16, padding: '16px 20px' }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 180px' }}>
              <label>Buscar persona</label>
              <input
                placeholder="Apellido o nombre..."
                value={filtroPersna}
                onChange={e => setFiltroPersna(e.target.value)}
              />
            </div>
            <div style={{ flex: '1 1 180px' }}>
              <label>Buscar capacitación</label>
              <input
                placeholder="Tema..."
                value={filtroTema}
                onChange={e => setFiltroTema(e.target.value)}
              />
            </div>
            <div style={{ flex: '1 1 140px' }}>
              <label>Fecha desde</label>
              <input type="date" value={filtroDesde} onChange={e => setFiltroDesde(e.target.value)} />
            </div>
            <div style={{ flex: '1 1 140px' }}>
              <label>Fecha hasta</label>
              <input type="date" value={filtroHasta} onChange={e => setFiltroHasta(e.target.value)} />
            </div>
            {hayFiltros && (
              <button className="btn btn-outline" onClick={limpiarFiltros} style={{ marginBottom: 1 }}>
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div className="tabs">
            <button className={`tab ${tab === 'programadas' ? 'active' : ''}`} onClick={() => setTab('programadas')}>
              Programadas ({programadas.length})
            </button>
            <button className={`tab ${tab === 'realizadas' ? 'active' : ''}`} onClick={() => setTab('realizadas')}>
              Realizadas ({realizadas.length})
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {hayFiltros && (
              <span style={{ fontSize: 13, color: '#666' }}>
                Mostrando {lista.length} de {base.length}
              </span>
            )}
            <button className="btn btn-success" onClick={() => setModalNueva(true)}>
              + Nueva capacitación
            </button>
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'auto' }}>
          {loading ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#888' }}>Cargando datos del Sheet...</div>
          ) : lista.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#888' }}>
              {hayFiltros ? 'No hay resultados para los filtros aplicados' : `No hay capacitaciones ${tab === 'programadas' ? 'programadas' : 'realizadas'}`}
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Apellido y Nombre</th>
                  <th>Legajo</th>
                  <th>Puesto</th>
                  <th>Base Operativa</th>
                  <th>Tema a Capacitar</th>
                  <th>Categoría</th>
                  <th>Fecha Prog.</th>
                  {tab === 'realizadas' && <><th>Evaluación</th><th>Fecha Real.</th></>}
                  <th>Estado</th>
                  {tab === 'programadas' && <th>Acción</th>}
                </tr>
              </thead>
              <tbody>
                {lista.map((c, i) => (
                  <tr key={i}>
                    <td>{c['Apellido y Nombre']}</td>
                    <td>{c['Legajo']}</td>
                    <td>{c['Puesto']}</td>
                    <td>{c['Base Operativa']}</td>
                    <td>{c['Tema a capacitar']}</td>
                    <td>{c['Categoria']}</td>
                    <td>{c['Fecha de Programacion'] ? String(c['Fecha de Programacion']).split('T')[0] : ''}</td>
                    {tab === 'realizadas' && (
                      <>
                        <td><strong>{c['Evaluacion']}</strong></td>
                        <td>{c['Fecha de Realizacion'] ? String(c['Fecha de Realizacion']).split('T')[0] : ''}</td>
                      </>
                    )}
                    <td>
                      <span className={`badge ${tab === 'programadas' ? 'badge-programado' : 'badge-realizado'}`}>
                        {tab === 'programadas' ? 'Programada' : 'Realizada'}
                      </span>
                    </td>
                    {tab === 'programadas' && (
                      <td>
                        <button
                          className="btn btn-success"
                          style={{ padding: '5px 12px', fontSize: 12 }}
                          onClick={() => setModalRealizar(c)}
                        >
                          ✓ Marcar realizada
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modalRealizar && (
        <ModalRealizar
          cap={modalRealizar}
          onClose={() => setModalRealizar(null)}
          onConfirm={handleRealizar}
        />
      )}
      {modalNueva && (
        <ModalNueva
          onClose={() => setModalNueva(false)}
          onConfirm={handleNueva}
        />
      )}
    </div>
  )
}
