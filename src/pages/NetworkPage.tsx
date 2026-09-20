import { useState } from 'react';
import { Network } from 'lucide-react';
import { hospitalNetwork } from '../data/demoData';

export default function NetworkPage() {
  const [scenario, setScenario] = useState('ICU Transfer');
  const scenarios = ['ICU Transfer', 'Specialist Consult', 'Emergency Overflow', 'Trauma Referral'];

  const sortedHospitals = [...hospitalNetwork].sort((a, b) => {
    const scoreA = (a.icuBeds * 3) + ((100 - a.edLoad) / 10) - a.travelTime / 5;
    const scoreB = (b.icuBeds * 3) + ((100 - b.edLoad) / 10) - b.travelTime / 5;
    return scoreB - scoreA;
  });

  return (
    <div className="p-6 space-y-6" style={{ background: '#F8F6F1', minHeight: '100%' }}>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Network size={20} className="text-[#78856F]" />
            Hospital Network Intelligence
          </h1>
          <p className="page-subtitle">Simulated multi-hospital coordination and transfer recommendations</p>
        </div>
        <span className="badge badge-amber">Simulated — Demo Only</span>
      </div>

      <div className="rounded-lg p-3 border" style={{ background: '#F5EDD8', borderColor: '#D9B97A' }}>
        <p className="text-sm text-[#9A7535]">
          <strong>Simulated functionality.</strong> All hospital network data is synthetic and for demonstration purposes only. This represents how an inter-hospital AI coordination system could work.
        </p>
      </div>

      {/* Scenario Selector */}
      <div className="card">
        <h3 className="section-title">Select Transfer / Resource Scenario</h3>
        <div className="flex flex-wrap gap-2">
          {scenarios.map(s => (
            <button
              key={s}
              onClick={() => setScenario(s)}
              className={`text-sm px-4 py-2 rounded-md border transition-all font-medium ${
                scenario === s
                  ? 'bg-[#34483A] text-white border-[#34483A]'
                  : 'bg-white text-[#5C5A54] border-[#C8C3BB] hover:border-[#78856F] hover:text-[#292824]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* AI Ranking */}
      <div className="card">
        <div className="mb-1">
          <h3 className="section-title" style={{ marginBottom: 4 }}>AI-Ranked Hospital Recommendations</h3>
          <p className="text-sm text-[#8C8A83] mb-4">
            Not ranked by distance alone. Considers ICU availability, ventilators, specialists, ED load, and travel time.
          </p>
        </div>

        <div className="space-y-4">
          {sortedHospitals.map((h, idx) => (
            <div
              key={h.id}
              className="rounded-lg p-4 border"
              style={{
                borderColor: idx === 0 ? '#A8B39F' : '#E2DDD5',
                background: idx === 0 ? '#F4F6F2' : '#fff',
              }}
            >
              <div className="flex items-start justify-between gap-2 flex-wrap mb-3">
                <div className="flex items-center gap-2">
                  {idx === 0 && (
                    <span className="text-xs font-bold text-[#34483A] bg-[#E8EDE6] border border-[#C5CEBC] px-2 py-0.5 rounded-full">
                      Best Match
                    </span>
                  )}
                  {idx === 1 && (
                    <span className="text-xs font-semibold text-[#5C5A54] bg-[#F2EFE8] border border-[#C8C3BB] px-2 py-0.5 rounded-full">
                      2nd Option
                    </span>
                  )}
                  <span className="text-sm font-bold text-[#292824]">{h.name}</span>
                </div>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full border"
                  style={{
                    color: h.edLoad > 75 ? '#8F5540' : h.edLoad > 60 ? '#9A7535' : '#34483A',
                    background: h.edLoad > 75 ? '#FDF0EB' : h.edLoad > 60 ? '#F5EDD8' : '#E8EDE6',
                    borderColor: h.edLoad > 75 ? '#D4957E' : h.edLoad > 60 ? '#D9B97A' : '#C5CEBC',
                  }}
                >
                  ED Load: {h.edLoad}%
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                {[
                  { label: "ICU Beds", value: h.icuBeds },
                  { label: "Ventilators", value: h.ventilators },
                  { label: "Travel Time", value: `${h.travelTime} min`, color: '#C39A52' },
                  { label: "Distance", value: `${h.distance} km` },
                ].map(stat => (
                  <div key={stat.label} className="bg-[#F2EFE8] rounded-lg p-2 text-center">
                    <div
                      className="text-sm font-bold"
                      style={{ color: stat.color ?? '#292824' }}
                    >
                      {stat.value}
                    </div>
                    <div className="text-xs text-[#8C8A83]">{stat.label}</div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-1 mb-2">
                <span className="text-xs text-[#8C8A83] mr-1 self-center">Specialists:</span>
                {h.specialists.map(s => (
                  <span key={s} className="badge badge-green">{s}</span>
                ))}
              </div>

              <div className="flex flex-wrap gap-1 mb-3">
                <span className="text-xs text-[#8C8A83] mr-1 self-center">Ventilators:</span>
                <span className="badge badge-terra">{h.ventilators} units</span>
              </div>

              {idx === 0 && (
                <div className="flex gap-2 pt-1">
                  <button className="btn btn-primary btn-sm">Initiate Transfer Request</button>
                  <button className="btn btn-secondary btn-sm">View Details</button>
                </div>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-[#8C8A83] mt-4 italic">
          AI recommendation is decision-support only. Transfer decision must be made by authorized clinical staff with patient consent.
        </p>
      </div>

      {/* Conflict Resolution */}
      <div className="card">
        <h3 className="section-title">Resource Conflict Resolution — Decision Support</h3>
        <div className="rounded-lg p-4 border" style={{ background: '#F5EDD8', borderColor: '#D9B97A' }}>
          <div className="text-sm font-semibold text-[#292824] mb-3">
            Scenario: 2 Urgent Patients — 1 ICU Bed
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {[
              { patient: "Patient A", priority: "Critical", condition: "Cardiac arrest — immediate ICU required", time: "Time-critical — minutes", equipment: "Defibrillator required" },
              { patient: "Patient B", priority: "High", condition: "Post-surgery monitoring", time: "Moderate urgency", equipment: "Monitor required" },
            ].map(p => (
              <div key={p.patient} className="bg-white rounded-lg p-3 border border-[#E2DDD5]">
                <div className="text-sm font-bold text-[#292824] mb-2">{p.patient}</div>
                <div className="space-y-1 text-sm text-[#5C5A54]">
                  <div>Priority: <span className="font-medium text-[#292824]">{p.priority}</span></div>
                  <div>{p.condition}</div>
                  <div className="text-xs text-[#8C8A83]">{p.time}</div>
                  <div className="text-xs text-[#8C8A83]">{p.equipment}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-lg p-3 border mb-3" style={{ background: '#fff', borderColor: '#C8C3BB' }}>
            <div className="text-xs font-semibold text-[#5C5A54] mb-1">AI Analysis (Decision Support Only):</div>
            <div className="text-sm text-[#5C5A54]">
              Patient A — Cardiac arrest: ICU immediately recommended based on time-critical nature. Patient B — HDU/Step-down alternative may be considered pending clinical assessment.
            </div>
          </div>
          <div className="text-xs text-[#B86F52] font-semibold">
            ⚠ IMPORTANT: The AI does NOT decide which patient deserves treatment. Final resource allocation decision MUST remain with authorized clinical professionals.
          </div>
        </div>
      </div>
    </div>
  );
}
