import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/Header';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, Sparkles, BookOpen } from 'lucide-react';
import FlipbookViewer from '@/components/FlipbookViewer';
import SEO from '@/components/SEO';

interface CatalogData {
    brand: string;
    type: 'link' | 'pdf' | 'flipbook';
    url: string | null;
    pdf_path: string | null;
    is_active: boolean;
}

interface FlipbookPage {
    id: string;
    image_url: string;
    page_number: number;
}

const Catalog = () => {
    const { t } = useTranslation();
    const [catalogs, setCatalogs] = useState<CatalogData[]>([]);
    const [catalogPages, setCatalogPages] = useState<Record<string, FlipbookPage[]>>({});
    const [loading, setLoading] = useState(true);
    const [searchQuery] = useState('');
    const [activeFlipbook, setActiveFlipbook] = useState<string | null>(null);

    useEffect(() => {
        const fetchCatalogs = async () => {
            try {
                // 1. Fetch catalogs config
                const { data, error } = await supabase
                    .from('catalogs')
                    .select('*');

                if (error) throw error;

                if (data) {
                    const mappedData = data
                        .filter(item => (item as any).is_active !== false)
                        .map(item => ({
                            ...item,
                            type: (['link', 'pdf', 'flipbook'].includes(item.type) ? item.type : 'link') as 'link' | 'pdf' | 'flipbook',
                            is_active: (item as any).is_active ?? true,
                        }));
                    setCatalogs(mappedData);

                    // 2. Fetch pages for flipbooks
                    const flipbookBrands = mappedData.filter(c => c.type === 'flipbook').map(c => c.brand);

                    if (flipbookBrands.length > 0) {
                        const { data: pagesData, error: pagesError } = await supabase
                            .from('catalog_pages')
                            .select('*')
                            .in('brand', flipbookBrands)
                            .order('page_number', { ascending: true });

                        if (pagesError) console.error('Error fetching pages:', pagesError);

                        if (pagesData) {
                            const pagesByBrand: Record<string, FlipbookPage[]> = {};
                            pagesData.forEach(page => {
                                if (!pagesByBrand[page.brand]) {
                                    pagesByBrand[page.brand] = [];
                                }
                                pagesByBrand[page.brand].push(page);
                            });
                            setCatalogPages(pagesByBrand);
                        }
                    }
                }
            } catch (err: any) {
                console.error('Error fetching catalogs:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchCatalogs();
    }, []);

    const avon = catalogs.find(c => c.brand === 'avon');
    const oriflame = catalogs.find(c => c.brand === 'oriflame');

    const renderCatalogCard = (catalog: CatalogData | undefined, brandName: string) => {
        if (!catalog) return null;

        const pages = catalogPages[brandName] || [];
        const isFlipbook = catalog.type === 'flipbook';
        const isPdf = catalog.type === 'pdf';
        const link = isPdf ? catalog.pdf_path : catalog.url;

        // Don't render an empty card — nothing to show the customer
        const hasContent =
            (isFlipbook && pages.length > 0) ||
            (isPdf && !!catalog.pdf_path) ||
            (!isFlipbook && !isPdf && !!catalog.url);
        if (!hasContent) return null;

        // Check if we are viewing this flipbook
        const isViewingFlipbook = activeFlipbook === brandName;

        if (isViewingFlipbook && pages.length > 0) {
            return (
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                    className="mb-12 relative"
                >
                    <Button
                        variant="ghost"
                        className="mb-4 hover:bg-transparent hover:text-amber-500 p-0"
                        onClick={() => setActiveFlipbook(null)}
                    >
                        ← {t('Back to Overview', { defaultValue: 'უკან დაბრუნება' })}
                    </Button>
                    <FlipbookViewer pages={pages} brand={brandName.toUpperCase()} />
                </motion.div>
            );
        }

        // Brand-specific styling
        const isAvon = brandName === 'avon';
        const gradientClass = isAvon
            ? 'from-rose-400 via-pink-500 to-amber-500'
            : 'from-blue-400 via-indigo-500 to-purple-600';
        const brandTitle = isAvon ? t('catalog.avon') : t('catalog.oriflame');
        const brandDescription = isAvon
            ? "აღმოაჩინეთ უახლესი არომატების და სილამაზის კოლექციები Avon-დან"
            : "გაეცანით შვედურ სილამაზის და ველნეს პროდუქტებს Oriflame-დან";

        return (
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="group"
            >
                {/* Cover Card */}
                <div className="glass-morphism rounded-3xl overflow-hidden border border-white/10 hover:border-white/30 transition-all duration-500 hover:shadow-2xl hover:shadow-amber-500/20">
                    {/* Gradient Cover Section */}
                    <div className={`relative h-72 md:h-96 bg-gradient-to-br ${gradientClass} overflow-hidden`}>
                        {/* Animated Pattern Overlay */}
                        <div className="absolute inset-0 opacity-20">
                            <div className="absolute inset-0" style={{
                                backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%),
                                                 radial-gradient(circle at 80% 80%, rgba(255,255,255,0.2) 0%, transparent 50%)`,
                                animation: 'pulse 4s ease-in-out infinite'
                            }} />
                        </div>

                        {/* Floating Sparkles */}
                        <motion.div
                            animate={{
                                y: [0, -20, 0],
                                opacity: [0.5, 1, 0.5]
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="absolute top-8 right-8"
                        >
                            <Sparkles className="w-12 h-12 text-white/60" />
                        </motion.div>

                        <motion.div
                            animate={{
                                y: [0, -15, 0],
                                opacity: [0.3, 0.7, 0.3]
                            }}
                            transition={{
                                duration: 4,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: 1
                            }}
                            className="absolute bottom-12 left-12"
                        >
                            <Sparkles className="w-8 h-8 text-white/40" />
                        </motion.div>

                        {/* Brand Name Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <motion.h2
                                whileHover={{ scale: 1.05 }}
                                className="font-display text-5xl md:text-7xl tracking-[0.3em] text-white/90 uppercase drop-shadow-2xl"
                            >
                                {brandName}
                            </motion.h2>
                        </div>

                        {/* Bottom Gradient Fade */}
                        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-background/80 to-transparent" />
                    </div>

                    {/* Content Section */}
                    <div className="p-8 md:p-10 bg-background/95 backdrop-blur-sm">
                        <h3 className="font-display text-2xl md:text-3xl tracking-widest text-foreground mb-3">
                            {brandTitle}
                        </h3>
                        <p className="font-body text-sm md:text-base text-muted-foreground mb-6 leading-relaxed">
                            {brandDescription}
                        </p>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-4">
                            {isFlipbook && (
                                <Button
                                    variant="default"
                                    size="lg"
                                    className="bg-amber-600 hover:bg-amber-700 text-white gap-2 px-6 py-6 rounded-xl shadow-lg hover:shadow-amber-500/50 transition-all duration-300 hover:scale-105"
                                    onClick={() => setActiveFlipbook(brandName)}
                                >
                                    <BookOpen className="w-5 h-5" />
                                    <span className="font-display tracking-wider">კატალოგის დათვალიერება</span>
                                </Button>
                            )}

                            {!isFlipbook && !isPdf && link && (
                                <Button
                                    variant="default"
                                    size="lg"
                                    className="bg-amber-600 hover:bg-amber-700 text-white gap-2 px-6 py-6 rounded-xl shadow-lg hover:shadow-amber-500/50 transition-all duration-300 hover:scale-105"
                                    onClick={() => window.open(link, '_blank')}
                                >
                                    <ExternalLink className="w-5 h-5" />
                                    <span className="font-display tracking-wider">კატალოგის ნახვა</span>
                                </Button>
                            )}

                            {isPdf && link && (
                                <Button
                                    variant="default"
                                    size="lg"
                                    className="bg-amber-600 hover:bg-amber-700 text-white gap-2 px-6 py-6 rounded-xl shadow-lg hover:shadow-amber-500/50 transition-all duration-300 hover:scale-105"
                                    onClick={() => window.open(link, '_blank')}
                                >
                                    <Download className="w-5 h-5" />
                                    <span className="font-display tracking-wider">{t('catalog.download')}</span>
                                </Button>
                            )}
                        </div>

                        {/* Decorative Line */}
                        <div className="mt-6 h-0.5 w-full bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
                    </div>
                </div>
            </motion.div>
        );
    };

    return (
        <div className="min-h-screen bg-background">
            <SEO
                title={t('catalog.title')}
                description="Browse our latest digital catalogs from Avon and Oriflame. Discover new arrivals, exclusive offers, and the full range of our luxury fragrance collection."
            />
            <Header onSearch={() => {}} />

            <main className="container max-w-7xl mx-auto px-4 py-16 md:py-24">
                {/* Page Header */}
                <div className="text-center mb-16 md:mb-20">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="font-display text-4xl md:text-6xl lg:text-7xl tracking-[0.2em] uppercase text-foreground mb-4">
                            {t('catalog.title')}
                        </h1>
                        <div className="h-1 w-32 bg-gradient-to-r from-rose-500 via-amber-500 to-purple-500 mx-auto rounded-full" />
                        <p className="font-body text-muted-foreground mt-6 text-sm md:text-base max-w-2xl mx-auto">
                            აღმოაჩინეთ პრემიუმ სუნამოების და სილამაზის პროდუქტების სრული კატალოგები
                        </p>
                    </motion.div>
                </div>

                {/* Catalog Cards */}
                {loading ? (
                    <div className="flex justify-center py-32">
                        <div className="text-center">
                            <div className="animate-spin w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4" />
                            <div className="text-amber-500 font-display tracking-widest text-lg">იტვირთება...</div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {renderCatalogCard(avon, 'avon')}
                        {renderCatalogCard(oriflame, 'oriflame')}
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="border-t border-border py-8 mt-16 md:mt-24">
                <div className="container mx-auto px-4 text-center">
                    <p className="font-display text-lg tracking-wider text-foreground mb-2">
                        AVON2FLAME
                    </p>
                    <p className="font-body text-xs text-muted-foreground tracking-wide">
                        © 2024 All Rights Reserved
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default Catalog;
