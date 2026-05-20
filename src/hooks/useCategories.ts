import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface Category {
  id: string;
  name_ka: string;
  name_en: string;
  name_ru: string;
  slug: string;
  parent_id?: string | null;
  icon?: string | null;
}

export interface CategoryInput {
  name_ka: string;
  name_en: string;
  name_ru: string;
  slug: string;
  parent_id?: string | null;
}

const CATEGORIES_KEY = ['categories'] as const;

export const useCategories = () => {
  return useQuery<Category[]>({
    queryKey: CATEGORIES_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name_ka');
      if (error) throw error;
      return data || [];
    },
    staleTime: 60_000,
  });
};

export const useCreateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CategoryInput) => {
      const { data, error } = await supabase
        .from('categories')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as Category;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: CATEGORIES_KEY }),
  });
};

export const useUpdateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<CategoryInput> }) => {
      const { error } = await supabase
        .from('categories')
        .update(patch)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: CATEGORIES_KEY }),
  });
};

export const useDeleteCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: CATEGORIES_KEY }),
  });
};
