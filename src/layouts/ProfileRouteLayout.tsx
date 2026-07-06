import DashboardLayout from './DashboardLayout'
import ProfileSettings from '../pages/shared/ProfileSettings'

export default function ProfileRouteLayout() {
  return (
    <DashboardLayout title="Profile & Settings">
      <ProfileSettings />
    </DashboardLayout>
  )
}
