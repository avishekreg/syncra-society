import React, { useEffect, useState } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import { fetchSocietyRulesGuidebook } from '../../api/rulesGuidebook'
import type { SocietyRulesGuidebook } from '../../types/db'
import GuidebookViewer from '../../components/guidebook/GuidebookViewer'
import { ui } from '../../lib/ui'

export default function ResidentRulesGuidebookPage() {
  const { currentSocietyId, showcaseData } = useAuth()
  const societyName = showcaseData?.society.name ?? 'Your Society'
  const [guidebook, setGuidebook] = useState<SocietyRulesGuidebook | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentSocietyId) {
      setGuidebook(null)
      setLoading(false)
      return
    }
    setLoading(true)
    void fetchSocietyRulesGuidebook(currentSocietyId)
      .then(setGuidebook)
      .finally(() => setLoading(false))
  }, [currentSocietyId])

  if (loading || !guidebook) {
    return <div className={ui.loading}>Loading rules & regulations…</div>
  }

  return (
    <div className={ui.sectionGap}>
      <header>
        <p className={ui.eyebrow}>Society guidebook</p>
        <h1 className={`mt-2 ${ui.headingLg}`}>Rules & Regulations</h1>
        <p className={`mt-2 max-w-2xl ${ui.body}`}>
          Official policies, amenity timings, and facility charges published by {societyName} management.
        </p>
      </header>
      <GuidebookViewer guidebook={guidebook} societyName={societyName} />
    </div>
  )
}
