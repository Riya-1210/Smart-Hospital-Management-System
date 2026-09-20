import { useNavigate } from 'react-router-dom';
import { useHospital } from '../../contexts/HospitalContext';
import { useAuth } from '../../contexts/AuthContext';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import RiskBadge from '../../components/RiskBadge';
import PriorityBadge from '../../components/PriorityBadge';
import AgentFeed from '../../components/AgentFeed';
import { icuTrendData, dashboardMetrics } from '../../data/demoData';

const bedData = [
  { category: 'ICU', occupied: 7, available: 2 },
  { category: 'General', occupied: 17, available: 7 },
  { category: 'Private', occupied: 3, available: 5 },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { state, approveRec, rejectRec } = useHospital();
  const { user } = useAuth();

  const critical = state.patients.filter(p => p.priority === 'Critical' && p.status === 'Active');
  const pending = state.recommendations.filter(r => r.status === 'Pending');
  const unread = state.notifications.filter(n => !n.read);

  const icuBeds = state.beds.filter(b => b.type === 'ICU');
  const icuOcc = icuBeds.length ? Math.round((icuBeds.filter(b => b.status === 'Occupied').length / icuBeds.length) * 100) : 0;
  const availableBeds = state.beds.filter(b => b.status === 'Available').length;
  const hour = new Date().getHours();

  return (
    <div className="p-5 space-y-5">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Good {hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'}, {user?.name}
          </h1>
          <p className="page-subtitle">Smart Hospital Management System — today's overview</p>
        </div>
        <button
          onClick={() => navigate('/admin/emergency')}
          className="btn-danger flex items-center gap-2"
        >
          <AlertTriangle size={14} />
          Emergency Center
        </button>
      </div>

      {/* Alert banners */}
      {unread.filter(n => n.type === 'critical' || n.type === 'warning').slice(0, 2).map(n => (
        <div key={n.id} className={n.type === 'critical' ? 'alert-critical' : 'alert-warning'}>
          <span className="text-sm flex-shrink-0">{n.type === 'critical' ? '🚨' : '⚠️'}</span>
          <p className="text-sm text-neutral-800 flex-1">{n.message}</p>
          <button
            onClick={() => navigate('/admin/recommendations')}
            className="text-xs text-primary-600 font-semibold flex-shrink-0 hover:underline"
          >
            View →
          </button>
        </div>
      ))}

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Active Emergencies', value: state.emergencyCases.filter(e => e.status !== 'Discharged').length, icon: '🚨', critical: true, to: '/admin/emergency' },
          { label: 'ICU Utilization', value: `${icuOcc}%`, icon: '🛏️', critical: icuOcc > 80, to: '/admin/resources' },
          { label: 'Available Beds', value: availableBeds, icon: '✓', to: '/admin/resources' },
          { label: 'Pending Approvals', value: pending.length, icon: '🤖', to: '/admin/recommendations' },
          { label: 'AI Response Time', value: dashboardMetrics.emergencyResponseTime.value, icon: '⚡' },
          { label: 'AI Accuracy', value: dashboardMetrics.aiAccuracy.value, icon: '🎯' },
        ].map(metric => (
          <div
            key={metric.label}
            onClick={metric.to ? () => navigate(metric.to!) : undefined}
            className={`card flex flex-col gap-1 ${metric.to ? 'cursor-pointer hover:border-primary-300' : ''}`}
          >
            <div className="text-lg leading-none mb-0.5">{metric.icon}</div>
            <div className={`text-xl font-bold ${metric.critical ? 'text-critical-500' : 'text-neutral-900'}`}>{metric.value}</div>
            <div className="text-xs text-neutral-600">{metric.label}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ICU Trend */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-neutral-900">ICU Occupancy — Current & Predicted</h3>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${icuOcc > 80 ? 'badge-critical' : 'badge-low'}`}>
              {icuOcc > 80 ? '⚠ Overload Risk' : '✓ Within Capacity'}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={icuTrendData}>
              <defs>
                <linearGradient id="icuGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#176B5B" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#176B5B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#DDE5E1" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#9CA5A0' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#9CA5A0' }} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #DDE5E1', borderRadius: '8px', fontSize: '12px' }} formatter={(value) => [`${value}%`, 'Occupancy']} />
              <Area type="monotone" dataKey="occupancy" stroke="#176B5B" fill="url(#icuGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* AI Agents */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-neutral-900">AI Agents</h3>
            <span className="badge-low text-xs">8 Active</span>
          </div>
          <div className="space-y-2">
            {[
              { icon: '🚑', name: 'Triage Agent', status: 'Active', actions: state.agentMetrics?.['Triage Agent']?.actions || 14 },
              { icon: '🛏️', name: 'Bed Agent', status: 'Active', actions: state.agentMetrics?.['Bed Agent']?.actions || 11 },
              { icon: '👨‍⚕️', name: 'Doctor Agent', status: 'Active', actions: state.agentMetrics?.['Doctor Agent']?.actions || 9 },
              { icon: '💊', name: 'Medicine Agent', status: 'Alert', actions: state.agentMetrics?.['Medicine Agent']?.actions || 8 },
              { icon: '🔮', name: 'Crisis Agent', status: 'Alert', actions: state.agentMetrics?.['Crisis Agent']?.actions || 6 },
              { icon: '🧠', name: 'Orchestrator', status: 'Active', actions: state.agentMetrics?.['Orchestrator']?.actions || 22 },
            ].map(agent => (
              <div key={agent.name} className="flex items-center gap-2">
                <span className="text-sm leading-none">{agent.icon}</span>
                <span className="flex-1 text-xs font-medium text-neutral-800 truncate">{agent.name}</span>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${agent.status === 'Alert' ? 'bg-warning-100 text-warning-600' : 'bg-success-100 text-success-600'}`}>
                  {agent.status}
                </span>
                <span className="text-[10px] text-neutral-500 w-4 text-right">{agent.actions}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Critical Patients */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-neutral-900">Critical Patients</h3>
            <button onClick={() => navigate('/admin/patients')} className="text-xs text-primary-600 hover:underline font-medium">All →</button>
          </div>
          <div className="space-y-1">
            {critical.slice(0, 4).map(patient => (
              <div
                key={patient.id}
                onClick={() => navigate('/admin/patients')}
                className="flex items-center gap-2 py-2 border-b border-neutral-200 last:border-0 cursor-pointer hover:bg-primary-50/50 rounded px-1 transition-colors"
              >
                <PriorityBadge priority={patient.priority} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-neutral-900 truncate">{patient.name}</div>
                  <div className="text-[10px] text-neutral-500">{patient.department}</div>
                </div>
                <div className="text-[10px] text-neutral-500 text-right">
                  <div>{patient.vitals.hr} bpm</div>
                  <div className={patient.vitals.spo2 < 95 ? 'text-critical-500 font-semibold' : ''}>{patient.vitals.spo2}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Predicted Risks */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-neutral-900">Predicted Risks</h3>
            <button onClick={() => navigate('/admin/crisis')} className="text-xs text-primary-600 hover:underline font-medium">All →</button>
          </div>
          <div className="space-y-1.5">
            {[
              { label: 'ICU may be full in 3 hours', risk: 'HIGH', icon: '🛏️', time: '~3 hrs' },
              { label: 'Propofol stock critically low', risk: 'CRITICAL', icon: '💊', time: '~3 days' },
              { label: 'Ceftriaxone below reorder level', risk: 'CRITICAL', icon: '💊', time: '~2 days' },
              { label: 'Emergency dept congestion risk', risk: 'MEDIUM', icon: '🚨', time: '~6 hrs' },
            ].map(risk => (
              <div
                key={risk.label}
                onClick={() => navigate('/admin/crisis')}
                className="flex items-start gap-2 py-2 border-b border-neutral-200 last:border-0 cursor-pointer hover:bg-primary-50/50 rounded px-1 transition-colors"
              >
                <span className="text-sm flex-shrink-0 leading-none mt-0.5">{risk.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-neutral-800 leading-snug">{risk.label}</div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">In {risk.time}</div>
                </div>
                <RiskBadge risk={risk.risk} />
              </div>
            ))}
          </div>
        </div>

        {/* Pending approvals */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-neutral-900">Needs Approval</h3>
            <button onClick={() => navigate('/admin/recommendations')} className="text-xs text-primary-600 hover:underline font-medium">All →</button>
          </div>
          {pending.length === 0 ? (
            <div className="text-xs text-success-600 text-center py-4 flex items-center justify-center gap-1">
              <CheckCircle size={12} /> No pending approvals
            </div>
          ) : (
            <div className="space-y-2">
              {pending.slice(0, 3).map(rec => (
                <div key={rec.id} className="bg-neutral-100 border border-neutral-200 rounded-lg p-3">
                  <div className="flex items-start gap-2 mb-2">
                    <RiskBadge risk={rec.risk} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-neutral-900">{rec.action}</div>
                      <div className="text-[10px] text-neutral-500 mt-0.5">{rec.agent}</div>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => approveRec(rec.id, user?.name || 'Admin')} className="flex-1 text-[10px] bg-success-400 hover:bg-success-500 text-white py-1.5 rounded font-semibold transition-colors">
                      ✓ Approve
                    </button>
                    <button onClick={() => rejectRec(rec.id, user?.name || 'Admin')} className="flex-1 text-[10px] bg-neutral-200 hover:bg-neutral-300 text-neutral-700 py-1.5 rounded transition-colors">
                      ✕ Reject
                    </button>
                    <button onClick={() => navigate('/admin/recommendations')} className="flex-1 text-[10px] bg-neutral-200 hover:bg-neutral-300 text-neutral-700 py-1.5 rounded transition-colors">
                      Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Activity + Bed chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Live AI Activity */}
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-success-400 rounded-full animate-pulse flex-shrink-0" />
            <h3 className="text-sm font-semibold text-neutral-900">Live AI Activity</h3>
            <span className="ml-auto demo-tag">Simulated</span>
          </div>
          <AgentFeed maxItems={5} />
        </div>

        {/* Bed Capacity */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-neutral-900">Bed Capacity</h3>
            <button onClick={() => navigate('/admin/resources')} className="text-xs text-primary-600 hover:underline font-medium">Details →</button>
          </div>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={bedData} barGap={3}>
              <CartesianGrid strokeDasharray="3 3" stroke="#DDE5E1" vertical={false} />
              <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#9CA5A0' }} />
              <YAxis tick={{ fontSize: 10, fill: '#9CA5A0' }} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #DDE5E1', borderRadius: '8px', fontSize: '12px' }} />
              <Bar dataKey="occupied" name="Occupied" fill="#C65A52" radius={[3, 3, 0, 0]} />
              <Bar dataKey="available" name="Available" fill="#176B5B" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
