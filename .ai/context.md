# Project Context for AI Assistants

## Project Overview
**AVON2FLAME** - Premium luxury perfume e-commerce store
- **Tech Stack**: React + TypeScript + Vite + Supabase
- **Styling**: Tailwind CSS + Framer Motion
- **Languages**: Georgian (KA), English (EN), Russian (RU)

## Recent Changes (2026-01-27)

### 1. Product Card Luxury Hover Effects
**File**: `src/components/ProductCard.tsx`

**Key Features**:
- 3D mouse-tracking tilt (±15° on X/Y axes)
- Golden glow aura with pulsing animation
- Premium golden gradient border
- Ambient light following mouse (40% opacity)
- 3 sparkle animations with staggered delays
- Golden gradient text on hover
- Luxury golden button with 3D transform

**Important**: Overlays are minimal (10-15% opacity) to keep product images visible

### 3. Premium Header Navigation
**File**: `src/components/Header.tsx`

**Features**:
- Luxury typography (`font-display`, tracking-widest)
- Framer-motion staggered entrance animations
- Center-expanding golden gradient underlines on hover
- Subtle glassmorphism with backdrop-blur

### 4. Visual Order Details & Checkout Localization
**Files**: `src/pages/Admin.tsx`, `src/pages/Checkout.tsx`, `src/i18n/translations.json`
- Full checkout flow localization (KA, EN, RU).
- Refined Georgian phrasing for orders.

### 5. Catalog Management & Iframe Isolation (Critical)
**Files**: `src/pages/Catalog.tsx`, `src/components/CatalogManagerProject.tsx`
- **Isolation**: Iframe cropping (135% height, -12% top) to hide external headers/footers.
- **Sandboxing**: `sandbox="allow-scripts allow-same-origin allow-forms"` to prevent external navigation.
- **Click Blockers**: Invisible overlays to block chat widgets and footer links.
- **Goal**: Keep users on the site and only show the catalog content.

### 6. Contact Information Update
**File**: `src/pages/Contact.tsx`
- **Phone/WhatsApp**: Updated to `+995 555 527 716`.

## Design System

### Colors
- Primary Gold: `#D4AF37`
- Rose/Pink (Contact Page): `from-rose-500 via-pink-400 to-rose-500`
- Amber Gradients: `from-amber-600 via-yellow-500 to-amber-600`

### Animations
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)`
- Duration: 500-700ms
- Spring Physics: stiffness 300, damping 30

## Key Components

### ProductCard.tsx
- 3D tilt with mouse tracking
- Golden luxury theme
- Minimal overlays for visibility
- Framer Motion animations

### HeroSection.tsx
- Static hero image background
- Dark overlay for text contrast
- Slide-in and fade-in animations

### Admin.tsx
- Order management
- Product management
- Status updates

## Database Schema (Supabase)

### Tables
- `products`: id, name_ka, name_en, name_ru, description, price, image_url, category_id, stock_quantity
- `orders`: id, customer_name, customer_email, customer_phone, customer_address, total_price, status, user_id, created_at
- `order_items`: id, order_id, product_id, quantity, price_at_time
- `catalogs`: id, brand, type ('link'|'pdf'), url, pdf_path, updated_at
- `profiles`: id, email, full_name, is_admin

## Development Guidelines

### Code Style
- TypeScript strict mode
- Functional components with hooks
- Tailwind CSS utility classes
- Framer Motion for animations

### Component Structure
- Keep components focused and reusable
- Use custom hooks for shared logic
- Maintain consistent naming conventions

### Performance
- Optimize images
- Lazy load components when needed
- Minimize re-renders with proper memoization

## Common Tasks

### Adding New Products
1. Upload image to Supabase Storage
2. Insert product data via Admin panel or SQL

### Modifying Hover Effects
- Edit `ProductCard.tsx`
- Adjust opacity values for overlays
- Modify spring physics parameters for tilt

### Updating Hero Section
- Replace image in `/public/images/`
- Adjust overlay opacity in `HeroSection.tsx`

## Git Workflow
- Feature commits: `feat: description`
- Bug fixes: `fix: description`
- Documentation: `docs: description`
- Styling: `style: description`

---

**Last Updated**: 2026-01-27
**Maintained by**: Development Team
