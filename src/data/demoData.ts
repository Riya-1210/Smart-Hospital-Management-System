// ============================================================
// DEMO / SIMULATION DATA — Not real patient information
// ============================================================

export const DEMO_DISCLAIMER = "⚠️ DEMO SIMULATION DATA — All data is synthetic and for demonstration purposes only.";

// ─── Patients ───────────────────────────────────────────────
export const patients = [
  { id: "P-001", name: "Rajesh Kumar", age: 52, gender: "Male", symptoms: "Chest pain, shortness of breath", priority: "Critical", department: "Cardiology", bed: "ICU-03", doctor: "Dr. Priya Sharma", status: "Active", vitals: { bp: "180/110", hr: 118, spo2: 91, temp: 37.2, rr: 24 }, admittedAt: "2024-01-15 22:14", diagnosis: "Suspected STEMI" },
  { id: "P-002", name: "Anita Singh", age: 34, gender: "Female", symptoms: "High fever, seizure", priority: "High", department: "Neurology", bed: "ICU-07", doctor: "Dr. Arun Mehta", status: "Active", vitals: { bp: "140/90", hr: 105, spo2: 96, temp: 40.1, rr: 20 }, admittedAt: "2024-01-15 21:40", diagnosis: "Febrile seizure" },
  { id: "P-003", name: "Mohan Patel", age: 67, gender: "Male", symptoms: "Fractured femur", priority: "High", department: "Orthopedics", bed: "Gen-14", doctor: "Dr. Kiran Verma", status: "Active", vitals: { bp: "100/70", hr: 98, spo2: 97, temp: 37.0, rr: 18 }, admittedAt: "2024-01-15 20:55", diagnosis: "Femur fracture" },
  { id: "P-004", name: "Sunita Devi", age: 29, gender: "Female", symptoms: "Abdominal pain, vomiting", priority: "Moderate", department: "General Surgery", bed: "Gen-22", doctor: "Dr. Neha Joshi", status: "Active", vitals: { bp: "120/80", hr: 88, spo2: 98, temp: 37.8, rr: 16 }, admittedAt: "2024-01-15 19:30", diagnosis: "Appendicitis" },
  { id: "P-005", name: "Vikram Rao", age: 45, gender: "Male", symptoms: "Head injury, loss of consciousness", priority: "Critical", department: "Neurosurgery", bed: "ICU-01", doctor: "Dr. Arun Mehta", status: "Active", vitals: { bp: "160/100", hr: 62, spo2: 93, temp: 37.5, rr: 10 }, admittedAt: "2024-01-15 22:30", diagnosis: "TBI - Road accident" },
  { id: "P-006", name: "Kavitha Reddy", age: 61, gender: "Female", symptoms: "Diabetic crisis, weakness", priority: "Moderate", department: "Internal Medicine", bed: "Gen-08", doctor: "Dr. Suresh Pillai", status: "Active", vitals: { bp: "135/85", hr: 92, spo2: 97, temp: 36.8, rr: 17 }, admittedAt: "2024-01-15 18:00", diagnosis: "DKA" },
  { id: "P-007", name: "Arjun Nair", age: 23, gender: "Male", symptoms: "Multiple trauma - road accident", priority: "Critical", department: "Emergency", bed: "ICU-02", doctor: "Dr. Priya Sharma", status: "Active", vitals: { bp: "85/60", hr: 132, spo2: 88, temp: 36.4, rr: 28 }, admittedAt: "2024-01-15 22:35", diagnosis: "Polytrauma" },
  { id: "P-008", name: "Lakshmi Iyer", age: 38, gender: "Female", symptoms: "Pregnancy complications", priority: "High", department: "Obstetrics", bed: "ICU-09", doctor: "Dr. Meera Krishnan", status: "Active", vitals: { bp: "150/95", hr: 110, spo2: 96, temp: 37.3, rr: 22 }, admittedAt: "2024-01-15 21:15", diagnosis: "Eclampsia" },
  { id: "P-009", name: "Ravi Shankar", age: 55, gender: "Male", symptoms: "Mild fever, cough", priority: "Mild", department: "General Medicine", bed: "Gen-31", doctor: "Dr. Suresh Pillai", status: "Active", vitals: { bp: "125/82", hr: 78, spo2: 99, temp: 38.2, rr: 15 }, admittedAt: "2024-01-15 17:00", diagnosis: "Viral fever" },
  { id: "P-010", name: "Preethi Thomas", age: 42, gender: "Female", symptoms: "Road accident - discharged", priority: "Mild", department: "Orthopedics", bed: "—", doctor: "Dr. Kiran Verma", status: "Discharged", vitals: { bp: "118/76", hr: 72, spo2: 99, temp: 36.9, rr: 14 }, admittedAt: "2024-01-14 09:20", diagnosis: "Minor fractures" },
];

