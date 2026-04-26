import { useNavigate } from 'react-router-dom'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ToneBanner, WorkflowLayout, WorkflowPanel } from '../components/WorkflowLayout'

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
      <WorkflowLayout title="Configure Cleaning" backLabel="Back to Upload" onBack={() => navigate('/upload')}>
        <ToneBanner tone="error" className="mt-6">
          No data uploaded. Please go back and upload a file.
        </ToneBanner>
      </WorkflowLayout>
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
    <WorkflowLayout
      title="Configure Cleaning"
      backLabel="Back to Upload"
      onBack={() => navigate('/upload')}
      contentClassName="mt-10 grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]"
    >
      <WorkflowPanel title="Health Score">
        <div className="flex items-end gap-3">
          <span className="text-5xl font-bold text-emerald-300">{healthScore !== null ? `${healthScore}%` : '--'}</span>
        </div>
        <p className="mt-2 text-sm text-slate-300">Overall data quality and completeness.</p>
      </WorkflowPanel>

      <WorkflowPanel title="Cleaning Configuration" subtitle="Select cleaning operations to apply.">
        <div className="space-y-3">
          {cleaningOperations.map((operation) => {
            const isSelected = selectedOperations.includes(operation.id)

            return (
              <label
                key={operation.id}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 transition ${
                  isSelected
                    ? 'border-sky-300/60 bg-sky-500/15'
                    : 'border-slate-700 bg-slate-950/55 hover:border-slate-500 hover:bg-slate-900/75'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleOperation(operation.id)}
                  className="mt-1 h-4 w-4 accent-sky-400"
                />
                <div>
                  <span className="text-sm font-semibold text-slate-100">{operation.label}</span>
                  <p className="mt-1 text-sm text-slate-300">{operation.description}</p>
                </div>
              </label>
            )
          })}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="rounded-lg border border-sky-300/35 bg-sky-500/10 px-3 py-2 text-sm font-medium text-sky-100">
            {selectedOperations.length} operation{selectedOperations.length !== 1 ? 's' : ''} selected
          </div>
          <button
            type="button"
            className="rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={handleApply}
            disabled={isPreviewLoading || selectedOperations.length === 0}
          >
            {isPreviewLoading ? 'Generating...' : 'Apply Smart Fixes'}
          </button>
        </div>

        {isPreviewLoading && <LoadingSpinner label="Applying cleaning operations..." fullScreen />}
      </WorkflowPanel>
    </WorkflowLayout>
  )
}
