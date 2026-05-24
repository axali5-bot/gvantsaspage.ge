import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { OrdersPerDayPoint } from '@/hooks/useAnalytics';

interface OrdersBarChartProps {
  data: OrdersPerDayPoint[];
  empty: boolean;
}

const tooltipFormatter = (value: number, name: string) =>
  name === 'revenue' ? [`₾${value}`, 'Revenue'] : [value, 'Orders'];

export const OrdersBarChart = ({ data, empty }: OrdersBarChartProps) => {
  if (empty || data.length === 0) {
    return (
      <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">
        No orders in this range
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
        <XAxis
          dataKey="date"
          stroke="#9ca3af"
          tick={{ fontSize: 11 }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          yAxisId="left"
          stroke="#9ca3af"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={30}
          allowDecimals={false}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          stroke="#9ca3af"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={55}
          tickFormatter={(v) => `₾${v}`}
        />
        <Tooltip formatter={tooltipFormatter} />
        <Bar
          yAxisId="left"
          dataKey="orders"
          fill="#f43f5e"
          radius={[4, 4, 0, 0]}
          maxBarSize={40}
        />
        <Line
          yAxisId="right"
          dataKey="revenue"
          stroke="#a78bfa"
          strokeWidth={2}
          dot={false}
          type="monotone"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};
