import { useAuth } from '../contexts/AuthContext';
import { User, Shield, Building2, Hash, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ROLE_DETAILS: Record<string, { label: string; color: string; access: string[] }> = {
  admin:      { label: 'Hospital Administrator', color: '#34483A', access: ['Full system access', 'All AI recommendations', 'Audit trail', 'Settings & configuration'] },
  doctor:     { label: 'Doctor',                  color: '#78856F',   access: ['Patient management', 'Appointment scheduling', 'Emergency & ICU patient overview', 'AI decision support'] },
  nurse:      { label: 'Nurse',                   color: '#78856F',  access: ['Patient monitoring', 'Bed management', 'Care tasks', 'Alert notifications'] },
  patient:    { label: 'Patient',                 color: '#78856F',   access: ['Personal health data', 'Appointments', 'Prescriptions', 'Recovery tracking'] },
};

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const roleDetails = user ? ROLE_DETAILS[user.role] : null;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="p-6 space-y-5 max-w-xl" style={{ background: '#F8F6F1', minHeight: '100%' }}>
      <div>
        <h1 className="page-title flex items-center gap-2">
          <User size={20} className="text-[#78856F]" />
          My Profile
        </h1>
        <p className="page-subtitle">Your account information and access level</p>
      </div>

      {/* Avatar & Name */}
      <div className="card flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold text-white shrink-0"
          style={{ background: '#78856F' }}
        >
          {user?.avatar}
        </div>
        <div>
          <div className="text-lg font-bold text-[#292824]">{user?.name}</div>
          <div className="text-sm font-medium" style={{ color: roleDetails?.color ?? '#8C8A83' }}>
            {roleDetails?.label}
          </div>
          <div className="text-xs text-[#8C8A83] mt-0.5">{user?.department}</div>
        </div>
      </div>

      {/* Account Details */}
      <div className="card">
        <h3 className="section-title">Account Details</h3>
        {[
          { icon: Hash, label: 'User ID', value: user?.id || '—' },
          { icon: Building2, label: 'Department', value: user?.department || '—' },
          { icon: Shield, label: 'Role', value: roleDetails?.label || '—' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-3 py-2.5 border-b border-[#F2EFE8] last:border-0">
            <item.icon size={14} className="text-[#8C8A83] shrink-0" />
            <div className="flex-1">
              <div className="text-xs text-[#8C8A83]">{item.label}</div>
              <div className="text-sm text-[#292824] font-medium">{item.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Access Level */}
      <div className="card">
        <h3 className="section-title flex items-center gap-2">
          <Shield size={14} className="text-[#78856F]" />
          Your Access Level
        </h3>
        <div className="space-y-2">
          {roleDetails?.access.map(a => (
            <div key={a} className="flex items-center gap-2 text-sm text-[#5C5A54]">
              <span className="text-[#78856F] shrink-0">✓</span>
              {a}
            </div>
          ))}
        </div>
      </div>

      {/* Sign Out */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 btn btn-danger"
      >
        <LogOut size={15} />
        Sign Out
      </button>

      <p className="text-xs text-[#8C8A83] text-center">
        This is a demonstration system. All data is synthetic.
      </p>
    </div>
  );
}
