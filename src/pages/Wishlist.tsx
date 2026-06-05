import { Header } from "@/components/Header";
import { useWishlist } from "@/hooks/useWishlist";
import { ProductGrid } from "@/components/ProductGrid";
import SEO from "@/components/SEO";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Wishlist = () => {
    const { wishlist } = useWishlist();
    const { t } = useTranslation();

    return (
        <div className="min-h-screen bg-background">
            <SEO
                title="Wishlist | Gvantsa's Page"
                description="Your favorite products saved for later."
            />
            <Header onSearch={() => { }} />

            <main className="container max-w-6xl mx-auto px-4 py-8 md:py-16">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <div className="flex justify-center mb-6">
                        <div className="p-4 rounded-full bg-rose-50 border border-rose-100/50 relative overflow-hidden group">
                            <Heart size={32} className="text-rose-500 fill-rose-50/50 z-10 relative" />
                            <div className="absolute inset-0 bg-rose-100 scale-0 origin-center transition-transform duration-500 group-hover:scale-100" />
                        </div>
                    </div>
                    <h1 className="font-display text-4xl lg:text-5xl tracking-[0.2em] uppercase text-foreground mb-4">
                        {t('wishlist', { defaultValue: 'Wishlist' })}
                    </h1>
                    <p className="font-body text-muted-foreground/80 lowercase tracking-widest text-sm">
                        gvantsa's page
                    </p>
                </motion.div>

                {wishlist.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-center py-20"
                    >
                        <p className="font-display text-xl text-muted-foreground tracking-widest mb-8 uppercase">
                            {t('emptyWishlist', { defaultValue: 'Your wishlist is currently empty' })}
                        </p>
                        <Link to="/catalog">
                            <Button className="h-14 px-8 uppercase tracking-[0.2em] text-xs font-body bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors duration-300 font-semibold border border-rose-200">
                                {t('continueShopping', { defaultValue: 'Continue Shopping' })}
                            </Button>
                        </Link>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                    >
                        <ProductGrid products={wishlist} />
                    </motion.div>
                )}
            </main>
        </div>
    );
};

export default Wishlist;
