import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'

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
      <div className="screen preview-screen">
        <div className="topbar">
          <button className="nav-back-btn" onClick={() => navigate('/configure')}>
            ← Back to Configure
          </button>
          <div>
            <p className="eyebrow">Automated Data Cleaner</p>
            <h1>Preview Results</h1>
          </div>
        </div>
        <main className="preview-main">
          <p className="no-data-notice">Generate a preview to see results.</p>
        </main>
      </div>
    )
  }

  return (
    <div className="screen preview-screen">
      <div className="topbar">
        <button className="nav-back-btn" onClick={() => navigate('/configure')}>
          ← Back to Configure
        </button>
        <div>
          <p className="eyebrow">Automated Data Cleaner</p>
          <h1>Preview Results</h1>
        </div>
      </div>

      <main className="preview-main">
        <section className="panel missing">
          <div className="panel-header">
            <h2>Missing Values by Column</h2>
          </div>
          <div className="bars">
            {(showAllColumns ? allMissingColumns : allMissingColumns.slice(0, 5)).length > 0 ? (
              (showAllColumns ? allMissingColumns : allMissingColumns.slice(0, 5)).map((item) => (
                <div className="bar-row" key={item.label}>
                  <span className="label-with-tag">{item.label}</span>
                  <div className="bar">
                    <div className="bar-fill" style={{ width: `${item.value}%`, background: item.color }} />
                  </div>
                  <strong>{item.value}%</strong>
                </div>
              ))
            ) : (
              <p className="no-data">No missing values detected.</p>
            )}
          </div>
          {allMissingColumns.length > 5 && (
            <button className="view-all-btn" onClick={() => setShowAllColumns(!showAllColumns)}>
              {showAllColumns ? 'Show Top 5 Columns' : 'View All Columns'}
            </button>
          )}
        </section>

        <section className="panel preview">
          <div className="panel-header">
            <h2>Data Preview</h2>
          </div>
          {isPreviewLoading && <div className="preview-loading">Loading cleaned data...</div>}
          {previewError && <div className="preview-error">{previewError}</div>}
          {previewNotice && !isPreviewLoading && <div className="preview-loading">{previewNotice}</div>}
          {previewData?.rows && !isPreviewLoading && (
            <div className="preview-success">
              Showing {previewData.rows.length} cleaned row{previewData.rows.length !== 1 ? 's' : ''}
            </div>
          )}

          <div className="summary-card">
            <h4>Cleaning Summary Report</h4>
            <div className="summary-grid">
              <p>
                <strong>Rows before:</strong> {originalRowCount}
              </p>
              <p>
                <strong>Rows after:</strong> {cleanedRowCount}
              </p>
              <p>
                <strong>Rows removed:</strong> {removedRowCount}
              </p>
              <p>
                <strong>Columns:</strong> {displayHeaders.length}
              </p>
            </div>

            {previewSummary && (
              <p>
                <strong>Health score:</strong> {previewSummary.health}%
              </p>
            )}

            <div className="summary-ops">
              <strong>Operations applied:</strong>
              {operationsApplied.length > 0 ? (
                <div className="operation-tags">
                  {operationsApplied.map((operation) => (
                    <span className="badge" key={operation}>
                      {operation}
                    </span>
                  ))}
                </div>
              ) : (
                <p>No operations listed.</p>
              )}
            </div>

            {previewSummary?.missingData?.length > 0 && (
              <div className="missing-list">
                <strong>Top missing columns:</strong>
                <ul>
                  {previewSummary.missingData.map((item) => (
                    <li key={item.label}>
                      {item.label}: {item.value}%
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

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

          <button className="nav-next-btn" onClick={() => navigate('/export')}>
            Proceed to Export →
          </button>
        </section>
      </main>
    </div>
  )
}
