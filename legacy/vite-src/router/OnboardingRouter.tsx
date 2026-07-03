import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import OnboardingPage from '../pages/onboarding/OnboardingPage'
import ActivationPage from '../pages/onboarding/ActivationPage'
import FlatConfigurationPage from '../pages/onboarding/FlatConfigurationPage'

export default function OnboardingRouter() {
  return (
    <Routes>
      <Route path="" element={<OnboardingPage />} />
      <Route path="activation" element={<ActivationPage />} />
      <Route path="flats" element={<FlatConfigurationPage />} />
      <Route path="*" element={<Navigate to="/onboarding" replace />} />
    </Routes>
  )
}
