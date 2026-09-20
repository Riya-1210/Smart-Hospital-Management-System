import { useState } from 'react';
import { Brain, CheckCircle, XCircle, Eye, AlertTriangle } from 'lucide-react';
import RiskBadge from '../components/RiskBadge';
import { useHospital } from '../contexts/HospitalContext';
import { useAuth } from '../contexts/AuthContext';

type Status = 'Pending' | 'Approved' | 'Rejected';

export default function RecommendationsPage() {
  const { state, approveRec, rejectRec } = useHospital();
  const { user } = useAuth();
  const [filter, setFilter] = useState<'All' | Status>('All');
  const [selected, setSelected] = useState<typeof state.recommendations[0] | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);

  const recs = state.recommendations;
  const filtered = recs.filter(r => filter === 'All' || r.status === (filter as any));

  const handleApprove = (id: string) => {
    approveRec(id, user?.name || 'Staff');
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status: 'Approved' } : prev);
  };

  const handleReject = (id: string) => {
    rejectRec(id, user?.name || 'Staff', rejectReason || undefined);
    setShowRejectModal(null);
    setRejectReason('');
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status: 'Rejected' } : prev);
  };

  const handleAction = (id: string, action: 'Approved' | 'Rejected') => {
    if (action === 'Approved') handleApprove(id);
    else setShowRejectModal(id);
  };

  return (
    <div className="p-4 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-warm-900 flex items-center gap-2">
            <Brain size={20} className="text-sage-700" />
            AI Recommendations
          </h1>
          <p className="text-xs text-warm-500 mt-0.5">Human-in-the-loop approval for all AI recommendations</p>
        </div>
        <span className="demo-tag">Demo / Simulation</span>
      </div>

      {/* Safety Banner */}
      <div className="border border-teal-200 bg-teal-100 rounded-xl p-3">
        <div className="flex items-center gap-2 text-xs text-teal-600">
          <AlertTriangle size={14} />
          <strong>Human-in-the-Loop Safety:</strong> All HIGH and CRITICAL recommendations require human approval before any action is taken. AI never makes autonomous clinical decisions.
        </div>
      </div>

      {/* Risk Level Key */}
      <div className="card">
        <div className="text-xs font-semibold text-warm-900 mb-2">Risk Level Action Requirements:</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { risk: 'Low', req: 'Automatic / Low oversight', color: 'text-sage-600' },
            { risk: 'Moderate', req: 'Supervisor notification', color: 'text-amber-600' },
            { risk: 'High', req: 'Human approval required', color: 'text-amber-600' },
            { risk: 'Critical', req: 'Senior approval mandatory', color: 'text-terra-500' },
          ].map(r => (
            <div key={r.risk} className="bg-warm-50 rounded-lg p-2">
              <RiskBadge risk={r.risk as any} />
              <div className={`text-[10px] mt-1 ${r.color}`}>{r.req}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(['All', 'Pending', 'Approved', 'Rejected'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${filter === f ? 'border-sage-600 bg-sage-700/20 text-warm-900' : 'border-warm-300 text-warm-500 hover:text-warm-900'}`}>
            {f} {f !== 'All' && `(${recs.filter(r => r.status === f).length})`}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recommendation List */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="card text-center py-8 text-neutral-400">
              <Brain size={32} className="mx-auto mb-2 opacity-30" />
              <div className="text-sm">No recommendations for this filter</div>
            </div>
          )}
          {filtered.map(rec => (
            <div
              key={rec.id}
              className={`card cursor-pointer transition-all border-l-4 ${
                rec.risk === 'Critical' ? 'border-l-critical-400' : rec.risk === 'High' ? 'border-l-warning-400' : rec.risk === 'Moderate' ? 'border-l-teal-400' : 'border-l-success-400'
              } ${selected?.id === rec.id ? 'ring-1 ring-primary-500' : ''}`}
              onClick={() => setSelected(rec)}
            >
              <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
                <div>
                  <div className="text-xs text-neutral-500 mb-0.5">{rec.agent} · {rec.timestamp}</div>
                  <div className="text-sm font-semibold text-neutral-900">{rec.action}</div>
                </div>
                <div className="flex items-center gap-2">
                  <RiskBadge risk={rec.risk as any} />
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${
                    rec.status === 'Approved' ? 'text-sage-600 border-sage-300/30 bg-sage-1000/10' :
                    rec.status === 'Rejected' ? 'text-terra-500 border-terra-300/30 bg-terra-100' :
                    'text-amber-600 border-amber-300/30 bg-amber-100'
                  }`}>{rec.status}</span>
                </div>
              </div>

              <div className="text-xs text-neutral-500 mb-2">{rec.reason.slice(0, 80)}...</div>

              {/* Confidence bar */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] text-neutral-400">Confidence: {rec.confidence}%</span>
                <div className="flex-1 risk-bar">
                  <div className="h-full rounded-full bg-primary-600" style={{ width: `${rec.confidence}%` }} />
                </div>
              </div>

              {rec.status === 'Pending' && (
                <div className="flex gap-2">
                  <button onClick={e => { e.stopPropagation(); handleAction(rec.id, 'Approved'); }} className="btn-success text-xs px-2.5 py-1.5 flex items-center gap-1">
                    <CheckCircle size={11} />Approve
                  </button>
                  <button onClick={e => { e.stopPropagation(); handleAction(rec.id, 'Rejected'); }} className="btn-danger text-xs px-2.5 py-1.5 flex items-center gap-1">
                    <XCircle size={11} />Reject
                  </button>
                  <button onClick={e => { e.stopPropagation(); setSelected(rec); }} className="btn-secondary text-xs px-2.5 py-1.5 flex items-center gap-1">
                    <Eye size={11} />View Reason
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Detail / Explainability Panel */}
        {selected ? (
          <div className="card">
            <h3 className="text-sm font-bold text-neutral-900 mb-3">AI Recommendation Details</h3>

            <div className={`border rounded-xl p-3 mb-3 ${selected.risk === 'Critical' ? 'border-critical-200 bg-critical-50' : selected.risk === 'High' ? 'border-warning-200 bg-warning-50' : 'border-neutral-300'}`}>
              <div className="text-xs text-neutral-500 mb-0.5">{selected.agent}</div>
              <div className="text-sm font-bold text-neutral-900">{selected.action}</div>
            </div>

            <div className="mb-3">
              <div className="text-xs font-semibold text-neutral-900 mb-1">Why This Was Recommended:</div>
              <div className="text-xs text-neutral-700">{selected.reason}</div>
            </div>

            <div className="mb-3">
              <div className="text-xs font-semibold text-neutral-900 mb-1">Key Contributing Factors:</div>
              <div className="space-y-1">
                {selected.factors.map(f => (
                  <div key={f} className="flex items-center gap-1 text-xs text-warm-700">
                    <span className="text-primary-600">•</span> {f}
                  </div>
                ))}
              </div>
            </div>              <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-primary-50 rounded-xl p-2 text-center">
                <div className="text-lg font-bold text-primary-700">{selected.confidence}%</div>
                <div className="text-[10px] text-neutral-500">Confidence Score</div>
              </div>
              <div className="bg-neutral-100 rounded-xl p-2 text-center">
                <RiskBadge risk={selected.risk as any} />
                <div className="text-[10px] text-neutral-500 mt-1">Risk Level</div>
              </div>
            </div>

            <div className="mb-3">
              <div className="text-xs font-semibold text-neutral-900 mb-1">Alternatives Considered:</div>
              {selected.alternatives.map(a => (
                <div key={a} className="text-xs text-neutral-500 flex items-center gap-1">
                  <span className="text-neutral-400">↳</span> {a}
                </div>
              ))}
            </div>

            <div className="bg-warning-100 border border-warning-200 rounded-xl p-2 mb-3">
              <div className="text-xs font-semibold text-warning-600">Human Approval: REQUIRED</div>
              <div className="text-[10px] text-neutral-500 mt-0.5">
                {selected.risk === 'Critical' ? 'Senior clinical authorization mandatory before any action.' :
                 selected.risk === 'High' ? 'Attending physician approval required before execution.' :
                 'Supervisor notification required.'}
              </div>
            </div>

            {selected.status === 'Pending' && (
              <div className="flex gap-2">
                <button onClick={() => handleApprove(selected.id)} className="btn-success flex-1 flex items-center justify-center gap-1 text-sm">
                  <CheckCircle size={14} />Approve
                </button>
                <button onClick={() => setShowRejectModal(selected.id)} className="btn-danger flex-1 flex items-center justify-center gap-1 text-sm">
                  <XCircle size={14} />Reject
                </button>
              </div>
            )}

            <p className="text-[10px] text-neutral-400 mt-3 italic">
              AI-generated recommendations are decision-support tools only. Final decisions must be made by qualified clinical professionals.
            </p>
          </div>
        ) : (
          <div className="card flex items-center justify-center py-12 text-neutral-400">
            <div className="text-center"><Brain size={36} className="mx-auto mb-2 opacity-30" /><div className="text-sm">Select a recommendation to view details</div></div>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white border border-warm-300 rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-sm font-bold text-warm-900 mb-3">Reject Recommendation</h3>              <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (optional)..."
              className="w-full bg-neutral-100 border border-neutral-300 rounded-xl px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:border-primary-500 resize-none mb-4"
              rows={3}
            />
            <div className="flex gap-2">
              <button onClick={() => handleReject(showRejectModal)} className="btn-danger flex-1">Confirm Reject</button>
              <button onClick={() => { setShowRejectModal(null); setRejectReason(''); }} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
