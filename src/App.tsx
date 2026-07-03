import React from 'react'
import AppRouter from './router/AppRouter'
import { AuthProvider } from './providers/AuthProvider'

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  )
}
