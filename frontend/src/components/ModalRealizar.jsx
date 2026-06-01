import React, { useState } from 'react'

export default function ModalRealizar({ cap, onClose, onConfirm }) {
  const [evaluacion, setEvaluacion] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])

  function submit(e) {
    e.preventDefault()
    onConfirm(cap._rowIndex, evaluacion, fecha)
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>✓ Marcar como Realizada</h3>
        <p style={{ marginBottom: 16, color: '#555', fontSize: 14 }}>
          <strong>{cap['Apellido y Nombre']}</strong> — {cap['Tema a capacitar']}
        </p>
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Nota / Evaluación</label>
            <input
              type="number"
              min="0" max="10"
              step="0.1"
              value={evaluacion}
              onChange={e => setEvaluacion(e.target.value)}
              placeholder="ej: 8.5"
              required
            />
          </div>
          <div className="form-group">
            <label>Fecha de Realización</label>
            <input
              type="date"
              value={fecha}
              onChange={e => setFecha(e.target.value)}
              required
            />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-success">Confirmar</button>
          </div>
        </form>
      </div>
    </div>
  )
}
