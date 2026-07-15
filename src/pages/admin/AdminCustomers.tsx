import { useMemo, useState } from 'react';
import { useOrders } from '@/hooks/useOrders';
import { Input } from '@/components/ui/input';
import { Phone, MapPin, ShoppingBag, TrendingUp, Users, Star } from 'lucide-react';
import { LoyaltyPanel } from '@/components/admin/LoyaltyPanel';

interface Customer {
  key: string;            // phone or name (dedup key)
  name: string | null;
  phone: string | null;
  address: string | null;
  orderCount: number;
  totalSpent: number;
  lastOrderDate: string | null;
  statuses: string[];
}

function relativeDate(iso: string | null) {
  if (!iso) return '—';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (diff === 0) return 'დღეს';
  if (diff === 1) return 'გუშინ';
  if (diff < 7) return `${diff} დღის წინ`;
  if (diff < 30) return `${Math.floor(diff / 7)} კვ. წინ`;
  if (diff < 365) return `${Math.floor(diff / 30)} თვ. წინ`;
  return `${Math.floor(diff / 365)} წ. წინ`;
}

export const AdminCustomers = () => {
  const { data: orders = [], isLoading } = useOrders();
  const [search, setSearch] = useState('');

  const customers = useMemo<Customer[]>(() => {
    const map = new Map<string, Customer>();

    for (const order of orders) {
      // Dedup by phone first, fall back to name
      const key = order.customer_phone?.trim() || order.customer_name?.trim() || order.id;
      const existing = map.get(key);

      if (existing) {
        existing.orderCount++;
        if (order.status !== 'cancelled') existing.totalSpent += Number(order.total_price || 0);
        if (order.created_at && (!existing.lastOrderDate || order.created_at > existing.lastOrderDate)) {
          existing.lastOrderDate = order.created_at;
        }
        existing.statuses.push(order.status);
      } else {
        map.set(key, {
          key,
          name: order.customer_name || null,
          phone: order.customer_phone || null,
          address: order.customer_address || null,
          orderCount: 1,
          totalSpent: order.status !== 'cancelled' ? Number(order.total_price || 0) : 0,
          lastOrderDate: order.created_at,
          statuses: [order.status],
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [orders]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.phone?.includes(q) ||
        c.address?.toLowerCase().includes(q)
    );
  }, [customers, search]);

  // KPIs
  const totalRevenue = customers.reduce((s, c) => s + c.totalSpent, 0);
  const repeatCustomers = customers.filter((c) => c.orderCount > 1).length;
  const topCustomer = customers[0];

  if (isLoading) return <p className="text-muted-foreground py-8">Loading customers...</p>;

  return (
    <div className="space-y-5">
      <h2 className="font-display text-xl text-stone-800">კლიენტები ({customers.length})</h2>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="admin-card admin-card-hover p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
              <Users size={14} className="text-violet-500" />
            </div>
            <span className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold">სულ</span>
          </div>
          <p className="font-display text-2xl font-light text-stone-800">{customers.length}</p>
        </div>
        <div className="admin-card admin-card-hover p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
              <Star size={14} className="text-amber-500" />
            </div>
            <span className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold">მეორედ მყიდველი</span>
          </div>
          <p className="font-display text-2xl font-light text-stone-800">{repeatCustomers}</p>
        </div>
        <div className="admin-card admin-card-hover p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
              <TrendingUp size={14} className="text-emerald-600" />
            </div>
            <span className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold">სულ შემოსავალი</span>
          </div>
          <p className="font-display text-2xl font-light text-stone-800">₾{totalRevenue.toFixed(0)}</p>
        </div>
        <div className="admin-card admin-card-hover p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
              <ShoppingBag size={14} className="text-rose-500" />
            </div>
            <span className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold">საუკეთესო</span>
          </div>
          <p className="font-display text-lg font-light truncate text-stone-800">{topCustomer?.name || '—'}</p>
        </div>
      </div>

      {/* Search */}
      <Input
        placeholder="სახელი, ტელეფონი ან მისამართი..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm rounded-xl border-stone-200 focus-visible:ring-rose-300 bg-white"
      />

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-stone-400 text-sm admin-card">
          {search ? 'კლიენტი ვერ მოიძებნა' : 'შეკვეთები ჯერ არ არის'}
        </div>
      ) : (
        <div className="admin-table-wrap overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="admin-thead">
              <tr>
                <th className="admin-th text-left">კლიენტი</th>
                <th className="admin-th text-left hidden sm:table-cell">კონტაქტი</th>
                <th className="admin-th text-center">შეკვეთები</th>
                <th className="admin-th text-right">ჯამი</th>
                <th className="admin-th text-right hidden md:table-cell">ბოლო შეკვეთა</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c.key} className={`border-b border-stone-100 last:border-0 admin-tr-hover ${i % 2 === 1 ? 'bg-stone-50/40' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {/* Avatar initials */}
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                        {c.name ? c.name.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{c.name || '—'}</p>
                        {c.orderCount > 1 && (
                          <span className="text-[10px] text-emerald-600 font-medium">★ მუდმივი კლიენტი</span>
                        )}
                        {i === 0 && c.orderCount >= 1 && (
                          <span className="text-[10px] text-amber-600 font-medium ml-1">🏆 საუკეთესო</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <div className="space-y-0.5">
                      {c.phone && (
                        <a href={`tel:${c.phone}`} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                          <Phone size={10} className="shrink-0" />{c.phone}
                        </a>
                      )}
                      {c.address && (
                        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                          <MapPin size={10} className="shrink-0 mt-0.5" />
                          <span className="truncate max-w-[180px]">{c.address}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-semibold">
                      {c.orderCount}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-display text-base font-light">
                    ₾{c.totalSpent.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-muted-foreground hidden md:table-cell">
                    {relativeDate(c.lastOrderDate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Registered customers: points + referrals */}
      <LoyaltyPanel />
    </div>
  );
};

export default AdminCustomers;
