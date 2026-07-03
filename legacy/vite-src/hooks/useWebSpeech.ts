import { useCallback, useEffect, useRef, useState } from 'react'

/** BCP-47 tags for Indian English and Hindi voice input on mobile browsers. */
export type WebSpeechLanguage = 'en-IN' | 'hi-IN'

type SpeechRecognitionInstance = SpeechRecognition

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance
  }
}

export type WebSpeechErrorCode =
  | 'not-supported'
  | 'not-allowed'
  | 'no-speech'
  | 'audio-capture'
  | 'network'
  | 'aborted'
  | 'unknown'

export type UseWebSpeechOptions = {
  /** Defaults to Indian English; pass `hi-IN` for Hindi-first input. */
  lang?: WebSpeechLanguage
  /** Milliseconds of silence before auto-finalizing (mobile pause tolerance). */
  silenceMs?: number
  /** Called whenever the finalized transcript changes after a session ends. */
  onFinalTranscript?: (text: string) => void
}

function getSpeechRecognitionCtor(): (new () => SpeechRecognitionInstance) | null {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null
}

function mapSpeechError(code: string): WebSpeechErrorCode {
  if (code === 'not-allowed' || code === 'service-not-allowed') return 'not-allowed'
  if (code === 'no-speech') return 'no-speech'
  if (code === 'audio-capture') return 'audio-capture'
  if (code === 'network') return 'network'
  if (code === 'aborted') return 'aborted'
  return 'unknown'
}

export function getMicrophonePermissionHelpMessage() {
  return [
    'Microphone access was blocked.',
    '',
    'Android (Chrome): Tap the lock icon in the address bar → Permissions → Allow Microphone, then reload.',
    'iOS (Safari): Settings → Safari → Microphone → Allow, or tap “aA” in the address bar → Website Settings → Microphone → Allow.',
  ].join('\n')
}

export function useWebSpeech(options: UseWebSpeechOptions = {}) {
  const { lang = 'en-IN', silenceMs = 2200, onFinalTranscript } = options

  const [isListening, setIsListening] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState('')
  const [finalTranscript, setFinalTranscript] = useState('')
  const [error, setError] = useState<WebSpeechErrorCode | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const listeningRef = useRef(false)
  const shouldFinalizeRef = useRef(false)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sessionFinalRef = useRef('')
  const onFinalTranscriptRef = useRef(onFinalTranscript)

  const isSupported = typeof window !== 'undefined' && getSpeechRecognitionCtor() !== null

  useEffect(() => {
    onFinalTranscriptRef.current = onFinalTranscript
  }, [onFinalTranscript])

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
  }, [])

  const teardownRecognition = useCallback(() => {
    clearSilenceTimer()
    listeningRef.current = false
    shouldFinalizeRef.current = false
    setIsListening(false)

    const instance = recognitionRef.current
    recognitionRef.current = null
    if (instance) {
      instance.onresult = null
      instance.onerror = null
      instance.onend = null
      instance.onstart = null
      try {
        instance.abort()
      } catch {
        try {
          instance.stop()
        } catch {
          // ignore — browser may already be stopped
        }
      }
    }
  }, [clearSilenceTimer])

  const finalizeSession = useCallback(() => {
    if (!shouldFinalizeRef.current) return
    shouldFinalizeRef.current = false
    listeningRef.current = false
    setIsListening(false)
    clearSilenceTimer()

    const spoken = sessionFinalRef.current.trim()
    setFinalTranscript(spoken)
    setInterimTranscript('')
    if (spoken) {
      onFinalTranscriptRef.current?.(spoken)
    }

    try {
      recognitionRef.current?.stop()
    } catch {
      // already stopped
    }
  }, [clearSilenceTimer])

  const scheduleSilenceFinalize = useCallback(() => {
    clearSilenceTimer()
    silenceTimerRef.current = setTimeout(() => {
      finalizeSession()
    }, silenceMs)
  }, [clearSilenceTimer, finalizeSession, silenceMs])

  const ensureMicrophonePermission = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) return true
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((track) => track.stop())
      setPermissionDenied(false)
      return true
    } catch {
      setPermissionDenied(true)
      setError('not-allowed')
      return false
    }
  }, [])

  const startListening = useCallback(async () => {
    if (!isSupported) {
      setError('not-supported')
      return
    }

    if (listeningRef.current) return

    setError(null)
    setPermissionDenied(false)
    setInterimTranscript('')
    setFinalTranscript('')
    sessionFinalRef.current = ''

    const permitted = await ensureMicrophonePermission()
    if (!permitted) return

    const Ctor = getSpeechRecognitionCtor()
    if (!Ctor) {
      setError('not-supported')
      return
    }

    const recognition = new Ctor()
    recognitionRef.current = recognition
    recognition.lang = lang
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    shouldFinalizeRef.current = true
    listeningRef.current = true
    setIsListening(true)

    recognition.onstart = () => {
      setIsListening(true)
      scheduleSilenceFinalize()
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = ''
      let sessionFinal = sessionFinalRef.current

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const chunk = result[0]?.transcript ?? ''
        if (result.isFinal) {
          sessionFinal = `${sessionFinal} ${chunk}`.trim()
        } else {
          interim = `${interim} ${chunk}`.trim()
        }
      }

      sessionFinalRef.current = sessionFinal
      setInterimTranscript(interim)
      scheduleSilenceFinalize()
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const mapped = mapSpeechError(event.error)
      if (mapped === 'not-allowed') {
        setPermissionDenied(true)
        shouldFinalizeRef.current = false
        teardownRecognition()
        setError('not-allowed')
        return
      }

      if (mapped === 'no-speech') {
        scheduleSilenceFinalize()
        return
      }

      if (mapped === 'aborted') return

      shouldFinalizeRef.current = false
      teardownRecognition()
      setError(mapped)
    }

    recognition.onend = () => {
      clearSilenceTimer()
      if (shouldFinalizeRef.current && listeningRef.current) {
        finalizeSession()
        return
      }
      listeningRef.current = false
      setIsListening(false)
    }

    try {
      recognition.start()
    } catch {
      shouldFinalizeRef.current = false
      listeningRef.current = false
      setIsListening(false)
      setError('unknown')
    }
  }, [
    ensureMicrophonePermission,
    finalizeSession,
    isSupported,
    lang,
    scheduleSilenceFinalize,
    teardownRecognition,
    clearSilenceTimer
  ])

  const stopListening = useCallback(() => {
    finalizeSession()
    teardownRecognition()
  }, [finalizeSession, teardownRecognition])

  const toggleListening = useCallback(() => {
    if (listeningRef.current) {
      stopListening()
    } else {
      void startListening()
    }
  }, [startListening, stopListening])

  useEffect(() => {
    return () => {
      shouldFinalizeRef.current = false
      teardownRecognition()
    }
  }, [teardownRecognition])

  return {
    isSupported,
    isListening,
    interimTranscript,
    finalTranscript,
    error,
    permissionDenied,
    lang,
    startListening,
    stopListening,
    toggleListening,
    clearError: () => setError(null)
  }
}
