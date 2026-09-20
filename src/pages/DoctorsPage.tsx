import { useState } from 'react';
import { UserCheck, AlertCircle } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { doctors, patients } from '../data/demoData';


export default function DoctorsPage() {
  const [selected, setSelected] = useState<typeof doctors[0] | null>(null);

  return (
    <div className="p-4 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-warm-900 flex items-center gap-2">
            <UserCheck size={20} className="text-sage-600" />
            Doctor Scheduling
          </h1>
          <p className="text-xs text-warm-500 mt-0.5">AI-assisted doctor workload management and scheduling</p>
        </div>
        <span className="demo-tag">Demo / Simulation</span>
      </div>

      {/* Overload Alert */}
      {doctors.filter(d => d.workload > 90).map(d => (
        <div key={d.id} className="border border-terra-300/30 bg-terra-100 rounded-xl p-3 flex items-center gap-3">
          <AlertCircle size={18} className="text-terra-500" />
          <div>
            <span className="text-sm font-semibold text-warm-900">{d.name}</span>
            <span className="text-xs text-terra-500 ml-2">Workload {d.workload}% — Overload Risk</span>
            <div className="text-xs text-warm-500">AI recommends: Call backup {d.specialization} specialist</div>
          </div>
        </div>
      ))}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "On Duty", value: doctors.filter(d => d.status === 'On Duty').length, color: "text-sage-600" },
          { label: "In Surgery/OT", value: doctors.filter(d => ['In Surgery', 'In OT'].includes(d.status)).length, color: "text-warm-600" },
          { label: "On Call", value: doctors.filter(d => d.status === 'On Call').length, color: "text-amber-600" },
          { label: "Overloaded (>85%)", value: doctors.filter(d => d.workload > 85).length, color: "text-terra-500" },
        ].map(m => (
          <div key={m.label} className="card text-center">
            <div className={`text-2xl font-bold ${m.color}`}>{m.value}</div>
            <div className="text-xs text-warm-500">{m.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Doctor List */}
        <div className="lg:col-span-2 card">
          <h3 className="text-sm font-semibold text-warm-900 mb-3">All Doctors</h3>
          <div className="space-y-2">
            {doctors.map(d => (
              <div
                key={d.id}
                onClick={() => setSelected(d)}
                className={`border rounded-xl p-3 cursor-pointer transition-all ${selected?.id === d.id ? 'border-sage-600 bg-sage-700/10' : 'border-warm-300 hover:border-warm-200 hover:bg-warm-50/30'}`}
              >
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-sage-700/20 border border-sage-700/30 rounded-full flex items-center justify-center text-xs font-bold text-sage-700">
                        {d.name.split(' ')[1]?.[0]}{d.name.split(' ')[2]?.[0]}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-warm-900">{d.name}</div>
                        <div className="text-xs text-warm-500">{d.specialization}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={d.status} />
                    <div className="text-right">
                      <div className={`text-sm font-bold ${d.workload > 85 ? 'text-terra-500' : d.workload > 70 ? 'text-amber-600' : 'text-sage-600'}`}>{d.workload}%</div>
                      <div className="text-[10px] text-warm-400">{d.patients} patients</div>
                    </div>
                  </div>
                </div>
                <div className="mt-2 risk-bar">
                  <div className={`h-full rounded-full ${d.workload > 85 ? 'bg-terra-400' : d.workload > 70 ? 'bg-amber-500' : 'bg-sage-1000'}`} style={{ width: `${d.workload}%` }} />
                </div>
                <div className="flex gap-3 mt-1 text-[10px] text-warm-400">
                  <span>Shift: {d.shift}</span>
                  <span>Experience: {d.experience}y</span>
                  {d.onCall && <span className="text-amber-600">On-Call Available</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Doctor Detail + Workload Chart */}
        <div className="space-y-4">
          {selected ? (
            <div className="card">
              <h3 className="text-sm font-bold text-warm-900 mb-3">{selected.name}</h3>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-warm-50 rounded-lg p-2"><div className="text-[10px] text-warm-500">Specialization</div><div className="text-xs text-warm-900">{selected.specialization}</div></div>
                <div className="bg-warm-50 rounded-lg p-2"><div className="text-[10px] text-warm-500">Status</div><StatusBadge status={selected.status} /></div>
                <div className="bg-warm-50 rounded-lg p-2"><div className="text-[10px] text-warm-500">Workload</div><div className={`text-sm font-bold ${selected.workload > 85 ? 'text-terra-500' : 'text-warm-900'}`}>{selected.workload}%</div></div>
                <div className="bg-warm-50 rounded-lg p-2"><div className="text-[10px] text-warm-500">Patients</div><div className="text-sm font-bold text-warm-900">{selected.patients}</div></div>
                <div className="bg-warm-50 rounded-lg p-2"><div className="text-[10px] text-warm-500">Experience</div><div className="text-sm text-warm-900">{selected.experience} years</div></div>
                <div className="bg-warm-50 rounded-lg p-2"><div className="text-[10px] text-warm-500">Shift</div><div className="text-sm text-warm-900">{selected.shift}</div></div>
              </div>

              <div className="text-xs text-warm-500 mb-1 font-semibold">Current Patients:</div>
              {patients.filter(p => p.doctor === selected.name).map(p => (
                <div key={p.id} className="text-xs text-warm-700 py-1 border-b border-warm-300/30 flex justify-between">
                  <span>{p.name} ({p.id})</span>
                  <span className={p.priority === 'Critical' ? 'text-terra-500' : 'text-warm-500'}>{p.priority}</span>
                </div>
              ))}

              {selected.workload > 85 && (
                <div className="mt-3 bg-terra-100 border border-terra-200 rounded-xl p-3">
                  <div className="text-xs font-semibold text-terra-500 mb-1">⚠️ AI Workload Alert</div>
                  <div className="text-xs text-warm-700">Workload at {selected.workload}%. AI recommends calling backup specialist to prevent care quality degradation.</div>
                  <div className="text-[10px] text-warm-400 mt-1">Human approval required for reassignment</div>
                </div>
              )}
            </div>
          ) : (
            <div className="card flex items-center justify-center text-warm-400 text-sm py-8">
              <div className="text-center"><UserCheck size={28} className="mx-auto mb-2 opacity-30" />Select a doctor</div>
            </div>
          )}

          {/* Workload Chart */}
          <div className="card">
            <h3 className="text-xs font-semibold text-warm-900 mb-2">Workload Distribution</h3>
            <div className="space-y-1.5">
              {doctors.map(d => (
                <div key={d.id} className="flex items-center gap-2">
                  <span className="text-[10px] text-warm-500 w-24 truncate">{d.name.replace('Dr. ', '')}</span>
                  <div className="flex-1 risk-bar">
                    <div className={`h-full rounded-full ${d.workload > 85 ? 'bg-terra-400' : d.workload > 70 ? 'bg-amber-500' : 'bg-sage-1000'}`} style={{ width: `${d.workload}%` }} />
                  </div>
                  <span className={`text-[10px] w-8 font-semibold ${d.workload > 85 ? 'text-terra-500' : d.workload > 70 ? 'text-amber-600' : 'text-sage-600'}`}>{d.workload}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
