# 🎨 Phase 3 — Visual Polish & Performance
## Hybrid Design: Rose Primary, Gold Premium Accents

> **Authored by:** Claude Opus 4.7 (Senior Architect)
> **Executor:** Claude Sonnet 4.6 (Builder)
> **Date:** 2026-05-20
> **Project:** AVON2FLAME · Supabase ref: `rhfzdzipciasljblbmtf`
> **Prerequisite:** Phase 2 complete (commit `a654788` or later)

---

## 🎯 Goal of Phase 3

Bring AVON2FLAME from "consistent feminine luxury" to "polished, fast, premium luxury":

1. ✅ Define proper **gold token system** in Tailwind + CSS variables
2. ✅ Apply gold to **6 strategic premium touchpoints** (no full rebrand)
3. ✅ Fix broken `text-gold` / `bg-gold` classes in `AboutUs.tsx`
4. ✅ Convert hero images to **WebP** + lazy-load all below-fold images
5. ✅ **Code-split admin routes** + vendor chunks → cut bundle from 898 kB
6. ✅ Manual smoke test passes; visual review at 3 breakpoints

---

## 📐 Architectural Decisions (locked in)

| Decision | Choice | Rationale |
|---|---|---|
| Color strategy | **Hybrid**: Rose primary, gold accents | Audit showed 103+ rose usages — full rebrand poor ROI |
| Gold base value | `#D4AF37` → HSL `43 65% 53%` | Classic warm gold, matches Tom Ford / luxury perfume aesthetic |
| Gold variants | `--gold-soft` (43 55% 68%), `--gold-deep` (43 75% 38%) | For gradients and hover/depth states |
| Rose tokens | **Leave `rose-*` utilities untouched** | Out of scope; Tailwind defaults already work |
| Gold targets | 6 spots: Checkout CTA, Hero accent, Product price, Logo digit, Cart badge, About Us | Surgical premium accents; never primary |
| Image format | **WebP** with no `<picture>` fallback | 99%+ browser support; reduces complexity |
| Image conversion | Local script using `sharp` CLI | One-time build, results committed to repo |
| Lazy loading | All below-fold `<img>` get `loading="lazy"` + `decoding="async"` | Native HTML, no JS overhead |
| Code splitting | React.lazy() for `/admin/*` + Vite manualChunks for vendors | Customers never download admin bundle |
| Animations | Keep existing keyframes; do not change motion design | Phase 4 territory |
| Dark mode | Gold tokens defined for both `:root` and `.dark` | Already infrastructure exists |

---

## 🎨 Gold Token System (exact values)

### CSS variables (in `src/index.css`)

```css
:root {
  /* ... existing tokens unchanged ... */
  --gold: 43 65% 53%;        /* #D4AF37 */
  --gold-soft: 43 55% 68%;   /* lighter, hover/secondary state */
  --gold-deep: 43 75% 38%;   /* darker, borders/depth */
  --gold-foreground: 30 15% 10%;  /* near-black for contrast on gold */
}

.dark {
  /* ... existing dark tokens unchanged ... */
  --gold: 43 70% 60%;        /* slightly brighter in dark mode */
  --gold-soft: 43 55% 72%;
  --gold-deep: 43 80% 45%;
  --gold-foreground: 30 15% 10%;
}
```

### Tailwind config (`tailwind.config.ts` → `theme.extend.colors`)

```ts
gold: {
  DEFAULT: "hsl(var(--gold))",
  soft: "hsl(var(--gold-soft))",
  deep: "hsl(var(--gold-deep))",
  foreground: "hsl(var(--gold-foreground))",
},
```

This unlocks: `bg-gold`, `text-gold`, `border-gold/40`, `from-gold-soft via-gold to-gold-deep`, `hover:bg-gold-deep`, etc.

---

## 📍 Gold Accent Targets (the 6 placements)

> ⚠️ **Be surgical.** Do not introduce gold anywhere not listed below. Each placement must be reviewed visually.

