import { useState } from 'react';
import { useProducts, Product } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { ProductTable } from '@/components/admin/ProductTable';
import { ProductFormDialog } from '@/components/admin/ProductFormDialog';
import { ProductDeleteDialog } from '@/components/admin/ProductDeleteDialog';
import { ProductBulkDeleteDialog } from '@/components/admin/ProductBulkDeleteDialog';
import { ProductImportDialog } from '@/components/admin/ProductImportDialog';
import { ProductExportButtons } from '@/components/admin/ProductExportButtons';
import { Button } from '@/components/ui/button';
import { Plus, FileUp } from 'lucide-react';

export const AdminProducts = () => {
  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [] } = useCategories();

  const [createOpen, setCreateOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  if (isLoading) return <p className="text-muted-foreground py-8">Loading products...</p>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-2 flex-wrap">
        <h2 className="font-display text-xl">Products ({products.length})</h2>
        <div className="flex gap-2 flex-wrap">
          <ProductExportButtons products={products} />
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
            <FileUp size={14} className="mr-1" /> Import CSV
          </Button>
          {selected.size > 0 && (
            <Button variant="destructive" size="sm" onClick={() => setBulkDeleteOpen(true)}>
              Delete {selected.size} selected
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
