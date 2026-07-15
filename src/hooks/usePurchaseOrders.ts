import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import type { Json } from '@/types/supabase';
import { PRODUCT_COSTS_KEY } from '@/hooks/useProductCosts';
import { SYNC_KEY } from '@/hooks/useSamkaulebiSync';

export interface PurchaseOrder {
  id: string;
  supplier: string;
  campaign: string | null;
  ordered_at: string;
  status: string;
  note: string | null;
  total_cost: number;
  created_at: string;
  item_count: number;
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  product_id: string;
  quantity: number;
  unit_cost: number;
  line_total: number;
  product_name: string;
}

export interface PurchaseItemInput {
  product_id: string;
  quantity: number;
  unit_cost: number;
}

export interface CreatePurchaseInput {
  supplier: string;
  campaign?: string | null;
  ordered_at: string; // yyyy-mm-dd
  note?: string | null;
  items: PurchaseItemInput[];
}

export const PURCHASE_ORDERS_KEY = ['purchase_orders'] as const;

/** Bulk purchase orders, newest first, with a line-item count. Admin-only (RLS). */
export const usePurchaseOrders = () => {
  return useQuery<PurchaseOrder[]>({
    queryKey: PURCHASE_ORDERS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*, purchase_order_items(count)')
        .order('ordered_at', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row: Record<string, any>) => ({
        id: row.id,
        supplier: row.supplier,
        campaign: row.campaign,
        ordered_at: row.ordered_at,
        status: row.status,
        note: row.note,
        total_cost: Number(row.total_cost),
        created_at: row.created_at,
        item_count: row.purchase_order_items?.[0]?.count ?? 0,
      }));
    },
    staleTime: 30_000,
  });
};

/** Line items of one purchase order, with the product name joined in. */
export const usePurchaseOrderItems = (poId: string | undefined) => {
  return useQuery<PurchaseOrderItem[]>({
    queryKey: ['purchase_order_items', poId],
    enabled: !!poId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_order_items')
        .select('*, products(name_ka)')
        .eq('purchase_order_id', poId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []).map((row: Record<string, any>) => ({
        id: row.id,
        purchase_order_id: row.purchase_order_id,
        product_id: row.product_id,
        quantity: row.quantity,
        unit_cost: Number(row.unit_cost),
        line_total: Number(row.line_total),
        product_name: row.products?.name_ka ?? '—',
      }));
    },
  });
};

/**
 * Logs a bulk purchase via the atomic create_purchase_order RPC: writes the
 * ledger, restocks each product, and sets its current cost — all in one
 * transaction. Invalidates products (stock), costs, and the samkaulebi sync
 * map (restock flags products dirty for re-sync).
 */
export const useCreatePurchaseOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreatePurchaseInput) => {
      const { data, error } = await supabase.rpc('create_purchase_order', {
        p_supplier: input.supplier,
        p_campaign: input.campaign ?? null,
        p_ordered_at: input.ordered_at,
        p_note: input.note ?? null,
        p_items: input.items as unknown as Json,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PURCHASE_ORDERS_KEY });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: PRODUCT_COSTS_KEY });
      qc.invalidateQueries({ queryKey: SYNC_KEY });
    },
  });
};
