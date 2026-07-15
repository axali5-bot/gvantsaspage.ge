-- Phase 4 of profit tracking: operating expenses (delivery, packaging, ads, ...)
-- — admin-only. Net profit = gross profit (revenue − COGS) − these expenses.

CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,                       -- 'delivery' | 'packaging' | 'ads' | 'other'
  amount numeric NOT NULL CHECK (amount > 0),
  spent_at date NOT NULL DEFAULT current_date,
  note text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expenses_spent_at ON public.expenses(spent_at DESC);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.expenses FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;

DROP POLICY IF EXISTS expenses_admin_all ON public.expenses;
CREATE POLICY expenses_admin_all ON public.expenses
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
