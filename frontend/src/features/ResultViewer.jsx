import { motion } from 'framer-motion'
import { Download } from 'lucide-react'

import { WORKFLOW } from '../hooks/useTenderEngine.js'
import { Card } from '../components/ui/Card.jsx'
import { PrimaryButton } from '../components/ui/PrimaryButton.jsx'
import { StatusBadge } from '../components/ui/StatusBadge.jsx'

/**
 * SUCCESS / REVIEW — audit badge, revision summary, docx retrieval.
 */
export function ResultViewer({
  workflowState,
  auditStatus,
  revisionCount,
  onDownload,
  downloading,
}) {
  const visible = workflowState === WORKFLOW.SUCCESS_REVIEW

  if (!visible) return null

  const pass = auditStatus === 'PASS'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      layout
    >
      <Card>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-tf-muted">
              Compliance outcome
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h3 className="text-lg font-semibold text-tf-text sm:text-xl">
                Technical proposal ready
              </h3>
              <motion.div layout transition={{ type: 'spring', stiffness: 380, damping: 28 }}>
                <StatusBadge
                  variant={pass ? 'success' : 'danger'}
                  label={pass ? 'Audit: Pass' : 'Audit: Fail'}
                />
              </motion.div>
            </div>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-tf-text-secondary">
              The auditor&apos;s verdict reflects structured extraction against your checklist.
              Review the Word export before submission.
            </p>
            <p className="mt-4 text-sm font-medium text-tf-text-secondary">
              AI revision cycles to reach this draft:{' '}
              <span className="font-bold text-tf-navy-900">{revisionCount}</span>
            </p>
          </div>

          <div className="flex w-full min-w-0 shrink-0 flex-col gap-3 sm:max-w-md lg:w-auto lg:items-end">
            <PrimaryButton
              type="button"
              className="min-h-[52px] w-full px-6 py-3 text-base sm:min-w-[260px] lg:w-auto lg:min-w-[280px]"
              disabled={downloading}
              onClick={onDownload}
            >
              <Download className="size-5 shrink-0" aria-hidden />
              Download Technical Proposal (.docx)
            </PrimaryButton>
            <p className="text-center text-xs text-tf-muted lg:text-right">
              Exported from your local engine · No third-party document storage
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
