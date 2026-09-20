// ============================================================================
// HospitalContext — single source of truth for hospital state.
// HYDRATION MODEL: on login the context fetches live data (beds, doctors,
// medicines, appointments) from the backend. If the backend is
// unreachable it falls back to the bundled demo data so the UI keeps working.
// The AI agent helpers (triage/bed/doctor/medicine) call the backend
// agents and mirror results into local state so every screen stays live.
// ============================================================================
import type React from 'react';
import { createContext, useContext, useReducer, useCallback, useEffect, useState } from 'react';
import {
  beds as demoBeds,
  patients as demoPatients,
  doctors as demoDoctors,
  medicines as demoMedicines,
  ambulances as initialAmbulances,
  aiRecommendations as initialRecs,
} from '../data/demoData';
import { api, hospitalApi, ApiError, type BedRow, type DoctorRow, type AppointmentRow, type MedicineRow, type PatientRow, type EmergencyCaseRow, type BackendUser, type DoctorPatientLinkRow, type IcuPatientRow } from '../lib/api';

// ─── Types (unchanged public surface) ───────────────────────────────────────
export type Priority = 'Critical' | 'High' | 'Moderate' | 'Mild';
export type RiskLevel = 'Critical' | 'High' | 'Moderate' | 'Low';
export type RecStatus = 'Pending' | 'Approved' | 'Rejected' | 'Modified';

export interface AuditEntry {
  id: string;
  time: string;
  agent: string;
  action: string;
  detail: string;
  confidence: number;
  risk: RiskLevel;
  approvedBy: string | null;
  approved: boolean;
  outcome?: string;
  patientId?: string;
}

export interface Recommendation {
  id: string;
  agent: string;
  action: string;
  reason: string;
  factors: string[];
  confidence: number;
  risk: RiskLevel;
  status: RecStatus;
  timestamp: string;
  alternatives: string[];
  humanApproval: boolean;
  patientId?: string;
  rejectedReason?: string;
}

export interface EmergencyPatient {
  id: string;
  name: string;
  age: number;
  gender: string;
  symptoms: string;
  priority: Priority;
  department: string;
  bed: string | null;
  doctor: string | null;
  status: 'Triaged' | 'Allocated' | 'Assigned' | 'In Treatment' | 'Discharged' | 'Follow-up';
  workflowStage: number;
  vitals: { bp: string; hr: number; spo2: number; temp: number; rr: number };
  admittedAt: string;
  diagnosis: string;
  icu: boolean;
  triageConfidence: number;
  emergencyId?: number; // DB emergency_cases.emergency_id when backend-backed
}

export interface HospitalState {
  beds: BedState[];
  patients: typeof demoPatients;
  doctors: DoctorState[];
  medicines: MedicineState[];
  ambulances: typeof initialAmbulances;
  recommendations: Recommendation[];
  auditTrail: AuditEntry[];
  emergencyCases: EmergencyPatient[];
  appointments: AppointmentState[];
  doctorPatients: DoctorPatient[];
  icuPatients: IcuPatient[];
  notifications: Notification[];
  demoRunning: boolean;
  demoStep: number;
  agentMetrics: Record<string, { accuracy: number; actions: number; success: number }>;
  patientFollowUp: FollowUp[];
  dataSource: 'backend' | 'demo';
}

export interface BedState {
  id: string;
  type: string;
  department: string;
  status: 'Available' | 'Occupied' | 'Reserved' | 'Maintenance';
  patient: string | null;
  equipment: string[];
  floor: number;
}

export interface DoctorState {
  id: string;
  name: string;
  specialization: string;
  status: string;
  workload: number;
  patients: number;
  shift: string;
  onCall: boolean;
  experience: number;
  doctorId?: number; // DB doctors.doctor_id when backend-backed
}

export interface MedicineState {
  id: string;
  name: string;
  category: string;
  stock: number;
  dailyUsage: number;
  expiryDays: number;
  minStock: number;
  unit: string;
  risk: string;
  supplier: string;
  leadTime: number;
}

export interface AppointmentState {
  id: string;
  appointmentId?: number;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  time: string;
  type: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'Missed';
  notes?: string;
}

/** A patient under the logged-in doctor's care — straight from the database. */
export interface DoctorPatient {
  patientId: number;
  name: string;
  age: number | null;
  gender: string | null;
  bloodGroup: string | null;
  phone: string | null;
  department: string | null;
  doctorName: string | null;
  /** How the doctor is linked to this patient (appointments vs emergency/admission) */
  links: Array<{
    type: 'APPOINTMENT' | 'EMERGENCY';
    date: string | null;
    reason: string | null;
    status: string | null;
    bedNumber: string | null;
    wardName: string | null;
    wardType: string | null;
    priority: string | null;
    emergencyStatus: string | null;
    emergencyId: number | null;
  }>;
}

/** A patient currently admitted to an ICU bed — from the database. */
export interface IcuPatient {
  emergencyId: number;
  patientId: number;
  name: string;
  age: number | null;
  gender: string | null;
  priority: 'Critical' | 'High' | 'Moderate' | 'Mild';
  status: string;
  admittedAt: string;
  condition: string | null;
  bedNumber: string | null;
  wardName: string | null;
  doctorName: string | null;
  department: string | null;
}

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'critical' | 'success';
  message: string;
  time: string;
  read: boolean;
  for?: string;
}

export interface FollowUp {
  id: string;
  patientId: string;
  patientName: string;
  diagnosis: string;
  dischargeDate: string;
  followUpDate: string;
  doctor: string;
  status: 'On Track' | 'Monitoring' | 'Missed Appointment' | 'Review Required';
  recoveryTrend: Array<'Improving' | 'Stable' | 'Worsening'>;
  alert: string | null;
  medicines: string[];
  nextCheckIn: string;
  missedAppointments: number;
}

