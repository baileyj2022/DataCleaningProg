
import { useMemo, useState } from 'react'
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { applyLocalOperations, calculateStats } from './components/dataCleaning'
import { parseCSV, parseJSON, parseExcel } from './components/parsers'
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
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [selectedOperations, setSelectedOperations] = useState([])
  const [previewData, setPreviewData] = useState(null)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState('')
  const [previewNotice, setPreviewNotice] = useState('')
  const [previewSummary, setPreviewSummary] = useState(null)
    const [exportMessage, setExportMessage] = useState('')
  const [lastExportName, setLastExportName] = useState('')

  const cleaningOperations = [
    {
      id: 'fill-missing-mean',
      label: 'Fill Missing (Mean)',
      description: 'Replace missing numeric values with column mean',
    },
    {
      id: 'fill-missing-median',
      label: 'Fill Missing (Median)',
      description: 'Replace missing numeric values with column median',
    },
    {
      id: 'value-prediction',
      label: 'Predict Missing Values',
      description: 'Predict missing values using machine learning models',
    },
    {
      id: 'estimates-values',
      label: 'Value Estimation',
      description: 'Estimate missing values based on correlations and patterns in the data',
    },
  ]
  
  
  // Function to fetch preview data from the backend after applying cleaning operations
  const fetchPreviewData = async () => {
    if (!rawData.headers.length || !rawData.rows.length) {
      setPreviewError('Please upload data first.')
      return
    }
    
    if (!selectedOperations.length) {
      setPreviewError('Please select at least one cleaning operation.')
      return
    }

    setIsPreviewLoading(true)
    setPreviewError('')
    setPreviewNotice('')
    setPreviewSummary(null)

    // Attempt to fetch cleaned preview data from the backend API
    try {
      const response = await fetch('http://localhost:8000/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          headers: rawData.headers,
          rows: rawData.rows,
          operations: selectedOperations,
        }),
      })

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.error) {
        setPreviewError(`Backend error: ${data.error}`)
        return
      }

      setPreviewData(data)
      // if the backend sent a summary, use it directly; otherwise compute local stats
      if (data.summary) {
        setPreviewSummary(data.summary)
        setRawData({ headers: data.headers, rows: data.rows })
        setHealthScore(data.summary.health)
        setMissingColumns(data.summary.missingData)
        setAllMissingColumns(data.summary.allMissing)
      } else if (data.headers?.length && data.rows?.length) {
        const cleanedStats = calculateStats(data.headers, data.rows)
        setRawData({ headers: data.headers, rows: data.rows })
        setHealthScore(cleanedStats.health)
        setMissingColumns(cleanedStats.missingData)
        setAllMissingColumns(cleanedStats.allMissing)
        setPreviewSummary(cleanedStats)
      }
      setPreviewNotice('Preview generated using backend API.')
    } catch (error) {
      console.error('Error fetching preview data:', error)
      // If backend preview fails, attempt to apply cleaning operations locally in the browser
      // as a fallback
      try {
        const fallbackRows = applyLocalOperations(rawData.headers, rawData.rows, selectedOperations)
        const fallbackResult = {
          headers: rawData.headers,
          rows: fallbackRows,
          operations_applied: selectedOperations,
          original_row_count: rawData.rows.length,
          preview_row_count: fallbackRows.length,
          source: 'frontend-fallback',
        }
        // Update the preview with the locally cleaned data as a fallback
        setPreviewData(fallbackResult)
        if (fallbackResult.headers.length && fallbackResult.rows.length) {
          const cleanedStats = calculateStats(fallbackResult.headers, fallbackResult.rows)
          setRawData({ headers: fallbackResult.headers, rows: fallbackResult.rows })
          setHealthScore(cleanedStats.health)
          setMissingColumns(cleanedStats.missingData)
          setAllMissingColumns(cleanedStats.allMissing)
          setPreviewSummary(cleanedStats)
        }
        // Set a notice to inform the user that the preview was generated using the local fallback method
        setPreviewNotice('Showing local preview generated in browser.')
      } catch (fallbackError) {
        setPreviewError(`Error fetching preview: ${fallbackError.message}`)
        console.error('Fallback preview failed:', fallbackError)
      }
    } finally {
      setIsPreviewLoading(false)
    }
  }
  // Function to prepare columns and rows for the data preview table
  // Use previewData if available, otherwise use rawData
  const displayData = previewData?.rows ? previewData : rawData
  const displayHeaders = previewData?.headers ? previewData.headers : rawData.headers

  // Create column definitions for the preview table based on the headers of the data
  const previewColumns = useMemo(() => {
    const previewColumnHelper = createColumnHelper()
    return displayHeaders.map((header) =>
      previewColumnHelper.accessor((row) => row?.[header] ?? '', {
        id: header,
        header: () => header,
        cell: (info) => String(info.getValue() ?? ''),
      }),
    )
  }, [displayHeaders])
  
  // Limit preview to first 10 rows for performance and readability
  const previewRows = useMemo(() => displayData.rows.slice(0, 10), [displayData.rows])

  // Create the table instance for rendering the data preview
  const previewTable = useReactTable({
    data: previewRows,
    columns: previewColumns,
    getCoreRowModel: getCoreRowModel(),
  })

  
