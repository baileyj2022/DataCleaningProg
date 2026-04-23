import { useNavigate } from 'react-router-dom'
import { LoadingSpinner } from '../components/LoadingSpinner'

export function ConfigureScreen({
  rawData,
  selectedOperations,
  cleaningOperations,
  toggleOperation,
  healthScore,
  isPreviewLoading,
  fetchPreviewData,
}) {
  const navigate = useNavigate()

  if (!rawData.headers.length) {
    return (
      <div className="screen configure-screen">
        <div className="topbar">
          <button className="nav-back-btn" onClick={() => navigate('/upload')}>
            ← Back to Upload
          </button>
          <div>
            <p className="eyebrow">Automated Data Cleaner</p>
            <h1>Configure Cleaning</h1>
          </div>
        </div>
        <main className="configure-main">
          <p className="no-data-notice">No data uploaded. Please go back and upload a file.</p>
        </main>
      </div>
    )
  }

  const handleApply = () => {
    if (selectedOperations.length === 0) {
      alert('Please select at least one cleaning operation.')
      return
    }
    fetchPreviewData().then(() => {
      navigate('/preview')
    })
  }

  return (
    <div className="screen configure-screen">
      <div className="topbar">
        <button className="nav-back-btn" onClick={() => navigate('/upload')}>
          ← Back to Upload
        </button>
        <div>
          <p className="eyebrow">Automated Data Cleaner</p>
          <h1>Configure Cleaning</h1>
        </div>
      </div>

      <main className="configure-main">
        <section className="panel health">
          <div className="panel-header">
            <h2>Health Score</h2>
          </div>
          <div className="score-block">
            <div className="score-stack">
              <span className="score">{healthScore !== null ? `${healthScore}%` : '--'}</span>
            </div>
            <p>Overall data quality and completeness</p>
          </div>
        </section>

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
                onClick={handleApply}
                disabled={isPreviewLoading}
              >
                {isPreviewLoading ? 'Generating...' : 'Apply Smart Fixes'}
              </button>
            </div>
          )}
          {isPreviewLoading && <LoadingSpinner label="Applying cleaning operations..." fullScreen />}
        </section>
      </main>
    </div>
  )
}
