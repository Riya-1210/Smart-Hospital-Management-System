import type React from 'react';
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useHospital } from '../contexts/HospitalContext';
import {
  LayoutDashboard, AlertTriangle, Users, BedDouble, Pill,
  UserCheck, Truck, Network, TrendingUp, Box, Zap, UserCog, Brain,
  FileText, BookOpen, Settings, LogOut, Bell, Activity,
  Menu, X, Calendar, Heart, CheckSquare
} from 'lucide-react';
import clsx from 'clsx';
import HospitalAssistant from './HospitalAssistant';

const navByRole: Record<string, { icon: any; label: string; to: string }[]> = {
  /* Final system roles: patient, doctor, nurse, admin */
  patient: [
    { to: '/patient/dashboard',      icon: LayoutDashboard, label: 'Home' },
    { to: '/patient/appointments',   icon: Calendar,        label: 'Appointments' },
    { to: '/patient/prescriptions',  icon: Pill,            label: 'Prescriptions' },
    { to: '/patient/recovery',       icon: Heart,           label: 'Recovery' },
    { to: '/patient/follow-up',      icon: UserCog,         label: 'Follow-up' },
    { to: '/patient/notifications',  icon: Bell,            label: 'Notifications' },
    { to: '/patient/profile',        icon: Settings,        label: 'Profile' },
  ],
  doctor: [
    { to: '/doctor/dashboard',        icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/doctor/patients',         icon: Users,           label: 'My Patients' },
    { to: '/doctor/emergency',        icon: AlertTriangle,   label: 'Emergency Cases' },
    { to: '/doctor/appointments',     icon: Calendar,        label: 'Appointments' },
    { to: '/doctor/recommendations',  icon: Brain,           label: 'AI Recommendations' },
    { to: '/doctor/alerts',           icon: Bell,            label: 'Alerts' },
    { to: '/doctor/profile',          icon: Settings,        label: 'Profile' },
  ],
  nurse: [
    { to: '/nurse/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/nurse/patients',   icon: Users,           label: 'Patients' },
    { to: '/nurse/beds',       icon: BedDouble,       label: 'Beds' },
    { to: '/nurse/tasks',      icon: CheckSquare,     label: 'Tasks' },
    { to: '/nurse/alerts',     icon: Bell,            label: 'Alerts' },
    { to: '/nurse/profile',    icon: Settings,        label: 'Profile' },
  ],
  admin: [
    { to: '/admin/dashboard',       icon: LayoutDashboard, label: 'Overview' },
    { to: '/admin/emergency',       icon: AlertTriangle,   label: 'Emergency Center' },
    { to: '/admin/patients',        icon: Users,           label: 'Patients' },
    { to: '/admin/resources',       icon: BedDouble,       label: 'Beds & Resources' },
    { to: '/admin/pharmacy',        icon: Pill,            label: 'Pharmacy Intelligence' },
    { to: '/admin/doctors',         icon: UserCheck,       label: 'Doctor Scheduling' },
    { to: '/admin/ambulance',       icon: Truck,           label: 'Ambulance & Transfer' },
    { to: '/admin/network',         icon: Network,         label: 'Hospital Network' },
    { to: '/admin/crisis',          icon: TrendingUp,      label: 'Crisis Prediction' },
    { to: '/admin/digital-twin',    icon: Box,             label: 'Digital Twin' },
    { to: '/admin/simulator',       icon: Zap,             label: 'Crisis Simulator' },
    { to: '/admin/recommendations', icon: Brain,           label: 'AI Recommendations' },
    { to: '/admin/audit',           icon: FileText,        label: 'Audit Trail' },
    { to: '/admin/follow-up',       icon: UserCog,         label: 'Patient Follow-up' },
    { to: '/admin/knowledge',       icon: BookOpen,        label: 'Knowledge Assistant' },
    { to: '/admin/settings',        icon: Settings,        label: 'Settings' },
  ],
};

const notifPath: Record<string, string> = {
  patient: '/patient/notifications',
  doctor:  '/doctor/alerts',
  nurse:   '/nurse/alerts',
  admin:   '/admin/recommendations',
};

const roleLabel: Record<string, string> = {
  admin: 'Administrator',
  doctor: 'Doctor',
  nurse: 'Nurse',
  patient: 'Patient',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { state } = useHospital();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const role = user?.role || 'admin';
  const navItems = navByRole[role] || navByRole.admin;
  const unreadNotifs = state.notifications.filter(n => !n.read).length;
  const pendingApprovals = state.recommendations.filter(r => r.status === 'Pending').length;
  const handleLogout = () => { logout(); navigate('/'); };
  const bellTarget = notifPath[role] || '/';

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-neutral-300">
        <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Activity size={16} className="text-white" />
        </div>          <div>
            <div className="text-neutral-900 font-bold text-xs leading-tight tracking-tight">SMART HOSPITAL</div>
            <div className="text-primary-600 text-[9px] font-bold tracking-widest uppercase">Management System</div>
          </div>
      </div>

      {/* Role badge */}
      <div className="px-4 py-2.5 border-b border-neutral-200 bg-primary-50">
        <div className="text-[10px] text-neutral-500 uppercase tracking-wide">Signed in as</div>
        <div className="text-xs font-semibold text-primary-700 mt-0.5">{roleLabel[role] || role}</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) => clsx(
              "flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all text-sm font-medium relative",
              isActive
                ? "text-primary-700 bg-primary-50 border border-primary-200"
                : "text-neutral-600 hover:text-neutral-900 hover:bg-primary-50/50"
            )}
          >
            <item.icon size={15} className="flex-shrink-0" />
            <span>{item.label}</span>
            {item.label === 'AI Recommendations' && pendingApprovals > 0 && (
              <span className="ml-auto min-w-[18px] h-[18px] bg-critical-400 rounded-full text-[9px] text-white flex items-center justify-center font-bold px-1">
                {pendingApprovals}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-neutral-300 p-2 bg-neutral-100">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {user?.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-neutral-900 truncate">{user?.name}</div>
            <div className="text-[10px] text-neutral-500 truncate">{user?.department}</div>
          </div>
          <button onClick={handleLogout} className="text-neutral-400 hover:text-critical-500 transition-colors ml-1" title="Sign out">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-neutral-100 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 border-r border-neutral-300 flex-shrink-0 bg-white">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-56 border-r border-neutral-300 shadow-card-lg">
            <button onClick={() => setMobileOpen(false)} className="absolute top-3 right-3 text-neutral-500 hover:text-neutral-900">
              <X size={18} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="flex items-center justify-between px-5 py-3 bg-white border-b border-neutral-300 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-neutral-500 hover:text-neutral-900" onClick={() => setMobileOpen(true)}>
              <Menu size={20} />
            </button>
            <div className="hidden sm:flex items-center gap-1.5 bg-warning-50 border border-warning-200 rounded-full px-3 py-1">
              <span className="w-1.5 h-1.5 bg-warning-400 rounded-full flex-shrink-0" />
              <span className="text-[10px] text-warning-600 font-semibold tracking-wider uppercase">Demo / Simulation Data</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-success-400 rounded-full animate-pulse flex-shrink-0" />
              <span className="text-xs text-neutral-500 hidden sm:block">AI Active</span>
            </div>
            <button
              onClick={() => navigate(bellTarget)}
              className="relative text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              <Bell size={18} />
              {unreadNotifs > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-critical-400 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                  {unreadNotifs > 9 ? '9+' : unreadNotifs}
                </span>
              )}
            </button>
            <div className="w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
              {user?.avatar}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-neutral-100">
          {children}
        </main>

        {/* Safety Footer */}
        <div className="bg-white border-t border-neutral-300 px-4 py-1.5 flex-shrink-0">
          <p className="text-[10px] text-neutral-500 text-center">
            ⚠️ AI recommendations are decision-support only and do not replace qualified medical professionals. All data is synthetic demonstration data only.
          </p>
        </div>
      </div>

      {/* Floating Hospital Assistant — available on every authenticated page */}
      <HospitalAssistant />
    </div>
  );
}