// ─── Beds ───────────────────────────────────────────────────
export const beds = [
  { id: "ICU-01", type: "ICU", department: "Neurosurgery", status: "Occupied", patient: "P-005", equipment: ["Ventilator", "Monitor", "IV Pump"], floor: 3 },
  { id: "ICU-02", type: "ICU", department: "Emergency", status: "Occupied", patient: "P-007", equipment: ["Ventilator", "Monitor", "Defibrillator"], floor: 3 },
  { id: "ICU-03", type: "ICU", department: "Cardiology", status: "Occupied", patient: "P-001", equipment: ["Monitor", "IV Pump", "IABP"], floor: 3 },
  { id: "ICU-04", type: "ICU", department: "General", status: "Available", patient: null, equipment: ["Ventilator", "Monitor"], floor: 3 },
  { id: "ICU-05", type: "ICU", department: "General", status: "Reserved", patient: null, equipment: ["Monitor", "IV Pump"], floor: 3 },
  { id: "ICU-06", type: "ICU", department: "General", status: "Available", patient: null, equipment: ["Ventilator", "Monitor"], floor: 3 },
  { id: "ICU-07", type: "ICU", department: "Neurology", status: "Occupied", patient: "P-002", equipment: ["EEG", "Monitor", "IV Pump"], floor: 3 },
  { id: "ICU-08", type: "ICU", department: "General", status: "Maintenance", patient: null, equipment: ["Monitor"], floor: 3 },
  { id: "ICU-09", type: "ICU", department: "Obstetrics", status: "Occupied", patient: "P-008", equipment: ["Monitor", "IV Pump", "CTG"], floor: 3 },
  { id: "ICU-10", type: "ICU", department: "General", status: "Available", patient: null, equipment: ["Ventilator", "Monitor"], floor: 3 },
  { id: "Gen-01", type: "General", department: "Internal Medicine", status: "Available", patient: null, equipment: ["Monitor"], floor: 2 },
  { id: "Gen-08", type: "General", department: "Internal Medicine", status: "Occupied", patient: "P-006", equipment: ["Monitor", "IV Pump"], floor: 2 },
  { id: "Gen-14", type: "General", department: "Orthopedics", status: "Occupied", patient: "P-003", equipment: ["Monitor", "Traction"], floor: 2 },
  { id: "Gen-22", type: "General", department: "General Surgery", status: "Occupied", patient: "P-004", equipment: ["Monitor", "IV Pump"], floor: 2 },
  { id: "Gen-31", type: "General", department: "General Medicine", status: "Occupied", patient: "P-009", equipment: ["Monitor"], floor: 2 },
  { id: "Gen-15", type: "General", department: "General", status: "Available", patient: null, equipment: ["Monitor"], floor: 2 },
  { id: "Gen-16", type: "General", department: "General", status: "Available", patient: null, equipment: ["Monitor"], floor: 2 },
  { id: "Gen-17", type: "General", department: "General", status: "Available", patient: null, equipment: ["Monitor"], floor: 2 },
  { id: "Priv-01", type: "Private", department: "General", status: "Available", patient: null, equipment: ["Monitor", "TV"], floor: 4 },
  { id: "Priv-02", type: "Private", department: "General", status: "Occupied", patient: null, equipment: ["Monitor", "TV"], floor: 4 },
  { id: "Iso-01", type: "Isolation", department: "Infectious Disease", status: "Available", patient: null, equipment: ["Monitor", "HEPA Filter"], floor: 1 },
  { id: "Iso-02", type: "Isolation", department: "Infectious Disease", status: "Available", patient: null, equipment: ["Monitor", "HEPA Filter"], floor: 1 },
];

