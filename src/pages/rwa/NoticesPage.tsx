import { Navigate } from 'react-router-dom'

/** Legacy notices route — dedicated president notices view. */
export default function NoticesPage() {
  return <Navigate to="/admin/notices" replace />
}
