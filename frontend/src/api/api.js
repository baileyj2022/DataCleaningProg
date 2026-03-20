const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
const BROWSER_JOBS_KEY = 'data_cleaning_job_history'
const MAX_BROWSER_JOBS = 300

const canUseLocalStorage = () => typeof window !== 'undefined' && !!window.localStorage

const coerceArray = (value) => (Array.isArray(value) ? value : [])

const normalizeJob = (job) => {
	if (!job || typeof job !== 'object') return null
	return { ...job }
}

export const getJobKey = (job) => {
	if (job?._id) return String(job._id)
	if (job?.id) return String(job.id)
	if (job?.local_id) return String(job.local_id)
	return JSON.stringify([job?.filename || '', job?.created_at || '', job?.status || '', job?.rows_out || ''])
}

const sortByCreatedDesc = (jobs) => {
	return [...jobs].sort((a, b) => {
		const aTime = a?.created_at ? Date.parse(a.created_at) : Number.NaN
		const bTime = b?.created_at ? Date.parse(b.created_at) : Number.NaN
		if (!Number.isNaN(aTime) && !Number.isNaN(bTime)) return bTime - aTime
		if (!Number.isNaN(aTime)) return -1
		if (!Number.isNaN(bTime)) return 1
		return 0
	})
}

export function readBrowserJobs(limit = 200) {
	if (!canUseLocalStorage()) return []

	try {
		const raw = window.localStorage.getItem(BROWSER_JOBS_KEY)
		if (!raw) return []
		const parsed = JSON.parse(raw)
		const normalized = coerceArray(parsed).map(normalizeJob).filter(Boolean)
		return sortByCreatedDesc(normalized).slice(0, Math.max(1, limit))
	} catch {
		return []
	}
}

export function saveBrowserJob(job) {
	if (!canUseLocalStorage()) return

	const normalized = normalizeJob(job)
	if (!normalized) return

	const existing = readBrowserJobs(MAX_BROWSER_JOBS)
	const combined = sortByCreatedDesc([normalized, ...existing])
	const deduped = []
	const seen = new Set()

	combined.forEach((entry) => {
		const key = getJobKey(entry)
		if (!seen.has(key)) {
			seen.add(key)
			deduped.push(entry)
		}
	})

	window.localStorage.setItem(BROWSER_JOBS_KEY, JSON.stringify(deduped.slice(0, MAX_BROWSER_JOBS)))
}

export async function fetchJobs(limit = 200) {
	const url = new URL('/jobs', API_BASE_URL)
	url.searchParams.set('limit', String(limit))

	const response = await fetch(url.toString())
	if (!response.ok) {
		const message = await response.text()
		throw new Error(message || `Failed to fetch jobs (${response.status})`)
	}

	const data = await response.json()
	if (!Array.isArray(data)) {
		throw new Error('Invalid jobs response format')
	}

	return data
}

export async function getJobHistory(limit = 200) {
	const safeLimit = Math.max(1, limit)
	const browserJobs = readBrowserJobs(safeLimit)

	try {
		const backendJobs = await fetchJobs(safeLimit)
		const merged = sortByCreatedDesc([...backendJobs, ...browserJobs])
		const seen = new Set()
		const deduped = []

		merged.forEach((job) => {
			const key = getJobKey(job)
			if (!seen.has(key)) {
				seen.add(key)
				deduped.push(job)
			}
		})

		return deduped.slice(0, safeLimit)
	} catch {
		return browserJobs
	}
}

export function deleteBrowserJob(jobOrKey) {
	if (!canUseLocalStorage()) return
	const key = typeof jobOrKey === 'string' ? jobOrKey : getJobKey(jobOrKey)
	const jobs = readBrowserJobs(MAX_BROWSER_JOBS)
	const filtered = jobs.filter((entry) => getJobKey(entry) !== key)
	window.localStorage.setItem(BROWSER_JOBS_KEY, JSON.stringify(filtered))
}

export function clearBrowserJobs() {
	if (!canUseLocalStorage()) return
	window.localStorage.removeItem(BROWSER_JOBS_KEY)
}

export async function deleteBackendJob(jobId) {
	if (!jobId) return
	const url = new URL(`/jobs/${encodeURIComponent(String(jobId))}`, API_BASE_URL)
	const response = await fetch(url.toString(), { method: 'DELETE' })
	if (!response.ok) {
		throw new Error(`Failed to delete job (${response.status})`)
	}
}

export async function clearBackendJobs() {
	const url = new URL('/jobs', API_BASE_URL)
	const response = await fetch(url.toString(), { method: 'DELETE' })
	if (!response.ok) {
		throw new Error(`Failed to clear job history (${response.status})`)
	}
}

export async function deleteJobEverywhere(job) {
	deleteBrowserJob(job)
	const backendId = job?._id || job?.id
	if (!backendId) return
	try {
		await deleteBackendJob(backendId)
	} catch {
		// Browser history is already updated; backend can be unavailable.
	}
}

export async function clearJobHistoryEverywhere() {
	clearBrowserJobs()
	try {
		await clearBackendJobs()
	} catch {
		// Browser history is already cleared; backend can be unavailable.
	}
}