// ─── Doctors ─────────────────────────────────────────────────
export const doctors = [
  { id: "D-001", name: "Dr. Priya Sharma", specialization: "Emergency Medicine", status: "On Duty", workload: 85, patients: 4, shift: "Night", onCall: true, experience: 12 },
  { id: "D-002", name: "Dr. Arun Mehta", specialization: "Neurology/Neurosurgery", status: "On Duty", workload: 92, patients: 3, shift: "Night", onCall: true, experience: 18 },
  { id: "D-003", name: "Dr. Kiran Verma", specialization: "Orthopedics", status: "On Duty", workload: 60, patients: 2, shift: "Night", onCall: false, experience: 10 },
  { id: "D-004", name: "Dr. Neha Joshi", specialization: "General Surgery", status: "In Surgery", workload: 95, patients: 2, shift: "Night", onCall: true, experience: 9 },
  { id: "D-005", name: "Dr. Suresh Pillai", specialization: "Internal Medicine", status: "On Duty", workload: 55, patients: 3, shift: "Night", onCall: false, experience: 22 },
  { id: "D-006", name: "Dr. Meera Krishnan", specialization: "Obstetrics & Gynecology", status: "On Duty", workload: 70, patients: 1, shift: "Night", onCall: true, experience: 14 },
  { id: "D-007", name: "Dr. Rahul Gupta", specialization: "Cardiology", status: "On Call", workload: 40, patients: 0, shift: "On Call", onCall: true, experience: 16 },
  { id: "D-008", name: "Dr. Ananya Das", specialization: "Anesthesiology", status: "In OT", workload: 90, patients: 1, shift: "Night", onCall: true, experience: 11 },
  { id: "D-009", name: "Dr. Vikash Singh", specialization: "Radiology", status: "Available", workload: 30, patients: 0, shift: "Night", onCall: false, experience: 8 },
  { id: "D-010", name: "Dr. Pooja Nair", specialization: "Pediatrics", status: "Off Duty", workload: 0, patients: 0, shift: "Day", onCall: false, experience: 7 },
];

// ─── Medicines ───────────────────────────────────────────────
export const medicines = [
  { id: "M-001", name: "Morphine 10mg/mL", category: "Analgesic", stock: 120, dailyUsage: 18, expiryDays: 45, minStock: 30, unit: "vials", risk: "Low", supplier: "MedCorp", leadTime: 3 },
  { id: "M-002", name: "Adrenaline 1mg/mL", category: "Emergency", stock: 45, dailyUsage: 8, expiryDays: 30, minStock: 20, unit: "vials", risk: "Moderate", supplier: "PharmEx", leadTime: 2 },
  { id: "M-003", name: "Ceftriaxone 1g IV", category: "Antibiotic", stock: 200, dailyUsage: 35, expiryDays: 12, minStock: 50, unit: "vials", risk: "High", supplier: "BioPharm", leadTime: 4 },
  { id: "M-004", name: "Heparin 5000 IU/mL", category: "Anticoagulant", stock: 80, dailyUsage: 15, expiryDays: 60, minStock: 25, unit: "vials", risk: "Low", supplier: "MedCorp", leadTime: 3 },
  { id: "M-005", name: "Insulin Actrapid", category: "Endocrine", stock: 60, dailyUsage: 12, expiryDays: 20, minStock: 20, unit: "vials", risk: "High", supplier: "NovoNordisk", leadTime: 5 },
  { id: "M-006", name: "Propofol 200mg/20mL", category: "Anaesthetic", stock: 30, dailyUsage: 10, expiryDays: 18, minStock: 15, unit: "vials", risk: "Critical", supplier: "PharmEx", leadTime: 2 },
  { id: "M-007", name: "Vancomycin 500mg IV", category: "Antibiotic", stock: 150, dailyUsage: 20, expiryDays: 90, minStock: 40, unit: "vials", risk: "Low", supplier: "BioPharm", leadTime: 4 },
  { id: "M-008", name: "Atropine 0.6mg/mL", category: "Emergency", stock: 35, dailyUsage: 4, expiryDays: 8, minStock: 15, unit: "vials", risk: "Critical", supplier: "MedCorp", leadTime: 3 },
  { id: "M-009", name: "Furosemide 20mg/2mL", category: "Diuretic", stock: 90, dailyUsage: 14, expiryDays: 55, minStock: 25, unit: "vials", risk: "Low", supplier: "GenMed", leadTime: 2 },
  { id: "M-010", name: "Paracetamol 1g IV", category: "Analgesic", stock: 300, dailyUsage: 45, expiryDays: 14, minStock: 60, unit: "vials", risk: "High", supplier: "GenMed", leadTime: 1 },
  { id: "M-011", name: "Midazolam 5mg/mL", category: "Sedative", stock: 25, dailyUsage: 6, expiryDays: 7, minStock: 15, unit: "vials", risk: "Critical", supplier: "PharmEx", leadTime: 3 },
  { id: "M-012", name: "Noradrenaline 4mg/4mL", category: "Vasopressor", stock: 40, dailyUsage: 8, expiryDays: 25, minStock: 15, unit: "vials", risk: "Moderate", supplier: "MedCorp", leadTime: 2 },
];

