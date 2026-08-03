import React, { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { SYNCRA_ANDROID_APK_URL } from '../../lib/androidApp'
import { MAI_BRAND_BLUE } from '../../lib/brandConstants'

type FooterAndroidQrProps = {
  /** Square size in CSS pixels */
  size?: number
  className?: string
}

/**
 * QR encoding the direct APK URL (Content-Disposition: attachment).
 * Scanning on Android opens/downloads the installer with no intermediate page.
 */
export default function FooterAndroidQr({ size = 128, className = '' }: FooterAndroidQrProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    void QRCode.toDataURL(SYNCRA_ANDROID_APK_URL, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: size * 2,
      color: {
        dark: MAI_BRAND_BLUE,
        light: '#FFFFFFFF'
      }
    })
      .then((url) => {
        if (!cancelled) setDataUrl(url)
      })
      .catch(() => {
        if (!cancelled) setDataUrl(null)
      })

    return () => {
      cancelled = true
    }
  }, [size])

  return (
    <div className={`flex flex-col items-start gap-2 ${className}`}>
      <div
        className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm"
        style={{ width: size + 16, height: size + 16 }}
      >
        {dataUrl ? (
          <img
            src={dataUrl}
            width={size}
            height={size}
            alt="QR code — scan to download the mAI Society Android app"
            className="block h-full w-full"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center bg-slate-50 text-[10px] text-slate-400"
            aria-hidden="true"
          >
            Loading QR…
          </div>
        )}
      </div>
      <p className="max-w-[9.5rem] text-xs leading-snug text-slate-500">
        Scan to download the Android APK instantly
      </p>
      {/* Visually secondary; QR already points at the same direct URL */}
      <a
        href={SYNCRA_ANDROID_APK_URL}
        download="mai-society-latest.apk"
        className="text-[11px] font-semibold text-syncra-blue underline-offset-2 hover:underline"
      >
        Or tap to download
      </a>
    </div>
  )
}
