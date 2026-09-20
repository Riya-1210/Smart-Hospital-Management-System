/**
 * api.ts — typed HTTP client for the Smart Hospital backend.
 * Token stored in localStorage; throws ApiError with friendly messages.
 */

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) || '';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem('hcc_token', token);
    else localStorage.removeItem('hcc_token');
  } catch { /* storage unavailable */ }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('hcc_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError(0, 'Cannot reach the hospital server. Check the backend URL and network connection.');
  }

  let body: any = null;
  try {
    body = await res.json();
  } catch { /* non-JSON */ }

  if (!res.ok) {
    // Expired/invalid token: clear the stale session so the app returns to
    // login instead of looping 401s with empty dashboards.
    if (res.status === 401 && token) {
      localStorage.removeItem('hcc_token');
      localStorage.removeItem('hcc_user');
      window.dispatchEvent(new Event('hcc-session-expired'));
    }
    throw new ApiError(res.status, body?.error || `Request failed (${res.status})`);
  }
  return body as T;
}

// ─── Types ─────────────────────────────────────────────────────────────────
export interface BackendUser {
  user_id: number;
  full_name: string;
  role: string;
  email: string;
  phone?: string | null;
  doctor?: { doctor_id: number; specialization: string; department_id: number; department: string } | null;
  patient?: { patient_id: number; date_of_birth: string | null; gender: string | null } | null;
}

export interface AgentEvent {
  log_id: number;
  agent_id: string;
  agent_name: string;
  event_type: 'info' | 'alert' | 'critical' | 'success';
  message: string;
  confidence_score: number | null;
  created_at: string;
}

export interface BedRow {
  bed_id: number;
  bed_number: string;
  bed_type: string | null;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';
  ward_name: string;
  ward_type: string | null;
  floor: number | null;
}
export interface DoctorRow {
  doctor_id: number;
  full_name: string;
  specialization: string;
  availability_status: string;
  experience_years: number;
  consultation_fee: string;
  department_name: string;
}
export interface AppointmentRow {
  appointment_id: number;
  patient_id: number;
  patient_user_id?: number;
  doctor_id: number;
  appointment_date: string;
  appointment_time: string;
  reason: string | null;
  status: string;
  patient_name: string;
  doctor_name: string;
  department_name: string;
}
export interface MedicineRow {
  medicine_id: number;
  medicine_name: string;
  category: string | null;
  quantity: number;
  unit_price: string;
  expiry_date: string | null;
  reorder_level: number;
  supplier: string | null;
  status: string;
}
export interface PatientRow {
  patient_id: number;
  full_name: string;
  email: string;
  phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
}
export interface EmergencyCaseRow {
  emergency_id: number;
  patient_id: number;
  assigned_doctor_id: number | null;
  assigned_bed_id: number | null;
  arrival_time: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  condition_description: string | null;
  status: 'OPEN' | 'IN_TREATMENT' | 'STABLE' | 'DISCHARGED';
  patient_name: string;
  gender: string | null;
  date_of_birth?: string | null;
  doctor_name: string | null;
  bed_number: string | null;
  ward_name: string | null;
}

/** One linked record from /api/doctor/patients (DB relationship row). */
export interface DoctorPatientLinkRow {
  patient_id: number;
  full_name: string;
  date_of_birth: string | null;
  gender: string | null;
  blood_group: string | null;
  phone: string | null;
  age: number | null;
  department: string | null;
  doctor_id: number | null;
  doctor_name: string | null;
  link_type: 'APPOINTMENT' | 'EMERGENCY';
  last_date: string | null;
  latest_reason: string | null;
  latest_status: string | null;
  bed_number: string | null;
  ward_name: string | null;
  ward_type: string | null;
  emergency_priority: string | null;
  emergency_status: string | null;
  emergency_id: number | null;
}

