import clsx from 'clsx';

type Risk = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | string;

const styles: Record<string, string> = {
  CRITICAL: 'bg-critical-100 text-critical-600 border border-critical-200',
  HIGH:     'bg-warning-100 text-warning-600 border border-warning-200',
  MEDIUM:   'bg-teal-100 text-teal-600 border border-teal-200',
  LOW:      'bg-success-100 text-success-600 border border-success-200',
};

export default function RiskBadge({ risk }: { risk: Risk }) {
  const r = String(risk).toUpperCase();
  const s = styles[r] || styles.LOW;
  return (
    <span className={clsx('inline-flex text-xs font-semibold px-2 py-0.5 rounded-full', s)}>
      {risk}
    </span>
  );
}
