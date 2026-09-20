import { useState } from 'react';
import { FileText, CheckCircle, Clock } from 'lucide-react';
import RiskBadge from '../components/RiskBadge';
import { useHospital } from '../contexts/HospitalContext';
import { auditTrail as auditTrailStatic } from '../data/demoData';

const OUTCOMES = [
  {
    id: "O-001",
    prediction: "ICU transfer in 18 min",
    actual: "Completed in 12 min",
    accurate: true,
    error: -33,
    agent: "Bed Agent",
  },
  {
    id: "O-002",
    prediction: "Propofol shortage in 3 days",
    actual: "Shortage confirmed at 72h mark",
    accurate: true,
    error: 0,
    agent: "Medicine Agent",
  },
  {
    id: "O-003",
    prediction: "Doctor workload 92%",
    actual: "Measured at 89%",
    accurate: true,
    error: -3,
    agent: "Doctor Agent",
  },
  {
    id: "O-004",
    prediction: "Medicine Propofol 3-day supply",
    actual: "2.8 days estimated",
    accurate: true,
    error: -7,
    agent: "Medicine Agent",
  },
  {
    id: "O-005",
    prediction: "ICU overload in 3h",
    actual: "Partial — avoided via protocol",
    accurate: false,
    error: null,
    agent: "Crisis Agent",
  },
];

const AGENT_PERFORMANCE = [
  { agent: "Triage Agent", accuracy: 96, actions: 14, success: 13, pending: 1 },
  { agent: "Bed Agent", accuracy: 91, actions: 11, success: 10, pending: 1 },
  { agent: "Doctor Agent", accuracy: 88, actions: 9, success: 8, pending: 1 },
  { agent: "Medicine Agent", accuracy: 91, actions: 8, success: 7, pending: 1 },
  { agent: "Crisis Agent", accuracy: 84, actions: 6, success: 5, pending: 1 },
  { agent: "Follow-up Agent", accuracy: 84, actions: 5, success: 4, pending: 1 },
  { agent: "Orchestrator", accuracy: 95, actions: 22, success: 21, pending: 1 },
];

const riskDot: Record<string, string> = {
  Critical: 'bg-[#B86F52]',
  High: 'bg-[#C39A52]',
  Moderate: 'bg-[#78856F]',
  Low: 'bg-[#8C8A83]',
};

const riskBorder: Record<string, string> = {
  Critical: 'border-[#D4957E]',
  High: 'border-[#D9B97A]',
  Moderate: 'border-[#E2DDD5]',
  Low: 'border-[#E2DDD5]',
};

