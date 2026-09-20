import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AgentProvider } from './contexts/AgentContext';
import { HospitalProvider } from './contexts/HospitalContext';
import Layout from './components/Layout';

// Core pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EmergencyPage from './pages/EmergencyPage';
import PatientsPage from './pages/PatientsPage';
import BedsPage from './pages/BedsPage';
import PharmacyPage from './pages/PharmacyPage';
import DoctorsPage from './pages/DoctorsPage';
import AmbulancePage from './pages/AmbulancePage';
import NetworkPage from './pages/NetworkPage';
import CrisisPage from './pages/CrisisPage';
import TwinPage from './pages/TwinPage';
import SimulatorPage from './pages/SimulatorPage';
import FollowUpPage from './pages/FollowUpPage';
import RecommendationsPage from './pages/RecommendationsPage';
import AuditPage from './pages/AuditPage';
import KnowledgePage from './pages/KnowledgePage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';

// Additional pages
import ProfilePage from './pages/ProfilePage';
import TasksPage from './pages/TasksPage';
import AlertsPage from './pages/AlertsPage';

// Lazy-loaded patient/simple pages
const AppointmentsPage = React.lazy(() => import('./pages/AppointmentsPage'));
const MyMedicinesPage   = React.lazy(() => import('./pages/MyMedicinesPage'));
const RecoveryPage      = React.lazy(() => import('./pages/RecoveryPage'));
const NotificationsPage = React.lazy(() => import('./pages/NotificationsPage'));

// Role → default dashboard path (final system: 4 roles)
export const roleDashboard: Record<string, string> = {
  patient:    '/patient/dashboard',
  doctor:     '/doctor/dashboard',
  nurse:      '/nurse/dashboard',
  admin:      '/admin/dashboard',
};

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

function RootRedirect() {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <LandingPage />;
  return <Navigate to={roleDashboard[user?.role || 'admin'] || '/admin/dashboard'} replace />;
}

