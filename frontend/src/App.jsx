
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
  const [selectedOperations, setSelectedOperations] = useState([])
  const [previewData, setPreviewData] = useState(null)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState('')
  const [previewNotice, setPreviewNotice] = useState('')

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
  // Set of markers that indicate missing values in the dataset 
  const missingMarkers = new Set(['', 'na', 'n/a', 'nan', 'null', 'none', 'undefined', '-', '--'])

  // Helper function to determine if a value should be considered missing
  const isMissingValue = (value) => {
    if (value === null || value === undefined) return true
    const normalized = String(value).trim().toLowerCase()
    return missingMarkers.has(normalized)
  }
  // Helper function to convert a value to a numeric type if possible, otherwise return null
  const toNumeric = (value) => {
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (isMissingValue(value)) return null
    const parsed = Number(String(value).replace(/,/g, '').trim())
    return Number.isFinite(parsed) ? parsed : null
  }
  // Function to find the most frequent non-missing value in an array, used for filling missing categorical data
  const getMostFrequentValue = (values) => {
    const countMap = new Map()
    let bestValue = values[0]
    let bestCount = 0
    // Count occurrences of each value, ignoring case and whitespace
    values.forEach((value) => {
      const key = String(value).trim().toLowerCase()
      const current = countMap.get(key) || { count: 0, value }
      const next = { count: current.count + 1, value: current.value }
      countMap.set(key, next)
      if (next.count > bestCount) {
        bestCount = next.count
        bestValue = next.value
      }
    })

    return bestValue
  }
  // Function to fill missing numeric values with the mean of the column
  const applyLocalFillMissingMean = (rows, headers) => {
    const nextRows = rows.map((row) => ({ ...row }))
    headers.forEach((header) => {
      const numericValues = nextRows
        .map((row) => toNumeric(row[header]))
        .filter((value) => value !== null)

      if (!numericValues.length) 
        return
      // Calculate the mean of the numeric values in the column
      const mean = numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length
      // Fill missing values with the calculated mean, rounded to 2 decimal places
      nextRows.forEach((row) => {
        if (isMissingValue(row[header])) {
          row[header] = Number(mean.toFixed(2))
        }
      })
    })

    return nextRows
  }
  // Function to fill missing numeric values with the median of the column
  const applyLocalFillMissingMedian = (rows, headers) => {
    const nextRows = rows.map((row) => ({ ...row }))
    headers.forEach((header) => {
      const numericValues = nextRows
        .map((row) => toNumeric(row[header]))
        .filter((value) => value !== null)
        .sort((a, b) => a - b)
      // Calculate the median of the numeric values in the column
      if (!numericValues.length) return

      const mid = Math.floor(numericValues.length / 2)
      const median =
        numericValues.length % 2 === 0
          ? (numericValues[mid - 1] + numericValues[mid]) / 2
          : numericValues[mid]
      // Fill missing values with the calculated median, rounded to 2 decimal places
      nextRows.forEach((row) => {
        if (isMissingValue(row[header])) {
          row[header] = Number(median.toFixed(2))
        }
      })
    })

    return nextRows
  }
  // Function to fill any remaining missing values with 'Unknown' for categorical data or
  //  the mean for numeric data, based on the non-missing values in the column
  const applyLocalFillRemainingMissing = (rows, headers) => {
    const nextRows = rows.map((row) => ({ ...row }))

    // For each column, determine the appropriate replacement for missing values
    // based on the non-missing data
    headers.forEach((header) => {
      const nonMissingValues = nextRows
        .map((row) => row[header])
        .filter((value) => !isMissingValue(value))

      // Default replacement is 'Unknown' for categorical data, 
      // but if all non-missing values are numeric, use the mean instead
      let replacement = 'Unknown'

      // Check if there are any non-missing values to determine the replacement strategy
      if (nonMissingValues.length > 0) {
        const numericValues = nonMissingValues
          .map((value) => toNumeric(value))
          .filter((value) => value !== null)
        // If all non-missing values are numeric, calculate the mean for replacement
        if (numericValues.length === nonMissingValues.length) {
          const mean = numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length
          replacement = Number(mean.toFixed(2))
        } else {
          replacement = getMostFrequentValue(nonMissingValues)
        }
      }
      // Fill any remaining missing values in the column with the determined replacement
      nextRows.forEach((row) => {
        if (isMissingValue(row[header])) {
          row[header] = replacement
        }
      })
    })

    return nextRows
  }

  // Function to apply selected cleaning operations locally in the browser as a fallback if 
  // backend preview fails
  const applyLocalOperations = (headers, rows, operations) => {
    let cleanedRows = rows.map((row) => ({ ...row }))
    // Apply operations in a logical order: mean/median filling first
    if (operations.includes('fill-missing-mean') || operations.includes('value-prediction')) {
      cleanedRows = applyLocalFillMissingMean(cleanedRows, headers)
    }
    // Median filling is applied after mean filling to handle any remaining missing values,
    if (operations.includes('fill-missing-median') || operations.includes('estimates-values')) {
      cleanedRows = applyLocalFillMissingMedian(cleanedRows, headers)
    }
    // fill any remaining missing values with 'Unknown' or mean based on the column data type
    cleanedRows = applyLocalFillRemainingMissing(cleanedRows, headers)

    return cleanedRows
  }

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
      if (data.headers?.length && data.rows?.length) {
        const cleanedStats = calculateStats(data.headers, data.rows)
        setRawData({ headers: data.headers, rows: data.rows })
        setHealthScore(cleanedStats.health)
        setMissingColumns(cleanedStats.missingData)
        setAllMissingColumns(cleanedStats.allMissing)
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
        if (!isMissingValue(value)) {
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
    if (!nextFile) 
      return

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
      setPreviewError('')
      setPreviewNotice('')
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

  const toggleOperation = (operationId) => {
    setSelectedOperations((prev) =>
      prev.includes(operationId)
        ? prev.filter((id) => id !== operationId)
        : [...prev, operationId]
    )
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