export default function AuditPage() {
  const [filterAgent, setFilterAgent] = useState('All');
  const [filterRisk, setFilterRisk] = useState('All');

  const agents = [
    'All',
    'Triage Agent',
    'Bed Agent',
    'Doctor Agent',
    'Medicine Agent',
    'Crisis Agent',
    'Orchestrator',
    'Follow-up Agent',
  ];

  const { state } = useHospital();

  const combinedTrail = [
    ...state.auditTrail,
    ...auditTrailStatic,
  ].slice(0, 50);

  const filtered = combinedTrail.filter((a) => {
    const matchAgent =
      filterAgent === 'All' || a.agent === filterAgent;

    const matchRisk =
      filterRisk === 'All' || a.risk === filterRisk;

    return matchAgent && matchRisk;
  });

  return (
    <div
      className="p-6 space-y-6"
      style={{
        background: '#F8F6F1',
        minHeight: '100%',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <FileText size={20} className="text-[#78856F]" />
            Explainability & Audit Trail
          </h1>

          <p className="page-subtitle">
            Complete AI decision history and outcome verification
          </p>
        </div>

        <span className="badge badge-amber">
          Demo / Simulation
        </span>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Total AI Actions',
            value: '82',
            sub: 'Today',
          },
          {
            label: 'Prediction Accuracy',
            value: '94.2%',
            sub: 'Avg across agents',
          },
          {
            label: 'Human Approvals',
            value: '38 / 82',
            sub: '46% approval rate',
          },
          {
            label: 'Errors Prevented',
            value: '5',
            sub: 'Via human override',
          },
        ].map((m) => (
          <div key={m.label} className="card text-center">
            <div className="text-2xl font-bold text-[#292824]">
              {m.value}
            </div>

            <div className="text-[13px] font-medium text-[#5C5A54] mt-0.5">
              {m.label}
            </div>

            <div className="text-xs text-[#8C8A83] mt-0.5">
              {m.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Agent Performance */}
      <div className="card">
        <h3 className="section-title">
          Agent Performance — Today
        </h3>

        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Agent</th>
                <th>Accuracy</th>
                <th>Total Actions</th>
                <th>Successful</th>
                <th>Pending</th>
                <th>Bar</th>
              </tr>
            </thead>

            <tbody>
              {AGENT_PERFORMANCE.map((a) => (
                <tr key={a.agent}>
                  <td className="font-medium text-[#292824]">
                    {a.agent}
                  </td>

                  <td>
                    <span
                      className={`font-semibold ${
                        a.accuracy >= 90
                          ? 'text-[#34483A]'
                          : 'text-[#C39A52]'
                      }`}
                    >
                      {a.accuracy}%
                    </span>
                  </td>

                  <td className="text-[#5C5A54]">
                    {a.actions}
                  </td>

                  <td className="text-[#34483A]">
                    {a.success}
                  </td>

                  <td className="text-[#C39A52]">
                    {a.pending}
                  </td>

                  <td>
                    <div className="w-24 h-2 rounded-full bg-[#EDE8DE] overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${a.accuracy}%`,
                          background:
                            a.accuracy >= 90
                              ? '#78856F'
                              : '#C39A52',
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Outcome Verification */}
      <div className="card">
        <h3 className="section-title">
          Closed-Loop Outcome Verification
        </h3>

        <div className="space-y-3">
          {OUTCOMES.map((o) => (
            <div
              key={o.id}
              className="rounded-lg p-3 border"
              style={{
                background: o.accurate
                  ? '#F4F6F2'
                  : '#FBF4EF',
                borderColor: o.accurate
                  ? '#C5CEBC'
                  : '#D4957E',
              }}
            >
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="flex-1">
                  <div className="text-xs text-[#8C8A83] mb-1">
                    {o.agent} — {o.id}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0.5">
                    <div className="text-sm">
                      <span className="text-[#8C8A83]">
                        Predicted:{' '}
                      </span>

                      <span className="text-[#292824]">
                        {o.prediction}
                      </span>
                    </div>

                    <div className="text-sm">
                      <span className="text-[#8C8A83]">
                        Actual:{' '}
                      </span>

                      <span className="text-[#34483A] font-medium">
                        {o.actual}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  {o.accurate ? (
                    <span className="badge badge-green">
                      <CheckCircle size={11} />
                      Accurate
                    </span>
                  ) : (
                    <span className="badge badge-amber">
                      <Clock size={11} />
                      Partial
                    </span>
                  )}

                  {o.error !== null && (
                    <div
                      className={`text-xs mt-1 ${
                        o.error < 0
                          ? 'text-[#78856F]'
                          : 'text-[#C39A52]'
                      }`}
                    >
                      {o.error}% error margin
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-[#8C8A83] mt-3 italic">
          Outcome verification uses simulated data for demonstration
          purposes only.
        </p>
      </div>

      {/* Filters */}
      <div className="card space-y-4">
        <h3
          className="section-title"
          style={{ marginBottom: 0 }}
        >
          Filter Audit Trail
        </h3>

        <div>
          <div className="label">
            Filter by Agent
          </div>

          <div className="flex flex-wrap gap-1.5">
            {agents.map((a) => (
              <button
                key={a}
                onClick={() => setFilterAgent(a)}
                className={`text-xs px-3 py-1.5 rounded-md border transition-all font-medium ${
                  filterAgent === a
                    ? 'bg-[#34483A] text-white border-[#34483A]'
                    : 'bg-white text-[#5C5A54] border-[#C8C3BB] hover:border-[#78856F] hover:text-[#292824]'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="label">
            Filter by Risk Level
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              'All',
              'Critical',
              'High',
              'Moderate',
              'Low',
            ].map((r) => (
              <button
                key={r}
                onClick={() => setFilterRisk(r)}
                className={`text-xs px-3 py-1.5 rounded-md border transition-all font-medium ${
                  filterRisk === r
                    ? 'bg-[#34483A] text-white border-[#34483A]'
                    : 'bg-white text-[#5C5A54] border-[#C8C3BB] hover:border-[#78856F] hover:text-[#292824]'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Audit Trail Timeline */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h3
            className="section-title"
            style={{ marginBottom: 0 }}
          >
            AI Decision Audit Trail
          </h3>

          <span className="text-xs text-[#8C8A83]">
            {filtered.length} entries
          </span>
        </div>

        <div className="relative">
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[#E2DDD5]" />

          <div className="space-y-3 pl-8">
            {filtered.map((a) => (
              <div key={a.id} className="relative">
                <div
                  className={`absolute -left-[25px] w-3.5 h-3.5 rounded-full border-2 border-white ${
                    riskDot[a.risk] ?? 'bg-[#8C8A83]'
                  }`}
                  style={{ top: '14px' }}
                />

                <div
                  className={`border rounded-lg p-3 bg-white ${
                    riskBorder[a.risk] ??
                    'border-[#E2DDD5]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-[#8C8A83] bg-[#F2EFE8] px-2 py-0.5 rounded">
                        {a.time}
                      </span>

                      <span className="text-sm font-semibold text-[#292824]">
                        {a.agent}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <RiskBadge risk={a.risk as any} />

                      {a.approved ? (
                        <span className="text-xs font-medium text-[#34483A] flex items-center gap-1">
                          <CheckCircle size={11} />
                          {a.approvedBy}
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-[#C39A52] flex items-center gap-1">
                          <Clock size={11} />
                          Pending
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-sm text-[#292824] mt-1.5 font-medium">
                    {a.action}
                  </div>

                  <div className="text-xs text-[#5C5A54] mt-0.5">
                    {a.detail}
                  </div>

                  <div className="flex items-center gap-4 mt-2 text-xs text-[#8C8A83]">
                    <span>
                      Confidence:{' '}
                      <span className="text-[#78856F] font-medium">
                        {a.confidence}%
                      </span>
                    </span>

                    <span>
                      Input: Clinical data + AI analysis
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="text-center py-10 text-[#8C8A83] text-sm">
                No audit entries match the selected filters.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
