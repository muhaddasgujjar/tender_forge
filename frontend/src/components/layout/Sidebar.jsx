import { FileStack, LayoutDashboard, Settings } from 'lucide-react'

const nav = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'library', label: 'Tenders', icon: FileStack },
  { id: 'settings', label: 'Settings', icon: Settings },
]

/**
 * Workspace navigation — use inside desktop column or mobile drawer.
 */
export function Sidebar({ activeId = 'dashboard', className = '' }) {
  return (
    <nav
      aria-label="Workspace"
      className={`flex w-56 max-w-full shrink-0 flex-col border-r border-tf-border bg-tf-surface ${className}`}
    >
      <div className="flex flex-col gap-1 p-3">
        {nav.map((item) => {
          const Icon = item.icon
          const active = item.id === activeId
          return (
            <button
              key={item.id}
              type="button"
              disabled
              title="Navigation wired after routing milestone"
              className={`flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                active
                  ? 'bg-tf-elevated text-tf-navy-900'
                  : 'text-tf-muted hover:bg-tf-elevated hover:text-tf-text-secondary'
              }`}
            >
              <Icon className="size-4 shrink-0 opacity-80" aria-hidden />
              {item.label}
            </button>
          )
        })}
      </div>
      <div className="mx-3 mb-3 rounded-lg border border-dashed border-tf-border bg-tf-elevated p-3 text-xs leading-relaxed text-tf-muted">
        Compliance theater: IDLE → INGESTION → AGENT_LOOP → REVIEW
      </div>
    </nav>
  )
}
