const express = require('express')
const cors = require('cors')
const path = require('path')
require('dotenv').config()

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/auth', require('./routes/auth'))
app.use('/api/capacitaciones', require('./routes/capacitaciones'))

const distPath = path.join(__dirname, '../frontend/dist')
app.use(express.static(distPath))
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => console.log(`Capacitaciones backend en puerto ${PORT}`))
