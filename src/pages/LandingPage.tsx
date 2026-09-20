import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, ArrowRight, ArrowUpRight, Siren, BedDouble, Stethoscope,
  Pill, Ambulance, HeartPulse, BrainCircuit, ShieldCheck, CheckCircle2,
  UserRound, Server,
} from 'lucide-react';
import { ROLE_META, PRIMARY_ROLES, ROLE_ICONS, type RoleId } from '../lib/roleTheme';

/* ═══════════════════════════════════════════════════════════════
   Command Network — central AI orchestration node connected to
   hospital subsystems with subtle animated data-flow lines.
   ═══════════════════════════════════════════════════════════════ */

const NODES = [
  { id: 'triage',    label: 'Emergency Triage',  icon: Siren,       x: 78,  y: 14 },
  { id: 'beds',      label: 'Bed Allocation',    icon: BedDouble,   x: 8,   y: 26 },
  { id: 'doctors',   label: 'Doctor Scheduling', icon: Stethoscope, x: 76,  y: 50 },
  { id: 'medicine',  label: 'Medicine Inventory',icon: Pill,        x: 12,  y: 62 },
  { id: 'ambulance', label: 'Emergency Response',icon: Ambulance,   x: 66,  y: 86 },
  { id: 'monitor',   label: 'Patient Monitoring',icon: HeartPulse,  x: 42,  y: 4 },
];

/** Animated SVG mesh behind the absolutely-positioned node chips */
function NetworkMesh() {
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgb(var(--p400))" stopOpacity="0.5" />
          <stop offset="100%" stopColor="rgb(var(--p400))" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* soft core glow */}
      <circle cx="47" cy="47" r="26" fill="url(#coreGlow)" className="animate-core-pulse" style={{ transformOrigin: '47px 47px' }} />

      {/* connection lines — flow toward the core */}
      {NODES.map((n, i) => (
        <line
          key={n.id}
          x1={n.x} y1={n.y} x2="47" y2="47"
          stroke="rgb(var(--p400))"
          strokeWidth={i % 2 === 0 ? 0.32 : 0.24}
          strokeOpacity="0.55"
          className={i % 2 === 0 ? 'flow-line' : 'flow-line-reverse'}
          vectorEffect="non-scaling-stroke"
          style={{ animationDelay: `${i * 0.22}s` }}
        />
      ))}

      {/* pulse dots travelling the lines */}
      {NODES.map((n, i) => (
        <circle key={`${n.id}-pulse`} r="0.85" fill="rgb(var(--p600))" opacity="0.85">
          <animateMotion
            dur={`${3 + (i % 3)}s`}
            begin={`${i * 0.45}s`}
            repeatCount="indefinite"
            path={`M ${n.x} ${n.y} L 47 47`}
          />
        </circle>
      ))}
    </svg>
  );
}

