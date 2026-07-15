import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { StatusBucket } from '@/hooks/useAnalytics';

// Documented, CVD-validated status palette (never brand-themed): a status colour
// means good/warning/critical — pending waits (warning), processing is active
// (neutral blue), completed is good, cancelled is critical. Legend labels below
// carry identity too, so colour is never the only channel.
const STATUS_COLORS: Record<string, string> = {
  pending: '#fab219',    // warning
  processing: '#2a78d6', // active / neutral
  completed: '#0ca30c',  // good
  cancelled: '#d03b3b',  // critical
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  processing: 'Processing',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

interface StatusTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: StatusBucket }>;
}

const StatusTooltip = ({ active, payload }: StatusTooltipProps) => {
  if (!active || !payload?.length) return null;
  const b = payload[0].payload;
  return (
    <div className="rounded-md border border-black/10 bg-white/95 backdrop-blur-sm px-3 py-2 shadow-lg">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ background: STATUS_COLORS[b.status] }} />
        <span className="text-xs font-medium text-slate-800">{STATUS_LABELS[b.status]}</span>
      </div>
      <p className="text-[11px] text-muted-foreground tabular-nums mt-1">
        {b.count} · {b.percent.toFixed(1)}%
      </p>
    </div>
  );
};

interface StatusBreakdownProps {
  buckets: StatusBucket[];
}

export const StatusBreakdown = ({ buckets }: StatusBreakdownProps) => {
  const total = buckets.reduce((s, b) => s + b.count, 0);

  if (total === 0) {
    return (
      <div className="h-[180px] flex items-center justify-center text-sm text-muted-foreground">
        No orders
      </div>
    );
  }

  const nonZero = buckets.filter((b) => b.count > 0);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      {/* Donut with a centred total in the hole */}
      <div className="relative w-[180px] h-[180px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={nonZero}
              cx="50%"
              cy="50%"
              outerRadius={70}
              innerRadius={44}
              dataKey="count"
              strokeWidth={2}
              stroke="hsl(var(--background))"
              startAngle={90}
              endAngle={-270}
            >
              {nonZero.map((entry) => (
                <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} />
              ))}
            </Pie>
            <Tooltip content={<StatusTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="font-display text-2xl font-light leading-none text-slate-900">{total}</span>
          <span className="text-[9px] uppercase tracking-widest text-muted-foreground mt-1">orders</span>
        </div>
      </div>

      {/* Legend: colour + label + count + percent (identity never colour-alone) */}
      <div className="flex flex-col gap-2.5">
        {buckets.map((b) => (
          <div key={b.status} className="flex items-center gap-2 text-xs">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ background: STATUS_COLORS[b.status] }}
            />
            <span className="text-muted-foreground w-20">{STATUS_LABELS[b.status]}</span>
            <span className="font-semibold tabular-nums">{b.count}</span>
            <span className="text-muted-foreground/60 tabular-nums">{b.percent.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};
