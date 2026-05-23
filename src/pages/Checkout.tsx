import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { CheckCircle2, ChevronLeft } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useTranslation } from "react-i18next";
import SEO from "@/components/SEO";
import { trackPurchase } from "@/utils/analytics";

const Checkout = () => {
    const { cart, totalPrice, clearCart } = useCart();
    const { user, profile, refreshProfile } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [isOrdered, setIsOrdered] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [saveAddress, setSaveAddress] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        address: "",
    });

    // Pre-fill form from profile if logged in
    useEffect(() => {
        if (profile) {
            setFormData({
                name: profile.full_name ?? "",
                phone: profile.phone ?? "",
                address: profile.default_address ?? "",
            });
        }
    }, [profile]);

    if (cart.length === 0 && !isOrdered) {
        return (
            <div className="min-h-screen bg-background">
                <Header onSearch={() => { }} />
                <div className="container mx-auto px-4 py-20 text-center">
                    <p className="font-body text-muted-foreground mb-8">{t('cartEmpty')}</p>
                    <Button onClick={() => navigate("/")}>{t('hero.shop_now')}</Button>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);

            const { error: rpcError } = await supabase.rpc('create_order', {
                p_customer_name: formData.name,
                p_customer_phone: formData.phone,
                p_customer_address: formData.address,
                p_items: cart.map(item => ({
                    product_id: item.id,
                    quantity: item.quantity
                })),
                p_user_id: user?.id ?? null,
            });

            if (rpcError) throw rpcError;

            // Save address to profile if checkbox ticked and user is logged in
            if (saveAddress && user) {
                await supabase
                    .from('profiles')
                    .update({ default_address: formData.address, updated_at: new Date().toISOString() })
                    .eq('id', user.id);
                await refreshProfile();
            }

            setIsOrdered(true);

            trackPurchase({
                total_amount: totalPrice,
                items: cart.map(item => ({
                    product_id: item.id,
                    quantity: item.quantity,
                    price: item.price
                }))
            });

            clearCart();
            toast.success("Order placed successfully!");
        } catch (error: any) {
            console.error('Checkout error details:', error);
            const errorMessage = error?.message || "Please check your information and try again.";
            toast.error(`Failed to place order: ${errorMessage}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isOrdered) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <div className="text-center space-y-6 max-w-md">
                    <div className="flex justify-center">
                        <CheckCircle2 size={80} className="text-green-500 animate-in zoom-in duration-500" />
                    </div>
                    <h1 className="font-display text-3xl md:text-4xl font-medium tracking-tight">
                        {t('checkout.thankYou')}
                    </h1>
                    <p className="font-body text-muted-foreground">
                        {t('checkout.received')} <strong>{formData.phone}</strong>.
                    </p>
                    <Button
                        onClick={() => navigate("/")}
                        className="w-full h-12 uppercase tracking-widest text-xs font-body mt-4"
                    >
                        {t('hero.shop_now')}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <SEO title={t('checkout.title')} description="Secure checkout for your luxury fragrance order at AVON2FLAME." />
            <Header onSearch={() => { }} />

            <main className="container mx-auto px-4 py-8 md:py-16">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 group"
                >
                    <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-body text-sm tracking-wide">{t('checkout.backToCart')}</span>
                </button>

                <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
                    {/* Order Form */}
                    <div className="space-y-8">
                        <div>
                            <h1 className="font-display text-3xl font-medium tracking-tight mb-2">{t('checkout.title')}</h1>
                            <p className="font-body text-sm text-muted-foreground">{t('checkout.subtitle')}</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-xs uppercase tracking-widest">{t('checkout.fullName')}</Label>
                                <Input
                                    id="name"
                                    required
                                    placeholder="John Doe"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="rounded-sm"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone" className="text-xs uppercase tracking-widest">{t('checkout.phone')}</Label>
                                <Input
                                    id="phone"
                                    required
                                    placeholder="+995 ..."
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="rounded-sm"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address" className="text-xs uppercase tracking-widest">{t('checkout.address')}</Label>
                                <Textarea
                                    id="address"
                                    required
                                    placeholder=""
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="rounded-sm min-h-[100px]"
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full h-14 uppercase tracking-[0.2em] text-[11px] font-body bg-gradient-to-r from-gold-deep via-gold to-gold-soft text-gold-foreground hover:from-gold hover:via-gold-soft hover:to-gold transition-all duration-500 rounded-none border border-gold/40 shadow-[0_0_20px_rgba(212,175,55,0.25)] hover:shadow-[0_0_35px_rgba(212,175,55,0.45)] font-semibold"
                            >
                                {isSubmitting ? t('checkout.processing') : `${t('checkout.placeOrder')} — ${totalPrice} ₾`}
                            </Button>
                        </form>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-secondary/30 p-8 rounded-sm self-start space-y-6">
                        <h2 className="font-display text-xl font-medium border-b border-border pb-4">{t('checkout.summary')}</h2>
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                            {cart.map((item) => (
                                <div key={item.id} className="flex justify-between items-center text-sm font-body">
                                    <div className="flex-1">
                                        <p className="font-medium">{item.name}</p>
                                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                                    </div>
                                    <p className="font-medium whitespace-nowrap">{item.price * item.quantity} ₾</p>
                                </div>
                            ))}
                        </div>
                        <div className="border-t border-border pt-4 space-y-2">
                            <div className="flex justify-between items-center text-sm font-body">
                                <span>{t('checkout.subtotal')}</span>
                                <span>{totalPrice} ₾</span>
                            </div>
                            <div className="flex justify-between items-center text-sm font-body">
                                <span>{t('checkout.shipping')}</span>
                                <span className="text-green-600 font-medium uppercase text-[10px] tracking-widest">{t('checkout.free')}</span>
                            </div>
                            <div className="flex justify-between items-center pt-4 font-display text-xl font-semibold">
                                <span>{t('total')}</span>
                                <span>{totalPrice} ₾</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Checkout;
