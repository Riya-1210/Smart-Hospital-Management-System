import type React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { api, setToken, type BackendUser } from '../lib/api';

/**
 * AuthContext — role identity + theme. Backed by the REAL users table via
 * /api/auth/login. Kept the exact same public surface (user, login, logout,
 * isAuthenticated) so all existing pages keep working unchanged.
 *
 * Final supported roles (frontend id ← DB role):
 *   admin ← ADMIN, doctor ← DOCTOR, nurse ← NURSE, patient ← PATIENT.
 */
type Role = 'admin' | 'doctor' | 'nurse' | 'patient';

interface User {
  id: string;
  userId: number;
  name: string;
  role: Role;
  department: string;
  avatar: string;
  email: string;
  doctorId?: number;
  patientId?: number;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, roleHint: Role) => Promise<User>;
  logout: () => void;
  isAuthenticated: boolean;
  dbUser: BackendUser | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Role → royal color theme. Doctor=blue, Patient=green, Admin=gold, Nurse=violet.
// Applied via [data-role] on <html>.
const ROLE_THEME: Record<string, string> = {
  doctor: 'doctor',
  patient: 'patient',
  admin: 'admin',
  nurse: 'nurse',
};

/** Map a DB role name to the frontend role id. */
function mapDbRole(dbRole: string): Role {
  switch (dbRole) {
    case 'ADMIN': return 'admin';
    case 'DOCTOR': return 'doctor';
    case 'NURSE': return 'nurse';
    case 'PATIENT': return 'patient';
    default: return 'patient'; // unreachable with the final role set
  }
}

function avatarFor(name: string): string {
  const parts = name.replace(/^Dr\.\s*/i, '').trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || 'U';
}

function departmentFor(u: BackendUser): string {
  if (u.doctor?.department) return u.doctor.department;
  switch (u.role) {
    case 'ADMIN': return 'Hospital Administration';
    case 'DOCTOR': return 'Medical Staff';
    case 'NURSE': return 'Nursing';
    case 'PATIENT': return 'Patient';
    default: return 'Staff';
  }
}

function applyRoleTheme(role: string | null | undefined) {
  const theme = (role && ROLE_THEME[role]) || '';
  if (theme) {
    document.documentElement.setAttribute('data-role', theme);
  } else {
    document.documentElement.removeAttribute('data-role');
  }
}

function toFrontendUser(u: BackendUser): User {
  const role = mapDbRole(u.role);
  return {
    id: `U-${String(u.user_id).padStart(3, '0')}`,
    userId: u.user_id,
    name: u.full_name,
    role,
    department: departmentFor(u),
    avatar: avatarFor(u.full_name),
    email: u.email,
    doctorId: u.doctor?.doctor_id,
    patientId: u.patient?.patient_id,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('hcc_user');
      const parsed = saved ? JSON.parse(saved) : null;
      if (parsed?.role) applyRoleTheme(parsed.role);
      return parsed;
    } catch {
      return null;
    }
  });
  const [dbUser, setDbUser] = useState<BackendUser | null>(null);

  // A 401 from the API client means the saved token expired/invalid —
  // drop the stale session so the user is returned to the login screen.
  useEffect(() => {
    const onExpired = () => {
      setUser(null);
      setDbUser(null);
      applyRoleTheme(null);
    };
    window.addEventListener('hcc-session-expired', onExpired);
    return () => window.removeEventListener('hcc-session-expired', onExpired);
  }, []);

  const login = async (email: string, password: string, _roleHint: Role): Promise<User> => {
    const res = await api.post<{ token: string; user: BackendUser }>('/api/auth/login', { email, password });
    setToken(res.token);
    setDbUser(res.user);
    const u = toFrontendUser(res.user);
    setUser(u);
    localStorage.setItem('hcc_user', JSON.stringify(u));
    applyRoleTheme(u.role);
    // Notify HospitalContext to hydrate live data now that a token exists
    window.dispatchEvent(new Event('hcc-login'));
    return u;
  };

  const logout = () => {
    setUser(null);
    setDbUser(null);
    setToken(null);
    localStorage.removeItem('hcc_user');
    applyRoleTheme(null);
    // Reset hospital live-data so no authenticated data lingers on screen
    window.dispatchEvent(new Event('hcc-logout'));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, dbUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