### 1. **Checkout — "Place Order" CTA** (`src/pages/Checkout.tsx:164–171`)
Current:
```tsx
className="... bg-gradient-to-r from-rose-200 via-pink-400 to-rose-200 ... border border-rose-500/30 shadow-[0_0_20px_rgba(225,29,72,0.15)] ..."
```
Target:
```tsx
className="... bg-gradient-to-r from-gold-soft via-gold to-gold-deep ... border border-gold-deep/40 shadow-[0_0_24px_rgba(212,175,55,0.25)] hover:shadow-[0_0_36px_rgba(212,175,55,0.45)] text-gold-foreground font-semibold ..."
```

### 2. **Hero accent pinstripe** (`src/components/HeroSection.tsx`)
Find the existing rose underline / accent line beneath "AVON" or below the CTA. Replace **ONE** rose line (whichever is most prominent) with a gold pinstripe:
```tsx
<span className="block h-[1px] w-32 mt-3 bg-gradient-to-r from-transparent via-gold to-transparent" />
```
Also: `selection:bg-amber-500/20` → `selection:bg-gold/20` (consistency fix).

### 3. **Product price emphasis**
- `src/components/ProductCard.tsx` — the price text currently rose; switch to:
  ```tsx
  <p className="font-display text-gold-deep text-xl font-semibold">{product.price} ₾</p>
  ```
- `src/pages/ProductDetails.tsx` (around line 117–120, the big price): same gold-deep treatment, keep size.

### 4. **Logo digit emphasis** (`src/components/Header.tsx`)
The brand mark is "AVON**2**FLAME". Find the `<span>` wrapping the "2" (or AVON2 ligature). Apply:
```tsx
<span className="text-gold">2</span>
```
If it's not already split into a span, wrap just the "2" character.

### 5. **Cart icon badge** (`src/components/Header.tsx`)
The numeric count next to the cart icon currently `bg-rose-500` (or similar). Switch to `bg-gold text-gold-foreground` — small gold pill is unmistakably premium.

### 6. **AboutUs.tsx — already uses `text-gold` / `bg-gold`**
These were silently no-ops before Step 1. Once `gold` is registered in Tailwind they'll render. Visit `src/pages/AboutUs.tsx` lines ~63, 93, 150 and verify in browser they now look intentional. Tweak shade with `text-gold-deep` if needed for contrast.

> 🚫 **Out of bounds:** Do NOT change `rose-*` classes outside these 6 spots. Do NOT add gold to ProductGrid, Catalog, Contact, or category filters.

---

## 🚀 Performance Scope

### Image Optimization

#### Inventory (from `public/` and `public/images/`)
- `public/hero-banner.jpg`, `hero-store.jpg`, `about_narrative.jpg`, `luxury_perfume_bg.png`, `premium-hero-banner.png`, `ai-consultant.png`
- `public/images/perfume-collection-hero.jpg`, `perfume-hero.jpg`, `perfume-pink-hero.jpg`
- `public/images/Whisk_*.mp4` (keep as-is; mp4 is already compressed)

#### Conversion approach
Install `sharp` as a dev dependency and write a one-shot Node script at `scripts/convert-images.mjs`:

```js
import sharp from 'sharp';
import { readdir } from 'fs/promises';
import { join, parse } from 'path';

const dirs = ['public', 'public/images'];
for (const dir of dirs) {
  const files = await readdir(dir);
  for (const file of files) {
    const { ext, name } = parse(file);
    if (!/\.(jpg|jpeg|png)$/i.test(ext)) continue;
    const input = join(dir, file);
    const output = join(dir, `${name}.webp`);
    await sharp(input)
      .webp({ quality: 85, effort: 6 })
      .toFile(output);
    console.log(`✓ ${input} → ${output}`);
  }
}
```

Run once: `bun scripts/convert-images.mjs`. Commit the resulting `.webp` files. **Keep originals** — fallback in case someone disables `Accept: image/webp`.

