
import { useMemo, useState } from 'react'
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import ExcelJS from 'exceljs'
import './App.css'

function App() {
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [healthScore, setHealthScore] = useState(null)
  const [missingColumns, setMissingColumns] = useState([])
  const [allMissingColumns, setAllMissingColumns] = useState([])
  const [showAllColumns, setShowAllColumns] = useState(false)
  const [rawData, setRawData] = useState({ headers: [], rows: [] })
  const [uploadMessage, setUploadMessage] = useState('')

  const previewColumns = useMemo(() => {
    const previewColumnHelper = createColumnHelper()
    return rawData.headers.map((header) =>
      previewColumnHelper.accessor((row) => row?.[header] ?? '', {
        id: header,
        header: () => header,
        cell: (info) => String(info.getValue() ?? ''),
      }),
    )
  }, [rawData.headers])

  const previewRows = useMemo(() => rawData.rows.slice(0, 10), [rawData.rows])

  const previewTable = useReactTable({
    data: previewRows,
    columns: previewColumns,
    getCoreRowModel: getCoreRowModel(),
  })

// Parsing functions for CSV, JSON, and Excel files
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

  const parseExcel = async (arrayBuffer) => {
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
// Function to calculate health score and missing values statistics
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
    const allMissing = headers
      .map((header, index) => ({
        label: header,
        value: rows.length > 0 ? Math.round((columnMissing[header] / rows.length) * 100) : 0,
        color: colors[index % colors.length],
      }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value)

    const missingData = allMissing.slice(0, 5)

    return { health, missingData, allMissing }
  }
  
// Main function to handle file uploads and trigger parsing and analysis
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
        setAllMissingColumns([])
        setShowAllColumns(false)
        setRawData({ headers: [], rows: [] })
        setUploadMessage('Image received. Image analysis is not supported yet.')
        return
      }
      // parsing logic for CSV, JSON, Excel files
      if (fileName.endsWith('.csv')) {
        const text = await nextFile.text()
        parsed = parseCSV(text)
      } else if (fileName.endsWith('.json')) {
        const text = await nextFile.text()
        parsed = parseJSON(text)
      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        const buffer = await nextFile.arrayBuffer()
        parsed = await parseExcel(buffer)
      } else {
        throw new Error('Unsupported file type. Please upload CSV, JSON, or Excel.')
      }

      const stats = calculateStats(parsed.headers, parsed.rows)
      setHealthScore(stats.health)
      setMissingColumns(stats.missingData)
      setAllMissingColumns(stats.allMissing)
      setShowAllColumns(false)
      setRawData(parsed)
    } catch (error) {
      console.error('Error parsing file:', error)
      alert(`Error: ${error.message}`)
      setHealthScore(null)
      setMissingColumns([])
      setAllMissingColumns([])
      setShowAllColumns(false)
      setRawData({ headers: [], rows: [] })
      setUploadMessage('')
    }
  }
// Drag-and-drop event handlers
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
            {(showAllColumns ? allMissingColumns : missingColumns).length > 0 ? (
              (showAllColumns ? allMissingColumns : missingColumns).map((item) => (
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
          {allMissingColumns.length > 5 && (
            <button className="view-all-btn" onClick={() => setShowAllColumns(!showAllColumns)}>
              {showAllColumns ? 'Show Top 5 Columns' : 'View All Columns'}
            </button>
          )}
          <div className="panel-note">
            This analysis identifies which columns have the most missing data, helping you prioritize cleaning efforts.
          </div>
          
      
        </section>
      </main>

      {}
    </div>
  )
}

export default App