function CommandNetwork() {
  return (
    <div className="relative w-full max-w-[560px] mx-auto aspect-[10/9] select-none" aria-label="AI command network connecting hospital systems">
      {/* orbit ring */}
      <div className="absolute inset-[8%] rounded-full border border-dashed animate-orbit-spin-slow" style={{ borderColor: 'rgb(var(--p200))' }} aria-hidden="true" />

      <NetworkMesh />

      {/* Central AI core */}
      <div
        className="absolute z-10 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
        style={{ left: '47%', top: '47%' }}
      >
        <div
          className="w-[74px] h-[74px] rounded-2xl flex items-center justify-center text-white shadow-hero relative"
          style={{ background: 'linear-gradient(140deg, rgb(var(--p500)), rgb(var(--p800)))' }}
        >
          <BrainCircuit size={30} />
          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white animate-pulse" style={{ background: 'rgb(var(--p400))' }} />
        </div>
        <div className="mt-2.5 px-3 py-1 rounded-full bg-white border shadow-card text-[10px] font-bold tracking-wider uppercase" style={{ borderColor: 'rgb(var(--p200))', color: 'rgb(var(--p700))' }}>
          AI Orchestrator
        </div>
      </div>

      {/* Subsystem nodes */}
      {NODES.map((n, i) => {
        const Icon = n.icon;
        return (
          <div
            key={n.id}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2 group animate-float-soft"
            style={{ left: `${n.x}%`, top: `${n.y}%`, animationDelay: `${i * 0.8}s` }}
          >
            <div className="flex flex-col items-center">
              <div
                className="w-11 h-11 rounded-xl bg-white border flex items-center justify-center shadow-card transition-all duration-200 group-hover:shadow-card-md group-hover:-translate-y-0.5"
                style={{ borderColor: 'rgb(var(--p200))', color: 'rgb(var(--p600))' }}
              >
                <Icon size={19} />
              </div>
              <span className="mt-1.5 px-2 py-0.5 rounded-md bg-white/90 border text-[9.5px] font-semibold text-neutral-700 whitespace-nowrap shadow-sm" style={{ borderColor: 'rgb(var(--p100))' }}>
                {n.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Count-up hook for gentle live metrics
   ═══════════════════════════════════════════════════════════════ */

function useCountUp(target: number, duration = 1200, start = true) {
  const [value, setValue] = useState(0);
  const raf = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (!start) return;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, duration, start]);
  return value;
}

function LiveMetric({ value, suffix, label, tone }: { value: number; suffix?: string; label: string; tone: 'critical' | 'warning' | 'ok' | 'primary' }) {
  const v = useCountUp(value);
  const toneCls = {
    critical: 'text-critical-500 bg-critical-50 border-critical-200',
    warning: 'text-warning-500 bg-warning-50 border-warning-200',
    ok: 'text-success-500 bg-success-50 border-success-200',
    primary: 'text-primary-600 bg-primary-50 border-primary-200',
  }[tone];
  return (
    <div className={`rounded-xl border px-4 py-3 ${toneCls}`}>
      <div className="text-2xl font-bold tabular-nums leading-none">{v}{suffix}</div>
      <div className="text-[11px] text-neutral-600 mt-1 font-medium">{label}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   AI Intelligence section data
   ═══════════════════════════════════════════════════════════════ */

const INTEL = [
  { icon: Siren,       title: 'Emergency Triage',            desc: 'AI-assisted urgency classification routes the right patient to the right care in seconds.' },
  { icon: BedDouble,   title: 'Smart Bed Allocation',        desc: 'Matches patients with the best available resource by urgency, equipment and isolation needs.' },
  { icon: Stethoscope, title: 'Doctor Coordination',         desc: 'Monitors workload and coordinates appointments, on-call cover and specialist routing.' },
  { icon: Pill,        title: 'Medicine Intelligence',       desc: 'Identifies inventory shortfalls and expiry risk before stockouts or wastage occur.' },
  { icon: Ambulance,   title: 'Emergency Response',          desc: 'Coordinates ambulance dispatch and emergency resources as one connected operation.' },
];

const FOOTPRINT = [
  { value: 8,    suffix: '',  label: 'Coordinated AI agents' },
  { value: 96,   suffix: '%', label: 'Triage accuracy (demo)' },
  { value: 42,   suffix: 's', label: 'Median response time' },
  { value: 24,   suffix: '/7',label: 'Predictive monitoring' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  const goLogin = (role?: RoleId) => {
    navigate(role ? `/login?role=${role}` : '/login');
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans overflow-x-hidden">
      {/* ══════════ NAV ══════════ */}
      <nav className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white" style={{ background: 'linear-gradient(140deg, rgb(var(--p500)), rgb(var(--p800)))' }}>
              <Activity size={17} />
            </div>
            <div className="leading-tight truncate">
              <span className="font-bold text-[15px] text-neutral-900">Smart Hospital</span>
              <span className="text-primary-600 text-[15px] font-semibold ml-1.5">Management System</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-7 text-[13px] font-medium text-neutral-600">
            <a href="#intelligence" className="hover:text-primary-700 transition-colors">Intelligence</a>
            <a href="#workspaces" className="hover:text-primary-700 transition-colors">Workspaces</a>
            <a href="#trust" className="hover:text-primary-700 transition-colors">Responsible AI</a>
          </div>
          <button onClick={() => goLogin()} className="landing-cta !px-5 !py-2.5 !text-[13px] flex-shrink-0">
            Launch Platform <ArrowRight size={15} />
          </button>
        </div>
      </nav>

      {/* ══════════ HERO ══════════ */}
      <section className="relative overflow-hidden">
        {/* ambient background */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgb(var(--p50)) 0%, #ffffff 62%)' }} />
          <div className="hero-glow w-[560px] h-[560px] -top-40 -right-32" style={{ background: 'rgb(var(--p100) / 0.8)' }} />
          <div className="hero-glow w-[420px] h-[420px] top-1/3 -left-40" style={{ background: 'rgb(var(--p50))' }} />
          <div className="absolute inset-0 opacity-[0.35]" style={{ backgroundImage: 'radial-gradient(rgb(var(--p200)) 1px, transparent 1px)', backgroundSize: '26px 26px', maskImage: 'radial-gradient(ellipse 70% 60% at 50% 35%, black, transparent)' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pt-14 lg:pt-20 pb-16 lg:pb-24 grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-8 items-center">
          {/* Left: message */}
          <div className="max-w-xl">
            <div className="landing-eyebrow mb-6">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'rgb(var(--p500))' }} />
              AI-Powered Hospital Operations
              <span className="text-neutral-400 font-semibold normal-case tracking-normal">· Demo</span>
            </div>

            <h1 className="text-4xl sm:text-5xl xl:text-[3.4rem] font-extrabold tracking-tight leading-[1.06] text-neutral-900 mb-5">
              Smart Hospital<br />
              <span className="hero-accent">Management System</span>
            </h1>

            <p className="text-lg font-bold text-neutral-800 tracking-tight mb-3">
              Smarter Care. Better Coordination. Healthier Outcomes.
            </p>
            <p className="text-[15px] leading-relaxed text-neutral-600 mb-8">
              A complete digital hospital platform — appointments, patients, beds, pharmacy and emergency
              response in one place, strengthened by AI-assisted operations intelligence with clinicians always in control.
            </p>

            {/* pipeline strip: Hospital → AI → Coordinated Response */}
            <div className="flex items-center gap-2 mb-8 text-xs font-semibold" aria-label="Hospital to AI intelligence to coordinated response">
              {['Hospital', 'AI Intelligence', 'Coordinated Response'].map((s, i, arr) => (
                <span key={s} className="flex items-center gap-2">
                  <span className={`px-3 py-1.5 rounded-lg border ${i === 1 ? 'text-white border-transparent shadow-sm' : 'bg-white text-neutral-700 border-neutral-300'}`} style={i === 1 ? { background: 'linear-gradient(135deg, rgb(var(--p500)), rgb(var(--p700)))' } : undefined}>
                    {s}
                  </span>
                  {i < arr.length - 1 && <ArrowRight size={13} className="text-primary-400" />}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3.5">
              <button onClick={() => goLogin()} className="landing-cta">
                Launch Platform <ArrowRight size={16} />
              </button>
              <a href="#intelligence" className="landing-cta-secondary">
                Explore Capabilities <ArrowUpRight size={15} />
              </a>
            </div>

            <p className="mt-5 text-[11px] text-neutral-500 flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-primary-500" />
              Decision-support only — qualified professionals make every clinical call.
            </p>
          </div>

          {/* Right: visual */}
          <div className="relative">
            <CommandNetwork />
          </div>
        </div>

        {/* live metrics band */}
        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pb-14">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 bg-white/70 backdrop-blur rounded-2xl border border-neutral-200 shadow-panel p-4">
            <LiveMetric value={7}  label="Active emergencies (sim)" tone="critical" />
            <LiveMetric value={78} suffix="%" label="ICU capacity (sim)" tone="warning" />
            <LiveMetric value={12} label="Beds available (sim)" tone="ok" />
            <LiveMetric value={8}  label="AI agents coordinating" tone="primary" />
          </div>
        </div>
      </section>

      {/* ══════════ AI INTELLIGENCE ══════════ */}
      <section id="intelligence" className="py-20 px-5 sm:px-8 bg-white scroll-mt-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="landing-eyebrow mb-5">Core Intelligence</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 mb-4">
              AI-Powered Hospital Intelligence
            </h2>
            <p className="text-[15px] text-neutral-600 leading-relaxed">
              Eight specialized agents sense, predict and coordinate — one shared operational picture for the whole hospital.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {INTEL.map(item => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="intel-card group">
                  <div className="relative z-10">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-colors duration-200 group-hover:text-white" style={{ background: 'rgb(var(--p50))', color: 'rgb(var(--p600))' }}>
                      <Icon size={20} />
                    </div>
                    <h3 className="text-[15px] font-bold text-neutral-900 mb-1.5">{item.title}</h3>
                    <p className="text-[13px] leading-relaxed text-neutral-600">{item.desc}</p>
                    <div className="mt-4 flex items-center gap-1.5 text-[12px] font-bold opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0" style={{ color: 'rgb(var(--p600))' }}>
                      See it in the demo <ArrowRight size={13} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* footprint strip */}
          <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-3xl mx-auto text-center">
            {FOOTPRINT.map(f => (
              <div key={f.label}>
                <div className="text-3xl font-extrabold tracking-tight text-primary-700 tabular-nums">{f.value}{f.suffix}</div>
                <div className="text-[11px] font-medium text-neutral-500 mt-1 uppercase tracking-wide">{f.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ WORKFLOW ══════════ */}
      <section className="py-20 px-5 sm:px-8 bg-neutral-100/70 scroll-mt-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="landing-eyebrow mb-5">One Connected Journey</div>
            <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 mb-4">From Arrival to Recovery</h2>
            <p className="text-[15px] text-neutral-600">Multiple AI agents coordinate a single patient journey across every department.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { icon: Siren,       step: '01', title: 'Triage',          desc: 'Urgency classified in seconds' },
              { icon: BedDouble,   step: '02', title: 'Bed Allocation',  desc: 'Right resource, right away' },
              { icon: Stethoscope, step: '03', title: 'Doctor Match',    desc: 'Specialist balanced by workload' },
              { icon: Pill,        step: '04', title: 'Meds',            desc: 'Shortages predicted ahead' },
              { icon: HeartPulse,  step: '05', title: 'Recovery',        desc: 'Follow-up deviations detected' },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={s.step} className="relative bg-white rounded-2xl border border-neutral-200 p-5 shadow-card hover:shadow-card-md hover:-translate-y-1 transition-all duration-200">
                  <span className="absolute top-4 right-4 text-[11px] font-bold tabular-nums" style={{ color: 'rgb(var(--p300))' }}>{s.step}</span>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: 'rgb(var(--p50))', color: 'rgb(var(--p600))' }}>
                    <Icon size={18} />
                  </div>
                  <h3 className="text-sm font-bold text-neutral-900 mb-1">{s.title}</h3>
                  <p className="text-xs text-neutral-600 leading-relaxed">{s.desc}</p>
                  {i < 4 && (
                    <span className="hidden lg:block absolute top-1/2 -right-[13px] w-[26px] h-px" style={{ background: 'linear-gradient(90deg, rgb(var(--p200)), rgb(var(--p300)))' }} aria-hidden="true" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════ ROLE ENTRY ══════════ */}
      <section id="workspaces" className="py-20 px-5 sm:px-8 scroll-mt-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="landing-eyebrow mb-5">Personalized Access</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 mb-4">Enter Your Hospital Workspace</h2>
            <p className="text-[15px] text-neutral-600">Every role gets its own royal theme and a workspace tuned to its mission.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PRIMARY_ROLES.map(roleId => {
              const meta = ROLE_META[roleId];
              const v = meta.visual;
              const RoleIcon = ROLE_ICONS[roleId];
              return (
                <button
                  key={roleId}
                  onClick={() => goLogin(roleId)}
                  className="role-entry group"
                  style={{ ...v.vars, borderColor: 'rgb(var(--rc-border))' }}
                >
                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white mb-4" style={{ background: v.btnGradient }}>
                      <RoleIcon size={22} />
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.14em] mb-1" style={{ color: v.chipColor }}>{v.identity}</div>
                    <h3 className="text-lg font-bold text-neutral-900 mb-1.5">{meta.label}</h3>
                    <p className="text-[13px] text-neutral-600 leading-relaxed mb-4">{meta.desc}</p>
                    <span className="inline-flex items-center gap-1.5 text-[13px] font-bold" style={{ color: v.chipColor }}>
                      Continue as {meta.shortLabel}
                      <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-1" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════ RESPONSIBLE AI ══════════ */}
      <section id="trust" className="py-20 px-5 sm:px-8 bg-neutral-100/70 scroll-mt-16">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-panel p-8 sm:p-12">
            <div className="grid lg:grid-cols-[1fr_1.2fr] gap-10 items-center">
              <div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'rgb(var(--p50))', color: 'rgb(var(--p600))' }}>
                  <ShieldCheck size={24} />
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 mb-3">Responsible AI, Always Supervised</h2>
                <p className="text-[15px] text-neutral-600 leading-relaxed">
                  Every AI recommendation is decision-support. Qualified medical professionals review, approve or modify each action — with a complete audit trail behind every decision.
                </p>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {['Decision-support only', 'Human approval required', 'Full audit trail', 'Explainable outputs'].map(item => (
                  <div key={item} className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-100/60 px-4 py-3.5">
                    <CheckCircle2 size={17} className="flex-shrink-0" style={{ color: 'rgb(var(--p500))' }} />
                    <span className="text-[13px] font-semibold text-neutral-800">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ FINAL CTA ══════════ */}
      <section className="relative overflow-hidden py-20 px-5 sm:px-8">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(150deg, rgb(var(--p800)), rgb(var(--p600)))' }} aria-hidden="true" />
        <div className="login-brand-dotgrid absolute inset-0 opacity-25" aria-hidden="true" />
        <div className="hero-glow w-96 h-96 -top-24 left-1/4" style={{ background: 'rgb(var(--p300) / 0.4)' }} aria-hidden="true" />
        <div className="relative max-w-2xl mx-auto text-center text-white">
          <Server size={28} className="mx-auto mb-5 opacity-80" />
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">Step Inside Your Hospital Platform</h2>
          <p className="text-[15px] text-white/75 mb-8 leading-relaxed">
            Sign in as any role to explore appointment management, resource coordination and AI-assisted operations intelligence — running on synthetic demo data.
          </p>
          <button onClick={() => goLogin()} className="inline-flex items-center gap-2.5 rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-neutral-900 shadow-hero transition-transform hover:-translate-y-0.5">
            Launch Platform <ArrowRight size={16} />
          </button>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-[11px] text-white/60">
            {['Doctor', 'Patient', 'Administrator', 'Nurse'].map(r => (
              <button key={r} onClick={() => goLogin(r.toLowerCase() as RoleId)} className="hover:text-white transition-colors underline-offset-4 hover:underline">
                {r}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer className="bg-neutral-900 py-8 px-5 sm:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgb(var(--p600))' }}>
              <Activity size={14} className="text-white" />
            </div>
            <span className="text-xs font-semibold text-neutral-300">Smart Hospital Management System</span>
          </div>
          <p className="text-[11px] text-neutral-500 text-center">⚠️ Demonstration system · All data synthetic · AI outputs are decision-support only</p>
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
            <UserRound size={12} /> Built for care teams
          </div>
        </div>
      </footer>
    </div>
  );
}
