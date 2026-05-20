import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { Sparkles, Diamond, Crown } from 'lucide-react';

export const HeroSection = () => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);

  // Use scrollY for vertical parallax
  const { scrollY } = useScroll();

  // Mouse Tracking for Interactive Parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for mouse movement
  const smoothX = useSpring(mouseX, { damping: 50, stiffness: 200 });
  const smoothY = useSpring(mouseY, { damping: 50, stiffness: 200 });

  // Transform mapping scroll to vertical movement (Direct Parallax)
  const scrollParallaxY = useTransform(scrollY, [0, 1000], [0, 400]);

  // Tilt and translation transforms for mouse interaction
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [5, -5]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-5, 5]);

  // Mouse-based parallax layers
  const mouseLayer1X = useTransform(smoothX, [-0.5, 0.5], [-10, 10]);
  const mouseLayer1Y = useTransform(smoothY, [-0.5, 0.5], [-10, 10]);

  const mouseLayer2X = useTransform(smoothX, [-0.5, 0.5], [-20, 20]);
  const mouseLayer2Y = useTransform(smoothY, [-0.5, 0.5], [-20, 20]);

  const opacity = useTransform(scrollY, [0, 500], [1, 0]);
  const scale = useTransform(scrollY, [0, 500], [1, 0.95]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth) - 0.5;
      const y = (e.clientY / innerHeight) - 0.5;
      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  const handleScroll = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative h-[50vh] sm:h-[65vh] md:h-[85vh] w-full overflow-hidden bg-black selection:bg-gold/20 mb-8 md:mb-20"
    >
      {/* Layer 1: Parallax Background Image */}
      <motion.div
        style={{
          y: scrollParallaxY, // Traditional scroll-based parallax
          x: mouseLayer1X,   // Combined with subtle interactive movement
          opacity
        }}
        className="absolute inset-0 z-0 h-[120%] w-full" // Extra height to allow parallax movement
      >
        <div className="absolute inset-0 bg-black/40 z-10" /> {/* Slightly darker overlay for mobile legibility */}
        <img
          src="/images/perfume-collection-hero.jpg"
          alt="Premium Perfume Collection"
          className="w-full h-full object-cover object-center brightness-90 transition-all duration-1000"
        />
      </motion.div>

      {/* Layer 2: Floating Brand Elements - Hidden on small mobile to reduce clutter */}
      <motion.div
        style={{
          x: mouseLayer2X,
          y: useTransform(scrollY, [0, 1000], [0, 200]),
          opacity
        }}
        className="absolute inset-0 z-10 pointer-events-none hidden sm:block"
      >
        <motion.div
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[15%] left-[10%] text-white/20"
        >
          <Crown size={30} strokeWidth={1} />
        </motion.div>

        <motion.div
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-[25%] right-[10%] text-white/10"
        >
          <Diamond size={50} strokeWidth={1} />
        </motion.div>
      </motion.div>

      {/* Layer 3: Central Content */}
      <div className="relative z-30 h-full flex flex-col items-center justify-center text-center px-4">
        <motion.div
          style={{
            rotateX,
            rotateY,
            scale,
            opacity
          }}
          className="relative max-w-full"
        >
          <div className="space-y-4 md:space-y-6 relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="flex flex-col items-center relative"
            >
              <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-white/40 mb-2 md:mb-3 drop-shadow-md" />

              <div className="relative group">
                <h1 className="font-display text-4xl sm:text-6xl md:text-9xl font-bold text-white tracking-[0.1em] drop-shadow-[0_20px_60px_rgba(0,0,0,0.8)] leading-none">
                  AVON
                </h1>
                <h2 className="font-display text-lg sm:text-2xl md:text-5xl font-light text-white/80 tracking-[0.3em] mt-3 md:mt-4 opacity-90">
                  2 FLAME
                </h2>

                {/* Stylized Underline */}
                <div className="mt-3 md:mt-6 relative h-[1px] md:h-[2px] w-full max-w-[200px] md:max-w-[500px] mx-auto overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
                  <motion.div
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-gold to-transparent"
                  />
                </div>
              </div>

              <div className="h-[1px] w-20 md:w-40 bg-gradient-to-r from-transparent via-white/30 to-transparent mt-4 md:mt-10" />
            </motion.div>

            <p className="font-body text-[9px] md:text-sm text-white/50 uppercase tracking-[0.3em] md:tracking-[0.4em] font-medium max-w-[240px] md:max-w-md mx-auto drop-shadow-md">
              {t('hero.subtitle', { defaultValue: 'Pure Elegance • Fresh Heritage' })}
            </p>

            <div className="pt-6 md:pt-14">
              <Button
                size="lg"
                onClick={(e) => handleScroll('products', e)}
                className="font-body text-[9px] md:text-[11px] tracking-[0.2em] md:tracking-[0.3em] font-semibold uppercase bg-gradient-to-r from-rose-200 via-pink-400 to-rose-200 text-black hover:from-rose-300 hover:via-pink-500 hover:to-rose-300 transition-all duration-500 h-10 md:h-14 px-6 md:px-12 rounded-full border border-rose-500/30 shadow-[0_0_20px_rgba(225,29,72,0.15)] hover:shadow-[0_0_50px_rgba(225,29,72,0.4)] hover:scale-105"
              >
                {t('hero.shop_now')}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Subtle darkening at the very bottom to separate from product section */}
      <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-black to-transparent z-20 pointer-events-none opacity-40" />
    </div>
  );
};
