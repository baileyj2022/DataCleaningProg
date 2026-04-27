// Reusable spinner; fullScreen mode adds an overlay so loading is impossible to miss.
export function LoadingSpinner({ label = 'Processing...', fullScreen = false }) {
    return (
        <div
            className={
                fullScreen
                    ? 'fixed inset-0 z-[9999] grid place-items-center bg-slate-950/65 backdrop-blur-sm'
                    : ''
            }
            role="status"
            aria-live="polite"
        >
            <div className="mt-3 inline-flex items-center gap-3 rounded-lg border border-sky-300/55 bg-sky-500/20 px-4 py-3 text-sm font-semibold text-sky-100 shadow-lg shadow-sky-500/20">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-sky-200/30 border-t-white" aria-hidden="true" />
                <span>{label}</span>
            </div>
        </div>
    )
}

export default LoadingSpinner