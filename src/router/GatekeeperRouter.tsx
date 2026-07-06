import React from 'react'
import { Routes, Route, Navigate, useOutletContext } from 'react-router-dom'
import GatekeeperLayout from '../layouts/GatekeeperLayout'
import GatekeeperMinimalPortal from '../components/GatekeeperMinimalPortal'

type GatekeeperOutletContext = {
  societyId: string | null
  societyName: string
}

function GatekeeperWorkspace() {
  const { societyId, societyName } = useOutletContext<GatekeeperOutletContext>()
  return <GatekeeperMinimalPortal societyId={societyId} societyName={societyName} />
}

export default function GatekeeperRouter() {
  return (
    <Routes>
      <Route element={<GatekeeperLayout />}>
        <Route index element={<GatekeeperWorkspace />} />
        <Route path="*" element={<Navigate to="/gatekeeper" replace />} />
      </Route>
    </Routes>
  )
}
