import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface Product {
  id: string;
  name: string;
  name_ka?: string;
  name_en?: string;
  name_ru?: string;
  description: string;
  description_ka?: string;
  description_en?: string;
  description_ru?: string;
  price: number;
  image_url: string;
  category_id: string;
  stock_quantity: number;
  created_at: string;
  gender?: string;
}

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedProducts: Product[] = (data || []).map((item: any) => ({
        ...item,
        name: item.name_ka || item.name_en || item.name_ru || item.name || '',
        description: item.description_ka || item.description_en || item.description_ru || item.description || '',
      }));

      setProducts(mappedProducts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return { products, loading, error, refetch: fetchProducts };
};

export const useProduct = (id: string | undefined) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        if (data) {
          const rawData = data as any;
          const mappedProduct: Product = {
            ...rawData,
            name: rawData.name_ka || rawData.name_en || rawData.name_ru || rawData.name || '',
            description: rawData.description_ka || rawData.description_en || rawData.description_ru || rawData.description || '',
          };
          setProduct(mappedProduct);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  return { product, loading, error };
};
