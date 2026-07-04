import { useCallback, useEffect, useRef, useState } from 'react'

export function useCopyToClipboard(durationMs = 2600) {
  const [toast, setToast] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const dismissToast = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = null
    setToast(null)
  }, [])

  const copy = useCallback(
    async (text: string, successMessage = 'Copied to clipboard') => {
      if (!text?.trim()) return false

      try {
        await navigator.clipboard.writeText(text)
        setToast(successMessage)
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => {
          setToast(null)
          timerRef.current = null
        }, durationMs)
        return true
      } catch {
        setToast('Unable to copy — please select and copy manually')
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => {
          setToast(null)
          timerRef.current = null
        }, durationMs)
        return false
      }
    },
    [durationMs]
  )

  return { copy, toast, dismissToast }
}
