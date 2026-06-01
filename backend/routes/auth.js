const express = require('express')
const jwt = require('jsonwebtoken')
const { leerHoja } = require('../sheets')
const router = express.Router()

router.post('/login', async (req, res) => {
  try {
    const { sector, password } = req.body
    const usuarios = await leerHoja('Login')
    const user = usuarios.find(
      u => u.ROLE === sector && String(u.PASSWORD) === String(password)
    )
    if (!user) return res.status(401).json({ error: 'Sector o contraseña incorrectos' })

    const token = jwt.sign(
      { sector: user.SECTOR, role: user.ROLE, hoja: user.SECTOR },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    )
    res.json({ token, sector: user.SECTOR, role: user.ROLE })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al conectar con Google Sheets' })
  }
})

module.exports = router
