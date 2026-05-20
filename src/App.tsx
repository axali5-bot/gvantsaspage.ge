import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import AdminLogin from "./pages/AdminLogin";
import AboutUs from "./pages/AboutUs";
import Contact from "./pages/Contact";
import ProductDetails from "./pages/ProductDetails";
import Catalog from "./pages/Catalog";
import Checkout from "./pages/Checkout";
import NotFound from "./pages/NotFound";
import { CartProvider } from "./hooks/useCart";
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedAdminRoute } from "./components/ProtectedAdminRoute";
import "@/i18n";
import ChatWidget from "./components/ChatWidget";
import ScrollToTop from "./components/ScrollToTop";

const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminCatalogs = lazy(() => import("./pages/admin/AdminCatalogs"));

const queryClient = new QueryClient();

const AdminFallback = () => (
  <div className="flex items-center justify-center h-64 text-muted-foreground font-body text-sm tracking-widest uppercase">
    Loading…
  </div>
);

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <CartProvider>
            <Toaster />
            <Sonner />
            <ChatWidget />
            <BrowserRouter>
              <ScrollToTop />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/admin/login" element={<AdminLogin />} />

                {/* Lazy-loaded admin routes — NOT in customer bundle */}
                <Route
                  element={
                    <ProtectedAdminRoute>
                      <Suspense fallback={<AdminFallback />}>
                        <AdminLayout />
                      </Suspense>
                    </ProtectedAdminRoute>
                  }
                >
                  <Route path="/admin" element={<Navigate to="/admin/products" replace />} />
                  <Route path="/admin/products" element={
                    <Suspense fallback={<AdminFallback />}><AdminProducts /></Suspense>
                  } />
                  <Route path="/admin/orders" element={
                    <Suspense fallback={<AdminFallback />}><AdminOrders /></Suspense>
                  } />
                  <Route path="/admin/categories" element={
                    <Suspense fallback={<AdminFallback />}><AdminCategories /></Suspense>
                  } />
                  <Route path="/admin/catalogs" element={
                    <Suspense fallback={<AdminFallback />}><AdminCatalogs /></Suspense>
                  } />
                </Route>

                <Route path="/about" element={<AboutUs />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/product/:id" element={<ProductDetails />} />
                <Route path="/catalog" element={<Catalog />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </CartProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
