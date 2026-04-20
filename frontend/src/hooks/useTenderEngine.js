import { useCallback, useMemo, useState } from 'react'

import {
  downloadFinalProposal,
  generateProposal,
  getRunStatus,
  uploadPdfs,
  streamEngineEvents,
} from '../services/api.js'

/** @typedef {'IDLE' | 'UPLOADING' | 'VECTORIZING' | 'AGENT_LOOP' | 'SUCCESS_REVIEW' | 'VALIDATION_FAILED' | 'ERROR'} WorkflowState */

/** @typedef {'extractor' | 'generator' | 'auditor' | 'export' | null} ActiveAgent */

export const WORKFLOW = {
  IDLE: /** @type {const} */ ('IDLE'),
  UPLOADING: /** @type {const} */ ('UPLOADING'),
  VECTORIZING: /** @type {const} */ ('VECTORIZING'),
  AGENT_LOOP: /** @type {const} */ ('AGENT_LOOP'),
  SUCCESS_REVIEW: /** @type {const} */ ('SUCCESS_REVIEW'),
  VALIDATION_FAILED: /** @type {const} */ ('VALIDATION_FAILED'),
  ERROR: /** @type {const} */ ('ERROR'),
}

const initialLog = () => []

function newLogId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function mapStreamEventToLogLine(evt) {
  if (!evt || typeof evt !== 'object') {
    return { agent: /** @type {const} */ ('extractor'), text: '…' }
  }
  const step = String(evt.step ?? '').toLowerCase()
  const msg = evt.message ?? ''
  if (step.includes('extract') || step === 'extractor_node')
    return { agent: /** @type {const} */ ('extractor'), text: msg || 'Reading rules…' }
  if (step.includes('generat') || step === 'generator_node')
    return { agent: /** @type {const} */ ('generator'), text: msg || 'Drafting technical matrix…' }
  if (step.includes('audit') || step === 'auditor_node')
    return { agent: /** @type {const} */ ('auditor'), text: msg || 'Validating compliance…' }
  if (step.includes('export') || step === 'export_node')
    return { agent: /** @type {const} */ ('export'), text: msg || 'Finalizing proposal file…' }
  if (step.includes('gatekeeper') || step === 'gatekeeper_node')
    return { agent: /** @type {const} */ ('extractor'), text: msg || 'Verifying documents…' }
  return { agent: /** @type {const} */ ('extractor'), text: msg || JSON.stringify(evt) }
}

