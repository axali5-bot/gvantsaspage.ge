import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Package, MapPin, Phone, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Order, OrderItem } from '@/hooks/useOrders';
import { OrderStatusTimeline } from './OrderStatusTimeline';

type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

const statusStyles: Record<OrderStatus, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  processing: 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
};

const formatOrderDate = (iso: string | null, lang: string): string => {
  if (!iso) return '—';
  const localeMap = { ka: 'ka-GE', en: 'en-US', ru: 'ru-RU' };
  return new Intl.DateTimeFormat(localeMap[lang as keyof typeof localeMap] || 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(iso));
};

interface CustomerOrderCardProps {
  order: Order;
}

export const CustomerOrderCard = ({ order }: CustomerOrderCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { t, i18n } = useTranslation();

  const shortId = order.id.slice(-8).toUpperCase();
  const formattedDate = formatOrderDate(order.created_at, i18n.language);
  const items = order.order_items ?? [];
  const itemCount = items.length;
  const status = (order.status ?? 'pending') as OrderStatus;
  const statusStyle = statusStyles[status] ?? statusStyles.pending;

  const getProductName = (item: OrderItem): string => {
    if (!item.products) return '—';
    const { name_ka, name_en, name_ru } = item.products;
    if (i18n.language === 'en') return name_en || name_ka || '—';
    if (i18n.language === 'ru') return name_ru || name_ka || '—';
    return name_ka || '—';
  };

  return (
    <div className="bg-white rounded-2xl border border-rose-100 overflow-hidden hover:shadow-md transition-all">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <div className="flex flex-col gap-1">
          <span className="font-display text-sm tracking-widest text-foreground">
            {t('account_orders.order_number')}{shortId}
          </span>
          <span className="font-body text-xs text-muted-foreground">
            {formattedDate} · {t('account_orders.items_count', { count: itemCount })}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end gap-1">
            <span className={`text-[10px] font-body tracking-wider uppercase px-2.5 py-1 rounded-full border ${statusStyle}`}>
              {t(`order_status.${status}`)}
            </span>
            <span className="font-display text-base text-rose-600">
              {order.total_price.toFixed(2)} ₾
            </span>
          </div>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown size={18} className="text-rose-300" />
          </motion.div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-5 border-t border-rose-50">
              <OrderStatusTimeline status={status} />

              {items.length > 0 && (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      {item.products?.image_url ? (
                        <img
                          src={item.products.image_url}
                          alt={getProductName(item)}
                          className="w-14 h-14 object-cover rounded-xl border border-rose-50 shrink-0"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                          <Package size={20} className="text-rose-300" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-sm text-gray-700 truncate">{getProductName(item)}</p>
                        <p className="font-body text-xs text-muted-foreground">
                          {item.quantity} × {item.price_at_time.toFixed(2)} ₾
                        </p>
                      </div>
                      <span className="font-display text-sm text-gray-700 shrink-0">
                        {(item.quantity * item.price_at_time).toFixed(2)} ₾
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-rose-50/50 rounded-xl p-4 space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-rose-400 font-semibold mb-2">
                  {t('account_orders.delivery_to')}
                </p>
                {order.customer_name && (
                  <div className="flex items-center gap-2 text-xs font-body text-gray-600">
                    <User size={12} className="text-rose-300 shrink-0" />
                    {order.customer_name}
                  </div>
                )}
                {order.customer_phone && (
                  <div className="flex items-center gap-2 text-xs font-body text-gray-600">
                    <Phone size={12} className="text-rose-300 shrink-0" />
                    {order.customer_phone}
                  </div>
                )}
                {order.customer_address && (
                  <div className="flex items-center gap-2 text-xs font-body text-gray-600">
                    <MapPin size={12} className="text-rose-300 shrink-0" />
                    {order.customer_address}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-rose-50">
                <span className="text-[10px] font-body uppercase tracking-widest text-muted-foreground">
                  {t('checkout.total')}
                </span>
                <span className="font-display text-xl text-rose-600">
                  {order.total_price.toFixed(2)} ₾
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
