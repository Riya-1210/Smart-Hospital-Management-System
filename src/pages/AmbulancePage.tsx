import { Truck, MapPin, Clock } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { ambulances } from '../data/demoData';

export default function AmbulancePage() {
  return (
    <div className="p-6 space-y-6" style={{ background: '#F8F6F1', minHeight: '100%' }}>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Truck size={20} className="text-[#78856F]" />
            Ambulance & Transfer
          </h1>
          <p className="page-subtitle">Fleet management and inter-hospital transfer coordination</p>
        </div>
        <span className="demo-tag">Demo / Simulation</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Fleet", value: ambulances.length, color: '#292824' },
          { label: "Available", value: ambulances.filter(a => a.status === 'Available').length, color: '#34483A' },
          { label: "Dispatched", value: ambulances.filter(a => a.status === 'Dispatched').length, color: '#C39A52' },
          { label: "Maintenance", value: ambulances.filter(a => a.status === 'Maintenance').length, color: '#8C8A83' },
        ].map(m => (
          <div key={m.label} className="card text-center">
            <div className="text-2xl font-bold" style={{ color: m.color }}>{m.value}</div>
            <div className="text-sm text-[#5C5A54]">{m.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ambulances.map(amb => (
          <div
            key={amb.id}
            className="card"
            style={{
              borderLeftWidth: '3px',
              borderLeftColor:
                amb.status === 'Available' ? '#78856F' :
                amb.status === 'Dispatched' ? '#C39A52' :
                '#C8C3BB'
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-sm font-bold text-[#292824]">{amb.id}</div>
                <div className="text-xs text-[#8C8A83]">{amb.type} Ambulance</div>
              </div>
              <StatusBadge status={amb.status} />
            </div>

            <div className="space-y-1.5 text-sm text-[#5C5A54] mb-3">
              <div className="flex items-center gap-1.5">
                <MapPin size={12} className="text-[#8C8A83] shrink-0" />
                {amb.location}
              </div>
              {amb.eta && (
                <div className="flex items-center gap-1.5">
                  <Clock size={12} className="text-[#C39A52] shrink-0" />
                  <span className="text-[#C39A52] font-medium">ETA: {amb.eta}</span>
                </div>
              )}
            </div>

            <div className="mb-3">
              <div className="text-xs text-[#8C8A83] mb-1">Crew</div>
              {amb.crew.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {amb.crew.map(c => (
                    <span key={c} className="badge-info">{c}</span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-[#8C8A83]">No crew assigned</span>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-[#8C8A83] mb-2">
              <span>Fuel: <span className="font-medium text-[#5C5A54]">{amb.fuel}%</span></span>
              <span>Service: {amb.lastService}</span>
            </div>

            <div className="h-1.5 rounded-full bg-warm-200 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${amb.fuel}%`,
                  background: amb.fuel < 30 ? '#B86F52' : amb.fuel < 60 ? '#C39A52' : '#78856F'
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Transfer Protocol */}
      <div className="card">
        <h3 className="section-title">Transfer Decision Support</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-sm text-[#8C8A83] mb-3">Current Transfer Criteria (AI-Evaluated)</div>
            <div className="space-y-2">
              {[
                { label: "Patient stability", value: "Assessed before transfer" },
                { label: "Receiving hospital confirmation", value: "Required" },
                { label: "Transport type", value: "ALS for critical patients" },
                { label: "Paramedic escort", value: "Required for critical" },
                { label: "Documentation", value: "Clinical summary + medications" },
              ].map(c => (
                <div key={c.label} className="flex justify-between text-sm py-1.5 border-b border-warm-200 last:border-0">
                  <span className="text-[#8C8A83]">{c.label}</span>
                  <span className="text-[#292824] font-medium">{c.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-sm text-[#8C8A83] mb-3">Active Dispatch Tracking</div>
            {ambulances.filter(a => a.status === 'Dispatched').length === 0 ? (
              <div className="text-sm text-[#8C8A83] text-center py-4">No active dispatches</div>
            ) : (
              ambulances.filter(a => a.status === 'Dispatched').map(a => (
                <div key={a.id} className="rounded-lg p-3 border mb-2" style={{ background: '#F5F0E8', borderColor: '#D9B97A' }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-[#292824]">{a.id}</span>
                    <span className="text-[#C39A52] text-xs font-semibold">ETA {a.eta}</span>
                  </div>
                  <div className="text-sm text-[#5C5A54]">{a.location}</div>
                  <div className="text-xs text-[#8C8A83] mt-1">Crew: {a.crew.join(', ')}</div>
                </div>
              ))
            )}
          </div>
        </div>
        <p className="text-xs text-[#8C8A83] mt-4 italic">
          AI transfer recommendations are operational support only. Clinical team must confirm patient stability for transfer.
        </p>
      </div>
    </div>
  );
}
