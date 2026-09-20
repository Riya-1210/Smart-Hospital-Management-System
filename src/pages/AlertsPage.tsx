import { useState } from 'react';
import { Bell, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useHospital } from '../contexts/HospitalContext';
import { useAuth } from '../contexts/AuthContext';

export default function AlertsPage() {
  const { state, dispatch } = useHospital();
  const { user } = useAuth();

  const roleAlerts = state.notifications.filter(n => !n.for || n.for === user?.role);
  const [dismissed, setDismissed] = useState<string[]>([]);

  const visible = roleAlerts.filter(n => !dismissed.includes(n.id));

  const markRead = (id: string) => {
    dispatch({ type: 'MARK_NOTIFICATION_READ', id });
  };

  const dismiss = (id: string) => {
    setDismissed(prev => [...prev, id]);
    markRead(id);
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertTriangle size={16} className="shrink-0" style={{ color: '#B86F52' }} />;
      case 'warning':  return <AlertTriangle size={16} className="shrink-0" style={{ color: '#C39A52' }} />;
      case 'success':  return <CheckCircle size={16} className="shrink-0" style={{ color: '#34483A' }} />;
      default:         return <Info size={16} className="shrink-0" style={{ color: '#78856F' }} />;
    }
  };

  const typeBg = (type: string) => {
    switch (type) {
      case 'critical': return { background: '#FBF0EC', borderColor: '#D4957E' };
      case 'warning':  return { background: '#FBF4EF', borderColor: '#D9B97A' };
      case 'success':  return { background: '#EFF3ED', borderColor: '#A8B39F' };
      default:         return { background: '#F2EFE8', borderColor: '#C8C3BB' };
    }
  };

  return (
    <div className="p-6 space-y-5 max-w-2xl" style={{ background: '#F8F6F1', minHeight: '100%' }}>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Bell size={20} className="text-[#C39A52]" />
            Alerts & Notifications
          </h1>
          <p className="page-subtitle">{visible.filter(n => !n.read).length} unread alerts</p>
        </div>
        <span className="badge badge-amber">Demo / Simulation</span>
      </div>

      {visible.length === 0 ? (
        <div className="card text-center py-14">
          <CheckCircle size={32} className="mx-auto mb-3 text-[#78856F] opacity-60" />
          <div className="text-sm text-[#8C8A83]">All clear — no active alerts</div>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map(n => (
            <div
              key={n.id}
              className="border rounded-lg p-3 flex items-start gap-3"
              style={typeBg(n.type)}
            >
              {typeIcon(n.type)}
              <div className="flex-1 min-w-0">
                <div className="text-sm text-[#292824]">{n.message}</div>
                <div className="text-xs text-[#8C8A83] mt-0.5">{n.time}</div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {!n.read && (
                  <button
                    onClick={() => markRead(n.id)}
                    className="text-xs text-[#34483A] hover:text-[#78856F] px-2 py-1 rounded border border-[#A8B39F]"
                  >
                    Mark Read
                  </button>
                )}
                <button onClick={() => dismiss(n.id)} className="text-[#8C8A83] hover:text-[#292824] p-1">
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
