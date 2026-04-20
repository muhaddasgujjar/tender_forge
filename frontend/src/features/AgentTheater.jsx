import { AnimatePresence, motion } from 'framer-motion'
import {
  CheckCircle2,
  FileCheck2,
  Loader2,
  ScanSearch,
  Scale,
  Sparkles,
  FileOutput,
} from 'lucide-react'

import { WORKFLOW } from '../hooks/useTenderEngine.js'

/**
 * Section C — timeline + live agent emphasis (streams from backend).
 */
export function AgentTheater({
  workflowState,
  pdfLoaded,
  activeAgent,
  revisionCount,
}) {
  const idle = workflowState === WORKFLOW.IDLE
  const uploading = workflowState === WORKFLOW.UPLOADING
  const vectorizing = workflowState === WORKFLOW.VECTORIZING
  const agents = workflowState === WORKFLOW.AGENT_LOOP

  if (workflowState === WORKFLOW.VALIDATION_FAILED) {
    return null
  }

  if (idle) {
    return (
      <section className="mx-auto max-w-3xl rounded-2xl border border-dashed border-tf-border bg-tf-elevated/50 px-4 py-10 text-center text-sm text-tf-muted">
        Step 2 — Agent progress will appear here after you start analysis.
      </section>
    )
  }

  const pdfDone = pdfLoaded || (!uploading && !idle)
  const ingestActive = uploading || vectorizing

  return (
    <section className="mx-auto w-full max-w-3xl">
      <p className="text-center text-xs font-semibold uppercase tracking-wider text-tf-muted">
        Step 2
      </p>
      <h2 className="mt-2 text-center text-xl font-bold text-tf-text sm:text-2xl">
        AI compliance workflow
      </h2>
      <p className="mx-auto mt-2 max-w-lg text-center text-sm text-tf-text-secondary">
        Live stages from your local engine — no cloud processing.
      </p>

      <ol className="relative mt-10 space-y-0">
        <div
          className="absolute bottom-3 left-[1.15rem] top-3 w-px bg-tf-border sm:left-6"
          aria-hidden
        />

        {/* PDF loaded */}
        <TimelineRow
          active={pdfDone && !ingestActive}
          done={pdfDone}
          icon={
            pdfDone ? (
              <CheckCircle2 className="size-5 text-emerald-600 sm:size-6" />
            ) : (
              <FileCheck2 className="size-4 opacity-40 sm:size-5" />
            )
          }
          title="PDF loaded"
          subtitle={pdfDone ? 'Document received securely.' : 'Waiting…'}
        />

        {/* Ingesting */}
        <TimelineRow
          active={ingestActive}
          done={agents || workflowState === WORKFLOW.SUCCESS_REVIEW}
          icon={
            ingestActive ? (
              <Loader2 className="size-4 animate-spin text-tf-navy-900 sm:size-5" />
            ) : (
              <Loader2 className="size-4 opacity-30 sm:size-5" />
            )
          }
          title="Ingesting"
          subtitle="Parsing and vectorizing into your local database…"
        />

        {/* Agents */}
        <AgentRow
          emoji="🔵"
          title="Extractor Agent"
          subtitle="Reading rules…"
          Icon={ScanSearch}
          isActive={agents && activeAgent === 'extractor'}
          dim={agents && activeAgent && activeAgent !== 'extractor'}
        />
        <AgentRow
          emoji="🟡"
          title="Generator Agent"
          subtitle="Drafting technical matrix…"
          Icon={Sparkles}
          isActive={agents && activeAgent === 'generator'}
          dim={agents && activeAgent && activeAgent !== 'generator'}
        />
        <AgentRow
          emoji="🔴"
          title="Auditor Agent"
          subtitle="Validating compliance…"
          Icon={Scale}
          isActive={agents && activeAgent === 'auditor'}
          dim={agents && activeAgent && activeAgent !== 'auditor'}
          extra={
            agents ? (
              <motion.span
                key={revisionCount}
                initial={{ opacity: 0.6 }}
                animate={{ opacity: 1 }}
                className="mt-2 inline-block rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-900 ring-1 ring-amber-200"
              >
                Revisions: {revisionCount}
              </motion.span>
            ) : null
          }
        />

        {/* Final export */}
        <TimelineRow
          active={agents && activeAgent === 'export'}
          done={
            workflowState === WORKFLOW.SUCCESS_REVIEW ||
            (agents && activeAgent === 'export')
          }
          icon={<FileOutput className="size-5 text-tf-navy-900 sm:size-6" />}
          title="Final review"
          subtitle="Finalizing proposal file…"
          emphasize={agents && activeAgent === 'export'}
        />
      </ol>

    </section>
  )
}

function TimelineRow({ active, done, icon, title, subtitle, emphasize = false }) {
  return (
    <motion.li
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className="relative flex gap-4 pb-10 pl-1 sm:gap-6 sm:pl-2"
    >
      <div
        className={`relative z-[1] flex size-9 shrink-0 items-center justify-center rounded-full border-2 bg-white sm:size-12 ${
          active || emphasize || done ? 'border-tf-navy-900 shadow-tf-md' : 'border-tf-border'
        }`}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1 pt-1">
        <h3 className={`font-semibold ${done || active ? 'text-tf-navy-950' : 'text-tf-muted'}`}>
          {title}
        </h3>
        <p className="mt-1 text-sm text-tf-text-secondary">{subtitle}</p>
      </div>
    </motion.li>
  )
}

function AgentRow({ emoji, title, subtitle, Icon, isActive, dim, extra }) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: dim ? 0.55 : 1, x: 0 }}
      className={`relative flex gap-4 pb-10 pl-1 sm:gap-6 sm:pl-2 ${isActive ? 'scale-[1.01]' : ''}`}
    >
      <div
        className={`relative z-[1] flex size-9 shrink-0 items-center justify-center rounded-full border-2 bg-white sm:size-12 ${
          isActive ? 'border-tf-navy-900 shadow-tf-md ring-2 ring-blue-100' : 'border-tf-border'
        }`}
      >
        <Icon className={`size-4 sm:size-5 ${isActive ? 'text-tf-navy-900' : 'text-tf-muted'}`} />
      </div>
      <div className="min-w-0 flex-1 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-lg" aria-hidden>
            {emoji}
          </span>
          <h3 className={`font-semibold ${isActive ? 'text-tf-navy-950' : 'text-tf-muted'}`}>
            {title}
          </h3>
        </div>
        <AnimatePresence mode="wait">
          {isActive ? (
            <motion.p
              key="sub"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1 text-sm text-tf-text-secondary"
            >
              {subtitle}
            </motion.p>
          ) : (
            <p className="mt-1 text-sm text-tf-muted/90">{subtitle}</p>
          )}
        </AnimatePresence>
        {extra}
      </div>
    </motion.li>
  )
}
