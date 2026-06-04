import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Search, X, ArrowUpRight } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal = ({ isOpen, onClose }: SearchModalProps) => {
  const { t, i18n } = useTranslation();
  const [search, setSearch] = useState('');
  const { data: products = [] } = useProducts();
  const { data: categories = [] } = useCategories();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const isKa = i18n.language === 'ka';

  const filteredProducts = products
    .filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase())
    )
    .slice(0, 5);

  const popularCategories = categories.filter(c => !c.parent_id).slice(0, 5);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setSearch('');
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleProductClick = (id: string) => {
    navigate(`/product/${id}`);
    onClose();
  };

  const handleCategoryClick = () => {
    navigate('/#products');
    onClose();
  };

  const overlay = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[200]"
          style={{ backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', backgroundColor: 'rgba(250, 248, 246, 0.85)' }}
          onClick={onClose}
        >
          {/* Subtle gradient accent */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-rose-300/60 to-transparent" />

          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
            className="h-full overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="max-w-4xl mx-auto px-8 md:px-12 py-12 md:py-20">

              {/* ── SEARCH INPUT ──────────────────────────────── */}
              <div className="relative mb-16 md:mb-24 group">
                <div className="flex items-center gap-6">
                  <Search
                    size={22}
                    className="text-rose-400 flex-shrink-0 mt-1"
                    strokeWidth={1.5}
                  />
                  <input
                    ref={inputRef}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder={isKa ? 'რა გეძებნება?' : 'What are you looking for?'}
                    className="w-full bg-transparent font-display text-4xl sm:text-6xl md:text-7xl tracking-tight text-foreground placeholder:text-foreground/10 border-none outline-none ring-0 focus:ring-0"
                  />
                </div>
                {/* Animated underline */}
                <div className="mt-6 ml-[46px] h-[1px] bg-foreground/8">
                  <motion.div
                    className="h-full bg-gradient-to-r from-rose-400 via-rose-300 to-transparent"
                    initial={{ width: '0%' }}
                    animate={{ width: search ? '100%' : '30%' }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </div>

              {/* ── CONTENT ───────────────────────────────────── */}
              <AnimatePresence mode="wait">

                {/* Empty state: categories + curated */}
                {!search && (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-20"
                  >
                    {/* Categories — horizontal pill row */}
                    <div>
                      <p className="ml-[46px] mb-8 text-[10px] tracking-[0.5em] uppercase font-body font-semibold text-foreground/25">
                        {isKa ? 'კოლექციები' : 'Collections'}
                      </p>
                      <div className="ml-[46px] flex flex-wrap gap-3">
                        {popularCategories.map((cat, i) => (
                          <motion.button
                            key={cat.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.07, duration: 0.4 }}
                            onClick={handleCategoryClick}
                            className="group px-6 py-3 rounded-full border border-foreground/10 text-sm font-body tracking-[0.15em] uppercase text-foreground/50 hover:text-foreground hover:border-rose-400 hover:bg-rose-50 transition-all duration-300"
                          >
                            {isKa ? cat.name_ka : cat.name_en}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Curated — editorial list, no cards */}
                    <div>
                      <p className="ml-[46px] mb-8 text-[10px] tracking-[0.5em] uppercase font-body font-semibold text-foreground/25">
                        {isKa ? 'რჩეული პროდუქტები' : 'Selected for You'}
                      </p>
                      <div className="space-y-0">
                        {products.slice(0, 4).map((product, i) => (
                          <motion.button
                            key={product.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.06 + 0.1, duration: 0.4 }}
                            onClick={() => handleProductClick(product.id)}
                            className="group w-full flex items-center gap-6 py-5 ml-[46px] border-b border-foreground/[0.04] hover:border-rose-200 transition-all duration-300 text-left"
                          >
                            {/* Thumbnail */}
                            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-secondary/30 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity duration-500">
                              {product.image_url && (
                                <img
                                  src={product.image_url}
                                  alt={product.name}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                />
                              )}
                            </div>

                            {/* Name */}
                            <span className="flex-1 font-display text-xl md:text-2xl text-foreground/40 group-hover:text-foreground transition-colors duration-300">
                              {product.name}
                            </span>

                            {/* Price */}
                            <span className="font-body text-sm text-foreground/25 tracking-widest group-hover:text-rose-500 transition-colors">
                              {product.price} ₾
                            </span>

                            {/* Arrow */}
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-foreground/10 group-hover:text-rose-500 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300">
                              <ArrowUpRight size={18} strokeWidth={1.5} />
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Search results */}
                {search && (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <p className="ml-[46px] mb-8 text-[10px] tracking-[0.5em] uppercase font-body font-semibold text-foreground/25">
                      {filteredProducts.length} {isKa ? 'შედეგი' : 'Results'}
                    </p>

                    {filteredProducts.length > 0 ? (
                      <div className="space-y-0">
                        {filteredProducts.map((product, i) => (
                          <motion.button
                            key={product.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            onClick={() => handleProductClick(product.id)}
                            className="group w-full flex items-center gap-6 py-5 ml-[46px] border-b border-foreground/[0.04] hover:border-rose-200 transition-all duration-300 text-left"
                          >
                            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-secondary/30 flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity duration-500">
                              {product.image_url && (
                                <img
                                  src={product.image_url}
                                  alt={product.name}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                />
                              )}
                            </div>
                            <span className="flex-1 font-display text-2xl md:text-3xl text-foreground/50 group-hover:text-foreground transition-colors duration-300">
                              {product.name}
                            </span>
                            <span className="font-body text-sm text-foreground/25 tracking-widest group-hover:text-rose-500 transition-colors">
                              {product.price} ₾
                            </span>
                            <div className="w-8 h-8 flex items-center justify-center text-foreground/10 group-hover:text-rose-500 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300">
                              <ArrowUpRight size={18} strokeWidth={1.5} />
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    ) : (
                      <div className="ml-[46px] py-24">
                        <p className="font-display text-4xl text-foreground/10 tracking-tight">
                          {isKa ? 'ვერაფერი ვიპოვეთ' : 'Nothing found'}
                        </p>
                        <p className="font-body text-sm text-foreground/20 mt-4 tracking-widest uppercase">
                          {isKa ? 'სხვა საძიებო სიტყვა სცადეთ' : 'Try a different word'}
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Close button */}
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ delay: 0.2 }}
            onClick={onClose}
            className="fixed top-8 right-8 z-[201] w-12 h-12 rounded-full bg-white/70 backdrop-blur-sm shadow-sm flex items-center justify-center text-foreground/30 hover:text-rose-500 hover:scale-110 transition-all duration-300 border border-foreground/5"
          >
            <X size={20} strokeWidth={1.5} />
          </motion.button>

          {/* Keyboard hint */}
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 text-[9px] tracking-[0.4em] uppercase font-body text-foreground/20">
            <span>Esc — {isKa ? 'დახურვა' : 'Close'}</span>
            <span className="w-1 h-1 rounded-full bg-foreground/15 inline-block" />
            <span>Enter — {isKa ? 'გახსნა' : 'Open'}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(overlay, document.body);
};
