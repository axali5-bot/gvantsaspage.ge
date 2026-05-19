import { motion } from 'framer-motion';
import { Shield, Zap, Globe, Lock, Cpu, Smartphone } from 'lucide-react';

const features = [
    {
        icon: <Shield className="w-10 h-10 text-primary" />,
        title: "Blockchain Verified",
        description: "Every product authentic and traceable on the chain."
    },
    {
        icon: <Zap className="w-10 h-10 text-primary" />,
        title: "Instant Checkout",
        description: "Lightning fast transactions with crypto or fiat."
    },
    {
        icon: <Globe className="w-10 h-10 text-primary" />,
        title: "Global Reach",
        description: "Shipping to over 140 countries worldwide."
    },
    {
        icon: <Lock className="w-10 h-10 text-primary" />,
        title: "Secure Storage",
        description: "Your data is encrypted with military-grade protocols."
    },
    {
        icon: <Cpu className="w-10 h-10 text-primary" />,
        title: "AI Recommendations",
        description: "Smart algorithms to find your perfect scent."
    },
    {
        icon: <Smartphone className="w-10 h-10 text-primary" />,
        title: "Mobile First",
        description: "Seamless experience across all your devices."
    }
];

export const Features = () => {
    return (
        <section className="py-24 bg-black relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="container mx-auto px-4 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-16"
                >
                    <h2 className="font-heading text-3xl md:text-5xl font-bold text-white mb-6">
                        Why Choose <span className="text-rose-500">Aura</span>
                    </h2>
                    <p className="text-white/60 max-w-2xl mx-auto text-lg">
                        We combine traditional perfumery ensuring quality and trust.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1, duration: 0.5 }}
                            whileHover={{ y: -5, boxShadow: "0 10px 30px -10px rgba(225, 29, 72, 0.2)" }}
                            className="glass-card p-8 rounded-2xl hover:border-rose-500/30 transition-all duration-300 group"
                        >
                            <div className="mb-6 p-4 rounded-full bg-rose-500/10 w-fit group-hover:bg-rose-500/20 transition-colors">
                                {feature.icon}
                            </div>
                            <h3 className="font-heading text-xl font-bold text-white mb-3 group-hover:text-rose-500 transition-colors">
                                {feature.title}
                            </h3>
                            <p className="font-body text-white/50 leading-relaxed">
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
