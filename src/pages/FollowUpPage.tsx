import { useState } from 'react';
import { UserCog, AlertTriangle, Calendar, Bell } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { followUpPatients } from '../data/demoData';

const RECOVERY_VALUES = { 'Improving': 4, 'Stable': 3, 'Worsening': 1 };

export default function FollowUpPage() {
  const [selected, setSelected] = useState<typeof followUpPatients[0] | null>(null);

  return (
    <div className="p-6 space-y-6" style={{ background: '#F8F6F1', minHeight: '100%' }}>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <UserCog size={20} className="text-[#78856F]" />
            Patient Follow-up
          </h1>
          <p className="page-subtitle">Post-discharge recovery monitoring and deviation detection</p>
        </div>
        <span className="badge badge-amber">Demo / Simulation</span>
      </div>

      {/* Alerts */}
      {followUpPatients.filter(p => p.alert).map(p => (
        <div
          key={p.id}
          className="rounded-lg p-3 border flex items-center gap-3"
          style={{
            background: p.alert?.includes('deviation') ? '#FBF4EF' : '#FBF0EC',
            borderColor: p.alert?.includes('deviation') ? '#D9B97A' : '#D4957E',
          }}
        >
          <AlertTriangle
            size={16}
            className="shrink-0"
            style={{ color: p.alert?.includes('deviation') ? '#C39A52' : '#B86F52' }}
          />
          <div>
            <span className="text-sm font-semibold text-[#292824]">{p.name}</span>
            <span className="text-xs text-[#8C8A83] ml-2">— {p.alert}</span>
          </div>
          <div className="ml-auto text-xs text-[#C39A52] font-semibold">Clinical Review Recommended</div>
        </div>
      ))}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Patient List */}
        <div className="space-y-3">
          {followUpPatients.map(p => (
            <div
              key={p.id}
              onClick={() => setSelected(p)}
              className={`card cursor-pointer transition-all ${
                selected?.id === p.id
                  ? 'border-[#34483A]'
                  : 'hover:border-[#A8B39F]'
              } ${p.alert ? 'border-[#D9B97A]' : ''}`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="text-sm font-semibold text-[#292824]">{p.name}</div>
                  <div className="text-xs text-[#8C8A83]">{p.diagnosis}</div>
                </div>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full border shrink-0"
                  style={{
                    color: p.status === 'On Track' ? '#34483A' : p.status === 'Monitoring' ? '#9A7535' : '#8F5540',
                    background: p.status === 'On Track' ? '#E8EDE6' : p.status === 'Monitoring' ? '#F5EDD8' : '#FBF0EC',
                    borderColor: p.status === 'On Track' ? '#C5CEBC' : p.status === 'Monitoring' ? '#D9B97A' : '#D4957E',
                  }}
                >
                  {p.status}
                </span>
              </div>

              <div className="flex justify-between text-xs text-[#8C8A83] mb-2">
                <span>Discharged: {p.dischargeDate}</span>
                <span>Next: {p.nextCheckIn}</span>
              </div>

              {/* Recovery Trend Sparkline */}
              <div className="flex items-center gap-1">
                {p.recoveryTrend.map((t, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                    <div
                      className="text-sm font-bold"
                      style={{
                        color: t === 'Worsening' ? '#B86F52' : t === 'Stable' ? '#8C8A83' : '#34483A',
                      }}
                    >
                      {t === 'Improving' ? '↑' : t === 'Stable' ? '→' : '↓'}
                    </div>
                    <div className="text-[10px] text-[#8C8A83]">D{p.days[i]}</div>
                  </div>
                ))}
              </div>

              {p.alert && (
                <div className="mt-2 text-xs text-[#C39A52] flex items-center gap-1">
                  <AlertTriangle size={11} />
                  {p.alert}
                </div>
              )}
              {p.missedAppointments > 0 && (
                <div className="mt-1 text-xs text-[#B86F52]">
                  {p.missedAppointments} missed appointment(s)
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Detail Panel */}
        {selected ? (
          <div className="lg:col-span-2 space-y-4">
            <div className="card">
              <div className="flex items-start justify-between flex-wrap gap-2 mb-4">
                <div>
                  <h3 className="text-base font-bold text-[#292824]">{selected.name}</h3>
                  <div className="text-sm text-[#8C8A83]">{selected.diagnosis}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-[#8C8A83]">Follow-up Doctor</div>
                  <div className="text-sm font-medium text-[#292824]">{selected.doctor}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {[
                  { label: 'Discharged', value: selected.dischargeDate },
                  { label: 'Follow-up Date', value: selected.followUpDate },
                  { label: 'Next Check-in', value: selected.nextCheckIn, warn: selected.nextCheckIn === 'Overdue' },
                  { label: 'Missed Appts', value: selected.missedAppointments, warn: selected.missedAppointments > 0 },
                ].map(item => (
                  <div key={item.label} className="bg-[#F2EFE8] rounded-lg p-2">
                    <div className="text-xs text-[#8C8A83]">{item.label}</div>
                    <div
                      className="text-sm font-semibold mt-0.5"
                      style={{ color: item.warn ? '#B86F52' : '#292824' }}
                    >
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <div className="text-xs font-semibold text-[#5C5A54] mb-2">Current Medications:</div>
                <div className="flex flex-wrap gap-1">
                  {selected.medicines.map(m => (
                    <span key={m} className="badge badge-green">{m}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Recovery Trend Chart */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="section-title" style={{ marginBottom: 0 }}>Recovery Trend Analysis</h3>
                {selected.alert?.includes('deviation') && (
                  <span className="badge badge-amber">Deviation Detected</span>
                )}
              </div>

              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={selected.days.map((d, i) => ({
                  day: `Day ${d}`,
                  score: RECOVERY_VALUES[selected.recoveryTrend[i] as keyof typeof RECOVERY_VALUES] || 3,
                  status: selected.recoveryTrend[i],
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2DDD5" />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#8C8A83' }} />
                  <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11, fill: '#8C8A83' }} />
                  <Tooltip
                    contentStyle={{ background: '#fff', border: '1px solid #E2DDD5', fontSize: '13px', borderRadius: '8px', color: '#292824' }}
                    formatter={(_, __, props) => [props.payload.status, 'Status']}
                  />
                  <Line type="monotone" dataKey="score" stroke="#78856F" strokeWidth={2}
                    dot={{ fill: '#34483A', r: 5 }} activeDot={{ fill: '#B86F52', r: 7 }} />
                </LineChart>
              </ResponsiveContainer>

              <div className="flex justify-around mt-3">
                {selected.recoveryTrend.map((t, i) => (
                  <div key={i} className="text-center">
                    <div
                      className="text-xs font-semibold"
                      style={{ color: t === 'Worsening' ? '#B86F52' : t === 'Stable' ? '#8C8A83' : '#34483A' }}
                    >
                      {t}
                    </div>
                    <div className="text-xs text-[#8C8A83]">Day {selected.days[i]}</div>
                  </div>
                ))}
              </div>

              {selected.alert && (
                <div className="mt-3 rounded-lg p-3 border" style={{ background: '#F5EDD8', borderColor: '#D9B97A' }}>
                  <div className="text-xs font-bold text-[#9A7535] mb-1">Recovery Deviation Detected</div>
                  <div className="text-sm text-[#5C5A54]">{selected.alert}</div>
                  <div className="text-xs text-[#C39A52] mt-1">→ Clinical review recommended by {selected.doctor}</div>
                  <div className="text-xs text-[#8C8A83] mt-1 italic">AI observation only — does not constitute medical diagnosis or treatment recommendation</div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="card">
              <h3 className="section-title">Follow-up Actions</h3>
              <div className="flex flex-wrap gap-2">
                <button className="btn btn-primary btn-sm flex items-center gap-1.5">
                  <Bell size={13} />Send Reminder
                </button>
                <button className="btn btn-secondary btn-sm flex items-center gap-1.5">
                  <Calendar size={13} />Schedule Appointment
                </button>
                <button className="btn btn-secondary btn-sm">View Medical History</button>
                {selected.alert && (
                  <button className="btn btn-danger btn-sm">Flag for Clinical Review</button>
                )}
              </div>
              <p className="text-xs text-[#8C8A83] mt-3 italic">
                All follow-up actions are operational/administrative support only. Clinical decisions must be made by qualified healthcare professionals.
              </p>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 card flex items-center justify-center py-14">
            <div className="text-center text-[#8C8A83]">
              <UserCog size={36} className="mx-auto mb-3 opacity-30" />
              <div className="text-sm">Select a patient to view follow-up details</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
