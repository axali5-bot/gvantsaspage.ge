import { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { ProductGrid } from '@/components/ProductGrid';
import SEO from '@/components/SEO';
import { useProducts, Product } from '@/hooks/useProducts';
import { useCategories, Category } from '@/hooks/useCategories';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);

  const { data: products = [], isLoading: loading, error } = useProducts();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const name = product.name ?? '';
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesGender = selectedGender
        ? product.gender?.toLowerCase() === selectedGender.toLowerCase()
        : true;

      const matchesCategory = selectedCategory
        ? product.category_id === selectedCategory ||
        categories.find(c => c.id === product.category_id)?.parent_id === selectedCategory
        : true;

      const matchesSubcategory = selectedSubcategory
        ? product.category_id === selectedSubcategory
        : true;

      return matchesSearch && matchesGender && matchesCategory && matchesSubcategory;
    });
  }, [searchQuery, selectedGender, selectedCategory, selectedSubcategory, products, categories]);

  const parentCategories = useMemo(() => categories.filter(c => !c.parent_id), [categories]);
  const subcategories = useMemo(() =>
    selectedCategory ? categories.filter(c => c.parent_id === selectedCategory) : []
    , [categories, selectedCategory]);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="AVON2FLAME | Premium Luxury Perfumes"
        description="Welcome to AVON2FLAME. Discover our exclusive collection of premium fragrances from Avon and Oriflame. Luxury scents for every occasion."
      />
      <Header onSearch={setSearchQuery} />
      <HeroSection />

      <main id="products" className="container max-w-6xl mx-auto px-4 py-8 md:py-12 scroll-mt-32 md:scroll-mt-36">

        {/* Category Filter Section */}
        <div className="flex flex-col items-center mb-8 gap-6">
          <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8 pb-4 border-b border-border/40 w-full max-w-4xl">
            <button
              onClick={() => {
                setSelectedCategory(null);
                setSelectedSubcategory(null);
              }}
              className={`text-sm md:text-base font-display tracking-[0.2em] uppercase transition-all duration-300 py-1 ${selectedCategory === null ? 'text-rose-600 font-semibold' : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              All Types
            </button>
            {parentCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  setSelectedCategory(category.id);
                  setSelectedSubcategory(null);
                }}
                className={`text-sm md:text-base font-display tracking-[0.2em] uppercase transition-all duration-300 py-1 ${selectedCategory === category.id ? 'text-rose-600 font-semibold' : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                {category.name_ka}
              </button>
            ))}
          </div>

          {/* Subcategory Filter (only shown if parent selected has subcategories) */}
          <AnimatePresence>
            {subcategories.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-wrap justify-center items-center gap-3 md:gap-6"
              >
                <button
                  onClick={() => setSelectedSubcategory(null)}
                  className={`text-xs md:text-sm font-body tracking-wider uppercase px-4 py-1.5 rounded-full border transition-all duration-300 ${selectedSubcategory === null
                    ? 'bg-rose-600/10 border-rose-600/30 text-rose-600'
                    : 'border-border/60 text-muted-foreground hover:border-border hover:text-foreground'
                    }`}
                >
                  All {parentCategories.find(c => c.id === selectedCategory)?.name_ka}
                </button>
                {subcategories.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => setSelectedSubcategory(sub.id)}
                    className={`text-xs md:text-sm font-body tracking-wider uppercase px-4 py-1.5 rounded-full border transition-all duration-300 ${selectedSubcategory === sub.id
                      ? 'bg-rose-600/10 border-rose-600/30 text-rose-600'
                      : 'border-border/60 text-muted-foreground hover:border-border hover:text-foreground'
                      }`}
                  >
                    {sub.name_ka}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Gender Filter Section */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center gap-6 md:gap-10 pb-4 border-b border-border/40">
            {['ALL', 'WOMAN', 'MAN', 'UNISEX'].map((gender) => (
              <button
                key={gender}
                onClick={() => setSelectedGender(gender === 'ALL' ? null : gender)}
                className={`text-xs md:text-sm font-display tracking-[0.3em] transition-all duration-500 relative group py-2 ${(gender === 'ALL' && selectedGender === null) || selectedGender === gender
                  ? 'text-rose-600'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                {gender}
                <span className={`absolute -bottom-[17px] left-0 h-[1.5px] bg-rose-600 transition-all duration-500 ${(gender === 'ALL' && selectedGender === null) || selectedGender === gender ? 'w-full' : 'w-0 group-hover:w-full group-hover:opacity-50'
                  }`} />
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <p className="font-body text-muted-foreground">Loading products...</p>
          </div>
        ) : error ? (
          <div className="py-20 text-center">
            <p className="font-body text-destructive">{error.message}</p>
          </div>
        ) : (
          <ProductGrid products={filteredProducts} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="font-display text-lg tracking-wider text-foreground mb-2">
            AVON2FLAME
          </p>
          <p className="font-body text-xs text-muted-foreground tracking-wide">
            © 2026 All Rights Reserved
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
