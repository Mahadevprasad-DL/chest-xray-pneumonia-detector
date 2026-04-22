import type { Severity } from '../types';

interface Props {
  severity: Severity | string | null | undefined;
  size?: 'sm' | 'md' | 'lg';
}

const config: Record<Severity, { label: string; classes: string }> = {
  low: { label: 'Low Risk', classes: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  moderate: { label: 'Moderate Risk', classes: 'bg-amber-100 text-amber-800 border-amber-200' },
  high: { label: 'High Risk', classes: 'bg-orange-100 text-orange-800 border-orange-200' },
  critical: { label: 'Critical', classes: 'bg-red-100 text-red-800 border-red-200' },
};

const sizes = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
};

function normalizeSeverity(value: Props['severity']): Severity {
  const normalized = String(value ?? '').trim().toLowerCase();

  if (normalized === 'moderate' || normalized === 'medium') return 'moderate';
  if (normalized === 'high') return 'high';
  if (normalized === 'critical') return 'critical';
  return 'low';
}

export default function SeverityBadge({ severity, size = 'md' }: Props) {
  const safeSeverity = normalizeSeverity(severity);
  const { label, classes } = config[safeSeverity];
  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full border ${classes} ${sizes[size]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        safeSeverity === 'low' ? 'bg-emerald-500' :
        safeSeverity === 'moderate' ? 'bg-amber-500' :
        safeSeverity === 'high' ? 'bg-orange-500' : 'bg-red-500'
      }`} />
      {label}
    </span>
  );
}