#### Component updates
Replace image `src` URLs to use the new `.webp` files (no `<picture>` element — modern browsers can take direct `.webp`):
- `public/hero-banner.jpg` → `public/hero-banner.webp` etc.
- Update `src/components/HeroSection.tsx`, `src/pages/AboutUs.tsx`, etc.

Add to every `<img>` below the first fold (anything outside the hero):
```tsx
<img src="..." alt="..." loading="lazy" decoding="async" />
```

The hero's primary image stays `loading="eager"` (LCP optimization).

### Code Splitting

#### Route-level lazy loading (`src/App.tsx`)
```tsx
import { lazy, Suspense } from 'react';
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'));
const AdminCatalogs = lazy(() => import('./pages/admin/AdminCatalogs'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));

// wrap admin routes in <Suspense>:
<Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="font-body text-muted-foreground">Loading admin...</p></div>}>
  <Routes>
    {/* admin routes */}
  </Routes>
</Suspense>
```

#### Vendor chunk strategy (`vite.config.ts` → `build.rollupOptions`)
```ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        'supabase': ['@supabase/supabase-js'],
        'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-alert-dialog', '@radix-ui/react-tabs', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tooltip'],
        'motion': ['framer-motion'],
        'query': ['@tanstack/react-query'],
        'i18n': ['react-i18next', 'i18next'],
      },
    },
  },
},
```

> ⚠️ Verify each `@radix-ui` package name exists in `package.json` before listing it. Drop ones that aren't installed.

---

## 🧾 Execution Order (one commit per logical step)

### **Step 0 — Pre-flight** (Sonnet)
0.1. `git status` → clean working tree (Phase 2 committed)
0.2. `git log --oneline -3` → confirm last commit is `a654788` (Phase 2 cleanup) or later
0.3. `bun run build` → confirm baseline builds; **note the bundle size** (should be ~898 kB)
0.4. Start `bun run dev` in background and visit `http://localhost:8080/` once. Skim Index, ProductDetails, Checkout, AboutUs visually. **You'll re-verify after each step.**

### **Step 1 — Add gold token system** (Sonnet)
- Update `src/index.css` `:root` AND `.dark` with the four `--gold-*` variables shown above.
- Update `tailwind.config.ts` `theme.extend.colors` with the `gold` object.
- Run `npx tsc --noEmit` → must still pass.
- Quick browser check: AboutUs.tsx should now visibly show gold accents (they were no-ops before).

> 📌 Commit: `feat(design): add gold token system to Tailwind and CSS variables`

### **Step 2 — Checkout gold CTA** (Sonnet)
- Edit `src/pages/Checkout.tsx` Place Order button (around line 164–171).
- Apply the gold gradient + border + shadow from §1 above.
- Browser check: navigate to `/checkout` (add an item to cart first), verify CTA is now gold.

> 📌 Commit: `feat(checkout): replace rose CTA with luxury gold gradient`

### **Step 3 — Hero gold accent pinstripe** (Sonnet)
- Edit `src/components/HeroSection.tsx`. Locate the rose underline/accent area.
- Add a single gold pinstripe element OR swap one rose line to gold.
- Fix `selection:bg-amber-500/20` → `selection:bg-gold/20` in the same file.
- Browser check: scroll to Hero, verify gold visible but tasteful.

> 📌 Commit: `feat(hero): add gold accent pinstripe and selection color`

### **Step 4 — Product price in gold** (Sonnet)
- Edit `src/components/ProductCard.tsx`: price text → `font-display text-gold-deep ...`
- Edit `src/pages/ProductDetails.tsx`: large price → same treatment, keep size.
- Browser check: Index grid + a product detail page; gold should "pop" against muted background.

> 📌 Commit: `feat(products): gold price typography for luxury price tags`

### **Step 5 — Header logo digit & cart badge** (Sonnet)
- Edit `src/components/Header.tsx`:
  - Wrap the "2" in the logo with `<span className="text-gold">2</span>` (or `text-gold-deep` if contrast issues).
  - Cart badge background → `bg-gold text-gold-foreground` (locate via grep for `bg-rose-500` near cart icon).
- Browser check: header on all pages; logo + cart badge.