// ─── Mappers: backend rows → UI state shapes ───────────────────────────────
function mapPatient(p: PatientRow) {
  const age = p.date_of_birth ? Math.max(0, new Date().getFullYear() - new Date(p.date_of_birth).getFullYear()) : 0;
  return {
    id: `P-${String(p.patient_id).padStart(3, '0')}`,
    name: p.full_name,
    age,
    gender: p.gender || '—',
    symptoms: '—',
    priority: 'Moderate' as const,
    department: '—',
    bed: '—',
    doctor: '—',
    status: 'Active' as const,
    vitals: { bp: '—', hr: 0, spo2: 0, temp: 36.5, rr: 0 },
    admittedAt: '—',
    diagnosis: 'Registered patient',
    dbPatientId: p.patient_id,
  };
}

function mapEmergencyCase(e: EmergencyCaseRow): EmergencyPatient {
  const age = e.date_of_birth ? Math.max(0, new Date().getFullYear() - new Date(e.date_of_birth).getFullYear()) : 0;
  const status = e.status === 'OPEN' ? 'Triaged' : e.status === 'IN_TREATMENT' ? 'In Treatment' : e.status === 'STABLE' ? 'In Treatment' : 'Discharged';
  const stage = e.status === 'OPEN' ? 1 : e.status === 'IN_TREATMENT' ? 9 : e.status === 'STABLE' ? 9 : 11;
  return {
    id: `EP-${e.emergency_id}`,
    name: e.patient_name,
    age,
    gender: e.gender || '—',
    symptoms: e.condition_description || '—',
    priority: e.priority === 'CRITICAL' ? 'Critical' : e.priority === 'HIGH' ? 'High' : e.priority === 'MEDIUM' ? 'Moderate' : 'Mild',
    department: e.ward_name || 'Emergency',
    bed: e.bed_number,
    doctor: e.doctor_name ? (e.doctor_name.startsWith('Dr') ? e.doctor_name : `Dr. ${e.doctor_name}`) : null,
    status: status as EmergencyPatient['status'],
    workflowStage: stage,
    vitals: { bp: '—', hr: 0, spo2: 0, temp: 36.5, rr: 0 },
    admittedAt: (e.arrival_time || '').replace('T', ' ').slice(0, 16),
    diagnosis: e.condition_description || 'Emergency case',
    icu: (e.bed_number || '').startsWith('ICU'),
    triageConfidence: 0,
    emergencyId: e.emergency_id,
  };
}

function mapBed(b: BedRow): BedState {
  return {
    id: b.bed_number,
    type: (b.bed_type || 'GENERAL').toUpperCase(),
    department: b.ward_name,
    status: b.status === 'AVAILABLE' ? 'Available' : b.status === 'OCCUPIED' ? 'Occupied' : b.status === 'RESERVED' ? 'Reserved' : 'Maintenance',
    patient: null,
    equipment: b.bed_type === 'ICU' ? ['Monitor', 'Ventilator'] : ['Monitor'],
    floor: b.floor ?? 1,
  };
}

function mapDoctor(d: DoctorRow, idx: number): DoctorState {
  return {
    id: `D-${String(d.doctor_id).padStart(3, '0')}`,
    name: d.full_name.startsWith('Dr') ? d.full_name : `Dr. ${d.full_name}`,
    specialization: d.specialization,
    status: d.availability_status === 'AVAILABLE' ? 'On Duty' : 'Off Duty',
    workload: Math.min(95, 30 + idx * 7), // refined by doctor-workload endpoint below
    patients: 0,
    shift: 'Day',
    onCall: d.availability_status === 'AVAILABLE',
    experience: d.experience_years ?? 0,
    doctorId: d.doctor_id,
  };
}

const APPT_STATUS_MAP: Record<string, AppointmentState['status']> = {
  PENDING: 'Scheduled', CONFIRMED: 'Scheduled', COMPLETED: 'Completed', CANCELLED: 'Cancelled', NO_SHOW: 'Missed',
};

function mapAppointment(a: AppointmentRow): AppointmentState {
  return {
    id: `APT-${a.appointment_id}`,
    appointmentId: a.appointment_id,
    patientId: `U-${String(a.patient_user_id ?? a.patient_id).padStart(3, '0')}`,
    patientName: a.patient_name,
    doctorId: `D-${a.doctor_id}`,
    doctorName: a.doctor_name.startsWith('Dr') ? a.doctor_name : `Dr. ${a.doctor_name}`,
    date: a.appointment_date,
    time: (a.appointment_time || '').slice(0, 5),
    type: a.reason || 'Consultation',
    status: APPT_STATUS_MAP[a.status] ?? 'Scheduled',
  };
}

function mapMedicine(m: MedicineRow): MedicineState {
  const stock = Number(m.quantity);
  const reorder = Number(m.reorder_level || 10);
  const dailyUsage = Math.max(3, Math.round(stock / 30));
  const risk = stock <= reorder / 2 ? 'Critical' : stock <= reorder ? 'High' : stock / dailyUsage <= 10 ? 'Moderate' : 'Low';
  return {
    id: `M-${String(m.medicine_id).padStart(3, '0')}`,
    name: m.medicine_name,
    category: m.category || 'General',
    stock,
    dailyUsage,
    expiryDays: m.expiry_date ? Math.max(0, Math.round((new Date(m.expiry_date).getTime() - Date.now()) / 86400000)) : 365,
    minStock: reorder,
    unit: 'units',
    risk,
    supplier: m.supplier || '—',
    leadTime: 3,
  };
}

function priorityFromDb(p: string | null): IcuPatient['priority'] {
  return p === 'CRITICAL' ? 'Critical' : p === 'HIGH' ? 'High' : p === 'MEDIUM' ? 'Moderate' : 'Mild';
}

