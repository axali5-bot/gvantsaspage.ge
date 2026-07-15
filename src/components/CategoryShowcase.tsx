import { motion } from 'framer-motion';

export interface CategoryTile {
  id: string;
  name: string;
  image: string | null;
}

interface CategoryShowcaseProps {
  tiles: CategoryTile[];
  selected: string | null;
  onSelect: (id: string | null) => void;
}

/**
 * "Shop by Category" — a row of photographic tiles between the hero and the
 * product grid. Each tile borrows a representative product image, so it needs
 * no extra assets. Selecting a tile drives the same category filter the pills use.
 */
export const CategoryShowcase = ({ tiles, selected, onSelect }: CategoryShowcaseProps) => {
  if (tiles.length === 0) return null;

  return (
    <section className="container max-w-6xl mx-auto px-4 pt-12 md:pt-16">
      <div className="flex items-center justify-center gap-3 mb-8">
        <span className="h-px w-8 bg-[#D4AF37]/40" />
        <h2 className="font-display text-lg md:text-2xl tracking-[0.25em] uppercase text-slate-800 text-center">
          დაათვალიერე კატეგორიები
        </h2>
        <span className="h-px w-8 bg-[#D4AF37]/40" />
      </div>

      <div
        className="grid gap-3 md:gap-4"
        style={{ gridTemplateColumns: `repeat(${Math.min(tiles.length, 3)}, minmax(0, 1fr))` }}
      >
        {tiles.map((tile, i) => {
          const isActive = selected === tile.id;
          return (
            <motion.button
              key={tile.id}
              type="button"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => onSelect(isActive ? null : tile.id)}
              className={`group relative aspect-[4/5] sm:aspect-[3/4] overflow-hidden rounded-2xl border transition-all duration-500 ${
                isActive
                  ? 'border-[#D4AF37] shadow-[0_10px_40px_-12px_rgba(212,175,55,0.5)]'
                  : 'border-white/60 hover:border-[#D4AF37]/50 shadow-[0_10px_30px_-15px_rgba(190,120,130,0.5)]'
              }`}
            >
              {tile.image ? (
                <img
                  src={tile.image}
                  alt={tile.name}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-110"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-rose-100 via-white to-pink-100" />
              )}

              {/* Legibility scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
              {/* Gold inner ring on hover/active */}
              <div
                className={`absolute inset-0 rounded-2xl ring-1 ring-inset transition-opacity duration-500 ${
                  isActive ? 'ring-[#D4AF37]/60 opacity-100' : 'ring-[#D4AF37]/30 opacity-0 group-hover:opacity-100'
                }`}
              />

              {/* Label */}
              <div className="absolute inset-x-0 bottom-0 p-4 md:p-5 flex flex-col items-center">
                <span className="font-display text-white text-base md:text-xl tracking-[0.15em] uppercase drop-shadow-md text-center leading-tight">
                  {tile.name}
                </span>
                <span
                  className={`mt-2 h-[2px] bg-[#D4AF37] transition-all duration-500 ${
                    isActive ? 'w-10' : 'w-0 group-hover:w-10'
                  }`}
                />
              </div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
};
