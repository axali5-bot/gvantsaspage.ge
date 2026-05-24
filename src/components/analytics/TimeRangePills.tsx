import { TimeRange } from '@/hooks/useAnalytics';

interface TimeRangePillsProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

const RANGES: { value: TimeRange; label: string }[] = [
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
  { value: 'all', label: 'All' },
];

export const TimeRangePills = ({ value, onChange }: TimeRangePillsProps) => (
  <div className="inline-flex p-1 bg-muted rounded-sm gap-0.5">
    {RANGES.map((r) => (
      <button
        key={r.value}
        onClick={() => onChange(r.value)}
        className={`px-3 py-1.5 text-xs uppercase tracking-widest font-semibold rounded-sm transition-colors ${
          value === r.value
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        {r.label}
      </button>
    ))}
  </div>
);
