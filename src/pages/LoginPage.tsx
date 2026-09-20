import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Activity, Eye, EyeOff, ArrowRight, Check } from 'lucide-react';
import { roleDashboard } from '../App';
import { ROLE_META, PRIMARY_ROLES, ROLE_ICONS, getRoleVisual, getRoleLabel, type RoleId } from '../lib/roleTheme';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  // Pre-select role from ?role= (landing page role cards / footer quick links)
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get('role');
  const validInitial = PRIMARY_ROLES.includes(roleParam as RoleId)
    ? (roleParam as RoleId)
    : 'doctor';
  const [selectedRole, setSelectedRole] = useState<RoleId>(validInitial);
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const visual = getRoleVisual(selectedRole);
  const roleMeta = ROLE_META[selectedRole];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Real authentication against the users table via /api/auth/login.
      // The selected role is a UI hint; the backend decides the actual role.
      const email =
        selectedRole === 'admin' ? 'admin@hospital.com' :
        selectedRole === 'doctor' ? 'amit@hospital.com' :
        selectedRole === 'patient' ? 'rahul@gmail.com' :
        'nurse@hospital.com';
      const u = await login(email, password, selectedRole);
      navigate(roleDashboard[u.role] || '/admin/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = (roleId: RoleId) => {
    setSelectedRole(roleId);
    setError('');
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white" style={visual.vars}>
      {/* ─── Left brand panel ─── */}
      <div className="login-brand relative hidden lg:flex flex-col justify-between w-[42%] max-w-[560px] p-10 xl:p-14 text-white overflow-hidden">
        <div className="login-brand-dotgrid absolute inset-0 opacity-40 pointer-events-none" />
        <div className="hero-glow w-72 h-72 -top-16 -right-16" style={{ background: 'rgb(var(--rc) / 0.45)' }} />

        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center border border-white/20" style={{ background: 'rgb(var(--rc) / 0.35)' }}>
              <Activity size={22} className="text-white" />
            </div>
            <div>
              <div className="font-bold tracking-tight">Smart Hospital</div>
              <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/60">Management System</div>
            </div>
          </div>
        </div>

        <div className="relative">
          <h2 className="text-3xl xl:text-4xl font-bold leading-tight mb-4">
            Smarter Care.<br />Better Coordination.<br />
            <span style={{ color: 'rgb(190 215 245)' }}>Healthier Outcomes.</span>
          </h2>
          <p className="text-sm text-white/70 max-w-sm leading-relaxed">
            One connected hospital platform — appointments, emergency response, beds, doctors and pharmacy, supported by AI-assisted operations intelligence.
          </p>
        </div>

        <div className="relative space-y-2.5">
          {['AI-assisted triage & resource prediction', 'Human-in-the-loop approvals on every action', 'Full audit trail & decision explainability'].map(t => (
            <div key={t} className="flex items-center gap-2.5 text-xs text-white/80">
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'rgb(190 215 245)' }} />
              {t}
            </div>
          ))}
          <p className="text-[10px] text-white/40 pt-2">Demonstration environment · All data synthetic</p>
        </div>
      </div>

      {/* ─── Right form panel ─── */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-10 sm:px-10 bg-white">
        <div className="w-full max-w-xl">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-6">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 text-white" style={{ background: 'rgb(var(--rc))' }}>
              <Activity size={22} />
            </div>
            <h1 className="text-xl font-bold text-neutral-900">Smart Hospital Management System</h1>
          </div>

          <h2 className="text-2xl font-bold text-neutral-900 mb-1">Sign in to your workspace</h2>
          <p className="text-sm text-neutral-600 mb-6">Select your role to continue. The theme and access adapt to it.</p>

          {/* Demo credentials helper — accounts come from the real users table */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 mb-5">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">Demo accounts (password: demo123)</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-neutral-600">
              <span><b>admin</b> admin@hospital.com</span>
              <span><b>doctor</b> amit@hospital.com</span>
              <span><b>patient</b> rahul@gmail.com</span>
              <span><b>nurse</b> nurse@hospital.com</span>
            </div>
          </div>

          {/* ─── Role selector (the fix) ─── */}
          <div
            role="radiogroup"
            aria-label="Select your role"
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7"
          >
            {PRIMARY_ROLES.map(roleId => {
              const meta = ROLE_META[roleId];
              const Icon = ROLE_ICONS[roleId] || Activity;
              const selected = selectedRole === roleId;
              return (
                <button
                  key={roleId}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => handleRoleSelect(roleId)}
                  className={`role-card ${selected ? 'role-card-selected' : ''}`}
                  style={meta.visual.vars}
                >
                  {selected && (
                    <span className="role-check" aria-hidden="true">
                      <Check size={13} strokeWidth={3} />
                    </span>
                  )}
                  <div className="role-card-icon">
                    <Icon size={19} />
                  </div>
                  <div className="text-[13px] font-bold text-neutral-900 mt-2.5 leading-tight">{meta.label}</div>
                  <div className="text-[10px] text-neutral-500 mt-0.5 leading-snug">{meta.desc}</div>
                </button>
              );
            })}
          </div>

          {/* ─── Login form ─── */}
          <form onSubmit={handleLogin} style={visual.vars}>
            <div className="bg-neutral-100 border border-neutral-200 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white flex-shrink-0" style={{ background: 'rgb(var(--rc))' }}>
                  <span className="text-xs font-bold">{selectedRole.slice(0, 2).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-neutral-900">{roleMeta?.label || getRoleLabel(selectedRole)} workspace</div>
                  <div className="text-[11px] text-neutral-500 truncate font-mono">{roleMeta?.loginEmail || `${selectedRole}@hospital.demo`}</div>
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full" style={{ background: 'rgb(var(--rc-tint))', color: 'rgb(var(--rc-strong))' }}>
                  {visual.identity}
                </span>
              </div>
            </div>

            <label className="block text-xs font-medium text-neutral-700 mb-1.5" htmlFor="login-password">Password</label>
            <div className="relative mb-4">
              <input
                id="login-password"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter demo123"
                autoComplete="current-password"
                className="w-full bg-white border border-neutral-300 rounded-xl px-3.5 py-3 text-sm text-neutral-900 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 pr-10 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                aria-label={showPass ? 'Hide password' : 'Show password'}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-[11px] text-neutral-500 -mt-2 mb-4">Demo password: <span className="font-mono font-semibold" style={{ color: 'rgb(var(--rc-strong))' }}>demo123</span> — verified against the hospital database</p>

            {error && (
              <div className="bg-critical-50 border border-critical-200 rounded-xl p-3 mb-4">
                <p className="text-xs text-critical-600 font-medium">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading} className="role-login-btn">
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  Login as {getRoleLabel(selectedRole)}
                  <ArrowRight size={16} />
                </span>
              )}
            </button>
          </form>

          <p className="text-center text-[11px] text-neutral-500 mt-5 leading-relaxed">
            ⚠️ AI outputs are decision-support only. All data is synthetic.
          </p>
        </div>
      </div>
    </div>
  );
}
