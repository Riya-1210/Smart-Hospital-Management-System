import type React from 'react';
import { useAgents } from '../contexts/AgentContext';
import { Activity, Brain, Pill, TrendingUp, BedDouble, UserCheck, Truck, ClipboardList } from 'lucide-react';
import clsx from 'clsx';

const agentIcons: Record<string, React.ReactNode> = {
  triage:      <Activity size={13} />,
  bed:         <BedDouble size={13} />,
  doctor:      <UserCheck size={13} />,
  medicine:    <Pill size={13} />,
  crisis:      <TrendingUp size={13} />,
  orchestrator:<Brain size={13} />,
  ambulance:   <Truck size={13} />,
  followup:    <ClipboardList size={13} />,
};

const agentColors: Record<string, string> = {
  triage:       'text-critical-600  bg-critical-100  border-critical-200',
  bed:          'text-teal-600      bg-teal-100      border-teal-200',
  doctor:       'text-primary-700   bg-primary-100   border-primary-200',
  medicine:     'text-warning-600   bg-warning-100   border-warning-200',
  crisis:       'text-warning-600   bg-warning-100   border-warning-200',
  orchestrator: 'text-neutral-700   bg-neutral-200   border-neutral-300',
  ambulance:    'text-teal-600      bg-teal-100      border-teal-200',
  followup:     'text-primary-700   bg-primary-100   border-primary-200',
};

const borderColors: Record<string, string> = {
  critical: 'border-l-critical-400',
  alert:    'border-l-warning-400',
  info:     'border-l-teal-400',
  success:  'border-l-success-400',
};

export default function AgentFeed({ maxItems = 8 }: { maxItems?: number }) {
  const { events } = useAgents();
  const visible = events.slice(0, maxItems);

  return (
    <div className="space-y-2">
      {visible.length === 0 && (
        <div className="text-center py-6 text-neutral-400 text-sm">
          <Activity size={20} className="mx-auto mb-2 opacity-40" />
          Waiting for agent activity…
        </div>
      )}
      {visible.map((ev, i) => {
        const agentKey = ev.agentId.toLowerCase();
        const iconColor = agentColors[agentKey] || agentColors.orchestrator;
        const borderColor = borderColors[ev.type] || borderColors.info;
        return (
          <div key={ev.id} className={clsx('border border-neutral-200 bg-white rounded-lg py-2.5 px-3 border-l-4 shadow-card', borderColor, i === 0 && 'animate-fade-in')}>
            <div className="flex items-start gap-2.5">
              <span className={clsx('flex items-center justify-center w-6 h-6 rounded-md border flex-shrink-0 mt-0.5', iconColor)}>
                {agentIcons[agentKey] || <Brain size={12} />}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-neutral-700 uppercase tracking-wide">{ev.agentName}</span>
                  <span className="text-[10px] text-neutral-400 font-mono">{ev.time}</span>
                </div>
                <p className="text-sm text-neutral-800 mt-0.5 leading-snug">{ev.message}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
