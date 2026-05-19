import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface OrderItem {
    id: string;
    order_id: string;
    product_id: string;
    quantity: number;
    price_at_time: number;
    products?: {
        name_en?: string;
        name_ka?: string;
        name_ru?: string;
        name?: string;
        brand: string;
        image_url: string;
    };
}

export interface Order {
    id: string;
    customer_email?: string;
    customer_name?: string;
    customer_phone?: string;
    customer_address?: string;
    total_price: number;
    status: 'pending' | 'processing' | 'completed' | 'cancelled';
    created_at: string;
    order_items?: OrderItem[];
}

export const useOrders = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('orders')
                .select('*, order_items(*, products(*))')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders((data as unknown as Order[]) || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch orders');
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (orderId: string, status: Order['status']) => {
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status })
                .eq('id', orderId);

            if (error) throw error;

            setOrders(prev => prev.map(order =>
                order.id === orderId ? { ...order, status } : order
            ));

            return { success: true };
        } catch (err) {
            return { success: false, error: err instanceof Error ? err.message : 'Failed to update order' };
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    return { orders, loading, error, refreshOrders: fetchOrders, updateOrderStatus };
};
