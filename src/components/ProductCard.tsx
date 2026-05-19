import { useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Product } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';
import { useIsMobile } from '@/hooks/use-mobile';

interface ProductCardProps {
  product: Product;
  index: number;
}

export const ProductCard = ({ product, index }: ProductCardProps) => {
  const { t, i18n } = useTranslation();
  const { addToCart } = useCart();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const currentLang = i18n.language || 'ka';
  const localizedName = (product[`name_${currentLang}` as keyof Product] || product.name) as string;

  // Directional animation logic
  const getInitialAnimation = () => {
    if (isMobile) {
      // Mobile 2 columns: 0 (left), 1 (right)
      return { opacity: 0, x: (index % 2 === 0 ? -50 : 50), y: 0 };
    } else {
      // Desktop 5 columns: 0,1 (left), 2 (bottom), 3,4 (right)
      const pos = index % 5;
      if (pos < 2) return { opacity: 0, x: -60, y: 0 };
      if (pos === 2) return { opacity: 0, x: 0, y: 60 };
      return { opacity: 0, x: 60, y: 0 };
    }
  };

  const initialAnim = getInitialAnimation();

  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["start end", "end start"]
  });

  const rotateY = useTransform(scrollYProgress, [0, 1], [-15, 15]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.95, 1, 0.95]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setMousePosition({ x, y });
  };

  const tiltX = isHovered ? (mousePosition.y - 0.5) * -15 : 0;
  const tiltY = isHovered ? (mousePosition.x - 0.5) * 15 : 0;

  return (
    <motion.div
      ref={cardRef}
      initial={initialAnim}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        duration: 1.2,
        ease: [0.16, 1, 0.3, 1],
        delay: (index % 5) * 0.1 // Slight staggered delay for smoothness
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group flex flex-col h-full relative"
      style={{
        transformStyle: 'preserve-3d',
        perspective: '1000px',
      }}
    >
      {/* Luxury Golden Glow Aura */}
      <div
        className="absolute -inset-4 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none blur-2xl"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(225, 29, 72, 0.3), rgba(244, 114, 182, 0.2), transparent 70%)',
          animation: isHovered ? 'pulse 2s ease-in-out infinite' : 'none',
        }}
      />

      {/* Main Card with 3D Tilt */}
      <motion.div
        className="relative flex flex-col h-full"
        animate={{
          rotateX: tiltX,
          rotateY: tiltY,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30
        }}
        style={{
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Premium Border Frame */}
        <div
          className="absolute -inset-[2px] rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(225, 29, 72, 0.6), rgba(244, 114, 182, 0.4), rgba(159, 18, 57, 0.6))',
            boxShadow: '0 0 30px rgba(225, 29, 72, 0.5), inset 0 0 20px rgba(244, 114, 182, 0.2)',
          }}
        />

        {/* Image Container */}
        <Link
          to={`/product/${product.id}`}
          className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900 mb-4 cursor-pointer rounded-xl group-hover:rounded-2xl transition-all duration-700 block"
          style={{
            transform: 'translateZ(20px)',
            boxShadow: isHovered
              ? '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 40px rgba(225, 29, 72, 0.3)'
              : '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Ambient Light Effect */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none"
            style={{
              background: `radial-gradient(circle at ${mousePosition.x * 100}% ${mousePosition.y * 100}%, rgba(255, 255, 255, 0.1), transparent 70%)`,
            }}
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-10 pointer-events-none" />

          <motion.img
            src={product.image_url}
            alt={product.name}
            style={{
              rotateY,
              scale,
              transformStyle: "preserve-3d"
            }}
            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105 group-hover:brightness-110 group-hover:contrast-105"
          />

          {/* Luxury Overlay with Button - Only show on desktop hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent backdrop-blur-[0.5px] transition-all duration-700 flex items-end justify-center pb-8 opacity-0 md:group-hover:opacity-100 z-20 pointer-events-none">
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                addToCart(product);
              }}
              className="font-body text-[11px] tracking-[0.25em] uppercase bg-gradient-to-r from-rose-200 via-pink-300 to-rose-200 text-black font-semibold hover:from-rose-300 hover:via-pink-400 hover:to-rose-300 hover:scale-110 transition-all duration-300 h-11 px-10 border-2 border-rose-400/50 shadow-2xl backdrop-blur-sm pointer-events-auto"
              style={{
                transform: 'translateY(20px) translateZ(40px)',
                animation: 'luxurySlideUp 0.6s ease-out forwards',
                boxShadow: '0 10px 40px rgba(225, 29, 72, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
              }}
            >
              {t('addToCart')}
            </Button>
          </div>

          {/* Premium Shimmer Effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none overflow-hidden">
            <div
              className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1500 ease-out"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(244, 114, 182, 0.4), rgba(255, 255, 255, 0.6), rgba(244, 114, 182, 0.4), transparent)',
                transform: 'skewX(-20deg)',
              }}
            />
          </div>

          {/* Sparkle Effects */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
            <div className="absolute top-[20%] left-[15%] w-1 h-1 bg-white rounded-full animate-sparkle" style={{ animationDelay: '0s' }} />
            <div className="absolute top-[40%] right-[20%] w-1 h-1 bg-rose-300 rounded-full animate-sparkle" style={{ animationDelay: '0.3s' }} />
            <div className="absolute bottom-[30%] left-[25%] w-1 h-1 bg-pink-200 rounded-full animate-sparkle" style={{ animationDelay: '0.6s' }} />
          </div>
        </Link>

        {/* Product Info */}
        <div
          className="text-center flex-1 flex flex-col px-2 relative z-10"
          style={{
            transform: 'translateZ(30px)',
          }}
        >
          <Link to={`/product/${product.id}`}>
            <h3 className="font-display text-base md:text-lg font-medium text-foreground mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-rose-600 group-hover:via-pink-500 group-hover:to-rose-600 transition-all duration-500 line-clamp-2 leading-tight group-hover:scale-105 group-hover:tracking-wide">
              {localizedName}
            </h3>
          </Link>
          <p className="font-body text-sm font-bold text-foreground mt-auto tracking-wider group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-rose-700 group-hover:via-pink-600 group-hover:to-rose-700 transition-all duration-500 group-hover:scale-110">
            {product.price} ₾
          </p>
        </div>
      </motion.div>

      <style>{`
        @keyframes luxurySlideUp {
          from {
            transform: translateY(20px) translateZ(40px);
            opacity: 0;
          }
          to {
            transform: translateY(0) translateZ(40px);
            opacity: 1;
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 0.5;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
        }

        @keyframes sparkle {
          0%, 100% {
            opacity: 0;
            transform: scale(0);
          }
          50% {
            opacity: 1;
            transform: scale(1.5);
          }
        }

        .animate-sparkle {
          animation: sparkle 2s ease-in-out infinite;
        }
      `}</style>
    </motion.div>
  );
};
