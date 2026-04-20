import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MessageCircle, Send, Sparkles, X } from 'lucide-react'

import { getChatStatus, postBidChat } from '../services/api.js'

function Bubble({ role, children }) {
  const assistant = role === 'assistant'
  return (
    <div className={`flex ${assistant ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm sm:max-w-[85%] ${
          assistant
            ? 'border border-tf-border bg-white text-tf-text'
            : 'bg-tf-navy-950 text-white'
        }`}
      >
        <p className="whitespace-pre-wrap">{children}</p>
      </div>
    </div>
  )
}

export function BidChatAssistant() {
  const [open, setOpen] = useState(false)
  const [indexed, setIndexed] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState(() => [
    {
      role: 'assistant',
      text:
        'Ask about submission deadlines, eligibility, scope of work, bill of quantities, or details from your company profile — answers use your indexed tender and profile only.',
    },
  ])
  const [loading, setLoading] = useState(false)
  const listRef = useRef(null)

  const refreshStatus = useCallback(async () => {
    try {
      const res = await getChatStatus()
      setIndexed(Boolean(res.data?.indexed))
    } catch {
      setIndexed(false)
    }
  }, [])

  useEffect(() => {
    refreshStatus()
    const t = setInterval(refreshStatus, 15000)
    return () => clearInterval(t)
  }, [refreshStatus])

  useEffect(() => {
    if (open) refreshStatus()
  }, [open, refreshStatus])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  const send = async () => {
    const q = input.trim()
    if (!q || loading) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', text: q }])
    setLoading(true)
    try {
      const res = await postBidChat(q)
      const answer = res.data?.answer ?? 'No response.'
      setMessages((m) => [...m, { role: 'assistant', text: answer }])
    } catch (err) {
      const detail = err?.response?.data?.detail
      const msg =
        typeof detail === 'string'
          ? detail
          : Array.isArray(detail)
            ? detail.map((d) => d?.msg ?? '').join(' ')
          : err?.message ?? 'Request failed.'
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          text: `Could not complete the answer: ${msg}`,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <motion.button
        type="button"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-[100] flex h-14 items-center gap-2 rounded-full border border-white/10 bg-tf-navy-950 px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_40px_-8px_rgba(10,22,40,0.55)] ring-1 ring-white/10 transition-colors hover:bg-tf-navy-900 sm:bottom-8 sm:right-8"
        aria-label="Open bid Q&A assistant"
      >
        <MessageCircle className="size-5 shrink-0" aria-hidden />
        <span className="hidden sm:inline">Bid Q&amp;A</span>
      </motion.button>

      <AnimatePresence>
        {open ? (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] bg-tf-navy-950/25 backdrop-blur-[2px] sm:bg-tf-navy-950/20"
              aria-label="Close assistant"
              onClick={() => setOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Bid knowledge assistant"
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed bottom-24 right-4 z-[120] flex max-h-[min(560px,75vh)] w-[min(calc(100vw-2rem),420px)] flex-col overflow-hidden rounded-2xl border border-tf-border bg-white shadow-[0_24px_64px_-12px_rgba(15,23,42,0.25)] sm:bottom-28 sm:right-8"
            >
              <div className="flex items-center justify-between border-b border-tf-border bg-gradient-to-r from-tf-navy-950 to-tf-navy-900 px-4 py-3 text-white">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                    <Sparkles className="size-4" aria-hidden />
                  </span>
                  <div>
                    <p className="font-display text-sm font-semibold leading-tight">Bid intelligence</p>
                    <p className="text-[11px] text-slate-300">RAG · tender + company index</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="flex size-10 items-center justify-center rounded-xl text-white/90 hover:bg-white/10"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                >
                  <X className="size-5" />
                </button>
              </div>

              {!indexed ? (
                <div className="border-b border-amber-200/80 bg-amber-50 px-4 py-2.5 text-xs text-amber-950">
                  Index not loaded. Upload both PDFs and run <strong>Generate</strong> to enable answers.
                </div>
              ) : null}

              <div
                ref={listRef}
                className="flex flex-1 flex-col gap-3 overflow-y-auto overscroll-contain bg-tf-elevated/50 px-4 py-4"
              >
                {messages.map((msg, i) => (
                  <Bubble key={`${i}-${msg.role}`} role={msg.role}>
                    {msg.text}
                  </Bubble>
                ))}
                {loading ? (
                  <div className="flex justify-start">
                    <div className="rounded-2xl border border-tf-border bg-white px-4 py-3 text-sm text-tf-muted">
                      Retrieving context…
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="border-t border-tf-border bg-white p-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        send()
                      }
                    }}
                    placeholder={
                      indexed ? 'e.g. What is the submission deadline?' : 'Build index first…'
                    }
                    disabled={loading || !indexed}
                    className="min-h-11 flex-1 rounded-xl border border-tf-border bg-tf-elevated px-3 text-sm text-tf-text outline-none ring-tf-navy-900/20 placeholder:text-tf-muted focus:border-tf-navy-700 focus:ring-2 disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={send}
                    disabled={loading || !indexed || !input.trim()}
                    className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-tf-navy-950 text-white shadow-tf-md transition-colors hover:bg-tf-navy-900 disabled:opacity-40"
                    aria-label="Send"
                  >
                    <Send className="size-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  )
}
