import { motion } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'

/**
 * Section A — brand + trustworthy “Private & Local AI” status.
 */
export function AppHeader({ onMobileNavOpen }) {
  return (
    <header className="sticky top-0 z-50 border-b border-tf-border bg-tf-surface/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
          {typeof onMobileNavOpen === 'function' ? (
            <button
              type="button"
              className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-tf-border bg-tf-elevated text-tf-navy-900 shadow-tf-sm hover:bg-white lg:hidden"
              aria-label="Open menu"
              onClick={onMobileNavOpen}
            >
              <span className="sr-only">Menu</span>
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          ) : null}
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-tf-navy-950 text-white shadow-tf-md">
            <ShieldCheck className="size-6" aria-hidden />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold tracking-tight text-tf-text sm:text-xl">
              TenderForge PK
            </h1>
            <p className="truncate text-xs text-tf-muted sm:text-sm">
              Government tender compliance — private & local
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 rounded-full border border-tf-border bg-white px-3 py-1.5 shadow-tf-sm sm:gap-3 sm:px-4 sm:py-2">
          <span className="relative flex size-2.5 sm:size-3">
            <motion.span
              className="absolute inline-flex size-full rounded-full bg-emerald-500 opacity-75"
              animate={{ scale: [1, 1.4, 1], opacity: [0.7, 0, 0.7] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500 sm:size-3" />
          </span>
          <span className="hidden text-xs font-semibold text-tf-slate-800 sm:inline sm:text-sm">
            Private & Local AI
          </span>
          <span className="text-xs font-semibold text-tf-slate-800 sm:hidden">Local AI</span>
        </div>
      </div>
    </header>
  )
}
