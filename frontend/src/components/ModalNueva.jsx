import React, { useState, useEffect } from 'react'
import axios from 'axios'

const TODAS_LAS_HOJAS = [
  'SGI','Operaciones','Asistencia Vial','Centro de Monitoreo',
  'Compras','Recursos Humanos','Sistemas','Comercial',
  'Seguridad Patrimonial','Legales','RRII','Taller Mecanico',
  'Mantenimiento','SVIA Operaciones'
]

const hdrs = () => ({ Authorization: `Bearer ${localStorage.getItem('cap_token')}` })

export default function ModalNueva({ onClose, onConfirm, hojaDefault }) {
  const esSGI = localStorage.getItem('cap_role') === 'GAU'
  const sectorInicial = hojaDefault || localStorage.getItem('cap_sector') || ''

  const [hoja, setHoja] = useState(sectorInicial)
  const [form, setForm] = useState({
    apellidoNombre: '',
    legajo: '',
    puesto: '',
    baseOperativa: '',
    tema: '',
    categoria: '',
    fechaProgramacion: new Date().toISOString().split('T')[0]
  })
  const [personal, setPersonal] = useState([])
  const [temas, setTemas] = useState([])

  const esOperaciones = hoja === 'Operaciones'

  useEffect(() => {
    if (!esOperaciones) return
    axios.get('/api/capacitaciones/personal', { headers: hdrs() }).then(r => setPersonal(r.data)).catch(() => {})
    axios.get('/api/capacitaciones/temas', { headers: hdrs() }).then(r => setTemas(r.data)).catch(() => {})
  }, [esOperaciones])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function handlePersonaChange(e) {
    const p = personal.find(x => x['ID Personal'] === e.target.value)
    if (p) setForm(f => ({ ...f,
      apellidoNombre: p['Apellido y Nombre'] || '',
      legajo:         p['Legajo'] || '',
      puesto:         p['Puesto'] || '',
      baseOperativa:  p['Base Operativa'] || ''
    }))
    else setForm(f => ({ ...f, apellidoNombre: '', legajo: '', puesto: '', baseOperativa: '' }))
  }

  function handleTemaChange(e) {
    const t = temas.find(x => x['ID Capacitaciones'] === e.target.value)
    if (t) setForm(f => ({ ...f, tema: t['Tema a capacitar'] || '', categoria: t['Categoria'] || '' }))
    else setForm(f => ({ ...f, tema: '', categoria: '' }))
  }

  function submit(e) {
    e.preventDefault()
    onConfirm({ ...form, hoja })
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>+ Nueva Capacitacion Programada</h3>
        <form onSubmit={submit}>

          {esSGI && (
            <div className="form-group">
              <label>Sector</label>
              <select value={hoja} onChange={e => setHoja(e.target.value)} required>
                <option value="">— Seleccionar sector —</option>
                {TODAS_LAS_HOJAS.map(s => (<option key={s} value={s}>{s}</option>))}
              </select>
            </div>
          )}

          {esOperaciones ? (
            <>
              <div className="form-group">
                <label>Persona</label>
                <select onChange={handlePersonaChange} defaultValue="">
                  <option value="">— Seleccionar persona —</option>
                  {personal.map(p => (
                    <option key={p['ID Personal']} value={p['ID Personal']}>{p['Apellido y Nombre']}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label>Apellido y Nombre</label>
                  <input value={form.apellidoNombre} readOnly style={{ background: '#f5f5f5' }} />
                </div>
                <div className="form-group">
                  <label>Legajo</label>
                  <input value={form.legajo} readOnly style={{ background: '#f5f5f5' }} />
                </div>
                <div className="form-group">
                  <label>Puesto</label>
                  <input value={form.puesto} readOnly style={{ background: '#f5f5f5' }} />
                </div>
                <div className="form-group">
                  <label>Base Operativa</label>
                  <input value={form.baseOperativa} readOnly style={{ background: '#f5f5f5' }} />
                </div>
              </div>
              <div className="form-group">
                <label>Capacitacion</label>
                <select onChange={handleTemaChange} defaultValue="">
                  <option value="">— Seleccionar capacitacion —</option>
                  {temas.map(t => (
                    <option key={t['ID Capacitaciones']} value={t['ID Capacitaciones']}>{t['Tema a capacitar']}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label>Tema</label>
                  <input value={form.tema} readOnly style={{ background: '#f5f5f5' }} />
                </div>
                <div className="form-group">
                  <label>Categoria</label>
                  <input value={form.categoria} readOnly style={{ background: '#f5f5f5' }} />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label>Apellido y Nombre</label>
                <input value={form.apellidoNombre} onChange={e => set('apellidoNombre', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Legajo</label>
                <input value={form.legajo} onChange={e => set('legajo', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Puesto</label>
                <input value={form.puesto} onChange={e => set('puesto', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Base Operativa</label>
                <input value={form.baseOperativa} onChange={e => set('baseOperativa', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Tema a Capacitar</label>
                <input value={form.tema} onChange={e => set('tema', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Categoria</label>
                <input value={form.categoria} onChange={e => set('categoria', e.target.value)} />
              </div>
            </>
          )}

          <div className="form-group">
            <label>Fecha Programada</label>
            <input type="date" value={form.fechaProgramacion} onChange={e => set('fechaProgramacion', e.target.value)} required />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  )
}
