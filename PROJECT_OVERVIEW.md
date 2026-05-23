# AVON2FLAME — Project Overview

## პროექტის შესახებ

**AVON2FLAME** არის პრემიუმ კლასის სუნამოების ონლაინ მაღაზია. პლატფორმა სამ ენას (ქართული, ინგლისური, რუსული) მხარს უჭერს და სრულ e-commerce ფუნქციონალობას სთავაზობს მომხმარებლებს.

- **Live URL:** `gvantsaspage-ge.vercel.app`
- **GitHub:** `https://github.com/axali5-bot/gvantsaspage.ge`
- **Supabase Project:** `rhfzdzipciasljblbmtf.supabase.co`
- **Admin Email:** `axalierti5@gmail.com`
- **Admin URL:** `/admin/login`

---

## Tech Stack

| ფენა | ტექნოლოგია |
|------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | TailwindCSS + shadcn/ui + Framer Motion |
| State | TanStack Query (React Query) v5 |
| Forms | React Hook Form + Zod |
| Backend | Supabase (PostgreSQL + Auth + Storage + RLS) |
| i18n | i18next + react-i18next (ka/en/ru) |
| AI Chat | Gemini 2.5 Flash (@google/generative-ai) |
| Deploy | Vercel (auto-deploy from GitHub master) |
| Build | Vite + SWC, manualChunks vendor splitting |

---

## არქიტექტურა

```
src/
├── pages/
│   ├── Index.tsx              # მთავარი გვერდი — პროდუქტები, ფილტრები
│   ├── ProductDetails.tsx     # პროდუქტის დეტალები
│   ├── Catalog.tsx            # კატალოგები (PDF/flipbook/link)
│   ├── Checkout.tsx           # შეკვეთის გაფორმება (RPC create_order)
│   ├── AboutUs.tsx            # ბრენდის ისტორია (parallax)
│   ├── Contact.tsx            # კონტაქტი + სოციალური ბმულები
│   ├── AdminLogin.tsx         # ადმინ ავტენტიფიკაცია
│   └── admin/                 # lazy-loaded — customer bundle-ში არ ხვდება
│       ├── AdminLayout.tsx    # ადმინ Shell + Navigation (Outlet)
│       ├── AdminProducts.tsx  # პროდუქტების CRUD
│       ├── AdminOrders.tsx    # შეკვეთების მენეჯმენტი
│       ├── AdminCategories.tsx
│       └── AdminCatalogs.tsx
├── components/
│   ├── Header.tsx             # Navigation + კალათა + ენის switcher
│   ├── ProductCard.tsx        # პროდუქტის ბარათი (3D scroll transform)
│   ├── CartSheet.tsx          # სლაიდ-კალათა (Radix Sheet)
│   ├── HeroSection.tsx        # Hero — magnetic CTA, gold pinstripe
│   ├── ChatWidget.tsx         # AI ჩატის toggle wrapper
│   ├── AIConsultant.tsx       # AI ასისტენტის animated avatar
│   ├── CustomChatWindow.tsx   # Gemini ჩატის UI panel
│   ├── ProtectedAdminRoute.tsx # Route guard (isAdmin check)
│   └── admin/
│       ├── ProductFormDialog.tsx    # 3-ენიანი ფორმა + Supabase Storage upload
│       ├── ProductTable.tsx         # Sort/Search/Pagination (20/page)
│       ├── OrderRow.tsx             # Status dropdown + optimistic update + details dialog
│       ├── ProductDeleteDialog.tsx
│       ├── ProductBulkDeleteDialog.tsx
│       ├── ProductImportDialog.tsx  # CSV import (custom parser)
│       └── ProductExportButtons.tsx # CSV + Excel (XML) export
├── hooks/
│   ├── useProducts.ts    # CRUD + localize() multi-lang helper
│   ├── useCategories.ts  # CRUD hierarchical categories
│   ├── useOrders.ts      # orders + optimistic status update (onMutate/onError)
│   ├── useCart.tsx       # localStorage cart (Context API)
│   └── useAuth.tsx       # Supabase Auth + profiles.is_admin flag
└── lib/
    ├── supabaseClient.ts
    └── gemini.ts         # Gemini 2.5 Flash — singleton chat session
```

---

## Supabase Schema

### `products`
| სვეტი | ტიპი | შენიშვნა |
|-------|------|----------|
| id | uuid PK | |
| name_ka | text NOT NULL | ძირითადი — legacy `name` dropped |
| name_en / name_ru | text | |
| description_ka/en/ru | text | |
| price | numeric | |
| image_url | text | Supabase Storage `products` bucket |
| category_id | uuid FK | → categories |
| stock_quantity | integer | |
| gender | text | Unisex / Woman / Man |

### `categories`
| სვეტი | ტიპი | შენიშვნა |
|-------|------|----------|
| id | uuid PK | |
| name_ka/en/ru | text | |
| slug | text | |
| parent_id | uuid FK | self-referencing (parent/child hierarchy) |
| icon | text | |

### `orders`
| სვეტი | ტიპი | შენიშვნა |
|-------|------|----------|
| id | uuid PK | |
| customer_name / phone / address | text | |
| total_price | numeric | create_order RPC ითვლის |
| status | enum | pending / processing / completed / cancelled |
| created_at | timestamptz | |

### `order_items`
| სვეტი | ტიპი | |
|-------|------|--|
| order_id | uuid FK | → orders |
| product_id | uuid FK | → products |
| quantity | integer | |
| price_at_time | numeric | ფასის snapshot შეკვეთის მომენტში |

