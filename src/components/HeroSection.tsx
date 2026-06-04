import type React from "react";
import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type Variants,
} from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

const containerVariants: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.18, delayChildren: 0.35 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20, filter: "blur(10px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 1.2, ease: [0.25, 0.1, 0.25, 1] },
  },
};

export const HeroSection = () => {
  const { t } = useTranslation();
  const showcaseRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = showcaseRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const handleScroll = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.pageYOffset - 100;
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <section className="relative w-full min-h-screen overflow-hidden flex items-center bg-gradient-to-br from-rose-50 via-white to-pink-100 text-slate-900">
      <AnimatedBackground />
      <GrainOverlay />
      <CornerFrame />

      {/* Vertical editorial side label */}
      <div className="pointer-events-none absolute left-6 top-1/2 -translate-y-1/2 z-20 hidden xl:block">
        <motion.span
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="block font-sans text-[10px] uppercase tracking-[0.5em] text-slate-400 [writing-mode:vertical-rl] rotate-180"
        >
          AVON2FLAME — Est. MMXXIV
        </motion.span>
      </div>

      <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 relative z-10 pt-28 pb-28 lg:pt-40 lg:pb-24">
        {/* LEFT — Typography & CTA */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="order-2 lg:order-1 flex flex-col justify-center items-center text-center lg:items-start lg:text-left space-y-6 lg:space-y-8 lg:pr-8"
        >
          <motion.div variants={itemVariants} className="mx-auto lg:mx-0 w-max">
            <CollectionBadge />
          </motion.div>

          <motion.div variants={itemVariants} className="flex items-center gap-3 text-slate-400">
            <span className="font-sans text-[11px] tracking-[0.3em]">01</span>
            <span className="h-px w-8 bg-slate-300" />
            <span className="font-sans text-[10px] uppercase tracking-[0.35em]">
              The Art of Glow
            </span>
          </motion.div>

          <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl xl:text-8xl 2xl:text-9xl font-light leading-[0.95] sm:leading-[0.92] tracking-tight text-slate-900">
            <motion.span variants={itemVariants} className="block">AURA.</motion.span>
            <motion.span variants={itemVariants} className="block text-[#D4AF37] italic">FLAME.</motion.span>
            <motion.span variants={itemVariants} className="block">GLOW.</motion.span>
          </h1>

          <motion.p
            variants={itemVariants}
            className="font-sans text-slate-600 max-w-md text-sm sm:text-base md:text-lg font-light leading-relaxed tracking-wide text-balance"
          >
            {t("hero.description")}
          </motion.p>

          <motion.div variants={itemVariants}>
            <MagneticButton label={t("hero.explore")} onClick={() => handleScroll("products")} />
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="flex items-center justify-center lg:justify-start gap-5 sm:gap-8 pt-2 lg:pt-4"
          >
            <Stat value={t("hero.stat1_value")} label={t("hero.stat1_label")} />
            <span className="h-8 w-px bg-slate-900/10" />
            <Stat value={t("hero.stat2_value")} label={t("hero.stat2_label")} />
            <span className="h-8 w-px bg-slate-900/10" />
            <Stat value={t("hero.stat3_value")} label={t("hero.stat3_label")} />
          </motion.div>
        </motion.div>

        {/* RIGHT — Floating showcase */}
        <div
          ref={showcaseRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="order-1 lg:order-2 relative h-[44vh] sm:h-[55vh] lg:h-[80vh] w-full flex items-center justify-center"
        >
          {/* Perfume — large, center anchor */}
          <ParallaxImage
            src="/images/blush-perfume.png"
            alt="Signature Eau de Parfum"
            caption="Signature Eau de Parfum"
            mouseX={mouseX}
            mouseY={mouseY}
            depth={22}
            className="absolute z-20 w-[48%] aspect-[3/4] left-[18%] top-1/2 -translate-y-1/2"
            floatDuration={6}
            floatOffset={18}
            delay={0.4}
          />
          {/* Jewelry — overlaps top-right of perfume */}
          <ParallaxImage
            src="/images/blush-jewelry.png"
            alt="Fine Jewelry"
            caption="Fine Jewelry"
            mouseX={mouseX}
            mouseY={mouseY}
            depth={42}
            className="absolute z-30 w-[42%] aspect-[3/4] right-[0%] top-[8%]"
            floatDuration={7.5}
            floatOffset={26}
            delay={0.6}
          />
          {/* Skincare — overlaps bottom-left of perfume */}
          <ParallaxImage
            src="/images/blush-skincare.png"
            alt="Radiance Serum"
            caption="Radiance Serum"
            mouseX={mouseX}
            mouseY={mouseY}
            depth={14}
            className="absolute z-10 w-[34%] aspect-[3/4] left-[2%] bottom-[8%]"
            floatDuration={9}
            floatOffset={14}
            delay={0.8}
          />

          {/* Decorative gold rings */}
          <motion.div
            aria-hidden
            initial={{ opacity: 0, scale: 0.8, rotate: -20 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1.4, ease: "easeOut", delay: 0.5 }}
            className="absolute inset-0 m-auto h-[72%] w-[72%] rounded-full border border-[#D4AF37]/20"
          />
          <motion.div
            aria-hidden
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            className="absolute inset-0 m-auto h-[88%] w-[88%] rounded-full border border-dashed border-[#D4AF37]/15"
          />
        </div>
      </div>

      {/* Scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 1 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 hidden lg:flex flex-col items-center gap-3"
      >
        <span className="font-sans text-[10px] uppercase tracking-[0.4em] text-slate-400">Scroll</span>
        <motion.span
          animate={{ scaleY: [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          className="h-10 w-px origin-top bg-gradient-to-b from-[#D4AF37] to-transparent"
        />
      </motion.div>

      <BrandMarquee />
    </section>
  );
};

export default HeroSection;

/* ─── Sub-components ──────────────────────────────────────────── */

function CollectionBadge() {
  return (
    <div className="group relative inline-flex items-center overflow-hidden rounded-full p-px">
      <motion.span
        aria-hidden
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        className="absolute inset-[-150%] z-0"
        style={{
          background:
            "conic-gradient(from 0deg, transparent 0deg, rgba(212,175,55,0) 200deg, #D4AF37 300deg, #f0d77b 330deg, #D4AF37 360deg)",
        }}
      />
      <span className="relative z-10 flex items-center gap-2.5 rounded-full bg-[linear-gradient(135deg,#fffdf7,#fdf4e8)] px-4 py-2 shadow-[0_4px_20px_-8px_rgba(212,175,55,0.6)]">
        <span className="relative flex h-1.5 w-1.5">
          <motion.span
            animate={{ scale: [1, 2.4, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2.2, repeat: Number.POSITIVE_INFINITY, ease: "easeOut" }}
            className="absolute inline-flex h-full w-full rounded-full bg-[#D4AF37]"
          />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#D4AF37]" />
        </span>
        <motion.span
          animate={{ rotate: [0, 15, -10, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        >
          <Sparkles className="h-3 w-3 text-[#D4AF37]" />
        </motion.span>
        <span className="relative overflow-hidden">
          <span className="font-sans text-[10px] font-medium uppercase tracking-[0.3em] text-transparent bg-clip-text bg-[linear-gradient(90deg,#9a7b1f,#caa53d,#9a7b1f)]">
            2026 Signature Collection
          </span>
          <motion.span
            aria-hidden
            animate={{ x: ["-120%", "220%"] }}
            transition={{ duration: 3.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", repeatDelay: 1.2 }}
            className="pointer-events-none absolute inset-y-0 left-0 w-1/3 skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/70 to-transparent"
          />
        </span>
      </span>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col">
      <span className="font-serif text-2xl text-slate-900">{value}</span>
      <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-slate-500">{label}</span>
    </div>
  );
}

function MagneticButton({ label, onClick }: { label: string; onClick: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 250, damping: 18 });
  const springY = useSpring(y, { stiffness: 250, damping: 18 });

  const handleMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - rect.left - rect.width / 2) * 0.4);
    y.set((e.clientY - rect.top - rect.height / 2) * 0.4);
  };

  const reset = () => { x.set(0); y.set(0); };

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      onClick={onClick}
      style={{ x: springX, y: springY }}
      whileTap={{ scale: 0.97 }}
      className="group relative flex items-center gap-3 w-max px-9 py-4 overflow-hidden border border-[#D4AF37]/40 bg-white/40 backdrop-blur-md shadow-[0_8px_30px_-12px_rgba(212,175,55,0.4)]"
    >
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-[#D4AF37]/0 via-[#D4AF37]/30 to-[#D4AF37]/0 transition-transform duration-700 ease-out group-hover:translate-x-full" />
      <span className="pointer-events-none absolute inset-0 bg-[#D4AF37] opacity-0 transition-opacity duration-500 group-hover:opacity-[0.12]" />
      <span className="relative z-10 font-sans tracking-[0.25em] uppercase text-[11px] text-slate-900 group-hover:text-[#B8941F] transition-colors duration-500">
        {label}
      </span>
      <ArrowRight className="relative z-10 w-4 h-4 text-[#D4AF37] transition-transform duration-500 group-hover:translate-x-1.5" />
    </motion.button>
  );
}

function ParallaxImage({
  src, alt, caption, mouseX, mouseY, depth, className, floatDuration, floatOffset, delay,
}: {
  src: string;
  alt: string;
  caption: string;
  mouseX: ReturnType<typeof useMotionValue<number>>;
  mouseY: ReturnType<typeof useMotionValue<number>>;
  depth: number;
  className?: string;
  floatDuration: number;
  floatOffset: number;
  delay: number;
}) {
  const px = useTransform(mouseX, [-0.5, 0.5], [-depth, depth]);
  const py = useTransform(mouseY, [-0.5, 0.5], [-depth, depth]);
  const springX = useSpring(px, { stiffness: 120, damping: 20 });
  const springY = useSpring(py, { stiffness: 120, damping: 20 });

  return (
    <motion.div
      style={{ x: springX, y: springY }}
      initial={{ opacity: 0, scale: 0.9, y: 60 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay }}
      className={className}
    >
      <motion.div
        animate={{ y: [-floatOffset / 2, floatOffset / 2, -floatOffset / 2] }}
        transition={{ duration: floatDuration, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        className="group relative h-full w-full"
      >
        <div className="relative h-full w-full overflow-hidden rounded-sm border border-white/60 shadow-[0_30px_70px_-25px_rgba(190,120,130,0.55)]">
          <img
            src={src}
            alt={alt}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white/30 via-transparent to-transparent" />
          <div className="absolute inset-0 ring-1 ring-inset ring-[#D4AF37]/25" />
        </div>
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-[#D4AF37]/30 bg-white/80 px-3 py-1 backdrop-blur-md shadow-sm opacity-0 translate-y-1 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0">
          <span className="font-sans text-[8px] uppercase tracking-[0.25em] text-slate-700">{caption}</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

function CornerFrame() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-20 hidden md:block">
      <div className="absolute left-6 top-6 h-10 w-10 border-l border-t border-[#D4AF37]/30" />
      <div className="absolute right-6 top-6 h-10 w-10 border-r border-t border-[#D4AF37]/30" />
      <div className="absolute left-6 bottom-6 h-10 w-10 border-l border-b border-[#D4AF37]/30" />
      <div className="absolute right-6 bottom-6 h-10 w-10 border-r border-b border-[#D4AF37]/30" />
    </div>
  );
}

function BrandMarquee() {
  const words = ["Timeless Elegance", "Premium Parfums", "Pure Radiance", "Signature Scent", "Eternal Glow"];
  return (
    <div className="absolute bottom-0 left-0 right-0 z-10 overflow-hidden border-t border-[#D4AF37]/15 bg-white/30 backdrop-blur-sm py-3">
      <motion.div
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 28, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        className="flex w-max items-center gap-10 pr-10"
      >
        {[...words, ...words, ...words, ...words].map((word, i) => (
          <span key={i} className="flex items-center gap-10 shrink-0">
            <span className="font-sans text-[10px] uppercase tracking-[0.35em] text-slate-500">{word}</span>
            <span className="text-[#D4AF37]/60">&#10022;</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}

function GrainOverlay() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[5] opacity-[0.04] mix-blend-multiply"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
      }}
    />
  );
}

function AnimatedBackground() {
  return (
    <div aria-hidden className="absolute inset-0 z-0">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_30%,rgba(212,175,55,0.10),transparent_55%)]" />
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(115deg, transparent 0px, transparent 38px, rgba(212,175,55,0.7) 39px, transparent 40px)",
        }}
      />
      <motion.div
        animate={{ x: ["-5%", "5%", "-5%"], y: ["-3%", "4%", "-3%"] }}
        transition={{ duration: 22, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        className="absolute -top-1/4 left-1/4 h-[60vh] w-[60vh] rounded-full bg-[radial-gradient(circle,rgba(244,194,194,0.5),transparent_60%)] blur-3xl"
      />
      <motion.div
        animate={{ x: ["4%", "-6%", "4%"], y: ["2%", "-5%", "2%"] }}
        transition={{ duration: 26, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        className="absolute bottom-0 right-1/4 h-[50vh] w-[50vh] rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.10),transparent_60%)] blur-3xl"
      />
    </div>
  );
}