function LoginRedirect() {
  const { isAuthenticated, user } = useAuth();
  if (isAuthenticated) return <Navigate to={roleDashboard[user?.role || 'admin'] || '/admin/dashboard'} replace />;
  return <LoginPage />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginRedirect />} />

      {/* ─── PATIENT ─── */}
      <Route path="/patient/dashboard"      element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/patient/appointments"   element={<ProtectedRoute><AppointmentsPage /></ProtectedRoute>} />
      <Route path="/patient/prescriptions"  element={<ProtectedRoute><MyMedicinesPage /></ProtectedRoute>} />
      <Route path="/patient/recovery"       element={<ProtectedRoute><RecoveryPage /></ProtectedRoute>} />
      <Route path="/patient/follow-up"      element={<ProtectedRoute><FollowUpPage /></ProtectedRoute>} />
      <Route path="/patient/notifications"  element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
      <Route path="/patient/profile"        element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

      {/* ─── DOCTOR ─── */}
      <Route path="/doctor/dashboard"         element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/doctor/patients"          element={<ProtectedRoute><PatientsPage /></ProtectedRoute>} />
      <Route path="/doctor/emergency"         element={<ProtectedRoute><EmergencyPage /></ProtectedRoute>} />
      <Route path="/doctor/appointments"      element={<ProtectedRoute><AppointmentsPage /></ProtectedRoute>} />
      <Route path="/doctor/recommendations"   element={<ProtectedRoute><RecommendationsPage /></ProtectedRoute>} />
      <Route path="/doctor/alerts"            element={<ProtectedRoute><AlertsPage /></ProtectedRoute>} />
      <Route path="/doctor/profile"           element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

      {/* ─── NURSE ─── */}
      <Route path="/nurse/dashboard"  element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/nurse/patients"   element={<ProtectedRoute><PatientsPage /></ProtectedRoute>} />
      <Route path="/nurse/beds"       element={<ProtectedRoute><BedsPage /></ProtectedRoute>} />
      <Route path="/nurse/tasks"      element={<ProtectedRoute><TasksPage /></ProtectedRoute>} />
      <Route path="/nurse/alerts"     element={<ProtectedRoute><AlertsPage /></ProtectedRoute>} />
      <Route path="/nurse/profile"    element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

      {/* ─── ADMIN ─── */}
      <Route path="/admin/dashboard"        element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/admin/emergency"        element={<ProtectedRoute><EmergencyPage /></ProtectedRoute>} />
      <Route path="/admin/patients"         element={<ProtectedRoute><PatientsPage /></ProtectedRoute>} />
      <Route path="/admin/resources"        element={<ProtectedRoute><BedsPage /></ProtectedRoute>} />
      <Route path="/admin/pharmacy"         element={<ProtectedRoute><PharmacyPage /></ProtectedRoute>} />
      <Route path="/admin/doctors"          element={<ProtectedRoute><DoctorsPage /></ProtectedRoute>} />
      <Route path="/admin/ambulance"        element={<ProtectedRoute><AmbulancePage /></ProtectedRoute>} />
      <Route path="/admin/network"          element={<ProtectedRoute><NetworkPage /></ProtectedRoute>} />
      <Route path="/admin/crisis"           element={<ProtectedRoute><CrisisPage /></ProtectedRoute>} />
      <Route path="/admin/digital-twin"     element={<ProtectedRoute><TwinPage /></ProtectedRoute>} />
      <Route path="/admin/simulator"        element={<ProtectedRoute><SimulatorPage /></ProtectedRoute>} />
      <Route path="/admin/recommendations"  element={<ProtectedRoute><RecommendationsPage /></ProtectedRoute>} />
      <Route path="/admin/audit"            element={<ProtectedRoute><AuditPage /></ProtectedRoute>} />
      <Route path="/admin/follow-up"        element={<ProtectedRoute><FollowUpPage /></ProtectedRoute>} />
      <Route path="/admin/knowledge"        element={<ProtectedRoute><KnowledgePage /></ProtectedRoute>} />
      <Route path="/admin/settings"         element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

      {/* Legacy flat routes → redirect to role dashboard for convenience */}
      <Route path="/dashboard"        element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/emergency"        element={<ProtectedRoute><EmergencyPage /></ProtectedRoute>} />
      <Route path="/patients"         element={<ProtectedRoute><PatientsPage /></ProtectedRoute>} />
      <Route path="/beds"             element={<ProtectedRoute><BedsPage /></ProtectedRoute>} />
      <Route path="/pharmacy"         element={<ProtectedRoute><PharmacyPage /></ProtectedRoute>} />
      <Route path="/doctors"          element={<ProtectedRoute><DoctorsPage /></ProtectedRoute>} />
      <Route path="/ambulance"        element={<ProtectedRoute><AmbulancePage /></ProtectedRoute>} />
      <Route path="/network"          element={<ProtectedRoute><NetworkPage /></ProtectedRoute>} />
      <Route path="/crisis"           element={<ProtectedRoute><CrisisPage /></ProtectedRoute>} />
      <Route path="/twin"             element={<ProtectedRoute><TwinPage /></ProtectedRoute>} />
      <Route path="/simulator"        element={<ProtectedRoute><SimulatorPage /></ProtectedRoute>} />
      <Route path="/followup"         element={<ProtectedRoute><FollowUpPage /></ProtectedRoute>} />
      <Route path="/recommendations"  element={<ProtectedRoute><RecommendationsPage /></ProtectedRoute>} />
      <Route path="/audit"            element={<ProtectedRoute><AuditPage /></ProtectedRoute>} />
      <Route path="/knowledge"        element={<ProtectedRoute><KnowledgePage /></ProtectedRoute>} />
      <Route path="/settings"         element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="/appointments"     element={<ProtectedRoute><AppointmentsPage /></ProtectedRoute>} />
      <Route path="/my-medicines"     element={<ProtectedRoute><MyMedicinesPage /></ProtectedRoute>} />
      <Route path="/recovery"         element={<ProtectedRoute><RecoveryPage /></ProtectedRoute>} />
      <Route path="/notifications"    element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <HospitalProvider>
        <AgentProvider>
          <BrowserRouter>
            <React.Suspense fallback={<div className="min-h-screen bg-warm-900 flex items-center justify-center text-warm-500">Loading...</div>}>
              <AppRoutes />
            </React.Suspense>
          </BrowserRouter>
        </AgentProvider>
      </HospitalProvider>
    </AuthProvider>
  );
}
