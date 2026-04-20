import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Gavel, Layers, Sparkles } from 'lucide-react'

import { WORKFLOW } from '../hooks/useTenderEngine.js'
import { Card } from '../components/ui/Card.jsx'

const AGENTS = [
  {
    key: 'extractor',
    label: 'Extractor Agent',
    hint: 'Reading requirements…',
    Icon: Layers,
    dot: 'bg-tf-accent-blue',
    ring: 'ring-blue-100',
  },
  {
    key: 'generator',
    label: 'Generator Agent',
    hint: 'Drafting compliance matrix…',
    Icon: Sparkles,
    dot: 'bg-tf-accent-amber',
    ring: 'ring-amber-100',
  },
  {
    key: 'auditor',
    label: 'Auditor Agent',
    hint: 'Validating against PPRA law…',
    Icon: Gavel,
    dot: 'bg-tf-accent-red',
    ring: 'ring-red-100',
  },
]

const listParent = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06, delayChildren: 0.02 },
  },
}

const logItem = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } },
}

/**
 * AGENT_LOOP theater: terminal-style feed + explicit active-agent emphasis.
 * Keeps log visible after completion for review.
 */
export function AgentLiveLog({
  workflowState,
  logs,
  activeAgent,
  revisionCount,
}) {
  const reduceMotion = useReducedMotion()
  const running = workflowState === WORKFLOW.AGENT_LOOP
  const showTheater =
    running ||
    workflowState === WORKFLOW.SUCCESS_REVIEW ||
    workflowState === WORKFLOW.ERROR ||
    workflowState === WORKFLOW.INGESTION

  const dimmed = !running && workflowState !== WORKFLOW.IDLE

  return (
    <Card
      className={`transition-opacity duration-300 ${dimmed ? 'opacity-95' : ''} ${
        !showTheater && workflowState === WORKFLOW.IDLE ? 'opacity-80' : ''
      }`}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-tf-muted">
            Agent theater
          </p>
          <h3 className="mt-1 text-lg font-semibold text-tf-text">Live compliance run</h3>
        </div>
        <motion.div
          layout
          className="rounded-full border border-tf-border bg-tf-elevated px-3 py-1.5 text-xs font-semibold text-tf-text-secondary"
        >
          Revisions tracked:{' '}
          <span className="font-bold text-tf-navy-900">{revisionCount}</span>
        </motion.div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,18rem)]">
        <div className="min-h-0 overflow-hidden rounded-lg border border-tf-terminal-border bg-tf-terminal-bg shadow-inner">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-3 py-2 text-[11px] font-medium uppercase tracking-widest text-tf-terminal-dim sm:px-4">
            <span className="truncate">tenderforge — session</span>
            <span className="shrink-0 rounded bg-white/5 px-2 py-0.5 font-mono text-[10px] text-tf-terminal-dim">
              local
            </span>
          </div>
          <div className="max-h-[min(18rem,50vh)] space-y-2 overflow-y-auto overscroll-contain px-3 py-3 font-mono text-[12px] leading-relaxed sm:max-h-72 sm:px-4 sm:text-[13px]">
            <AnimatePresence initial={false} mode="popLayout">
              {logs.length === 0 ? (
                <motion.p
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-tf-terminal-dim"
                >
                  {running
                    ? 'Waiting for agent events…'
                    : 'Agent output will stream here during the run.'}
                </motion.p>
              ) : (
                <motion.div
                  key="lines"
                  variants={reduceMotion ? undefined : listParent}
                  initial="hidden"
                  animate="show"
                  className="space-y-2"
                >
                  {logs.map((line) => (
                    <motion.div
                      key={line.id}
                      variants={reduceMotion ? undefined : logItem}
                      layout={!reduceMotion}
                      className="flex gap-2 text-slate-200"
                    >
                      <span className="shrink-0 text-[10px] text-slate-500 sm:text-[11px]">
                        {new Date(line.at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                      <span className="min-w-0 break-words text-slate-100">{line.text}</span>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <motion.aside
          className="space-y-3 lg:sticky lg:top-24 lg:self-start"
          variants={reduceMotion ? undefined : listParent}
          initial="hidden"
          animate="show"
        >
          {AGENTS.map((a, idx) => {
            const active = running && activeAgent === a.key
            const Icon = a.Icon
            return (
              <motion.div
                key={a.key}
                custom={idx}
                variants={reduceMotion ? undefined : logItem}
                layout
                className={`relative overflow-hidden rounded-xl border bg-white px-4 py-3 shadow-tf-sm transition-shadow ${
                  active ? `border-tf-navy-900 ring-2 ${a.ring}` : 'border-tf-border'
                }`}
              >
                {active ? (
                  <div
                    className={`pointer-events-none absolute inset-0 ${
                      a.key === 'extractor'
                        ? 'bg-blue-500/[0.06]'
                        : a.key === 'generator'
                          ? 'bg-amber-500/[0.06]'
                          : 'bg-red-500/[0.06]'
                    }`}
                  />
                ) : null}
                <div className="relative flex items-start gap-3">
                  <span className="relative mt-1.5 shrink-0">
                    <span
                      className={`block size-2.5 rounded-full ${a.dot}`}
                      aria-hidden
                    />
                    {active && !reduceMotion ? (
                      <motion.span
                        className={`absolute inset-0 rounded-full ${a.dot} opacity-40`}
                        animate={{ scale: [1, 1.5, 1], opacity: [0.35, 0, 0.35] }}
                        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    ) : null}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Icon className="size-4 shrink-0 text-tf-navy-900" aria-hidden />
                      <p className="text-sm font-semibold text-tf-text">{a.label}</p>
                    </div>
                    <p className="mt-0.5 text-xs text-tf-muted">{a.hint}</p>
                    {a.key === 'auditor' ? (
                      <p className="mt-2 text-xs font-semibold text-tf-text-secondary">
                        Revision count:{' '}
                        <motion.span
                          key={revisionCount}
                          initial={reduceMotion ? false : { opacity: 0.5, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="inline-block font-bold text-tf-navy-900"
                        >
                          {revisionCount}
                        </motion.span>
                      </p>
                    ) : null}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.aside>
      </div>

      {workflowState === WORKFLOW.IDLE ? (
        <p className="mt-4 text-xs text-tf-muted">
          Upload a tender PDF to begin — the agent theater activates during extraction and drafting.
        </p>
      ) : null}
    </Card>
  )
}
