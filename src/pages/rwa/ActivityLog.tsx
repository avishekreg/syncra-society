import React, { useEffect } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import { seedDemoActivities } from '../../lib/activityLog'
import ActivityTimeline from '../../components/ActivityTimeline'
import { ui } from '../../lib/ui'

export default function RwaActivityLog() {
  const { currentSocietyId } = useAuth()

  useEffect(() => {
    if (currentSocietyId) seedDemoActivities(currentSocietyId)
  }, [currentSocietyId])

  return (
    <div className="space-y-6">
      <section className={ui.card}>
        <p className={ui.eyebrow}>Society audit trail</p>
        <h2 className={`mt-2 ${ui.headingLg}`}>Complete activity history</h2>
        <p className={`mt-2 ${ui.body}`}>
          Monitor payments, visitors, notices, surveys, gallery uploads, and elections across the society.
        </p>
      </section>
      <section className={ui.card}>
        <ActivityTimeline societyId={currentSocietyId} limit={100} />
      </section>
    </div>
  )
}
