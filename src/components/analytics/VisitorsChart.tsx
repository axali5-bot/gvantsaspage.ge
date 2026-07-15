import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { VisitorsPerDayPoint } from '@/hooks/useVisitors';

// Visitors get their own hue (violet) — distinct entity from revenue (gold)
// and profit (emerald). Trio validated with the dataviz palette script:
// worst-case CVD ΔE 41.4, contrast ≥ 3:1 on the light surface.
const VIOLET_LINE = '#7C4DBC';
const VIOLET_FILL = '#9D7AD1';
const GRID = '#e1e0d9';
const AXIS_INK = '#898781';

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ payload: VisitorsPerDayPoint }>;
  label?: string;
}

const VisitorsTooltip = ({ active, payload, label }: TooltipProps) => {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-md border border-black/10 bg-white/95 backdrop-blur-sm px-3 py-2 shadow-lg">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">{label}</p>
      <p className="font-display text-lg leading-none" style={{ color: VIOLET_LINE }}>
        {p.visitors} ვიზიტორი
      </p>
      <p className="text-[11px] text-muted-foreground tabular-nums mt-1">{p.visits} ვიზიტი</p>
    </div>
  );
};

interface VisitorsChartProps {
  data: VisitorsPerDayPoint[];
  empty: boolean;
}

export const VisitorsChart = ({ data, empty }: VisitorsChartProps) => {
  if (empty || data.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
        ვიზიტები ჯერ არ დაფიქსირებულა
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="visitorsViolet" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={VIOLET_FILL} stopOpacity={0.3} />
            <stop offset="100%" stopColor={VIOLET_FILL} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={GRID} strokeWidth={1} />
        <XAxis
          dataKey="date"
          stroke={AXIS_INK}
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: GRID }}
          interval="preserveStartEnd"
          minTickGap={24}
        />
        <YAxis
          stroke={AXIS_INK}
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={36}
          allowDecimals={false}
        />
        <Tooltip content={<VisitorsTooltip />} cursor={{ stroke: GRID, strokeWidth: 1 }} />
        <Area
          type="monotone"
          dataKey="visitors"
          stroke={VIOLET_LINE}
          strokeWidth={2}
          fill="url(#visitorsViolet)"
          dot={false}
          activeDot={{ r: 4, fill: VIOLET_LINE, stroke: '#fff', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};
