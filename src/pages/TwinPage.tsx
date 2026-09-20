import { useState } from 'react';
import { Box, AlertTriangle } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { beds, doctors, medicines, ambulances, operationTheatres } from '../data/demoData';
import clsx from 'clsx';

type ViewMode = 'current' | 'predicted';

export default function TwinPage() {
  const [view, setView] = useState<ViewMode>('current');
  const [hoveredBed, setHoveredBed] = useState<string | null>(null);

  const icuBeds = beds.filter(b => b.type === 'ICU');
  const generalBeds = beds.filter(b => b.type === 'General');

  const criticalMeds = medicines.filter(m => ['Critical', 'High'].includes(m.risk));
  const activeDoctors = doctors.filter(d => d.status !== 'Off Duty');

  const predicted = view === 'predicted';

  const bedColors = {
    Occupied: { bg: '#FDF0EB', border: '#D4957E', text: '#8F5540' },
    Available: { bg: '#EFF3ED', border: '#A8B39F', text: '#34483A' },
    Reserved: { bg: '#F5F0E8', border: '#D9B97A', text: '#9A7535' },
    Maintenance: { bg: '#F2EFE8', border: '#C8C3BB', text: '#5C5A54' },
  };

  const otColors: Record<string, { bg: string; border: string; text: string }> = {
    'In Use': { bg: '#FDF0EB', border: '#D4957E', text: '#8F5540' },
    Available: { bg: '#EFF3ED', border: '#A8B39F', text: '#34483A' },
    Scheduled: { bg: '#EEF4F6', border: '#9FC4CE', text: '#2E6B7A' },
    Cleaning: { bg: '#F2EFE8', border: '#C8C3BB', text: '#5C5A54' },
  };

  return (
    <div className="p-6 space-y-6" style={{ background: '#F8F6F1', minHeight: '100%' }}>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Box size={20} className="text-[#78856F]" />
            Hospital Digital Twin
          </h1>
          <p className="page-subtitle">Simulated real-time operational mirror of hospital state</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="badge badge-amber">Simulated</span>
          <div className="flex border border-[#C8C3BB] rounded-lg overflow-hidden text-sm">
            <button
              onClick={() => setView('current')}
              className={`px-4 py-1.5 font-medium transition-colors ${
                view === 'current'
                  ? 'bg-[#34483A] text-white'
                  : 'bg-white text-[#5C5A54] hover:bg-[#F2EFE8]'
              }`}
            >
              Current State
            </button>
            <button
              onClick={() => setView('predicted')}
              className={`px-4 py-1.5 font-medium transition-colors ${
                view === 'predicted'
                  ? 'bg-[#B86F52] text-white'
                  : 'bg-white text-[#5C5A54] hover:bg-[#F2EFE8]'
              }`}
            >
              Predicted (+3h)
            </button>
          </div>
        </div>
      </div>

      {view === 'predicted' && (
        <div className="rounded-lg p-3 flex items-start gap-3 border" style={{ background: '#FBF4EF', borderColor: '#D4957E' }}>
          <AlertTriangle size={16} className="text-[#B86F52] mt-0.5 shrink-0" />
          <div className="text-sm text-[#8F5540]">
            <strong>Predicted State (+3 hours):</strong> Showing AI-forecasted hospital state based on current admissions, trends, and pending mass casualty event.
          </div>
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          {
            label: "ICU Beds",
            value: predicted ? "9/10" : `${icuBeds.filter(b => b.status === 'Occupied').length}/${icuBeds.length}`,
            color: predicted ? '#B86F52' : '#292824',
            sub: predicted ? 'Predicted full' : 'Occupied',
          },
          {
            label: "General Beds",
            value: predicted ? "24/25" : `${generalBeds.filter(b => b.status === 'Occupied').length}/${generalBeds.length}`,
            color: predicted ? '#B86F52' : '#292824',
            sub: 'Occupied',
          },
          {
            label: "Active Doctors",
            value: `${activeDoctors.length}/10`,
            color: '#34483A',
            sub: 'On duty',
          },
          {
            label: "Medicine Risk",
            value: predicted ? '5 Critical' : `${criticalMeds.length} High/Crit`,
            color: '#C39A52',
            sub: 'Items flagged',
          },
          {
            label: "Ambulances",
            value: `${ambulances.filter(a => a.status === 'Available').length}/${ambulances.length}`,
            color: '#34483A',
            sub: 'Available',
          },
        ].map(m => (
          <div
            key={m.label}
            className="card text-center"
            style={predicted ? { borderColor: '#D9B97A' } : {}}
          >
            <div className="text-xl font-bold" style={{ color: m.color }}>{m.value}</div>
            <div className="text-[13px] font-medium text-[#5C5A54] mt-0.5">{m.label}</div>
            <div className="text-xs text-[#8C8A83]">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* ICU Floor Map */}
      <div className="card">
        <h3 className="section-title">ICU Floor Map — Floor 3</h3>
        <div className="grid grid-cols-5 gap-2 mb-3">
          {icuBeds.map(bed => {
            const isPredictedOccupied = predicted && bed.status === 'Available' && bed.id !== 'ICU-10';
            const effectiveStatus = isPredictedOccupied ? 'Occupied' : bed.status as keyof typeof bedColors;
            const colors = bedColors[effectiveStatus] ?? bedColors.Maintenance;
            return (
              <div
                key={bed.id}
                onMouseEnter={() => setHoveredBed(bed.id)}
                onMouseLeave={() => setHoveredBed(null)}
                className={clsx(
                  'rounded-lg p-2 text-center cursor-pointer border transition-all',
                  hoveredBed === bed.id && 'shadow-sm scale-105'
                )}
                style={{ background: colors.bg, borderColor: colors.border }}
              >
                <div className="text-xs font-semibold" style={{ color: colors.text }}>{bed.id}</div>
                <div className="text-[11px] mt-0.5" style={{ color: colors.text }}>{effectiveStatus}</div>
                {isPredictedOccupied && (
                  <div className="text-[10px] text-[#C39A52] mt-0.5">Predicted</div>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-4 text-xs text-[#5C5A54]">
          <span className="flex items-center gap-1.5">
            <span className="status-dot status-critical" />Occupied
          </span>
          <span className="flex items-center gap-1.5">
            <span className="status-dot status-available" />Available
          </span>
          <span className="flex items-center gap-1.5">
            <span className="status-dot status-limited" />Reserved
          </span>
          <span className="flex items-center gap-1.5">
            <span className="status-dot bg-[#C8C3BB]" />Maintenance
          </span>
          {predicted && (
            <span className="text-[#C39A52] font-medium">⚠ Orange label = AI predicted change</span>
          )}
        </div>
      </div>

      {/* Operation Theatres */}
      <div className="card">
        <h3 className="section-title">Operation Theatres</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {operationTheatres.map(ot => {
            const colors = otColors[ot.status] ?? otColors['Cleaning'];
            return (
              <div
                key={ot.id}
                className="rounded-lg p-3 border text-center"
                style={{ background: colors.bg, borderColor: colors.border }}
              >
                <div className="text-sm font-bold text-[#292824]">{ot.id}</div>
                <div className="text-xs font-semibold mt-1" style={{ color: colors.text }}>{ot.status}</div>
                {ot.procedure && (
                  <div className="text-[11px] text-[#5C5A54] mt-1 truncate">{ot.procedure}</div>
                )}
                {ot.startTime && (
                  <div className="text-[11px] text-[#8C8A83] mt-0.5">{ot.startTime} → {ot.estEnd}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Resource Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* Doctor Availability */}
        <div className="card">
          <h3 className="section-title">Doctor Availability</h3>
          <div className="space-y-2">
            {doctors.slice(0, 7).map(d => (
              <div key={d.id} className="flex items-center gap-2">
                <span
                  className="status-dot shrink-0"
                  style={{
                    background:
                      d.status === 'On Duty' ? '#78856F' :
                      d.status === 'In Surgery' || d.status === 'In OT' ? '#B86F52' :
                      d.status === 'On Call' ? '#C39A52' :
                      '#C8C3BB',
                  }}
                />
                <span className="text-sm text-[#292824] flex-1 truncate">{d.name}</span>
                <span
                  className="text-xs font-medium"
                  style={{
                    color: d.workload > 85 ? '#B86F52' : d.workload > 70 ? '#C39A52' : '#78856F',
                  }}
                >
                  {d.workload}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Operation Theatres */}
        <div className="card">
          <h3 className="section-title">Operation Theatres</h3>
          <div className="space-y-2">
            {operationTheatres.map(ot => (
              <div key={ot.id} className="flex items-center gap-2">
                <span className="text-base shrink-0">🏥</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[#292824] truncate">
                    {ot.id} — {ot.procedure || 'No procedure scheduled'}
                  </div>
                  <div className="text-xs text-[#8C8A83] truncate">
                    {ot.surgeon ? `${ot.surgeon} · ${ot.startTime || '—'}–${ot.estEnd || '—'}` : 'Available'}
                  </div>
                </div>
                <StatusBadge status={ot.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Ambulance Fleet */}
        <div className="card">
          <h3 className="section-title">Ambulance Fleet</h3>
          <div className="space-y-2">
            {ambulances.map(a => (
              <div key={a.id} className="flex items-center gap-2">
                <span className="text-base shrink-0">🚑</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[#292824] truncate">
                    {a.id} — {a.type}
                  </div>
                  <div className="text-xs text-[#8C8A83] truncate">{a.location}</div>
                </div>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </div>
        </div>

      </div>

      <p className="text-xs text-[#8C8A83] text-center">
        Digital Twin — Simulated operational mirror. All data is synthetic demo data for demonstration purposes only.
      </p>
    </div>
  );
}
