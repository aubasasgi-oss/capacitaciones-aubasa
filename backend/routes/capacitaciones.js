const express = require('express')
const jwt = require('jsonwebtoken')
const { leerHoja, actualizarFila, agregarFilaVacia, obtenerColumnas, eliminarFila } = require('../sheets')
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

// Normaliza columnas: minusculas, sin tildes, sin espacios extra
function norm(s) {
  return (s || '').trim().toLowerCase()
    .replace(/[áàä]/g, 'a').replace(/[éèë]/g, 'e')
    .replace(/[íìï]/g, 'i').replace(/[óòö]/g, 'o')
    .replace(/[úùü]/g, 'u').replace(/ñ/g, 'n')
}

// Convierte indice 0-based a letra de columna (0=A, 1=B, 25=Z, 26=AA ...)
function colLetra(idx) {
  let s = ''
  idx++
  while (idx > 0) {
    const r = (idx - 1) % 26
    s = String.fromCharCode(65 + r) + s
    idx = Math.floor((idx - 1) / 26)
  }
  return s
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

// Nueva capacitacion — estrategia: insertar fila, obtener su rowIndex, luego escribir celda a celda
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { apellidoNombre, legajo, puesto, baseOperativa, tema, categoria, fechaProgramacion, hoja: hojaBody } = req.body
    const hoja = hojaBody || req.user.sector

    if (!hoja) return res.status(400).json({ error: 'Falta el sector/hoja' })

    // 1. Obtener columnas del sheet
    const headers = await obtenerColumnas(hoja)
    console.log(`[nueva] hoja=${hoja} headers=`, headers)

    // 2. Insertar fila placeholder y obtener su rowIndex
    const rowIndex = await agregarFilaVacia(hoja)
    if (!rowIndex) throw new Error('No se pudo determinar el rowIndex de la nueva fila')
    console.log(`[nueva] rowIndex=${rowIndex}`)

    // 3. Construir mapa campo->valor usando norm()
    const id = Math.random().toString(36).substring(2, 10)
    const campos = {
      'id capacitacion':       id,
      'id capacitaciones':     id,
      'fecha de programacion': fechaProgramacion || '',
      'legajo':                legajo || '',
      'apellido y nombre':     apellidoNombre || '',
      'sector':                hoja,
      'puesto':                puesto || '',
      'base operativa':        baseOperativa || '',
      'tema a capacitar':      tema || '',
      'categoria':             categoria || '',
      'estado':                'Capacitacion Programada',
    }

    // 4. Para cada header, si tiene valor en campos → escribirlo
    const updates = {}
    headers.forEach((h, idx) => {
      const key = norm(h)
      if (campos[key] !== undefined && campos[key] !== '') {
        updates[colLetra(idx)] = campos[key]
      }
    })
    console.log(`[nueva] updates=`, updates)

    // 5. Escribir todas las celdas de la nueva fila
    await actualizarFila(hoja, rowIndex, updates)
    res.json({ ok: true, rowIndex })
  } catch (err) {
    console.error('[nueva] error:', err)
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
