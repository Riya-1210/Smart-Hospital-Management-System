import type React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import clsx from 'clsx';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  color?: 'default' | 'critical' | 'warning' | 'success' | 'info';
  icon?: React.ReactNode;
  onClick?: () => void;
  sublabel?: string;
}

const colorMap = {
  default:  { value: 'text-neutral-900',   bg: 'bg-white',        icon: 'text-neutral-400'   },
  critical: { value: 'text-critical-500',  bg: 'bg-critical-50',  icon: 'text-critical-500'  },
  warning:  { value: 'text-warning-500',   bg: 'bg-warning-50',   icon: 'text-warning-500'   },
  success:  { value: 'text-success-500',   bg: 'bg-success-50',   icon: 'text-success-500'   },
  info:     { value: 'text-teal-500',      bg: 'bg-teal-50',      icon: 'text-teal-500'      },
};

export default function MetricCard({
  label, value, unit, trend, trendLabel, color = 'default', icon, onClick, sublabel
}: MetricCardProps) {
  const c = colorMap[color];
  return (
    <div
      onClick={onClick}
      className={clsx(
        'card flex flex-col gap-1.5',
        onClick && 'cursor-pointer hover:border-primary-300 hover:shadow-card-md transition-all'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs text-neutral-600 font-medium leading-tight">{label}</span>
        {icon && <span className={clsx('flex-shrink-0', c.icon)}>{icon}</span>}
      </div>
      <div className={clsx('text-2xl font-bold leading-none', c.value)}>
        {value}{unit && <span className="text-sm font-medium ml-0.5 text-neutral-500">{unit}</span>}
      </div>
      {sublabel && <div className="text-xs text-neutral-600">{sublabel}</div>}
      {trend && trendLabel && (
        <div className={clsx('flex items-center gap-1 text-xs font-medium',
          trend === 'up' ? 'text-critical-500' : trend === 'down' ? 'text-success-600' : 'text-neutral-500'
        )}>
          {trend === 'up' ? <TrendingUp size={11} /> : trend === 'down' ? <TrendingDown size={11} /> : <Minus size={11} />}
          {trendLabel}
        </div>
      )}
    </div>
  );
}
