import ExcelJS from 'exceljs'

// Robust CSV parser (handles quoted commas/newlines + escaped quotes)
export function parseCSV(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false

  // normalize newlines
  const input = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  for (let i = 0; i < input.length; i++) {
    const char = input[i]

    if (char === '"') {
      // If we're inside quotes and the next char is also a quote, that's an escaped quote
      if (inQuotes && input[i + 1] === '"') {
        field += '"'
        i++ // skip the next quote
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === ',' && !inQuotes) {
      row.push(field)
      field = ''
      continue
    }

    if (char === '\n' && !inQuotes) {
      row.push(field)
      field = ''
      // push row if it has any content
      if (row.length > 1 || (row.length === 1 && row[0].trim() !== '')) {
        rows.push(row)
      }
      row = []
      continue
    }

    field += char
  }

  // flush last field/row
  row.push(field)
  if (row.length > 1 || (row.length === 1 && row[0].trim() !== '')) {
    rows.push(row)
  }

  if (!rows.length) {
    throw new Error('CSV appears to be empty.')
  }

  const headers = rows[0].map((h) => String(h ?? '').trim())
  if (!headers.length || headers.every((h) => !h)) {
    throw new Error('CSV is missing a valid header row.')
  }

  const dataRows = rows.slice(1).map((values) => {
    const obj = {}
    headers.forEach((header, index) => {
      const raw = values[index]
      // keep empty as null to match your existing behavior
      obj[header] = raw === undefined || raw === null || String(raw).trim() === '' ? null : String(raw).trim()
    })
    return obj
  })

  return { headers, rows: dataRows }
}

export function parseJSON(text) {
  const data = JSON.parse(text)
  if (Array.isArray(data) && data.length > 0) {
    const headers = Object.keys(data[0])
    return { headers, rows: data }
  }
  throw new Error('Invalid JSON format. Expected an array of objects.')
}

export async function parseExcel(arrayBuffer) {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(arrayBuffer)
  const worksheet = workbook.worksheets[0]

  if (!worksheet) {
    throw new Error('Excel file is empty or has no worksheet.')
  }

  const headerRow = worksheet.getRow(1)
  const headers = headerRow.values
    .slice(1)
    .map((value) => String(value ?? '').trim())

  if (!headers.length || headers.every((header) => !header)) {
    throw new Error('Excel file is missing a valid header row.')
  }

  const rows = []
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return

    const rowData = {}
    headers.forEach((header, index) => {
      const cell = row.getCell(index + 1).value

      if (cell === null || cell === undefined) {
        rowData[header] = ''
        return
      }

      if (typeof cell === 'object') {
        if ('text' in cell && cell.text) {
          rowData[header] = cell.text
          return
        }
        if ('result' in cell && cell.result !== undefined && cell.result !== null) {
          rowData[header] = String(cell.result)
          return
        }
      }

      rowData[header] = String(cell)
    })

    rows.push(rowData)
  })

  if (!rows.length) {
    throw new Error('Excel file is empty or has no usable rows.')
  }

  return { headers, rows }
}