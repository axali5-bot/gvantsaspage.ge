import { useCart } from "@/hooks/useCart";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { ShoppingBag, Trash2, Plus, Minus } from "lucide-react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export const CartSheet = () => {
    const { cart, removeFromCart, updateQuantity, totalPrice, totalItems } = useCart();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language || 'ka';

    return (
        <Sheet>
            <SheetTrigger asChild>
                <button className="relative p-2 hover:text-accent transition-colors">
                    <ShoppingBag size={20} />
                    {totalItems > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] rounded-full flex items-center justify-center font-body shadow-[0_0_10px_rgba(225,29,72,0.4)]">
                            {totalItems}
                        </span>
                    )}
                </button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md bg-background flex flex-col">
                <SheetHeader className="border-b border-border pb-6">
                    <SheetTitle className="font-display text-2xl tracking-wide uppercase">
                        {t('yourCart')}
                    </SheetTitle>
                </SheetHeader>

                {cart.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                        <ShoppingBag size={48} className="text-muted-foreground opacity-20" />
                        <p className="font-body text-muted-foreground">{t('cartEmpty')}</p>
                    </div>
                ) : (
                    <>
                        <ScrollArea className="flex-1 -mx-6 px-6 py-6">
                            <div className="space-y-6">
                                    {cart.map((item) => {
                                        const localizedName = (item[`name_${currentLang}` as keyof typeof item] || item.name) as string;
                                        return (
                                            <div key={item.id} className="flex gap-4">
                                                <div className="w-20 h-24 bg-secondary overflow-hidden rounded">
                                                    <img
                                                        src={item.image_url}
                                                        alt={localizedName}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div className="flex-1 flex flex-col justify-between">
                                                    <div>
                                                        <div className="flex justify-between items-start">
                                                            <h3 className="font-display text-sm font-medium pr-4">
                                                                {localizedName}
                                                            </h3>
                                                    <button
                                                        onClick={() => removeFromCart(item.id)}
                                                        className="text-muted-foreground hover:text-destructive transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center mt-2">
                                                <div className="flex items-center border border-border rounded">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        className="p-1 px-2 hover:bg-secondary transition-colors"
                                                    >
                                                        <Minus size={12} />
                                                    </button>
                                                    <span className="w-8 text-center text-xs font-body">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        className="p-1 px-2 hover:bg-secondary transition-colors"
                                                    >
                                                        <Plus size={12} />
                                                    </button>
                                                </div>
                                                <p className="font-body text-sm font-medium">
                                                    {item.price * item.quantity} ₾
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                        );
                                    })}
                                </div>
                            </ScrollArea>

                        <div className="border-t border-border pt-6 space-y-4">
                            <div className="flex justify-between items-center font-display text-lg">
                                <span>{t('total')}</span>
                                <span className="font-semibold">{totalPrice} ₾</span>
                            </div>
                            <p className="font-body text-xs text-muted-foreground">
                                {t('shippingTaxes')}
                            </p>
                            <Button
                                onClick={() => navigate('/checkout')}
                                className="w-full h-12 uppercase tracking-[0.2em] text-[11px] font-body bg-gradient-to-r from-rose-200 via-pink-400 to-rose-200 text-black hover:from-rose-300 hover:via-pink-500 hover:to-rose-300 transition-all duration-500 rounded-none border border-rose-500/30 shadow-[0_0_20px_rgba(225,29,72,0.15)] hover:shadow-[0_0_30px_rgba(225,29,72,0.3)] font-semibold"
                            >
                                {t('proceedToCheckout')}
                            </Button>
                        </div>
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
};
