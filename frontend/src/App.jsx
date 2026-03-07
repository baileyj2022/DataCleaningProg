import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Toaster, toast } from 'react-hot-toast'
import { applyLocalOperations, calculateStats } from './components/dataCleaning'
import { UploadScreen } from './screens/UploadScreen'
import { ConfigureScreen } from './screens/ConfigureScreen'
import { PreviewScreen } from './screens/PreviewScreen'
import { ExportScreen } from './screens/ExportScreen'
import './App.css'

function App() {
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [healthScore, setHealthScore] = useState(null)
  const [ , setMissingColumns] = useState([])
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

  const fetchPreviewData = async () => {
    if (!rawData.headers.length || !rawData.rows.length) {
      setPreviewError('Please upload data first.')
      toast.error('Please upload data first.')
      return
    }
    
    if (!selectedOperations.length) {
      setPreviewError('Please select at least one cleaning operation.')
      toast.error('Please select at least one cleaning operation.')
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
        toast.error(`Cleaning failed: ${data.error}`)
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
      toast.success('Cleaning completed successfully.')
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
        toast.success('Cleaning completed successfully, seen in preview.')
      } catch (fallbackError) {
        setPreviewError(`Error fetching preview: ${fallbackError.message}`)
        toast.error(`Cleaning failed: ${fallbackError.message}`)
        console.error('Fallback preview failed:', fallbackError)
      }
    } finally {
      setIsPreviewLoading(false)
    }
  }

  const toggleOperation = (operationId) => {
    setSelectedOperations((prev) =>
      prev.includes(operationId) ? prev.filter((id) => id !== operationId) : [...prev, operationId]
    )
  }

  const getCleanedDataset = () => {
    if (previewData?.headers?.length && previewData?.rows?.length) return previewData
    return null
  }

  const buildExportBaseName = () => {
    const original = selectedFile?.name || 'data'
    const base = original.replace(/\.[^/.]+$/, '')
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
    return `${base}_cleaned_${timestamp}`
  }

  const escapeCsvCell = (value) => {
    const s = value === null || value === undefined ? '' : String(value)

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
    toast.success('Downloaded cleaned CSV successfully.')
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
    toast.success('Downloaded cleaned JSON successfully.')
  }

  return (
    <div className="app">
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      <Routes>
        <Route
          path="/"
          element={
            <UploadScreen
              selectedFile={selectedFile}
              setSelectedFile={setSelectedFile}
              isDragOver={isDragOver}
              setIsDragOver={setIsDragOver}
              uploadMessage={uploadMessage}
              setUploadMessage={setUploadMessage}
              uploadLoading={uploadLoading}
              setUploadLoading={setUploadLoading}
              uploadError={uploadError}
              setUploadError={setUploadError}
              setHealthScore={setHealthScore}
              setMissingColumns={setMissingColumns}
              setAllMissingColumns={setAllMissingColumns}
              setShowAllColumns={setShowAllColumns}
              setRawData={setRawData}
              setPreviewData={setPreviewData}
              setPreviewSummary={setPreviewSummary}
              setPreviewError={setPreviewError}
              setPreviewNotice={setPreviewNotice}
            />
          }
        />
        <Route
          path="/configure"
          element={
            <ConfigureScreen
              rawData={rawData}
              selectedOperations={selectedOperations}
              cleaningOperations={cleaningOperations}
              toggleOperation={toggleOperation}
              healthScore={healthScore}
              isPreviewLoading={isPreviewLoading}
              fetchPreviewData={fetchPreviewData}
            />
          }
        />
        <Route
          path="/preview"
          element={
            <PreviewScreen
              previewData={previewData}
              isPreviewLoading={isPreviewLoading}
              previewError={previewError}
              previewNotice={previewNotice}
              previewSummary={previewSummary}
              allMissingColumns={allMissingColumns}
              showAllColumns={showAllColumns}
              setShowAllColumns={setShowAllColumns}
            />
          }
        />
        <Route
          path="/export"
          element={
            <ExportScreen
              previewData={previewData}
              exportMessage={exportMessage}
              setExportMessage={setExportMessage}
              lastExportName={lastExportName}
              setLastExportName={setLastExportName}
              handleExportCSV={handleExportCSV}
              handleExportJSON={handleExportJSON}
            />
          }
        />
      </Routes>
    </div>
  )
}

export default App
