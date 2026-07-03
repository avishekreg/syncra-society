import React from 'react'
import NoticesManager from './NoticesManager'
import { ui } from '../../lib/ui'

export default function NoticesPage() {
  return (
    <div className="space-y-6">
      <section className={ui.card}>
        <p className={ui.eyebrow}>Notice board</p>
        <h2 className={`mt-2 ${ui.headingLg}`}>Society announcements</h2>
        <p className={`mt-2 ${ui.body}`}>Publish notices for all residents. Attachments supported.</p>
      </section>
      <section className={ui.card}>
        <NoticesManager embedded />
      </section>
    </div>
  )
}