// ─── Ambulances ──────────────────────────────────────────────
export const ambulances = [
  { id: "AMB-01", type: "ALS", status: "Available", location: "Bay A", crew: ["Paramedic Ravi", "Driver Kumar"], lastService: "2024-01-14", fuel: 92 },
  { id: "AMB-02", type: "ALS", status: "Dispatched", location: "MG Road (3.2km)", crew: ["Paramedic Deepa", "Driver Anil"], lastService: "2024-01-15", fuel: 75, eta: "8 min" },
  { id: "AMB-03", type: "BLS", status: "Available", location: "Bay B", crew: ["EMT Suresh", "Driver Prakash"], lastService: "2024-01-13", fuel: 88 },
  { id: "AMB-04", type: "ALS", status: "Dispatched", location: "Highway NH-48 (7.1km)", crew: ["Paramedic Ajay", "Driver Venkat"], lastService: "2024-01-15", fuel: 65, eta: "15 min" },
  { id: "AMB-05", type: "Neonatal", status: "Available", location: "Bay C", crew: ["Paramedic Priya", "Driver Manoj"], lastService: "2024-01-12", fuel: 95 },
  { id: "AMB-06", type: "BLS", status: "Maintenance", location: "Workshop", crew: [], lastService: "2024-01-10", fuel: 40 },
];

// ─── Operation Theatres ──────────────────────────────────────
export const operationTheatres = [
  { id: "OT-1", status: "In Use", procedure: "Emergency Laparotomy", patient: "P-004", surgeon: "Dr. Neha Joshi", startTime: "22:00", estEnd: "01:30", type: "Emergency" },
  { id: "OT-2", status: "In Use", procedure: "Craniotomy", patient: "P-005", surgeon: "Dr. Arun Mehta", startTime: "22:45", estEnd: "03:00", type: "Emergency" },
  { id: "OT-3", status: "Available", procedure: null, patient: null, surgeon: null, startTime: null, estEnd: null, type: null },
  { id: "OT-4", status: "Scheduled", procedure: "Hip Replacement", patient: null, surgeon: "Dr. Kiran Verma", startTime: "08:00", estEnd: "11:00", type: "Elective" },
  { id: "OT-5", status: "Sterilizing", procedure: null, patient: null, surgeon: null, startTime: null, estEnd: null, type: null },
];

