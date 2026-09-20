import clsx from 'clsx';

const styles: Record<string, string> = {
  Active:      'bg-success-100 text-success-600 border border-success-200',
  Available:   'bg-success-100 text-success-600 border border-success-200',
  Online:      'bg-success-100 text-success-600 border border-success-200',
  Occupied:    'bg-warning-100 text-warning-600 border border-warning-200',
  Busy:        'bg-warning-100 text-warning-600 border border-warning-200',
  Critical:    'bg-critical-100 text-critical-600 border border-critical-200',
  Emergency:   'bg-critical-100 text-critical-600 border border-critical-200',
  Discharged:  'bg-neutral-200 text-neutral-600 border border-neutral-300',
  Inactive:    'bg-neutral-200 text-neutral-600 border border-neutral-300',
  Offline:     'bg-neutral-200 text-neutral-600 border border-neutral-300',
  Maintenance: 'bg-neutral-200 text-neutral-600 border border-neutral-300',
  Pending:     'bg-teal-100 text-teal-600 border border-teal-200',
  'On Call':   'bg-teal-100 text-teal-600 border border-teal-200',
};

export default function StatusBadge({ status }: { status: string }) {
  const s = styles[status] || styles.Inactive;
  return (
    <span className={clsx('inline-flex text-xs font-semibold px-2 py-0.5 rounded-full', s)}>
      {status}
    </span>
  );
}
