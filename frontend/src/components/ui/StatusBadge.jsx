import { CheckCircle2, XCircle } from 'lucide-react'

/**
 * Audit outcome badge — emerald for pass, restrained red for fail.
 */
export function StatusBadge({ variant = 'neutral', label }) {
  const styles =
    variant === 'success'
      ? 'border border-tf-success-border bg-tf-success-bg text-tf-success'
      : variant === 'danger'
        ? 'border border-red-200 bg-red-50 text-red-800'
        : variant === 'warning'
          ? 'border border-tf-warning-border bg-tf-warning-bg text-tf-warning'
          : 'border border-tf-border bg-tf-elevated text-tf-text-secondary'

  const Icon =
    variant === 'success'
      ? CheckCircle2
      : variant === 'danger'
        ? XCircle
        : null

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${styles}`}
    >
      {Icon ? <Icon className="size-3.5" aria-hidden /> : null}
      {label}
    </span>
  )
}
