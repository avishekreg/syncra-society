import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import RoleScopeGuard from './RoleScopeGuard'
import SocietySetupGuard from './SocietySetupGuard'
import SubscriptionActivationGuard from './SubscriptionActivationGuard'
import SuperAdminRouteShell from './SuperAdminRouteShell'
import SuperAdminOverview from '../pages/super-admin/Overview'
import SuperAdminSocieties from '../pages/super-admin/Societies'
import SuperAdminPricingHub from '../pages/super-admin/PricingHub'
import SuperAdminMasterConfig from '../pages/super-admin/MasterConfig'
import { ui } from '../lib/ui'

const LandingPage = lazy(() => import('../pages/LandingPage'))
const TermsAndConditions = lazy(() => import('../pages/legal/TermsAndConditions'))
const PrivacyPolicy = lazy(() => import('../pages/legal/PrivacyPolicy'))
const RefundPolicy = lazy(() => import('../pages/legal/RefundPolicy'))
const AuthRouter = lazy(() => import('./AuthRouter'))
const SignUp = lazy(() => import('../pages/auth/SignUp'))
const OnboardingRouter = lazy(() => import('./OnboardingRouter'))
const RwaRouter = lazy(() => import('./RwaRouter'))
const AdminRouter = lazy(() => import('./AdminRouter'))
const FinanceRouter = lazy(() => import('./FinanceRouter'))
const ResidentRouter = lazy(() => import('./ResidentRouter'))

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className={ui.loading}>Loading...</div>}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/legal/terms" element={<TermsAndConditions />} />
          <Route path="/legal/privacy" element={<PrivacyPolicy />} />
          <Route path="/legal/refund" element={<RefundPolicy />} />
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
            <Route index element={<SuperAdminOverview />} />
            <Route path="societies" element={<SuperAdminSocieties />} />
            <Route path="pricing" element={<SuperAdminPricingHub />} />
            <Route path="master-config" element={<SuperAdminMasterConfig />} />
            <Route path="payments" element={<Navigate to="/super-admin/master-config" replace />} />
            <Route path="subscriptions" element={<Navigate to="/super-admin/pricing" replace />} />
          </Route>

          <Route
            path="/admin/*"
            element={
              <ProtectedRoute>
                <RoleScopeGuard scope="society">
                  <SocietySetupGuard>
                    <SubscriptionActivationGuard>
                      <AdminRouter />
                    </SubscriptionActivationGuard>
                  </SocietySetupGuard>
                </RoleScopeGuard>
              </ProtectedRoute>
            }
          />

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
            path="/finance/*"
            element={
              <ProtectedRoute>
                <RoleScopeGuard scope="society">
                  <SocietySetupGuard>
                    <SubscriptionActivationGuard>
                      <FinanceRouter />
                    </SubscriptionActivationGuard>
                  </SocietySetupGuard>
                </RoleScopeGuard>
              </ProtectedRoute>
            }
          />
          <Route path="/dashboard/*" element={<Navigate to="/resident" replace />} />
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
