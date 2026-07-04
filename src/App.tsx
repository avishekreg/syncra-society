import React from 'react'
import AppRouter from './router/AppRouter'
import { AuthProvider } from './providers/AuthProvider'
import { PlatformConfigProvider } from './providers/PlatformConfigProvider'

export default function App() {
  return (
    <AuthProvider>
      <PlatformConfigProvider>
        <AppRouter />
      </PlatformConfigProvider>
    </AuthProvider>
  )
}
