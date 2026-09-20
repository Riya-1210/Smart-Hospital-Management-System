import { useState } from 'react';
import { Pill } from 'lucide-react';
import RiskBadge from '../components/RiskBadge';
import { medicines } from '../data/demoData';

export default function PharmacyPage() {
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState<typeof medicines[0] | null>(null);

  const filtered = filter === 'All' ? medicines : medicines.filter(m => m.risk === filter);

  const stats = {
    critical: medicines.filter(m => m.risk === 'Critical').length,
    high: medicines.filter(m => m.risk === 'High').length,
    moderate: medicines.filter(m => m.risk === 'Moderate').length,
    expirySoon: medicines.filter(m => m.expiryDays <= 14).length,
  };

  return (
    <div className="p-4 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-warm-900 flex items-center gap-2">
            <Pill size={20} className="text-warm-600" />
            Pharmacy Intelligence
          </h1>
          <p className="text-xs text-warm-500 mt-0.5">AI-powered medicine shortage and waste prevention</p>
        </div>
        <span className="demo-tag">Demo / Simulation</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card text-center"><div className="text-2xl font-bold text-terra-500">{stats.critical}</div><div className="text-xs text-warm-500">Critical Risk</div></div>
        <div className="card text-center"><div className="text-2xl font-bold text-amber-600">{stats.high}</div><div className="text-xs text-warm-500">High Risk</div></div>
        <div className="card text-center"><div className="text-2xl font-bold text-amber-600">{stats.moderate}</div><div className="text-xs text-warm-500">Moderate Risk</div></div>
        <div className="card text-center"><div className="text-2xl font-bold text-terra-500">{stats.expirySoon}</div><div className="text-xs text-warm-500">Expiry ≤14 Days</div></div>
      </div>

      {/* Medicine Waste Prevention Feature */}
      <div className="card border-amber-300/30">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">♻️</span>
          <h3 className="text-sm font-bold text-warm-900">Medicine Waste Prevention</h3>
          <span className="badge-moderate">Unique Feature</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {medicines.filter(m => {
            const daysStock = m.stock / m.dailyUsage;
            return daysStock > m.expiryDays;
          }).slice(0, 3).map(m => {
            const daysStock = Math.round(m.stock / m.dailyUsage);
            const waste = Math.round((daysStock - m.expiryDays) * m.dailyUsage);
            return (
              <div key={m.id} className="bg-warm-50 border border-amber-200 rounded-xl p-3">
                <div className="text-xs font-bold text-warm-900 mb-1">{m.name}</div>
                <div className="grid grid-cols-2 gap-x-2 text-[10px] mb-2">
                  <span className="text-warm-500">Stock:</span><span className="text-warm-900">{m.stock} {m.unit}</span>
                  <span className="text-warm-500">Daily Use:</span><span className="text-warm-900">{m.dailyUsage}/day</span>
                  <span className="text-warm-500">Days stock:</span><span className="text-warm-900">{daysStock} days</span>
                  <span className="text-warm-500">Expires in:</span><span className="text-terra-500">{m.expiryDays} days</span>
                </div>
                <div className="bg-terra-100 border border-terra-200 rounded-lg p-2 mb-2">
                  <div className="text-xs text-terra-500 font-semibold">⚠️ Expiry Risk</div>
                  <div className="text-[10px] text-warm-700">~{waste} units may expire before use</div>
                </div>
                <div className="text-[10px] text-amber-600">→ Recommended: Prioritize usage, review procurement</div>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-warm-400 mt-3 italic">
          💊 Never recommend unsafe medication substitutions. All recommendations are operational only and require pharmacist review.
        </p>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['All', 'Critical', 'High', 'Moderate', 'Low'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${filter === f ? 'border-sage-600 bg-sage-700/20 text-warm-900' : 'border-warm-300 text-warm-500 hover:text-warm-900'}`}>{f}</button>
        ))}
      </div>

      {/* Medicine Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Daily Use</th>
                <th>Days Left</th>
                <th>Expiry (Days)</th>
                <th>Lead Time</th>
                <th>Risk</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => {
                const daysLeft = Math.round(m.stock / m.dailyUsage);
                const expiryWarning = daysLeft > m.expiryDays;
                return (
                  <tr
                    key={m.id}
                    onClick={() => setSelected(m === selected ? null : m)}
                    className={`cursor-pointer hover:bg-warm-50/30 ${selected?.id === m.id ? 'bg-sage-700/10' : ''}`}
                  >
                    <td className="font-medium text-warm-900">{m.name}</td>
                    <td className="text-warm-500">{m.category}</td>
                    <td className="text-warm-900 font-semibold">{m.stock} {m.unit}</td>
                    <td className="text-warm-700">{m.dailyUsage}/day</td>
                    <td className={daysLeft <= 3 ? 'text-terra-500 font-bold' : daysLeft <= 7 ? 'text-amber-600' : 'text-warm-900'}>{daysLeft}d</td>
                    <td className={expiryWarning ? 'text-amber-600 font-semibold' : m.expiryDays <= 14 ? 'text-amber-600' : 'text-warm-700'}>{m.expiryDays}d {expiryWarning && '⚠️'}</td>
                    <td className="text-warm-500">{m.leadTime}d</td>
                    <td><RiskBadge risk={m.risk as any} /></td>
                    <td>
                      {m.risk === 'Critical' ? (
                        <button className="text-[10px] btn-danger px-2 py-0.5">Emergency Order</button>
                      ) : m.risk === 'High' ? (
                        <button className="text-[10px] btn-secondary px-2 py-0.5">Reorder</button>
                      ) : (
                        <button className="text-[10px] text-sage-600 px-2 py-0.5 rounded bg-sage-1000/10 border border-sage-200">Monitor</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Panel */}
      {selected && (
        <div className="card border-sage-700/30">
          <h3 className="text-sm font-bold text-warm-900 mb-3">Medicine Detail — {selected.name}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            {[
              { label: "Current Stock", value: `${selected.stock} ${selected.unit}`, color: "text-warm-900" },
              { label: "Daily Usage", value: `${selected.dailyUsage}/day`, color: "text-warm-700" },
              { label: "Days of Supply", value: `${Math.round(selected.stock / selected.dailyUsage)} days`, color: Math.round(selected.stock / selected.dailyUsage) <= 3 ? "text-terra-500" : "text-warm-900" },
              { label: "Supplier Lead Time", value: `${selected.leadTime} days`, color: "text-warm-700" },
            ].map(m => (
              <div key={m.label} className="bg-warm-50 rounded-xl p-3">
                <div className="text-xs text-warm-500">{m.label}</div>
                <div className={`text-sm font-semibold ${m.color}`}>{m.value}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-warm-500 mb-1">AI Prediction:</div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-warm-500">Stockout Risk:</span><RiskBadge risk={selected.risk as any} /></div>
                <div className="flex justify-between"><span className="text-warm-500">Expiry Warning:</span><span className={Math.round(selected.stock / selected.dailyUsage) > selected.expiryDays ? 'text-amber-600' : 'text-sage-600'}>{Math.round(selected.stock / selected.dailyUsage) > selected.expiryDays ? 'Yes — expiry risk' : 'None'}</span></div>
                <div className="flex justify-between"><span className="text-warm-500">Reorder Point:</span><span className="text-warm-900">{selected.minStock} {selected.unit}</span></div>
              </div>
            </div>
            <div>
              <div className="text-xs text-warm-500 mb-1">Operational Recommendations:</div>
              <div className="space-y-1 text-xs">
                {selected.risk === 'Critical' ? (
                  ['Emergency procurement required', 'Contact supplier immediately', 'Review OT schedule', 'Consider alternate hospital stock'].map(a => <div key={a} className="text-terra-500">→ {a}</div>)
                ) : selected.risk === 'High' ? (
                  ['Initiate reorder process', 'Monitor daily usage', 'Alert clinical team'].map(a => <div key={a} className="text-amber-600">→ {a}</div>)
                ) : (
                  ['Regular monitoring', 'Routine procurement cycle'].map(a => <div key={a} className="text-sage-600">→ {a}</div>)
                )}
              </div>
            </div>
          </div>
          <p className="text-[10px] text-warm-400 mt-3 italic">All recommendations are operational/logistical only and require pharmacist approval. Never substitute medications unsafely.</p>
        </div>
      )}
    </div>
  );
}
