import { Header } from '@/components/Header';
import { Phone, MessageCircle, Mail, Instagram, Facebook } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import SEO from '@/components/SEO';

const Contact = () => {
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language || 'en';

    const handleWhatsApp = () => {
        window.open('https://wa.me/995555527716', '_blank');
    };

    // Translations
    const translations = {
        ka: {
            title: 'დაგვიკავშირდით',
            subtitle: 'გაქვთ კითხვა კონკრეტული სუნამოს შესახებ? ჩვენი ექსპერტები დაგეხმარებიან თქვენი უნიკალური არომატის პოვნაში.',
            phone: 'ტელეფონი',
            email: 'ელ-ფოსტა',
            whatsapp: 'WhatsApp',
            contactMethods: 'საკონტაქტო არხები',
            onlineStore: 'ონლაინ ბუტიკი',
            followUs: 'გამოგვყევით'
        },
        en: {
            title: 'Get in Touch',
            subtitle: 'Have a question about a specific fragrance? Our experts are here to help you find your signature scent.',
            phone: 'Phone',
            email: 'Email',
            whatsapp: 'WhatsApp',
            contactMethods: 'Contact Channels',
            onlineStore: 'Online Boutique',
            followUs: 'Follow Our Journey'
        },
        ru: {
            title: 'Свяжитесь с нами',
            subtitle: 'Есть вопрос о конкретном аромате? Наши эксперты помогут вам найти ваш уникальный аромат.',
            phone: 'Телефон',
            email: 'Эл. почта',
            whatsapp: 'WhatsApp',
            contactMethods: 'Каналы связи',
            onlineStore: 'Онлайн Бутик',
            followUs: 'Следите за нами'
        }
    };

    const txt = translations[currentLang as keyof typeof translations] || translations.en;

    const contactItems = [
        {
            icon: Phone,
            title: txt.phone,
            content: '+995 555 527 716',
            href: 'tel:+995555527716',
            delay: 0.1
        },
        {
            icon: Mail,
            title: txt.email,
            content: 'info@avon2flame.ge',
            href: 'mailto:info@avon2flame.ge',
            delay: 0.2
        },
        {
            icon: MessageCircle,
            title: txt.whatsapp,
            content: 'WhatsApp Chat',
            href: 'https://wa.me/995555527716',
            delay: 0.3
        }
    ];

    return (
        <div className="min-h-screen bg-rose-50/30">
            <SEO
                title={txt.title}
                description={txt.subtitle}
            />
            <Header onSearch={() => { }} />

            <main className="relative pt-16 pb-24 md:pt-32 md:pb-40 overflow-hidden">
                {/* Visual Background Elements */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-rose-200/20 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-pink-200/20 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2" />

                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-4xl mx-auto text-center">
                        {/* Header Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="mb-20"
                        >
                            <h2 className="text-rose-400 font-display text-xs md:text-sm tracking-[0.4em] uppercase mb-4">
                                {txt.onlineStore}
                            </h2>
                            <h1 className="font-display text-5xl md:text-7xl font-light tracking-tight mb-8 text-rose-500/90 italic">
                                {txt.title}
                            </h1>
                            <p className="font-body text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                                {txt.subtitle}
                            </p>
                        </motion.div>

                        {/* Contact Methods Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                            {contactItems.map((item, index) => (
                                <motion.a
                                    key={item.title}
                                    href={item.href}
                                    target={item.href.startsWith('http') ? '_blank' : undefined}
                                    rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: item.delay }}
                                    className="group p-10 rounded-[2.5rem] bg-white border border-rose-100 hover:border-rose-300 hover:shadow-2xl hover:shadow-rose-200/50 transition-all duration-500"
                                >
                                    <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-all duration-500 mb-6">
                                        <item.icon size={28} />
                                    </div>
                                    <p className="text-[10px] uppercase tracking-[0.2em] text-rose-300 mb-2 font-semibold">{item.title}</p>
                                    <p className="font-display text-lg tracking-wide text-gray-700 group-hover:text-rose-600 transition-colors">{item.content}</p>
                                </motion.a>
                            ))}
                        </div>

                        {/* Follow Us Section */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.6 }}
                            className="pt-12 border-t border-rose-100"
                        >
                            <p className="text-[11px] uppercase tracking-[0.4em] text-rose-300 mb-8 font-medium">{txt.followUs}</p>
                            <div className="flex justify-center gap-6">
                                <button className="w-14 h-14 rounded-full bg-white border border-rose-100 flex items-center justify-center text-rose-400 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all duration-500 shadow-sm">
                                    <Instagram size={24} />
                                </button>
                                <button className="w-14 h-14 rounded-full bg-white border border-rose-100 flex items-center justify-center text-rose-400 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all duration-500 shadow-sm">
                                    <Facebook size={24} />
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </main>

            {/* Footer Section */}
            <footer className="py-12 bg-white border-t border-rose-100">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="font-display text-2xl font-light tracking-[0.4em] mb-6 text-rose-500/80">
                        AVON<span className="text-gray-900">2</span>FLAME
                    </h2>
                    <p className="font-body text-[10px] text-rose-300 tracking-[0.2em] uppercase font-medium">
                        © 2024 AVON2FLAME • Personal Olfactory Experience
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default Contact;
