import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LoadingSpinner } from '../components/LoadingSpinner'

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
      <div className="screen export-screen">
        <div className="topbar">
          <button className="nav-back-btn" onClick={() => navigate('/preview')}>
            ← Back to Preview
          </button>
          <div>
            <p className="eyebrow">Automated Data Cleaner</p>
            <h1>Export Results</h1>
          </div>
        </div>
        <main className="export-main">
          <p className="no-data-notice">No data to export. Please go back and generate a preview.</p>
        </main>
      </div>
    )
  }

  return (
    <div className="screen export-screen">
      <div className="topbar">
        <button className="nav-back-btn" onClick={() => navigate('/preview')}>
          ← Back to Preview
        </button>
        <div>
          <p className="eyebrow">Automated Data Cleaner</p>
          <h1>Export Results</h1>
        </div>
      </div>

      <main className="export-main">
        <section className="panel preview">
          <div className="panel-header">
            <h2>Export Cleaned File</h2>
            <span className="badge">Cleaned dataset is ready for export. Choose your preferred format below.</span>
          </div>

          <p className="subtle">
            Download your cleaned dataset as a modern export file. CSV is widely compatible, while JSON preserves
            complex structures. The exported file will include all applied cleaning operations and a timestamp in the
            filename for easy reference.
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
              <span>{previewData?.operations_applied?.length || 0}</span>
            </div>
          </div>

          <div className="export-actions" style={{ marginTop: 16 }}>
            <select
              className="export-button"
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              aria-label="Select export format"
              disabled={isExportLoading}
            >
              <option value="csv">CSV (.csv)</option>
              <option value="json">JSON (.json)</option>
            </select>

            <button className="export-button" onClick={handleDownload} disabled={isExportLoading}>
              {isExportLoading ? 'Preparing...' : 'Download'}
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

          {isExportLoading && <LoadingSpinner label="Preparing file download..." fullScreen />}
          {exportMessage && <div className="preview-loading" style={{ marginTop: 12 }}>{exportMessage}</div>}

          <button className="nav-start-over-btn" onClick={() => navigate('/upload')}>
            Start Over
          </button>
        </section>
      </main>
    </div>
  )
}
