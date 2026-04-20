import { motion } from 'framer-motion'
import { Menu, ShieldCheck } from 'lucide-react'

export function Navbar({
  title = 'TenderForge PK',
  subtitle = 'Private local · PPRA-aligned',
  onMobileNavOpen,
}) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="sticky top-0 z-50 border-b border-tf-border bg-tf-surface/95 backdrop-blur-sm"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:gap-6 md:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-3">
          {typeof onMobileNavOpen === 'function' ? (
            <button
              type="button"
              className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-tf-border bg-tf-elevated text-tf-navy-900 hover:bg-white lg:hidden"
              aria-label="Open navigation menu"
              onClick={onMobileNavOpen}
            >
              <Menu className="size-5" aria-hidden />
            </button>
          ) : null}
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-tf-navy-950 text-white shadow-tf-sm">
            <ShieldCheck className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 text-left">
            <p className="truncate text-sm font-semibold tracking-tight text-tf-text">{title}</p>
            <p className="truncate text-xs text-tf-muted">{subtitle}</p>
          </div>
        </div>
        <div className="hidden shrink-0 text-right text-xs text-tf-muted sm:block">
          <div className="font-medium text-tf-text-secondary">Enterprise workflow</div>
          <div className="hidden md:block">Local execution · No cloud PDF egress</div>
        </div>
      </div>
    </motion.header>
  )
}