// ─── Hospital Network (Simulated) ────────────────────────────
export const hospitalNetwork = [
  { id: "H-001", name: "City General Hospital", distance: 4.2, travelTime: 12, icuBeds: 3, ventilators: 2, specialists: ["Cardiology", "Neurology"], edLoad: 65, rating: 4.2 },
  { id: "H-002", name: "Apollo Medical Centre", distance: 7.8, travelTime: 22, icuBeds: 8, ventilators: 6, specialists: ["Cardiology", "Neurology", "Trauma", "Burns"], edLoad: 45, rating: 4.8 },
  { id: "H-003", name: "St. Mary's Hospital", distance: 3.1, travelTime: 9, icuBeds: 1, ventilators: 1, specialists: ["Pediatrics", "Gynecology"], edLoad: 80, rating: 3.9 },
  { id: "H-004", name: "National Trauma Centre", distance: 12.5, travelTime: 35, icuBeds: 15, ventilators: 12, specialists: ["Trauma", "Burns", "Neurosurgery", "Orthopedics"], edLoad: 55, rating: 4.6 },
  { id: "H-005", name: "Sunrise Medical", distance: 5.5, travelTime: 16, icuBeds: 4, ventilators: 3, specialists: ["General Surgery", "Internal Medicine"], edLoad: 70, rating: 4.0 },
];

// ─── Crisis Predictions ──────────────────────────────────────
export const crisisPredictions = [
  { id: "CP-001", type: "ICU Overload", risk: "High", confidence: 87, timeToEvent: "3 hours", currentState: "82% occupancy", predicted: "98% occupancy", factors: ["3 critical admissions", "2 long-term patients", "0 discharges planned"], actions: ["Prepare HDU beds", "Expedite ICU discharges", "Alert backup team"] },
  { id: "CP-002", type: "Medicine Stockout", risk: "Critical", confidence: 91, timeToEvent: "12 hours", currentState: "Propofol 30 vials", predicted: "0 vials (stockout)", factors: ["2 emergency surgeries", "12 OT hours planned", "No reorder placed"], actions: ["Emergency procurement", "Contact supplier", "Review OT schedule"] },
  { id: "CP-004", type: "ED Congestion", risk: "Moderate", confidence: 75, timeToEvent: "6 hours", currentState: "14 patients waiting", predicted: "22 patients (bottleneck)", factors: ["Ongoing road accident", "Night shift reduced staff", "Limited bed availability"], actions: ["Activate overflow protocol", "Call additional staff", "Discharge stable patients"] },
  { id: "CP-005", type: "Doctor Overload", risk: "High", confidence: 82, timeToEvent: "2 hours", currentState: "Dr. Arun Mehta 92% workload", predicted: "120% workload (unsafe)", factors: ["TBI patient", "Ongoing craniotomy", "New head trauma cases"], actions: ["Call backup neurologist", "Redistribute cases", "Defer non-urgent consults"] },
];

// ─── AI Agents ───────────────────────────────────────────────
export const aiAgents = [
  { id: "triage", name: "Emergency Triage Agent", icon: "🚑", status: "Active", lastAction: "Critical trauma case classified — P-007", confidence: 96, actionsToday: 14 },
  { id: "bed", name: "Bed Allocation Agent", icon: "🛏️", status: "Active", lastAction: "ICU-02 allocated to P-007", confidence: 91, actionsToday: 11 },
  { id: "doctor", name: "Doctor Scheduling Agent", icon: "👨‍⚕️", status: "Active", lastAction: "Dr. Priya Sharma assigned to P-007", confidence: 88, actionsToday: 9 },
  { id: "medicine", name: "Medicine Shortage Agent", icon: "💊", status: "Alert", lastAction: "Propofol critical — 30 vials, 3 days supply", confidence: 91, actionsToday: 8 },
  { id: "followup", name: "Patient Follow-up Agent", icon: "📋", status: "Active", lastAction: "Recovery deviation detected — P-010", confidence: 84, actionsToday: 5 },
  { id: "crisis", name: "Crisis Prediction Agent", icon: "🔮", status: "Alert", lastAction: "ICU overload predicted in 3 hours", confidence: 87, actionsToday: 6 },
  { id: "orchestrator", name: "AI Orchestrator", icon: "🧠", status: "Active", lastAction: "Emergency workflow coordinated for P-007", confidence: 95, actionsToday: 22 },
];

