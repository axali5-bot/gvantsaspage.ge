import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useProducts, Product } from '@/hooks/useProducts';
import { useProductCosts } from '@/hooks/useProductCosts';
import { useCategories } from '@/hooks/useCategories';
import { useSamkaulebiSync, SYNC_KEY } from '@/hooks/useSamkaulebiSync';
import { syncProduct } from '@/lib/samkaulebiSync';
import { ProductTable } from '@/components/admin/ProductTable';
import { ProductFormDialog } from '@/components/admin/ProductFormDialog';
import { ProductDeleteDialog } from '@/components/admin/ProductDeleteDialog';
import { ProductBulkDeleteDialog } from '@/components/admin/ProductBulkDeleteDialog';
import { ProductImportDialog } from '@/components/admin/ProductImportDialog';
import { ProductExportButtons } from '@/components/admin/ProductExportButtons';
import { Button } from '@/components/ui/button';
import { Plus, FileUp, Send } from 'lucide-react';
import { toast } from 'sonner';

interface BulkSyncState {
  running: boolean;
  done: number;
  total: number;
  errors: number;
}

export const AdminProducts = () => {
  const qc = useQueryClient();
  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [] } = useCategories();
  const { data: syncMap = new Map() } = useSamkaulebiSync();
  const { data: costMap = new Map() } = useProductCosts();

  const [createOpen, setCreateOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkSync, setBulkSync] = useState<BulkSyncState | null>(null);

  // Products that still need pushing: never synced, or changed since (dirty/error)
  const unsyncedProducts = products.filter((p) => syncMap.get(p.id)?.status !== 'synced');

  const handleBulkSync = async () => {
    const toSync = unsyncedProducts;
    if (toSync.length === 0) {
      toast.info('ყველა პროდუქტი უკვე დასინქრონებულია ✓');
      return;
    }
    setBulkSync({ running: true, done: 0, total: toSync.length, errors: 0 });
    let errors = 0;
    for (let i = 0; i < toSync.length; i++) {
      const result = await syncProduct(toSync[i]);
      if (!result.ok) errors++;
      setBulkSync({ running: true, done: i + 1, total: toSync.length, errors });
    }
    setBulkSync({ running: false, done: toSync.length, total: toSync.length, errors });
    await qc.invalidateQueries({ queryKey: SYNC_KEY });
    if (errors === 0) {
      toast.success(`✓ ${toSync.length} ახალი პროდუქტი გაიგზავნა samkaulebi-ზე`);
    } else {
      toast.warning(`${toSync.length - errors} გაიგზავნა, ${errors} შეცდომა`);
    }
    setTimeout(() => setBulkSync(null), 4000);
  };

  if (isLoading) return <p className="text-muted-foreground py-8">Loading products...</p>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-2 flex-wrap">
        <h2 className="font-display text-xl">Products ({products.length})</h2>
        <div className="flex gap-2 flex-wrap items-center">
          <ProductExportButtons products={products} />
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
            <FileUp size={14} className="mr-1" /> Import CSV
          </Button>
          {selected.size > 0 && (
            <Button variant="destructive" size="sm" onClick={() => setBulkDeleteOpen(true)}>
              Delete {selected.size} selected
            </Button>
          )}

          {/* Bulk sync button */}
          {bulkSync ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground border border-border rounded px-3 py-1.5 min-w-[180px]">
              {bulkSync.running ? (
                <>
                  <span className="animate-spin text-base">⏳</span>
                  <span>{bulkSync.done}/{bulkSync.total} გაიგზავნა…</span>
                </>
              ) : (
                <>
                  <span>{bulkSync.errors === 0 ? '✓' : '⚠'}</span>
                  <span>
                    {bulkSync.done - bulkSync.errors}/{bulkSync.total}
                    {bulkSync.errors > 0 && `, ${bulkSync.errors} შეცდომა`}
                  </span>
                </>
              )}
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkSync}
              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300"
            >
              <Send size={14} className="mr-1" />
              samkaulebi-ზე გაგზავნა{unsyncedProducts.length > 0 ? ` (${unsyncedProducts.length})` : ''}
            </Button>
          )}

          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus size={14} className="mr-1" /> Add Product
          </Button>
        </div>
      </div>

      <ProductTable
        products={products}
        onEdit={setEditProduct}
        onDelete={setDeleteProduct}
        selected={selected}
        onSelectionChange={setSelected}
        syncMap={syncMap}
        costMap={costMap}
      />

      <ProductFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        categories={categories}
      />

      <ProductFormDialog
        open={!!editProduct}
        onOpenChange={(o) => { if (!o) setEditProduct(null); }}
        product={editProduct ?? undefined}
        categories={categories}
      />

      <ProductDeleteDialog
        product={deleteProduct}
        onClose={() => setDeleteProduct(null)}
      />

      <ProductBulkDeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        ids={Array.from(selected)}
        onSuccess={() => setSelected(new Set())}
      />

      <ProductImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
      />
    </div>
  );
};

export default AdminProducts;
