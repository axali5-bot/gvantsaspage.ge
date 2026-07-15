import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Loader2, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import {
  useExpenses,
  useAddExpense,
  useDeleteExpense,
  ExpenseCategory,
  EXPENSE_CATEGORY_LABELS,
} from '@/hooks/useExpenses';

const fmt = (n: number) => n.toLocaleString('ka-GE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const todayISO = () => new Date().toISOString().slice(0, 10);

const CATEGORY_TONE: Record<ExpenseCategory, string> = {
  delivery: 'bg-sky-100 text-sky-700',
  packaging: 'bg-amber-100 text-amber-700',
  ads: 'bg-violet-100 text-violet-700',
  other: 'bg-muted text-muted-foreground',
};

/** Operating expenses: quick-add form + history. Lives beside procurement —
 *  both are money out; net profit in Analytics subtracts these. */
export const ExpensesPanel = () => {
  const { data: expenses = [], isLoading } = useExpenses();
  const addExpense = useAddExpense();
  const deleteExpense = useDeleteExpense();

  const [category, setCategory] = useState<ExpenseCategory>('delivery');
  const [amount, setAmount] = useState('');
  const [spentAt, setSpentAt] = useState(todayISO());
  const [note, setNote] = useState('');

  const total = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);

  const handleAdd = async () => {
    const value = Number(amount);
    if (!value || value <= 0) { toast.error('შეიყვანე თანხა'); return; }
    try {
      await addExpense.mutateAsync({ category, amount: value, spent_at: spentAt, note: note.trim() || null });
      toast.success('✓ ხარჯი დაფიქსირდა');
      setAmount('');
      setNote('');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'ხარჯი ვერ შეინახა');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteExpense.mutateAsync(id);
      toast.success('ხარჯი წაიშალა');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'ვერ წაიშალა');
    }
  };

  return (
    <div className="space-y-5">
      {/* Quick-add form */}
      <div className="border border-border rounded-lg p-4 bg-background">
        <div className="grid grid-cols-2 sm:grid-cols-[130px_110px_1fr_auto] gap-3 items-end">
          <div>
            <Label className="text-xs">კატეგორია</Label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="w-full px-2 py-2 border border-border rounded-sm bg-background text-foreground text-sm"
            >
              {(Object.keys(EXPENSE_CATEGORY_LABELS) as ExpenseCategory[]).map((c) => (
                <option key={c} value={c}>{EXPENSE_CATEGORY_LABELS[c]}</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-xs">თანხა (₾)</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <Label className="text-xs">შენიშვნა</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="მაგ: კურიერი თბილისში" />
          </div>
          <div className="col-span-2 sm:col-span-1 flex gap-2">
            <Input
              type="date"
              value={spentAt}
              onChange={(e) => setSpentAt(e.target.value)}
              className="w-[140px]"
              aria-label="თარიღი"
            />
            <Button onClick={handleAdd} disabled={addExpense.isPending} className="shrink-0">
              {addExpense.isPending
                ? <Loader2 size={14} className="animate-spin" />
                : <><Plus size={14} className="mr-1" /> დამატება</>}
            </Button>
          </div>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <p className="text-muted-foreground py-6">იტვირთება…</p>
      ) : expenses.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg py-12 text-center">
          <Receipt size={28} className="mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-muted-foreground text-sm">ხარჯები ჯერ არ არის დაფიქსირებული.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          <p className="text-sm text-muted-foreground">
            სულ {expenses.length} ჩანაწერი · <span className="font-medium text-foreground">{fmt(total)} ₾</span>
          </p>
          {expenses.map((e) => (
            <div
              key={e.id}
              className="flex items-center gap-3 border border-border rounded-lg px-4 py-2.5 bg-background"
            >
              <span className="text-sm text-muted-foreground tabular-nums w-24 shrink-0">{e.spent_at}</span>
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${CATEGORY_TONE[e.category] ?? CATEGORY_TONE.other}`}>
                {EXPENSE_CATEGORY_LABELS[e.category] ?? e.category}
              </span>
              <span className="text-sm text-foreground truncate flex-1">
                {e.note || <span className="text-muted-foreground">—</span>}
              </span>
              <span className="text-sm font-display font-semibold tabular-nums shrink-0">{fmt(e.amount)} ₾</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(e.id)}
                className="text-destructive hover:text-destructive shrink-0 h-8 w-8"
                aria-label="წაშლა"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExpensesPanel;
