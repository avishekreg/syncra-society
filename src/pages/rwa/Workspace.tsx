import React from 'react'
import { Navigate } from 'react-router-dom'

/** Legacy monolithic workspace — redirect to split cashflow view. */
export default function RwaWorkspace() {
  return <Navigate to="/rwa/workspace/cashflow" replace />
}
