import { Navigate } from 'react-router-dom'

/** Legacy RWA index — president analytics live under /admin/dashboard. */
export default function RwaDashboard() {
  return <Navigate to="/admin/dashboard" replace />
}