> 📌 Commit: `feat(header): gold accent in logo digit and cart badge`

### **Step 6 — AboutUs polish pass** (Sonnet)
- Open `src/pages/AboutUs.tsx` in browser.
- Lines ~63, 93, 150 — verify `text-gold` / `bg-gold` look intentional now.
- If any element looks "too much gold," tweak to `text-gold-deep` or reduce opacity.
- Likely 0 code changes; this is verification + minor tweaks.

> 📌 Commit (if any): `chore(about): adjust gold shades for visual balance` (skip if no edits)

### **Step 7 — Image conversion to WebP** (Sonnet)
- `bun add -d sharp`
- Create `scripts/convert-images.mjs` with the script shown above.
- Run `bun scripts/convert-images.mjs`. Verify `.webp` siblings created in `public/` and `public/images/`.
- Commit:

> 📌 Commit: `feat(perf): generate WebP versions of all hero/asset images`

### **Step 8 — Update components to use WebP + lazy loading** (Sonnet)
- Grep for `.jpg` and `.png` references in `src/`:
  ```
  Grep pattern: \.(jpg|jpeg|png)
  Glob: src/**/*.{tsx,ts}
  ```
- For each match in customer-facing components (Hero, AboutUs, etc.), swap to `.webp`.
- Add `loading="lazy" decoding="async"` to every `<img>` that is **not** in the hero/above-the-fold.
- The hero image stays `loading="eager"` (LCP).
- Test in browser — no broken images, hero still renders fast.

> 📌 Commit: `perf(images): switch to WebP and add lazy loading below the fold`

### **Step 9 — Route-level lazy loading + vendor chunks** (Sonnet)
- Edit `src/App.tsx`:
  - Convert all 6 admin page imports to `React.lazy()`.
  - Wrap the admin `<Route>` block in `<Suspense fallback={...}>`.
- Edit `vite.config.ts`:
  - Add `build.rollupOptions.output.manualChunks` per spec above.
  - **First**, verify each chunk package exists in `package.json`. Skip any that aren't installed.
- Run `bun run build` and inspect the output. **Expected:**
  - Main customer bundle: ~250–400 kB (down from 898 kB)
  - Separate `react-vendor`, `supabase`, `ui-vendor`, `motion`, `query`, `i18n` chunks
  - Separate admin chunks (AdminProducts, AdminOrders, etc.)
- Test: load `/` → should NOT download admin chunks. Load `/admin/login` → should pull AdminLogin chunk.

> 📌 Commit: `perf(bundle): lazy-load admin routes and split vendor chunks`

### **Step 10 — Final smoke test & verification** (Sonnet)

**Type & build:**
- `npx tsc --noEmit` → 0 errors
- `bun run build` → succeeds; note new bundle sizes

**Manual visual review (browser):**
1. ✅ `/` — Hero shows gold pinstripe; rose elsewhere intact
2. ✅ `/` — Product grid: price in gold serif, hover effects still work
3. ✅ `/product/:id` — Price displayed in gold-deep
4. ✅ `/checkout` (with cart) — Place Order CTA is gold gradient
5. ✅ `/about` — Gold accents finally render properly
6. ✅ Header — "2" in AVON**2**FLAME is gold; cart badge is gold
7. ✅ Add item to cart — badge appears gold
8. ✅ Mobile breakpoint (375px) — no horizontal scroll, gold accents visible
9. ✅ Tablet (768px) — layout intact
10. ✅ DevTools Network tab — admin chunks NOT loaded on `/`
11. ✅ DevTools Network tab — images served as `.webp`
12. ✅ `/admin/login` — loads with Suspense fallback briefly

> 📌 Commit (optional, only if any verification fixes needed): `chore: post-phase-3 polish`

---

## 🚫 Out of Scope for Phase 3

- Full rebrand to gold (Option B was rejected)
- Renaming `rose-*` utilities to semantic tokens (Phase 4+ if ever)
- Customer accounts, order history, MFA (Phase 4)
- Dashboard analytics widgets (Phase 4)
- New animations or motion overhauls
- SEO meta enrichment beyond what exists
- A11y audit (separate sub-phase)
- i18n string review (separate concern)

