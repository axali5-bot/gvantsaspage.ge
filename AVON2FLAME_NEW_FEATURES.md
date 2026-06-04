# 💡 AVON2FLAME — ახალი ფუნქციების იდეები
> **Product Owner:** j19mt85@gmail.com  
> **თარიღი:** 2026-05-20  
> **სტატუსი:** იდეების ფაზა — Opus 4.7-ისთვის არქიტექტურული გადაწყვეტილებები, Sonnet 4.6-ისთვის implementation

---

## 📑 სარჩევი

1. [🌟 Killer Features — საქართველოში არავის არ აქვს](#1--killer-features--საქართველოში-არავის-არ-აქვს)
2. [💎 High-Impact Features — გაყიდვებისა და UX-ისთვის](#2--high-impact-features)
3. [📈 Growth Features — ბიზნეს ზრდისთვის](#3--growth-features)
4. [Task Ownership Matrix](#4--task-ownership-matrix)

---

## 1. 🌟 Killer Features — საქართველოში არავის არ აქვს

> გლობალური კვლევის მიხედვით (ევროპა/ამერიკა 2025-2026) — ეს ფუნქციები წამყვანი luxury perfume პლატფორმების cutting edge-ია. საქართველოში არ არსებობს.

---

### 🎵 Scent × Sound Experience
**იდეა:** ყოველ სუნამოს აქვს თავისი "ხმა" — ambient soundtrack, რომელიც უკრავს product page-ზე. მომხმარებელი ხედავს სუნამოს ნოტებს (top / heart / base), სმენს მათთან შესაბამის ბგერას და კითხულობს visual story-ს.

**რატომ გიჟური:** IFF-მა (მსოფლიოს უმსხვილესი fragrance house) დაამტკიცა, რომ სუნამოს ხმასთან დაწყვილება **50%-ით ზრდის purchasing intent-ს** e-commerce-ში. ეს ევროპაში მხოლოდ top brands-ს აქვს. საქართველოში — არავის.

**ტექნიკური განხორციელება:**
- ყოველ სუნამოს Admin-ში ემატება `mood_tags` (fresh / woody / floral / oriental / spicy)
- Web Audio API ან Tone.js-ით generative ambient soundtrack mood-ის მიხედვით
- Product page-ზე animated fragrance pyramid (SVG + Framer Motion) — top/heart/base notes ვიზუალურად
- Optional autoplay toggle (GDPR-friendly)

**Opus task:** mood → sound mapping სისტემის არქიტექტურა  
**Sonnet task:** Tone.js integration + animated notes pyramid UI

---

### 🧬 Scent DNA Profile
**იდეა:** მომხმარებელი პასუხობს 6 კითხვას (ხასიათი, სეზონი, occasion, preferred mood, gender expression, ბოლოს რომელი სუნამო მოეწონა) → იღებს პერსონალურ **"Scent Passport"**-ს — ვიზუალური ბარათი პროფილით + TOP 3 პროდუქტი.

**რატომ მუშაობს:** Import Parfumerie-ს Fragrance Finder-მა (ევროპა, 2025) 97% completion rate მიაღწია და conversion **30%-ით გაზარდა** peak სეზონში.

**ტექნიკური განხორციელება:**
- Claude API-ით — კითხვების პასუხებს AI აანალიზებს და აბრუნებს structured JSON (scent_profile + recommended_product_ids)
- Animated quiz UI (Framer Motion step transitions)
- Shareable "Scent Passport" card — PNG-ად ჩამოსატვირთი (html2canvas)
- Profile localStorage-ში ინახება, logged-in user-ისთვის Supabase-ში

**Opus task:** AI prompt engineering + recommendation logic  
**Sonnet task:** Quiz UI + Passport card generator

---

### 🎨 Fragrance Notes Visualizer
**იდეა:** სუნამოს product page-ზე ინტერაქტიული visual — სუნამოს top/heart/base notes-ი წარმოდგენილია ფერებით, ფორმებით, ემოციებით. "ეს სუნამო გამოიყურება ასე..." — synesthesia effect.

**რატომ გიჟური:** AI-generated scent visuals — globally emerging trend 2025-2026. Inference Beauty-მ ეს ინტეგრირა და conversion 30% გაზარდა.

**ტექნიკური განხორციელება:**
- D3.js ან SVG-ით generative art — ყოველ note-ს აქვს ფერი და ფორმა
- Admin-ში notes editor (tag-based: rose, musk, cedar, vanilla...)
- Animated "სუნამოს სამყარო" — hover-ზე note-ების დეტალები

**Opus task:** notes taxonomy + visual mapping სისტემა  
**Sonnet task:** D3/SVG visualization component

---

### 🪞 Fragrance Wardrobe ("ჩემი სუნამოების კარადა")
**იდეა:** მომხმარებელი ქმნის პირად "კარადას" — სუნამო დილისთვის, სუნამო საღამოსთვის, სუნამო სამსახურისთვის, სუნამო საჩუქრად. Occasion-based curation.

**რატომ გიჟური:** IFF-ის კვლევა 2025: consumer trend — "fragrance wardrobing" — სხვადასხვა სუნამო სხვადასხვა მომენტისთვის. ეს კონცეფცია საქართველოში სრულიად ახალია.

**ტექნიკური განხორციელება:**
- Supabase-ში `user_wardrobes` table (occasion_type + product_id + user_id)
- Drag-and-drop UI — shadcn/ui + dnd-kit
- "გააზიარე კარადა" — shareable link (public URL)
- Push notification: "დილის სუნამო გათავდა" reminder system

**Opus task:** wardrobe schema + sharing სისტემა  
**Sonnet task:** Drag-and-drop UI component

---

## 2. 💎 High-Impact Features

### 🎁 Gift Configurator — "აწყვე სრულყოფილი საჩუქარი"
**იდეა:** Step-by-step gift builder — ირჩევ პროდუქტს → ირჩევ gift box დიზაინს → წერ პირად შეტყობინებას → ირჩევ მიტანის თარიღს → ხედავ preview-ს.

**რატომ მუშაობს:** საქართველოში gift culture ძალიან ძლიერია (8 მარტი, დაბადების დღე, ქორწინება, სახელობო დღეები). ეს პირდაპირ AOV-ს (average order value) ზრდის.

**ტექნიკური განხორციელება:**
- Multi-step form (react-hook-form + Zod)
- Gift box options Supabase-ში (image + price_addon)
- Branded PDF gift card — jsPDF-ით
- Scheduled delivery — orders table-ში `delivery_date` field

**Opus task:** gift order schema + PDF template  
**Sonnet task:** Step-by-step UI + PDF generator

---

### 📸 UGC / "Flame Community" — მომხმარებლების ფოტოები
**იდეა:** მომხმარებელი ატვირთავს ფოტოს პროდუქტთან ერთად → moderation შემდეგ homepage-ზე და product page-ზე ჩნდება real customer gallery.

**ტექნიკური განხორციელება:**
- Supabase Storage-ში `ugc` bucket
- Admin moderation tab (approve/reject)
- Masonry grid (CSS columns ან react-masonry-css)
- Instagram-style hashtag: #AVON2FLAME

**Opus task:** moderation flow + RLS policies  
**Sonnet task:** Upload UI + masonry gallery

---

### 💌 Fragrance Subscription Box — "Flame Monthly"
**იდეა:** ყოველ თვე კურირებული ყუთი 2-3 პროდუქტით, სარპრიზო. Recurring revenue + loyalty + unboxing moment.

**ტექნიკური განხორციელება:**
- Supabase-ში `subscriptions` table (status: active/paused/cancelled)
- Monthly cron job (Supabase Edge Function) → auto-order creation
- Subscriber dashboard (pause/cancel/change preference)
- Stripe ან TBC Pay integration recurring billing-ისთვის

**Opus task:** subscription billing architecture + Edge Function  
**Sonnet task:** Subscriber dashboard UI

---

## 3. 📈 Growth Features

### 🏆 "Flame Points" — Loyalty სისტემა
ყიდვა → ქულები → ფასდაკლება ან სასაჩუქრე. Supabase-ში `loyalty_points` table. Retention-ზე proven impact.

### 📅 Occasion Reminder — Georgian Calendar
"8 მარტამდე 2 კვირაა" → email/push notification → "ნახე ჩვენი საჩუქრები". Georgian holidays-focused marketing automation (Supabase Edge Functions + Resend).

### 🛍 Scent Layering — "შექმენი შენი კომბინაცია"
2-3 სუნამოს კომბინაცია → "signature scent" — mix-and-match product page-ზე. Bundle pricing.

### 🔔 Back-in-Stock Alerts
"შემატყობინე" ღილაკი — Supabase-ში `stock_alerts` table → Edge Function → email/SMS.

### ⭐ Reviews & Ratings + Verified Purchase Badge
Product page-ზე reviews, მხოლოდ verified purchaser-ებს შეუძლიათ დაწერა.

---

## 4. 🤖 Task Ownership Matrix

| Feature | 🧠 Opus 4.7 (Architect) | ⚡ Sonnet 4.6 (Builder) | Priority |
|---|---|---|---|
| Scent × Sound | Audio-mood mapping architecture, generative sound system design | Tone.js integration, animated notes pyramid UI | 🔥 P0 Killer |
| Scent DNA / Quiz | Claude API prompt engineering, recommendation algorithm | Quiz UI, Passport card generator | 🔥 P0 Killer |
| Fragrance Notes Visualizer | Notes taxonomy, visual mapping system | D3/SVG component | 🔥 P0 Killer |
| Fragrance Wardrobe | Schema design, sharing system, RLS | Drag-and-drop UI | 🔥 P0 Killer |
| Gift Configurator | Gift order schema, PDF template architecture | Multi-step form UI, PDF generator | ⭐ P1 High |
| UGC Gallery | Moderation flow, storage RLS | Upload UI, masonry gallery | ⭐ P1 High |
| Subscription Box | Billing architecture, Edge Function | Subscriber dashboard | ⭐ P1 High |
| Flame Points | Points schema, redemption rules | Loyalty UI | 📌 P2 |
| Occasion Reminders | Edge Function + email architecture | Notification UI | 📌 P2 |
| Scent Layering / Bundles | Bundle pricing logic | UI component | 📌 P2 |
| Back-in-Stock Alerts | Alert queue system | UI button + form | 📌 P2 |
| Reviews & Ratings | Anti-spam RLS, moderation | Review form + display | 📌 P2 |

---

## 5. 🎯 რეკომენდირებული თანმიმდევრობა

```
Sprint 1 (1-2 კვირა):
  → Scent DNA Quiz (Claude API) — ყველაზე მაღალი conversion impact
  → Fragrance Notes Visualizer — product page-ს გარდაქმნის

Sprint 2 (2-3 კვირა):
  → Scent × Sound Experience — WOW factor, PR-able feature
  → Gift Configurator — 8 მარტამდე/სეზონური

Sprint 3 (3-4 კვირა):
  → Fragrance Wardrobe — community building
  → UGC Gallery — social proof

Sprint 4+:
  → Subscription Box (Flame Monthly)
  → Loyalty + Occasion Reminders
```

---

## 6. 📊 გლობალური მონაცემები (კონტექსტისთვის)

| მეტრიკა | მონაცემი | წყარო |
|---|---|---|
| AI scent quiz completion rate | 97% | Import Parfumerie, 2025 |
| Conversion boost from AI quiz | +30% | Inference Beauty Fragrance Finder |
| Purchase intent boost (scent+sound) | +50% | IFF × Ircam Amplify research |
| Repurchase rate after AI recommendation | 3.2x | Scento, 2025 |
| Purchase regret reduction (AI sampling) | -86% | Scento €25M study, Nov 2025 |
| Online fragrance market share (2026) | 35% globally | Scento Market Report |

---

*📄 ეს დოკუმენტი შექმნილია Claude claude.ai-ზე · Product Owner: j19mt85@gmail.com*  
*🤖 Implementation: Claude Code (Opus 4.7 + Sonnet 4.6)*