/** One ICU admission from /api/icu-patients. */
export interface IcuPatientRow {
  emergency_id: number;
  patient_id: number;
  patient_name: string;
  date_of_birth: string | null;
  age: number | null;
  gender: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: string;
  arrival_time: string;
  condition_description: string | null;
  bed_number: string | null;
  ward_name: string | null;
  ward_type: string | null;
  assigned_doctor_id: number | null;
  doctor_name: string | null;
  department: string | null;
}
export interface TriageResult {
  emergencyId: number;
  patientId: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskScore: number;
  confidence: number;
  recommendedAction: string;
  reasoning: string;
  suggestedDepartment: string;
  icuRequired: boolean;
}
export interface BedRecommendation {
  allocationId: number;
  bed_id: number;
  bed_number: string;
  ward_name: string;
  bed_type: string;
  match_score: number;
  confidence: number;
  reason: string;
  factors: string[];
}
export interface DoctorSuggestion {
  doctor_id: number;
  name: string;
  specialization: string;
  workload_score: number;
  availability_status: string;
  match_score: number;
  confidence: number;
  reason: string;
}
export interface SimulationResult {
  simulation_id: number;
  scenario_key: string;
  scenario_name: string;
  bed_demand: number; icu_demand: number;
  doctor_workload_delta: number;
  medicine_demand_units: number;
  ambulances_required: number;
  capacity_risk: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  predicted_state: Record<string, unknown>;
  recommendations: Array<{ agent: string; action: string; priority: string }>;
}

// ─── Client ────────────────────────────────────────────────────────────────
export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) }),
};

export const hospitalApi = {
  beds: () => api.get<{ beds: BedRow[] }>('/api/beds'),
  wards: () => api.get<{ wards: unknown[] }>('/api/wards'),
  doctors: () => api.get<{ doctors: DoctorRow[] }>('/api/doctors'),
  appointments: () => api.get<{ appointments: AppointmentRow[] }>('/api/appointments'),
  medicines: () => api.get<{ medicines: MedicineRow[] }>('/api/medicines'),
  equipment: () => api.get<{ equipment: unknown[] }>('/api/equipment'),
  patients: () => api.get<{ patients: PatientRow[] }>('/api/patients'),
  emergencyCases: () => api.get<{ emergency_cases: EmergencyCaseRow[] }>('/api/emergency'),
  doctorPatients: () => api.get<{ patients: DoctorPatientLinkRow[] }>('/api/doctor/patients'),
  icuPatients: () => api.get<{ icu_patients: IcuPatientRow[] }>('/api/icu-patients'),
  triage: (payload: {
    name?: string; age?: number; gender?: string;
    symptoms: string; vitals: { bp: string; hr: number; spo2: number; temp: number; rr: number };
  }) => api.post<{ triage: TriageResult }>('/api/ai/triage', payload),
  bedAllocation: (payload: { patient_id: number; priority: string; icu_required: boolean; emergency_id?: number }) =>
    api.post<{ allocation: BedRecommendation; alternatives: BedRecommendation[] }>('/api/ai/bed-allocation', payload),
  doctorScheduling: (payload: { specialty_hint?: string; icu_required?: boolean; emergency_id?: number }) =>
    api.post<{ suggestion: DoctorSuggestion | null; alternatives: DoctorSuggestion[] }>('/api/ai/doctor-scheduling', payload),
  medicinePredictions: () => api.get<{ predictions: Array<{
    medicine_id: number; medicine_name: string; current_quantity: number; estimated_daily_usage: number;
    days_remaining: number; shortage_risk: string; expiry_risk: boolean;
    recommended_reorder_quantity: number; confidence_score: number; recommendation: string;
  }> }>('/api/ai/medicine-prediction'),
  simulation: (scenario_key: string, parameters?: Record<string, unknown>) =>
    api.post<{ simulation: SimulationResult }>('/api/ai/simulations', { scenario_key, parameters }),
  simulationScenarios: () =>
    api.get<{ scenarios: Array<{ key: string; name: string; defaults: Record<string, unknown> }> }>('/api/ai/simulations/scenarios'),
  agentLogs: (limit = 25) => api.get<{ events: AgentEvent[] }>(`/api/ai/agents?limit=${limit}`),
  postAgentEvent: (payload: { agent_id: string; agent_name: string; event_type?: string; message: string; reference_type?: string; reference_id?: string; confidence_score?: number }) =>
    api.post<{ log_id: number }>('/api/ai/agents', payload),
};
