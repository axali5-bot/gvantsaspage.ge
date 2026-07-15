import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus, ChevronDown, ChevronRight, Package, Loader2 } from 'lucide-react';
import { usePurchaseOrders, usePurchaseOrderItems, PurchaseOrder } from '@/hooks/usePurchaseOrders';
import { PurchaseFormDialog } from '@/components/admin/PurchaseFormDialog';
import { ExpensesPanel } from '@/components/admin/ExpensesPanel';

const fmt = (n: number) => n.toLocaleString('ka-GE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function SupplierPill({ supplier }: { supplier: string }) {
  const tone =
    supplier === 'Avon' ? 'bg-rose-100 text-rose-700'
    : supplier === 'Oriflame' ? 'bg-sky-100 text-sky-700'
    : 'bg-muted text-muted-foreground';
  return <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${tone}`}>{supplier}</span>;
}

function PurchaseItems({ poId }: { poId: string }) {
  const { data: items = [], isLoading } = usePurchaseOrderItems(poId);
  if (isLoading) {
    return <div className="py-3 px-4 text-sm text-muted-foreground flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> იტვირთება…</div>;
  }
  return (
    <div className="border-t border-border/60 bg-muted/20">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
            <th className="text-left font-medium px-4 py-2">პროდუქტი</th>
            <th className="text-center font-medium px-2 py-2">რაოდ.</th>
            <th className="text-right font-medium px-2 py-2">ერთ. ფასი</th>
            <th className="text-right font-medium px-4 py-2">ჯამი</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id} className="border-t border-border/40">
              <td className="px-4 py-2">{it.product_name}</td>
              <td className="text-center px-2 py-2 tabular-nums">{it.quantity}</td>
              <td className="text-right px-2 py-2 tabular-nums">{fmt(it.unit_cost)} ₾</td>
              <td className="text-right px-4 py-2 tabular-nums font-medium">{fmt(it.line_total)} ₾</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PurchaseCard({ po }: { po: PurchaseOrder }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-lg overflow-hidden bg-background">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors text-left"
      >
        {open ? <ChevronDown size={16} className="shrink-0 text-muted-foreground" /> : <ChevronRight size={16} className="shrink-0 text-muted-foreground" />}
        <span className="text-sm text-muted-foreground tabular-nums w-24 shrink-0">{po.ordered_at}</span>
        <SupplierPill supplier={po.supplier} />
        <span className="text-sm text-foreground truncate flex-1">
          {po.campaign || <span className="text-muted-foreground">—</span>}
        </span>
        <span className="text-xs text-muted-foreground hidden sm:inline shrink-0">{po.item_count} პროდუქტი</span>
        <span className="text-sm font-display font-semibold tabular-nums shrink-0 w-28 text-right">{fmt(po.total_cost)} ₾</span>
      </button>
      {open && <PurchaseItems poId={po.id} />}
    </div>
  );
}

export const AdminPurchases = () => {
  const { data: orders = [], isLoading } = usePurchaseOrders();
  const [createOpen, setCreateOpen] = useState(false);

  const totalSpend = useMemo(() => orders.reduce((s, o) => s + o.total_cost, 0), [orders]);

  return (
    <div className="space-y-5">
      <Tabs defaultValue="purchases">
        <TabsList>
          <TabsTrigger value="purchases">შესყიდვები</TabsTrigger>
          <TabsTrigger value="expenses">სხვა ხარჯები</TabsTrigger>
        </TabsList>

        <TabsContent value="purchases" className="space-y-5 mt-5">
          <div className="flex justify-between items-center gap-2 flex-wrap">
            <div>
              <h2 className="font-display text-xl">შესყიდვები</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                სულ {orders.length} შესყიდვა · ხარჯი <span className="font-medium text-foreground">{fmt(totalSpend)} ₾</span>
              </p>
            </div>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus size={14} className="mr-1" /> ახალი შესყიდვა
            </Button>
          </div>

          {isLoading ? (
            <p className="text-muted-foreground py-8">იტვირთება…</p>
          ) : orders.length === 0 ? (
            <div className="border border-dashed border-border rounded-lg py-16 text-center">
              <Package size={32} className="mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">ჯერ არცერთი შესყიდვა არ არის დაფიქსირებული.</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                დაამატე პირველი ბლუკ-შესყიდვა Avon / Oriflame-დან.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {orders.map((po) => <PurchaseCard key={po.id} po={po} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="expenses" className="mt-5">
          <ExpensesPanel />
        </TabsContent>
      </Tabs>

      <PurchaseFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
};

export default AdminPurchases;
