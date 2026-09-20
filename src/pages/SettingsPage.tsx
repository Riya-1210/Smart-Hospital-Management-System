import { useState } from 'react';
import { Settings, User, Shield, Bell, Activity } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const ROLES_DESC: Record<string, { label: string; access: string[] }> = {
  admin: { label: "Hospital Administrator", access: ["Full access to all modules", "All AI recommendations", "User management", "Audit trail", "Configuration"] },
  doctor: { label: "Doctor", access: ["Patient management", "Doctor scheduling", "Emergency & ICU patient overview", "AI decision support"] },
  nurse: { label: "Nurse", access: ["Patient monitoring", "Bed status", "Follow-up tracking", "Alert notifications"] },
  patient: { label: "Patient", access: ["Personal health data", "Appointments", "Prescriptions", "Recovery tracking"] },
};

export default function SettingsPage() {
  const { user } = useAuth();
  const roleInfo = user ? ROLES_DESC[user.role] : null;
  const [notifications, setNotifications] = useState({ critical: true, high: true, moderate: true, agentAlerts: true, approvals: true });

  return (
    <div className="p-6 space-y-6" style={{ background: '#F8F6F1', minHeight: '100%' }}>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Settings size={20} className="text-[#78856F]" />
            Settings
          </h1>
          <p className="page-subtitle">Account, preferences, and system configuration</p>
        </div>
        <span className="badge badge-amber">Demo / Simulation</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* User Profile */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <User size={15} className="text-[#78856F]" />
            <h3 className="section-title" style={{ marginBottom: 0 }}>User Profile</h3>
          </div>

          <div className="flex items-center gap-3 mb-4 p-3 rounded-lg" style={{ background: '#F2EFE8' }}>
            <div className="w-10 h-10 bg-[#78856F] rounded-full flex items-center justify-center text-base font-bold text-white shrink-0">
              {user?.avatar}
            </div>
            <div>
              <div className="text-sm font-semibold text-[#292824]">{user?.name}</div>
              <div className="text-xs text-[#8C8A83]">{user?.department}</div>
              <div className="text-xs text-[#78856F] capitalize font-semibold mt-0.5">{user?.role}</div>
            </div>
          </div>

          {roleInfo && (
            <div>
              <div className="text-xs font-semibold text-[#5C5A54] mb-2">Role: {roleInfo.label}</div>
              <div className="space-y-1.5">
                {roleInfo.access.map(a => (
                  <div key={a} className="flex items-center gap-1.5 text-sm text-[#5C5A54]">
                    <span className="text-[#78856F] shrink-0">✓</span> {a}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Alert Preferences */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Bell size={15} className="text-[#C39A52]" />
            <h3 className="section-title" style={{ marginBottom: 0 }}>Alert Preferences</h3>
          </div>

          <div className="space-y-3">
            {Object.entries(notifications).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between py-2 border-b border-[#F2EFE8] last:border-0">
                <div>
                  <div className="text-sm text-[#292824] capitalize">{key.replace(/([A-Z])/g, ' $1')} Alerts</div>
                  <div className="text-xs text-[#8C8A83]">
                    {key === 'critical' ? 'Life-critical events' :
                     key === 'high' ? 'High-risk AI alerts' :
                     key === 'moderate' ? 'Moderate risk notifications' :
                     key === 'agentAlerts' ? 'AI agent status updates' :
                     'AI recommendation approvals'}
                  </div>
                </div>
                <button
                  onClick={() => setNotifications(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
                  className="w-10 h-5 rounded-full transition-colors shrink-0 relative"
                  style={{ background: val ? '#34483A' : '#C8C3BB' }}
                >
                  <span
                    className="absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all"
                    style={{ left: val ? '1.25rem' : '0.125rem' }}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={15} className="text-[#78856F]" />
            <h3 className="section-title" style={{ marginBottom: 0 }}>System Status</h3>
          </div>
          <div className="space-y-2">
            {[
              { label: "AI Agent Status", value: "8/8 Online", color: '#34483A' },
              { label: "Data Mode", value: "DEMO / SIMULATION", color: '#C39A52' },
              { label: "Platform Version", value: "v1.0.0 — IBM Hackathon", color: '#5C5A54' },
              { label: "Real-time Updates", value: "Active (8s interval)", color: '#34483A' },
              { label: "Human-in-the-Loop", value: "Enabled", color: '#34483A' },
              { label: "Audit Logging", value: "Active", color: '#34483A' },
            ].map(s => (
              <div key={s.label} className="flex justify-between text-sm py-1.5 border-b border-[#F2EFE8] last:border-0">
                <span className="text-[#8C8A83]">{s.label}</span>
                <span className="font-medium" style={{ color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Safety & Compliance */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={15} className="text-[#78856F]" />
            <h3 className="section-title" style={{ marginBottom: 0 }}>Safety & Compliance</h3>
          </div>
          <div className="rounded-lg p-3 mb-4 border" style={{ background: '#F5EDD8', borderColor: '#D9B97A' }}>
            <div className="text-xs font-semibold text-[#9A7535] mb-2">⚠ IMPORTANT SAFETY NOTICE</div>
            <div className="text-sm text-[#5C5A54] space-y-1">
              <div>• AI-generated outputs are decision-support recommendations only</div>
              <div>• AI does NOT autonomously make clinical decisions</div>
              <div>• Final treatment decisions must remain with qualified medical professionals</div>
              <div>• High and Critical recommendations require human approval</div>
              <div>• All data in this system is synthetic demo/simulation data</div>
              <div>• No real patient information is stored or processed</div>
            </div>
          </div>
          <div className="space-y-2">
            {[
              { label: "Data Privacy", value: "Synthetic data only — no real patients" },
              { label: "Approval Required", value: "HIGH + CRITICAL risk levels" },
              { label: "Audit Trail", value: "All AI actions logged with timestamp" },
              { label: "Human Override", value: "Available at all times" },
            ].map(s => (
              <div key={s.label} className="flex justify-between text-sm py-1.5 border-b border-[#F2EFE8] last:border-0">
                <span className="text-[#8C8A83]">{s.label}</span>
                <span className="text-[#34483A] font-medium">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
