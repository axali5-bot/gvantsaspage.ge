import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useProducts } from '@/hooks/useProducts';
import { useProductCosts } from '@/hooks/useProductCosts';
import { useCreatePurchaseOrder } from '@/hooks/usePurchaseOrders';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Line {
  key: string;
  product_id: string;
  quantity: number;
  unit_cost: number;
}

const SUPPLIERS = ['Avon', 'Oriflame', 'სხვა'];
const todayISO = () => new Date().toISOString().slice(0, 10);
const newLine = (): Line => ({ key: crypto.randomUUID(), product_id: '', quantity: 1, unit_cost: 0 });

export const PurchaseFormDialog = ({ open, onOpenChange }: Props) => {
  const { data: products = [] } = useProducts();
  const { data: costMap = new Map() } = useProductCosts();
  const createPurchase = useCreatePurchaseOrder();

  const [supplier, setSupplier] = useState('Avon');
  const [campaign, setCampaign] = useState('');
  const [orderedAt, setOrderedAt] = useState(todayISO());
  const [note, setNote] = useState('');
  const [lines, setLines] = useState<Line[]>([newLine()]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setSupplier('Avon');
      setCampaign('');
      setOrderedAt(todayISO());
      setNote('');
      setLines([newLine()]);
    }
  }, [open]);

  const sortedProducts = useMemo(
    () => [...products].sort((a, b) => a.name_ka.localeCompare(b.name_ka, 'ka')),
    [products],
  );

  const grandTotal = useMemo(
    () => lines.reduce((sum, l) => sum + (l.product_id ? l.quantity * l.unit_cost : 0), 0),
    [lines],
  );
  const validCount = lines.filter((l) => l.product_id).length;

  const updateLine = (key: string, patch: Partial<Line>) =>
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  const onPickProduct = (key: string, product_id: string) => {
    const line = lines.find((l) => l.key === key);
    // Prefill unit cost with the product's current cost as a starting point.
    const suggested = costMap.get(product_id) ?? 0;
    updateLine(key, {
      product_id,
      unit_cost: line && line.unit_cost > 0 ? line.unit_cost : suggested,
    });
  };

  const addLine = () => setLines((prev) => [...prev, newLine()]);
  const removeLine = (key: string) =>
    setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.key !== key) : prev));

  const handleSubmit = async () => {
    if (!supplier.trim()) { toast.error('აირჩიე მომწოდებელი'); return; }
    const items = lines
      .filter((l) => l.product_id && l.quantity > 0 && l.unit_cost >= 0)
      .map((l) => ({ product_id: l.product_id, quantity: l.quantity, unit_cost: l.unit_cost }));
    if (items.length === 0) { toast.error('დაამატე მინიმუმ ერთი პროდუქტი'); return; }

    setSaving(true);
    try {
      await createPurchase.mutateAsync({
        supplier: supplier.trim(),
        campaign: campaign.trim() || null,
        ordered_at: orderedAt,
        note: note.trim() || null,
        items,
      });
      toast.success(`✓ შესყიდვა დაფიქსირდა — ${items.length} პროდუქტი, ${grandTotal.toFixed(2)} ₾. მარაგი განახლდა.`);
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'შესყიდვა ვერ შეინახა');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">ახალი შესყიდვა</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Header fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>მომწოდებელი *</Label>
              <select
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-sm bg-background text-foreground text-sm"
              >
                {SUPPLIERS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <Label>თარიღი</Label>
              <Input type="date" value={orderedAt} onChange={(e) => setOrderedAt(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>კამპანია / კატალოგი</Label>
              <Input
                value={campaign}
                onChange={(e) => setCampaign(e.target.value)}
                placeholder="მაგ: კამპანია 09/2026"
              />
            </div>
            <div>
              <Label>შენიშვნა</Label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="არასავალდებულო" />
            </div>
          </div>

          {/* Line items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">პროდუქტები</Label>
              <span className="text-xs text-muted-foreground">{validCount} პროდუქტი</span>
            </div>

            {/* Column headers */}
            <div className="hidden sm:grid grid-cols-[1fr_80px_110px_100px_36px] gap-2 px-1 text-[11px] uppercase tracking-wider text-muted-foreground">
              <span>პროდუქტი</span>
              <span className="text-center">რაოდ.</span>
              <span className="text-right">ერთ. ფასი ₾</span>
              <span className="text-right">ჯამი ₾</span>
              <span />
            </div>

            {lines.map((line) => {
              const lineTotal = line.product_id ? line.quantity * line.unit_cost : 0;
              return (
                <div
                  key={line.key}
                  className="grid grid-cols-2 sm:grid-cols-[1fr_80px_110px_100px_36px] gap-2 items-center"
                >
                  <select
                    value={line.product_id}
                    onChange={(e) => onPickProduct(line.key, e.target.value)}
                    className="col-span-2 sm:col-span-1 w-full px-2 py-2 border border-border rounded-sm bg-background text-foreground text-sm"
                  >
                    <option value="">— აირჩიე პროდუქტი —</option>
                    {sortedProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name_ka} (მარაგი: {p.stock_quantity ?? 0})
                      </option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    min={1}
                    value={line.quantity}
                    onChange={(e) => updateLine(line.key, { quantity: Math.max(1, Number(e.target.value) || 0) })}
                    className="text-center"
                    aria-label="რაოდენობა"
                  />
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={line.unit_cost}
                    onChange={(e) => updateLine(line.key, { unit_cost: Math.max(0, Number(e.target.value) || 0) })}
                    className="text-right"
                    aria-label="ერთეულის ფასი"
                  />
                  <div className="text-right text-sm font-medium tabular-nums px-1">
                    {lineTotal.toFixed(2)}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLine(line.key)}
                    disabled={lines.length === 1}
                    className="text-destructive hover:text-destructive shrink-0"
                    aria-label="წაშლა"
                  >
                    <Trash2 size={15} />
                  </Button>
                </div>
              );
            })}

            <Button type="button" variant="outline" size="sm" onClick={addLine} className="mt-1">
              <Plus size={14} className="mr-1" /> პროდუქტის დამატება
            </Button>
          </div>

          {/* Total + submit */}
          <div className="flex items-center justify-between border-t border-border pt-4">
            <div className="text-sm text-muted-foreground">
              სულ ხარჯი:{' '}
              <span className="text-lg font-display font-semibold text-foreground">{grandTotal.toFixed(2)} ₾</span>
            </div>
            <Button onClick={handleSubmit} disabled={saving || validCount === 0}>
              {saving
                ? <><Loader2 size={15} className="mr-1 animate-spin" /> ინახება...</>
                : 'შესყიდვის დაფიქსირება'}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground -mt-2">
            🔒 კონფიდენციალური — დაფიქსირება ავტომატურად შეავსებს მარაგს და განაახლებს თვითღირებულებას.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseFormDialog;
