import React from 'react'
import AppRouter from './router/AppRouter'
import { AuthProvider } from './providers/AuthProvider'
import { FeatureFlagsProvider } from './providers/FeatureFlagsProvider'
import { PlatformConfigProvider } from './providers/PlatformConfigProvider'

export default function App() {
  return (
    <AuthProvider>
      <PlatformConfigProvider>
        <FeatureFlagsProvider>
          <AppRouter />
        </FeatureFlagsProvider>
      </PlatformConfigProvider>
    </AuthProvider>
  )
}
