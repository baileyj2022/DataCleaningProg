export function AppShell({ children, maxWidth = 'max-w-6xl' }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_5%,rgba(56,172,255,0.2),transparent_36%),radial-gradient(circle_at_85%_90%,rgba(23,213,147,0.15),transparent_30%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:48px_48px]"
      />
      <main className={`relative z-10 mx-auto w-full ${maxWidth} px-6 pb-16 pt-10 sm:px-10 lg:px-12`}>{children}</main>
    </div>
  )
}

export function WorkflowLayout({
  title,
  eyebrow = 'Automated Data Cleaner',
  backLabel,
  onBack,
  rightAction,
  contentClassName = 'mt-10',
  children,
}) {
  return (
    <AppShell maxWidth="max-w-5xl">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">{eyebrow}</p>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{title}</h1>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          {backLabel && onBack && (
            <button
              type="button"
              onClick={onBack}
              className="rounded-lg border border-sky-300/30 bg-sky-500/10 px-4 py-2 text-sm font-medium text-sky-200 transition hover:border-sky-200/60 hover:bg-sky-500/20"
            >
              {backLabel}
            </button>
          )}
          {rightAction}
        </div>
      </header>

      <section className={contentClassName}>{children}</section>
    </AppShell>
  )
}

export function WorkflowPanel({ title, subtitle, action, className = '', children }) {
  return (
    <section className={`rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-2xl backdrop-blur ${className}`}>
      {(title || action || subtitle) && (
        <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-lg font-semibold text-white">{title}</h2>}
            {subtitle && <p className="mt-1 text-sm text-slate-300">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  )
}

export function ToneBanner({ tone = 'info', className = '', children }) {
  const tones = {
    info: 'border-sky-300/35 bg-sky-500/10 text-sky-100',
    success: 'border-emerald-300/35 bg-emerald-500/10 text-emerald-100',
    error: 'border-rose-300/35 bg-rose-500/10 text-rose-100',
    warning: 'border-amber-300/35 bg-amber-500/10 text-amber-100',
  }

  return <div className={`rounded-lg border px-4 py-3 text-sm ${tones[tone] || tones.info} ${className}`}>{children}</div>
}
