# 🏛 AVON2FLAME — Project Overview

> **Senior AI Fullstack Developer & Architect ანგარიში**
> **თარიღი:** 2026-05-19
> **არქიტექტორი (Opus 4.7):** Claude Code
> **გამვითარებელი/Builder (Sonnet 4.6):** Claude Code
> **Product Owner:** j19mt85@gmail.com

---

## 📑 სარჩევი

1. [პროდუქტის იდენტობა](#1--პროდუქტის-იდენტობა)
2. [ტექნოლოგიური სტეკი](#2--ტექნოლოგიური-სტეკი)
3. [აპლიკაციის რუკა](#3--აპლიკაციის-რუკა)
4. [მონაცემთა ბაზის არქიტექტურა](#4--მონაცემთა-ბაზის-არქიტექტურა)
5. [რა მუშაობს კარგად](#5--რა-მუშაობს-კარგად)
6. [კრიტიკული პრობლემები](#6--კრიტიკული-პრობლემები)
7. [როლების განაწილება Opus 4.7 ↔ Sonnet 4.6](#7--როლების-განაწილება-opus-47--sonnet-46)
8. [4-ფაზიანი რუკა + Task Ownership Matrix](#8--4-ფაზიანი-რუკა--task-ownership-matrix)
9. [სად ვიწყებთ — ჩვენი შემდეგი ნაბიჯი](#9--სად-ვიწყებთ--ჩვენი-შემდეგი-ნაბიჯი)

---

## 1. 🎯 პროდუქტის იდენტობა

| | |
|---|---|
| **ბრენდი** | AVON2FLAME — luxury perfume & cosmetics boutique |
| **ბაზარი** | საქართველო (ძირითადი) + რეგიონალური (RU, EN) |
| **ბიზნეს მოდელი** | B2C online store — Avon, Oriflame პროდუქცია + სამკაული |
| **ვალუტა** | ₾ (GEL) |
| **მიწოდება** | უფასო (currently hardcoded) |
| **Supabase პროექტი** | `rhfzdzipciasljblbmtf.supabase.co` |
| **Contact** | +995 555 527 716 |

**მონაცემები ცოცხალი ბაზიდან (2026-05-19):**
- 40 პროდუქტი
- 11 კატეგორია (იერარქიული, parent → child)
- 4 ტესტ-შეკვეთა (product owner-ის მიერ შემოწმებისთვის)
- 2 კატალოგი (link/PDF)

---

## 2. 🧱 ტექნოლოგიური სტეკი

| ფენა | ტექნოლოგია | შენიშვნა |
|---|---|---|
| Frontend | React 18 + TypeScript + Vite | SWC compiler |
| Routing | react-router-dom v6 | 8 route |
| State | TanStack Query + Context (Cart) | Cart — localStorage-ში persistent |
| UI | shadcn/ui + Radix primitives | სრული component library |
| Styling | Tailwind 3.4 + tailwindcss-animate | Custom luxury theme |
| Animations | Framer Motion 12 + Anime.js 4 | 3D tilt, spring physics |
| Forms | react-hook-form + Zod | Schema validation |
| i18n | i18next + react-i18next | KA / EN / RU |
| Backend | Supabase (Postgres + Storage + RPC) | EU region |
| AI Chat | Botpress Webchat v3.5 | External widget injection |
| PWA | vite-plugin-pwa | Service Worker |
| Testing | Vitest + Testing Library | minimal coverage |
| SEO | react-helmet-async | meta tags only |

---

## 3. 🗺 აპლიკაციის რუკა

```
/                    Index            — hero + filters (category, gender) + product grid
/product/:id         ProductDetails   — product page
/catalog             Catalog          — iframe-isolated external catalogs
/about               AboutUs
/contact             Contact          — phone: +995 555 527 716
/checkout            Checkout         — calls create_order RPC
/admin               Admin            — 5 tabs: Products, Orders, Categories, Catalogs, Optimizer
*                    NotFound
```

**Global providers:** HelmetProvider → QueryClientProvider → TooltipProvider → CartProvider → BrowserRouter
**Always-mounted:** Toaster, Sonner, ChatWidget (Botpress), ScrollToTop

---

## 4. 🗄 მონაცემთა ბაზის არქიტექტურა

```
categories (11)  [parent_id self-reference]
  ├── AVON პროდუქცია → კოსმეტიკა, სუნამო, სხეულის მოვლა
  ├── Oriflame პროდუქცია → კოსმეტიკა, სუნამო, სხეულის მოვლა
  └── სამკაული → ბიჟუტერია, ვერცხლი
        │
        ▼
products (40) — name (NOT NULL) + name_ka/en/ru + price + gender + image_url + category_id
        │
        ▼ FK (order_items.product_id)
orders (4 test) — customer_name/phone/address + total_price + status
        │
        ▼ FK (order_items.order_id, UNINDEXED!)
order_items (4) — quantity + price_at_time

catalogs (2) — brand + type ('link'|'pdf') + url + pdf_path
catalog_pages (0) — brand + page_number + image_url
```

**RPC ფუნქცია:** `create_order(name, phone, address, total, items_json)` → ერთ ტრანზაქციაში ქმნის order-ს და მის item-ებს. ⚠️ **SECURITY DEFINER** ღია anon-ისთვის.

**Storage Buckets:** `products` (public), `catalogs` (public) — ორივე listing permission-ით.

---

## 5. ✅ რა მუშაობს კარგად

- 🎨 **ProductCard** — 3D tilt + golden glow, premium luxury feel
- 🌍 **i18n** — სამი ენა სრულად ჩასმული
- 🛒 **Cart** — localStorage persistence
- 📦 **Admin** — CRUD + CSV import/export + Excel export + pagination + sort + bulk delete
- 🖼 **Image Optimizer** ჩაშენებული
- 📱 **PWA** გააქტიურებული
- 🏷 **Subcategory filter** Framer Motion ანიმაციით
- 🤖 **Botpress AI chat** ინტეგრირებული
- 📊 **Analytics** — `trackPurchase` event hook

---

## 6. 🚨 კრიტიკული პრობლემები

### 🔴 P0 — უსაფრთხოება (გადაუდებელი)

| # | პრობლემა | სად | რისკი |
|---|---|---|---|
| 1 | Admin credentials hardcoded `admin / avon2flame2024` | `src/pages/Admin.tsx:908` | წყაროდან წაკითხვა → სრული admin access |
| 2 | ყველა ცხრილზე RLS = `USING (true)` | products, orders, order_items, categories, catalogs | ანონიმ user-ს შეუძლია წაშლა/რედაქტირება |
| 3 | `create_order` SECURITY DEFINER + anon executable | DB function | spam attack, fake orders |
| 4 | Duplicate permissive policies (30+) | ყველა ცხრილზე | წარმადობა + audit confusion |
| 5 | Public buckets listing-ით | storage.objects | მთლიანი bucket-ის სკან |
| 6 | `search_path` mutable `create_order`-ში | DB function | hijack potential |

### 🟡 P1 — არქიტექტურა და კოდი

| # | პრობლემა | სად |
|---|---|---|
| 7 | `window.location.reload()` ყოველი CRUD-ის შემდეგ | Admin.tsx (4 ადგილას) |
| 8 | **Admin.tsx 1457 ხაზი** — ერთ ფაილში ყველაფერი | unmaintainable |
| 9 | `name` + `name_ka/en/ru` ხელით სინქი | products schema redundancy |
| 10 | FK indexes აკლია | `order_items.order_id`, `order_items.product_id` |
| 11 | Cart-ში product snapshot-ი — stale risk | useCart.tsx |
| 12 | Legacy `description` field + `description_ka/en/ru` | schema |
| 13 | Git repository არ ინიციალიზებულია | project root |

### 🟠 P2 — UX/UI

| # | პრობლემა |
|---|---|
| 14 | rose-600 ღილაკები vs golden ProductCard — design system disconnect |
| 15 | "All Types" hardcoded English, არ ითარგმნება |
| 16 | Loading states ყველგან "Loading..." text-ი — Skeleton აკლია |
| 17 | სურათების lazy-loading + WebP/AVIF არ ჩანს |
| 18 | მობილური navigation drawer აკლია |
| 19 | Order confirmation — branded receipt/invoice არ აქვს |
| 20 | "Free shipping" hardcoded |

### 🟢 P3 — Performance & Business

| # | აკლია |
|---|---|
| 21 | Stock decrement შეკვეთის ჩაბარებისას |
| 22 | Order tracking / SMS / email notifications |
| 23 | Promo codes / discounts |
| 24 | Wishlist / favorites |
| 25 | Reviews & ratings |
| 26 | Related products / cross-sell |
| 27 | Sales analytics dashboard |
| 28 | Botpress all-pages mount (heavy 3rd-party) |
| 29 | Image CDN / Supabase Storage Transform underused |
| 30 | Route-based code splitting აკლია |

---

## 7. 🤖 როლების განაწილება Opus 4.7 ↔ Sonnet 4.6

### როდის ვიყენებთ რომელ model-ს

| მოდელი | ძლიერი მხარე | მონაცემთა task-ები |
|---|---|---|
| **🧠 Opus 4.7 (Architect)** | ღრმა მსჯელობა, არქიტექტურული გადაწყვეტილებები, უსაფრთხოების ანალიზი, რთული რეფაქტორი, novel design, ღია/ბუნდოვანი task-ები | RLS პოლისების დიზაინი, schema migration-ების დაგეგმვა, ფუნდამენტური security არქიტექტურა, ბრძანდინი refactor strategy, design system spec, code review |
| **⚡ Sonnet 4.6 (Builder)** | სწრაფი შესრულება, კარგად-სკოპირებული task-ები, UI work, განმეორებადი coding, ნათელი spec-ით განხორციელება | კომპონენტების implementation, UI polish, Tailwind styling, copy/i18n, ცალკეული hook-ების დაწერა, ტესტების დაწერა, CRUD endpoint-ები spec-ის მიხედვით |

### განაწილების პრინციპი

> **Opus გადაწყვეტს, Sonnet ააშენებს.**
> Opus წერს spec-ს, არჩევს pattern-ს, ამოწმებს Sonnet-ის ნამუშევარს. Sonnet-ი ასრულებს კარგად განსაზღვრულ task-ებს სწრაფად და ხარისხიანად.

---

## 8. 📋 4-ფაზიანი რუკა + Task Ownership Matrix

### **🛡 Phase 1 — Foundation Hardening** (1-2 კვირა)

> ბაზის უსაფრთხო და სუფთა მდგომარეობაში გადაყვანა

| Task | მფლობელი | მიზეზი |
|---|---|---|
| RLS policies სრულად გადაწერა (admin role + public read) | 🧠 **Opus 4.7** | Security-critical, must reason about every role/action combination |
| Admin → Supabase Auth migration (JWT-based) | 🧠 **Opus 4.7** | Auth architecture decision, session management strategy |
| `create_order` → SECURITY INVOKER + rate limiting + stock decrement | 🧠 **Opus 4.7** | Transaction logic + security boundaries |
| Schema cleanup: legacy `name`, `description` fields | 🧠 **Opus 4.7** | Migration risk — needs careful planning |
| Duplicate policies cleanup | ⚡ **Sonnet 4.6** | DROP POLICY statements, well-defined |
| FK indexes დამატება (`order_items`) | ⚡ **Sonnet 4.6** | Straightforward CREATE INDEX |
| Storage policies გადაწერა | ⚡ **Sonnet 4.6** | Well-known pattern from Supabase docs |
| `window.location.reload()` → TanStack Query invalidation | ⚡ **Sonnet 4.6** | Mechanical refactor pattern |
| Git init + initial commit + .gitignore | ⚡ **Sonnet 4.6** | Standard setup |

**Phase 1 deliverables:**
- ✅ `supabase/migrations/` — versioned SQL migrations
- ✅ ახალი `useAuth` hook + ProtectedRoute component
- ✅ Updated `create_order` RPC with stock validation
- ✅ Clean RLS audit (0 `USING (true)` policies on write actions)

---

### **🏗 Phase 2 — Code Quality & Architecture** (1-2 კვირა)

> ფუნდამენტი maintainable-ად ვაქციოთ

| Task | მფლობელი | მიზეზი |
|---|---|---|
| Feature folder structure design (`features/products/`, `features/cart/`, ...) | 🧠 **Opus 4.7** | Architectural decision affecting entire codebase |
| Design tokens unification (rose vs gold გადაწყვეტა) | 🧠 **Opus 4.7** | Brand identity decision |
| Generate Supabase TypeScript types pipeline | 🧠 **Opus 4.7** | Tooling architecture |
| Test strategy + critical path identification | 🧠 **Opus 4.7** | What to test, why, depth |
| Admin.tsx split → 5 ცალკე component-ი | ⚡ **Sonnet 4.6** | Mechanical extraction with clear boundaries |
| Zod schemas every form-ისთვის | ⚡ **Sonnet 4.6** | Pattern-based, repetitive |
| Route-based code splitting (React.lazy) | ⚡ **Sonnet 4.6** | Well-documented Vite pattern |
| Tailwind theme tokens implementation | ⚡ **Sonnet 4.6** | Apply the spec Opus designed |
| Critical path tests (Vitest) | ⚡ **Sonnet 4.6** | Write tests from Opus's spec |

**Phase 2 deliverables:**
- ✅ Refactored `src/features/` structure
- ✅ Unified design system in `tailwind.config.ts`
- ✅ Auto-generated `src/types/database.ts`
- ✅ Test coverage ≥50% on checkout, admin CRUD, auth

---

### **💎 Phase 3 — UX/Visual Polish** (2-3 კვირა)

> luxury experience მსოფლიო დონეზე

| Task | მფლობელი | მიზეზი |
|---|---|---|
| Hero section cinematic concept (video/3D direction) | 🧠 **Opus 4.7** | Creative direction + technical feasibility |
| Custom AI chat replacement strategy (Botpress → Claude API) | 🧠 **Opus 4.7** | LLM integration architecture |
| Mobile navigation UX flow design | 🧠 **Opus 4.7** | UX decision-making |
| Branded PDF receipt generator (HTML→PDF strategy) | 🧠 **Opus 4.7** | Library choice + template arch |
| Skeleton loading components everywhere | ⚡ **Sonnet 4.6** | Repetitive UI pattern |
| Image optimization (WebP/AVIF, blur placeholders, Supabase transforms) | ⚡ **Sonnet 4.6** | Well-defined pipeline |
| Theme polish — premium dark mode | ⚡ **Sonnet 4.6** | Tailwind + CSS variables work |
| Micro-interactions (cart fly-to-icon, toast premium) | ⚡ **Sonnet 4.6** | Framer Motion-ით ნაცნობი patterns |
| Product details: gallery zoom, recommendations | ⚡ **Sonnet 4.6** | Component-level implementation |
| Mobile Sheet/Drawer navigation | ⚡ **Sonnet 4.6** | shadcn/ui-ით სტანდარტული |

**Phase 3 deliverables:**
- ✅ Hero section v2 (cinematic)
- ✅ Custom AI chat widget (Claude-powered)
- ✅ PDF receipt on order completion
- ✅ Mobile UX parity with desktop
- ✅ Premium micro-animations throughout

---

### **📈 Phase 4 — Business Growth Features** (3-4 კვირა)

> შემოსავლის გაზრდის ფუნქციები

| Task | მფლობელი | მიზეზი |
|---|---|---|
| Promo codes / discounts system (schema + RPC) | 🧠 **Opus 4.7** | Complex business rules, edge cases |
| Email/SMS notification architecture (Edge Functions + Resend/Twilio) | 🧠 **Opus 4.7** | External integration + retry logic |
| Reviews & ratings moderation strategy | 🧠 **Opus 4.7** | Anti-spam + RLS design |
| AI recommendations engine (vector embeddings approach) | 🧠 **Opus 4.7** | Algorithm + data architecture |
| Analytics dashboard data model | 🧠 **Opus 4.7** | Aggregation strategy, materialized views |
| Wishlist feature (UI + Supabase persistence) | ⚡ **Sonnet 4.6** | Standard pattern |
| Order tracking page customer-ისთვის | ⚡ **Sonnet 4.6** | UI component, well-scoped |
| Reviews & ratings UI | ⚡ **Sonnet 4.6** | Form + display patterns |
| Recharts-ით sales charts implementation | ⚡ **Sonnet 4.6** | Recharts patterns, data already shaped |
| Promo code input + validation UI | ⚡ **Sonnet 4.6** | Form work |
| Gift cards purchase/redeem UI | ⚡ **Sonnet 4.6** | Form + state management |

**Phase 4 deliverables:**
- ✅ Promo code system live
- ✅ SMS/Email notifications on order events
- ✅ Reviews & ratings on product pages
- ✅ Wishlist persistent across sessions
- ✅ Admin analytics dashboard
- ✅ AI product recommendations

---

## 9. 🎯 სად ვიწყებთ — ჩვენი შემდეგი ნაბიჯი

რადგან 4 შეკვეთა ტესტურია (real customer data არ რისკავს), urgency ცოტათი მცირდება, მაგრამ მაინც **Phase 1-ით უნდა დავიწყოთ** — განვითარების process-ი არასტაბილურ foundation-ზე ვერ ააშენებს luxury პროდუქტს.

### კონკრეტული პირველი 5 task-ი

1. 🧠 **Opus** → `git init` + initial commit (clean baseline)
2. 🧠 **Opus** → RLS audit + new policies სრული dispelled spec
3. ⚡ **Sonnet** → cleanup duplicate policies (Opus-ის spec-ის მიხედვით)
4. 🧠 **Opus** → Supabase Auth migration plan + ProtectedRoute design
5. ⚡ **Sonnet** → FK indexes migration + apply

### გადასაწყვეტი კითხვები შენგან

1. **Phase 1-ით ვიწყებთ?** ✅ / ❌
2. **Admin authentication** — Supabase Auth email/password? Magic link? OAuth (Google)?
3. **Design system** — rose/pink shop-ში დავტოვოთ თუ pure gold luxury (#D4AF37) გავხადოთ ერთიანი?
4. **AI chat** — Botpress ვინარჩუნებთ თუ Claude API-ით ჩვენი custom assistant?
5. **დეპლოი** — Vercel? Netlify? Cloudflare Pages? Supabase Hosting?
6. **Git init** — ახლავე გავაკეთოთ?

---

**🔄 ეს დოკუმენტი ცოცხალია.** ყოველი ფაზის ბოლოს განვაახლებთ რეალურ პროგრესს, შევცვლით priorities-ს learnings-ის მიხედვით, და ვამატებთ ახალ task-ებს როცა საჭიროა.

---

*Maintained by Claude Code (Opus 4.7 + Sonnet 4.6) · Product Owner: j19mt85@gmail.com*
