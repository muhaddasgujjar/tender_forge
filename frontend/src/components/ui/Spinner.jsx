import { Loader2 } from 'lucide-react'

export function Spinner({ className = '', label = 'Loading' }) {
  return (
    <span className={`inline-flex items-center gap-2 text-tf-muted ${className}`}>
      <Loader2 className="size-5 animate-spin text-tf-navy-800" aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  )
}
