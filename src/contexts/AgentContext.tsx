import type React from 'react';
import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { api, type AgentEvent } from '../lib/api';

interface AgentEventUI {
  id: string;
  time: string;
  agentId: string;
  agentName: string;
  icon: string;
  message: string;
  type: 'info' | 'alert' | 'critical' | 'success';
}

interface AgentContextType {
  events: AgentEventUI[];
  addEvent: (event: Omit<AgentEventUI, 'id' | 'time'>) => void;
  clearEvents: () => void;
  source: 'backend' | 'demo';
}

const AgentContext = createContext<AgentContextType | null>(null);

const AGENT_ICONS: Record<string, string> = {
  triage: '🚑', bed: '🛏️', doctor: '👨‍⚕️', medicine: '💊',
  crisis: '🔮', orchestrator: '🧠', ambulance: '🚚', followup: '📋',
};

const AGENT_NAMES: Record<string, string> = {
  triage: 'Emergency Triage Agent',
  bed: 'Bed Allocation Agent',
  doctor: 'Doctor Scheduling Agent',
  medicine: 'Medicine Prediction Agent',
  crisis: 'Crisis Simulation Agent',
  orchestrator: 'Orchestrator Agent',
  ambulance: 'Ambulance/Transfer Agent',
  followup: 'Follow-up/Outcome Agent',
};

/** Fallback events shown ONLY when the backend is unreachable. */
const OFFLINE_SEED: Omit<AgentEventUI, 'id' | 'time'>[] = [
  { agentId: 'orchestrator', agentName: 'Orchestrator', icon: '🧠', message: 'Backend offline — showing cached agent timeline. Start the backend for live events.', type: 'alert' },
];

function fmtTime(dateLike: string | Date): string {
  const d = typeof dateLike === 'string' ? new Date(dateLike.replace(' ', 'T')) : dateLike;
  if (isNaN(d.getTime())) return new Date().toTimeString().slice(0, 8);
  return d.toTimeString().slice(0, 8);
}

export function AgentProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<AgentEventUI[]>([]);
  const [source, setSource] = useState<'backend' | 'demo'>('demo');
  const [authVersion, setAuthVersion] = useState(0); // bump on login/logout to re-arm polling
  const indexRef = useRef(0);
  const lastLogIdRef = useRef(0);

  const addEvent = (event: Omit<AgentEventUI, 'id' | 'time'>) => {
    setEvents(prev => [{ ...event, id: Math.random().toString(36).slice(2), time: fmtTime(new Date()) }, ...prev].slice(0, 50));
  };

  const clearEvents = () => setEvents([]);

  // ── Poll backend agent logs (only while authenticated — avoids 401 spam) ─
  useEffect(() => {
    let cancelled = false;
    let failures = 0;
    const hasToken = () => !!localStorage.getItem('hcc_token');

    async function poll() {
      if (!hasToken()) return;
      try {
        const res = await api.get<{ events: AgentEvent[] }>('/api/ai/agents?limit=25');
        if (cancelled) return;
        failures = 0;
        setSource('backend');
        const mapped = res.events.map(ev => ({
          id: `db-${ev.log_id}`,
          time: fmtTime(ev.created_at),
          agentId: ev.agent_id,
          agentName: ev.agent_name || AGENT_NAMES[ev.agent_id] || ev.agent_id,
          icon: AGENT_ICONS[ev.agent_id] || '🧠',
          message: ev.message,
          type: ev.event_type,
        }));
        // Track newest log id for demo-tick interleaving
        if (res.events[0]) lastLogIdRef.current = res.events[0].log_id;
        setEvents(mapped);
      } catch {
        failures++;
        if (cancelled) return;
        if (failures >= 3 && source !== 'demo') {
          setSource('demo');
          setEvents(OFFLINE_SEED.map(ev => ({ ...ev, id: Math.random().toString(36).slice(2), time: fmtTime(new Date()) })));
        }
      }
    }

    poll();
    const interval = setInterval(poll, 10000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [source, authVersion]);

  // Re-arm polling when a login happens (token now available)
  useEffect(() => {
    const onLogin = () => setAuthVersion(v => v + 1);
    window.addEventListener('hcc-login', onLogin);
    return () => window.removeEventListener('hcc-login', onLogin);
  }, []);

  // ── Offline/demo mode: keep a gentle simulated heartbeat ────────────────
  useEffect(() => {
    if (source === 'backend') return;
    const DEMO_TICKS: Omit<AgentEventUI, 'id' | 'time'>[] = [
      { agentId: 'orchestrator', agentName: 'Orchestrator', icon: '🧠', message: 'Agent coordination active — connect to the backend to see real events.', type: 'info' },
      { agentId: 'triage', agentName: 'Triage Agent', icon: '🚑', message: 'Triage engine standing by (offline preview mode).', type: 'info' },
    ];
    const tick = () => {
      const ev = DEMO_TICKS[indexRef.current % DEMO_TICKS.length];
      addEvent(ev);
      indexRef.current++;
    };
    tick();
    const interval = setInterval(tick, 30000);
    return () => clearInterval(interval);
  }, [source]);

  return (
    <AgentContext.Provider value={{ events, addEvent, clearEvents, source }}>
      {children}
    </AgentContext.Provider>
  );
}

export function useAgents() {
  const ctx = useContext(AgentContext);
  if (!ctx) throw new Error('useAgents must be used within AgentProvider');
  return ctx;
}
