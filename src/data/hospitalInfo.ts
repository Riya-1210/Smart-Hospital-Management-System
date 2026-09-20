/**
 * hospitalInfo — Centralized hospital information configuration.
 *
 * This is the SINGLE SOURCE OF TRUTH for the Hospital Assistant chatbot
 * and any other UI that displays general hospital information.
 * Update the values below to reconfigure the chatbot's answers — no
 * component changes needed.
 *
 * Note: demo values are placeholders in line with the app's demo-data
 * environment; replace them with real hospital details when deploying.
 */

export const HOSPITAL_INFO = {
  name: 'Demo Multispecialty Hospital',
  tagline: 'Smarter Care. Better Coordination. Healthier Outcomes.',

  timings: {
    opd: 'Monday–Saturday, 9:00 AM – 5:00 PM (Sundays closed for OPD)',
    emergency: '24 hours a day, 7 days a week — the Emergency Department never closes.',
    visiting: 'General wards: 11:00 AM – 1:00 PM and 5:00 PM – 7:00 PM daily. ICU: one attendant, 12:00 PM – 12:30 PM and 6:00 PM – 6:30 PM only.',
    pharmacy: '24/7 at the ground-floor pharmacy counter (inpatient pharmacy inside the hospital runs round the clock).',
    laboratory: 'Sample collection 7:00 AM – 8:00 PM; emergency lab services available 24/7.',
  },

  contact: {
    phone: '+91 11 4000 1234 (Reception)',
    emergencyPhone: '+91 11 4000 9111 (24/7 Emergency Helpline)',
    ambulance: '108 (national) or +91 11 4000 9108 (hospital ambulance desk)',
    email: 'care@demohospital.example',
    address: 'Demo Multispecialty Hospital, Sector 12, Health Avenue, New Delhi — 110001',
    website: 'www.demohospital.example',
  },

  location: {
    summary: 'The main entrance and reception are on the ground floor. Emergency is on the ground floor (east wing, nearest to the ambulance bay). Pharmacy is next to the main reception. Laboratory sample collection is on the first floor. Ward floors are 2–4; ICU is on floor 2.',
    parking: 'Visitor parking is available in basement level B1; emergency vehicles use the ground-floor ambulance bay.',
  },

  /** Derived from the specializations actually configured in the application data */
  departments: [
    { name: 'Emergency Medicine',       desc: '24/7 emergency care, triage and trauma response.',            alwaysOpen: true },
    { name: 'Cardiology',               desc: 'Heart care, cardiac reviews and catheterization follow-up.',  alwaysOpen: false },
    { name: 'Neurology & Neurosurgery', desc: 'Brain, spine and nervous-system care.',                       alwaysOpen: false },
    { name: 'Orthopedics',              desc: 'Bone, joint and fracture care.',                              alwaysOpen: false },
    { name: 'General Surgery',          desc: 'Abdominal and general surgical procedures.',                  alwaysOpen: false },
    { name: 'Internal Medicine',        desc: 'General adult medicine, fever and infection management.',     alwaysOpen: false },
    { name: 'Obstetrics & Gynecology',  desc: 'Maternity, women\u2019s health and gynecological care.',      alwaysOpen: false },
    { name: 'Pediatrics',               desc: 'Care for infants, children and teenagers.',                   alwaysOpen: false },
    { name: 'Anesthesiology',           desc: 'Anesthesia and peri-operative support for surgeries.',        alwaysOpen: false },
    { name: 'Radiology',                desc: 'Imaging and diagnostics — X-ray, CT, MRI, ultrasound.',       alwaysOpen: false },
    { name: 'Pharmacy',                 desc: 'Inpatient and outpatient medicines — open 24/7.',             alwaysOpen: true },
  ],

  facilities: [
    '24/7 Emergency & Trauma Center',
    'ICU with ventilator-supported beds',
    '24/7 Pharmacy',
    'Ambulance service (ALS & BLS)',
    'Radiology & diagnostic imaging',
    'Digital patient portal for appointments and prescriptions',
  ],

  rules: [
    'Carry your patient ID / appointment reference for every visit.',
    'One attendant per patient is allowed in general wards; ICU visits are time-restricted.',
    'Outside food is not permitted in patient wards.',
    'Please switch mobile phones to silent near ICUs and operating theatres.',
    'Tobacco and alcohol are strictly prohibited on the hospital campus.',
  ],

  documentsForAppointment: [
    'A photo ID (Aadhaar / driving licence / passport)',
    'Previous prescriptions and medical reports, if any',
    'Recent lab or imaging reports related to your complaint',
    'Insurance card / Aarogya scheme details, if applicable',
  ],
};

