import { Bell } from 'lucide-react';
import { useHospital } from '../contexts/HospitalContext';
import { useAuth } from '../contexts/AuthContext';

export default function NotificationsPage() {
  const { state, dispatch } = useHospital();
  const { user } = useAuth();
  const notifs = state.notifications.filter(n => !n.for || n.for === user?.role);

  const typeDot: Record<string, string> = {
    critical: '#B86F52',
    warning: '#C39A52',
    success: '#34483A',
    info: '#78856F',
  };

  return (
    <div className="p-6 space-y-5 max-w-2xl" style={{ background: '#F8F6F1', minHeight: '100%' }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Bell size={20} className="text-[#C39A52]" />
            Notifications
          </h1>
          <p className="page-subtitle">{notifs.filter(n => !n.read).length} unread</p>
        </div>
        <button
          onClick={() => notifs.forEach(n => dispatch({ type: 'MARK_NOTIFICATION_READ', id: n.id }))}
          className="btn btn-secondary btn-sm"
        >
          Mark all read
        </button>
      </div>

      {notifs.length === 0 ? (
        <div className="card p-8 text-center text-[#8C8A83] text-sm">No notifications</div>
      ) : (
        <div className="space-y-2">
          {notifs.map(n => (
            <div
              key={n.id}
              onClick={() => dispatch({ type: 'MARK_NOTIFICATION_READ', id: n.id })}
              className={`card flex items-start gap-3 cursor-pointer transition-opacity ${n.read ? 'opacity-60' : ''}`}
            >
              <span
                className="status-dot mt-1 shrink-0"
                style={{ background: n.read ? '#C8C3BB' : (typeDot[n.type] ?? '#78856F') }}
              />
              <div className="flex-1">
                <div className="text-sm text-[#292824]">{n.message}</div>
                <div className="text-xs text-[#8C8A83] mt-0.5">{n.time} {n.read ? '· Read' : '· Unread'}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
