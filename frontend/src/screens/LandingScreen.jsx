import { useNavigate } from 'react-router-dom'

export function LandingScreen() {
  const navigate = useNavigate()

  return (
    <div className="landing-shell">
      <div className="landing-aurora" />

      <main className="landing-container">
        <header className="landing-topbar">
          <div className="landing-brand-badge">
            Automated Data Cleaner
          </div>
          <button
            type="button"
            onClick={() => navigate('/jobs')}
            className="landing-btn-secondary"
          >
            View Jobs
          </button>
        </header>

        <section className="landing-hero-grid">
          <div>
            <p className="landing-kicker">
              Clean Data, Faster
            </p>
            <h1 className="landing-title">
              Turn messy datasets into export-ready insights in minutes.
            </h1>
            <p className="landing-subtitle">
              Upload CSV, JSON, Excel, or JPEG files. Configure intelligent cleaning operations, preview every change,
              and export polished data with one streamlined flow.
            </p>

            <div className="landing-cta-row">
              <button
                type="button"
                onClick={() => navigate('/upload')}
                className="landing-btn-primary"
              >
                Start Cleaning
              </button>
              <button
                type="button"
                onClick={() => navigate('/upload')}
                className="landing-btn-outline"
              >
                Upload Data
              </button>
            </div>
          </div>

          <div className="landing-workflow-card">
            <h2 className="landing-workflow-title">Workflow</h2>
            <ul className="landing-workflow-list">
              <li className="landing-workflow-item">
                <p className="landing-workflow-step">1. Upload</p>
                <p className="landing-workflow-copy">Bring in CSV, JSON, Excel, or JPEG files from your device.</p>
              </li>
              <li className="landing-workflow-item">
                <p className="landing-workflow-step">2. Configure</p>
                <p className="landing-workflow-copy">Select operations like fill-missing, prediction, and value estimation.</p>
              </li>
              <li className="landing-workflow-item">
                <p className="landing-workflow-step">3. Preview & Export</p>
                <p className="landing-workflow-copy">Review cleaning changes and download polished output instantly.</p>
              </li>
            </ul>
          </div>
        </section>

        <section className="landing-stats-grid">
          <article className="landing-stat-card">
            <p className="landing-stat-value text-sky-200">4</p>
            <p className="landing-stat-label">Supported input formats</p>
          </article>
          <article className="landing-stat-card">
            <p className="landing-stat-value text-emerald-200">100%</p>
            <p className="landing-stat-label">Browser-side processing path</p>
          </article>
          <article className="landing-stat-card">
            <p className="landing-stat-value text-amber-200">2</p>
            <p className="landing-stat-label">Export formats available</p>
          </article>
        </section>
      </main>
    </div>
  )
}
