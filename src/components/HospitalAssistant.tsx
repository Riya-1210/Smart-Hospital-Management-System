import { useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Send, Sparkles, Siren } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useHospital } from '../contexts/HospitalContext';
import { HOSPITAL_INFO, FAQS } from '../data/hospitalInfo';
import { getRoleLabel } from '../lib/roleTheme';

interface Message {
  id: number;
  from: 'user' | 'bot';
  text: string;
}

/* ── Role-aware, permission-respecting data helpers ─────────────── */

function useAssistantData() {
  const { user } = useAuth();
  const { state } = useHospital();

  const role = user?.role || 'admin';

  /** Identity of the signed-in user (used to filter their own records) */
  const userId = user?.id || '';
  const userName = user?.name || '';

  const roleAwareFooter =
    role === 'patient'
      ? 'You can manage everything from your patient dashboard — Appointments, Prescriptions and Recovery.'
      : role === 'doctor'
        ? 'Your Appointments and Patients pages always show the live, authoritative list.'
        : 'Dashboards show the live operational picture for your role.';

  return {
    role,
    roleLabel: getRoleLabel(role),
    userId,
    userName,
    roleAwareFooter,
    state,
  };
}

type AssistantData = ReturnType<typeof useAssistantData>;

/* ── Intent resolution ───────────────────────────────────────────── */

