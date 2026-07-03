import React from 'react'
import { Routes, Route } from 'react-router-dom'
import AuthPage from '../pages/AuthPage'
import SignIn from '../pages/auth/SignIn'
import SignUp from '../pages/auth/SignUp'

export default function AuthRouter() {
  return (
    <Routes>
      <Route path="signin" element={<SignIn />} />
      <Route path="signup" element={<SignUp />} />
      <Route path="" element={<AuthPage />} />
    </Routes>
  )
}
