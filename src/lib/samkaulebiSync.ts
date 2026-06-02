import { supabase } from './supabaseClient';
import type { Product } from '@/hooks/useProducts';

export interface SyncResult {
  ok: boolean;
  error?: string;
}

export async function syncProduct(product: Pick<
  Product,
  'id' | 'name_ka' | 'name_en' | 'description_ka' | 'price' | 'stock_quantity' | 'image_url'
>): Promise<SyncResult> {
  const { data, error } = await supabase.functions.invoke('push-to-samkaulebi', {
    body: {
      product: {
        avon_product_id: product.id,
        name_ka: product.name_ka,
        name_en: product.name_en ?? undefined,
        description_ka: product.description_ka ?? undefined,
        price: product.price,
        stock_quantity: product.stock_quantity ?? undefined,
        image_url: product.image_url ?? undefined,
      },
    },
  });
  if (error) return { ok: false, error: error.message };
  if (data?.error) return { ok: false, error: data.error };
  return { ok: true };
}

export async function remoteSyncDelete(avonProductId: string): Promise<SyncResult> {
  const { data, error } = await supabase.functions.invoke('push-to-samkaulebi', {
    body: { action: 'delete', avon_product_id: avonProductId },
  });
  if (error) return { ok: false, error: error.message };
  if (data?.error) return { ok: false, error: data.error };
  return { ok: true };
}
