import clsx from 'clsx';

type Priority = 'Critical' | 'High' | 'Moderate' | 'Mild' | 'Low';

const styles: Record<Priority, string> = {
  Critical: 'bg-critical-100 text-critical-600 border border-critical-200',
  High:     'bg-warning-100 text-warning-600 border border-warning-200',
  Moderate: 'bg-teal-100 text-teal-600 border border-teal-200',
  Mild:     'bg-success-100 text-success-600 border border-success-200',
  Low:      'bg-success-100 text-success-600 border border-success-200',
};

const dots: Record<Priority, string> = {
  Critical: 'bg-critical-400',
  High:     'bg-warning-400',
  Moderate: 'bg-teal-400',
  Mild:     'bg-success-400',
  Low:      'bg-success-400',
};

export default function PriorityBadge({ priority }: { priority: string }) {
  const p = priority as Priority;
  const s = styles[p] || styles.Mild;
  const d = dots[p] || dots.Mild;
  return (
    <span className={clsx('inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full', s)}>
      <span className={clsx('w-1.5 h-1.5 rounded-full flex-shrink-0', d)} />
      {priority}
    </span>
  );
}
