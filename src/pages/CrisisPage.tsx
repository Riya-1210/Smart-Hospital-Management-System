import { TrendingUp,  } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend } from 'recharts';
import RiskBadge from '../components/RiskBadge';
import { crisisPredictions } from '../data/demoData';

const CAPACITY_DATA = [
  { time: "Now", icu: 82, ed: 75, beds: 72 },
  { time: "+1h", icu: 86, ed: 78, beds: 74 },
  { time: "+2h", icu: 91, ed: 82, beds: 78 },
  { time: "+3h", icu: 96, ed: 88, beds: 83 },
  { time: "+4h", icu: 99, ed: 92, beds: 87 },
  { time: "+5h", icu: 100, ed: 95, beds: 90 },
];

const RADAR_DATA = [
  { factor: "ICU", current: 82, safe: 75 },
  { factor: "ED", current: 75, safe: 70 },
  { factor: "Meds", current: 55, safe: 50 },
  { factor: "Doctors", current: 78, safe: 70 },
  { factor: "OT", current: 60, safe: 55 },
];

const riskBorderLeft: Record<string, string> = {
  Critical: '#B86F52',
  High: '#C39A52',
  Moderate: '#78856F',
  Low: '#8C8A83',
};

export default function CrisisPage() {
  return (
    <div className="p-6 space-y-6" style={{ background: '#F8F6F1', minHeight: '100%' }}>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <TrendingUp size={20} className="text-[#B86F52]" />
            Crisis Prediction
          </h1>
          <p className="page-subtitle">AI early warning system for hospital operational crises</p>
        </div>
        <span className="badge badge-amber">Demo / Simulation</span>
      </div>

      {/* Active Predictions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {crisisPredictions.map(cp => (
          <div
            key={cp.id}
            className="card"
            style={{ borderLeftWidth: '3px', borderLeftColor: riskBorderLeft[cp.risk] ?? '#C8C3BB' }}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-sm font-bold text-[#292824]">{cp.type}</div>
                <div className="text-xs text-[#8C8A83] mt-0.5">ETA: {cp.timeToEvent}</div>
              </div>
              <RiskBadge risk={cp.risk as any} />
            </div>

            <div className="space-y-1.5 mb-3">
              <div className="flex justify-between text-sm">
                <span className="text-[#8C8A83]">Current State:</span>
                <span className="text-[#292824]">{cp.currentState}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#8C8A83]">Predicted:</span>
                <span className="text-[#B86F52] font-medium">{cp.predicted}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#8C8A83]">Confidence:</span>
                <span className="text-[#34483A] font-semibold">{cp.confidence}%</span>
              </div>
            </div>

            {/* Confidence Bar */}
            <div className="h-1.5 rounded-full bg-[#EDE8DE] overflow-hidden mb-3">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${cp.confidence}%`,
                  background: cp.risk === 'Critical' ? '#B86F52' : cp.risk === 'High' ? '#C39A52' : '#78856F',
                }}
              />
            </div>

            <div className="mb-2">
              <div className="text-xs font-medium text-[#8C8A83] mb-1">Contributing Factors</div>
              {cp.factors.map(f => (
                <div key={f} className="text-xs text-[#5C5A54] flex items-start gap-1.5 py-0.5">
                  <span className="text-[#C39A52] mt-0.5">•</span>
                  {f}
                </div>
              ))}
            </div>

            <div>
              <div className="text-xs font-medium text-[#8C8A83] mb-1">Recommended Actions</div>
              {cp.actions.map(a => (
                <div key={a} className="text-xs text-[#34483A] flex items-start gap-1.5 py-0.5">
                  <span className="mt-0.5">→</span>
                  {a}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Capacity Forecast */}
      <div className="card">
        <h3 className="section-title">Hospital Capacity Forecast (Next 5 Hours)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={CAPACITY_DATA}>
            <defs>
              <linearGradient id="icuGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#B86F52" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#B86F52" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="edGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#C39A52" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#C39A52" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2DDD5" />
            <XAxis dataKey="time" tick={{ fontSize: 12, fill: '#8C8A83' }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#8C8A83' }} />
            <Tooltip
              contentStyle={{
                background: '#fff',
                border: '1px solid #E2DDD5',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#292824',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', color: '#5C5A54' }} />
            <Area type="monotone" dataKey="icu" name="ICU %" stroke="#B86F52" fill="url(#icuGrad)" strokeWidth={2} />
            <Area type="monotone" dataKey="ed" name="ED %" stroke="#C39A52" fill="url(#edGrad)" strokeWidth={2} />
            <Area type="monotone" dataKey="beds" name="Beds %" stroke="#78856F" fill="none" strokeWidth={1.5} strokeDasharray="4 4" />
          </AreaChart>
        </ResponsiveContainer>
        <p className="text-xs text-[#8C8A83] mt-2">
          AI prediction — simulation data only. 100% = critical capacity threshold.
        </p>
      </div>

      {/* Risk Radar + Action Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card">
          <h3 className="section-title">Hospital Risk Radar</h3>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={RADAR_DATA}>
              <PolarGrid stroke="#E2DDD5" />
              <PolarAngleAxis dataKey="factor" tick={{ fontSize: 12, fill: '#8C8A83' }} />
              <Radar name="Current Load" dataKey="current" stroke="#B86F52" fill="#B86F52" fillOpacity={0.15} />
              <Radar name="Safe Threshold" dataKey="safe" stroke="#78856F" fill="#78856F" fillOpacity={0.08} strokeDasharray="4 4" />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#5C5A54' }} />
              <Tooltip
                contentStyle={{
                  background: '#fff',
                  border: '1px solid #E2DDD5',
                  fontSize: '13px',
                  borderRadius: '8px',
                  color: '#292824',
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="section-title">Preventive Action Log</h3>
          <div className="space-y-1">
            {[
              { time: "22:38", action: "ICU overflow protocol preparation initiated", status: "In Progress", risk: "High" as const },
              { time: "22:39", action: "Emergency medicine procurement requested", status: "Approved", risk: "Critical" as const },
              { time: "22:40", action: "Backup neurologist notified", status: "Pending", risk: "High" as const },
              { time: "22:41", action: "Elective procedures review initiated", status: "In Progress", risk: "Moderate" as const },
              { time: "22:42", action: "Discharge pathway expedited for 3 patients", status: "Complete", risk: "Low" as const },
            ].map(a => (
              <div key={a.time} className="flex items-center gap-3 py-2.5 border-b border-[#F2EFE8] last:border-0">
                <span className="text-xs font-mono text-[#8C8A83] shrink-0 w-11">{a.time}</span>
                <span className="text-sm text-[#292824] flex-1">{a.action}</span>
                <RiskBadge risk={a.risk} />
                <span
                  className="text-xs font-medium shrink-0"
                  style={{
                    color:
                      a.status === 'Complete' ? '#34483A' :
                      a.status === 'Approved' ? '#78856F' :
                      a.status === 'Pending' ? '#C39A52' :
                      '#5C5A54',
                  }}
                >
                  {a.status}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-[#8C8A83] mt-3 italic">
            All crisis response actions require appropriate human authorization.
          </p>
        </div>
      </div>
    </div>
  );
}
