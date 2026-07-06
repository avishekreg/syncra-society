import React from 'react'
import { Link } from 'react-router-dom'
import SyncraBrandLogo from '../brand/SyncraBrandLogo'
import FooterAppStoreBadges from '../landing/FooterAppStoreBadges'
import { resolveAndroidDownloadHref, SYNCRA_ANDROID_LANDING_PATH } from '../../lib/androidApp'
import { ui } from '../../lib/ui'

type SignupDownloadSuccessProps = {
  fullName?: string
  dashboardPath?: string
}

export default function SignupDownloadSuccess({ fullName, dashboardPath = '/auth/signin' }: SignupDownloadSuccessProps) {
  const apkHref = resolveAndroidDownloadHref()

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex justify-center">
        <SyncraBrandLogo to="/" />
      </div>

      <div className={`space-y-5 text-center ${ui.card}`}>
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-3xl">✓</div>
        <p className={ui.eyebrow}>Account verified</p>
        <h2 className={ui.heading}>
          {fullName ? `${fullName}, your account is ready!` : 'Your account is ready!'}
        </h2>
        <p className={`${ui.body} text-base leading-relaxed`}>
          Account Verified Successfully! Now, download the official Syncra Society App to access your gatekeeper logs
          and dashboard.
        </p>

        <div className="flex flex-col gap-3 pt-2">
          <a
            href={apkHref}
            download="syncra-society-latest.apk"
            className={`${ui.btnPrimary} w-full justify-center px-6 py-4 text-base`}
          >
            Download Syncra Society App
          </a>
          <a href={SYNCRA_ANDROID_LANDING_PATH} className={`${ui.btnSecondary} w-full justify-center`}>
            View install instructions
          </a>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-syncra-surface-alt p-4 shadow-sm">
          <FooterAppStoreBadges />
        </div>

        <p className="text-sm text-slate-500">
          Prefer the web dashboard for now?{' '}
          <Link to={dashboardPath} className="font-semibold text-syncra-blue hover:text-syncra-accent">
            Continue in browser
          </Link>
        </p>
      </div>
    </div>
  )
}
