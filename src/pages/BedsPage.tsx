import { useState } from 'react';
import { BedDouble } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { useHospital } from '../contexts/HospitalContext';
import clsx from 'clsx';

const bedTypeColors: Record<string, string> = {
  ICU:       'border-terra-200 bg-terra-100',
  General:   'border-teal-200 bg-teal-100',
  Private:   'border-warm-300 bg-warm-50',
  Isolation: 'border-amber-200 bg-amber-100',
};

const statusColors: Record<string, string> = {
  Available:   'bg-sage-100 text-sage-700',
  Occupied:    'bg-terra-100 text-terra-600',
  Reserved:    'bg-warm-200 text-warm-600',
  Maintenance: 'bg-warm-200 text-warm-500',
};

export default function BedsPage() {
  const { state } = useHospital();
  const beds = state.beds;
  const patients = state.patients;
  const [typeFilter, setTypeFilter] = useState('All');
  const [selected, setSelected] = useState<typeof beds[0] | null>(null);

  const types = ['All', 'ICU', 'General', 'Private', 'Isolation'];
  const filtered = beds.filter((b) => typeFilter === 'All' || b.type === typeFilter);

  const stats = {
    total: beds.length,
    occupied: beds.filter((b) => b.status === 'Occupied').length,
    available: beds.filter((b) => b.status === 'Available').length,
    reserved: beds.filter((b) => b.status === 'Reserved').length,
    maintenance: beds.filter((b) => b.status === 'Maintenance').length,
  };

  const icuOccupancy = Math.round((beds.filter((b) => b.type === 'ICU' && b.status === 'Occupied').length / beds.filter((b) => b.type === 'ICU').length) * 100);

  const getPatient = (pid: string | null) => pid ? patients.find((p: any) => p.id === pid) : null;

  return (
    <div className="p-4 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-warm-900 flex items-center gap-2">
            <BedDouble size={20} className="text-sage-700" />
            Bed & Resource Management
          </h1>
          <p className="text-xs text-warm-500 mt-0.5">AI-assisted bed allocation and resource tracking</p>
        </div>
        <span className="demo-tag">Demo / Simulation</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total Beds", value: stats.total, color: "text-warm-900" },
          { label: "Occupied", value: stats.occupied, color: "text-terra-500" },
          { label: "Available", value: stats.available, color: "text-sage-600" },
          { label: "Reserved", value: stats.reserved, color: "text-warm-600" },
          { label: "Maintenance", value: stats.maintenance, color: "text-warm-500" },
        ].map((m) => (
          <div key={m.label} className="card text-center">
            <div className={`text-2xl font-bold ${m.color}`}>{m.value}</div>
            <div className="text-xs text-warm-500">{m.label}</div>
          </div>
        ))}
      </div>

      {/* ICU Alert */}
      {icuOccupancy >= 80 && (
        <div className="border border-amber-200 bg-amber-100 rounded-xl p-3 flex items-center gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <div className="text-sm font-semibold text-amber-600">ICU Occupancy Alert</div>
            <div className="text-xs text-warm-500">
              ICU at {icuOccupancy}% capacity. AI predicts overload risk in 3 hours based on current admissions.
              <span className="text-amber-600 font-semibold"> Human review recommended.</span>
            </div>
          </div>
          <div className="ml-auto">
            <span className="badge-high">HIGH RISK</span>
          </div>
        </div>
      )}

      {/* AI Bed Allocation Recommendation */}
      <div className="card border-l-4 border-l-sage-400">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🧠</span>
          <h3 className="text-sm font-semibold text-warm-900">AI Bed Allocation Recommendation</h3>
          <span className="badge-info">91% Confidence</span>
          <span className="ml-auto badge-high">Human Approval Required</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-warm-500 mb-2">Recommended for next Critical patient:</div>
            <div className="bg-warm-50 rounded-xl p-3">
              <div className="text-sm font-bold text-sage-700">ICU-04</div>
              <div className="text-xs text-warm-700 mt-1">Floor 3 · Ventilator + Monitor available · Nearest to Emergency Dept.</div>
            </div>
          </div>
          <div>
            <div className="text-xs text-warm-500 mb-2">Why this recommendation:</div>
            <div className="space-y-1 text-xs">
              {[
                { factor: "Patient urgency", value: "Critical", ok: true },
                { factor: "Ventilator required", value: "Available", ok: true },
                { factor: "Isolation needed", value: "Not required", ok: true },
                { factor: "Distance from ED", value: "Same floor — Low", ok: true },
                { factor: "Future demand", value: "2 beds occupied by other admissions", ok: false },
              ].map((f) => (
                <div key={f.factor} className="flex items-center justify-between">
                  <span className="text-warm-500">{f.factor}</span>
                  <span className={f.ok ? "text-sage-600" : "text-amber-600"}>{f.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <button className="btn-success text-xs px-3 py-1.5">✓ Approve Allocation</button>
          <button className="btn-danger text-xs px-3 py-1.5">✕ Reject</button>
          <button className="btn-secondary text-xs px-3 py-1.5">Modify</button>
        </div>
        <p className="text-[10px] text-warm-400 mt-2">AI recommendation is decision-support only. Final allocation decision rests with authorized clinical staff.</p>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {types.map((t) => (
          <button key={t} onClick={() => setTypeFilter(t)} className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${typeFilter === t ? 'border-sage-600 bg-sage-100 text-warm-900' : 'border-warm-300 text-warm-500 hover:text-warm-900'}`}>{t}</button>
        ))}
      </div>

      {/* Bed Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
        {filtered.map((bed) => {
          const pt = getPatient(bed.patient);
          return (
            <div
              key={bed.id}
              onClick={() => setSelected(bed)}
              className={clsx(
                "border rounded-xl p-3 cursor-pointer transition-all hover:opacity-90",
                bedTypeColors[bed.type] || 'border-warm-300',
                selected?.id === bed.id && "ring-2 ring-sage-500"
              )}
            >
              <div className="flex items-start justify-between mb-1">
                <span className="text-xs font-bold text-warm-900">{bed.id}</span>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${statusColors[bed.status] || 'text-warm-500'}`}>{bed.status}</span>
              </div>
              <div className="text-[10px] text-warm-500 mb-1">{bed.type} · Floor {bed.floor}</div>
              {pt && <div className="text-[10px] text-warm-700 truncate">{pt.name}</div>}
              <div className="text-[10px] text-warm-400 truncate">{bed.department}</div>
            </div>
          );
        })}
      </div>

      {/* Bed Detail */}
      {selected && (
        <div className="card border-l-4 border-l-sage-400">
          <h3 className="text-sm font-semibold text-warm-900 mb-3">Bed Details — {selected.id}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div><div className="text-xs text-warm-500">Type</div><div className="text-sm text-warm-900">{selected.type}</div></div>
            <div><div className="text-xs text-warm-500">Status</div><StatusBadge status={selected.status} /></div>
            <div><div className="text-xs text-warm-500">Department</div><div className="text-sm text-warm-900">{selected.department}</div></div>
            <div><div className="text-xs text-warm-500">Floor</div><div className="text-sm text-warm-900">{selected.floor}</div></div>
          </div>
          <div className="mb-3">
            <div className="text-xs text-warm-500 mb-1">Equipment</div>
            <div className="flex flex-wrap gap-1">
              {selected.equipment.map((e) => (
                <span key={e} className="badge-info">{e}</span>
              ))}
            </div>
          </div>
          {selected.patient && getPatient(selected.patient) && (
            <div className="bg-warm-50 rounded-xl p-3">
              <div className="text-xs text-warm-500 mb-1">Current Patient</div>
              <div className="text-sm font-semibold text-warm-900">{getPatient(selected.patient)?.name}</div>
              <div className="text-xs text-warm-500">{getPatient(selected.patient)?.diagnosis}</div>
            </div>
          )}
        </div>
      )}

      <p className="text-[10px] text-warm-400 text-center italic">Bed management data is synthetic. AI allocation is decision-support only.</p>
    </div>
  );
}
