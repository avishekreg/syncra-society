import React from 'react'
import { Routes, Route } from 'react-router-dom'
import AuthPage from '../pages/AuthPage'
import SignIn from '../pages/auth/SignIn'
import SignUp from '../pages/auth/SignUp'
import VerifyEmail from '../pages/auth/VerifyEmail'

export default function AuthRouter() {
  return (
    <Routes>
      <Route path="signin" element={<SignIn />} />
      <Route path="signup" element={<SignUp />} />
      <Route path="verify-email" element={<VerifyEmail />} />
      <Route path="" element={<AuthPage />} />
    </Routes>
  )
}
