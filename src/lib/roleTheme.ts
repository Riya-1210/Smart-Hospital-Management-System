/**
 * roleTheme — Central role → color identity map.
 * Royal palettes: Doctor=Blue, Patient=Green, Admin=Gold, Nurse=Violet.
 * Used by the LoginPage and the LandingPage role-entry section.
 * Dashboard-side theming is handled by [data-role] CSS variables in index.css.
 */

import type { CSSProperties, ComponentType } from 'react';
import { Stethoscope, HeartPulse, ShieldCheck, ClipboardPlus } from 'lucide-react';

export type RoleId = 'admin' | 'doctor' | 'nurse' | 'patient';

export type RoleIcon = ComponentType<{ size?: number | string; className?: string }>;

/** The four hospital roles with dedicated royal themes */
export type PrimaryRoleId = 'doctor' | 'patient' | 'admin' | 'nurse';

/** Lucide icon per role — shared by LoginPage and LandingPage */
export const ROLE_ICONS: Record<RoleId, RoleIcon> = {
  doctor: Stethoscope,
  patient: HeartPulse,
  admin: ShieldCheck,
  nurse: ClipboardPlus,
};

export interface RoleVisual {
  /** Inline style custom properties consumed by role-card CSS */
  vars: CSSProperties;
  /** Solid gradient for buttons / strong accents */
  btnGradient: string;
  /** Solid color for the login CTA */
  btnColor: string;
  /** Hover color for the login CTA */
  btnHover: string;
  /** Icon color */
  iconColor: string;
  /** Label text color (contrast-safe on white) */
  labelColor: string;
  /** Small badge text color */
  chipColor: string;
  /** Short identity label, e.g. "Royal Blue" */
  identity: string;
}

interface RoleMeta {
  label: string;
  shortLabel: string;
  desc: string;
  loginEmail: string;
  icon: RoleIcon;
  /** The royal color identity this role belongs to */
  visual: RoleVisual;
}

/* ── Royal color identities ─────────────────────────────────────────── */

const ROYAL_BLUE: RoleVisual = {
  vars: {
    ['--rc' as string]: '21 74 143',
    ['--rc-strong' as string]: '17 58 116',
    ['--rc-mid' as string]: '58 112 178',
    ['--rc-soft' as string]: '219 233 248',
    ['--rc-tint' as string]: '239 245 252',
    ['--rc-border' as string]: '186 209 239',
  },
  btnGradient: 'linear-gradient(135deg, rgb(32 90 159), rgb(17 58 116))',
  btnColor: 'rgb(21 74 143)',
  btnHover: 'rgb(17 58 116)',
  iconColor: 'rgb(21 74 143)',
  labelColor: 'rgb(17 58 116)',
  chipColor: 'rgb(32 90 159)',
  identity: 'Royal Blue',
};

const ROYAL_GREEN: RoleVisual = {
  vars: {
    ['--rc' as string]: '22 87 64',
    ['--rc-strong' as string]: '18 71 53',
    ['--rc-mid' as string]: '42 132 96',
    ['--rc-soft' as string]: '213 240 227',
    ['--rc-tint' as string]: '237 248 243',
    ['--rc-border' as string]: '176 222 198',
  },
  btnGradient: 'linear-gradient(135deg, rgb(27 105 77), rgb(18 71 53))',
  btnColor: 'rgb(22 87 64)',
  btnHover: 'rgb(18 71 53)',
  iconColor: 'rgb(22 87 64)',
  labelColor: 'rgb(18 71 53)',
  chipColor: 'rgb(27 105 77)',
  identity: 'Royal Green',
};

const ROYAL_GOLD: RoleVisual = {
  vars: {
    ['--rc' as string]: '117 90 42',
    ['--rc-strong' as string]: '95 72 35',
    ['--rc-mid' as string]: '163 132 68',
    ['--rc-soft' as string]: '245 238 218',
    ['--rc-tint' as string]: '251 248 239',
    ['--rc-border' as string]: '233 220 180',
  },
  btnGradient: 'linear-gradient(135deg, rgb(138 109 51), rgb(95 72 35))',
  btnColor: 'rgb(117 90 42)',
  btnHover: 'rgb(95 72 35)',
  iconColor: 'rgb(117 90 42)',
  labelColor: 'rgb(95 72 35)',
  chipColor: 'rgb(138 109 51)',
  identity: 'Royal Gold',
};

const ROYAL_VIOLET: RoleVisual = {
  vars: {
    ['--rc' as string]: '85 58 148',
    ['--rc-strong' as string]: '70 47 123',
    ['--rc-mid' as string]: '122 93 190',
    ['--rc-soft' as string]: '233 227 247',
    ['--rc-tint' as string]: '245 242 251',
    ['--rc-border' as string]: '212 201 240',
  },
  btnGradient: 'linear-gradient(135deg, rgb(100 71 170), rgb(70 47 123))',
  btnColor: 'rgb(85 58 148)',
  btnHover: 'rgb(70 47 123)',
  iconColor: 'rgb(85 58 148)',
  labelColor: 'rgb(70 47 123)',
  chipColor: 'rgb(100 71 170)',
  identity: 'Royal Violet',
};

/* ── Role metadata ──────────────────────────────────────────────────── */

export const ROLE_META: Record<PrimaryRoleId, RoleMeta> = {
  doctor: {
    label: 'Doctor',
    shortLabel: 'Doctor',
    desc: 'Clinical command & care',
    loginEmail: 'doctor@hospital.demo',
    icon: ROLE_ICONS.doctor,
    visual: ROYAL_BLUE,
  },
  patient: {
    label: 'Patient',
    shortLabel: 'Patient',
    desc: 'Personal health portal',
    loginEmail: 'patient@hospital.demo',
    icon: ROLE_ICONS.patient,
    visual: ROYAL_GREEN,
  },
  admin: {
    label: 'Administrator',
    shortLabel: 'Admin',
    desc: 'Authority & oversight',
    loginEmail: 'admin@hospital.demo',
    icon: ROLE_ICONS.admin,
    visual: ROYAL_GOLD,
  },
  nurse: {
    label: 'Nurse',
    shortLabel: 'Nurse',
    desc: 'Bedside & response',
    loginEmail: 'nurse@hospital.demo',
    icon: ROLE_ICONS.nurse,
    visual: ROYAL_VIOLET,
  },
};

/** Order shown in role selectors */
export const PRIMARY_ROLES: PrimaryRoleId[] = ['doctor', 'patient', 'admin', 'nurse'];

export function getRoleVisual(role: RoleId | string): RoleVisual {
  const meta = ROLE_META[role as PrimaryRoleId];
  return meta ? meta.visual : ROYAL_BLUE;
}

export function getRoleLabel(role: RoleId | string): string {
  return ROLE_META[role as PrimaryRoleId]?.label || role.charAt(0).toUpperCase() + role.slice(1);
}
