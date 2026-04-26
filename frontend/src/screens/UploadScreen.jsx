import { useNavigate } from 'react-router-dom'
import { calculateStats } from '../components/dataCleaning'
import { parseCSV, parseJSON, parseExcel, parseJPEG } from '../components/parsers'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ToneBanner, WorkflowLayout, WorkflowPanel } from '../components/WorkflowLayout'

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
    <WorkflowLayout
      title="Automated Data Cleaner"
      eyebrow="For Businesses with Messy Data"
      rightAction={
        <button
          type="button"
          className="rounded-lg border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-sky-300 hover:text-sky-200"
          onClick={() => navigate('/jobs')}
        >
          View Job History
        </button>
      }
      contentClassName="mt-10 flex justify-center"
    >
      <WorkflowPanel title="Data Ingestion" className="w-full max-w-2xl">
        <div
          className={`relative grid gap-2 rounded-2xl border border-dashed p-7 text-center transition ${
            isDragOver
              ? 'border-sky-300/70 bg-sky-500/15'
              : 'border-slate-600/70 bg-slate-950/50 hover:border-slate-500 hover:bg-slate-900/60'
          }`}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          role="button"
          tabIndex={0}
        >
          <div
            className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-slate-600 bg-slate-900/60"
            aria-hidden="true"
          >
            <span className="grid h-8 w-6 place-items-center rounded-md border-2 border-slate-300 text-slate-200">+</span>
          </div>
          <p className="text-base font-medium text-slate-100">Drag and drop CSV, JSON, Excel, or JPEG files here</p>
          <span className="text-sm text-slate-400">or browse files on your device</span>
          <input
            type="file"
            accept=".csv,.json,.xlsx,.xls,.jpg,.jpeg"
            onChange={(event) => handleFiles(event.target.files)}
            disabled={uploadLoading}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-300">
          <p className="truncate font-medium text-slate-100">{selectedFile ? selectedFile.name : 'No file selected'}</p>
          <span>{selectedFile ? `${Math.round(selectedFile.size / 1024)} KB` : 'Waiting for upload'}</span>
        </div>

        {uploadMessage && <p className="mt-3 text-sm text-slate-300">{uploadMessage}</p>}
        {uploadLoading && <LoadingSpinner label="Processing file..." fullScreen />}
        {uploadError && (
          <ToneBanner tone="error" className="mt-4">
            {uploadError}
          </ToneBanner>
        )}
      </WorkflowPanel>
    </WorkflowLayout>
  )
}