const EMERGENCY_PATTERN = /(chest pain|heart attack|stroke|unconscious|not breathing|severe bleeding|suicide|overdose|seizure|convulsion|paralysis|breathlessness|can ?'?t breathe|critical condition)/i;

interface Resolved {
  text: string;
  kind: 'emergency' | 'medical' | 'normal';
}

function resolveMessage(raw: string, data: AssistantData): Resolved {
  const q = raw.toLowerCase().trim();
  const i = HOSPITAL_INFO;

  // 1. Emergency — always takes priority
  if (EMERGENCY_PATTERN.test(q)) {
    return {
      kind: 'emergency',
      text:
        `🚨 This may be an emergency.\n\nPlease contact the hospital Emergency Department or local emergency services IMMEDIATELY.\n\n` +
        `• Emergency: ${i.contact.emergencyPhone}\n• Ambulance: ${i.contact.ambulance}\n\n` +
        `Do not rely on this chatbot for emergency diagnosis or treatment.`,
    };
  }

  // 2. Medical-safety catch: diagnosis / prescription requests
  if (/(diagnos|what disease|which disease|do i have|is it serious|prescri|dosage|dose of|medicine for|tablet for|treatment for|cure for)/.test(q)) {
    return {
      kind: 'medical',
      text:
        `I'm an information assistant, not a doctor — I can't diagnose conditions or recommend medicines or dosages.\n\n` +
        `For any symptom, please consult a qualified doctor. You can book an OPD consultation during ${i.timings.opd}, ` +
        `or visit the Emergency Department if urgent (open ${i.timings.emergency.toLowerCase()}).\n\n` +
        `I can help with appointments, timings, departments, visiting hours and facilities — just ask.`,
    };
  }

  // 3. Role-aware: my appointments
  if (/(my appointment|mera appointment|my booking|my schedule|mere appointment|my patients)/.test(q)) {
    if (data.role === 'patient') {
      const appts = data.state.appointments.filter(a => a.patientId === data.userId);
      return {
        kind: 'normal',
        text: appts.length
          ? `You currently have ${appts.length} appointment(s) in the system. Open the Appointments page from your dashboard for dates, times and status.`
          : `You have no upcoming appointments. Open the Appointments page from your patient dashboard to book one.`,
      };
    }
    if (data.role === 'doctor') {
      const appts = data.state.appointments.filter(a => a.doctorName === data.userName);
      return {
        kind: 'normal',
        text: appts.length
          ? `You have ${appts.length} appointment(s) scheduled. Open the Appointments page from your dashboard for the full list.`
          : `No appointments scheduled right now. New bookings appear on your dashboard automatically.`,
      };
    }
    return {
      kind: 'normal',
      text: `Appointments are visible on each user's own dashboard. ${data.roleAwareFooter}`,
    };
  }

  // 4. Score-based FAQ matching (handles Hinglish / paraphrases)
  let best: { entry: (typeof FAQS)[number]; score: number } | null = null;
  for (const entry of FAQS) {
    let score = 0;
    for (const kw of entry.keywords) {
      if (q.includes(kw)) score += kw.includes(' ') ? 3 : 2;
    }
    if (score > 0 && (!best || score > best.score)) best = { entry, score };
  }
  if (best) {
    return { kind: 'normal', text: best.entry.answer(i) };
  }

  // 5. Department-specific follow-ups
  const dept = i.departments.find(d => q.includes(d.name.toLowerCase().split(/[ &]/)[0]) && d.name !== 'Pharmacy' && d.name !== 'Emergency Medicine');
  if (dept) {
    return {
      kind: 'normal',
      text: `${dept.name} — ${dept.desc}\n\nOPD hours: ${i.timings.opd}. To consult, book an appointment from the Appointments page and choose a ${dept.name} specialist.`,
    };
  }

  // 6. Fallback
  return {
    kind: 'normal',
    text:
      `I'm not sure about that — I can help with hospital timings, appointments, departments, visiting hours, pharmacy, documents and contact details.\n\n` +
      `Try one of the suggested questions below, or call reception at ${i.contact.phone}.\n\n` +
      `⚠️ For any medical concern, please consult a qualified doctor.`,
  };
}

/* ── Component ───────────────────────────────────────────────────── */

const SUGGESTED = [
  'How can I book an appointment?',
  'What are the hospital timings?',
  'Which departments are available?',
  'Where is the pharmacy?',
  'How do I contact the hospital?',
  'What are the visiting hours?',
];

export default function HospitalAssistant() {
  const { user } = useAuth();
  const data = useAssistantData();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const msgId = useRef(0);

  // Reset the conversation when the signed-in user changes
  useEffect(() => {
    setMessages([]);
    setOpen(false);
  }, [user?.id]);

  // Greeting on first open
  useEffect(() => {
    if (open && messages.length === 0) {
      const name = user?.name?.split(' ')[0];
      setMessages([{
        id: msgId.current++,
        from: 'bot',
        text:
          `Hello${name ? `, ${name}` : ''}! I'm the Hospital Assistant.\n\n` +
          `I can help with hospital timings, appointments, departments, visiting hours, pharmacy and more.\n\n` +
          `⚠️ I'm an information assistant only — for medical concerns, please consult a qualified doctor, and contact emergency services for urgent situations.`,
      }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typing]);

  const send = (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || typing) return;
    setMessages(m => [...m, { id: msgId.current++, from: 'user', text }]);
    setInput('');
    setTyping(true);
    const resolved = resolveMessage(text, data);
    const delay = resolved.kind === 'emergency' ? 350 : 650;
    window.setTimeout(() => {
      setMessages(m => [...m, { id: msgId.current++, from: 'bot', text: resolved.text }]);
      setTyping(false);
    }, delay);
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open Hospital Assistant"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-full pl-4 pr-5 py-3.5 text-white shadow-hero transition-transform hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(140deg, rgb(var(--p500)), rgb(var(--p800)))' }}
        >
          <MessageCircle size={19} />
          <span className="text-[13px] font-bold hidden sm:inline">Hospital Assistant</span>
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-success-400 border-2 border-white animate-pulse" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-5 right-5 z-50 w-[min(92vw,390px)] rounded-2xl bg-white shadow-hero border border-neutral-200 flex flex-col overflow-hidden chatbot-panel"
          style={{ height: 'min(600px, calc(100vh - 40px))' }}
          role="dialog"
          aria-label="Hospital Assistant chat"
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3.5 text-white flex-shrink-0"
            style={{ background: 'linear-gradient(140deg, rgb(var(--p600)), rgb(var(--p800)))' }}
          >
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
              <Sparkles size={17} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold leading-tight">Hospital Assistant</div>
              <div className="text-[10px] text-white/70">{data.roleLabel} view · Information assistant</div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors flex-shrink-0"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-neutral-100/60">
            {messages.map(m => (
              <div key={m.id} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-line rounded-2xl ${
                    m.from === 'user'
                      ? 'bg-primary-600 text-white rounded-br-md'
                      : 'bg-white text-neutral-800 border border-neutral-200 rounded-bl-md shadow-sm'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="bg-white border border-neutral-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map(d => (
                      <span
                        key={d}
                        className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-bounce"
                        style={{ animationDelay: `${d * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Emergency strip */}
          <div className="px-4 py-2 bg-critical-50 border-t border-critical-100 flex items-center gap-2 flex-shrink-0">
            <Siren size={12} className="text-critical-500 flex-shrink-0" />
            <span className="text-[10px] text-critical-600 font-medium">
              Emergency? Call {HOSPITAL_INFO.contact.emergencyPhone} — do not use this chat.
            </span>
          </div>

          {/* Suggested questions early in the conversation */}
          {messages.length <= 2 && !typing && (
            <div className="px-4 pt-2.5 pb-1 flex flex-wrap gap-1.5 flex-shrink-0 bg-white border-t border-neutral-200">
              {SUGGESTED.map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-[11px] font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-full px-2.5 py-1.5 transition-colors text-left"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 bg-white flex items-center gap-2 border-t border-neutral-200 flex-shrink-0">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') send(); }}
              placeholder="Ask about timings, appointments…"
              className="flex-1 bg-neutral-100 border border-neutral-200 rounded-xl px-3.5 py-2.5 text-[13px] focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/15"
              aria-label="Message"
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || typing}
              aria-label="Send message"
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-opacity disabled:opacity-40 flex-shrink-0"
              style={{ background: 'rgb(var(--p600))' }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
