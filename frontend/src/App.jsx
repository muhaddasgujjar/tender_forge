import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'

import { AppHeader } from './components/AppHeader.jsx'
import { Sidebar } from './components/layout/Sidebar.jsx'
import { Card } from './components/ui/Card.jsx'
import { PrimaryButton } from './components/ui/PrimaryButton.jsx'
import { UploadSection } from './features/UploadSection.jsx'
import { BidChatAssistant } from './features/BidChatAssistant.jsx'
import { GenerationStatus } from './features/GenerationStatus.jsx'
import { ResultSection } from './features/ResultSection.jsx'
import { WORKFLOW, useTenderEngine } from './hooks/useTenderEngine.js'

export default function App() {
  const engine = useTenderEngine()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [navMounted, setNavMounted] = useState(false)

  useEffect(() => {
    setNavMounted(true)
  }, [])

  useEffect(() => {
    if (!mobileNavOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [mobileNavOpen])

  const mobileDrawer =
    navMounted &&
    createPortal(
      <AnimatePresence>
        {mobileNavOpen ? (
          <>
            <motion.button
              key="nav-backdrop"
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[200] bg-tf-navy-950/40 backdrop-blur-sm lg:hidden"
              aria-label="Close navigation"
              onClick={() => setMobileNavOpen(false)}
            />
            <motion.div
              key="nav-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Highlights"
              initial={{ x: '-105%' }}
              animate={{ x: 0 }}
              exit={{ x: '-105%' }}
              transition={{ type: 'tween', duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="fixed left-0 top-0 z-[201] flex h-full max-h-[100dvh] w-[min(20rem,calc(100vw-2rem))] flex-col border-r border-tf-border bg-white shadow-[8px_0_32px_-8px_rgba(15,23,42,0.15)] lg:hidden"
            >
              <div className="flex shrink-0 items-center justify-between border-b border-tf-border px-4 py-3">
                <span className="font-display text-sm font-semibold text-tf-text">TenderForge</span>
                <button
                  type="button"
                  className="flex size-11 items-center justify-center rounded-xl border border-tf-border bg-tf-elevated hover:bg-white"
                  aria-label="Close menu"
                  onClick={() => setMobileNavOpen(false)}
                >
                  <X className="size-5" aria-hidden />
                </button>
              </div>
              <Sidebar className="w-full flex-1 overflow-y-auto overscroll-contain border-0 bg-white" />
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>,
      document.body,
    )

  const showError = engine.errorMessage && engine.workflowState === WORKFLOW.ERROR
  const showValidationFailed = engine.workflowState === WORKFLOW.VALIDATION_FAILED

  return (
    <div className="flex min-h-svh flex-col bg-gradient-to-b from-slate-100 via-tf-canvas to-slate-200/90">
      <AppHeader onMobileNavOpen={() => setMobileNavOpen(true)} />

      <div className="relative z-0 flex flex-1 overflow-x-hidden">
        <div className="hidden shrink-0 lg:flex">
          <Sidebar />
        </div>
        {mobileDrawer}

        <main className="relative z-0 mx-auto w-full max-w-6xl flex-1 flex-col px-4 py-10 sm:px-8 sm:py-14 lg:max-w-none lg:flex-1 lg:px-12 xl:max-w-[1400px] xl:px-16">
          <AnimatePresence>
            {showValidationFailed ? (
              <motion.div
                key="validation"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-10"
              >
                <div className="overflow-hidden rounded-2xl border border-amber-700/40 bg-gradient-to-br from-red-950/90 via-red-900/95 to-tf-navy-950 px-6 py-8 shadow-[0_24px_48px_-12px_rgba(127,29,29,0.35)] sm:px-10">
                  <div className="flex flex-col gap-6">
                    <div className="flex items-start gap-4">
                      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/20">
                        <AlertTriangle className="size-7" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-display text-xl font-semibold leading-tight text-white sm:text-2xl">
                          Validation failed — documents not accepted
                        </h3>
                        <p className="mt-3 break-words text-sm leading-relaxed text-slate-200 sm:text-base">
                          {engine.rejectionReason ||
                            'The authenticity check could not validate this tender and company profile pair.'}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-center sm:justify-end">
                      <PrimaryButton
                        type="button"
                        variant="secondary"
                        className="min-h-12 w-full max-w-sm rounded-xl border-white/20 bg-white font-semibold text-tf-navy-950 hover:bg-slate-100 sm:w-auto"
                        onClick={() => engine.reset()}
                      >
                        Start over with new files
                      </PrimaryButton>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : null}
            {showError ? (
              <motion.div
                key="err"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-10"
              >
                <Card className="rounded-2xl border-red-200/90 bg-red-50/95 shadow-tf-md">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <p className="font-display text-xs font-semibold uppercase tracking-wider text-red-900">
                        Connection issue
                      </p>
                      <p className="mt-2 break-words text-sm font-medium text-red-950">
                        {engine.errorMessage}
                      </p>
                      <p className="mt-3 text-xs text-red-900/85">
                        Ensure the API is running:{' '}
                        <code className="break-all rounded-lg bg-white/90 px-2 py-1 font-mono text-[11px] text-red-950">
                          cd backend && uvicorn main:app --reload --port 8000
                        </code>
                      </p>
                    </div>
                    <PrimaryButton
                      type="button"
                      variant="secondary"
                      className="shrink-0 rounded-xl"
                      onClick={() => engine.reset()}
                    >
                      Retry
                    </PrimaryButton>
                  </div>
                </Card>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div className="mx-auto flex w-full max-w-4xl flex-col gap-12 lg:max-w-none lg:gap-16">
            <UploadSection
              workflowState={engine.workflowState}
              tenderFile={engine.tenderFile}
              profileFile={engine.profileFile}
              disabled={engine.isBusy}
              onTenderFileChange={(f) => engine.pickTenderFile(f)}
              onProfileFileChange={(f) => engine.pickProfileFile(f)}
              onAnalyze={() => engine.analyzeProposal()}
            />

            <GenerationStatus workflowState={engine.workflowState} logs={engine.logs} />

            <ResultSection
              workflowState={engine.workflowState}
              auditStatus={engine.auditStatus}
              auditFeedback={engine.auditFeedback}
              revisionCount={engine.revisionCount}
              onDownload={() => engine.downloadProposal()}
              downloading={engine.isBusy}
            />

            {engine.workflowState === WORKFLOW.SUCCESS_REVIEW ? (
              <div className="flex justify-center pb-10">
                <PrimaryButton
                  type="button"
                  variant="secondary"
                  className="rounded-xl px-8 py-3 font-semibold"
                  onClick={() => engine.reset()}
                >
                  New tender run
                </PrimaryButton>
              </div>
            ) : null}
          </div>
        </main>
      </div>

      <BidChatAssistant />
    </div>
  )
}
