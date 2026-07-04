import React, { useEffect, useMemo, useState } from 'react'
import LateFeeSettings from './LateFeeSettings'
import GatekeeperProvisioning from './GatekeeperProvisioning'
import PaymentSettlement from './PaymentSettlement'
import DefaulterBoard from './DefaulterBoard'
import BankStatementReconciliation from '../../components/BankStatementReconciliation'
import RwaBillingEngine from './RwaBillingEngine'
import { useAuth } from '../../providers/AuthProvider'
import { ui } from '../../lib/ui'

type DirectoryUser = {
  flat_number: string
  name: string
  username: string
  role: 'resident' | 'gatekeeper'
}

export default function RwaSettings() {
  const { currentSocietyId, user, showcaseData } = useAuth()
  const [hospital, setHospital] = useState('')
  const [ambulance, setAmbulance] = useState('')
  const [police, setPolice] = useState('')
  const [plumber, setPlumber] = useState('')
  const [electrician, setElectrician] = useState('')
  const [elevator, setElevator] = useState('')
  const [saveMessage, setSaveMessage] = useState('')
  const [directoryModalOpen, setDirectoryModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<DirectoryUser | null>(null)
  const [newPassword, setNewPassword] = useState('')

  useEffect(() => {
    if (!currentSocietyId) return
    const stored = localStorage.getItem(`syncra-emergency-directory-${currentSocietyId}`)
    if (!stored) return

    try {
      const parsed = JSON.parse(stored) as {
        hospital: string
        ambulance: string
        police: string
        plumber: string
        electrician: string
        elevator: string
      }
      setHospital(parsed.hospital ?? '')
      setAmbulance(parsed.ambulance ?? '')
      setPolice(parsed.police ?? '')
      setPlumber(parsed.plumber ?? '')
      setElectrician(parsed.electrician ?? '')
      setElevator(parsed.elevator ?? '')
    } catch {
      // ignore invalid stored directory
    }
  }, [currentSocietyId])

  const handleDirectorySave = () => {
    if (!currentSocietyId) {
      setSaveMessage('Please select a society before saving directory contacts.')
      return
    }

    localStorage.setItem(
      `syncra-emergency-directory-${currentSocietyId}`,
      JSON.stringify({
        hospital,
        ambulance,
        police,
        plumber,
        electrician,
        elevator
      })
    )
    setSaveMessage('Local emergency directory saved successfully.')
  }

  if (!user) {
    return null
  }

  const userRole = user.user_metadata?.role ?? user.role ?? 'resident'
  const isRwaFinance =
    userRole === 'rwa_owner' ||
    userRole === 'rwa_accountant' ||
    user.roles?.includes('rwa_owner') ||
    user.roles?.includes('rwa_accountant')
  const isOwner = userRole === 'rwa_owner'

  const directoryUsers = useMemo<DirectoryUser[]>(() => {
    const residents = showcaseData?.units.map((unit) => ({
      flat_number: unit.flat_number,
      name: unit.owner_name,
      username: unit.owner_email.split('@')[0],
      role: 'resident' as const
    })) ?? []

    const gatekeepers: DirectoryUser[] = [
      { flat_number: 'Guard-1', name: 'Arjun Singh', username: 'arjun.singh', role: 'gatekeeper' },
      { flat_number: 'Guard-2', name: 'Meera Patel', username: 'meera.patel', role: 'gatekeeper' }
    ]

    return [...gatekeepers, ...residents]
  }, [showcaseData])

  const handleOpenResetModal = (user: DirectoryUser) => {
    setSelectedUser(user)
    setNewPassword('')
    setDirectoryModalOpen(true)
  }

  const handleSavePassword = () => {
    if (!selectedUser) return
    setDirectoryModalOpen(false)
    setSelectedUser(null)
    setNewPassword('')
    setSaveMessage(`Password override queued for ${selectedUser.username}.`)
  }

  if (!isRwaFinance) {
    return (
      <div className={ui.card}>
        <p className={ui.eyebrow}>Access denied</p>
        <h2 className={`mt-3 ${ui.heading}`}>Restricted RWA settings</h2>
        <p className={`mt-4 ${ui.body}`}>
          Your current role does not permit access to society-level payment, reconciliation, and gatekeeper controls.
        </p>
      </div>
    )
  }

  const roleStatus =
    userRole === 'rwa_owner'
      ? { label: 'Society President', description: 'Full Access', badge: 'Full Access' }
      : { label: 'RWA Accountant', description: 'Financial Views Only', badge: 'Financial Views Only' }

  return (
    <>
      <div className={`mb-8 ${ui.card}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className={ui.eyebrow}>Society settings</p>
            <h2 className="mt-1 text-lg font-semibold text-syncra-primary">{roleStatus.label}</h2>
            <p className={ui.body}>{roleStatus.description}</p>
          </div>
          <span className="inline-flex items-center rounded-full border border-syncra-accent/30 bg-syncra-accent/10 px-4 py-2 text-sm font-semibold text-syncra-blue">
            {roleStatus.badge}
          </span>
        </div>
      </div>

      <section className={ui.card}>
        <div className="mb-5">
          <p className={ui.eyebrow}>Local Emergency & Utility Directory</p>
          <h2 className={`mt-2 ${ui.heading}`}>Society emergency contacts</h2>
          <p className={`mt-2 ${ui.body}`}>Configure the resident speed dial directory for hospitals, police, vendors, and maintenance agencies.</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {[
            { label: 'Nearest Hospital', value: hospital, setter: setHospital, placeholder: 'Hospital phone number' },
            { label: 'Ambulance Rail', value: ambulance, setter: setAmbulance, placeholder: 'Ambulance contact' },
            { label: 'Local Police Station', value: police, setter: setPolice, placeholder: 'Police station number' },
            { label: 'On-Call Plumber', value: plumber, setter: setPlumber, placeholder: 'Plumber number' },
            { label: 'On-Call Electrician', value: electrician, setter: setElectrician, placeholder: 'Electrician number' },
            { label: 'Elevator Maintenance Agency', value: elevator, setter: setElevator, placeholder: 'Elevator agency contact' }
          ].map((field) => (
            <label key={field.label} className="space-y-2">
              <span className={ui.label}>{field.label}</span>
              <input
                value={field.value}
                onChange={(event) => field.setter(event.target.value)}
                className={ui.input}
                placeholder={field.placeholder}
              />
            </label>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button type="button" onClick={handleDirectorySave} className={ui.btnPrimary}>
            Save directory
          </button>
          {saveMessage && <p className="text-sm text-emerald-600">{saveMessage}</p>}
        </div>
      </section>

      {isOwner && (
        <section className={`${ui.card} mb-8`}>
          <div className="mb-6">
            <p className={ui.eyebrow}>User Directory & Password Management</p>
            <h2 className={`mt-2 ${ui.heading}`}>Resident and Gatekeeper Credentials</h2>
            <p className={`mt-2 ${ui.body}`}>Review flat assignments and trigger mock password overrides without exposing raw credentials.</p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-syncra-surface-alt">
            <div className="grid grid-cols-1 gap-0 text-xs uppercase tracking-[0.35em] bg-syncra-surface px-6 py-4 text-slate-500 md:grid-cols-[1fr_2fr_1fr_150px]">
              <span>Flat / Role</span>
              <span>Name</span>
              <span>Username</span>
              <span className="sr-only">Action</span>
            </div>
            {directoryUsers.map((directoryUser) => (
              <div key={`${directoryUser.username}-${directoryUser.flat_number}`} className="grid grid-cols-1 gap-4 border-t border-slate-200 px-6 py-4 text-sm text-slate-700 md:grid-cols-[1fr_2fr_1fr_150px]">
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-syncra-primary">{directoryUser.flat_number}</span>
                  <span className="text-xs text-slate-500 uppercase">{directoryUser.role}</span>
                </div>
                <span>{directoryUser.name}</span>
                <span>{directoryUser.username}</span>
                <button
                  type="button"
                  onClick={() => handleOpenResetModal(directoryUser)}
                  className={ui.btnSecondary}
                >
                  Reset/Modify Password
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {directoryModalOpen && selectedUser && (
        <div className={ui.overlay}>
          <div className={`${ui.modal} w-full max-w-2xl`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className={ui.eyebrow}>Password override</p>
                <h2 className={`mt-2 ${ui.heading}`}>{selectedUser.name}</h2>
                <p className={`mt-1 ${ui.body}`}>Flat {selectedUser.flat_number} · {selectedUser.role}</p>
              </div>
              <button type="button" onClick={() => setDirectoryModalOpen(false)} className={ui.btnGhost}>
                Close
              </button>
            </div>
            <div className="mt-6 grid gap-4">
              <label className="space-y-2">
                <span className={ui.label}>New temporary password</span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className={ui.input}
                  placeholder="Enter new password"
                />
              </label>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setDirectoryModalOpen(false)} className={ui.btnGhost}>
                  Cancel
                </button>
                <button type="button" onClick={handleSavePassword} className={ui.btnPrimary}>
                  Save override
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-8">
        <PaymentSettlement />
        <BankStatementReconciliation />
        <RwaBillingEngine />
        <div className="grid gap-6 xl:grid-cols-2">
          <LateFeeSettings />
          <GatekeeperProvisioning />
        </div>
        <DefaulterBoard />
      </div>
    </>
  )
}
