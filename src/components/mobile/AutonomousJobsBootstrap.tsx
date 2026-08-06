import React, { useEffect } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import { startAutonomousJobRunner } from '../../services/autonomousJobs'

/** Mounts zero-intervention background sweeps for the active society. */
export default function AutonomousJobsBootstrap() {
  const { currentSocietyId } = useAuth()

  useEffect(() => {
    if (!currentSocietyId) return
    return startAutonomousJobRunner(currentSocietyId)
  }, [currentSocietyId])

  return null
}
