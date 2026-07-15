import { useProducts } from '@/hooks/useProducts';
import { AlertTriangle, Package, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const OUT_THRESHOLD = 0;
const LOW_THRESHOLD = 5;

export const StockAlerts = () => {
  const { data: products = [] } = useProducts();
  const navigate = useNavigate();

  const outOfStock = products.filter((p) => (p.stock_quantity ?? 0) <= OUT_THRESHOLD);
  const lowStock = products.filter(
    (p) => (p.stock_quantity ?? 0) > OUT_THRESHOLD && (p.stock_quantity ?? 0) <= LOW_THRESHOLD
  );

  if (outOfStock.length === 0 && lowStock.length === 0) return null;

  return (
    <div className="space-y-2">
      {outOfStock.length > 0 && (
        <button
          onClick={() => navigate('/admin/products')}
          className="w-full flex items-center justify-between gap-3 admin-alert-red text-left hover:opacity-90 transition-opacity group"
        >
          <div className="flex items-center gap-3">
            <Package size={15} className="text-red-500 shrink-0" />
            <div>
              <span className="text-xs font-semibold text-red-700">
                {outOfStock.length} პროდუქტი ამოწურულია
              </span>
              <p className="text-[11px] text-red-500 mt-0.5 truncate max-w-sm">
                {outOfStock.map((p) => p.name_ka).join(', ')}
              </p>
            </div>
          </div>
          <ChevronRight size={14} className="text-red-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}

      {lowStock.length > 0 && (
        <button
          onClick={() => navigate('/admin/products')}
          className="w-full flex items-center justify-between gap-3 admin-alert-amber text-left hover:opacity-90 transition-opacity group"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle size={15} className="text-amber-500 shrink-0" />
            <div>
              <span className="text-xs font-semibold text-amber-700">
                {lowStock.length} პროდუქტს მცირე მარაგი აქვს (≤{LOW_THRESHOLD})
              </span>
              <p className="text-[11px] text-amber-600 mt-0.5 truncate max-w-sm">
                {lowStock.map((p) => `${p.name_ka} (${p.stock_quantity})`).join(', ')}
              </p>
            </div>
          </div>
          <ChevronRight size={14} className="text-amber-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}
    </div>
  );
};
