import { Heart } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const trend = [
  { day: 'Day 1', score: 4, status: 'Improving' },
  { day: 'Day 2', score: 4, status: 'Improving' },
  { day: 'Day 3', score: 3, status: 'Stable' },
  { day: 'Day 4', score: 3, status: 'Stable' },
];

export default function RecoveryPage() {
  return (
    <div className="p-6 space-y-5 max-w-2xl" style={{ background: '#F8F6F1', minHeight: '100%' }}>
      <div>
        <h1 className="page-title flex items-center gap-2">
          <Heart size={20} className="text-[#B9827A]" />
          My Recovery
        </h1>
        <p className="page-subtitle">Post-discharge recovery tracking and progress</p>
      </div>

      <div className="card">
        <h3 className="section-title">Recovery Trend</h3>
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={trend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2DDD5" />
            <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#8C8A83' }} />
            <YAxis domain={[0, 5]} tick={{ fontSize: 11, fill: '#8C8A83' }} />
            <Tooltip
              contentStyle={{ background: '#fff', border: '1px solid #E2DDD5', fontSize: '13px', borderRadius: '8px', color: '#292824' }}
              formatter={(_, __, props) => [props.payload.status, 'Status']}
            />
            <Line type="monotone" dataKey="score" stroke="#78856F" strokeWidth={2} dot={{ fill: '#34483A', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex justify-between mt-3">
          {trend.map((t, i) => (
            <div key={i} className="text-center">
              <div
                className="text-lg font-bold"
                style={{ color: t.status === 'Worsening' ? '#B86F52' : t.status === 'Stable' ? '#8C8A83' : '#34483A' }}
              >
                {t.status === 'Improving' ? '↑' : t.status === 'Stable' ? '→' : '↓'}
              </div>
              <div className="text-xs text-[#8C8A83]">{t.day}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ borderColor: '#A8B39F', background: '#EFF3ED' }}>
        <div className="text-sm font-semibold text-[#34483A]">Recovery Status: On Track ✓</div>
        <div className="text-sm text-[#5C5A54] mt-1">
          Your recovery is progressing well. Follow your prescribed medications and attend your follow-up appointments.
        </div>
      </div>

      <p className="text-xs text-[#8C8A83] italic text-center">
        Demonstration data only. For real recovery guidance, consult your doctor.
      </p>
    </div>
  );
}
