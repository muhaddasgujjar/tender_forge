import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { FileUp, Shield } from 'lucide-react'

import { WORKFLOW } from '../hooks/useTenderEngine.js'
import { Card } from '../components/ui/Card.jsx'
import { Spinner } from '../components/ui/Spinner.jsx'

/**
 * IDLE: pristine dashboard drop zone.
 * INGESTION: progress messaging + animated bar.
 */
export function TenderUploader({
  workflowState,
  selectedFile,
  disabled,
  onFileSelect,
}) {
  const reduceMotion = useReducedMotion()
  const isIdle = workflowState === WORKFLOW.IDLE
  const isIngest = workflowState === WORKFLOW.INGESTION

  const onDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file?.type === 'application/pdf') onFileSelect?.(file)
  }

  const onChange = (e) => {
    const file = e.target.files?.[0]
    if (file) onFileSelect?.(file)
  }

  return (
    <Card className="overflow-hidden">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-tf-muted">
            Secure intake
          </p>
          <h2 className="mt-1 text-lg font-semibold text-tf-text">
            Tender document ingestion
          </h2>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-tf-text-secondary">
            Documents stay on your machine. Processing runs locally against your vector store —
            designed for confidentiality-sensitive procurement workflows.
          </p>
        </div>
        <span className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-tf-border bg-tf-elevated px-3 py-1.5 text-xs font-medium text-tf-muted">
          <Shield className="size-3.5 text-tf-navy-800" aria-hidden />
          Private local analysis
        </span>
      </div>

      <AnimatePresence mode="wait">
        {isIdle ? (
          <motion.label
            key="idle"
            htmlFor="tender-pdf"
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            layout
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            whileHover={reduceMotion ? undefined : { scale: 1.005 }}
            className="relative flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-tf-border-strong bg-tf-elevated px-4 py-12 transition-colors hover:border-tf-navy-700 hover:bg-white sm:px-6 sm:py-14"
          >
            <input
              id="tender-pdf"
              type="file"
              accept="application/pdf"
              className="sr-only"
              disabled={disabled}
              onChange={onChange}
            />
            <motion.span
              className="flex size-14 items-center justify-center rounded-full bg-white shadow-tf-sm ring-1 ring-tf-border"
              animate={
                reduceMotion
                  ? undefined
                  : { boxShadow: ['0 4px 6px -1px rgba(15,23,42,0.08)', '0 8px 16px -4px rgba(15,23,42,0.12)', '0 4px 6px -1px rgba(15,23,42,0.08)'] }
              }
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <FileUp className="size-7 text-tf-navy-900 sm:size-6" aria-hidden />
            </motion.span>
            <p className="mt-4 max-w-lg px-2 text-center text-base font-semibold text-tf-text">
              Drop PPRA Tender Document here for Private Local Analysis.
            </p>
            <p className="mt-2 text-center text-sm text-tf-muted">
              PDF only · Drag-and-drop or tap to browse
            </p>
            {selectedFile ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-6 max-w-full truncate px-2 text-xs font-medium text-tf-text-secondary"
              >
                Selected:{' '}
                <span className="font-semibold text-tf-navy-900">{selectedFile.name}</span>
              </motion.p>
            ) : null}
          </motion.label>
        ) : null}

        {isIngest ? (
          <motion.div
            key="ingest"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.26 }}
            className="rounded-xl border border-tf-border bg-white px-4 py-8 sm:px-6 sm:py-10"
          >
            <div className="flex flex-col items-center gap-4 text-center md:flex-row md:text-left">
              <Spinner label="Parsing document" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-tf-text">
                  Parsing 100+ pages and vectorizing into secure local database…
                </p>
                <p className="mt-1 text-sm text-tf-muted">
                  Embedding with local models · Writing to local Chroma directory
                </p>
                <div className="mt-4 h-2 w-full max-w-xl overflow-hidden rounded-full bg-tf-border">
                  <motion.div
                    className="h-full rounded-full bg-tf-navy-900"
                    initial={{ width: '8%' }}
                    animate={{ width: '92%' }}
                    transition={{
                      duration: reduceMotion ? 0.3 : 3.2,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {!isIdle && !isIngest ? (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-tf-muted"
        >
          Upload zone idle while downstream agents run — follow the live log.
        </motion.p>
      ) : null}
    </Card>
  )
}