---

## ✅ Definition of Done

- [ ] `--gold`, `--gold-soft`, `--gold-deep`, `--gold-foreground` defined in both `:root` and `.dark`
- [ ] `gold` registered in `tailwind.config.ts` and usable as `bg-gold`, `text-gold-deep`, etc.
- [ ] AboutUs.tsx's `text-gold` / `bg-gold` classes now render correctly
- [ ] All 6 gold placements in §"Gold Accent Targets" applied and verified
- [ ] **No rose classes outside the 6 spots changed** (grep verifies)
- [ ] All `public/` images have `.webp` siblings
- [ ] Customer-facing components reference `.webp` (with original kept as backup)
- [ ] Below-fold `<img>` tags have `loading="lazy"` + `decoding="async"`
- [ ] Hero image stays `loading="eager"`
- [ ] `/admin/*` routes lazy-loaded; main bundle does NOT include admin code
- [ ] `vite.config.ts` has `manualChunks` for vendor splits
- [ ] `bun run build` shows separate chunks (visible in output)
- [ ] Main customer bundle reduced significantly (target: < 500 kB gzipped, was ~302 kB gzipped baseline — actually small enough; focus is on admin code NOT being in customer bundle)
- [ ] `npx tsc --noEmit` passes
- [ ] All 12 smoke test items pass
- [ ] Mobile / tablet visual check pass
- [ ] Git history: ~9–10 logical commits since Phase 2

---

## 📝 Sonnet's Execution Notes

- **Stay on `master`.** No branches.
- **One commit per logical step.** If a step has multiple files, that's fine — commit them together.
- **Visual review after EVERY visual step.** Run `bun run dev`, refresh, look. If something looks bad, pause and ask Opus before adjusting.
- **Don't introduce gold beyond the 6 spots.** The whole point of Hybrid C is restraint.
- **Image conversion is one-shot.** Don't add the script to CI / package.json scripts unless asked — keep it as a manual tool.
- **If a chunk in `manualChunks` doesn't exist in `package.json`**, drop it from the config silently. Don't fail the step.
- **If Suspense fallback flickers awkwardly,** use a slightly more polished fallback (e.g., a centered spinner) — but keep it minimal.
- **WebP images larger than originals?** This can happen for already-small PNGs. Skip those (leave original) and note in commit message.
- **If you can't tell whether a `.tsx` file is "above" or "below" the fold,** default to `loading="lazy"` — only the hero image is guaranteed eager.
- **Bundle output looks weird?** Run `bun run build` first to get clean output, then proceed with diagnosis. Don't experiment with manualChunks values blindly.
- **If stuck for > 2 attempts on any step:** pause, document what you tried, switch to Opus.

---

## 🔗 Phase 3 Files (anticipated)

```
src/index.css                          (Step 1 — add gold tokens)
tailwind.config.ts                     (Step 1 — register gold)
src/pages/Checkout.tsx                 (Step 2 — gold CTA)
src/components/HeroSection.tsx         (Step 3 — gold pinstripe)
src/components/ProductCard.tsx         (Step 4 — gold price)
src/pages/ProductDetails.tsx           (Step 4 — gold price)
src/components/Header.tsx              (Step 5 — gold logo digit + cart badge)
src/pages/AboutUs.tsx                  (Step 6 — verification pass)
scripts/convert-images.mjs             (Step 7 — NEW)
public/*.webp, public/images/*.webp    (Step 7 — generated)
src/components/HeroSection.tsx         (Step 8 — WebP refs)
src/pages/AboutUs.tsx                  (Step 8 — WebP refs)
... any other component with image refs
src/App.tsx                            (Step 9 — React.lazy + Suspense)
vite.config.ts                         (Step 9 — manualChunks)
package.json                           (Step 7 — sharp devDep)
```

---

*🔚 End of Phase 3 Spec · Hand-off to Sonnet 4.6 ready*
