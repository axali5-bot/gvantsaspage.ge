import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCustomerOrders } from '@/hooks/useOrders';
import { Header } from '@/components/Header';
import SEO from '@/components/SEO';
import { CustomerOrderCard } from '@/components/CustomerOrderCard';
import { EmptyOrders } from '@/components/EmptyOrders';

const OrderSkeleton = () => (
  <div className="bg-white rounded-2xl border border-rose-100 p-5 animate-pulse">
    <div className="flex justify-between items-center">
      <div className="space-y-2">
        <div className="h-4 w-28 bg-rose-100 rounded" />
        <div className="h-3 w-20 bg-rose-50 rounded" />
      </div>
      <div className="space-y-2 flex flex-col items-end">
        <div className="h-5 w-20 bg-rose-100 rounded-full" />
        <div className="h-4 w-16 bg-rose-50 rounded" />
      </div>
    </div>
  </div>
);

const CustomerOrders = () => {
  const { t } = useTranslation();
  const { data: orders = [], isLoading, isError, refetch } = useCustomerOrders();

  return (
    <div className="min-h-screen bg-rose-50/30">
      <SEO title={t('account_orders.title')} description="Your order history on AVON2FLAME" />
      <Header onSearch={() => {}} />

      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <Link
          to="/account"
          className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-rose-400 hover:text-rose-500 font-semibold mb-8 transition-colors"
        >
          <ChevronLeft size={14} />
          {t('account_orders.back_to_account')}
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-display text-3xl font-light text-rose-400/90 mb-8">
            {t('account_orders.title')}
          </h1>

          {isLoading && (
            <div className="space-y-3">
              <OrderSkeleton />
              <OrderSkeleton />
              <OrderSkeleton />
            </div>
          )}

          {isError && (
            <div className="text-center py-12">
              <p className="font-body text-sm text-muted-foreground mb-4">
                შეცდომა შეკვეთების ჩატვირთვისას
              </p>
              <button
                onClick={() => refetch()}
                className="text-[11px] uppercase tracking-widest text-rose-400 hover:text-rose-500 font-semibold border border-rose-200 px-4 py-2 rounded-full transition-colors"
              >
                სცადე თავიდან
              </button>
            </div>
          )}

          {!isLoading && !isError && orders.length === 0 && <EmptyOrders />}

          {!isLoading && !isError && orders.length > 0 && (
            <div className="space-y-3">
              {orders.map((order, idx) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <CustomerOrderCard order={order} />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default CustomerOrders;
