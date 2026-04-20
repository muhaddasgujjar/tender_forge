import axios from 'axios'

/**
 * TenderForge PK API — base http://localhost:8000/api/
 * upload (tender + company) → generate → stream → download
 */

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  timeout: 300_000,
  headers: {
    Accept: 'application/json',
  },
})

/**
 * POST /api/upload — government tender + company profile (required).
 * Field names must match the backend: tender_file, profile_file
 */
export function uploadPdfs(tenderFile, profileFile) {
  const body = new FormData()
  body.append('tender_file', tenderFile)
  body.append('profile_file', profileFile)
  return api.post('/upload', body, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

/** Prompt 5 — POST /api/generate */
export function generateProposal(payload) {
  return api.post('/generate', payload)
}

/** Legacy — combined ingest */
export function ingestTenderPdf(file) {
  const body = new FormData()
  body.append('file', file)
  return api.post('/ingest', body, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

/** Legacy — run after ingest */
export function startTenderRun(payload) {
  return api.post('/run', payload)
}

export function getRunStatus(runId) {
  return api.get(`/runs/${encodeURIComponent(runId)}`)
}

/** Prompt 5 — GET /api/download?run_id= */
export async function downloadFinalProposal(runId) {
  const res = await api.get('/download', {
    params: { run_id: runId },
    responseType: 'blob',
  })
  return res.data
}

/** Legacy filename */
export async function downloadProposalDocx(runId) {
  return downloadFinalProposal(runId)
}

/**
 * SSE — Prompt 5: GET /api/stream?run_id=
 */
export async function streamEngineEvents(runId, onMessage) {
  const url = new URL('/api/stream', 'http://localhost:8000')
  url.searchParams.set('run_id', runId)
  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: { Accept: 'text/event-stream' },
  })
  if (!res.ok || !res.body) {
    throw new Error(`Stream failed: ${res.status}`)
  }
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const parts = buffer.split('\n\n')
    buffer = parts.pop() ?? ''
    for (const block of parts) {
      const line = block.trim()
      if (!line.startsWith('data:')) continue
      const json = line.slice(5).trim()
      try {
        const parsed = JSON.parse(json)
        onMessage(parsed)
      } catch (parseErr) {
        if (parseErr instanceof SyntaxError) continue
        throw parseErr
      }
    }
  }
}

export { api }
