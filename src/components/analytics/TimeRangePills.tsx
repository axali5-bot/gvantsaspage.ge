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
  <div className="inline-flex p-1 bg-stone-100 rounded-xl gap-0.5">
    {RANGES.map((r) => (
      <button
        key={r.value}
        onClick={() => onChange(r.value)}
        className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-all duration-200 ${
          value === r.value
            ? 'bg-white text-stone-800 shadow-sm'
            : 'text-stone-500 hover:text-stone-700'
        }`}
      >
        {r.label}
      </button>
    ))}
  </div>
);
