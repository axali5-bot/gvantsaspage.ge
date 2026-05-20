import { Header } from '@/components/Header';
import { useTranslation } from 'react-i18next';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useRef } from 'react';
import { Diamond, Sparkles, History, MapPin } from 'lucide-react';
import SEO from '@/components/SEO';

const AboutUs = () => {
    const { i18n } = useTranslation();
    const isKa = i18n.language === 'ka';
    const containerRef = useRef<HTMLDivElement>(null);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    const scale = useTransform(smoothProgress, [0, 0.2], [1, 1.1]);
    const opacity = useTransform(smoothProgress, [0, 0.1], [1, 0]);
    const y = useTransform(smoothProgress, [0, 0.2], [0, -100]);

    const sections = [
        {
            icon: <Sparkles className="w-8 h-8" />,
            title: isKa ? 'ხარისხი' : 'Excellence',
            description: isKa ? 'მხოლოდ უმაღლესი ხარისხის ინგრედიენტები და ოსტატური კომპოზიციები.' : 'Only the highest quality ingredients and masterful compositions.',
            delay: 0.1
        },
        {
            icon: <Diamond className="w-8 h-8" />,
            title: isKa ? 'ელეგანტურობა' : 'Elegance',
            description: isKa ? 'დახვეწილი გამოცდილება პირველივე გაფრქვევიდან ბოლო ნოტამდე.' : 'A sophisticated experience from the first spray to the final note.',
            delay: 0.2
        },
        {
            icon: <History className="w-8 h-8" />,
            title: isKa ? 'ტრადიცია' : 'Heritage',
            description: isKa ? 'ტრადიციული ხელოვნებისა და თანამედროვე ინოვაციების შერწყმა.' : 'Connecting traditional artistry with modern fragrance innovation.',
            delay: 0.3
        }
    ];

    const fadeInVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: {
                delay: i * 0.2,
                duration: 0.8,
                ease: "easeOut"
            }
        })
    } as any;

    return (
        <div ref={containerRef} className="min-h-[200vh] bg-background selection:bg-gold/30">
            <SEO
                title={isKa ? 'ჩვენს შესახებ' : 'Our Story'}
                description="Learn about the heritage and mission of AVON2FLAME. Discover our commitment to excellence and elegance in the world of luxury fragrances since 2024."
            />
            <Header onSearch={() => { }} />

            {/* Hero Section with Parallax */}
            <section className="relative h-screen sticky top-0 overflow-hidden flex items-center justify-center">
                <motion.div
                    style={{ scale }}
                    className="absolute inset-0 z-0"
                >
                    <div className="absolute inset-0 bg-black/40 z-10" />
                    <img
                        src="/luxury_perfume_bg.webp"
                        alt="Luxury Perfume"
                        loading="lazy"
                        className="w-full h-full object-cover"
                    />
                </motion.div>

                <motion.div
                    style={{ y, opacity }}
                    className="relative z-20 text-center px-4 max-w-5xl"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                    >
                        <span className="inline-block text-gold tracking-[0.3em] uppercase text-sm mb-6 font-medium">
                            {isKa ? 'დაარსდა 2024 წელს' : 'Established 2024'}
                        </span>
                        <h1 className="font-display text-5xl md:text-8xl font-medium tracking-tight text-white mb-8 drop-shadow-2xl">
                            {isKa ? 'AVON2FLAME-ის ისტორია' : 'The Story of AVON2FLAME'}
                        </h1>
                        <p className="font-body text-xl md:text-2xl text-white/90 italic max-w-2xl mx-auto leading-relaxed">
                            {isKa ? '"სუნამო არის ხელოვნება, რომელიც მეხსიერებას აალაპარაკებს."' : '"Perfume is the art that makes memory speak."'}
                        </p>
                    </motion.div>
                </motion.div>

                {/* Scroll Indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5, duration: 1 }}
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20"
                >
                    <div className="w-[1px] h-20 bg-gradient-to-b from-transparent via-white/50 to-transparent animate-pulse" />
                </motion.div>
            </section>

            {/* Main Content */}
            <main className="relative z-30 bg-background pt-24 pb-32">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        {/* Narrative Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center mb-32">
                            <motion.div
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, margin: "-100px" }}
                                variants={fadeInVariants}
                                custom={0}
                                className="space-y-8 font-body text-xl leading-relaxed text-muted-foreground"
                            >
                                <p className="text-foreground font-medium text-2xl">
                                    {isKa
                                        ? 'AVON2FLAME შეიქმნა მსოფლიოს ყველაზე დახვეწილი არომატებისადმი ვნებით.'
                                        : 'Born from a passion for the world\'s most exquisite scents.'
                                    }
                                </p>
                                <p>
                                    {isKa
                                        ? 'ეს არ არის მხოლოდ ბუტიკი — ეს არის ადგილი მათთვის, ვინც აფასებს სუნამოს დახვეწილ ძალას. ჩვენ გვჯერა, რომ ყველა სუნამო თავის ისტორიას ჰყვება და ჩვენი მისიაა დაგეხმაროთ იპოვოთ ის, რომელიც თქვენსას ეხმიანება.'
                                        : 'AVON2FLAME is more than a boutique—it is a sanctuary for those who appreciate the subtle power of fragrance. We believe that every scent tells a story, and our mission is to help you find the one that resonates with yours.'
                                    }
                                </p>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, x: 50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 1 }}
                                className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl group"
                            >
                                <div className="absolute inset-0 bg-gold/10 group-hover:bg-transparent transition-colors duration-700" />
                                <img
                                    src="/about_narrative.webp"
                                    alt="Fragrance details"
                                    loading="lazy"
                                    className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-1000"
                                />
                            </motion.div>
                        </div>

                        {/* Heritage Section */}
                        <div className="bg-secondary/30 rounded-[3rem] p-12 md:p-20 mb-32 backdrop-blur-sm border border-border/50">
                            <div className="flex flex-col md:flex-row gap-12 items-center">
                                <div className="flex-1 space-y-6">
                                    <div className="flex items-center gap-3 text-gold">
                                        <MapPin className="w-5 h-5" />
                                        <span className="uppercase tracking-widest text-sm font-semibold">{isKa ? 'ჩვენი გზა' : 'Our Journey'}</span>
                                    </div>
                                    <h2 className="font-display text-4xl text-foreground">
                                        {isKa ? 'თბილისიდან გრასამდე' : 'From Tbilisi to Grasse'}
                                    </h2>
                                    <p className="font-body text-lg text-muted-foreground">
                                        {isKa
                                            ? 'ჩვენი კოლექცია საგულდაგულოდ არის შერჩეული და მოიცავს იშვიათ და მარადიულ კლასიკურ არომატებს მსოფლიოს წამყვანი პარფიუმერებისგან. ჩვენ გთავაზობთ საუკეთესო ოლფაქტორულ გამოცდილებას.'
                                            : 'Our collection is meticulously curated, featuring rare gems and timeless classics from global master perfumers. We bring you the finest olfactory experiences.'
                                        }
                                    </p>
                                </div>
                                <div className="flex-1 grid grid-cols-2 gap-4">
                                    <div className="pt-8">
                                        <img src="https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80" className="rounded-2xl shadow-lg" alt="Parisian boutique style" />
                                    </div>
                                    <div>
                                        <img src="https://images.unsplash.com/photo-1458538977777-0549b2370168?auto=format&fit=crop&q=80" className="rounded-2xl shadow-lg" alt="Perfume ingredients" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Values Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                            {sections.map((section, idx) => (
                                <motion.div
                                    key={idx}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true }}
                                    variants={fadeInVariants}
                                    custom={idx + 1}
                                    className="p-8 rounded-3xl bg-background border border-border hover:border-gold/50 transition-colors duration-500 group"
                                >
                                    <div className="mb-6 inline-flex p-4 rounded-2xl bg-secondary text-gold group-hover:scale-110 transition-transform duration-500">
                                        {section.icon}
                                    </div>
                                    <h3 className="font-display text-2xl text-foreground mb-4">
                                        {section.title}
                                    </h3>
                                    <p className="font-body text-muted-foreground leading-relaxed">
                                        {section.description}
                                    </p>
                                </motion.div>
                            ))}
                        </div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="pt-32 text-center"
                        >
                            <p className="text-sm uppercase tracking-[0.5em] text-gold font-bold mb-4">
                                AVON2FLAME
                            </p>
                            <p className="font-display text-lg text-foreground/60 italic">
                                — Est. 2024 —
                            </p>
                        </motion.div>
                    </div>
                </div>
            </main>

            {/* Premium Footer */}
            <footer className="bg-black text-white py-24">
                <div className="container mx-auto px-4 text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1 }}
                    >
                        <h2 className="font-display text-4xl md:text-6xl tracking-widest mb-12">
                            AVON2FLAME
                        </h2>
                        <div className="w-24 h-[1px] bg-gold/50 mx-auto mb-12" />
                        <div className="flex justify-center gap-12 text-white/50 text-sm tracking-widest uppercase mb-12">
                            <span className="hover:text-gold transition-colors cursor-pointer">{isKa ? 'კატალოგი' : 'Catalog'}</span>
                            <span className="hover:text-gold transition-colors cursor-pointer">{isKa ? 'კონტაქტი' : 'Contact'}</span>
                            <span className="hover:text-gold transition-colors cursor-pointer">{isKa ? 'პროდუქცია' : 'Products'}</span>
                        </div>
                        <p className="font-body text-sm text-white/30 tracking-wide">
                            © 2024 AVON2FLAME. {isKa ? 'ყველა უფლება დაცულია' : 'All Rights Reserved'}.
                        </p>
                    </motion.div>
                </div>
            </footer>
        </div>
    );
};

export default AboutUs;
