import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface Rating {
  avg: number;
  count: number;
}

/**
 * All product ratings as a Map keyed by product_id. One shared query
 * (React Query dedups by key), so every ProductCard reads from one fetch.
 */
export const useProductRatings = () => {
  return useQuery<Map<string, Rating>>({
    queryKey: ['product-ratings'],
    queryFn: async () => {
      const { data } = await supabase
        .from('product_ratings')
        .select('product_id, avg_rating, review_count');
      const map = new Map<string, Rating>();
      (data ?? []).forEach((r) => {
        map.set(r.product_id, { avg: Number(r.avg_rating), count: r.review_count });
      });
      return map;
    },
    staleTime: 60_000,
  });
};
