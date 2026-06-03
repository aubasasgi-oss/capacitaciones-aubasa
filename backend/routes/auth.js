const express = require('express')
const jwt = require('jsonwebtoken')
const { leerHoja } = require('../sheets')
const router = express.Router()

// Mapeo para corregir nombres de sector que no coinciden exactamente con la pestaña del sheet
const SECTOR_ALIASES = {
  'SVIA': 'SVIA Operaciones'
}

router.post('/login', async (req, res) => {
  try {
    const { sector, password } = req.body
    const usuarios = await leerHoja('Login')
    const user = usuarios.find(
      u => u.ROLE === sector && String(u.PASSWORD) === String(password)
    )
    if (!user) return res.status(401).json({ error: 'Sector o contraseña incorrectos' })

    const sectorNormalizado = SECTOR_ALIASES[user.SECTOR] || user.SECTOR

    const token = jwt.sign(
      { sector: sectorNormalizado, role: user.ROLE, hoja: sectorNormalizado },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    )
    res.json({ token, sector: sectorNormalizado, role: user.ROLE })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al conectar con Google Sheets' })
  }
})

module.exports = router
