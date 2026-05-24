import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { StatusBucket } from '@/hooks/useAnalytics';

const STATUS_COLORS: Record<string, string> = {
  pending: '#eab308',
  processing: '#3b82f6',
  completed: '#22c55e',
  cancelled: '#ef4444',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  processing: 'Processing',
  completed: 'Completed',
  cancelled: 'Cancelled',
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
      <div className="w-[180px] h-[180px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={nonZero}
              cx="50%"
              cy="50%"
              outerRadius={70}
              innerRadius={40}
              dataKey="count"
              strokeWidth={2}
              stroke="hsl(var(--background))"
            >
              {nonZero.map((entry) => (
                <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, _: string, props: { payload?: StatusBucket }) => [
                `${value} (${props.payload?.percent.toFixed(1)}%)`,
                STATUS_LABELS[props.payload?.status ?? ''] ?? '',
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-col gap-2.5">
        {buckets.map((b) => (
          <div key={b.status} className="flex items-center gap-2 text-xs">
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ background: STATUS_COLORS[b.status] }}
            />
            <span className="text-muted-foreground w-20">{STATUS_LABELS[b.status]}</span>
            <span className="font-semibold tabular-nums">{b.count}</span>
            <span className="text-muted-foreground/60 tabular-nums">
              {b.percent.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
