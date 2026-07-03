import React, { useEffect, useState } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import { seedDemoActivities } from '../../lib/activityLog'
import ActivityTimeline from '../../components/ActivityTimeline'
import { ui } from '../../lib/ui'

export default function ResidentActivityPage() {
  const { currentSocietyId, user } = useAuth()

  useEffect(() => {
    if (currentSocietyId) seedDemoActivities(currentSocietyId, user?.flatNumber)
  }, [currentSocietyId, user?.flatNumber])

  return (
    <div className="space-y-6">
      <section className={ui.card}>
        <p className={ui.eyebrow}>Activity monitor</p>
        <h2 className={`mt-2 ${ui.headingLg}`}>Your activity history</h2>
        <p className={`mt-2 ${ui.body}`}>
          Payments, visitors, notices, surveys, and elections — all timestamped for audit and monitoring.
        </p>
      </section>
      <section className={ui.card}>
        <ActivityTimeline
          societyId={currentSocietyId}
          userId={user?.id}
          flatNumber={user?.flatNumber}
        />
      </section>
    </div>
  )
}
