import { useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package, ShoppingBag, Tags, BookOpen, BarChart3, Store } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabaseClient';
import { INCOMING_ORDERS_KEY, useNewIncomingOrderCount } from '@/hooks/useIncomingOrders';
import { playNotificationBeep } from '@/lib/notificationSound';

const navItems = [
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
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
    <div className="min-h-screen bg-background">
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <NavLink to="/">
              <Button variant="ghost" size="icon"><ArrowLeft size={20} /></Button>
            </NavLink>
            <h1 className="font-display text-2xl font-semibold tracking-wider">
              {t('admin.title')}
            </h1>
          </div>

          <nav className="flex gap-1 flex-wrap">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `inline-flex items-center gap-2 px-3 py-2 rounded-sm text-xs uppercase tracking-widest transition-colors ${
                    isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`
                }
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{label}</span>
              </NavLink>
            ))}

            {/* samkaulebi incoming orders — with live badge */}
            <NavLink
              to="/admin/incoming-orders"
              className={({ isActive }) =>
                `relative inline-flex items-center gap-2 px-3 py-2 rounded-sm text-xs uppercase tracking-widest transition-colors ${
                  isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`
              }
            >
              <Store size={14} />
              <span className="hidden sm:inline">samkaulebi</span>
              {newOrderCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 leading-none">
                  {newOrderCount > 99 ? '99+' : newOrderCount}
                </span>
              )}
            </NavLink>
          </nav>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-xs text-muted-foreground hover:text-destructive"
          >
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
