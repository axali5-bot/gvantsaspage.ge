# AVON2FLAME - Aromatic Essentials Store 🌟

Premium luxury perfume e-commerce store built with React, TypeScript, and Supabase.

## 🎨 Recent Updates (2026-01-29)

### Critical Bug Fixes ✅
- **Product Creation Fix**: Resolved "null value in column 'name'" database error
  - Added validation to ensure product name is not empty before submission
  - Implemented fallback values for all required fields (name, price, stock_quantity, gender)
  - Fixed both "Add Product" and "Edit Product" functions
  - Added proper error messages for missing required fields
  
- **Category Display Fix**: Fixed category dropdown not showing in Admin Panel
  - Updated `useCategories.ts` to use correct database field names
  - Changed sorting from `name` to `name_ka`
  - Fixed `addCategory` and `updateCategory` to use multi-language schema (`name_ka`, `name_en`, `name_ru`)
  - Resolved TypeScript errors related to category insertion/updates

### Product Management
- **Gender Selection**: Added 'Man', 'Woman', 'Unisex' options for products
- **Admin Panel**: Enhanced product form with gender assignment and validation
- **Data Export**: Included gender field in CSV/Excel exports
- **Form Validation**: Added comprehensive validation for all product fields
  - Name field validation (required, non-empty)
  - Image upload validation
  - Proper error handling with user-friendly messages

### Technical Adjustments
- **Schema Mapping**: Fixed `name` property mapping to localized fields (`name_ka`, `name_en`, `name_ru`) to match database schema
- **Database Integrity**: Ensured all NOT NULL constraints are properly handled
- **Error Handling**: Improved error messages and validation feedback

### AI Integration
- **N8N AI Assistant**: Integrated AI-powered customer support assistant
  - Currently in development/testing phase
  - Provides automated customer assistance on the website

## 🎨 Recent Updates (2026-01-27)

### Product Card Luxury Hover Effects
- **3D Mouse-Tracking Tilt**: Cards tilt based on cursor position (±15°)
- **Golden Glow Aura**: Pulsing radial gradient in golden tones
- **Premium Border Frame**: Golden gradient border with dual shadows
- **Ambient Light Effect**: Mouse-following spotlight (minimal opacity for visibility)
- **Sparkle Animations**: 3 animated sparkle points with staggered delays
- **Golden Gradient Text**: Product names and prices transition to golden gradients
- **Luxury Button**: Golden gradient with 3D transform and enhanced shadows

### Hero Section
- Replaced animated gradient background with custom perfume hero image
- Image: `/public/images/hero-perfume.png`
- Added dark overlay (40% opacity) for text readability
- Enhanced text shadows and button styling

## 📁 Project Structure

```
aromatic-essentials-store/
├── public/
│   └── images/
│       └── hero-perfume.png          # Hero section background
├── src/
│   ├── components/
│   │   ├── ProductCard.tsx           # ⭐ Luxury hover effects
│   │   ├── HeroSection.tsx           # ⭐ Updated with hero image
│   │   ├── ProductGrid.tsx
│   │   └── Header.tsx
│   ├── pages/
│   │   ├── Index.tsx                 # Main page
│   │   ├── ProductDetails.tsx
│   │   ├── Checkout.tsx
│   │   └── Admin.tsx
│   ├── hooks/
│   │   ├── useProducts.tsx
│   │   └── useCart.tsx
│   └── types/
│       └── supabase.ts
└── README.md
```

## 🎯 Key Features

- **Luxury UI/UX**: Premium perfume boutique aesthetic with golden accents
- **3D Interactions**: Mouse-tracking tilt effects on product cards
- **Multilingual**: Georgian (KA), English (EN), Russian (RU)
- **E-commerce**: Shopping cart, checkout, order management
- **Admin Panel**: Product and order management
- **Supabase Backend**: PostgreSQL database with RLS policies

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Framer Motion
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **i18n**: react-i18next
- **UI Components**: shadcn/ui

## 🎨 Design System

### Colors
- **Primary Gold**: `#D4AF37` (Luxury gold for text and accents)
- **Amber Gradients**: `from-amber-600 via-yellow-500 to-amber-600`
- **Background**: Dark theme with neutral tones

### Typography
- **Display Font**: Luxury serif for headings
- **Body Font**: Clean sans-serif for readability

### Animations
- **Easing**: `cubic-bezier(0.16, 1, 0.3, 1)` for premium feel
- **Duration**: 500-700ms for major transitions
- **Spring Physics**: Stiffness 300, Damping 30 for 3D tilt

## 🚀 Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## 📝 Important Notes for AI Assistants

### ⚠️ CRITICAL: Category vs Gender Distinction

**DO NOT CONFUSE THESE TWO SEPARATE CONCEPTS:**

#### Categories (პროდუქტის ტიპი)
Categories represent **product types** and should include:
- AVON პროდუქტი (AVON Products)
- Oriflame პროდუქტი (Oriflame Products)
- კოსმეტიკა (Cosmetics)
- მამაკაცებისთვის (For Men)
- ქალბატონებისთვის (For Women)
- სხვა (Other)

**Database field**: `category_id` (foreign key to `categories` table)

#### Gender (ვისთვის არის პროდუქტი)
Gender represents **who the product is for** and has ONLY 3 options:
- **Man** (მამაკაცი)
- **Woman** (ქალი)
- **Unisex** (უნისექსი)

**Database field**: `gender` (string field in `products` table)

#### Common Mistake to Avoid ❌
- **WRONG**: Creating categories named "ქალბატონები" (Women) or "უნისექსი" (Unisex)
- **WRONG**: Using gender values in category dropdown
- **WRONG**: Mixing category and gender filters

#### Correct Implementation ✅
- Categories = Product type/brand (stored in `categories` table)
- Gender = Target audience (stored as field in `products` table)
- Frontend has separate filters for each (Category dropdown + Gender buttons)

### Product Card Hover Effects
- Overlays are intentionally minimal (10-15% opacity) to keep products visible
- 3D tilt uses mouse position tracking with spring physics
- Golden theme throughout (borders, text, buttons, sparkles)

### Hero Section
- Uses static image instead of video/animation
- Dark overlay ensures text readability
- All animations preserved (slide-in, fade-in)

### Code Style
- TypeScript strict mode
- Tailwind CSS for styling
- Framer Motion for animations
- Component-based architecture

## 🔗 Supabase Configuration

### Database Tables

#### Products Table
- **Multi-language support**: `name_ka`, `name_en`, `name_ru`, `description_ka`, `description_en`, `description_ru`
- **Core fields**: `name` (NOT NULL), `price`, `stock_quantity`, `gender`, `image_url`, `category_id`
- **Gender options**: 'Man', 'Woman', 'Unisex'
- **Storage**: Product images stored in Supabase Storage bucket 'products'

#### Categories Table
- **Multi-language support**: `name_ka`, `name_en`, `name_ru`
- **Used for**: Product categorization and filtering

#### Orders Table
- **Customer info**: `customer_name`, `customer_phone`, `customer_address`
- **Order tracking**: `status` (pending, processing, completed, cancelled), `total_price`
- **Timestamps**: `created_at`

#### Order Items Table
- **Relations**: Links orders to products
- **Fields**: `quantity`, `price_at_time`

### Important Notes
- All text fields support Georgian, English, and Russian
- Product `name` field is required (NOT NULL constraint)
- RLS (Row Level Security) policies enabled for data protection

## 📄 License

Private project - All rights reserved

---

**Last Updated**: 2026-01-29  
**Version**: 1.2.0  
**Status**: Active Development
