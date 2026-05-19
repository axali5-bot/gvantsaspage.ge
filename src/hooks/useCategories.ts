import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface Category {
  id: string;
  name_ka: string;
  name_en: string;
  name_ru: string;
  slug: string;
  parent_id?: string | null;
  icon?: string | null;
  game_count?: number | null;
}

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name_ka');

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const addCategory = async (names: { ka: string; en: string; ru: string }, slug: string, parentId?: string | null) => {
    const { data, error } = await supabase
      .from('categories')
      .insert([{
        name_ka: names.ka,
        name_en: names.en,
        name_ru: names.ru,
        slug,
        parent_id: parentId || null
      }])
      .select()
      .single();

    if (error) throw error;
    await fetchCategories();
    return data;
  };

  const updateCategory = async (id: string, names: { ka: string; en: string; ru: string }, slug: string, parentId?: string | null) => {
    const { error } = await supabase
      .from('categories')
      .update({
        name_ka: names.ka,
        name_en: names.en,
        name_ru: names.ru,
        slug,
        parent_id: parentId || null
      })
      .eq('id', id);

    if (error) throw error;
    await fetchCategories();
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
    await fetchCategories();
  };

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories,
    addCategory,
    updateCategory,
    deleteCategory
  };
};
