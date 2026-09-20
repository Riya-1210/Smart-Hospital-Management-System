/**
 * EmergencyPage — AI-assisted emergency workflow (triage → bed → doctor →
 * medicine → approval → outcome).
 *
 * Doctors have a VIEW-ONLY role here: they can review existing emergency
 * cases from the database but cannot create new emergency cases. Case
 * creation is reserved for ADMIN/NURSE intake.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHospital } from '../contexts/HospitalContext';
import type { EmergencyPatient } from '../contexts/HospitalContext';
import { useAuth } from '../contexts/AuthContext';
import PriorityBadge from '../components/PriorityBadge';
import RiskBadge from '../components/RiskBadge';
import clsx from 'clsx';

// ─── Workflow stages ─────────────────────────────────────────
const STAGES = [
  { id: 0,  label: 'Patient Arrival',       icon: '🚶' },
  { id: 1,  label: 'Triage',               icon: '🚑' },
  { id: 2,  label: 'Bed Allocation',        icon: '🛏️' },
  { id: 3,  label: 'Doctor Assignment',     icon: '👨‍⚕️' },
  { id: 4,  label: 'Medicine Check',        icon: '💊' },
  { id: 5,  label: 'Crisis Prediction',     icon: '🔮' },
  { id: 6,  label: 'AI Action Plan',        icon: '🧠' },
  { id: 7,  label: 'Human Approval',        icon: '✅' },
  { id: 8,  label: 'Emergency Care',        icon: '🏥' },
  { id: 9,  label: 'Discharge',             icon: '📤' },
  { id: 10, label: 'Follow-up',             icon: '📋' },
];

interface WorkflowState {
  patient: EmergencyPatient | null;
  stage: number;
  bedResult: { bedId: string; reason: string; factors: string[]; confidence: number } | null;
  doctorResult: { doctorId: string; doctorName: string; reason: string; confidence: number } | null;
  medResult: { risk: string; daysLeft: number; expiryRisk: boolean; recommendation: string } | null;
  approved: boolean;
  completed: boolean;
  approvedBy: string | null;
  outcomeTime: number | null; // minutes
}

function emptyWorkflow(): WorkflowState {
  return { patient: null, stage: -1, bedResult: null, doctorResult: null, medResult: null, approved: false, completed: false, approvedBy: null, outcomeTime: null };
}

export default function EmergencyPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { state, dispatch, runTriage, allocateBed, assignDoctor, checkMedicine, addNotification } = useHospital();

  // ── New patient form ──────────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', age: '35', gender: 'Male', symptoms: '', bp: '120/80', hr: '88', spo2: '97', temp: '37.0', rr: '16' });

  // ── Active workflow ───────────────────────────────────────
  const [workflow, setWorkflow] = useState<WorkflowState>(emptyWorkflow());
  const [, setProcessing] = useState(false);

  // Doctors can view emergency cases but must NOT create them.
  const isDoctor = user?.role === 'doctor';

  // ── Selected patient for manage panel ─────────────────────
  const [selectedCase, setSelectedCase] = useState<EmergencyPatient | null>(null);

  const activeCases = state.emergencyCases.filter(e => e.status !== 'Discharged');


  // ─── Start new single patient triage ───────────────────────
  const handleStartEmergency = async () => {
    if (!form.name || !form.symptoms) return;
    setShowForm(false);
    setProcessing(true);
    const vitals = { bp: form.bp, hr: parseInt(form.hr), spo2: parseInt(form.spo2), temp: parseFloat(form.temp), rr: parseInt(form.rr) };
    const patient = await runTriage({ name: form.name, age: parseInt(form.age), gender: form.gender, symptoms: form.symptoms, vitals });
    setWorkflow({ ...emptyWorkflow(), patient, stage: 1 });
    setSelectedCase(patient);
    setProcessing(false);
  };

  // ─── Auto-advance workflow ─────────────────────────────────
  const advanceWorkflow = async (wf: WorkflowState): Promise<WorkflowState> => {
    if (!wf.patient) return wf;
    const stage = wf.stage + 1;
    const updates: Partial<WorkflowState> = { stage };

    if (stage === 2) {
      const bed = await allocateBed(wf.patient);
      updates.bedResult = bed as WorkflowState['bedResult'];
    }
    if (stage === 3) {
      const doc = await assignDoctor(wf.patient);
      updates.doctorResult = doc as WorkflowState['doctorResult'];
    }
    if (stage === 4) {
      const med = checkMedicine('M-006'); // Propofol for anesthesia
      updates.medResult = med as any;
    }
    if (stage === 7) {
      // Waiting for human approval
    }

    return { ...wf, ...updates };
  };

  const handleNextStage = async () => {
    if (!workflow.patient) return;
    const next = await advanceWorkflow(workflow);
    setWorkflow(next);
  };

  const handleApprove = () => {
    if (!workflow.patient || !workflow.doctorResult) return;
    if (!workflow.bedResult) {
      // No bed available — reject the plan rather than proceed with a phantom bed
      addNotification('critical', `⚠ Cannot approve for ${workflow.patient.name}: no bed available. Free or allocate a bed first.`);
      return;
    }
    // Apply bed allocation
    dispatch({ type: 'ALLOCATE_BED', bedId: workflow.bedResult.bedId, patientId: workflow.patient.id });
    // Apply doctor assignment
    dispatch({ type: 'ASSIGN_DOCTOR', doctorId: workflow.doctorResult.doctorId, patientId: workflow.patient.id });
    // Update emergency patient
    dispatch({ type: 'UPDATE_EMERGENCY', id: workflow.patient.id, updates: { status: 'In Treatment', workflowStage: 8, bed: workflow.bedResult.bedId, doctor: workflow.doctorResult.doctorName } });
    addNotification('success', `✓ Emergency workflow approved for ${workflow.patient.name} — treatment underway`);
    const predictedTime = Math.floor(Math.random() * 10) + 8;
    setWorkflow(prev => ({ ...prev, approved: true, stage: 8, approvedBy: user?.name || 'Staff', outcomeTime: predictedTime }));
  };

  const handleReject = () => {
    addNotification('warning', `⚠ Emergency workflow rejected for ${workflow.patient?.name} — manual review required`);
    setWorkflow(emptyWorkflow());
  };

  const handleCompleteEmergency = () => {
    if (!workflow.patient) return;
    dispatch({ type: 'UPDATE_EMERGENCY', id: workflow.patient.id, updates: { status: 'Discharged', workflowStage: 10 } });
    addNotification('success', `✓ ${workflow.patient.name} emergency completed — discharged for follow-up`);
    setWorkflow(prev => ({ ...prev, completed: true, stage: 10 }));
  };

  const stageStatus = (id: number) => {
    if (id < workflow.stage) return 'done';
    if (id === workflow.stage) return 'active';
    return 'pending';
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-warm-900 flex items-center gap-2">
            🚨 Emergency Center
          </h1>
          <p className="text-sm text-warm-500">AI-assisted emergency triage and coordination</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {!isDoctor && (
            <button onClick={() => setShowForm(true)} className="btn-danger flex items-center gap-2">
              + New Emergency
            </button>
          )}
        </div>
      </div>

      {/* New patient form modal (admin/nurse only — doctors view only) */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white border border-warm-300 rounded-2xl p-6 w-full max-w-lg">
            <h2 className="text-base font-bold text-warm-900 mb-4 flex items-center gap-2">🚑 New Emergency Patient</h2>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="col-span-2">
                <label className="text-xs text-warm-500 mb-1 block">Patient Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full bg-warm-50 border border-warm-300 rounded-xl px-3 py-2 text-sm text-warm-900 focus:outline-none focus:border-sage-600" placeholder="Full name" />
              </div>
              <div>
                <label className="text-xs text-warm-500 mb-1 block">Age</label>
                <input type="number" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} className="w-full bg-warm-50 border border-warm-300 rounded-xl px-3 py-2 text-sm text-warm-900 focus:outline-none focus:border-sage-600" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-warm-500 mb-1 block">Symptoms / Chief Complaint *</label>
                <textarea value={form.symptoms} onChange={e => setForm(f => ({ ...f, symptoms: e.target.value }))} rows={2} className="w-full bg-warm-50 border border-warm-300 rounded-xl px-3 py-2 text-sm text-warm-900 focus:outline-none focus:border-sage-600 resize-none" placeholder="Describe symptoms..." />
              </div>
              <div><label className="text-xs text-warm-500 mb-1 block">BP</label><input value={form.bp} onChange={e => setForm(f => ({ ...f, bp: e.target.value }))} className="w-full bg-warm-50 border border-warm-300 rounded-xl px-3 py-2 text-sm text-warm-900 focus:outline-none focus:border-sage-600" /></div>
              <div><label className="text-xs text-warm-500 mb-1 block">Heart Rate</label><input type="number" value={form.hr} onChange={e => setForm(f => ({ ...f, hr: e.target.value }))} className="w-full bg-warm-50 border border-warm-300 rounded-xl px-3 py-2 text-sm text-warm-900 focus:outline-none focus:border-sage-600" /></div>
              <div><label className="text-xs text-warm-500 mb-1 block">SpO2 %</label><input type="number" value={form.spo2} onChange={e => setForm(f => ({ ...f, spo2: e.target.value }))} className="w-full bg-warm-50 border border-warm-300 rounded-xl px-3 py-2 text-sm text-warm-900 focus:outline-none focus:border-sage-600" /></div>
              <div><label className="text-xs text-warm-500 mb-1 block">Temp °C</label><input value={form.temp} onChange={e => setForm(f => ({ ...f, temp: e.target.value }))} className="w-full bg-warm-50 border border-warm-300 rounded-xl px-3 py-2 text-sm text-warm-900 focus:outline-none focus:border-sage-600" /></div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleStartEmergency} disabled={!form.name || !form.symptoms} className="flex-1 btn-danger disabled:opacity-50 py-2.5">
                🚑 Start Emergency Workflow
              </button>
              <button onClick={() => setShowForm(false)} className="flex-1 btn-secondary py-2.5">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Active cases list */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-warm-900">Active Cases</h3>
          {activeCases.length === 0 ? (
            <div className="bg-white border border-warm-300 rounded-xl p-4 text-center text-warm-400 text-sm">
              No active emergency cases.
            </div>
          ) : (
            activeCases.slice(0, 8).map(e => (
              <div
                key={e.id}
                onClick={() => { setSelectedCase(e); setWorkflow(w => w.patient?.id === e.id ? w : { ...emptyWorkflow(), patient: e, stage: 1 }); }}
                className={clsx("bg-white border border-warm-300 border rounded-xl p-3 cursor-pointer transition-all", selectedCase?.id === e.id ? "border-sage-600 bg-sage-700/5" : "border-warm-300 hover:border-warm-200")}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <PriorityBadge priority={e.priority} />
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${e.status === 'In Treatment' ? 'text-sage-600 bg-sage-1000/10' : e.status === 'Triaged' ? 'text-teal-600 bg-teal-100/10' : 'text-warm-500 bg-warm-100'}`}>{e.status}</span>
                </div>
                <div className="text-sm font-semibold text-warm-900">{e.name}</div>
                <div className="text-xs text-warm-500 mt-0.5">{e.symptoms.slice(0, 50)}</div>
                <div className="flex gap-3 mt-1 text-[10px] text-warm-400">
                  <span>{e.department}</span>
                  <span>|</span>
                  <span>{e.icu ? '🛏 ICU' : 'General'}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Center: Workflow */}
        <div className="lg:col-span-2 space-y-4">
          {/* Workflow stages */}
          {workflow.patient && (
            <div className="bg-white border border-warm-300 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base font-bold text-warm-900">Workflow: {workflow.patient.name}</span>
                <PriorityBadge priority={workflow.patient.priority} />
              </div>

              {/* Stages */}
              <div className="flex flex-wrap gap-1 mb-4">
                {STAGES.map(s => {
                  const st = stageStatus(s.id);
                  return (
                    <div key={s.id} className={clsx("flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold border", st === 'done' ? "bg-sage-1000/10 border-sage-200 text-sage-600" : st === 'active' ? "bg-teal-100/10 border-teal-300/30 text-teal-500 animate-pulse" : "bg-warm-50 border-warm-300 text-warm-400")}>
                      <span>{s.icon}</span>
                      <span className="hidden sm:inline">{s.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Current stage detail */}
              <div className="space-y-3">
                {/* Triage result */}
                {workflow.stage >= 1 && (
                  <div className="bg-warm-50 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-sm">🚑</span>
                      <span className="text-sm font-semibold text-warm-900">Triage Complete</span>
                      <span className="text-[10px] text-sage-600 bg-sage-1000/10 border border-sage-200 px-1.5 py-0.5 rounded-full">✓ Done</span>
                    </div>
                    <p className="text-xs text-warm-700">
                      <strong>{workflow.patient.name}</strong> classified as <strong className={workflow.patient.priority === 'Critical' ? 'text-terra-500' : workflow.patient.priority === 'High' ? 'text-amber-600' : 'text-amber-600'}>{workflow.patient.priority}</strong> priority.
                      {workflow.patient.icu && " ICU admission recommended."} Department: {workflow.patient.department}.
                    </p>
                    <div className="text-[10px] text-warm-400 mt-1">Confidence: {workflow.patient.triageConfidence}%</div>
                  </div>
                )}

                {/* Bed result */}
                {workflow.stage >= 2 && workflow.bedResult && (
                  <div className="bg-warm-50 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-sm">🛏️</span>
                      <span className="text-sm font-semibold text-warm-900">Bed Recommended</span>
                      {workflow.approved ? <span className="text-[10px] text-sage-600 bg-sage-1000/10 border border-sage-200 px-1.5 py-0.5 rounded-full">✓ Approved</span> : <span className="text-[10px] text-amber-600 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded-full">Pending Approval</span>}
                    </div>
                    <p className="text-xs text-warm-700">
                      Best available bed: <strong className="text-warm-900">{workflow.bedResult.bedId}</strong>
                    </p>
                    <div className="mt-1 space-y-0.5">
                      {workflow.bedResult.factors.map(f => <div key={f} className="text-[10px] text-sage-600">✓ {f}</div>)}
                    </div>
                    <div className="text-[10px] text-warm-400 mt-1">AI Confidence: {Math.round(workflow.bedResult.confidence)}%</div>
                  </div>
                )}

                {/* Doctor result */}
                {workflow.stage >= 3 && workflow.doctorResult && (
                  <div className="bg-warm-50 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-sm">👨‍⚕️</span>
                      <span className="text-sm font-semibold text-warm-900">Doctor Recommended</span>
                      {workflow.approved ? <span className="text-[10px] text-sage-600 bg-sage-1000/10 border border-sage-200 px-1.5 py-0.5 rounded-full">✓ Assigned</span> : <span className="text-[10px] text-amber-600 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded-full">Pending</span>}
                    </div>
                    <p className="text-xs text-warm-700">
                      <strong className="text-warm-900">{workflow.doctorResult.doctorName}</strong> — {workflow.doctorResult.reason}
                    </p>
                    <div className="text-[10px] text-warm-400 mt-1">AI Confidence: {Math.round(workflow.doctorResult.confidence)}%</div>
                  </div>
                )}

                {/* Medicine result */}
                {workflow.stage >= 4 && workflow.medResult && (
                  <div className="bg-warm-50 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-sm">💊</span>
                      <span className="text-sm font-semibold text-warm-900">Medicine Check</span>
                      <RiskBadge risk={workflow.medResult.risk as any} />
                    </div>
                    <p className="text-xs text-warm-700">
                      Critical medications verified. Propofol: {workflow.medResult.daysLeft} days supply.
                      {workflow.medResult.expiryRisk && " ⚠️ Expiry risk detected."}
                    </p>
                    <div className="text-[10px] text-amber-600 mt-1">→ {workflow.medResult.recommendation}</div>
                  </div>
                )}

                {/* Crisis prediction */}
                {workflow.stage >= 5 && (
                  <div className="bg-warm-50 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-sm">🔮</span>
                      <span className="text-sm font-semibold text-warm-900">Crisis Prediction</span>
                      <RiskBadge risk="High" />
                    </div>
                    <p className="text-xs text-warm-700">
                      {workflow.patient.icu ? "ICU utilization at 82% — admission of critical patient may push to 92% within 2 hours." : "Hospital capacity within acceptable range for this patient."}
                    </p>
                    <div className="text-[10px] text-amber-600 mt-1">→ Monitor ICU closely. Prepare HDU as overflow option.</div>
                  </div>
                )}

                {/* AI Action Plan */}
                {workflow.stage >= 6 && (
                  <div className="bg-warm-50 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-sm">🧠</span>
                      <span className="text-sm font-semibold text-warm-900">AI Action Plan Ready</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      {workflow.bedResult && <div className="text-sage-600">✓ Bed {workflow.bedResult.bedId} reserved</div>}
                      {workflow.doctorResult && <div className="text-sage-600">✓ {workflow.doctorResult.doctorName} alerted</div>}
                      {workflow.medResult?.risk !== 'Low' && <div className="text-amber-600">⚠ Pharmacy notified</div>}
                    </div>
                  </div>
                )}

                {/* Human Approval */}
                {workflow.stage >= 7 && !workflow.approved && (
                  <div className="bg-amber-100 border border-amber-300/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-base">✅</span>
                      <span className="text-sm font-bold text-warm-900">Human Approval Required</span>
                      <RiskBadge risk="High" />
                    </div>
                    <p className="text-xs text-warm-700 mb-3">
                      AI has generated a complete action plan for <strong>{workflow.patient.name}</strong>.
                      Your approval is required before any action is taken.
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                      {workflow.bedResult && <div><span className="text-warm-500">Bed: </span><span className="text-warm-900">{workflow.bedResult.bedId}</span></div>}
                      {!workflow.bedResult && <div><span className="text-warm-500">Bed: </span><span className="text-terra-500">None available — manual allocation required</span></div>}
                      {workflow.doctorResult && <div><span className="text-warm-500">Doctor: </span><span className="text-warm-900">{workflow.doctorResult.doctorName}</span></div>}
                      <div><span className="text-warm-500">ICU: </span><span className="text-warm-900">{workflow.patient.icu ? 'Required' : 'Not required'}</span></div>
                      <div><span className="text-warm-500">Meds: </span><span className={workflow.medResult?.risk === 'Critical' ? 'text-terra-500' : 'text-warm-900'}>{workflow.medResult?.risk || 'OK'}</span></div>
                    </div>
                    <div className="flex gap-2">
                    <button onClick={handleApprove} className="flex-1 btn-success py-2.5">✓ Approve & Execute</button>
                    <button onClick={handleReject} className="flex-1 btn-danger py-2.5">✕ Reject</button>
                    </div>
                  </div>
                )}

                {/* Approved — in treatment */}
                {workflow.approved && workflow.stage >= 8 && !workflow.completed && (
                  <div className="bg-sage-1000/10 border border-sage-300/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-base">🏥</span>
                      <span className="text-sm font-bold text-sage-600">Emergency Care Underway</span>
                    </div>
                    <p className="text-xs text-warm-700 mb-2">
                      Approved by {workflow.approvedBy}. Patient assigned to bed {workflow.bedResult?.bedId}, doctor {workflow.doctorResult?.doctorName}.
                      Predicted response time: {workflow.outcomeTime} minutes.
                    </p>
                    <div className="text-xs text-warm-500 mb-3">Outcome verification: predicted ≤{workflow.outcomeTime} min → actual tracking in progress</div>
                    <button onClick={handleCompleteEmergency} className="w-full btn-primary py-2.5">
                      ✓ Complete Emergency — Move to Discharge & Follow-up
                    </button>
                  </div>
                )}

                {/* Completed */}
                {workflow.completed && (
                  <div className="bg-sage-700/10 border border-sage-600/30 rounded-xl p-4">
                    <div className="text-sm font-bold text-sage-700 mb-2">✓ Emergency Completed</div>
                    <p className="text-xs text-warm-700 mb-2">
                      Patient {workflow.patient.name} has been discharged and moved to follow-up monitoring.
                      Predicted time: {workflow.outcomeTime} min → Outcome: effective.
                    </p>
                    <div className="flex gap-2">
                      <button onClick={() => navigate('/followup')} className="flex-1 text-xs bg-warm-100 hover:bg-warm-200 border border-warm-300 text-warm-800 py-2 rounded-xl transition-colors">
                        📋 View Follow-up
                      </button>
                      <button onClick={() => navigate('/audit')} className="flex-1 text-xs bg-warm-100 hover:bg-warm-200 border border-warm-300 text-warm-800 py-2 rounded-xl transition-colors">
                        📄 View Audit Trail
                      </button>
                    </div>
                  </div>
                )}

                {/* Advance button */}
                {workflow.patient && workflow.stage >= 1 && workflow.stage < 7 && !workflow.approved && (
                  <button onClick={handleNextStage} className="w-full bg-sage-700 hover:bg-sage-600 text-warm-900 font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2">
                    {workflow.stage < 6 ? `→ Next: ${STAGES[workflow.stage + 1]?.label}` : '→ Generate Action Plan & Request Approval'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* No workflow selected */}
          {!workflow.patient && (
            <div className="bg-white border border-warm-300 rounded-xl p-8 text-center text-warm-400">
              <div className="text-4xl mb-3">🚑</div>
              <div className="text-sm font-semibold text-warm-900 mb-1">No active workflow</div>
              <div className="text-xs text-warm-500 mb-4">Click a patient case to view the AI workflow</div>
              <div className="flex gap-3 justify-center">
                {!isDoctor && (
                  <button onClick={() => setShowForm(true)} className="bg-terra-1000 hover:bg-terra-400 text-warm-900 font-semibold px-4 py-2 rounded-xl text-sm transition-colors">+ New Emergency</button>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Audit preview */}
      {state.auditTrail.length > 0 && (
        <div className="bg-white border border-warm-300 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-warm-900">Recent AI Actions (Audit Trail)</h3>
            <button onClick={() => navigate('/audit')} className="text-xs text-sage-700">Full Trail →</button>
          </div>
          <div className="space-y-1.5">
            {state.auditTrail.slice(0, 5).map(a => (
              <div key={a.id} className="flex items-start gap-2 text-xs py-1">
                <span className="text-warm-400 font-mono w-16 flex-shrink-0">{a.time}</span>
                <span className="text-warm-500 w-24 flex-shrink-0">{a.agent}</span>
                <span className="text-warm-800 flex-1">{a.action}</span>
                <span className={`flex-shrink-0 ${a.approved ? 'text-sage-600' : 'text-amber-600'}`}>{a.approved ? '✓' : '⏳'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-[10px] text-warm-400 text-center italic">
        AI triage is decision-support only. All clinical decisions must be made by qualified medical professionals. Demo data only.
      </p>
    </div>
  );
}

