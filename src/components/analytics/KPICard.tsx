import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  hint?: string;
  trend?: number | null; // % change vs previous period, null = not available
}

export const KPICard = ({ label, value, icon: Icon, hint, trend }: KPICardProps) => {
  const hasTrend = trend != null;
  const isUp = hasTrend && trend > 0;
  const isDown = hasTrend && trend < 0;
  const isFlat = hasTrend && trend === 0;

  return (
    <div className="border border-border rounded-sm p-5 bg-background">
      <div className="flex items-start justify-between">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
        <Icon size={18} className="text-muted-foreground shrink-0" />
      </div>
      <p className="font-display text-3xl font-light text-foreground mt-2 truncate">{value}</p>
      <div className="flex items-center gap-2 mt-1">
        {hint && <p className="text-[10px] text-muted-foreground/60">{hint}</p>}
        {hasTrend && (
          <span
            className={`inline-flex items-center gap-0.5 text-[10px] font-medium rounded-full px-1.5 py-0.5 ${
              isUp
                ? 'bg-emerald-50 text-emerald-700'
                : isDown
                ? 'bg-red-50 text-red-600'
                : 'bg-muted text-muted-foreground'
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
