import { motion } from 'framer-motion'
import { Building2, FileText, Loader2 } from 'lucide-react'

import { WORKFLOW } from '../hooks/useTenderEngine.js'
import { PrimaryButton } from '../components/ui/PrimaryButton.jsx'

function analyzeButtonLabel(workflowState) {
  switch (workflowState) {
    case WORKFLOW.UPLOADING:
      return 'Uploading…'
    case WORKFLOW.VECTORIZING:
      return 'Indexing documents…'
    case WORKFLOW.AGENT_LOOP:
      return 'Analyzing…'
    default:
      return 'Analyze & Generate Proposal'
  }
}

/**
 * Dual upload: government tender + company profile; CTA requires both PDFs.
 */
export function UploadSection({
  workflowState,
  tenderFile,
  profileFile,
  disabled,
  onTenderFileChange,
  onProfileFileChange,
  onAnalyze,
}) {
  const idle = workflowState === WORKFLOW.IDLE
  const processing =
    workflowState === WORKFLOW.UPLOADING ||
    workflowState === WORKFLOW.VECTORIZING ||
    workflowState === WORKFLOW.AGENT_LOOP

  const hasBoth = Boolean(tenderFile && profileFile)
  const canClickAnalyze = hasBoth && idle && !disabled
  const analyzeDisabled = disabled || !idle || !hasBoth

  return (
    <section className="mx-auto w-full max-w-4xl">
      <motion.div
        layout
        className="rounded-2xl border border-tf-border bg-white p-6 shadow-tf-lg sm:p-10"
      >
        <p className="text-center text-xs font-semibold uppercase tracking-wider text-tf-muted">
          Step 1
        </p>
        <h2 className="mt-2 text-center text-xl font-bold text-tf-text sm:text-2xl">
          Upload tender &amp; company profile
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-tf-text-secondary">
          Two PDFs: the public tender and your company credentials. Files are sent to your local
          API only — no third-party cloud in this setup.
        </p>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {/* Zone A — Tender */}
          <label
            className={`relative flex min-h-[200px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-tf-border-strong bg-tf-elevated px-4 py-8 transition-colors hover:border-tf-navy-700 hover:bg-white ${
              processing ? 'pointer-events-none opacity-70' : 'cursor-pointer'
            }`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              if (processing) return
              const f = e.dataTransfer.files?.[0]
              if (f?.type === 'application/pdf') onTenderFileChange?.(f)
            }}
          >
            <input
              type="file"
              accept="application/pdf"
              className="sr-only"
              disabled={processing || disabled}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) onTenderFileChange?.(f)
              }}
            />
            <span className="flex size-14 items-center justify-center rounded-2xl bg-white shadow-tf-md ring-1 ring-tf-border">
              <FileText className="size-7 text-tf-navy-900" aria-hidden />
            </span>
            <p className="mt-3 text-center text-sm font-semibold leading-tight text-tf-text">
              Upload Government Tender (PDF)
            </p>
            <p className="mt-1 text-center text-xs text-tf-muted">Drag &amp; drop or click</p>
            {tenderFile ? (
              <p className="mt-3 w-full truncate px-1 text-center text-xs font-medium text-tf-navy-900">
                {tenderFile.name}
              </p>
            ) : null}
          </label>

          {/* Zone B — Company profile */}
          <label
            className={`relative flex min-h-[200px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-tf-border-strong bg-tf-elevated px-4 py-8 transition-colors hover:border-tf-navy-700 hover:bg-white ${
              processing ? 'pointer-events-none opacity-70' : 'cursor-pointer'
            }`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              if (processing) return
              const f = e.dataTransfer.files?.[0]
              if (f?.type === 'application/pdf') onProfileFileChange?.(f)
            }}
          >
            <input
              type="file"
              accept="application/pdf"
              className="sr-only"
              disabled={processing || disabled}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) onProfileFileChange?.(f)
              }}
            />
            <span className="flex size-14 items-center justify-center rounded-2xl bg-white shadow-tf-md ring-1 ring-tf-border">
              <Building2 className="size-7 text-tf-navy-900" aria-hidden />
            </span>
            <p className="mt-3 text-center text-sm font-semibold leading-tight text-tf-text">
              Upload Company Profile &amp; Tech Stack (PDF)
            </p>
            <p className="mt-1 text-center text-xs text-tf-muted">Drag &amp; drop or click</p>
            {profileFile ? (
              <p className="mt-3 w-full truncate px-1 text-center text-xs font-medium text-tf-navy-900">
                {profileFile.name}
              </p>
            ) : null}
          </label>
        </div>

        <div className="mt-8 flex flex-col items-center gap-3">
          <PrimaryButton
            type="button"
            disabled={analyzeDisabled}
            className="min-h-14 w-full max-w-md px-8 py-4 text-base font-bold shadow-tf-md sm:min-h-[3.5rem] sm:text-lg"
            onClick={() => {
              if (canClickAnalyze) onAnalyze?.()
            }}
          >
            {processing ? (
              <>
                <Loader2 className="size-5 shrink-0 animate-spin" aria-hidden />
                {analyzeButtonLabel(workflowState)}
              </>
            ) : (
              analyzeButtonLabel(workflowState)
            )}
          </PrimaryButton>
          {!hasBoth && idle ? (
            <p className="text-center text-xs text-tf-muted">
              Upload both PDFs above to enable analysis.
            </p>
          ) : null}
        </div>
      </motion.div>
    </section>
  )
}
