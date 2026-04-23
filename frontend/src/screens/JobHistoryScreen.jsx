import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { clearJobHistoryEverywhere, deleteJobEverywhere, getJobHistory, getJobKey } from '../api/api'

const PRIORITY_COLUMNS = ['_id', 'id', 'local_id', 'filename', 'status', 'created_at', 'rows_in', 'rows_out']

const sortColumns = (rows) => {
  const keys = new Set()
  rows.forEach((row) => {
    Object.keys(row || {}).forEach((key) => keys.add(key))
  })

  const all = Array.from(keys)
  const pinned = PRIORITY_COLUMNS.filter((col) => all.includes(col))
  const rest = all.filter((col) => !pinned.includes(col)).sort((a, b) => a.localeCompare(b))
  return [...pinned, ...rest]
}

const displayValue = (value) => {
  if (value === null || value === undefined || value === '') return '-'
  if (Array.isArray(value) || typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export function JobHistoryScreen() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingKey, setDeletingKey] = useState('')
  const [isClearingAll, setIsClearingAll] = useState(false)

  useEffect(() => {
    let ignore = false

    const load = async () => {
      try {
        setIsLoading(true)
        setError('')
        const history = await getJobHistory(300)
        if (!ignore) setJobs(Array.isArray(history) ? history : [])
      } catch (err) {
        if (!ignore) {
          setError(err?.message || 'Unable to load job history.')
          setJobs([])
        }
      } finally {
        if (!ignore) setIsLoading(false)
      }
    }

    load()
    return () => {
      ignore = true
    }
  }, [])

  const columnHelper = useMemo(() => createColumnHelper(), [])
  const columnKeys = useMemo(() => sortColumns(jobs), [jobs])

  const handleDeleteJob = useCallback(async (job) => {
    const key = getJobKey(job)
    if (!window.confirm('Delete this job from history?')) return

    setDeletingKey(key)
    try {
      await deleteJobEverywhere(job)
      setJobs((prev) => prev.filter((entry) => getJobKey(entry) !== key))
    } finally {
      setDeletingKey('')
    }
  }, [])

  const handleClearAll = useCallback(async () => {
    if (!window.confirm('Clear all job history?')) return

    setIsClearingAll(true)
    try {
      await clearJobHistoryEverywhere()
      setJobs([])
    } finally {
      setIsClearingAll(false)
    }
  }, [])

  const columns = useMemo(() => {
    const dynamicColumns = columnKeys.map((key) =>
      columnHelper.accessor((row) => row?.[key], {
        id: key,
        header: () => key,
        cell: (info) => displayValue(info.getValue()),
      }),
    )

    const actionColumn = columnHelper.display({
      id: 'actions',
      header: () => 'actions',
      cell: (info) => {
        const key = getJobKey(info.row.original)
        const isDeletingThis = deletingKey === key
        return (
          <button
            type="button"
            className="table-action-btn"
            onClick={() => handleDeleteJob(info.row.original)}
            disabled={isDeletingThis || isClearingAll}
          >
            {isDeletingThis ? 'Deleting...' : 'Delete'}
          </button>
        )
      },
    })

    return [...dynamicColumns, actionColumn]
  }, [columnHelper, columnKeys, deletingKey, handleDeleteJob, isClearingAll])

  const table = useReactTable({
    data: jobs,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="screen preview-screen">
      <div className="topbar">
        <button className="nav-back-btn" onClick={() => navigate('/upload')}>
          ← Back to Upload
        </button>
        <div>
          <p className="eyebrow">Automated Data Cleaner</p>
          <h1>Job History</h1>
        </div>
      </div>

      <main className="preview-main">
        <section className="panel preview">
          <div className="panel-header">
            <h2>Past Cleaning Jobs</h2>
            {jobs.length > 0 && (
              <button
                type="button"
                className="table-action-btn table-action-btn-danger"
                onClick={handleClearAll}
                disabled={isClearingAll || !!deletingKey}
              >
                {isClearingAll ? 'Clearing...' : 'Clear All'}
              </button>
            )}
          </div>

          {isLoading && <LoadingSpinner label="Loading jobs from browser/server..." fullScreen />}
          {!isLoading && error && <div className="preview-error">{error}</div>}
          {!isLoading && !error && jobs.length === 0 && <p className="no-data-notice">No jobs found yet.</p>}
          {!isLoading && !error && jobs.length > 0 && (
            <div className="preview-success">
              Showing {jobs.length} job{jobs.length !== 1 ? 's' : ''}
            </div>
          )}

          {!isLoading && !error && jobs.length > 0 && (
            <div className="table-container">
              <table className="preview-table">
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th key={header.id}>{flexRender(header.column.columnDef.header, header.getContext())}</th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