export function useTenderEngine() {
  const [workflowState, setWorkflowState] = useState(
    /** @type {WorkflowState} */ (WORKFLOW.IDLE),
  )

  const [tenderFile, setTenderFile] = useState(/** @type {File | null} */ (null))
  const [profileFile, setProfileFile] = useState(/** @type {File | null} */ (null))
  const [runId, setRunId] = useState(/** @type {string | null} */ (null))
  const [pdfLoaded, setPdfLoaded] = useState(false)

  const [activeAgent, setActiveAgent] = useState(/** @type {ActiveAgent} */ (null))
  const [revisionCount, setRevisionCount] = useState(0)
  const [auditStatus, setAuditStatus] = useState(/** @type {'PASS' | 'FAIL' | null} */ (null))
  const [auditFeedback, setAuditFeedback] = useState('')

  const [logs, setLogs] = useState(initialLog)
  const [errorMessage, setErrorMessage] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [isBusy, setIsBusy] = useState(false)

  const appendLog = useCallback((agent, text) => {
    setLogs((prev) => [
      ...prev,
      { id: newLogId(), agent, text, at: Date.now() },
    ])
  }, [])

  const reset = useCallback(() => {
    setWorkflowState(WORKFLOW.IDLE)
    setTenderFile(null)
    setProfileFile(null)
    setRunId(null)
    setPdfLoaded(false)
    setActiveAgent(null)
    setRevisionCount(0)
    setAuditStatus(null)
    setAuditFeedback('')
    setLogs(initialLog())
    setErrorMessage('')
    setRejectionReason('')
    setIsBusy(false)
  }, [])

  const pickTenderFile = useCallback((file) => {
    if (!file || file.type !== 'application/pdf') {
      setErrorMessage('Tender: please choose a PDF file.')
      return
    }
    setErrorMessage('')
    setTenderFile(file)
    setPdfLoaded(false)
    setRunId(null)
  }, [])

  const pickProfileFile = useCallback((file) => {
    if (!file || file.type !== 'application/pdf') {
      setErrorMessage('Company profile: please choose a PDF file.')
      return
    }
    setErrorMessage('')
    setProfileFile(file)
    setPdfLoaded(false)
    setRunId(null)
  }, [])

  const analyzeProposal = useCallback(async () => {
    const t = tenderFile
    const p = profileFile
    if (!t || !p) return

    setIsBusy(true)
    setErrorMessage('')
    setRejectionReason('')
    setLogs(initialLog())
    setAuditStatus(null)
    setAuditFeedback('')
    setRevisionCount(0)
    setPdfLoaded(false)
    setActiveAgent(null)
    setRunId(null)

    try {
      setWorkflowState(WORKFLOW.UPLOADING)
      const up = await uploadPdfs(t, p)
      const rid = up.data?.run_id
      if (!rid) throw new Error('Upload did not return run_id.')
      setRunId(rid)
      setPdfLoaded(true)

      setWorkflowState(WORKFLOW.VECTORIZING)
      const genRes = await generateProposal({ run_id: rid, filename: t.name })
      const genData = genRes.data ?? {}
      if (genData.status === 'rejected') {
        setRejectionReason(
          String(genData.reason ?? 'These documents were rejected by the gatekeeper.'),
        )
        setWorkflowState(WORKFLOW.VALIDATION_FAILED)
        setActiveAgent(null)
        return
      }

      setWorkflowState(WORKFLOW.AGENT_LOOP)
      appendLog('extractor', '🔵 Extractor Agent: Reading rules…')

      await streamEngineEvents(rid, (evt) => {
        const step = String(evt.step ?? '').toLowerCase()
        if (step === 'done') return
        if (step === 'error') {
          throw new Error(evt.message ?? 'Engine error')
        }
        const mapped = mapStreamEventToLogLine(evt)
        if (mapped.agent === 'extractor') setActiveAgent('extractor')
        else if (mapped.agent === 'generator') setActiveAgent('generator')
        else if (mapped.agent === 'auditor') setActiveAgent('auditor')
        else if (mapped.agent === 'export') setActiveAgent('export')
        appendLog(mapped.agent, mapped.text)
        if (typeof evt.revision_count === 'number') setRevisionCount(evt.revision_count)
        if (evt.audit_status === 'PASS' || evt.audit_status === 'FAIL')
          setAuditStatus(evt.audit_status)
      })

      const summary = await getRunStatus(rid)
      const payload = summary.data ?? {}
      if (payload.status === 'failed') {
        throw new Error(payload.error ?? 'Engine run failed.')
      }
      if (typeof payload.revision_count === 'number')
        setRevisionCount(payload.revision_count)
      if (payload.audit_status === 'PASS' || payload.audit_status === 'FAIL')
        setAuditStatus(payload.audit_status)
      if (typeof payload.audit_feedback === 'string')
        setAuditFeedback(payload.audit_feedback)

      setWorkflowState(WORKFLOW.SUCCESS_REVIEW)
      setActiveAgent(null)
    } catch (err) {
      const detail = err?.response?.data?.detail
      let msg =
        typeof detail === 'string'
          ? detail
          : Array.isArray(detail)
            ? detail.map((d) => d?.msg ?? JSON.stringify(d)).join(' ')
            : detail
      if (!msg) msg = err?.message ?? 'Something went wrong. Is the API running on port 8000?'
      setErrorMessage(String(msg))
      setWorkflowState(WORKFLOW.ERROR)
      setActiveAgent(null)
      setPdfLoaded(false)
    } finally {
      setIsBusy(false)
    }
  }, [appendLog, tenderFile, profileFile])

  const downloadProposal = useCallback(async () => {
    if (!runId) {
      setErrorMessage('No active proposal — run an analysis first.')
      return
    }
    try {
      setIsBusy(true)
      const blob = await downloadFinalProposal(runId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'Final_Proposal.docx'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      const msg =
        err?.response?.data?.detail ?? err?.message ?? 'Download failed.'
      setErrorMessage(String(msg))
    } finally {
      setIsBusy(false)
    }
  }, [runId])

  return useMemo(
    () => ({
      workflowState,
      tenderFile,
      profileFile,
      runId,
      pdfLoaded,
      activeAgent,
      revisionCount,
      auditStatus,
      auditFeedback,
      logs,
      errorMessage,
      rejectionReason,
      isBusy,
      reset,
      pickTenderFile,
      pickProfileFile,
      analyzeProposal,
      downloadProposal,
      appendLog,
    }),
    [
      workflowState,
      tenderFile,
      profileFile,
      runId,
      pdfLoaded,
      activeAgent,
      revisionCount,
      auditStatus,
      auditFeedback,
      logs,
      errorMessage,
      rejectionReason,
      isBusy,
      reset,
      pickTenderFile,
      pickProfileFile,
      analyzeProposal,
      downloadProposal,
      appendLog,
    ],
  )
}
