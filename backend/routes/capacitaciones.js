const express = require('express')
const jwt = require('jsonwebtoken')
const { leerHoja, actualizarFila, agregarFila, obtenerColumnas } = require('../sheets')
const router = express.Router()

// Hojas que SGI puede ver (todas)
const TODAS_LAS_HOJAS = [
  'SGI', 'Operaciones', 'Asistencia Vial', 'Centro de Monitoreo',
  'Compras', 'Recursos Humanos', 'Sistemas', 'Comercial',
  'Seguridad Patrimonial', 'Legales', 'RRII', 'Taller Mecanico',
  'Mantenimiento', 'SVIA Operaciones'
]

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Sin token' })
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Token inválido' })
  }
}

// Listar capacitaciones
router.get('/', authMiddleware, async (req, res) => {
  try {
    const esSGI = req.user.role === 'GAU'

    if (esSGI) {
      // SGI lee todas las hojas en paralelo
      const resultados = await Promise.allSettled(
        TODAS_LAS_HOJAS.map(async (hoja) => {
          try {
            const rows = await leerHoja(hoja)
            // Agrega el campo _hoja para saber de dónde viene cada fila
            return rows.map(r => ({ ...r, _hoja: hoja }))
          } catch {
            return []
          }
        })
      )
      const todas = resultados
        .filter(r => r.status === 'fulfilled')
        .flatMap(r => r.value)
      return res.json(todas)
    }

    // Sector normal: solo su hoja
    const rows = await leerHoja(req.user.sector)
    res.json(rows.map(r => ({ ...r, _hoja: req.user.sector })))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error leyendo sheet: ' + err.message })
  }
})

// Editar campos de una capacitación
router.put('/:rowIndex/editar', authMiddleware, async (req, res) => {
  try {
    const { rowIndex } = req.params
    const { hoja: hojaBody, campos } = req.body
    const hoja = hojaBody || req.user.sector

    const headers = await obtenerColumnas(hoja)
    const colLetra = (idx) => String.fromCharCode(65 + idx)

    const updates = {}
    for (const [nombreColumna, valor] of Object.entries(campos)) {
      const idx = headers.indexOf(nombreColumna)
      if (idx >= 0) updates[colLetra(idx)] = valor
    }

    await actualizarFila(hoja, rowIndex, updates)
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// Marcar como realizado — recibe _hoja en el body para SGI
router.put('/:rowIndex/realizar', authMiddleware, async (req, res) => {
  try {
    const { rowIndex } = req.params
    const { evaluacion, fechaRealizacion, hoja: hojaBody } = req.body
    const hoja = hojaBody || req.user.sector

    const headers = await obtenerColumnas(hoja)
    const colLetra = (idx) => String.fromCharCode(65 + idx)

    const iEstado = headers.indexOf('Estado')
    const iEval = headers.indexOf('Evaluacion')
    const iFecha = headers.indexOf('Fecha de Realizacion')

    const updates = {}
    if (iEstado >= 0) updates[colLetra(iEstado)] = 'Capacitación Realizada'
    if (iEval >= 0 && evaluacion !== undefined) updates[colLetra(iEval)] = evaluacion
    if (iFecha >= 0 && fechaRealizacion) updates[colLetra(iFecha)] = fechaRealizacion

    await actualizarFila(hoja, rowIndex, updates)
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// Nueva capacitación programada
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { apellidoNombre, legajo, puesto, baseOperativa, tema, categoria, fechaProgramacion, hoja: hojaBody } = req.body
    const hoja = hojaBody || req.user.sector
    const headers = await obtenerColumnas(hoja)

    const id = Math.random().toString(36).substring(2, 10)
    const fila = headers.map(h => {
      if (h === 'Id Capacitacion') return id
      if (h === 'Fecha de Programacion') return fechaProgramacion || ''
      if (h === 'Legajo') return legajo || ''
      if (h === 'Apellido y Nombre') return apellidoNombre || ''
      if (h === 'Sector') return hoja
      if (h === 'Puesto') return puesto || ''
      if (h === 'Base Operativa') return baseOperativa || ''
      if (h === 'Tema a capacitar') return tema || ''
      if (h === 'Categoria') return categoria || ''
      if (h === 'Estado') return 'Capacitación Programada'
      return ''
    })

    await agregarFila(hoja, fila)
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
