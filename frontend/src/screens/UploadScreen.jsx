import { useNavigate } from 'react-router-dom'
import { calculateStats } from '../components/dataCleaning'
import { parseCSV, parseJSON, parseExcel, parseJPEG } from '../components/parsers'
import { LoadingSpinner } from '../components/LoadingSpinner'

export function UploadScreen({
  selectedFile,
  setSelectedFile,
  isDragOver,
  setIsDragOver,
  uploadMessage,
  setUploadMessage,
  uploadLoading,
  setUploadLoading,
  uploadError,
  setUploadError,
  setHealthScore,
  setMissingColumns,
  setAllMissingColumns,
  setShowAllColumns,
  setRawData,
  setPreviewData,
  setPreviewSummary,
  setPreviewError,
  setPreviewNotice,
}) {
  const navigate = useNavigate()

  const handleFiles = async (files) => {
    const nextFile = files && files[0]
    if (!nextFile) return
    const minSpinnerMs = 550
    const startTime = Date.now()

    setUploadLoading(true)
    setUploadError('')
    setSelectedFile(nextFile)
    setUploadMessage('')
    try {
      const fileName = nextFile.name.toLowerCase()
      let parsed

      if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) {
        setUploadMessage('Reading text from JPEG...')
        parsed = await parseJPEG(nextFile)
      } else if (fileName.endsWith('.csv')) {
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
      setPreviewData(null)
      setPreviewSummary(null)
      setPreviewError('')
      setPreviewNotice('')
      const elapsed = Date.now() - startTime
      if (elapsed < minSpinnerMs) {
        await new Promise((resolve) => setTimeout(resolve, minSpinnerMs - elapsed))
      }
      setUploadLoading(false)
      // navigate to configure screen after successful upload
      navigate('/configure')
    } catch (error) {
      console.error('Error parsing file:', error)
      setUploadError(error.message || 'Failed to process file.')
      setUploadMessage('')
      setHealthScore(null)
      setMissingColumns([])
      setAllMissingColumns([])
      setShowAllColumns(false)
      setRawData({ headers: [], rows: [] })
      const elapsed = Date.now() - startTime
      if (elapsed < minSpinnerMs) {
        await new Promise((resolve) => setTimeout(resolve, minSpinnerMs - elapsed))
      }
      setUploadLoading(false)
    }
  }

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

  const onDragLeave = (event) => {
    event.preventDefault()
    setIsDragOver(false)
  }

  return (
    <div className="screen upload-screen">
      <div className="topbar">
        <div>
          <p className="eyebrow">For Businesses with "Messy" Data</p>
          <h1>Automated Data Cleaner</h1>
        </div>
        <button className="nav-back-btn topbar-action" onClick={() => navigate('/jobs')}>
          View Job History
        </button>
      </div>

      <main className="upload-main">
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
          {uploadLoading && <LoadingSpinner label="Processing file..." fullScreen />}
          {uploadError && <div className="upload-error">{uploadError}</div>}
        </section>
      </main>
    </div>
  )
}
