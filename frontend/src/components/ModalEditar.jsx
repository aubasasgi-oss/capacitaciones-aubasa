import React, { useState } from 'react'

export default function ModalEditar({ cap, onClose, onConfirm }) {
  const [form, setForm] = useState({
    'Apellido y Nombre': cap['Apellido y Nombre'] || '',
    'Legajo':            cap['Legajo'] || '',
    'Puesto':            cap['Puesto'] || '',
    'Base Operativa':    cap['Base Operativa'] || '',
    'Tema a capacitar':  cap['Tema a capacitar'] || '',
    'Categoria':         cap['Categoria'] || '',
    'Fecha de Programacion': cap['Fecha de Programacion']
      ? String(cap['Fecha de Programacion']).split('T')[0] : '',
    'Fecha de Reprogramacion': cap['Fecha de Reprogramacion']
      ? String(cap['Fecha de Reprogramacion']).split('T')[0] : '',
  })

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function submit(e) {
    e.preventDefault()
    onConfirm(cap._rowIndex, cap._hoja, form)
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>✏️ Editar Capacitación</h3>
        <form onSubmit={submit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Apellido y Nombre</label>
              <input value={form['Apellido y Nombre']} onChange={e => set('Apellido y Nombre', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Legajo</label>
              <input value={form['Legajo']} onChange={e => set('Legajo', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Puesto</label>
              <input value={form['Puesto']} onChange={e => set('Puesto', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Base Operativa</label>
              <input value={form['Base Operativa']} onChange={e => set('Base Operativa', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Categoría</label>
              <input value={form['Categoria']} onChange={e => set('Categoria', e.target.value)} />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Tema a Capacitar</label>
              <input value={form['Tema a capacitar']} onChange={e => set('Tema a capacitar', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Fecha Programada</label>
              <input type="date" value={form['Fecha de Programacion']} onChange={e => set('Fecha de Programacion', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Fecha Reprogramada</label>
              <input type="date" value={form['Fecha de Reprogramacion']} onChange={e => set('Fecha de Reprogramacion', e.target.value)} />
            </div>
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
