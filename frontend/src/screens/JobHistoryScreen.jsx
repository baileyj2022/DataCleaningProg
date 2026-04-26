import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { clearJobHistoryEverywhere, deleteJobEverywhere, getJobHistory, getJobKey } from '../api/api'
import { ToneBanner, WorkflowLayout, WorkflowPanel } from '../components/WorkflowLayout'

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
            className="rounded-md border border-slate-600 bg-slate-950/70 px-3 py-1.5 text-xs font-medium text-slate-100 transition hover:border-slate-400"
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
    <WorkflowLayout title="Job History" backLabel="Back to Upload" onBack={() => navigate('/upload')}>
      <div className="mt-10">
        <WorkflowPanel
          title="Past Cleaning Jobs"
          action={
            jobs.length > 0 && (
              <button
                type="button"
                className="rounded-lg border border-rose-300/35 bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-100 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handleClearAll}
                disabled={isClearingAll || !!deletingKey}
              >
                {isClearingAll ? 'Clearing...' : 'Clear All'}
              </button>
            )
          }
        >
          {isLoading && <LoadingSpinner label="Loading jobs from browser/server..." fullScreen />}
          {!isLoading && error && <ToneBanner tone="error">{error}</ToneBanner>}
          {!isLoading && !error && jobs.length === 0 && (
            <ToneBanner tone="warning">No jobs found yet.</ToneBanner>
          )}
          {!isLoading && !error && jobs.length > 0 && (
            <ToneBanner tone="success">
              Showing {jobs.length} job{jobs.length !== 1 ? 's' : ''}
            </ToneBanner>
          )}

          {!isLoading && !error && jobs.length > 0 && (
            <div className="mt-4 max-h-[520px] overflow-auto rounded-xl border border-slate-700/80">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
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
                  {table.getRowModel().rows.map((row) => (
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
          )}
        </WorkflowPanel>
      </div>
    </WorkflowLayout>
  )
}
