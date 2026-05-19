declare global {
    interface Window {
        fbq: any;
        gtag: any;
        dataLayer: any[];
    }
}

export const initAnalytics = () => {
    // Analytics are initialized via index.html scripts
    // This utility provides helper functions for event tracking
};

export const trackEvent = (eventName: string, params?: object) => {
    // Track Facebook Pixel
    if (typeof window.fbq === 'function') {
        window.fbq('track', eventName, params);
    }

    // Track Google Analytics
    if (typeof window.gtag === 'function') {
        window.gtag('event', eventName, params);
    }
};

export const trackPageView = (url: string) => {
    if (typeof window.gtag === 'function') {
        window.gtag('config', 'G-XXXXXXXXXX', {
            page_path: url,
        });
    }
};

export const trackAddToCart = (product: any) => {
    trackEvent('AddToCart', {
        content_name: product.name,
        content_ids: [product.id],
        content_type: 'product',
        value: product.price,
        currency: 'GEL'
    });
};

export const trackViewContent = (product: any) => {
    trackEvent('ViewContent', {
        content_name: product.name,
        content_ids: [product.id],
        content_type: 'product',
        value: product.price,
        currency: 'GEL'
    });
};

export const trackPurchase = (order: any) => {
    trackEvent('Purchase', {
        value: order.total_amount,
        currency: 'GEL',
        content_ids: order.items.map((i: any) => i.product_id),
        content_type: 'product'
    });
};
