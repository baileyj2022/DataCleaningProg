import { useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
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
  // function to add the navigation flow that guides the user step by step
const navigate = useNavigate()

const navigateFlow = () => {
  if (!selectedFile) {
    navigate('/')
    toast.error('Please upload a file first.')
    return
  }
  if (rawData.headers.length === 0 || rawData.rows.length === 0) {
    navigate('/')
    toast.error('No data loaded. Please upload a valid file first.')
    return
  }
  if (selectedOperations.length === 0) {
    navigate('/configure')
    toast.error('Please select at least one cleaning operation.')
    return
  }
  navigate('/preview')
}

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

      // Apply cleaning operations locally (frontend-only) and generate preview data
      try {
        const cleanedRows = applyLocalOperations(rawData.headers, rawData.rows, selectedOperations)
        const cleanedResult = {
          headers: rawData.headers,
          rows: cleanedRows,
          operations_applied: selectedOperations,
          original_row_count: rawData.rows.length,
          preview_row_count: cleanedRows.length,
          source: 'frontend',
        }
        // Update preview data with cleaned results
        setPreviewData(cleanedResult)
        // Update stats based on cleaned data
        if (cleanedResult.headers.length && cleanedResult.rows.length) {
          const cleanedStats = calculateStats(cleanedResult.headers, cleanedResult.rows)
          setRawData({ headers: cleanedResult.headers, rows: cleanedResult.rows })
          setHealthScore(cleanedStats.health)
          setMissingColumns(cleanedStats.missingData)
          setAllMissingColumns(cleanedStats.allMissing)
          setPreviewSummary(cleanedStats)
        }
      // Show success notification
        setPreviewNotice('Data cleaned successfully.')
        toast.success('Cleaning completed successfully.')
      } catch (error) {
        console.error('Error applying cleaning operations:', error)
        setPreviewError(`Cleaning failed: ${error.message}`)
        toast.error(`Cleaning failed: ${error.message}`)
      } finally {
        setIsPreviewLoading(false)
      }
    }
// Toggle between top 5 missing columns and all missing columns in the preview
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
    return `${base}`
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

  const requestExport = async (format) => {
    const cleaned = getCleanedDataset()
    if (!cleaned) {
      setExportMessage('Generate a cleaned preview first (click “Apply Smart Fixes”).')
      return
    }

    const baseName = buildExportBaseName()

    try {
      setExportMessage('Preparing download...')
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
      const filename = `${baseName}_cleaned_${timestamp}.${format}`
      const blob =
        format === 'json'
          ? new Blob([JSON.stringify(cleaned.rows, null, 2)], { type: 'application/json;charset=utf-8' })
          : new Blob([toCSV(cleaned.headers, cleaned.rows)], { type: 'text/csv;charset=utf-8' })

      downloadBlob(blob, filename)
      setLastExportName(filename)
      setExportMessage(`Downloaded cleaned ${format.toUpperCase()} successfully.`)
      toast.success(`Downloaded cleaned ${format.toUpperCase()} successfully.`)
    } catch (error) {
      setExportMessage(error.message || 'Export failed. Please try again.')
      toast.error(error.message || 'Export failed. Please try again.')
    }
  }

  const handleExportCSV = async () => requestExport('csv')

  const handleExportJSON = async () => requestExport('json')

  return (
    <div className="app">
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      <Routes>
        <Route
          path="/"
          element={
            <UploadScreen
              navigateFlow={navigateFlow}
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
