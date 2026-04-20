import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'

import { AppHeader } from './components/AppHeader.jsx'
import { Sidebar } from './components/layout/Sidebar.jsx'
import { Card } from './components/ui/Card.jsx'
import { PrimaryButton } from './components/ui/PrimaryButton.jsx'
import { UploadSection } from './features/UploadSection.jsx'
import { AgentTheater } from './features/AgentTheater.jsx'
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
              className="fixed inset-0 z-[200] bg-slate-900/50 backdrop-blur-[2px] lg:hidden"
              aria-label="Close navigation"
              onClick={() => setMobileNavOpen(false)}
            />
            <motion.div
              key="nav-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Workspace"
              initial={{ x: '-105%' }}
              animate={{ x: 0 }}
              exit={{ x: '-105%' }}
              transition={{ type: 'tween', duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="fixed left-0 top-0 z-[201] flex h-full max-h-[100dvh] w-[min(20rem,calc(100vw-2rem))] flex-col border-r border-tf-border bg-tf-surface shadow-tf-lg lg:hidden"
            >
              <div className="flex shrink-0 items-center justify-between border-b border-tf-border px-4 py-3">
                <span className="text-sm font-semibold text-tf-text">Workspace</span>
                <button
                  type="button"
                  className="flex size-11 items-center justify-center rounded-lg border border-tf-border bg-tf-elevated hover:bg-white"
                  aria-label="Close menu"
                  onClick={() => setMobileNavOpen(false)}
                >
                  <X className="size-5" aria-hidden />
                </button>
              </div>
              <Sidebar className="w-full flex-1 overflow-y-auto overscroll-contain border-0" />
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>,
      document.body,
    )

  const showError = engine.errorMessage && engine.workflowState === WORKFLOW.ERROR
  const showValidationFailed = engine.workflowState === WORKFLOW.VALIDATION_FAILED

  return (
    <div className="flex min-h-svh flex-col bg-gradient-to-b from-tf-canvas to-slate-100/80">
      <AppHeader onMobileNavOpen={() => setMobileNavOpen(true)} />

      <div className="relative z-0 flex flex-1 overflow-x-hidden">
        <div className="hidden shrink-0 lg:flex">
          <Sidebar />
        </div>
        {mobileDrawer}

        <main className="relative z-0 mx-auto w-full max-w-5xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
          <AnimatePresence>
            {showValidationFailed ? (
              <motion.div
                key="validation"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-8"
              >
                <div className="overflow-hidden rounded-2xl border-2 border-amber-600/80 bg-gradient-to-br from-red-50 via-amber-50 to-amber-100/90 shadow-tf-lg ring-1 ring-red-200/60">
                  <div className="flex flex-col gap-4 p-6 sm:p-8">
                    <div className="flex items-start gap-4">
                      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white shadow-md">
                        <AlertTriangle className="size-7" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-xl font-extrabold leading-tight text-red-950 sm:text-2xl">
                          Validation Failed: Invalid Documents Detected
                        </h3>
                        <p className="mt-3 break-words text-sm leading-relaxed text-red-950/90 sm:text-base">
                          {engine.rejectionReason || 'The gatekeeper could not accept these files as a valid tender and company profile pair.'}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-center sm:justify-end">
                      <PrimaryButton
                        type="button"
                        variant="secondary"
                        className="min-h-12 w-full max-w-sm font-semibold sm:w-auto"
                        onClick={() => engine.reset()}
                      >
                        Reset and Upload New Documents
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
                className="mb-8"
              >
                <Card className="border-red-200 bg-red-50/95">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wider text-red-800">
                        Something went wrong
                      </p>
                      <p className="mt-1 break-words text-sm font-medium text-red-900">
                        {engine.errorMessage}
                      </p>
                      <p className="mt-2 text-xs text-red-800/90">
                        Start the API:{' '}
                        <code className="break-all rounded bg-white/80 px-1 py-0.5 font-mono text-[11px]">
                          cd backend && uvicorn main:app --reload --port 8000
                        </code>
                      </p>
                    </div>
                    <PrimaryButton
                      type="button"
                      variant="secondary"
                      className="shrink-0"
                      onClick={() => engine.reset()}
                    >
                      Try again
                    </PrimaryButton>
                  </div>
                </Card>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div className="flex flex-col gap-12 sm:gap-16 lg:gap-20">
            <UploadSection
              workflowState={engine.workflowState}
              tenderFile={engine.tenderFile}
              profileFile={engine.profileFile}
              disabled={engine.isBusy}
              onTenderFileChange={(f) => engine.pickTenderFile(f)}
              onProfileFileChange={(f) => engine.pickProfileFile(f)}
              onAnalyze={() => engine.analyzeProposal()}
            />

            <AgentTheater
              workflowState={engine.workflowState}
              pdfLoaded={engine.pdfLoaded}
              activeAgent={engine.activeAgent}
              revisionCount={engine.revisionCount}
            />

            <ResultSection
              workflowState={engine.workflowState}
              auditStatus={engine.auditStatus}
              auditFeedback={engine.auditFeedback}
              revisionCount={engine.revisionCount}
              onDownload={() => engine.downloadProposal()}
              downloading={engine.isBusy}
            />

            {engine.workflowState === WORKFLOW.SUCCESS_REVIEW ? (
              <div className="flex justify-center pb-8">
                <PrimaryButton type="button" variant="secondary" onClick={() => engine.reset()}>
                  Analyze another tender
                </PrimaryButton>
              </div>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  )
}
