import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { subDays, startOfDay, eachDayOfInterval, format } from 'date-fns';
import { supabase } from '@/lib/supabaseClient';
import type { TimeRange } from './useAnalytics';

export interface VisitorsPerDayPoint {
  date: string;
  visitors: number;
  visits: number;
}

export interface VisitorsResult {
  uniqueVisitors: number; // distinct across the range
  totalVisits: number;    // page loads / sessions
  todayVisitors: number;
  visitorsPerDay: VisitorsPerDayPoint[];
  isLoading: boolean;
}

interface DayRow { day: string; visitors: number; visits: number }

const getRangeCutoff = (range: TimeRange): Date | null => {
  if (range === 'all') return null;
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  return startOfDay(subDays(new Date(), days - 1));
};

/** Visitor stats via admin-only RPCs (site_visits itself is not readable). */
export const useVisitors = (range: TimeRange): VisitorsResult => {
  const cutoff = getRangeCutoff(range);
  const fromISO = cutoff ? format(cutoff, 'yyyy-MM-dd') : null;

  const { data, isLoading } = useQuery({
    queryKey: ['visitors', fromISO],
    queryFn: async () => {
      const [stats, totals] = await Promise.all([
        supabase.rpc('get_visit_stats', { p_from: fromISO }),
        supabase.rpc('get_visit_totals', { p_from: fromISO }),
      ]);
      if (stats.error) throw stats.error;
      if (totals.error) throw totals.error;
      const days = (stats.data ?? []) as DayRow[];
      const t = (totals.data as { unique_visitors: number; total_visits: number }[] | null)?.[0];
      return {
        days,
        uniqueVisitors: Number(t?.unique_visitors ?? 0),
        totalVisits: Number(t?.total_visits ?? 0),
      };
    },
    staleTime: 60_000,
  });

  const result = useMemo(() => {
    const byDay = new Map<string, DayRow>();
    for (const row of data?.days ?? []) byDay.set(row.day, row);

    const todayKey = format(new Date(), 'yyyy-MM-dd');
    const todayVisitors = Number(byDay.get(todayKey)?.visitors ?? 0);

    let visitorsPerDay: VisitorsPerDayPoint[] = [];
    if (cutoff) {
      visitorsPerDay = eachDayOfInterval({ start: cutoff, end: new Date() }).map((d) => {
        const row = byDay.get(format(d, 'yyyy-MM-dd'));
        return {
          date: format(d, 'MMM dd'),
          visitors: Number(row?.visitors ?? 0),
          visits: Number(row?.visits ?? 0),
        };
      });
    } else {
      visitorsPerDay = (data?.days ?? []).map((row) => ({
        date: format(new Date(row.day), 'MMM dd'),
        visitors: Number(row.visitors),
        visits: Number(row.visits),
      }));
    }

    return {
      uniqueVisitors: data?.uniqueVisitors ?? 0,
      totalVisits: data?.totalVisits ?? 0,
      todayVisitors,
      visitorsPerDay,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, range]);

  return { ...result, isLoading };
};
