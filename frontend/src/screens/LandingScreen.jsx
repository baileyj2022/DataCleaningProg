import { useNavigate } from 'react-router-dom'
import { AppShell } from '../components/WorkflowLayout'

export function LandingScreen() {
  const navigate = useNavigate()

  return (
    <AppShell>
      <header className="flex items-center justify-between gap-4">
        <div className="inline-flex items-center gap-3 rounded-full border border-sky-300/30 bg-sky-500/10 px-4 py-2 text-sm font-semibold tracking-wide text-sky-200">
          Automated Data Cleaner
        </div>
        <button
          type="button"
          onClick={() => navigate('/jobs')}
          className="rounded-lg border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-sky-300 hover:text-sky-200"
        >
          View Jobs
        </button>
      </header>

      <section className="mt-14 grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
        <div>
          <p className="mb-4 inline-flex rounded-full border border-emerald-300/35 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
            Clean Data, Faster
          </p>
          <h1 className="max-w-2xl text-4xl font-bold leading-tight text-white sm:text-5xl">
            Turn messy datasets into export-ready insights in minutes.
          </h1>
          <p className="mt-6 max-w-2xl text-base text-slate-300 sm:text-lg">
            Upload CSV, JSON, Excel, or JPEG files. Configure intelligent cleaning operations, preview every change,
            and export polished data with one streamlined flow.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/upload')}
              className="rounded-xl bg-sky-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_14px_40px_rgba(56,172,255,0.45)] transition hover:bg-sky-400"
            >
              Start Cleaning
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl backdrop-blur">
          <h2 className="text-lg font-semibold text-white">Workflow</h2>
          <ul className="mt-5 space-y-4 text-sm text-slate-300">
            <li className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
              <p className="font-semibold text-sky-200">1. Upload</p>
              <p className="mt-1">Bring in CSV, JSON, Excel, or JPEG files from your device.</p>
            </li>
            <li className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
              <p className="font-semibold text-sky-200">2. Configure</p>
              <p className="mt-1">Select operations like fill-missing, prediction, and value estimation.</p>
            </li>
            <li className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
              <p className="font-semibold text-sky-200">3. Preview and Export</p>
              <p className="mt-1">Review cleaning changes and download polished output instantly.</p>
            </li>
          </ul>
        </div>
      </section>

      <section className="mt-12 grid gap-4 sm:grid-cols-3">
        <article className="rounded-xl border border-slate-800 bg-slate-900/65 p-5">
          <p className="text-2xl font-bold text-sky-200">4</p>
          <p className="mt-1 text-sm text-slate-300">Supported input formats</p>
        </article>
        <article className="rounded-xl border border-slate-800 bg-slate-900/65 p-5">
          <p className="text-2xl font-bold text-emerald-200">100%</p>
          <p className="mt-1 text-sm text-slate-300">Browser-side processing path</p>
        </article>
        <article className="rounded-xl border border-slate-800 bg-slate-900/65 p-5">
          <p className="text-2xl font-bold text-amber-200">2</p>
          <p className="mt-1 text-sm text-slate-300">Export formats available</p>
        </article>
      </section>
    </AppShell>
  )
}
