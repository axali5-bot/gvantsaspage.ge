import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { ProfitPerDayPoint } from '@/hooks/useProfitability';

// Two series, one ₾ axis. Revenue keeps the brand gold used everywhere else
// (colour follows the entity); profit gets a deep emerald. Pair validated with
// the dataviz palette script: CVD ΔE 41.4 (protan worst case), contrast ≥ 3:1.
const REVENUE_LINE = '#A87F18';
const PROFIT_LINE = '#0E7A55';
const GRID = '#e1e0d9';
const AXIS_INK = '#898781';

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ProfitPerDayPoint }>;
  label?: string;
}

const ProfitTooltip = ({ active, payload, label }: TooltipProps) => {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-md border border-black/10 bg-white/95 backdrop-blur-sm px-3 py-2 shadow-lg">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
      <div className="space-y-0.5 text-sm tabular-nums">
        <p className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: REVENUE_LINE }} />
          <span className="text-muted-foreground">შემოსავალი</span>
          <span className="ml-auto font-medium">₾{Number(p.revenue).toFixed(0)}</span>
        </p>
        <p className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: PROFIT_LINE }} />
          <span className="text-muted-foreground">მოგება</span>
          <span className="ml-auto font-medium">₾{Number(p.profit).toFixed(0)}</span>
        </p>
      </div>
    </div>
  );
};

const renderLegend = () => (
  <div className="flex items-center justify-center gap-5 pt-1 text-[11px] text-muted-foreground">
    <span className="flex items-center gap-1.5">
      <span className="inline-block w-3 h-[2px] rounded" style={{ background: REVENUE_LINE }} />
      შემოსავალი
    </span>
    <span className="flex items-center gap-1.5">
      <span className="inline-block w-3 h-[2px] rounded" style={{ background: PROFIT_LINE }} />
      მოგება
    </span>
  </div>
);

interface ProfitChartProps {
  data: ProfitPerDayPoint[];
  empty: boolean;
}

export const ProfitChart = ({ data, empty }: ProfitChartProps) => {
  if (empty || data.length === 0) {
    return (
      <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">
        No orders in this range
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
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
          width={44}
          tickFormatter={(v) => `₾${v}`}
        />
        <Tooltip content={<ProfitTooltip />} cursor={{ stroke: GRID, strokeWidth: 1 }} />
        <Legend content={renderLegend} />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke={REVENUE_LINE}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: REVENUE_LINE, stroke: '#fff', strokeWidth: 2 }}
        />
        <Line
          type="monotone"
          dataKey="profit"
          stroke={PROFIT_LINE}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: PROFIT_LINE, stroke: '#fff', strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
