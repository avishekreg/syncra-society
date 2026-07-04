import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function OnboardingRedirectPage() {
  redirect('/dashboard/flats')
}
