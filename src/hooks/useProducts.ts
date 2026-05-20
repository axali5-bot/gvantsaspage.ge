import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface Product {
  id: string;
  name_ka: string;
  name_en: string | null;
  name_ru: string | null;
  description_ka: string | null;
  description_en: string | null;
  description_ru: string | null;
  price: number;
  image_url: string | null;
  category_id: string | null;
  stock_quantity: number | null;
  created_at: string;
  gender: string | null;
  /** Derived: best-available name for current UI language. */
  name: string;
  /** Derived: best-available description for current UI language. */
  description: string;
}

export interface ProductInput {
  name_ka: string;
  name_en?: string;
  name_ru?: string;
  description_ka?: string;
  description_en?: string;
  description_ru?: string;
  price: number;
  image_url: string;
  category_id: string | null;
  stock_quantity: number;
  gender?: string;
}

const PRODUCTS_KEY = ['products'] as const;

const localize = (row: any): Product => ({
  ...row,
  name: row.name_ka || row.name_en || row.name_ru || '',
  description: row.description_ka || row.description_en || row.description_ru || '',
});

export const useProducts = () => {
  return useQuery<Product[]>({
    queryKey: PRODUCTS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(localize);
    },
    staleTime: 30_000,
  });
};

export const useProduct = (id: string | undefined) => {
  return useQuery<Product | null>({
    queryKey: ['products', id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data ? localize(data) : null;
    },
  });
};

export const useCreateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ProductInput) => {
      const { data, error } = await supabase.from('products').insert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCTS_KEY }),
  });
};

export const useUpdateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<ProductInput> }) => {
      const { data, error } = await supabase.from('products').update(patch).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCTS_KEY }),
  });
};

export const useDeleteProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCTS_KEY }),
  });
};

export const useBulkDeleteProducts = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('products').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCTS_KEY }),
  });
};
