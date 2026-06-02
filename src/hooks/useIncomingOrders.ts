import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export const INCOMING_ORDERS_KEY = ['incoming_orders'] as const;

export interface OrderItem {
  samkaulebi_product_id: string | null;
  avon_product_id: string | null;
  name: string;
  quantity: number;
  unit_price: number;
}

export interface IncomingOrder {
  id: string;
  samkaulebi_order_id: string | null;
  items: OrderItem[];
  total_price: number;
  customer_name: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  status: 'new' | 'seen' | 'fulfilled' | 'cancelled';
  created_at: string;
}

export function useIncomingOrders() {
  return useQuery<IncomingOrder[]>({
    queryKey: INCOMING_ORDERS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incoming_orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row) => ({
        ...row,
        status: row.status as IncomingOrder['status'],
        items: (row.items as unknown as OrderItem[]) || [],
      }));
    },
    staleTime: 30_000,
  });
}

export function useNewIncomingOrderCount() {
  const { data } = useIncomingOrders();
  return data?.filter((o) => o.status === 'new').length ?? 0;
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: IncomingOrder['status'] }) => {
      const { error } = await supabase
        .from('incoming_orders')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: INCOMING_ORDERS_KEY }),
  });
}