/** Merge the DB's per-link rows into one entry per patient. */
function mapDoctorPatients(rows: DoctorPatientLinkRow[]): DoctorPatient[] {
  const byId = new Map<number, DoctorPatient>();
  for (const r of rows) {
    let entry = byId.get(r.patient_id);
    if (!entry) {
      entry = {
        patientId: r.patient_id,
        name: r.full_name,
        age: r.age != null ? Number(r.age) : null,
        gender: r.gender,
        bloodGroup: r.blood_group,
        phone: r.phone,
        department: r.department,
        doctorName: r.doctor_name ? (r.doctor_name.startsWith('Dr') ? r.doctor_name : `Dr. ${r.doctor_name}`) : null,
        links: [],
      };
      byId.set(r.patient_id, entry);
    }
    entry.links.push({
      type: r.link_type,
      date: r.last_date,
      reason: r.latest_reason,
      status: r.latest_status,
      bedNumber: r.bed_number,
      wardName: r.ward_name,
      wardType: r.ward_type,
      priority: r.emergency_priority,
      emergencyStatus: r.emergency_status,
      emergencyId: r.emergency_id,
    });
  }
  return Array.from(byId.values()).sort((a, b) => a.patientId - b.patientId);
}

function mapIcuPatient(e: IcuPatientRow): IcuPatient {
  return {
    emergencyId: e.emergency_id,
    patientId: e.patient_id,
    name: e.patient_name,
    age: e.age != null ? Number(e.age) : null,
    gender: e.gender,
    priority: priorityFromDb(e.priority),
    status: e.status === 'IN_TREATMENT' ? 'In Treatment' : e.status === 'STABLE' ? 'Stable' : 'Open',
    admittedAt: (e.arrival_time || '').replace('T', ' ').slice(0, 16),
    condition: e.condition_description,
    bedNumber: e.bed_number,
    wardName: e.ward_name,
    doctorName: e.doctor_name ? (e.doctor_name.startsWith('Dr') ? e.doctor_name : `Dr. ${e.doctor_name}`) : null,
    department: e.department,
  };
}

// ─── Initial state (demo baseline, replaced by backend when reachable) ──────
const initialFollowUps: FollowUp[] = [
  { id: 'FU-001', patientId: 'P-010', patientName: 'Preethi Thomas', diagnosis: 'Minor fractures — Road accident', dischargeDate: '2024-01-14', followUpDate: '2024-01-21', doctor: 'Dr. Kiran Verma', status: 'Monitoring', recoveryTrend: ['Improving', 'Improving', 'Stable', 'Worsening'], alert: 'Recovery deviation detected — Day 4 worsening trend', medicines: ['Diclofenac 50mg', 'Calcium supplements'], nextCheckIn: 'Today 18:00', missedAppointments: 0 },
  { id: 'FU-002', patientId: 'P-011', patientName: 'Ramesh Gupta', diagnosis: 'Cardiac catheterization', dischargeDate: '2024-01-12', followUpDate: '2024-01-19', doctor: 'Dr. Rahul Gupta', status: 'On Track', recoveryTrend: ['Improving', 'Improving', 'Improving', 'Stable'], alert: null, medicines: ['Aspirin 75mg', 'Atorvastatin 40mg', 'Metoprolol 25mg'], nextCheckIn: '2024-01-21', missedAppointments: 0 },
  { id: 'FU-003', patientId: 'P-012', patientName: 'Meena Pillai', diagnosis: 'Appendectomy', dischargeDate: '2024-01-10', followUpDate: '2024-01-17', doctor: 'Dr. Neha Joshi', status: 'Missed Appointment', recoveryTrend: ['Improving', 'Improving', 'Stable', 'Stable'], alert: 'Missed follow-up appointment', medicines: ['Amoxicillin 500mg', 'Pantoprazole 40mg'], nextCheckIn: 'Overdue', missedAppointments: 1 },
];

const initialNotifications: Notification[] = [];

const initialAgentMetrics = {
  'Triage Agent': { accuracy: 96, actions: 0, success: 0 },
  'Bed Agent': { accuracy: 91, actions: 0, success: 0 },
  'Doctor Agent': { accuracy: 88, actions: 0, success: 0 },
  'Medicine Agent': { accuracy: 91, actions: 0, success: 0 },
  'Crisis Agent': { accuracy: 87, actions: 0, success: 0 },
  'Follow-up Agent': { accuracy: 84, actions: 0, success: 0 },
  'Orchestrator': { accuracy: 95, actions: 0, success: 0 },
};

function makeInitialState(): HospitalState {
  return {
    beds: JSON.parse(JSON.stringify(demoBeds)),
    patients: JSON.parse(JSON.stringify(demoPatients)),
    doctors: JSON.parse(JSON.stringify(demoDoctors)),
    medicines: JSON.parse(JSON.stringify(demoMedicines)),
    ambulances: JSON.parse(JSON.stringify(initialAmbulances)),
    recommendations: JSON.parse(JSON.stringify(initialRecs)),
    auditTrail: [],
    emergencyCases: [],
    appointments: [],
    doctorPatients: [],
    icuPatients: [],
    notifications: JSON.parse(JSON.stringify(initialNotifications)),
    demoRunning: false,
    demoStep: -1,
    agentMetrics: JSON.parse(JSON.stringify(initialAgentMetrics)),
    patientFollowUp: JSON.parse(JSON.stringify(initialFollowUps)),
    dataSource: 'demo',
  };
}