### `profiles`
| სვეტი | ტიპი | |
|-------|------|--|
| id | uuid FK | → auth.users |
| is_admin | boolean | admin access flag |

### `catalogs` / `catalog_pages`
PDF, flipbook, link ტიპის კატალოგები.

### RLS Policies
| ცხრილი | Policy |
|--------|--------|
| products | public SELECT; admin INSERT/UPDATE/DELETE |
| orders | admin ALL via `is_admin()` |
| order_items | admin ALL via `is_admin()` |
| profiles | own or admin SELECT/UPDATE |

### Supabase RPC
- **`create_order(p_customer_name, p_customer_phone, p_customer_address, p_items[])`** — SECURITY DEFINER, stock locking, validation, atomic insert

---

## Design System — Hybrid C

**ძირითადი ფერი:** Rose/Pink (130+ გამოყენება კოდბეისში)
**Gold accent:** 6 ქირურგიული წერტილი მხოლოდ

| # | ელემენტი | Tailwind |
|---|---------|---------|
| 1 | Checkout Place Order CTA | `from-gold-deep via-gold to-gold-soft` gradient |
| 2 | Hero logo pinstripe | `via-gold/50` → `via-gold` animated shimmer |
| 3 | Product price | `text-gold` / `text-gold-deep` hover |
| 4 | Header logo "2" digit | `text-gold group-hover:text-gold-deep` |
| 5 | Cart item count badge | `bg-gold text-gold-foreground` |
| 6 | AboutUs page accents | `text-gold`, `border-gold/50`, `bg-gold/10` |

**Gold CSS Tokens:**
```css
--gold: 43 65% 53%         /* #D4AF37 */
--gold-soft: 43 55% 68%
--gold-deep: 43 75% 38%
--gold-foreground: 30 15% 10%
```

**Fonts:** Cormorant Garamond (display) + Montserrat (body)

---

## Performance Metrics

| მეტრიკა | ადრე | ახლა |
|---------|------|------|
| Customer JS bundle | 898 kB | ~129 kB |
| Admin code in customer bundle | ✅ ყველაფერი | ❌ ნული (lazy) |
| WebP image savings | — | 46–96% |

**React Query staleTime:** products 30s / categories 60s / orders 15s

**Vite manualChunks:**
- `react-vendor` — React + ReactDOM + Router
- `supabase` — Supabase client
- `query` — TanStack Query
- `motion` — Framer Motion
- `i18n` — i18next
- `ui-vendor` — Radix UI + Lucide

---

## AI ასისტენტი (Gemini)

- **Model:** `gemini-2.5-flash`
- **ენა:** ქართული (Georgian system prompt)
- **კონტექსტი:** პრემიუმ პარფიუმერიის კონსულტანტი, ფრანგული ვინტაჟური სტილი
- **Config:** `temperature: 0.7`, `maxOutputTokens: 800`
- **Avatar:** AIConsultant — floating animation + magnetic hover + pulse dot
- **Chat UI:** CustomChatWindow — rose gradient header, bubble messages
- **Env var:** `VITE_GEMINI_API_KEY`

---

## Admin Panel

| განყოფილება | ფუნქციონალი |
|-----------|------------|
| Products | CRUD + image upload + bulk delete + CSV import + CSV/Excel export + search/sort/pagination |
| Orders | Status update (optimistic) + customer details + order items modal |
| Categories | Hierarchical CRUD (parent/child) |
| Catalogs | PDF/flipbook/link კატალოგის მენეჯმენტი |

**Auth flow:** Supabase Auth `signInWithPassword` → `profiles.is_admin = true` → ProtectedAdminRoute

---

## Environment Variables

```env
VITE_SUPABASE_URL=https://rhfzdzipciasljblbmtf.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
VITE_GEMINI_API_KEY=<gemini key>
```

---

## Deploy Flow

```
Local: bun run dev (port 8080)
Build: bun run build → dist/
Deploy: git push master → Vercel auto-deploy
SPA routing: vercel.json rewrites /* → /index.html
```

---

## Phase History

| Phase | სტატუსი | შინაარსი |
|-------|---------|---------|
| Phase 1 | ✅ DONE (2026-05-20) | Security — strict RLS, Supabase Auth, create_order RPC, storage policies, anon DML revoked |
| Phase 2 | ✅ DONE (2026-05-20) | Code quality — multilingual schema (name_ka NOT NULL), TanStack Query, Admin modular refactor (1387→0 lines) |
| Phase 3 | ✅ DONE (2026-05-23) | Visual polish — Hybrid C gold system, WebP images, React.lazy, manualChunks, Gemini AI chat |
| Phase 4 | 🔜 FUTURE | Customer accounts, order history, MFA, analytics dashboard, A11y audit |

---

## Known Issues / Backlog

| # | საკითხი | პრიორიტეტი |
|---|---------|-----------|
| 1 | Gemini API key client-side — Supabase Edge Function proxy გამოიყენოს | Medium |
| 2 | Checkout phone/address validation | Low |
| 3 | Instagram/Facebook URLs — დაადასტუროს სოციალური გვერდები | Low |
| 4 | Admin password reset flow | Low |
| 5 | AboutUs Unsplash external image URLs | Low |
| 6 | Phase 4: customer accounts + order history | Future |

---

*Last updated: 2026-05-23 | Senior AI Fullstack: Claude Sonnet 4.6*
