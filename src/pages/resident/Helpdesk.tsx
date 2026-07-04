import React, { useCallback, useState } from 'react'
import { AiServiceError, HELPDESK_CATEGORIES, HELPDESK_SEVERITIES, processVoiceTicket } from '../../api/ai'
import VoiceSoundwave from '../../components/helpdesk/VoiceSoundwave'
import { useAuth } from '../../providers/AuthProvider'
import { useComplaints, formatComplaintStatus } from '../../hooks/useComplaints'
import { getVoiceRecorderPermissionHelp, useVoiceRecorder } from '../../hooks/useVoiceRecorder'
import { usePlatformConfig } from '../../providers/PlatformConfigProvider'
import { ui } from '../../lib/ui'

type VoicePipelineState = 'idle' | 'recording' | 'transcribing' | 'categorizing'

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
  const [category, setCategory] = useState<string>(HELPDESK_CATEGORIES[0])
  const [urgency, setUrgency] = useState<string>(HELPDESK_SEVERITIES[1])
  const [details, setDetails] = useState('')
  const [fileName, setFileName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [voiceState, setVoiceState] = useState<VoicePipelineState>('idle')
  const [audioLevel, setAudioLevel] = useState(0)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  const {
    isSupported,
    isRecording,
    error: recorderError,
    permissionDenied,
    startRecording,
    stopRecording,
    clearError
  } = useVoiceRecorder({ onAudioLevel: setAudioLevel })

  const processRecording = useCallback(async (blob: Blob) => {
    setVoiceState('transcribing')
    setMessage('Transcribing your voice note…')

    try {
      const { transcript, classification } = await processVoiceTicket(blob)
      setVoiceState('categorizing')
      setDetails((current) => mergeTranscriptIntoDescription(current, transcript))
      setCategory(classification.category)
      setUrgency(classification.severity)
      setMessage(
        `Voice captured — categorized as ${classification.category} · ${classification.severity} severity. Review before submitting.`
      )
    } catch (err) {
      const text =
        err instanceof AiServiceError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Voice processing failed. You can keep typing manually.'
      setMessage(text)
    } finally {
      setVoiceState('idle')
      setAudioLevel(0)
    }
  }, [])

  async function handleMicPress() {
    clearError()
    if (voiceState !== 'idle' && voiceState !== 'recording') return

    if (isRecording) {
      setVoiceState('transcribing')
      const blob = await stopRecording()
      if (!blob || blob.size === 0) {
        setVoiceState('idle')
        setMessage('No audio captured. Try speaking closer to the microphone.')
        return
      }
      await processRecording(blob)
      return
    }

    const started = await startRecording()
    if (started) {
      setVoiceState('recording')
      setMessage('Recording… tap the mic again when finished.')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isRecording) {
      const blob = await stopRecording()
      setVoiceState('idle')
      if (blob && blob.size > 0) await processRecording(blob)
    }

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
      setMessage('Ticket submitted successfully. Your RWA will review it shortly.')
      refresh()
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Failed to submit ticket.')
    } finally {
      setSubmitting(false)
    }
  }

  const voiceBusy = voiceState === 'transcribing' || voiceState === 'categorizing'
  const micDisabled = !voiceEnabled || !isSupported || voiceBusy || submitting

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
            File issue tickets with AI voice dictation, auto-categorization, urgency detection, and supporting
            details.
          </p>
        </div>

        <form onSubmit={(event) => void handleSubmit(event)} className="grid gap-6">
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
                {HELPDESK_CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-3">
              <span className={ui.label}>Urgency Level</span>
              <select value={urgency} onChange={(e) => setUrgency(e.target.value)} className={ui.input}>
                {HELPDESK_SEVERITIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="space-y-3">
            <span className={ui.label}>Description</span>

            <div className="flex gap-3">
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={6}
                disabled={voiceBusy}
                className={`min-w-0 flex-1 ${ui.input} ${
                  isRecording ? 'border-syncra-accent ring-2 ring-syncra-accent/15' : ''
                }`}
                placeholder={
                  voiceEnabled
                    ? 'Type your issue or tap the mic to dictate — AI will transcribe and categorize automatically'
                    : 'Type your issue details'
                }
              />

              {voiceEnabled && (
                <div className="flex shrink-0 flex-col items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void handleMicPress()}
                    disabled={micDisabled}
                    aria-pressed={isRecording}
                    aria-label={isRecording ? 'Stop recording' : 'Start voice recording'}
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl border transition disabled:cursor-not-allowed disabled:opacity-50 ${
                      isRecording
                        ? 'border-syncra-action/50 bg-syncra-action/15 text-syncra-action shadow-[0_0_0_4px_rgba(255,140,0,0.12)]'
                        : 'border-syncra-blue/30 bg-syncra-accent/10 text-syncra-blue hover:bg-syncra-accent/20'
                    }`}
                  >
                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
                      <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2Z" />
                    </svg>
                  </button>
                  <span className="max-w-[4.5rem] text-center text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    {voiceBusy ? 'AI…' : isRecording ? 'Stop' : 'Voice'}
                  </span>
                </div>
              )}
            </div>

            {voiceEnabled && isRecording && (
              <div className="space-y-2">
                <VoiceSoundwave active level={audioLevel} />
                <p className="text-sm font-medium text-syncra-blue">Listening… speak clearly, then tap the mic to finish.</p>
              </div>
            )}

            {voiceEnabled && voiceBusy && (
              <p className="text-sm text-syncra-blue">
                {voiceState === 'transcribing' ? 'Transcribing with Whisper…' : 'Auto-categorizing with Llama-3…'}
              </p>
            )}

            {!voiceEnabled && (
              <p className="text-xs text-slate-500">
                Voice ticketing is disabled for your society. Type your issue manually above.
              </p>
            )}

            {voiceEnabled && !isSupported && (
              <p className="text-sm text-syncra-action-alt">
                Voice capture is not supported in this browser. Use Chrome on Android or Safari on iOS.
              </p>
            )}

            {voiceEnabled && permissionDenied && recorderError === 'not-allowed' && (
              <div className="rounded-xl border border-syncra-action-alt/30 bg-red-50 px-4 py-3">
                <p className="whitespace-pre-line text-sm text-red-700">{getVoiceRecorderPermissionHelp()}</p>
              </div>
            )}

            {voiceEnabled && recorderError && recorderError !== 'not-allowed' && (
              <p className="text-sm text-syncra-action-alt">
                Voice capture interrupted. You can keep typing manually.
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
            <button type="submit" disabled={submitting || voiceBusy} className={`${ui.btnPrimary} disabled:opacity-70`}>
              {submitting ? 'Submitting…' : 'Submit Ticket'}
            </button>
          </div>

          {message && (
            <p
              className={`text-sm ${
                message.includes('success') ||
                message.includes('categorized') ||
                message.includes('captured')
                  ? 'text-emerald-600'
                  : 'text-syncra-action-alt'
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
