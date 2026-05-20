import { useParams, useNavigate } from "react-router-dom";
import { useProduct } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShoppingBag, Info, ShieldCheck, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import SEO from "@/components/SEO";
import { trackViewContent, trackAddToCart } from "@/utils/analytics";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: product, isLoading: loading, error } = useProduct(id);
    const { addToCart } = useCart();
    const { t, i18n } = useTranslation();

    useEffect(() => {
        if (product) {
            trackViewContent(product);
        }
    }, [product]);

    const handleAddToCart = (p: any) => {
        addToCart(p);
        trackAddToCart(p);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <Header onSearch={() => { }} />
                <div className="container mx-auto px-4 py-20 text-center">
                    <p className="font-body text-muted-foreground animate-pulse">Loading perfume details...</p>
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen bg-background">
                <Header onSearch={() => { }} />
                <div className="container mx-auto px-4 py-20 text-center">
                    <p className="font-body text-destructive mb-4">{error?.message || "Product not found"}</p>
                    <Button onClick={() => navigate('/')} variant="outline">
                        Back to Shop
                    </Button>
                </div>
            </div>
        );
    }

    const currentLang = i18n.language || 'ka';
    const localizedName = (product[`name_${currentLang}` as keyof typeof product] || product.name) as string;
    const localizedDescription = (product[`description_${currentLang}` as keyof typeof product] || product.description) as string;

    return (
        <div className="min-h-screen bg-background">
            <SEO
                title={`${localizedName} | Luxury Fragrance`}
                description={localizedDescription || `Experience the elegance of ${localizedName}. A premium fragrance available at AVON2FLAME.`}
                image={product.image_url}
            />
            <Header onSearch={() => { }} />

            <main className="container max-w-6xl mx-auto px-4 py-8 md:py-16">
                <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 group"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-body text-sm tracking-wide">Back</span>
                </motion.button>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                    {/* Product Image */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="lg:col-span-5 p-4 md:p-8 bg-black/5 rounded-none relative group border border-rose-500/10 shadow-2xl backdrop-blur-sm"
                    >
                        {/* Decorative Corners for Image */}
                        <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-rose-300/30" />
                        <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-rose-300/30" />
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-rose-300/30" />
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-rose-300/30" />

                        <div className="aspect-[4/5] overflow-hidden relative shadow-[0_0_50px_rgba(225,29,72,0.1)]">
                            <img
                                src={product.image_url}
                                alt={localizedName}
                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                            />
                            {/* Inner Glow */}
                            <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.2)] pointer-events-none" />
                        </div>
                    </motion.div>

                    {/* Product Details */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                        className="lg:col-span-7 flex flex-col h-full pl-0 lg:pl-10"
                    >
                        <div className="mb-8">
                            <h1 className="font-display text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight text-foreground mb-4 leading-none uppercase">
                                {localizedName}
                            </h1>
                            <div className="flex items-center gap-4">
                                <p className="font-display text-2xl md:text-4xl text-gold font-light">
                                    {product.price} ₾
                                </p>
                                <div className="h-[1px] flex-1 bg-gradient-to-r from-gold/30 to-transparent" />
                            </div>
                        </div>

                        <div className="space-y-8 mb-12">
                            <div className="pb-8 border-b border-border/40">
                                <h3 className="font-display text-[11px] font-bold uppercase tracking-[0.3em] mb-4 flex items-center gap-2 text-rose-500/80">
                                    <Info size={14} /> Description
                                </h3>
                                <p className="font-body text-muted-foreground leading-relaxed text-lg font-light">
                                    {localizedDescription || "A masterfully crafted fragrance that captures elegance in every note. Perfect for making a lasting impression."}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-8 pt-2">
                                <div className="flex items-start gap-4">
                                    <div className="p-2 rounded-full bg-rose-50 border border-rose-100">
                                        <ShieldCheck size={18} className="text-rose-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-display text-[10px] font-bold uppercase tracking-widest leading-none mb-1.5 text-foreground">Authentic</h4>
                                        <p className="font-body text-[9px] text-muted-foreground uppercase tracking-wider">100% Guaranteed</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="p-2 rounded-full bg-rose-50 border border-rose-100">
                                        <Truck size={18} className="text-rose-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-display text-[10px] font-bold uppercase tracking-widest leading-none mb-1.5 text-foreground">Fast Delivery</h4>
                                        <p className="font-body text-[9px] text-muted-foreground uppercase tracking-wider">Within Tbilisi</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.5 }}
                            className="mt-auto pt-8"
                        >
                            <Button
                                onClick={() => handleAddToCart(product)}
                                className="w-full h-16 uppercase tracking-[0.4em] text-[11px] font-body bg-gradient-to-r from-rose-200 via-pink-400 to-rose-200 text-black hover:from-rose-300 hover:via-pink-500 hover:to-rose-300 transition-all duration-500 flex items-center justify-center gap-3 border border-rose-500/30 shadow-[0_10px_40px_rgba(225,29,72,0.2)] hover:shadow-[0_15px_60px_rgba(225,29,72,0.4)] hover:scale-[1.02] active:scale-95 font-bold"
                            >
                                <ShoppingBag size={20} />
                                {t('addToCart', { defaultValue: 'Add to Cart' })}
                            </Button>
                        </motion.div>
                    </motion.div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-border py-12 mt-12 text-center opacity-80">
                <div className="container mx-auto px-4">
                    <p className="font-display text-xl tracking-[0.3em] text-foreground mb-3">
                        AVON2FLAME
                    </p>
                    <p className="font-body text-[10px] text-muted-foreground tracking-[0.2em] uppercase">
                        © 2024 All Rights Reserved
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default ProductDetails;

