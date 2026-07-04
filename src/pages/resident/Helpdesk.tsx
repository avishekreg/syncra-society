import React, { useCallback, useRef, useState } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import { useComplaints, formatComplaintStatus } from '../../hooks/useComplaints'
import {
  getMicrophonePermissionHelpMessage,
  useWebSpeech,
  type WebSpeechLanguage
} from '../../hooks/useWebSpeech'
import { usePlatformConfig } from '../../providers/PlatformConfigProvider'
import { ui } from '../../lib/ui'

const categories = ['Infrastructure', 'Security', 'Sanitation', 'Electrical']
const urgencies = ['Low', 'Medium', 'High', 'Critical']

function mergeTranscriptIntoDescription(existing: string, spoken: string) {
  const base = existing.trim()
  const voice = spoken.trim()
  if (!voice) return existing
  if (!base) return voice
  if (base.endsWith(voice) || base.includes(voice)) return existing
  return `${base} ${voice}`.trim()
}

export default function ResidentHelpdesk() {
  const { currentSocietyId, user } = useAuth()
  const { isModuleEnabled, isVoiceTicketingEnabled } = usePlatformConfig()
  const voiceEnabled = isVoiceTicketingEnabled(currentSocietyId)
  const { complaints, loading, submitComplaint, refresh } = useComplaints(currentSocietyId, user?.id ?? null)
  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState(categories[0])
  const [urgency, setUrgency] = useState(urgencies[1])
  const [details, setDetails] = useState('')
  const [fileName, setFileName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [speechLang, setSpeechLang] = useState<WebSpeechLanguage>('en-IN')
  const descriptionBaselineRef = useRef('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleFinalTranscript = useCallback((spoken: string) => {
    setDetails((current) => mergeTranscriptIntoDescription(descriptionBaselineRef.current || current, spoken))
    setMessage('Voice note added to your description. Review and edit before submitting.')
  }, [])

  const {
    isSupported,
    isListening,
    interimTranscript,
    error: speechError,
    permissionDenied,
    startListening,
    stopListening,
    clearError
  } = useWebSpeech({
    lang: speechLang,
    silenceMs: 2400,
    onFinalTranscript: handleFinalTranscript
  })

  const livePreview = isListening
    ? mergeTranscriptIntoDescription(descriptionBaselineRef.current, interimTranscript)
    : details

  function handleMicPress() {
    clearError()
    if (isListening) {
      stopListening()
      return
    }
    descriptionBaselineRef.current = details
    void startListening()
  }

  function handleSpeechLangChange(next: WebSpeechLanguage) {
    if (isListening) stopListening()
    setSpeechLang(next)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isListening) stopListening()

    if (!subject.trim() || !details.trim()) {
      setMessage('Please provide a title and description.')
      return
    }

    setSubmitting(true)
    setMessage('')
    try {
      const fullDescription = `[${category}] [${urgency}]${fileName ? ` [Attachment: ${fileName}]` : ''}\n${details}`
      await submitComplaint(subject.trim(), fullDescription)
      setSubject('')
      setDetails('')
      setFileName('')
      descriptionBaselineRef.current = ''
      setMessage('Ticket submitted successfully. Your RWA will review it shortly.')
      refresh()
    } catch (err: any) {
      setMessage(err.message || 'Failed to submit ticket.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isModuleEnabled('helpdesk', currentSocietyId)) {
    return (
      <div className={ui.card}>
        <p className={ui.eyebrow}>Smart Helpdesk</p>
        <h2 className={`mt-3 ${ui.heading}`}>Module unavailable</h2>
        <p className={`mt-3 ${ui.body}`}>
          Smart Helpdesk is disabled for your society. Contact your RWA or platform administrator.
        </p>
      </div>
    )
  }

  return (
    <div className={ui.sectionGap}>
      <section className={ui.card}>
        <div className="mb-6">
          <p className={ui.eyebrow}>Syncra Smart Helpdesk</p>
          <h2 className={`mt-2 ${ui.headingLg}`}>Smart Helpdesk & Asset Audit</h2>
          <p className={`mt-2 ${ui.body}`}>
            File issue tickets with category, urgency, voice dictation, and supporting details.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-6">
          <label className="space-y-3">
            <span className={ui.label}>Issue Title</span>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className={ui.input}
              placeholder="Describe the issue briefly"
            />
          </label>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="space-y-3">
              <span className={ui.label}>Category</span>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={ui.input}>
                {categories.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className="space-y-3">
              <span className={ui.label}>Urgency Level</span>
              <select value={urgency} onChange={(e) => setUrgency(e.target.value)} className={ui.input}>
                {urgencies.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className={ui.label}>Description</span>
              {voiceEnabled && (
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex rounded-xl border border-slate-200 bg-syncra-surface-alt p-1 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => handleSpeechLangChange('en-IN')}
                    className={`rounded-lg px-3 py-1.5 transition ${
                      speechLang === 'en-IN'
                        ? 'bg-syncra-blue text-white'
                        : 'text-syncra-primary hover:bg-white'
                    }`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSpeechLangChange('hi-IN')}
                    className={`rounded-lg px-3 py-1.5 transition ${
                      speechLang === 'hi-IN'
                        ? 'bg-syncra-blue text-white'
                        : 'text-syncra-primary hover:bg-white'
                    }`}
                  >
                    Hindi
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleMicPress}
                  disabled={!isSupported}
                  aria-pressed={isListening}
                  className={`relative inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    isListening
                      ? 'border border-syncra-action/40 bg-syncra-action/15 text-syncra-action shadow-[0_0_0_4px_rgba(255,140,0,0.12)]'
                      : 'border border-syncra-blue/30 bg-syncra-accent/10 text-syncra-blue hover:bg-syncra-accent/20'
                  }`}
                >
                  <span
                    className={`relative flex h-3 w-3 shrink-0 items-center justify-center ${
                      isListening ? 'animate-pulse' : ''
                    }`}
                  >
                    {isListening && (
                      <span className="absolute inline-flex h-full w-full rounded-full bg-syncra-action opacity-60 animate-ping" />
                    )}
                    <span
                      className={`relative inline-block h-2.5 w-2.5 rounded-full ${
                        isListening ? 'bg-syncra-action' : 'bg-syncra-blue'
                      }`}
                    />
                  </span>
                  {isListening ? 'Stop recording' : 'Record voice note'}
                </button>
              </div>
              )}
            </div>

            <textarea
              value={isListening ? livePreview : details}
              onChange={(e) => {
                setDetails(e.target.value)
                if (!isListening) descriptionBaselineRef.current = e.target.value
              }}
              rows={6}
              className={`${ui.input} ${isListening ? 'border-syncra-accent ring-2 ring-syncra-accent/15' : ''}`}
              placeholder={voiceEnabled ? 'Type your issue or tap the mic to dictate in English or Hindi' : 'Type your issue details'}
            />

            {!voiceEnabled && (
              <p className="text-xs text-slate-500">
                Voice ticketing is disabled for your society. Type your issue manually above.
              </p>
            )}

            {voiceEnabled && isListening && (
              <div className="rounded-xl border border-syncra-accent/30 bg-cyan-50 px-4 py-3">
                <p className="text-sm font-semibold text-syncra-blue">
                  Listening… speak clearly. We will append your voice note without erasing typed text.
                </p>
                {interimTranscript && (
                  <p className="mt-2 text-sm text-slate-600">{interimTranscript}</p>
                )}
              </div>
            )}

            {voiceEnabled && !isSupported && (
              <p className="text-sm text-syncra-action-alt">
                Voice dictation is not supported in this browser. Use Chrome on Android or Safari on iOS.
              </p>
            )}

            {voiceEnabled && permissionDenied && speechError === 'not-allowed' && (
              <div className="rounded-xl border border-syncra-action-alt/30 bg-red-50 px-4 py-3">
                <p className="whitespace-pre-line text-sm text-red-700">{getMicrophonePermissionHelpMessage()}</p>
              </div>
            )}

            {voiceEnabled && speechError && speechError !== 'not-allowed' && (
              <p className="text-sm text-syncra-action-alt">
                Voice capture interrupted ({speechError}). You can keep typing manually.
              </p>
            )}
          </div>

          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-syncra-surface-alt p-6 text-center">
            <p className={ui.eyebrow}>Supporting evidence</p>
            <button type="button" onClick={() => fileInputRef.current?.click()} className={`mt-4 ${ui.btnGhost}`}>
              Attach photo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? '')}
            />
            {fileName && <p className={`mt-3 ${ui.body}`}>Selected: {fileName}</p>}
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={submitting} className={`${ui.btnPrimary} disabled:opacity-70`}>
              {submitting ? 'Submitting…' : 'Submit Ticket'}
            </button>
          </div>

          {message && (
            <p
              className={`text-sm ${
                message.includes('success') || message.includes('added') ? 'text-emerald-600' : 'text-syncra-action-alt'
              }`}
            >
              {message}
            </p>
          )}
        </form>
      </section>

      <section className={ui.card}>
        <h2 className={`mb-6 ${ui.heading}`}>My ticket history</h2>
        {loading && <p className={ui.body}>Loading tickets…</p>}
        {!loading && complaints.length === 0 && <p className={ui.body}>No tickets raised yet.</p>}
        <ul className="grid gap-4">
          {complaints.map((ticket) => (
            <li key={ticket.id} className={`${ui.innerItem} p-5`}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-syncra-primary">{ticket.subject}</p>
                  {ticket.description && <p className={`mt-2 ${ui.body}`}>{ticket.description}</p>}
                  {ticket.created_at && (
                    <time className="mt-3 block text-xs text-slate-500">
                      {new Date(ticket.created_at).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })}
                    </time>
                  )}
                </div>
                <span className="shrink-0 self-start rounded-full border border-syncra-accent/30 bg-syncra-accent/10 px-2.5 py-0.5 text-xs font-semibold text-syncra-blue">
                  {formatComplaintStatus(ticket.status)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
