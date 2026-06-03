const { google } = require('googleapis')
const path = require('path')

const SPREADSHEET_ID = process.env.SPREADSHEET_ID

function getAuth() {
  if (process.env.GOOGLE_CREDENTIALS_JSON) {
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON)
    return new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    })
  }
  return new google.auth.GoogleAuth({
    keyFile: path.resolve(process.env.GOOGLE_CREDENTIALS_PATH || './credentials.json'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  })
}

async function getSheets() {
  const auth = getAuth()
  return google.sheets({ version: 'v4', auth })
}

async function leerHoja(nombre) {
  const sheets = await getSheets()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${nombre}!A:Z`
  })
  const rows = res.data.values || []
  if (rows.length < 2) return []
  const headers = rows[0]
  return rows.slice(1).map((row, i) => {
    const obj = { _rowIndex: i + 2 }
    headers.forEach((h, j) => { obj[h] = row[j] || '' })
    return obj
  })
}

async function actualizarFila(hoja, rowIndex, columnas) {
  const sheets = await getSheets()
  for (const [col, value] of Object.entries(columnas)) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${hoja}!${col}${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[value]] }
    })
  }
}

// Agrega una fila vacia y retorna su numero de fila (rowIndex)
async function agregarFilaVacia(hoja) {
  const sheets = await getSheets()
  const res = await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${hoja}!A:A`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [['_placeholder_']] }
  })
  // El rango actualizado viene como "Hoja!A123:A123" — extraemos 123
  const updatedRange = res.data.updates.updatedRange
  const match = updatedRange.match(/:?[A-Z]+(\d+)$/)
  return match ? parseInt(match[1]) : null
}

async function obtenerColumnas(hoja) {
  const sheets = await getSheets()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${hoja}!1:1`
  })
  return res.data.values ? res.data.values[0] : []
}

async function eliminarFila(hoja, rowIndex) {
  const sheets = await getSheets()
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID })
  const sheet = spreadsheet.data.sheets.find(s => s.properties.title === hoja)
  if (!sheet) throw new Error(`Hoja "${hoja}" no encontrada`)
  const sheetId = sheet.properties.sheetId
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId,
            dimension: 'ROWS',
            startIndex: rowIndex - 1,
            endIndex: rowIndex
          }
        }
      }]
    }
  })
}

module.exports = { leerHoja, actualizarFila, agregarFilaVacia, obtenerColumnas, eliminarFila }