// ─── Actions ────────────────────────────────────────────────────────────────
type Action =
  | { type: 'ADD_AUDIT'; entry: Omit<AuditEntry, 'id' | 'time'> }
  | { type: 'ADD_RECOMMENDATION'; rec: Omit<Recommendation, 'id'> }
  | { type: 'APPROVE_REC'; id: string; by: string }
  | { type: 'REJECT_REC'; id: string; by: string; reason?: string }
  | { type: 'MODIFY_REC'; id: string; newAction: string; by: string }
  | { type: 'ALLOCATE_BED'; bedId: string; patientId: string }
  | { type: 'ASSIGN_DOCTOR'; doctorId: string; patientId: string }
  | { type: 'ADD_EMERGENCY'; patient: EmergencyPatient }
  | { type: 'UPDATE_EMERGENCY'; id: string; updates: Partial<EmergencyPatient> }
  | { type: 'SET_DEMO_STEP'; step: number }
  | { type: 'SET_DEMO_RUNNING'; running: boolean }
  | { type: 'UPDATE_MEDICINE'; id: string; delta: number }
  | { type: 'ADD_NOTIFICATION'; notif: Omit<Notification, 'id' | 'time'> }
  | { type: 'MARK_NOTIFICATION_READ'; id: string }
  | { type: 'ADD_APPOINTMENT'; appt: Omit<AppointmentState, 'id'> }
  | { type: 'UPDATE_APPOINTMENT'; id: string; updates: Partial<AppointmentState> }
  | { type: 'UPDATE_FOLLOW_UP'; id: string; updates: Partial<FollowUp> }
  | { type: 'UPDATE_DOCTOR_WORKLOAD'; id: string; delta: number }
  | { type: 'UPDATE_AGENT_METRICS'; agent: string; success: boolean }
  | { type: 'DISPATCH_AMBULANCE'; id: string; location: string }
  | { type: 'SET_DATA_SOURCE'; source: 'backend' | 'demo' }
  | { type: 'SET_LIVE_DATA'; beds?: BedState[]; doctors?: DoctorState[]; medicines?: MedicineState[]; appointments?: AppointmentState[]; patients?: ReturnType<typeof mapPatient>[]; emergencyCases?: EmergencyPatient[]; doctorPatients?: DoctorPatient[]; icuPatients?: IcuPatient[] }
  | { type: 'RESET' };

function now(): string {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function reducer(state: HospitalState, action: Action): HospitalState {
  switch (action.type) {
    case 'ADD_AUDIT':
      return { ...state, auditTrail: [{ ...action.entry, id: uid(), time: now() }, ...state.auditTrail].slice(0, 100) };

    case 'ADD_RECOMMENDATION':
      return { ...state, recommendations: [{ ...action.rec, id: `REC-${uid()}` }, ...state.recommendations].slice(0, 50) };

    case 'APPROVE_REC': {
      const rec = state.recommendations.find((r) => r.id === action.id);
      return {
        ...state,
        recommendations: state.recommendations.map((r) => (r.id === action.id ? { ...r, status: 'Approved' as const } : r)),
        auditTrail: [{
          id: uid(), time: now(), agent: 'Human',
          action: `Approved: ${rec?.action || action.id}`,
          detail: `Approved by ${action.by}`,
          confidence: 100, risk: rec?.risk || 'Low',
          approved: true, approvedBy: action.by,
        }, ...state.auditTrail].slice(0, 100),
        notifications: [{ id: uid(), type: 'success', message: `Recommendation approved: ${rec?.action}`, time: now(), read: false }, ...state.notifications],
      };
    }

    case 'REJECT_REC': {
      const rec = state.recommendations.find((r) => r.id === action.id);
      return {
        ...state,
        recommendations: state.recommendations.map((r) => (r.id === action.id ? { ...r, status: 'Rejected' as const, rejectedReason: action.reason } : r)),
        auditTrail: [{
          id: uid(), time: now(), agent: 'Human',
          action: `Rejected: ${rec?.action || action.id}`,
          detail: action.reason ? `Rejected by ${action.by}: ${action.reason}` : `Rejected by ${action.by}`,
          confidence: 100, risk: rec?.risk || 'Low',
          approved: false, approvedBy: action.by,
        }, ...state.auditTrail].slice(0, 100),
      };
    }

    case 'MODIFY_REC':
      return {
        ...state,
        recommendations: state.recommendations.map((r) => (r.id === action.id ? { ...r, action: action.newAction, status: 'Modified' as const } : r)),
        auditTrail: [{
          id: uid(), time: now(), agent: 'Human',
          action: `Modified recommendation ${action.id}`,
          detail: `Modified by ${action.by}: \"${action.newAction}\"`,
          confidence: 100, risk: 'Low' as const,
          approved: true, approvedBy: action.by,
        }, ...state.auditTrail].slice(0, 100),
      };

    case 'ALLOCATE_BED':
      return {
        ...state,
        beds: state.beds.map((b) => (b.id === action.bedId ? { ...b, status: 'Occupied' as const, patient: action.patientId } : b)),
        auditTrail: [{
          id: uid(), time: now(), agent: 'Bed Agent',
          action: `Bed ${action.bedId} allocated to patient ${action.patientId}`,
          detail: 'Backend bed allocation confirmed',
          confidence: 91, risk: 'High' as const,
          approved: true, approvedBy: 'System',
          patientId: action.patientId,
        }, ...state.auditTrail].slice(0, 100),
      };

    case 'ASSIGN_DOCTOR':
      return {
        ...state,
        doctors: state.doctors.map((d) =>
          d.id === action.doctorId ? { ...d, patients: d.patients + 1, workload: Math.min(100, d.workload + 8) } : d
        ),
        auditTrail: [{
          id: uid(), time: now(), agent: 'Doctor Agent',
          action: `Doctor ${action.doctorId} assigned to patient ${action.patientId}`,
          detail: 'Backend doctor assignment confirmed',
          confidence: 88, risk: 'High' as const,
          approved: true, approvedBy: 'System',
          patientId: action.patientId,
        }, ...state.auditTrail].slice(0, 100),
      };

    case 'ADD_EMERGENCY':
      return {
        ...state,
        emergencyCases: [action.patient, ...state.emergencyCases],
        auditTrail: [{
          id: uid(), time: now(), agent: 'Triage Agent',
          action: `Emergency case registered: ${action.patient.name}`,
          detail: `Priority: ${action.patient.priority} — ${action.patient.symptoms}`,
          confidence: action.patient.triageConfidence,
          risk: (action.patient.priority === 'Critical' ? 'Critical' : action.patient.priority === 'High' ? 'High' : 'Moderate') as RiskLevel,
          approved: true, approvedBy: 'System',
          patientId: action.patient.id,
        }, ...state.auditTrail].slice(0, 100),
      };

    case 'UPDATE_EMERGENCY':
      return { ...state, emergencyCases: state.emergencyCases.map((e) => (e.id === action.id ? { ...e, ...action.updates } : e)) };

    case 'SET_DEMO_STEP':
      return { ...state, demoStep: action.step };
    case 'SET_DEMO_RUNNING':
      return { ...state, demoRunning: action.running };

    case 'UPDATE_MEDICINE':
      return { ...state, medicines: state.medicines.map((m) => (m.id === action.id ? { ...m, stock: Math.max(0, m.stock + action.delta) } : m)) };

    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [{ ...action.notif, id: uid(), time: now() }, ...state.notifications].slice(0, 50) };

    case 'MARK_NOTIFICATION_READ':
      return { ...state, notifications: state.notifications.map((n) => (n.id === action.id ? { ...n, read: true } : n)) };

    case 'ADD_APPOINTMENT':
      return { ...state, appointments: [{ ...action.appt, id: `APT-${uid()}` }, ...state.appointments] };

    case 'UPDATE_APPOINTMENT':
      return { ...state, appointments: state.appointments.map((a) => (a.id === action.id ? { ...a, ...action.updates } : a)) };

    case 'UPDATE_FOLLOW_UP':
      return { ...state, patientFollowUp: state.patientFollowUp.map((f) => (f.id === action.id ? { ...f, ...action.updates } : f)) };

    case 'UPDATE_DOCTOR_WORKLOAD':
      return { ...state, doctors: state.doctors.map((d) => (d.id === action.id ? { ...d, workload: Math.max(0, Math.min(100, d.workload + action.delta)) } : d)) };

    case 'UPDATE_AGENT_METRICS':
      return {
        ...state,
        agentMetrics: {
          ...state.agentMetrics,
          [action.agent]: {
            accuracy: state.agentMetrics[action.agent]?.accuracy || 90,
            actions: (state.agentMetrics[action.agent]?.actions || 0) + 1,
            success: (state.agentMetrics[action.agent]?.success || 0) + (action.success ? 1 : 0),
          },
        },
      };

    case 'DISPATCH_AMBULANCE':
      return { ...state, ambulances: state.ambulances.map((a) => (a.id === action.id ? { ...a, status: 'Dispatched', location: action.location } : a)) };

    case 'SET_DATA_SOURCE':
      return { ...state, dataSource: action.source };

    case 'SET_LIVE_DATA':
      return { ...state, ...action };

    case 'RESET':
      return makeInitialState();

    default:
      return state;
  }
}