// ─── Audit Trail ─────────────────────────────────────────────
export const auditTrail = [
  { id: "AT-1", time: "22:35", agent: "Triage Agent", action: "Critical case detected", detail: "Patient P-007 — Polytrauma, BP 85/60, HR 132, SpO2 88%", confidence: 96, risk: "Critical", approved: true, approvedBy: "Dr. Priya Sharma" },
  { id: "AT-2", time: "22:35", agent: "Orchestrator", action: "Emergency workflow initiated", detail: "Coordinating Bed, Doctor, Medicine agents", confidence: 95, risk: "Critical", approved: true, approvedBy: "System" },
  { id: "AT-3", time: "22:36", agent: "Bed Agent", action: "ICU-02 recommended", detail: "Ventilator, Monitor, Defibrillator available. Closest to ED.", confidence: 91, risk: "High", approved: true, approvedBy: "Charge Nurse" },
  { id: "AT-4", time: "22:36", agent: "Doctor Agent", action: "Dr. Priya Sharma assigned", detail: "Emergency specialist, on duty, workload 85%", confidence: 88, risk: "High", approved: true, approvedBy: "Dr. Priya Sharma" },
  { id: "AT-5", time: "22:37", agent: "Doctor Agent", action: "Dr. Priya Sharma assigned", detail: "Emergency specialist, on duty, workload 85%", confidence: 88, risk: "High", approved: true, approvedBy: "Dr. Priya Sharma" },
  { id: "AT-6", time: "22:37", agent: "Medicine Agent", action: "Emergency meds verified", detail: "Morphine, Adrenaline, Ceftriaxone — adequate stock confirmed", confidence: 92, risk: "Moderate", approved: true, approvedBy: "Pharmacist" },
  { id: "AT-7", time: "22:38", agent: "Crisis Agent", action: "ICU overload warning", detail: "Current ICU 82% — predicted 98% in 3 hours due to mass casualty event", confidence: 87, risk: "High", approved: false, approvedBy: null },
  { id: "AT-8", time: "22:39", agent: "Orchestrator", action: "Action plan generated", detail: "Full emergency protocol activated for road accident mass casualty", confidence: 95, risk: "Critical", approved: true, approvedBy: "Dr. Admin" },
  { id: "AT-9", time: "22:40", agent: "Follow-up Agent", action: "P-010 recovery deviation", detail: "Day 4: Worsening trend detected. Clinical review recommended.", confidence: 84, risk: "Moderate", approved: false, approvedBy: null },
  { id: "AT-10", time: "22:41", agent: "Triage Agent", action: "High priority case — P-002", detail: "Febrile seizure, Temp 40.1°C, active seizure episode", confidence: 94, risk: "High", approved: true, approvedBy: "Charge Nurse" },
];

// ─── AI Recommendations ──────────────────────────────────────
export const aiRecommendations = [
  {
    id: "REC-001", agent: "Bed Agent", action: "Reserve ICU-04 for anticipated admission", risk: "High", confidence: 89,
    reason: "Mass casualty event ongoing. 2 critical patients en route. ICU-04 has ventilator and monitor.",
    factors: ["2 critical patients ETA 15 min", "Road accident — 10 patients total", "ICU-04 fully equipped"],
    alternatives: ["ICU-06 (also available, farther from ED)"],
    humanApproval: true, status: "Pending", timestamp: "22:38"
  },
  {
    id: "REC-002", agent: "Medicine Agent", action: "Emergency procurement — Propofol, Midazolam, Atropine", risk: "Critical", confidence: 91,
    reason: "Propofol 3 days supply, Midazolam 4 days, Atropine 8 days. Multiple emergency OT cases.",
    factors: ["2 active OT cases", "3 potential emergency surgeries", "Lead time 2-3 days"],
    alternatives: ["Contact alternate supplier", "Reduce elective surgeries"],
    humanApproval: true, status: "Pending", timestamp: "22:40"
  },
  {
    id: "REC-003", agent: "Doctor Agent", action: "Call backup neurologist on-call", risk: "High", confidence: 82,
    reason: "Dr. Arun Mehta workload 92%. Active craniotomy + TBI case. New trauma patients en route.",
    factors: ["Dr. Mehta in active OT", "TBI patient monitoring required", "Potential new neuro cases"],
    alternatives: ["Transfer to H-002 Apollo (8 ICU available)"],
    humanApproval: true, status: "Pending", timestamp: "22:41"
  },
  {
    id: "REC-004", agent: "Crisis Agent", action: "Activate Mass Casualty Protocol", risk: "Critical", confidence: 87,
    reason: "10 trauma patients inbound. Current capacity: 2 ICU beds free. Projected breach in 3 hours.",
    factors: ["10 patients inbound", "ICU 82% occupied", "ED staff at capacity"],
    alternatives: ["Partial protocol activation", "Divert to H-004 National Trauma"],
    humanApproval: true, status: "Pending", timestamp: "22:42"
  },
];

