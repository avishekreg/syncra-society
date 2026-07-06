import React from 'react'
import { Link } from 'react-router-dom'
import { ui } from '../../lib/ui'

export const AUTH_LOGIN_PATH = '/auth/login'

type AuthExistingAccountLinkProps = {
  variant?: 'banner' | 'footer'
}

export default function AuthExistingAccountLink({ variant = 'banner' }: AuthExistingAccountLinkProps) {
  if (variant === 'footer') {
    return (
      <div className="mt-6 border-t border-slate-200 pt-6 text-center text-sm text-slate-600">
        Already have an account?{' '}
        <Link to={AUTH_LOGIN_PATH} className="font-semibold text-syncra-blue hover:text-syncra-accent">
          Log In
        </Link>
      </div>
    )
  }

  return (
    <div className="mb-6 flex flex-col items-stretch gap-3 rounded-xl border border-syncra-accent/30 bg-syncra-accent/5 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-medium text-slate-700">Already have an account?</p>
      <Link to={AUTH_LOGIN_PATH} className={`${ui.btnSecondary} w-full text-center sm:w-auto`}>
        Log In
      </Link>
    </div>
  )
}