/* ─────────────────────────────────────────────────────────────────
   FAQ knowledge base — intent keywords → answer.
   The chatbot scores user messages against these keyword sets, so
   natural phrasing, Hindi-English (Hinglish) and short forms all match.
   ───────────────────────────────────────────────────────────────── */

export interface FAQEntry {
  id: string;
  keywords: string[];
  answer: (info: typeof HOSPITAL_INFO) => string;
}

export const FAQS: FAQEntry[] = [
  {
    id: 'timings',
    keywords: ['timing', 'timings', 'open', 'close', 'closed', 'hours', 'kab', 'kab khulta', 'khulta', 'opening', 'closing', 'when open', 'opd time', 'schedule time', 'working hours', 'open today', 'open now'],
    answer: (i) => `Here are ${i.name}\u2019s timings:\n\n• OPD: ${i.timings.opd}\n• Emergency: ${i.timings.emergency}\n\nIs there a specific department or service you\u2019d like timings for?`,
  },
  {
    id: 'emergency',
    keywords: ['emergency', 'emergency open', 'casualty', 'urgent', 'accident', 'ambulance', '911', '108'],
    answer: (i) => `The Emergency Department is open ${i.timings.emergency}\n\nFor ambulances: ${i.contact.ambulance}.\nEmergency helpline: ${i.contact.emergencyPhone}.\n\n⚠️ If someone is critically unwell, go to the Emergency Department or call emergency services immediately — don\u2019t wait for an online reply.`,
  },
  {
    id: 'visiting',
    keywords: ['visiting', 'visit', 'meet patient', 'attendant', 'visitor', 'when can i meet', 'milne', 'mil sakta'],
    answer: () => `Visiting hours:\n\n• General wards: 11:00 AM – 1:00 PM and 5:00 PM – 7:00 PM daily\n• ICU: one attendant, 12:00 PM – 12:30 PM and 6:00 PM – 6:30 PM only\n\nPlease carry a visitor pass from the reception.`,
  },
  {
    id: 'contact',
    keywords: ['contact', 'phone', 'number', 'call', 'email', 'reach', 'helpline', 'reception'],
    answer: (i) => `You can reach us at:\n\n• Reception: ${i.contact.phone}\n• Emergency: ${i.contact.emergencyPhone}\n• Ambulance: ${i.contact.ambulance}\n• Email: ${i.contact.email}\n• Website: ${i.contact.website}`,
  },
  {
    id: 'location',
    keywords: ['location', 'address', 'where', 'directions', 'how to reach', 'kahan', 'kaha hai', 'parking'],
    answer: (i) => `Address: ${i.contact.address}\n\n${i.location.summary}\n\n${i.location.parking}`,
  },
  {
    id: 'departments',
    keywords: ['department', 'departments', 'specialty', 'specialities', 'specialist', 'available departments', 'which departments', 'konsa department'],
    answer: (i) => `The following departments are configured:\n\n${i.departments.map(d => `• ${d.name}${d.alwaysOpen ? ' (24/7)' : ''}`).join('\n')}\n\nAsk me about any department for more details.`,
  },
  {
    id: 'facilities',
    keywords: ['facility', 'facilities', 'services', 'amenities', 'icu', 'pharmacy available', 'features'],
    answer: (i) => `Key facilities at ${i.name}:\n\n${i.facilities.map(f => `• ${f}`).join('\n')}`,
  },
  {
    id: 'rules',
    keywords: ['rule', 'rules', 'policy', 'policies', 'guidelines', 'not allowed', 'prohibited'],
    answer: (i) => `General hospital rules:\n\n${i.rules.map((r, idx) => `${idx + 1}. ${r}`).join('\n')}`,
  },
  {
    id: 'book',
    keywords: ['book', 'appointment', 'appointment book', 'meet doctor', 'see doctor', 'consult', 'consultation', 'doctor milna', 'milna hai', 'dikhana', 'book kar', 'kaise book', 'schedule appointment', 'opd visit', 'register'],
    answer: (i) => `Booking an appointment is easy:\n\n1. Sign in and open the Appointments page from your dashboard\n2. Choose a doctor and department\n3. Pick a date and time slot\n4. Confirm — you\u2019ll see it under “Upcoming Appointments”\n\nOPD hours: ${i.timings.opd}. Walk-ins are also accepted in OPD hours, though booked slots are prioritised.`,
  },
  {
    id: 'cancel',
    keywords: ['cancel', 'reschedule', 'change appointment', 'postpone', 'cancel kaise', 'change timing'],
    answer: () => `To cancel or reschedule:\n\n1. Open the Appointments page from your dashboard\n2. Select the appointment\n3. Choose Cancel or pick a new slot\n\nIf it\u2019s within 24 hours of the slot, please also call reception at ${HOSPITAL_INFO.contact.phone} so the slot can be offered to another patient.`,
  },
  {
    id: 'doctor-availability',
    keywords: ['doctor available', 'availability', 'which doctor', 'who is available', 'on duty', 'on call', 'doctor list', 'kaun sa doctor', 'available now'],
    answer: () => `You can see each doctor\u2019s current status (On Duty, On Call, In Surgery) on the Doctors page of your dashboard. Duty rosters change daily — the app\u2019s doctor list is always current.`,
  },
  {
    id: 'appointment-timings',
    keywords: ['appointment time', 'slot', 'slots', 'what time is my', 'appointment duration'],
    answer: (i) => `Appointment slots are 30 minutes each, available during OPD hours: ${i.timings.opd}. Emergency care is available 24/7 regardless of slots.`,
  },
  {
    id: 'documents',
    keywords: ['document', 'documents', 'carry', 'bring', 'id proof', 'paper', 'papers', 'kya le', 'lana'],
    answer: (i) => `For your appointment, please bring:\n\n${i.documentsForAppointment.map(d => `• ${d}`).join('\n')}`,
  },
  {
    id: 'pharmacy',
    keywords: ['pharmacy', 'medicine', 'medicines', 'medical store', 'dawai', 'medicine shop', 'where pharmacy', 'medicine counter'],
    answer: (i) => `The Pharmacy is on the ground floor, right next to the main reception — open ${i.timings.pharmacy}\n\nPrescriptions issued in the hospital can be filled directly at the counter; the pharmacy team also tracks stock so essential medicines are available.`,
  },
  {
    id: 'reports',
    keywords: ['report', 'reports', 'lab report', 'test result', 'results', 'diagnostic'],
    answer: () => `Lab and imaging reports are attached to your patient record — check the Reports/Patients section of your dashboard, or collect printed copies from the Laboratory desk (first floor) with your patient ID.`,
  },
  {
    id: 'billing',
    keywords: ['bill', 'billing', 'payment', 'insurance', 'cost', 'charge', 'fees', 'cashless'],
    answer: () => `The Billing desk is on the ground floor near the main reception. It accepts cash, cards and UPI; cashless insurance is supported with major insurers — carry your insurance card and a photo ID. For billing queries, call ${HOSPITAL_INFO.contact.phone}.`,
  },
];
