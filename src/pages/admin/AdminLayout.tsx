import { useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package, ShoppingBag, Tags, BookOpen, BarChart3, Store, Users, Truck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabaseClient';
import { INCOMING_ORDERS_KEY, useNewIncomingOrderCount } from '@/hooks/useIncomingOrders';
import { playNotificationBeep } from '@/lib/notificationSound';

const navItems = [
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/purchases', label: 'Purchases', icon: Truck },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/categories', label: 'Categories', icon: Tags },
  { to: '/admin/catalogs', label: 'Catalogs', icon: BookOpen },
];

export const AdminLayout = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const newOrderCount = useNewIncomingOrderCount();

  // Realtime subscription — active for the entire admin session.
  // On INSERT: invalidate query (page + badge update) + play beep.
  // On UPDATE: invalidate query (status badge update).
  useEffect(() => {
    const channel = supabase
      .channel('admin-incoming-orders-global')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'incoming_orders' },
        () => {
          qc.invalidateQueries({ queryKey: INCOMING_ORDERS_KEY });
          playNotificationBeep();
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'incoming_orders' },
        () => {
          qc.invalidateQueries({ queryKey: INCOMING_ORDERS_KEY });
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen admin-page-bg">
      {/* Header — white, elevated, z-120 (below z-[130] dialogs and z-[100] storefront header) */}
      <header
        className="sticky top-0 z-[120] bg-white backdrop-blur-sm"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.04)' }}
      >
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          {/* Left: back + title */}
          <div className="flex items-center gap-3">
            <NavLink to="/">
              <Button variant="ghost" size="icon" className="text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-xl">
                <ArrowLeft size={18} />
              </Button>
            </NavLink>
            <h1 className="font-display text-xl font-semibold tracking-wide text-stone-800">
              {t('admin.title')}
            </h1>
          </div>

          {/* Nav pills */}
          <nav className="flex gap-0.5 flex-wrap">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold tracking-wide transition-all duration-150 ${
                    isActive
                      ? 'bg-rose-50 text-rose-700 shadow-sm'
                      : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'
                  }`
                }
              >
                <Icon size={13} />
                <span className="hidden sm:inline">{label}</span>
              </NavLink>
            ))}

            {/* samkaulebi incoming orders — with live badge */}
            <NavLink
              to="/admin/incoming-orders"
              className={({ isActive }) =>
                `relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold tracking-wide transition-all duration-150 ${
                  isActive
                    ? 'bg-rose-50 text-rose-700 shadow-sm'
                    : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'
                }`
              }
            >
              <Store size={13} />
              <span className="hidden sm:inline">samkaulebi</span>
              {newOrderCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 leading-none shadow-sm">
                  {newOrderCount > 99 ? '99+' : newOrderCount}
                </span>
              )}
            </NavLink>
          </nav>

          {/* Logout */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-[11px] font-medium text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-7">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
