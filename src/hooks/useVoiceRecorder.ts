import { useCallback, useEffect, useRef, useState } from 'react'

export type VoiceRecorderError = 'not-supported' | 'not-allowed' | 'capture-failed' | null

type UseVoiceRecorderOptions = {
  onAudioLevel?: (level: number) => void
}

export function getVoiceRecorderPermissionHelp() {
  return [
    'Microphone access was blocked.',
    '',
    'Android (Chrome): Tap the lock icon → Permissions → Allow Microphone, then reload.',
    'iOS (Safari): Settings → Safari → Microphone → Allow for this site.',
  ].join('\n')
}

export function useVoiceRecorder(options: UseVoiceRecorderOptions = {}) {
  const { onAudioLevel } = options
  const [isRecording, setIsRecording] = useState(false)
  const [isSupported] = useState(
    () =>
      typeof window !== 'undefined' &&
      typeof navigator !== 'undefined' &&
      typeof navigator.mediaDevices?.getUserMedia === 'function' &&
      typeof window.MediaRecorder !== 'undefined'
  )
  const [error, setError] = useState<VoiceRecorderError>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const rafRef = useRef<number | null>(null)
  const onAudioLevelRef = useRef(onAudioLevel)

  useEffect(() => {
    onAudioLevelRef.current = onAudioLevel
  }, [onAudioLevel])

  const stopMeter = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    analyserRef.current = null
    if (audioContextRef.current) {
      void audioContextRef.current.close().catch(() => undefined)
      audioContextRef.current = null
    }
    onAudioLevelRef.current?.(0)
  }, [])

  const startMeter = useCallback((stream: MediaStream) => {
    try {
      const context = new AudioContext()
      const analyser = context.createAnalyser()
      analyser.fftSize = 256
      const source = context.createMediaStreamSource(stream)
      source.connect(analyser)
      audioContextRef.current = context
      analyserRef.current = analyser

      const data = new Uint8Array(analyser.frequencyBinCount)
      const tick = () => {
        analyser.getByteFrequencyData(data)
        let sum = 0
        for (let i = 0; i < data.length; i += 1) sum += data[i]
        const level = sum / (data.length * 255)
        onAudioLevelRef.current?.(level)
        rafRef.current = requestAnimationFrame(tick)
      }
      tick()
    } catch {
      // Visualizer is optional — recording still works.
    }
  }, [])

  const releaseStream = useCallback(() => {
    stopMeter()
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [stopMeter])

  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current
      if (!recorder || recorder.state === 'inactive') {
        releaseStream()
        setIsRecording(false)
        resolve(null)
        return
      }

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || 'audio/webm'
        const blob = chunksRef.current.length > 0 ? new Blob(chunksRef.current, { type: mimeType }) : null
        chunksRef.current = []
        mediaRecorderRef.current = null
        releaseStream()
        setIsRecording(false)
        resolve(blob)
      }

      try {
        recorder.stop()
      } catch {
        releaseStream()
        setIsRecording(false)
        resolve(null)
      }
    })
  }, [releaseStream])

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      setError('not-supported')
      return false
    }

    setError(null)
    setPermissionDenied(false)
    chunksRef.current = []

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      startMeter(stream)

      const preferredTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']
      const mimeType = preferredTypes.find((type) => MediaRecorder.isTypeSupported(type))
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }

      recorder.onerror = () => {
        setError('capture-failed')
        void stopRecording()
      }

      mediaRecorderRef.current = recorder
      recorder.start(250)
      setIsRecording(true)
      return true
    } catch {
      releaseStream()
      setPermissionDenied(true)
      setError('not-allowed')
      return false
    }
  }, [isSupported, releaseStream, startMeter, stopRecording])

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop()
        } catch {
          // ignore teardown errors
        }
      }
      releaseStream()
    }
  }, [releaseStream])

  return {
    isSupported,
    isRecording,
    error,
    permissionDenied,
    startRecording,
    stopRecording,
    clearError: () => {
      setError(null)
      setPermissionDenied(false)
    }
  }
}
