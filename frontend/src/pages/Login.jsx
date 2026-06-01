import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const SECTORES = [
  { label: 'Compras', value: 'GCO' },
  { label: 'Recursos Humanos', value: 'RRHH' },
  { label: 'Sistemas', value: 'GS' },
  { label: 'Operaciones', value: 'GO' },
  { label: 'Comercial', value: 'GC' },
  { label: 'Centro de Monitoreo', value: 'CCM' },
  { label: 'Asistencia Vial', value: 'AV' },
  { label: 'Seguridad Patrimonial', value: 'SP' },
  { label: 'Legales', value: 'GAL' },
  { label: 'RRII', value: 'RRI' },
  { label: 'Taller Mecanico', value: 'TM' },
  { label: 'Mantenimiento', value: 'GM' },
  { label: 'SGI', value: 'GAU' },
  { label: 'SVIA Operaciones', value: 'SVO' },
]

export default function Login() {
  const [sector, setSector] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await axios.post('/api/auth/login', { sector, password })
      localStorage.setItem('cap_token', data.token)
      localStorage.setItem('cap_sector', data.sector)
      localStorage.setItem('cap_role', data.role)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)' }}>
      <div className="card" style={{ width: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🎓</div>
          <h2 style={{ color: '#1976d2', fontSize: 22 }}>AUBASA</h2>
          <p style={{ color: '#666', fontSize: 14 }}>Sistema de Capacitaciones</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Sector</label>
            <select value={sector} onChange={e => setSector(e.target.value)} required>
              <option value="">-- Seleccionar sector --</option>
              {SECTORES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Ingresá tu contraseña"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8, padding: '11px' }} disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