// Main function to handle file uploads and trigger parsing and analysis
  const handleFiles = async (files) => {
    const nextFile = files && files[0]
    if (!nextFile) 
      return

    setUploadLoading(true)
    setUploadError('')
    setSelectedFile(nextFile)
    setUploadMessage('')
    // Reset previous state when a new file is uploaded
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
        setUploadLoading(false)
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
      // After successful parsing, calculate stats and update state accordingly
      const stats = calculateStats(parsed.headers, parsed.rows)
      setHealthScore(stats.health)
      setMissingColumns(stats.missingData)
      setAllMissingColumns(stats.allMissing)
      setShowAllColumns(false)
      setRawData(parsed)
      setPreviewData(null)
      setPreviewSummary(null)
      setPreviewError('')
      setPreviewNotice('')
      setUploadLoading(false)
    } catch (error) {
      console.error('Error parsing file:', error)
      setUploadError(error.message || 'Failed to process file.')
      setUploadMessage('')
      setHealthScore(null)
      setMissingColumns([])
      setAllMissingColumns([])
      setShowAllColumns(false)
      setRawData({ headers: [], rows: [] })
      setUploadLoading(false)
    }
  }
// Drag-and-drop event handlers
  const onDrop = (event) => {
    event.preventDefault()
    setIsDragOver(false)
    if (uploadLoading) return
    handleFiles(event.dataTransfer.files)
  }

  const onDragOver = (event) => {
    event.preventDefault()
    setIsDragOver(true)
  }

  const onDragLeave = () => {
    setIsDragOver(false)
  }

  const toggleOperation = (operationId) => {
    setSelectedOperations((prev) =>
      prev.includes(operationId)
        ? prev.filter((id) => id !== operationId)
        : [...prev, operationId]
    )
  }

    const getCleanedDataset = () => {
    // Prefer previewData when it exists, because that’s your cleaned output
    if (previewData?.headers?.length && previewData?.rows?.length) return previewData
    return null
  }

  const buildExportBaseName = () => {
    const original = selectedFile?.name || 'data'
    const base = original.replace(/\.[^/.]+$/, '') // remove extension
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-') // YYYY-MM-DD-HH-MM-SS
    return `${base}_cleaned_${timestamp}`
  }

  const escapeCsvCell = (value) => {
    const s = value === null || value === undefined ? '' : String(value)
    // Wrap in quotes if it contains comma, quote, or newline
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
  }

  const toCSV = (headers, rows) => {
    const headerLine = headers.map(escapeCsvCell).join(',')
    const lines = rows.map((row) => headers.map((h) => escapeCsvCell(row?.[h])).join(','))
    return [headerLine, ...lines].join('\n')
  }

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const handleExportCSV = () => {
    const cleaned = getCleanedDataset()
    if (!cleaned) {
      setExportMessage('Generate a cleaned preview first (click “Apply Smart Fixes”).')
      return
    }

    const baseName = buildExportBaseName()
    const csv = toCSV(cleaned.headers, cleaned.rows)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })

    downloadBlob(blob, `${baseName}.csv`)
    setLastExportName(`${baseName}.csv`)
    setExportMessage('Downloaded cleaned CSV successfully.')
  }

  const handleExportJSON = () => {
    const cleaned = getCleanedDataset()
    if (!cleaned) {
      setExportMessage('Generate a cleaned preview first (click “Apply Smart Fixes”).')
      return
    }

    const baseName = buildExportBaseName()
    const json = JSON.stringify(cleaned.rows, null, 2)
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' })

    downloadBlob(blob, `${baseName}.json`)
    setLastExportName(`${baseName}.json`)
    setExportMessage('Downloaded cleaned JSON successfully.')
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
              disabled={uploadLoading}
            />
          </div>
          <div className="file-meta">
            <p>{selectedFile ? selectedFile.name : 'No file selected'}</p>
            <span>{selectedFile ? `${Math.round(selectedFile.size / 1024)} KB` : 'Waiting for upload'}</span>
          </div>
          {uploadMessage && <p className="file-note">{uploadMessage}</p>}
          {uploadLoading && <div className="upload-loading">Processing file...</div>}
          {uploadError && <div className="upload-error">{uploadError}</div>}
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
              <p className="no-data">No missing values detected or no data uploaded yet.</p>
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
          {rawData.headers.length > 0 && (
            <div className="preview-subsection">
              <h3>Data Preview</h3>
              {isPreviewLoading && (
                <div className="preview-loading">Loading cleaned data...</div>
              )}
              {previewError && (
                <div className="preview-error">{previewError}</div>
              )}
              {previewNotice && !isPreviewLoading && (
                <div className="preview-loading">{previewNotice}</div>
              )}
              {previewData?.rows && !isPreviewLoading && (
                <div className="preview-success">
                  Preview of {previewData.rows.length} cleaned row{previewData.rows.length !== 1 ? 's' : ''}
                </div>
              )}

              {previewSummary && (
                <div className="summary-card">
                  <h4>Data Issue Summary</h4>
                  <p>
                    <strong>Health score:</strong> {previewSummary.health}%
                  </p>
                  {previewSummary.missingData && previewSummary.missingData.length > 0 && (
                    <div className="missing-list">
                      <strong>Top missing columns:</strong>
                      <ul>
                        {previewSummary.missingData.map((item) => (
                          <li key={item.label}>
                            {item.label}: {item.value}%
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="table-container">
                <table className="preview-table">
                  <thead>
                    {previewTable.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <th key={header.id}>{flexRender(header.column.columnDef.header, header.getContext())}</th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {previewTable.getRowModel().rows.map((row) => (
                      <tr key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
        {/* Export Panel - After Missing Values Section */}
{previewData?.rows?.length > 0 && (
  <section className="panel preview">
    <div className="panel-header">
      <h2>Export Cleaned File</h2>
<span className="badge">
  Cleaned dataset is ready for export. Choose your preferred format below.
</span>
    </div>

    <p className="subtle">
      Download your cleaned dataset as a modern export file. CSV is widely compatible, while JSON preserves complex structures. The exported file will include all applied cleaning operations and a timestamp in the filename for easy reference.
    </p>

    <div className="chip-grid">
      <div className="chip chip-blue">
        <strong>Rows</strong>
        <span>{previewData?.rows?.length}</span>
      </div>

      <div className="chip chip-green">
        <strong>Columns</strong>
        <span>{previewData?.headers?.length}</span>
      </div>

      <div className="chip chip-amber">
        <strong>Operations</strong>
        <span>{selectedOperations.length}</span>
      </div>
    </div>

    <div className="export-actions" style={{ marginTop: 16 }}>
      <button
        className="export-button"
        onClick={handleExportCSV}
      >
        Download CSV
      </button>

      <button
        className="export-button"
        onClick={handleExportJSON}
      >
        Download JSON
      </button>

      {lastExportName && (
        <div
          className="toast"
          onClick={() => navigator.clipboard?.writeText(lastExportName)}
        >
          Saved: <strong style={{ marginLeft: 6 }}>{lastExportName}</strong>
        </div>
      )}
    </div>

    {exportMessage && (
      <div className="preview-loading" style={{ marginTop: 12 }}>
        {exportMessage}
      </div>
    )}
  </section>
)}

        {rawData.headers.length > 0 && (
          <section className="panel cleaning-config">
            <div className="panel-header">
              <h2>Cleaning Configuration</h2>
            </div>
            <p className="config-description">Select cleaning operations to apply:</p>
            <div className="operations-list">
              {cleaningOperations.map((operation) => (
                <label key={operation.id} className="operation-item">
                  <input
                    type="checkbox"
                    checked={selectedOperations.includes(operation.id)}
                    onChange={() => toggleOperation(operation.id)}
                  />
                  <div className="operation-content">
                    <span className="operation-label">{operation.label}</span>
                    <span className="operation-description">{operation.description}</span>
                  </div>
                </label>
              ))}
            </div>
            {selectedOperations.length > 0 && (
              <div className="selected-operations-row">
                <div className="selected-count">
                  {selectedOperations.length} operation{selectedOperations.length !== 1 ? 's' : ''} selected
                </div>
                <button
                  className="generate-preview-btn"
                  onClick={() => fetchPreviewData()}
                  disabled={isPreviewLoading}
                >
                  {isPreviewLoading ? 'Generating...' : 'Apply Smart Fixes'}
                </button>
              </div>
            )}
          </section>
        )}
      </main>

      {}
    </div>
  )
}

export default App
