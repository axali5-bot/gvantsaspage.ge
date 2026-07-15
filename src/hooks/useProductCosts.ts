import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

/**
 * Current wholesale cost per product (₾).
 *
 * Kept in the admin-only `product_costs` table — NOT on `products`, which is
 * world-readable (products_public_read: qual=true) and fetched with select('*').
 * Cost data must never reach the public API, so it lives behind is_admin() RLS.
 */
export const PRODUCT_COSTS_KEY = ['product_costs'] as const;

/** Map of product_id → current cost price (₾). Empty for non-admins (RLS). */
export const useProductCosts = () => {
  return useQuery<Map<string, number>>({
    queryKey: PRODUCT_COSTS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_costs')
        .select('product_id, cost_price');
      if (error) throw error;
      const map = new Map<string, number>();
      for (const row of data ?? []) map.set(row.product_id, Number(row.cost_price));
      return map;
    },
    staleTime: 30_000,
  });
};

export const useUpsertProductCost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ product_id, cost_price }: { product_id: string; cost_price: number }) => {
      const { error } = await supabase
        .from('product_costs')
        .upsert(
          { product_id, cost_price, updated_at: new Date().toISOString() },
          { onConflict: 'product_id' },
        );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCT_COSTS_KEY }),
  });
};
