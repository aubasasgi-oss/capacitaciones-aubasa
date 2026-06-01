import React, { useState } from 'react'

export default function ModalNueva({ onClose, onConfirm }) {
  const [form, setForm] = useState({
    apellidoNombre: '',
    legajo: '',
    puesto: '',
    baseOperativa: '',
    tema: '',
    categoria: '',
    fechaProgramacion: new Date().toISOString().split('T')[0]
  })

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function submit(e) {
    e.preventDefault()
    onConfirm(form)
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>+ Nueva Capacitación Programada</h3>
        <form onSubmit={submit}>
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
            <label>Categoría</label>
            <input value={form.categoria} onChange={e => set('categoria', e.target.value)} />
          </div>
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
