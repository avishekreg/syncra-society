import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import RoleScopeGuard from './RoleScopeGuard'
import SocietySetupGuard from './SocietySetupGuard'
import SubscriptionActivationGuard from './SubscriptionActivationGuard'
import SuperAdminRouteShell from './SuperAdminRouteShell'
import SuperAdminDashboard from '../pages/super-admin/Dashboard'
import SuperAdminSocieties from '../pages/super-admin/Societies'
import SuperAdminPricing from '../pages/super-admin/Pricing'
import SuperAdminSubscriptions from '../pages/super-admin/Subscriptions'
import { ui } from '../lib/ui'

const LandingPage = lazy(() => import('../pages/LandingPage'))
const AuthRouter = lazy(() => import('./AuthRouter'))
const SignUp = lazy(() => import('../pages/auth/SignUp'))
const OnboardingRouter = lazy(() => import('./OnboardingRouter'))
const RwaRouter = lazy(() => import('./RwaRouter'))
const ResidentRouter = lazy(() => import('./ResidentRouter'))

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className={ui.loading}>Loading...</div>}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth/*" element={<AuthRouter />} />
          <Route path="/register" element={<SignUp />} />
          <Route
            path="/onboarding/*"
            element={
              <ProtectedRoute>
                <RoleScopeGuard scope="society">
                  <OnboardingRouter />
                </RoleScopeGuard>
              </ProtectedRoute>
            }
          />

          <Route path="/super-admin" element={<SuperAdminRouteShell />}>
            <Route index element={<SuperAdminDashboard />} />
            <Route path="societies" element={<SuperAdminSocieties />} />
            <Route path="pricing" element={<SuperAdminPricing />} />
            <Route path="subscriptions" element={<SuperAdminSubscriptions />} />
          </Route>

          <Route
            path="/rwa/*"
            element={
              <ProtectedRoute>
                <RoleScopeGuard scope="society">
                  <SocietySetupGuard>
                    <SubscriptionActivationGuard>
                      <RwaRouter />
                    </SubscriptionActivationGuard>
                  </SocietySetupGuard>
                </RoleScopeGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/resident/*"
            element={
              <ProtectedRoute>
                <RoleScopeGuard scope="resident">
                  <SocietySetupGuard>
                    <ResidentRouter />
                  </SocietySetupGuard>
                </RoleScopeGuard>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