// ─── Follow-up Patients ──────────────────────────────────────
export const followUpPatients = [
  {
    id: "FU-001", name: "Preethi Thomas", age: 42, diagnosis: "Minor fractures — Road accident",
    dischargeDate: "2024-01-14", followUpDate: "2024-01-21", doctor: "Dr. Kiran Verma",
    status: "Monitoring", recoveryTrend: ["Improving", "Improving", "Stable", "Worsening"],
    days: [1, 2, 3, 4], alert: "Recovery deviation detected", medicines: ["Diclofenac 50mg", "Calcium supplements"],
    nextCheckIn: "Today 18:00", missedAppointments: 0
  },
  {
    id: "FU-002", name: "Ramesh Gupta", age: 58, diagnosis: "Cardiac catheterization",
    dischargeDate: "2024-01-12", followUpDate: "2024-01-19", doctor: "Dr. Rahul Gupta",
    status: "On Track", recoveryTrend: ["Improving", "Improving", "Improving", "Stable"],
    days: [1, 2, 3, 4], alert: null, medicines: ["Aspirin 75mg", "Atorvastatin 40mg", "Metoprolol 25mg"],
    nextCheckIn: "2024-01-21", missedAppointments: 0
  },
  {
    id: "FU-003", name: "Meena Pillai", age: 65, diagnosis: "Appendectomy",
    dischargeDate: "2024-01-10", followUpDate: "2024-01-17", doctor: "Dr. Neha Joshi",
    status: "Missed Appointment", recoveryTrend: ["Improving", "Improving", "Stable", "Stable"],
    days: [1, 2, 3, 4], alert: "Missed follow-up appointment", medicines: ["Amoxicillin 500mg", "Pantoprazole 40mg"],
    nextCheckIn: "Overdue", missedAppointments: 1
  },
];

