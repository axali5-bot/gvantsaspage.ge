import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export type ExpenseCategory = 'delivery' | 'packaging' | 'ads' | 'other';

export interface Expense {
  id: string;
  category: ExpenseCategory;
  amount: number;
  spent_at: string; // yyyy-mm-dd
  note: string | null;
  created_at: string;
}

export interface ExpenseInput {
  category: ExpenseCategory;
  amount: number;
  spent_at: string;
  note?: string | null;
}

export const EXPENSES_KEY = ['expenses'] as const;

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  delivery: 'მიწოდება',
  packaging: 'შეფუთვა',
  ads: 'რეკლამა',
  other: 'სხვა',
};

/** Operating expenses, newest first. Admin-only (RLS). */
export const useExpenses = () => {
  return useQuery<Expense[]>({
    queryKey: EXPENSES_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('spent_at', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row: Record<string, any>) => ({
        id: row.id,
        category: row.category as ExpenseCategory,
        amount: Number(row.amount),
        spent_at: row.spent_at,
        note: row.note,
        created_at: row.created_at,
      }));
    },
    staleTime: 30_000,
  });
};

export const useAddExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ExpenseInput) => {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from('expenses').insert({
        ...input,
        note: input.note || null,
        created_by: userData.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: EXPENSES_KEY }),
  });
};

export const useDeleteExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: EXPENSES_KEY }),
  });
};
