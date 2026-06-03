const express = require('express')
const jwt = require('jsonwebtoken')
const { leerHoja, actualizarFila, agregarFila, obtenerColumnas, eliminarFila } = require('../sheets')
const router = express.Router()

const TODAS_LAS_HOJAS = [
  'SGI', 'Operaciones', 'Asistencia Vial', 'CCM',
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
    res.status(401).json({ error: 'Token invalido' })
  }
}

// Normaliza un string: minusculas, sin tildes, sin espacios extra
function norm(s) {
  return (s || '').trim().toLowerCase()
    .replace(/[áàä]/g, 'a').replace(/[éèë]/g, 'e')
    .replace(/[íìï]/g, 'i').replace(/[óòö]/g, 'o')
    .replace(/[úùü]/g, 'u').replace(/ñ/g, 'n')
}

// Personal de Operaciones para desplegables
router.get('/personal', authMiddleware, async (req, res) => {
  try {
    const rows = await leerHoja('Personal Operaciones')
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// Temas de Operaciones para desplegables
router.get('/temas', authMiddleware, async (req, res) => {
  try {
    const rows = await leerHoja('Capacitaciones Operaciones')
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// Listar capacitaciones
router.get('/', authMiddleware, async (req, res) => {
  try {
    const esSGI = req.user.role === 'GAU'
    if (esSGI) {
      const resultados = await Promise.allSettled(
        TODAS_LAS_HOJAS.map(async (hoja) => {
          try {
            const rows = await leerHoja(hoja)
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
    const rows = await leerHoja(req.user.sector)
    res.json(rows.map(r => ({ ...r, _hoja: req.user.sector })))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error leyendo sheet: ' + err.message })
  }
})

// Editar campos
router.put('/:rowIndex/editar', authMiddleware, async (req, res) => {
  try {
    const { rowIndex } = req.params
    const { hoja: hojaBody, campos } = req.body
    const hoja = hojaBody || req.user.sector
    const headers = await obtenerColumnas(hoja)
    const colLetra = (idx) => String.fromCharCode(65 + idx)
    const updates = {}
    for (const [nombreColumna, valor] of Object.entries(campos)) {
      const idx = headers.findIndex(h => norm(h) === norm(nombreColumna))
      if (idx >= 0) updates[colLetra(idx)] = valor
    }
    await actualizarFila(hoja, rowIndex, updates)
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// Marcar como realizado
router.put('/:rowIndex/realizar', authMiddleware, async (req, res) => {
  try {
    const { rowIndex } = req.params
    const { evaluacion, fechaRealizacion, hoja: hojaBody } = req.body
    const hoja = hojaBody || req.user.sector
    const headers = await obtenerColumnas(hoja)
    const colLetra = (idx) => String.fromCharCode(65 + idx)
    const iEstado = headers.findIndex(h => norm(h) === 'estado')
    const iEval   = headers.findIndex(h => norm(h) === 'evaluacion')
    const iFecha  = headers.findIndex(h => norm(h) === 'fecha de realizacion')
    const updates = {}
    if (iEstado >= 0) updates[colLetra(iEstado)] = 'Capacitacion Realizada'
    if (iEval   >= 0 && evaluacion !== undefined) updates[colLetra(iEval)] = evaluacion
    if (iFecha  >= 0 && fechaRealizacion) updates[colLetra(iFecha)] = fechaRealizacion
    await actualizarFila(hoja, rowIndex, updates)
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// Nueva capacitacion
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { apellidoNombre, legajo, puesto, baseOperativa, tema, categoria, fechaProgramacion, hoja: hojaBody } = req.body
    const hoja = hojaBody || req.user.sector
    const headers = await obtenerColumnas(hoja)

    // Log para debug
    console.log('Nueva cap en hoja:', hoja)
    console.log('Columnas encontradas:', headers)

    const id = Math.random().toString(36).substring(2, 10)

    const fila = headers.map(h => {
      const n = norm(h)
      if (n === 'id capacitacion' || n === 'id capacitaciones') return id
      if (n === 'fecha de programacion')  return fechaProgramacion || ''
      if (n === 'legajo')                 return legajo || ''
      if (n === 'apellido y nombre')      return apellidoNombre || ''
      if (n === 'sector')                 return hoja
      if (n === 'puesto')                 return puesto || ''
      if (n === 'base operativa')         return baseOperativa || ''
      if (n === 'tema a capacitar')       return tema || ''
      if (n === 'categoria')              return categoria || ''
      if (n === 'estado')                 return 'Capacitacion Programada'
      return ''
    })

    console.log('Fila a insertar:', fila)
    await agregarFila(hoja, fila)
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// Borrar capacitacion — solo SGI (GAU)
router.delete('/:rowIndex', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'GAU') return res.status(403).json({ error: 'Sin permiso para borrar' })
    const { rowIndex } = req.params
    const { hoja } = req.body
    if (!hoja) return res.status(400).json({ error: 'Falta el campo hoja' })
    await eliminarFila(hoja, parseInt(rowIndex))
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
