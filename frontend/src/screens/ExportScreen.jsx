import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ToneBanner, WorkflowLayout, WorkflowPanel } from '../components/WorkflowLayout'

export function ExportScreen({
  previewData,
  isExportLoading,
  exportMessage,
  lastExportName,
  handleExportCSV,
  handleExportJSON,
}) {
  const navigate = useNavigate()
  const [selectedFormat, setSelectedFormat] = useState('csv')

  const handleDownload = () => {
    if (selectedFormat === 'json') {
      handleExportJSON()
      return
    }
    handleExportCSV()
  }

  if (!previewData?.rows?.length) {
    return (
      <WorkflowLayout title="Export Results" backLabel="Back to Preview" onBack={() => navigate('/preview')}>
        <ToneBanner tone="error" className="mt-6">
          No data to export. Please go back and generate a preview.
        </ToneBanner>
      </WorkflowLayout>
    )
  }

  return (
    <WorkflowLayout title="Export Results" backLabel="Back to Preview" onBack={() => navigate('/preview')}>
      <div className="mt-10 max-w-3xl">
        <WorkflowPanel title="Export Cleaned File">
          <span className="inline-flex rounded-full border border-slate-600 bg-slate-900/70 px-3 py-1 text-xs text-slate-200">
            Cleaned dataset is ready for export. Choose your preferred format below.
          </span>

          <p className="mt-4 text-sm text-slate-300">
            Download your cleaned dataset as a modern export file. CSV is widely compatible, while JSON preserves
            complex structures. The exported file includes all applied cleaning operations and a timestamp in the
            filename.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-sky-300/40 bg-sky-500/10 px-4 py-3">
              <strong className="block text-sm text-sky-100">Rows</strong>
              <span className="text-sm text-slate-200">{previewData?.rows?.length}</span>
            </div>
            <div className="rounded-xl border border-emerald-300/40 bg-emerald-500/10 px-4 py-3">
              <strong className="block text-sm text-emerald-100">Columns</strong>
              <span className="text-sm text-slate-200">{previewData?.headers?.length}</span>
            </div>
            <div className="rounded-xl border border-amber-300/40 bg-amber-500/10 px-4 py-3">
              <strong className="block text-sm text-amber-100">Operations</strong>
              <span className="text-sm text-slate-200">{previewData?.operations_applied?.length || 0}</span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <select
              className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-sky-300"
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              aria-label="Select export format"
              disabled={isExportLoading}
            >
              <option value="csv">CSV (.csv)</option>
              <option value="json">JSON (.json)</option>
            </select>

            <button
              type="button"
              className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={handleDownload}
              disabled={isExportLoading}
            >
              {isExportLoading ? 'Preparing...' : 'Download'}
            </button>

            {lastExportName && (
              <button
                type="button"
                className="rounded-lg border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-500"
                onClick={() => navigator.clipboard?.writeText(lastExportName)}
              >
                Saved: {lastExportName}
              </button>
            )}
          </div>

          {isExportLoading && <LoadingSpinner label="Preparing file download..." fullScreen />}
          {exportMessage && <ToneBanner className="mt-4">{exportMessage}</ToneBanner>}

          <button
            type="button"
            className="mt-4 rounded-lg border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-sky-300 hover:text-sky-200"
            onClick={() => navigate('/upload')}
          >
            Start Over
          </button>
        </WorkflowPanel>
      </div>
    </WorkflowLayout>
  )
}
