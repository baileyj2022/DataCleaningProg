
import { useState } from 'react'
import * as XLSX from 'xlsx'
import './App.css'

function App() {
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [healthScore, setHealthScore] = useState(null)
  const [missingColumns, setMissingColumns] = useState([])
  const [uploadMessage, setUploadMessage] = useState('')


  const parseCSV = (text) => {
    const lines = text.trim().split('\n')
    const headers = lines[0].split(',').map((h) => h.trim())
    const rows = lines.slice(1).map((line) => {
      const values = line.split(',').map((v) => v.trim())
      return headers.reduce((obj, header, index) => {
        obj[header] = values[index] || null
        return obj
      }, {})
    })
    return { headers, rows }
  }

  const parseJSON = (text) => {
    const data = JSON.parse(text)
    if (Array.isArray(data) && data.length > 0) {
      const headers = Object.keys(data[0])
      return { headers, rows: data }
    }
    throw new Error('Invalid JSON format. Expected an array of objects.')
  }

  const parseExcel = (arrayBuffer) => {
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })
    if (!rows.length) {
      throw new Error('Excel file is empty or has no usable rows.')
    }
    const headers = Object.keys(rows[0])
    return { headers, rows }
  }

  const calculateStats = (headers, rows) => {
    const totalCells = headers.length * rows.length
    let filledCells = 0
    const columnMissing = {}

    headers.forEach((header) => {
      columnMissing[header] = 0
    })
    
    rows.forEach((row) => {
      headers.forEach((header) => {
        const value = row[header]
        if (value !== null && value !== undefined && value !== '') {
          filledCells++
        } else {
          columnMissing[header]++
        }
      })
    })

    const health = totalCells > 0 ? Math.round((filledCells / totalCells) * 100) : 0

    const colors = ['var(--accent-blue)', 'var(--accent-amber)', 'var(--accent-rose)', 'var(--accent-green)']
    const missingData = headers
      .map((header, index) => ({
        label: header,
        value: rows.length > 0 ? Math.round((columnMissing[header] / rows.length) * 100) : 0,
        color: colors[index % colors.length],
      }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)

    return { health, missingData }
  }

  const handleFiles = async (files) => {
    const nextFile = files && files[0]
    if (!nextFile) return

    setSelectedFile(nextFile)
    setUploadMessage('')

    try {
      const fileName = nextFile.name.toLowerCase()
      let parsed

      if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) {
        setHealthScore(null)
        setMissingColumns([])
        setUploadMessage('Image received. Image analysis is not supported yet.')
        return
      }

      if (fileName.endsWith('.csv')) {
        const text = await nextFile.text()
        parsed = parseCSV(text)
      } else if (fileName.endsWith('.json')) {
        const text = await nextFile.text()
        parsed = parseJSON(text)
      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        const buffer = await nextFile.arrayBuffer()
        parsed = parseExcel(buffer)
      } else {
        throw new Error('Unsupported file type. Please upload CSV, JSON, or Excel.')
      }

      const stats = calculateStats(parsed.headers, parsed.rows)
      setHealthScore(stats.health)
      setMissingColumns(stats.missingData)
    } catch (error) {
      console.error('Error parsing file:', error)
      alert(`Error: ${error.message}`)
      setHealthScore(null)
      setMissingColumns([])
      setUploadMessage('')
    }
  }

  const onDrop = (event) => {
    event.preventDefault()
    setIsDragOver(false)
    handleFiles(event.dataTransfer.files)
  }

  const onDragOver = (event) => {
    event.preventDefault()
    setIsDragOver(true)
  }

  const onDragLeave = () => {
    setIsDragOver(false)
  }

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <p className="eyebrow">Automated Data Cleaner</p>
          <h1>Automated Data Cleaner</h1>
        </div>
      </header>

      <main className="dashboard">
        <section className="panel ingestion">
          <div className="panel-header">
            <h2>Data Ingestion</h2>
          </div>
          <div
            className={`dropzone ${isDragOver ? 'is-active' : ''}`}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            role="button"
            tabIndex={0}
          >
            <div className="dropzone-icon" aria-hidden="true">
              <span />
            </div>
            <p>Drag & Drop your CSV/ JSON/ Excel/ JPEG files here</p>
            <span>or Browse Files on Your Device</span>
            <input
              type="file"
              accept=".csv,.json,.xlsx,.xls,.jpg,.jpeg"
              onChange={(event) => handleFiles(event.target.files)}
            />
          </div>
          <div className="file-meta">
            <p>{selectedFile ? selectedFile.name : 'No file selected'}</p>
            <span>{selectedFile ? `${Math.round(selectedFile.size / 1024)} KB` : 'Waiting for upload'}</span>
          </div>
          {uploadMessage && <p className="file-note">{uploadMessage}</p>}
        </section>

        <section className="panel health">
          <div className="panel-header">
            <h2>Health Score</h2>
          </div>
          <div className="score-block">
            <div className="score-stack">
              <span className="score">{healthScore !== null ? `${healthScore}%` : '--'}</span>
              {healthScore === null && <span className="example-tag">Upload data to see score</span>}
            </div>
            <p>Overall data quality and completeness</p>
          </div>
          <div className="panel-note">
            This score reflects the percentage of complete, valid data entries.
          </div>
          <div className="sparkline" aria-hidden="true" />
        </section>

        <section className="panel missing">
          <div className="panel-header">
            <h2>Missing Values by Column</h2>
          </div>
          <div className="bars">
            {missingColumns.length > 0 ? (
              missingColumns.map((item) => (
                <div className="bar-row" key={item.label}>
                  <span className="label-with-tag">{item.label}</span>
                  <div className="bar">
                    <div className="bar-fill" style={{ width: `${item.value}%`, background: item.color }} />
                  </div>
                  <strong>{item.value}%</strong>
                </div>
              ))
            ) : (
              <p className="empty-state">Upload a file to see missing values analysis</p>
            )}
          </div>
        </section>

        
      </main>

      {}
    </div>
  )
}

export default App