// ─── Context ───────────────────────────────────────────────────────────────
interface HospitalContextType {
  state: HospitalState;
  dispatch: React.Dispatch<Action>;
  runTriage: (input: { name: string; age: number; gender: string; symptoms: string; vitals: EmergencyPatient['vitals'] }) => Promise<EmergencyPatient>;
  allocateBed: (patient: EmergencyPatient) => Promise<{ bedId: string; reason: string; factors: string[]; confidence: number } | null>;
  assignDoctor: (patient: EmergencyPatient) => Promise<{ doctorId: string; doctorName: string; reason: string; confidence: number } | null>;
  checkMedicine: (medicineId: string) => { risk: RiskLevel; daysLeft: number; expiryRisk: boolean; recommendation: string };
  approveRec: (id: string, by: string) => void;
  rejectRec: (id: string, by: string, reason?: string) => void;
  addNotification: (type: Notification['type'], message: string, forRole?: string) => void;
  bookAppointment: (patientId: string, patientName: string, doctorId: string, doctorName: string, date: string, time: string, type: string) => Promise<string>;
  refreshLiveData: () => Promise<void>;
}

const HospitalCtx = createContext<HospitalContextType | null>(null);

export function HospitalProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, makeInitialState());
  const [role, setRole] = useState<string | null>(() => {
    try { return JSON.parse(localStorage.getItem('hcc_user') || 'null')?.role ?? null; }
    catch { return null; }
  });

  // Track the signed-in role so staff-only endpoints are not requested for
  // patient sessions (they would just produce 403 console noise).
  useEffect(() => {
    const sync = () => {
      try { setRole(JSON.parse(localStorage.getItem('hcc_user') || 'null')?.role ?? null); }
      catch { setRole(null); }
    };
    window.addEventListener('hcc-login', sync);
    window.addEventListener('hcc-logout', sync);
    return () => {
      window.removeEventListener('hcc-login', sync);
      window.removeEventListener('hcc-logout', sync);
    };
  }, []);

  // ── Hydrate live data from backend (beds, doctors, meds, appts) ──
  const refreshLiveData = useCallback(async () => {
    const isStaff = role === 'doctor' || role === 'nurse' || role === 'admin';
    const results = await Promise.allSettled([
      hospitalApi.beds(),
      hospitalApi.doctors(),
      hospitalApi.appointments(),
      hospitalApi.medicines(),
      // Staff-only endpoints — skipped for patient sessions (would 403):
      isStaff ? hospitalApi.patients() : Promise.resolve({ patients: [] }),
      isStaff ? hospitalApi.emergencyCases() : Promise.resolve({ emergency_cases: [] }),
      isStaff ? hospitalApi.doctorPatients() : Promise.resolve({ patients: [] }),
      isStaff ? hospitalApi.icuPatients() : Promise.resolve({ icu_patients: [] }),
    ]);
    const [bedsR, doctorsR, apptsR, medsR, patientsR, emergencyR, docPatientsR, icuR] = results;
    const anyOk = results.some((r) => r.status === 'fulfilled');
    if (!anyOk) {
      if (state.dataSource !== 'demo') dispatch({ type: 'SET_DATA_SOURCE', source: 'demo' });
      return;
    }
    dispatch({ type: 'SET_DATA_SOURCE', source: 'backend' });

    const live: { beds?: BedState[]; doctors?: DoctorState[]; medicines?: MedicineState[]; appointments?: AppointmentState[]; patients?: ReturnType<typeof mapPatient>[]; emergencyCases?: EmergencyPatient[]; doctorPatients?: DoctorPatient[]; icuPatients?: IcuPatient[] } = {};
    if (bedsR.status === 'fulfilled' && bedsR.value.beds.length) {
      live.beds = bedsR.value.beds.map(mapBed);
    }
    if (doctorsR.status === 'fulfilled' && doctorsR.value.doctors.length) {
      live.doctors = doctorsR.value.doctors.map(mapDoctor);
    }
    if (apptsR.status === 'fulfilled') {
      live.appointments = apptsR.value.appointments.map(mapAppointment);
    }
    if (medsR.status === 'fulfilled' && medsR.value.medicines.length) {
      live.medicines = medsR.value.medicines.map(mapMedicine);
    }
    if (patientsR.status === 'fulfilled' && patientsR.value.patients.length) {
      live.patients = patientsR.value.patients.map(mapPatient);
    }
    // For patient sessions the staff arrays resolve empty — keep demo state
    // out of the UI by writing empty arrays instead of skipping the update.
    if (emergencyR.status === 'fulfilled') {
      live.emergencyCases = emergencyR.value.emergency_cases.map(mapEmergencyCase);
    }
    if (docPatientsR.status === 'fulfilled') {
      live.doctorPatients = mapDoctorPatients(docPatientsR.value.patients);
    }
    if (icuR.status === 'fulfilled') {
      live.icuPatients = icuR.value.icu_patients.map(mapIcuPatient);
    }
    if (Object.keys(live).length) dispatch({ type: 'SET_LIVE_DATA', ...live });
    // `role` must be a dependency: after login the role changes from null to
    // 'doctor'/'nurse'/'admin' and staff-only endpoints must start being
    // fetched. With `[]` this closure captured the pre-login role forever,
    // which left the Doctor Patients page permanently empty.
  }, [role]);

  useEffect(() => {
    const hasToken = !!localStorage.getItem('hcc_token');
    if (hasToken) {
      refreshLiveData().catch(() => { /* fallback state already demo */ });
    }
    // Listen for login/logout regardless of the token at mount time —
    // otherwise the listener would never be attached on a fresh visit.
    // Login triggers a refresh via the effect re-run below (role changes →
    // refreshLiveData identity changes), NOT here: refreshing directly here
    // would race ahead of the role state update and skip staff endpoints.
    const onAuthChange = () => {
      if (!localStorage.getItem('hcc_token')) {
        dispatch({ type: 'RESET' });
      }
    };
    window.addEventListener('hcc-login', onAuthChange);
    window.addEventListener('hcc-logout', onAuthChange);
    if (!hasToken) {
      return () => {
        window.removeEventListener('hcc-login', onAuthChange);
        window.removeEventListener('hcc-logout', onAuthChange);
      };
    }
    const interval = setInterval(() => refreshLiveData().catch(() => {}), 30000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('hcc-login', onAuthChange);
      window.removeEventListener('hcc-logout', onAuthChange);
    };
  }, [refreshLiveData, role]);

  // ── Triage Agent (backend-backed, falls back to local rules) ────────────
  const runTriage = useCallback(async (input: {
    name: string; age: number; gender: string; symptoms: string; vitals: EmergencyPatient['vitals'];
  }): Promise<EmergencyPatient> => {
    dispatch({ type: 'UPDATE_AGENT_METRICS', agent: 'Triage Agent', success: true });
    try {
      const res = await hospitalApi.triage({
        name: input.name, age: input.age, gender: input.gender,
        symptoms: input.symptoms, vitals: input.vitals,
      });
      const t = res.triage;
      const patient: EmergencyPatient = {
        id: `EP-${t.emergencyId}`,
        name: input.name || `Walk-in #${t.emergencyId}`,
        age: input.age, gender: input.gender,
        symptoms: input.symptoms, priority: t.priority === 'CRITICAL' ? 'Critical' : t.priority === 'HIGH' ? 'High' : t.priority === 'MEDIUM' ? 'Moderate' : 'Mild',
        department: t.suggestedDepartment, icu: t.icuRequired,
        bed: null, doctor: null, status: 'Triaged', workflowStage: 1,
        vitals: input.vitals, admittedAt: now(), diagnosis: t.recommendedAction,
        triageConfidence: t.confidence, emergencyId: t.emergencyId,
      };
      dispatch({ type: 'ADD_EMERGENCY', patient });
      dispatch({ type: 'ADD_AUDIT', entry: {
        agent: 'Triage Agent', action: `Patient triaged: ${patient.priority}`,
        detail: `${patient.name} — ${t.recommendedAction}. ${t.reasoning}`,
        confidence: t.confidence, risk: patient.priority === 'Critical' ? 'Critical' : patient.priority === 'High' ? 'High' : 'Moderate',
        approved: true, approvedBy: 'System', patientId: patient.id,
      } });
      if (patient.priority === 'Critical') {
        dispatch({ type: 'ADD_NOTIFICATION', notif: { type: 'critical', message: `Critical patient triaged: ${patient.name} — ${patient.department}`, read: false } });
      }
      refreshLiveData().catch(() => {});
      return patient;
    } catch {
      // Backend unavailable → local rule fallback (original logic)
      return runTriageLocal(input);
    }
  }, [refreshLiveData]);

  const runTriageLocal = useCallback((input: {
    name: string; age: number; gender: string; symptoms: string; vitals: EmergencyPatient['vitals'];
  }): EmergencyPatient => {
    const s = input.symptoms.toLowerCase();
    const hr = input.vitals.hr;
    const spo2 = input.vitals.spo2;
    const sbp = parseInt(input.vitals.bp.split('/')[0]) || 120;

    let priority: Priority = 'Mild';
    let department = 'General Medicine';
    let icu = false;
    let diagnosis = 'Under assessment';
    let confidence = 92;

    if (s.includes('cardiac') || s.includes('chest pain') || s.includes('heart') || (hr > 120 && spo2 < 92)) {
      priority = 'Critical'; department = 'Cardiology/Emergency'; icu = true; diagnosis = 'Suspected cardiac emergency'; confidence = 96;
    } else if (s.includes('head') || s.includes('brain') || s.includes('unconscious') || s.includes('skull')) {
      priority = 'Critical'; department = 'Neurosurgery'; icu = true; diagnosis = 'Head trauma / TBI'; confidence = 95;
    } else if (s.includes('trauma') || s.includes('accident') || (sbp < 90 && hr > 120)) {
      priority = 'Critical'; department = 'Emergency/Trauma'; icu = true; diagnosis = 'Polytrauma'; confidence = 97;
    } else if (s.includes('breathing') || s.includes('respiratory') || spo2 < 90) {
      priority = 'Critical'; department = 'Pulmonology/Emergency'; icu = true; diagnosis = 'Respiratory distress'; confidence = 94;
    } else if (s.includes('fracture') || s.includes('bone') || s.includes('ortho')) {
      priority = 'Moderate'; department = 'Orthopedics'; icu = false; diagnosis = 'Fracture / Orthopedic injury'; confidence = 88;
    } else if (s.includes('fever') || s.includes('infection')) {
      priority = hr > 110 ? 'High' : 'Moderate'; department = 'Internal Medicine'; icu = false; diagnosis = 'Infection / Fever'; confidence = 84;
    } else {
      priority = 'Mild'; department = 'General Medicine'; icu = false; diagnosis = 'Mild complaint'; confidence = 78;
    }

    const id = `EP-${uid()}`;
    const patient: EmergencyPatient = {
      id, name: input.name, age: input.age, gender: input.gender,
      symptoms: input.symptoms, priority, department, icu,
      bed: null, doctor: null, status: 'Triaged', workflowStage: 1,
      vitals: input.vitals, admittedAt: now(), diagnosis, triageConfidence: confidence,
    };
    dispatch({ type: 'ADD_EMERGENCY', patient });
    return patient;
  }, []);

  // ── Bed Allocation Agent ────────────────────────────────────────────────
  const allocateBed = useCallback(async (patient: EmergencyPatient) => {
    dispatch({ type: 'UPDATE_AGENT_METRICS', agent: 'Bed Agent', success: true });
    try {
      const res = await hospitalApi.bedAllocation({
        patient_id: patient.emergencyId ? patient.emergencyId : Number(patient.id.replace(/\D/g, '')) || 1,
        priority: patient.priority === 'Critical' ? 'CRITICAL' : patient.priority === 'High' ? 'HIGH' : patient.priority === 'Moderate' ? 'MEDIUM' : 'LOW',
        icu_required: patient.icu,
        emergency_id: patient.emergencyId,
      });
      const a = res.allocation;
      dispatch({ type: 'ADD_AUDIT', entry: {
        agent: 'Bed Agent', action: `Bed ${a.bed_number} recommended for ${patient.name}`,
        detail: a.reason, confidence: a.confidence,
        risk: patient.priority === 'Critical' ? 'High' : 'Moderate',
        approved: false, approvedBy: null, patientId: patient.id,
      } });
      return {
        bedId: a.bed_number,
        reason: a.reason,
        factors: a.factors || [],
        confidence: a.confidence,
        allocationId: a.allocationId,
        bed_id: a.bed_id,
      };
    } catch (err) {
      // Backend reachable but genuinely no beds → do NOT invent one
      if (err instanceof ApiError && err.status === 409) {
        dispatch({ type: 'ADD_AUDIT', entry: {
          agent: 'Bed Agent', action: `No bed available for ${patient.name}`,
          detail: 'All suitable beds are occupied/reserved — manual intervention required',
          confidence: 100, risk: 'Critical', approved: false, approvedBy: null, patientId: patient.id,
        } });
        return null;
      }
      // Network failure → local fallback: first Available bed
      const bed = state.beds.find((b) => b.status === 'Available');
      if (!bed) return null;
      dispatch({ type: 'ADD_AUDIT', entry: {
        agent: 'Bed Agent', action: `Bed ${bed.id} recommended for ${patient.name} (offline mode)`,
        detail: 'Local fallback — backend unavailable', confidence: 80,
        risk: 'Moderate', approved: false, approvedBy: null, patientId: patient.id,
      } });
      return { bedId: bed.id, reason: 'Available bed (offline fallback)', factors: ['Backend offline — basic matching'], confidence: 80 };
    }
  }, [state.beds]);

  // ── Doctor Scheduling Agent ─────────────────────────────────────────────
  const assignDoctor = useCallback(async (patient: EmergencyPatient) => {
    dispatch({ type: 'UPDATE_AGENT_METRICS', agent: 'Doctor Agent', success: true });
    try {
      const res = await hospitalApi.doctorScheduling({
        specialty_hint: patient.department.split(/[\/ ]/)[0],
        icu_required: patient.icu,
        emergency_id: patient.emergencyId,
      });
      const s = res.suggestion;
      if (!s) return null;
      const doctorState = state.doctors.find((d) => d.doctorId === s.doctor_id);
      dispatch({ type: 'ADD_AUDIT', entry: {
        agent: 'Doctor Agent', action: `${s.name} recommended for ${patient.name}`,
        detail: `Specialization: ${s.specialization}. Workload: ${s.workload_score}%. ${s.reason}`,
        confidence: s.confidence, risk: 'High',
        approved: false, approvedBy: null, patientId: patient.id,
      } });
      return { doctorId: doctorState?.id || `D-${s.doctor_id}`, doctorName: s.name, reason: s.reason, confidence: s.confidence, dbDoctorId: s.doctor_id };
    } catch {
      const doc = state.doctors.find((d) => d.status !== 'Off Duty' && d.workload < 95);
      if (!doc) return null;
      return { doctorId: doc.id, doctorName: doc.name, reason: `${doc.specialization} (offline fallback)`, confidence: 80 };
    }
  }, [state.doctors]);

  // ── Medicine check (local, from hydrated data) ──────────────────────────
  const checkMedicine = useCallback((medicineId: string) => {
    const m = state.medicines.find((x) => x.id === medicineId || x.name.toLowerCase().includes('propofol'));
    if (!m) return { risk: 'Low' as RiskLevel, daysLeft: 30, expiryRisk: false, recommendation: 'No data' };
    const daysLeft = Math.round(m.stock / m.dailyUsage);
    const expiryRisk = daysLeft > m.expiryDays;
    const risk = m.risk as RiskLevel;
    const recommendation = expiryRisk ? `${Math.round((daysLeft - m.expiryDays) * m.dailyUsage)} units may expire — prioritize usage` :
      risk === 'Critical' ? 'Emergency procurement needed immediately' :
      risk === 'High' ? 'Reorder within 48 hours' : 'Monitor stock levels';
    return { risk, daysLeft, expiryRisk, recommendation };
  }, [state.medicines]);

  // ── Approve / Reject helpers (unchanged) ────────────────────────────────
  const approveRec = useCallback((id: string, by: string) => dispatch({ type: 'APPROVE_REC', id, by }), []);
  const rejectRec = useCallback((id: string, by: string, reason?: string) => dispatch({ type: 'REJECT_REC', id, by, reason }), []);
  const addNotification = useCallback((type: Notification['type'], message: string, forRole?: string) => {
    dispatch({ type: 'ADD_NOTIFICATION', notif: { type, message, read: false, for: forRole } });
  }, []);

  // ── Book appointment (backend-backed) ───────────────────────────────────
  const bookAppointment = useCallback(async (patientId: string, patientName: string, doctorId: string, doctorName: string, date: string, time: string, apptType: string): Promise<string> => {
    try {
      const dbDoctorId = Number(doctorId.replace(/\D/g, '')) || undefined;
      // patientId is a USER id (U-xxx from AuthContext); resolve the real
      // patients.patient_id via /api/auth/me instead of naive parsing.
      let dbPatientId: number | undefined;
      const me = await api.get<{ user: BackendUser }>('/api/auth/me').catch(() => null);
      const myPatientId = me?.user?.patient?.patient_id;
      if (myPatientId) dbPatientId = myPatientId;
      else dbPatientId = Number(patientId.replace(/\D/g, '')) || undefined;
      const res = await apiPost('/api/appointments', {
        doctor_id: dbDoctorId,
        patient_id: dbPatientId,
        appointment_date: date,
        appointment_time: `${time}:00`,
        reason: apptType,
      });
      dispatch({
        type: 'ADD_APPOINTMENT',
        appt: { patientId, patientName, doctorId, doctorName, date, time, type: apptType, status: 'Scheduled' },
      });
      dispatch({ type: 'ADD_NOTIFICATION', notif: { type: 'success', message: `Appointment booked with ${doctorName} on ${date} at ${time}`, read: false } });
      refreshLiveData().catch(() => {});
      return `APT-${res.appointment_id}`;
    } catch {
      // offline fallback: local-only booking
      const id = `APT-${uid()}`;
      dispatch({ type: 'ADD_APPOINTMENT', appt: { patientId, patientName, doctorId, doctorName, date, time, type: apptType, status: 'Scheduled' } });
      dispatch({ type: 'ADD_NOTIFICATION', notif: { type: 'warning', message: `Booked locally (backend offline): ${doctorName} on ${date} ${time}`, read: false } });
      return id;
    }
  }, [refreshLiveData]);

  return (
    <HospitalCtx.Provider value={{
      state, dispatch,
      runTriage, allocateBed, assignDoctor,
      checkMedicine,
      approveRec, rejectRec, addNotification, bookAppointment,
      refreshLiveData,
    }}>
      {children}
    </HospitalCtx.Provider>
  );
}

// Small helper to avoid importing api twice in this file.
// Uses the same relative base as the vite proxy (see lib/api.ts).
async function apiPost(path: string, body: unknown): Promise<any> {
  const token = localStorage.getItem('hcc_token');
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function useHospital() {
  const ctx = useContext(HospitalCtx);
  if (!ctx) throw new Error('useHospital must be used inside HospitalProvider');
  return ctx;
}
