import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';

export interface OrderItem {
  id: string;
  order_id: string | null;
  product_id: string | null;
  quantity: number;
  price_at_time: number;
  products?: {
    name_ka?: string;
    name_en?: string;
    name_ru?: string;
    image_url?: string | null;
  };
}

export interface Order {
  id: string;
  customer_email?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_address?: string | null;
  total_price: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  created_at: string | null;
  user_id?: string | null;
  order_items?: OrderItem[];
}

const ORDERS_KEY = ['orders'] as const;

export const useOrders = () => {
  return useQuery<Order[]>({
    queryKey: ORDERS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, products(*))')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as unknown as Order[]) || [];
    },
    staleTime: 15_000,
  });
};

export const useCustomerOrders = () => {
  const { user } = useAuth();
  return useQuery<Order[]>({
    queryKey: ['customer-orders', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, products(name_ka, name_en, name_ru, image_url))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as unknown as Order[]) || [];
    },
    enabled: !!user,
    staleTime: 15_000,
  });
};

export const useUpdateOrderStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Order['status'] }) => {
      const { error } = await supabase.from('orders').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ORDERS_KEY });
      const prev = qc.getQueryData<Order[]>(ORDERS_KEY);
      qc.setQueryData<Order[]>(ORDERS_KEY, (old) =>
        (old || []).map((o) => (o.id === id ? { ...o, status } : o))
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(ORDERS_KEY, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ORDERS_KEY }),
  });
};
