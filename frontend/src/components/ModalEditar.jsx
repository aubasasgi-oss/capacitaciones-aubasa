import React, { useState, useEffect } from 'react'
import axios from 'axios'

const hdrs = () => ({ Authorization: `Bearer ${localStorage.getItem('cap_token')}` })

export default function ModalEditar({ cap, onClose, onConfirm }) {
  const [form, setForm] = useState({
    'Apellido y Nombre':       cap['Apellido y Nombre'] || '',
    'Legajo':                  cap['Legajo'] || '',
    'Puesto':                  cap['Puesto'] || '',
    'Base Operativa':          cap['Base Operativa'] || '',
    'Tema a capacitar':        cap['Tema a capacitar'] || '',
    'Categoria':               cap['Categoria'] || '',
    'Fecha de Programacion':   cap['Fecha de Programacion'] ? String(cap['Fecha de Programacion']).split('T')[0] : '',
    'Fecha de Reprogramacion': cap['Fecha de Reprogramacion'] ? String(cap['Fecha de Reprogramacion']).split('T')[0] : '',
  })
  const [personal, setPersonal] = useState([])
  const [temas, setTemas] = useState([])
  const esOperaciones = cap['_hoja'] === 'Operaciones'

  useEffect(() => {
    if (!esOperaciones) return
    axios.get('/api/capacitaciones/personal', { headers: hdrs() }).then(r => setPersonal(r.data)).catch(() => {})
    axios.get('/api/capacitaciones/temas', { headers: hdrs() }).then(r => setTemas(r.data)).catch(() => {})
  }, [])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function handlePersonaChange(e) {
    const p = personal.find(x => x['ID Personal'] === e.target.value)
    if (p) setForm(f => ({ ...f,
      'Apellido y Nombre': p['Apellido y Nombre'] || '',
      'Legajo':            p['Legajo'] || '',
      'Puesto':            p['Puesto'] || '',
      'Base Operativa':    p['Base Operativa'] || ''
    }))
  }

  function handleTemaChange(e) {
    const t = temas.find(x => x['ID Capacitaciones'] === e.target.value)
    if (t) setForm(f => ({ ...f,
      'Tema a capacitar': t['Tema a capacitar'] || '',
      'Categoria':        t['Categoria'] || ''
    }))
  }

  function submit(e) {
    e.preventDefault()
    onConfirm(cap._rowIndex, cap._hoja, form)
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Editar Capacitacion</h3>
        <form onSubmit={submit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {esOperaciones ? (
              <>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Cambiar persona</label>
                  <select onChange={handlePersonaChange} defaultValue="">
                    <option value="">Seleccionar persona</option>
                    {personal.map(p => (
                      <option key={p['ID Personal']} value={p['ID Personal']}>{p['Apellido y Nombre']}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group"><label>Apellido y Nombre</label><input value={form['Apellido y Nombre']} readOnly style={{ background: '#f5f5f5' }} /></div>
                <div className="form-group"><label>Legajo</label><input value={form['Legajo']} readOnly style={{ background: '#f5f5f5' }} /></div>
                <div className="form-group"><label>Puesto</label><input value={form['Puesto']} readOnly style={{ background: '#f5f5f5' }} /></div>
                <div className="form-group"><label>Base Operativa</label><input value={form['Base Operativa']} readOnly style={{ background: '#f5f5f5' }} /></div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Cambiar capacitacion</label>
                  <select onChange={handleTemaChange} defaultValue="">
                    <option value="">Seleccionar capacitacion</option>
                    {temas.map(t => (
                      <option key={t['ID Capacitaciones']} value={t['ID Capacitaciones']}>{t['Tema a capacitar']}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group"><label>Tema a Capacitar</label><input value={form['Tema a capacitar']} readOnly style={{ background: '#f5f5f5' }} /></div>
                <div className="form-group"><label>Categoria</label><input value={form['Categoria']} readOnly style={{ background: '#f5f5f5' }} /></div>
              </>
            ) : (
              <>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>Apellido y Nombre</label><input value={form['Apellido y Nombre']} onChange={e => set('Apellido y Nombre', e.target.value)} /></div>
                <div className="form-group"><label>Legajo</label><input value={form['Legajo']} onChange={e => set('Legajo', e.target.value)} /></div>
                <div className="form-group"><label>Puesto</label><input value={form['Puesto']} onChange={e => set('Puesto', e.target.value)} /></div>
                <div className="form-group"><label>Base Operativa</label><input value={form['Base Operativa']} onChange={e => set('Base Operativa', e.target.value)} /></div>
                <div className="form-group"><label>Categoria</label><input value={form['Categoria']} onChange={e => set('Categoria', e.target.value)} /></div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>Tema a Capacitar</label><input value={form['Tema a capacitar']} onChange={e => set('Tema a capacitar', e.target.value)} /></div>
              </>
            )}
            <div className="form-group"><label>Fecha Programada</label><input type="date" value={form['Fecha de Programacion']} onChange={e => set('Fecha de Programacion', e.target.value)} /></div>
            <div className="form-group"><label>Fecha Reprogramada</label><input type="date" value={form['Fecha de Reprogramacion']} onChange={e => set('Fecha de Reprogramacion', e.target.value)} /></div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Guardar cambios</button>
          </div>
        </form>
      </div>
    </div>
  )
}
