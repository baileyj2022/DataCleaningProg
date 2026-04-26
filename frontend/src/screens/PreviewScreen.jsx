import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ToneBanner, WorkflowLayout, WorkflowPanel } from '../components/WorkflowLayout'

export function PreviewScreen({
  previewData,
  isPreviewLoading,
  previewError,
  previewNotice,
  previewSummary,
  allMissingColumns,
  showAllColumns,
  setShowAllColumns,
}) {
  const navigate = useNavigate()
  const displayHeaders = previewData?.headers || []
  const displayRows = previewData?.rows || []
  const operationsApplied = previewData?.operations_applied || []

  const previewColumnHelper = useMemo(() => createColumnHelper(), [])
  const previewColumns = useMemo(() => {
    return displayHeaders.map((header) =>
      previewColumnHelper.accessor((row) => row?.[header] ?? '', {
        id: header,
        header: () => header,
        cell: (info) => String(info.getValue() ?? ''),
      }),
    )
  }, [displayHeaders, previewColumnHelper])

  const previewTable = useReactTable({
    data: displayRows,
    columns: previewColumns,
    getCoreRowModel: getCoreRowModel(),
  })

  const originalRowCount = previewData?.original_row_count ?? displayRows.length
  const cleanedRowCount = previewData?.preview_row_count ?? displayRows.length
  const removedRowCount = Math.max(originalRowCount - cleanedRowCount, 0)

  if (!previewData?.rows?.length) {
    return (
      <WorkflowLayout title="Preview Results" backLabel="Back to Configure" onBack={() => navigate('/configure')}>
        <ToneBanner tone="error" className="mt-6">
          Generate a preview to see results.
        </ToneBanner>
      </WorkflowLayout>
    )
  }

  return (
    <WorkflowLayout
      title="Preview Results"
      backLabel="Back to Configure"
      onBack={() => navigate('/configure')}
      contentClassName="mt-10 grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]"
    >
      <WorkflowPanel title="Missing Values by Column" className="h-fit">
        <div className="space-y-3">
          {(showAllColumns ? allMissingColumns : allMissingColumns.slice(0, 5)).length > 0 ? (
            (showAllColumns ? allMissingColumns : allMissingColumns.slice(0, 5)).map((item) => (
              <div className="grid grid-cols-[minmax(0,1fr)_100px_auto] items-center gap-3" key={item.label}>
                <span className="truncate text-sm text-slate-200">{item.label}</span>
                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full rounded-full" style={{ width: `${item.value}%`, background: item.color }} />
                </div>
                <strong className="text-sm text-slate-100">{item.value}%</strong>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-300">No missing values detected.</p>
          )}
        </div>
        {allMissingColumns.length > 5 && (
          <button
            type="button"
            className="mt-4 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-900/75"
            onClick={() => setShowAllColumns(!showAllColumns)}
          >
            {showAllColumns ? 'Show Top 5 Columns' : 'View All Columns'}
          </button>
        )}
      </WorkflowPanel>

      <WorkflowPanel title="Data Preview">
        {isPreviewLoading && <LoadingSpinner label="Loading cleaned data..." fullScreen />}
        {previewError && <ToneBanner tone="error">{previewError}</ToneBanner>}
        {previewNotice && !isPreviewLoading && <ToneBanner className="mt-3">{previewNotice}</ToneBanner>}
        {previewData?.rows && !isPreviewLoading && (
          <ToneBanner tone="success" className="mt-3">
            Showing {previewData.rows.length} cleaned row{previewData.rows.length !== 1 ? 's' : ''}
          </ToneBanner>
        )}

        <div className="mt-4 rounded-xl border border-slate-700/80 bg-slate-950/70 p-4 text-sm text-slate-200">
          <h4 className="text-base font-semibold text-white">Cleaning Summary Report</h4>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <p>
              <strong className="text-slate-100">Rows before:</strong> {originalRowCount}
            </p>
            <p>
              <strong className="text-slate-100">Rows after:</strong> {cleanedRowCount}
            </p>
            <p>
              <strong className="text-slate-100">Rows removed:</strong> {removedRowCount}
            </p>
            <p>
              <strong className="text-slate-100">Columns:</strong> {displayHeaders.length}
            </p>
          </div>

          {previewSummary && (
            <p className="mt-2">
              <strong className="text-slate-100">Health score:</strong> {previewSummary.health}%
            </p>
          )}

          <div className="mt-3">
            <strong className="text-slate-100">Operations applied:</strong>
            {operationsApplied.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {operationsApplied.map((operation) => (
                  <span
                    className="rounded-full border border-slate-600 bg-slate-900/70 px-2.5 py-1 text-xs text-slate-200"
                    key={operation}
                  >
                    {operation}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-slate-300">No operations listed.</p>
            )}
          </div>

          {previewSummary?.missingData?.length > 0 && (
            <div className="mt-3">
              <strong className="text-slate-100">Top missing columns:</strong>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-300">
                {previewSummary.missingData.map((item) => (
                  <li key={item.label}>
                    {item.label}: {item.value}%
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="mt-4 max-h-[420px] overflow-auto rounded-xl border border-slate-700/80">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              {previewTable.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="bg-slate-900/95">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="sticky top-0 border-b border-slate-700 px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.04em] text-slate-300"
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {previewTable.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-b border-slate-800/80">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-2 text-slate-100">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          className="mt-4 rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
          onClick={() => navigate('/export')}
        >
          Proceed to Export
        </button>
      </WorkflowPanel>
    </WorkflowLayout>
  )
}
