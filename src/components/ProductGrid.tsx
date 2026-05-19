import { useTranslation } from 'react-i18next';
import { ProductCard } from './ProductCard';
import { Product } from '@/hooks/useProducts';

interface ProductGridProps {
  products: Product[];
}

export const ProductGrid = ({ products }: ProductGridProps) => {
  const { t } = useTranslation();

  if (products.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="font-body text-muted-foreground">{t('noProducts')}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-8">
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          index={index}
        />
      ))}
    </div>
  );
};