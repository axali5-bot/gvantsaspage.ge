import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  hint?: string;
  trend?: number | null; // % change vs previous period, null = not available
  iconVariant?: 'rose' | 'gold' | 'green' | 'blue' | 'violet' | 'stone';
}

export const KPICard = ({ label, value, icon: Icon, hint, trend, iconVariant = 'stone' }: KPICardProps) => {
  const hasTrend = trend != null;
  const isUp = hasTrend && trend > 0;
  const isDown = hasTrend && trend < 0;
  const isFlat = hasTrend && trend === 0;

  return (
    <div className="admin-card admin-card-hover p-5">
      {/* Top row: label + icon badge */}
      <div className="flex items-start justify-between mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">{label}</span>
        <div className={`admin-icon-${iconVariant}`}>
          <Icon size={16} />
        </div>
      </div>

      {/* Value — solid ink, no gradient */}
      <p className="font-display text-[1.75rem] font-light text-stone-800 leading-none truncate">{value}</p>

      {/* Hint + trend */}
      <div className="flex items-center gap-2 mt-2">
        {hint && <p className="text-[10px] text-stone-400 leading-none">{hint}</p>}
        {hasTrend && (
          <span
            className={`inline-flex items-center gap-0.5 text-[10px] font-semibold rounded-full px-1.5 py-0.5 ${
              isUp
                ? 'bg-emerald-50 text-emerald-700'
                : isDown
                ? 'bg-red-50 text-red-600'
                : 'bg-stone-100 text-stone-500'
            }`}
          >
            {isUp ? <TrendingUp size={9} /> : isDown ? <TrendingDown size={9} /> : <Minus size={9} />}
            {isFlat ? '0%' : `${isUp ? '+' : ''}${trend!.toFixed(0)}%`}
          </span>
        )}
      </div>
    </div>
  );
};
