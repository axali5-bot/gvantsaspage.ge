import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Product } from '@/hooks/useProducts';
import { SyncMap } from '@/hooks/useSamkaulebiSync';

const PAGE_SIZE = 20;

type SortField = 'name_ka' | 'price' | 'stock_quantity';
type SortDir = 'asc' | 'desc';

interface Props {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  selected: Set<string>;
  onSelectionChange: (selected: Set<string>) => void;
  syncMap?: SyncMap;
  /** product_id → wholesale cost (₾), for the margin column. Admin-only. */
  costMap?: Map<string, number>;
}

function SyncBadge({ status, error }: { status?: string; error?: string | null }) {
  if (!status) return <span className="text-xs text-stone-400">—</span>;
  if (status === 'synced') return <span className="text-xs text-emerald-600 font-semibold">✓ synced</span>;
  if (status === 'error') return (
    <span className="text-xs text-destructive font-semibold" title={error ?? undefined}>⚠ error</span>
  );
  if (status === 'dirty') return <span className="text-xs text-amber-600 font-semibold">↻ dirty</span>;
  return null;
}

function MarginCell({ price, cost }: { price: number; cost?: number }) {
  if (cost == null || cost <= 0) {
    return <span className="text-xs text-stone-400" title="შესყიდვის ფასი არ არის შეყვანილი">—</span>;
  }
  const margin = price - cost;
  const pct = price > 0 ? Math.round((margin / price) * 100) : 0;
  return (
    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-md ${margin >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
      {margin >= 0 ? '+' : ''}{margin.toFixed(0)} ₾ · {pct}%
    </span>
  );
}

export const ProductTable = ({ products, onEdit, onDelete, selected, onSelectionChange, syncMap, costMap }: Props) => {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('name_ka');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter((p) =>
      p.name_ka.toLowerCase().includes(q) ||
      (p.name_en || '').toLowerCase().includes(q) ||
      (p.name_ru || '').toLowerCase().includes(q)
    );
  }, [products, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = sortField === 'name_ka' ? a.name_ka : (a[sortField] ?? 0);
      const bv = sortField === 'name_ka' ? b.name_ka : (b[sortField] ?? 0);
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortField, sortDir]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const colCount = 8 + (syncMap ? 1 : 0);

  const toggleSort = (field: SortField) => {
    if (sortField === field) { setSortDir((d) => (d === 'asc' ? 'desc' : 'asc')); }
    else { setSortField(field); setSortDir('asc'); }
    setPage(1);
  };

  const sortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown size={12} className="ml-1 opacity-30" />;
    return sortDir === 'asc' ? <ArrowUp size={12} className="ml-1 text-rose-500" /> : <ArrowDown size={12} className="ml-1 text-rose-500" />;
  };

  const allPageSelected = paged.length > 0 && paged.every((p) => selected.has(p.id));

  const toggleAll = () => {
    const next = new Set(selected);
    if (allPageSelected) { paged.forEach((p) => next.delete(p.id)); }
    else { paged.forEach((p) => next.add(p.id)); }
    onSelectionChange(next);
  };

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) { next.delete(id); } else { next.add(id); }
    onSelectionChange(next);
  };

  return (
    <div className="space-y-3">
      {/* Search */}
      <Input
        placeholder="Search products..."
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        className="max-w-xs rounded-xl border-stone-200 focus-visible:ring-rose-300 bg-white"
      />

      {/* Table */}
      <div className="admin-table-wrap">
        <Table>
          <TableHeader className="admin-thead">
            <TableRow className="border-0 hover:bg-transparent">
              <TableHead className="admin-th w-10">
                <Checkbox checked={allPageSelected} onCheckedChange={toggleAll} />
              </TableHead>
              <TableHead className="admin-th w-16">Image</TableHead>
              <TableHead className="admin-th">
                <button className="flex items-center" onClick={() => toggleSort('name_ka')}>
                  Name {sortIcon('name_ka')}
                </button>
              </TableHead>
              <TableHead className="admin-th">
                <button className="flex items-center" onClick={() => toggleSort('price')}>
                  Price {sortIcon('price')}
                </button>
              </TableHead>
              <TableHead className="admin-th">Margin</TableHead>
              <TableHead className="admin-th">
                <button className="flex items-center" onClick={() => toggleSort('stock_quantity')}>
                  Stock {sortIcon('stock_quantity')}
                </button>
              </TableHead>
              <TableHead className="admin-th">Gender</TableHead>
              {syncMap && <TableHead className="admin-th">Sync</TableHead>}
              <TableHead className="admin-th text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colCount} className="text-center py-12 text-stone-400 text-sm">
                  {search ? 'No products match your search.' : 'No products yet.'}
                </TableCell>
              </TableRow>
            ) : (
              paged.map((product, idx) => (
                <TableRow
                  key={product.id}
                  className={`admin-tr-hover border-stone-100 ${idx % 2 === 1 ? 'bg-stone-50/40' : ''}`}
                >
                  <TableCell className="py-3">
                    <Checkbox checked={selected.has(product.id)} onCheckedChange={() => toggleOne(product.id)} />
                  </TableCell>
                  <TableCell className="py-3">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name_ka} className="w-10 h-10 object-cover rounded-lg shadow-sm" />
                    ) : (
                      <div className="w-10 h-10 bg-stone-100 rounded-lg" />
                    )}
                  </TableCell>
                  <TableCell className="font-body font-medium text-stone-800 py-3">{product.name_ka}</TableCell>
                  <TableCell className="font-body text-stone-700 py-3 tabular-nums">{product.price} ₾</TableCell>
                  <TableCell className="py-3">
                    <MarginCell price={product.price} cost={costMap?.get(product.id)} />
                  </TableCell>
                  <TableCell className="font-body text-stone-700 py-3 tabular-nums">{product.stock_quantity ?? 0}</TableCell>
                  <TableCell className="font-body text-xs text-stone-400 py-3">{product.gender || '—'}</TableCell>
                  {syncMap && (
                    <TableCell className="py-3">
                      <SyncBadge
                        status={syncMap.get(product.id)?.status}
                        error={syncMap.get(product.id)?.last_error}
                      />
                    </TableCell>
                  )}
                  <TableCell className="text-right py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => onEdit(product)} className="h-8 w-8 rounded-lg hover:bg-stone-100">
                        <Pencil size={14} className="text-stone-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => onDelete(product)} className="h-8 w-8 rounded-lg hover:bg-red-50 text-destructive hover:text-destructive">
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-stone-500">
          <span>
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border-stone-200 text-stone-600 hover:bg-stone-50"
            >
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border-stone-200 text-stone-600 hover:bg-stone-50"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductTable;
