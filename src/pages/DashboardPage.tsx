/**
 * DashboardPage — role-aware router.
 * Renders the correct dashboard for the logged-in role.
 * Final system roles: patient, doctor, nurse, admin.
 */
import { useAuth } from '../contexts/AuthContext';
import AdminDashboard from './dashboards/AdminDashboard';
import DoctorDashboard from './dashboards/DoctorDashboard';
import NurseDashboard from './dashboards/NurseDashboard';
import PatientDashboard from './dashboards/PatientDashboard';

export default function DashboardPage() {
  const { user } = useAuth();
  const role = user?.role || 'admin';

  switch (role) {
    case 'patient': return <PatientDashboard />;
    case 'doctor':  return <DoctorDashboard />;
    case 'nurse':   return <NurseDashboard />;
    default:        return <AdminDashboard />;
  }
}
