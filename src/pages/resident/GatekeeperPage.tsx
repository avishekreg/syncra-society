import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../providers/AuthProvider'
import RegularStaffPanel from '../../components/gatekeeper/RegularStaffPanel'
import DeliveryPreApprovePanel from '../../components/gatekeeper/DeliveryPreApprovePanel'
import DeliveryQuickApproveFab from '../../components/gatekeeper/DeliveryQuickApproveFab'
import { ui } from '../../lib/ui'

type TabId = 'staff' | 'delivery'

export default function ResidentGatekeeperPage() {
  const { currentSocietyId, user } = useAuth()
  const [tab, setTab] = useState<TabId>('staff')
  const societyId = currentSocietyId
  const flatNumber = user?.flatNumber

  if (!societyId || !flatNumber) {
    return (
      <section className={ui.card}>
        <p className={ui.eyebrow}>Gatekeeper</p>
        <h2 className={`mt-2 ${ui.headingLg}`}>Complete flat mapping first</h2>
        <p className={`mt-2 ${ui.body}`}>Link your flat to manage staff passes and delivery pre-approvals.</p>
        <Link to="/resident/setup" className={`mt-4 inline-flex ${ui.btnPrimary}`}>
          Complete setup
        </Link>
      </section>
    )
  }

  return (
    <div className="space-y-6">
      <section className={ui.card}>
        <p className={ui.eyebrow}>Resident gatekeeper</p>
        <h2 className={`mt-2 ${ui.headingLg}`}>Staff passes & smart delivery</h2>
        <p className={`mt-2 ${ui.body}`}>
          Flat {flatNumber} — issue recurring staff QR passes and one-tap delivery clearances.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {(
            [
              ['staff', 'Regular staff'],
              ['delivery', 'Delivery pre-approve']
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                tab === id
                  ? 'bg-syncra-blue text-white'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-syncra-surface-alt'
              }`}
            >
              {label}
            </button>
          ))}
          <Link to="/resident/visitor-logs" className={ui.btnGhost}>
            Visitor logs
          </Link>
        </div>
      </section>

      {tab === 'staff' ? (
        <RegularStaffPanel societyId={societyId} flatNumber={flatNumber} userId={user?.id} />
      ) : (
        <section className={ui.card}>
          <DeliveryPreApprovePanel societyId={societyId} flatNumber={flatNumber} userId={user?.id} />
        </section>
      )}

      <DeliveryQuickApproveFab societyId={societyId} flatNumber={flatNumber} userId={user?.id} />
    </div>
  )
}