// ─── Knowledge Base ──────────────────────────────────────────
export const knowledgeBase = [
  {
    id: "KB-001", title: "Emergency Escalation Procedure", category: "Emergency",
    content: "1. Identify patient condition. 2. Activate appropriate emergency code. 3. Notify charge nurse and attending physician. 4. Triage team assembles within 2 minutes for critical cases. 5. Emergency coordinator notified for mass casualty events. 6. Resource allocation team activated. 7. Document all actions in EMR.",
    source: "Hospital Emergency SOP v4.2", tags: ["emergency", "escalation", "protocol"]
  },
  {
    id: "KB-002", title: "ICU Admission Workflow", category: "ICU",
    content: "ICU admission requires: 1. Physician order with justification. 2. ICU bed confirmation from charge nurse. 3. Patient transfer checklist completed. 4. Handover documentation. 5. Family notification. 6. ICU nurse assignment. Criteria: Hemodynamic instability, respiratory failure, altered consciousness, post-surgical monitoring.",
    source: "ICU Protocols Manual v3.1", tags: ["ICU", "admission", "workflow"]
  },
  {
    id: "KB-003", title: "Pharmacy Emergency Escalation", category: "Pharmacy",
    content: "Emergency drug dispensing: 1. Emergency request form from ward. 2. Pharmacist review within 15 minutes. 3. Critical drug dispensing without full documentation in life-threatening cases. 4. Post-dispensing documentation required. Stock shortage protocol: Immediate clinical pharmacy notification, alternative sourcing initiated, clinical team notified.",
    source: "Pharmacy SOP v5.1", tags: ["pharmacy", "emergency", "drug dispensing"]
  },
  {
    id: "KB-004", title: "Mass Casualty Incident (MCI) Protocol", category: "Emergency",
    content: "MCI Activation: 1. Incident commander designated. 2. Hospital emergency operations centre activated. 3. All available staff recalled. 4. Non-urgent procedures postponed. 5. Discharge of stable patients expedited. 6. Hospital network contacts activated. 7. Media spokesperson designated. Triage: START method for rapid assessment.",
    source: "Disaster Management Plan v2.3", tags: ["MCI", "mass casualty", "disaster", "protocol"]
  },
  {
    id: "KB-005", title: "Patient Transfer Protocol", category: "Transfer",
    content: "Inter-hospital transfer: 1. Stabilize patient before transfer. 2. Receiving hospital confirmation. 3. Transfer document packet: clinical summary, medications, labs. 4. Appropriate transport mode selection (ALS/BLS). 5. Paramedic escort for critical patients. 6. Continuous monitoring during transfer. 7. Receiving hospital handover.",
    source: "Transfer Guidelines v3.5", tags: ["transfer", "ambulance", "inter-hospital"]
  },
];

// ─── Simulation Scenarios ────────────────────────────────────
export const simulationScenarios = [
  { id: "S-001", name: "Major Road Accident — 10 Patients", icon: "🚨", description: "10 trauma patients arriving, 3 critical", impact: { icu: +8, medicines: -40, doctors: +5, beds: +10 } },
  { id: "S-002", name: "ICU Capacity -30%", icon: "🏥", description: "Sudden ICU bed unavailability", impact: { icu: -3, medicines: 0, doctors: 0, beds: 0 } },
  { id: "S-003", name: "3 Doctors Unavailable", icon: "👨‍⚕️", description: "Emergency staff shortage during peak", impact: { icu: 0, medicines: 0, doctors: -3, beds: 0 } },
  { id: "S-004", name: "Pharmacy Stockout — Critical Meds", icon: "💊", description: "Critical medicine inventory at zero", impact: { icu: 0, medicines: -80, doctors: 0, beds: 0 } },
  { id: "S-005", name: "Ambulance Shortage", icon: "🚑", description: "4 of 6 ambulances unavailable", impact: { icu: 0, medicines: 0, doctors: 0, beds: 0 } },
];

// ─── Dashboard Metrics ───────────────────────────────────────
export const dashboardMetrics = {
  emergencyResponseTime: { value: "4.2 min", change: "-18%", trend: "improving" },
  avgWaitingTime: { value: "12 min", change: "-33%", trend: "improving" },
  icuUtilization: { value: "82%", change: "+12%", trend: "worsening" },
  predictedShortages: { value: 5, change: "+2", trend: "worsening" },
  medicineWastageAvoided: { value: "₹1.2L", change: "+15%", trend: "improving" },
  doctorWorkloadBalance: { value: "71%", change: "-5%", trend: "moderate" },
  aiAccuracy: { value: "94.2%", change: "+2.1%", trend: "improving" },
  activeEmergencies: 7,
  pendingApprovals: 4,
  activeAgents: 8,
  bedOccupancy: 78,
};

// ─── Hourly ICU Trend ────────────────────────────────────────
export const icuTrendData = [
  { time: "18:00", occupancy: 60 }, { time: "19:00", occupancy: 65 }, { time: "20:00", occupancy: 68 },
  { time: "21:00", occupancy: 72 }, { time: "22:00", occupancy: 78 }, { time: "22:30", occupancy: 82 },
  { time: "23:00 (Pred)", occupancy: 88 }, { time: "00:00 (Pred)", occupancy: 94 }, { time: "01:00 (Pred)", occupancy: 98 },
];
