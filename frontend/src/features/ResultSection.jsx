import { motion } from 'framer-motion'
import { AlertTriangle, Download, FileText } from 'lucide-react'

import { WORKFLOW } from '../hooks/useTenderEngine.js'
import { PrimaryButton } from '../components/ui/PrimaryButton.jsx'
import { StatusBadge } from '../components/ui/StatusBadge.jsx'

/**
 * Section D — audit outcome, doc preview, manual-review warning, download.
 */
export function ResultSection({
  workflowState,
  auditStatus,
  auditFeedback,
  revisionCount,
  onDownload,
  downloading,
}) {
  const visible = workflowState === WORKFLOW.SUCCESS_REVIEW
  if (!visible) return null

  const pass = auditStatus === 'PASS'
  const warnManual = !pass && revisionCount >= 3

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto w-full max-w-2xl"
    >
      <p className="text-center text-xs font-semibold uppercase tracking-wider text-tf-muted">
        Step 3
      </p>
      <h2 className="mt-2 text-center text-xl font-bold text-tf-text sm:text-2xl">
        Your technical proposal
      </h2>

      <div className="mt-8 rounded-2xl border border-tf-border bg-white p-6 shadow-tf-lg sm:p-8">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left">
            <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-tf-elevated ring-1 ring-tf-border">
              <FileText className="size-10 text-tf-navy-900" aria-hidden />
            </div>
            <div className="mt-4 sm:ml-6 sm:mt-0">
              <p className="text-sm font-semibold text-tf-text">Final_Proposal.docx</p>
              <p className="mt-1 text-xs text-tf-muted">Generated locally from your tender</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                <StatusBadge
                  variant={pass ? 'success' : 'danger'}
                  label={pass ? 'Audit: Pass' : 'Audit: Fail'}
                />
              </div>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-sm leading-relaxed text-tf-text-secondary sm:text-left">
          {pass
            ? 'The automated audit indicates required checklist items are addressed. Review the Word document before official submission.'
            : auditFeedback ||
              'The audit flagged gaps versus the extracted requirements. Review feedback and revise if needed.'}
        </p>

        {warnManual ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-6 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950"
          >
            <AlertTriangle className="size-6 shrink-0 text-amber-600" aria-hidden />
            <div>
              <p className="font-semibold">Manual review recommended</p>
              <p className="mt-1 text-sm text-amber-900/90">
                Maximum revision cycles were reached and the audit still did not pass. Have a bid
                manager verify the proposal before submission.
              </p>
            </div>
          </motion.div>
        ) : null}

        <div className="mt-8 flex flex-col items-stretch gap-3 sm:items-center">
          <PrimaryButton
            type="button"
            disabled={downloading}
            className="min-h-14 w-full px-8 py-4 text-base font-bold sm:max-w-md"
            onClick={() => onDownload?.()}
          >
            <Download className="size-5" aria-hidden />
            Download Final Proposal (.docx)
          </PrimaryButton>
        </div>
      </div>
    </motion.section>
  )
}
