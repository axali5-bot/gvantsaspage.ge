import { ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const EmptyOrders = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <ShoppingBag size={64} className="text-rose-300 mb-6" strokeWidth={1} />
      <h2 className="font-display text-2xl font-light text-rose-400/80 mb-3">
        {t('empty_orders.title')}
      </h2>
      <p className="font-body text-sm text-muted-foreground mb-8 max-w-xs">
        {t('empty_orders.subtitle')}
      </p>
      <Link
        to="/"
        className="px-8 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-full font-body text-sm tracking-widest uppercase transition-colors"
      >
        {t('empty_orders.cta')}
      </Link>
    </div>
  );
};
