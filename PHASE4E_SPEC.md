# Phase 4E — Order Status Email Notifications

**Architect:** Claude Opus 4.7
**Executor:** Claude Sonnet 4.6 (after USER manual setup)
**Created:** 2026-05-24
**Status:** READY (BLOCKED ON MANUAL RESEND + DNS + WEBHOOK SETUP)
**Depends on:** Phase 4A–4D complete
**Phase position:** LAST planned feature phase. After 4E, AVON2FLAME = feature-complete.

---

## 🎯 Goal

Automatically email customers when their order status changes:

| Old status | New status | Email subject (ka) |
|---|---|---|
| `pending` | `processing` | შენი შეკვეთა მზადდება |
| `pending`/`processing` | `completed` | შენი შეკვეთა მიწოდებულია |
| any | `cancelled` | შენი შეკვეთა გაუქმდა |

Customer receives the email in **their language** (ka/en/ru), based on the language they used at checkout.

**Non-goals (defer to future phases):**
- ~~Order creation confirmation email~~ — thank-you page covers this
- ~~Email preferences toggle in /account~~ — transactional emails standardly don't have opt-out
- ~~Marketing emails / newsletters~~ — separate phase if ever needed
- ~~Anonymous order notifications~~ — anonymous orders have no email (admin phones them per existing flow)

---

## 🔑 Critical Finding (Checkout schema)

**The `orders` table has NO `customer_email` column.**

- Anonymous orders: only `customer_name + customer_phone + customer_address`
- Logged-in orders: have `user_id` → join to `auth.users.email`

**Implication:** Phase 4E emails will be sent **only to logged-in customer orders** (those with `user_id IS NOT NULL`). Anonymous orders are silently skipped — admin phones them per existing flow.

This is **the right tradeoff** because:
- Anonymous checkout stays frictionless (no email field added)
- Customer Accounts (Phase 4A) gave users a reason to sign up → emails are a Phase-4A benefit
- Adding email field to checkout would be a separate Phase that we're not doing now

---

## 🛑 PRE-PHASE 4E — Manual setup (USER does this before Sonnet starts)

### Step 1 — Resend account + API key
1. Sign up at https://resend.com (free tier: 100 emails/day, 3000/month)
2. **Sender domains** → **Add Domain** → `gvantsaspage.ge`
3. Resend will show DNS records you must add (SPF TXT + 2-3 DKIM CNAMEs + DMARC TXT recommended)
4. Add these records in **Vercel DNS panel** (since nameservers point to Vercel after your domain mapping)
5. Wait 5-30 min for DNS propagation → click **Verify** in Resend dashboard
6. **API Keys** → **Create API Key** → name: `avon2flame-edge-function`, permission: **Sending access**
7. Copy the API key (`re_...`) — save securely, will paste into Supabase

### Step 2 — Generate WEBHOOK_SECRET
A 32-char random secret for verifying that webhook calls come from Supabase (not random internet).

Run in terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Or any random-string generator. Save the result.

### Step 3 — Supabase: Edge Function secrets
1. Go to https://supabase.com/dashboard/project/rhfzdzipciasljblbmtf/settings/functions
2. **Add new secret:**
   - `RESEND_API_KEY` = `re_...` (from Step 1.7)
   - `WEBHOOK_SECRET` = (from Step 2)

### Step 4 — Database migration (USER runs in SQL editor, OR Sonnet runs via MCP if available)

```sql
-- 1. Add language to orders (default 'ka' for legacy + new anonymous orders)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'ka'
  CHECK (language IN ('ka', 'en', 'ru'));

-- 2. notification_log table — idempotency + audit trail
CREATE TABLE IF NOT EXISTS notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  resend_id TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  error TEXT,
  UNIQUE (order_id, status)
);

-- 3. RLS — service_role only (Edge Function uses service_role implicitly)
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

-- (No policies = no access for anon or authenticated. service_role bypasses RLS.)

-- 4. Update create_order RPC to accept language
CREATE OR REPLACE FUNCTION create_order(
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_customer_address TEXT,
  p_items JSONB,
  p_user_id UUID DEFAULT NULL,
  p_language TEXT DEFAULT 'ka'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id UUID;
  v_item JSONB;
  v_product RECORD;
  v_total NUMERIC := 0;
BEGIN
  -- Validate language
  IF p_language NOT IN ('ka', 'en', 'ru') THEN
    p_language := 'ka';
  END IF;

  -- Create order shell
  INSERT INTO orders (user_id, customer_name, customer_phone, customer_address, status, language, total_price)
  VALUES (p_user_id, p_customer_name, p_customer_phone, p_customer_address, 'pending', p_language, 0)
  RETURNING id INTO v_order_id;

  -- Lock + verify each product, build order_items, compute total
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    SELECT id, name_ka, name_en, name_ru, price, stock
      INTO v_product
      FROM products
      WHERE id = (v_item->>'product_id')::UUID
      FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product not found: %', v_item->>'product_id';
    END IF;

    IF v_product.stock < (v_item->>'quantity')::INT THEN
      RAISE EXCEPTION 'Insufficient stock for product %', v_product.name_ka;
    END IF;

    INSERT INTO order_items (order_id, product_id, quantity, price_at_time)
    VALUES (v_order_id, v_product.id, (v_item->>'quantity')::INT, v_product.price);

    UPDATE products SET stock = stock - (v_item->>'quantity')::INT WHERE id = v_product.id;

    v_total := v_total + (v_product.price * (v_item->>'quantity')::INT);
  END LOOP;

  UPDATE orders SET total_price = v_total WHERE id = v_order_id;

  RETURN v_order_id;
END;
$$;
```

**▸ NOTE on RPC:** The existing `create_order` body may differ slightly. Sonnet must `\df create_order` (or use MCP) to **preserve current behavior** and add only `p_language` + language insert. If MCP unavailable, USER pastes current function definition for Sonnet to merge.

### Step 5 — Database Webhook (USER configures in Dashboard)
1. Go to https://supabase.com/dashboard/project/rhfzdzipciasljblbmtf/database/hooks
2. **Create a new hook:**
   - **Name:** `order_status_notify`
   - **Table:** `orders`
   - **Events:** ☑ UPDATE
   - **Type:** HTTP Request
   - **Method:** POST
   - **URL:** `https://rhfzdzipciasljblbmtf.supabase.co/functions/v1/notify-order-status` *(will exist after Sonnet deploys the function)*
   - **HTTP Headers:**
     - `Content-Type: application/json`
     - `Authorization: Bearer <WEBHOOK_SECRET from Step 2>`
   - **HTTP Params:** (none)
   - **Save**

**▸ Order of operations:** Sonnet deploys Edge Function FIRST → user creates webhook SECOND. Otherwise webhook calls 404.

### Step 6 — Confirm to Sonnet
User confirms: "Phase 4E setup done — Resend verified, secrets added, migration ran, ready for Edge Function deploy"

---

## 📁 Files to Create / Modify

### NEW files

#### `supabase/functions/notify-order-status/index.ts`

**Purpose:** Edge Function that receives webhook from Supabase on order UPDATE, decides if it should send email, builds template, calls Resend, logs to DB.

```typescript
// supabase/functions/notify-order-status/index.ts
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { getEmailTemplate, type EmailLang, type EmailStatus } from './templates.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const WEBHOOK_SECRET = Deno.env.get('WEBHOOK_SECRET')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const FROM = 'AVON2FLAME <noreply@gvantsaspage.ge>';
const SITE_URL = 'https://gvantsaspage.ge';
const NOTIFIED_STATUSES: EmailStatus[] = ['processing', 'completed', 'cancelled'];

interface WebhookPayload {
  type: 'UPDATE';
  table: 'orders';
  record: {
    id: string;
    user_id: string | null;
    customer_name: string;
    total_price: number;
    status: string;
    language: 'ka' | 'en' | 'ru';
    created_at: string;
  };
  old_record: {
    status: string;
  };
}

serve(async (req: Request) => {
  // 1. Auth: verify webhook secret
  const auth = req.headers.get('Authorization');
  if (auth !== `Bearer ${WEBHOOK_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response('Bad payload', { status: 400 });
  }

  // 2. Validate this is an UPDATE on orders with status change
  if (payload.type !== 'UPDATE' || payload.table !== 'orders') {
    return new Response('Ignored: wrong event', { status: 200 });
  }
  const newStatus = payload.record.status;
  const oldStatus = payload.old_record.status;
  if (newStatus === oldStatus) {
    return new Response('Ignored: status unchanged', { status: 200 });
  }
  if (!NOTIFIED_STATUSES.includes(newStatus as EmailStatus)) {
    return new Response('Ignored: status not in notify set', { status: 200 });
  }

  // 3. Skip anonymous orders (no email)
  if (!payload.record.user_id) {
    return new Response('Ignored: anonymous order', { status: 200 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // 4. Get customer email (auth.users) — service_role can read auth schema
  const { data: userData, error: userError } = await supabase.auth.admin.getUserById(payload.record.user_id);
  if (userError || !userData?.user?.email) {
    console.error('Failed to fetch user email', userError);
    return new Response('User email not found', { status: 200 }); // 200, don't retry
  }
  const recipientEmail = userData.user.email;

  // 5. Idempotency check — insert log row FIRST, send AFTER
  //    UNIQUE(order_id, status) protects against duplicate sends
  const { error: logError } = await supabase
    .from('notification_log')
    .insert({
      order_id: payload.record.id,
      status: newStatus,
      recipient_email: recipientEmail,
    });

  if (logError) {
    // 23505 = unique_violation → already sent, skip
    if (logError.code === '23505') {
      return new Response('Already sent (idempotent)', { status: 200 });
    }
    console.error('Log insert failed', logError);
    return new Response('Log error', { status: 500 });
  }

  // 6. Build + send email
  const lang = (payload.record.language || 'ka') as EmailLang;
  const template = getEmailTemplate(newStatus as EmailStatus, lang, {
    customerName: payload.record.customer_name,
    orderId: payload.record.id,
    orderTotal: payload.record.total_price,
    siteUrl: SITE_URL,
  });

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: FROM,
      to: recipientEmail,
      subject: template.subject,
      html: template.html,
    }),
  });

  const resendData = await resendRes.json();

  if (!resendRes.ok) {
    // Update log with error, return 500 → Supabase will retry up to 3x
    await supabase
      .from('notification_log')
      .update({ error: JSON.stringify(resendData) })
      .eq('order_id', payload.record.id)
      .eq('status', newStatus);
    console.error('Resend API error', resendData);
    return new Response('Resend failed', { status: 500 });
  }

  // Success — patch log with resend id
  await supabase
    .from('notification_log')
    .update({ resend_id: resendData.id })
    .eq('order_id', payload.record.id)
    .eq('status', newStatus);

  return new Response(JSON.stringify({ ok: true, resend_id: resendData.id }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
```

#### `supabase/functions/notify-order-status/templates.ts`

**Purpose:** 9 email templates as TypeScript object (3 statuses × 3 languages). Inline HTML, AVON2FLAME-branded, rose-themed, mobile-responsive.

```typescript
// supabase/functions/notify-order-status/templates.ts
export type EmailLang = 'ka' | 'en' | 'ru';
export type EmailStatus = 'processing' | 'completed' | 'cancelled';

interface TemplateContext {
  customerName: string;
  orderId: string;
  orderTotal: number;
  siteUrl: string;
}

interface Template {
  subject: string;
  html: string;
}

// Short order ID for display: first 8 chars of UUID
const shortId = (id: string) => id.slice(0, 8).toUpperCase();

const wrapHtml = (innerHtml: string, accentColor: string = '#ec4899') => `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body { margin:0; padding:0; background:#fdf2f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  .container { max-width: 560px; margin: 0 auto; padding: 32px 16px; }
  .card { background: #ffffff; border-radius: 24px; padding: 40px 32px; border: 1px solid #fce7f3; box-shadow: 0 4px 24px rgba(244, 114, 182, 0.08); }
  .logo { text-align: center; font-family: Georgia, serif; font-size: 28px; letter-spacing: 0.4em; color: ${accentColor}; margin-bottom: 32px; }
  .heading { font-family: Georgia, serif; font-size: 24px; color: #1f2937; margin: 0 0 16px; text-align: center; }
  .body-text { font-size: 15px; line-height: 1.6; color: #4b5563; margin: 0 0 24px; }
  .order-box { background: #fdf2f8; border-radius: 12px; padding: 20px; margin: 24px 0; }
  .order-row { display: flex; justify-content: space-between; font-size: 14px; color: #6b7280; margin: 6px 0; }
  .order-row strong { color: #1f2937; }
  .cta { display: block; text-align: center; background: ${accentColor}; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 13px; letter-spacing: 0.15em; text-transform: uppercase; font-weight: 600; margin: 32px auto 0; max-width: 280px; }
  .footer { text-align: center; font-size: 12px; color: #9ca3af; margin-top: 32px; }
  .footer a { color: ${accentColor}; text-decoration: none; }
</style></head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">AVON<span style="color:#9f1239;font-weight:bold">2</span>FLAME</div>
      ${innerHtml}
    </div>
    <div class="footer">
      © AVON2FLAME · <a href="https://gvantsaspage.ge">gvantsaspage.ge</a>
    </div>
  </div>
</body></html>`;

const T: Record<EmailStatus, Record<EmailLang, (ctx: TemplateContext) => Template>> = {
  processing: {
    ka: (c) => ({
      subject: `შენი შეკვეთა მზადდება — #${shortId(c.orderId)}`,
      html: wrapHtml(`
        <h1 class="heading">შენი შეკვეთა მზადდება ✨</h1>
        <p class="body-text">გამარჯობა <strong>${c.customerName}</strong>,<br><br>
        გვინდა გაცნობოთ, რომ თქვენი შეკვეთა მიღებულია და ამჟამად მუშავდება. ჩვენი წარმომადგენელი მალე დაგიკავშირდებათ მიწოდების დასადასტურებლად.</p>
        <div class="order-box">
          <div class="order-row"><span>შეკვეთა №</span><strong>#${shortId(c.orderId)}</strong></div>
          <div class="order-row"><span>ჯამი</span><strong>${c.orderTotal} ₾</strong></div>
        </div>
        <a href="${c.siteUrl}/account/orders" class="cta">შეკვეთის ნახვა</a>
      `),
    }),
    en: (c) => ({
      subject: `Your order is being prepared — #${shortId(c.orderId)}`,
      html: wrapHtml(`
        <h1 class="heading">Your order is being prepared ✨</h1>
        <p class="body-text">Hello <strong>${c.customerName}</strong>,<br><br>
        We're delighted to let you know your order has been received and is now being prepared. Our representative will be in touch shortly to confirm delivery.</p>
        <div class="order-box">
          <div class="order-row"><span>Order №</span><strong>#${shortId(c.orderId)}</strong></div>
          <div class="order-row"><span>Total</span><strong>${c.orderTotal} ₾</strong></div>
        </div>
        <a href="${c.siteUrl}/account/orders" class="cta">View order</a>
      `),
    }),
    ru: (c) => ({
      subject: `Ваш заказ готовится — #${shortId(c.orderId)}`,
      html: wrapHtml(`
        <h1 class="heading">Ваш заказ готовится ✨</h1>
        <p class="body-text">Здравствуйте, <strong>${c.customerName}</strong>,<br><br>
        Рады сообщить, что ваш заказ получен и сейчас готовится. Наш представитель свяжется с вами для подтверждения доставки.</p>
        <div class="order-box">
          <div class="order-row"><span>Заказ №</span><strong>#${shortId(c.orderId)}</strong></div>
          <div class="order-row"><span>Сумма</span><strong>${c.orderTotal} ₾</strong></div>
        </div>
        <a href="${c.siteUrl}/account/orders" class="cta">Посмотреть заказ</a>
      `),
    }),
  },
  completed: {
    ka: (c) => ({
      subject: `შენი შეკვეთა მიწოდებულია — #${shortId(c.orderId)}`,
      html: wrapHtml(`
        <h1 class="heading">შენი შეკვეთა მიწოდებულია 💝</h1>
        <p class="body-text">გამარჯობა <strong>${c.customerName}</strong>,<br><br>
        გვინდა გვწამოვიდეთ, რომ თქვენი შეკვეთა წარმატებით მიწოდდა. ვიმედოვნებთ, რომ ისიამოვნებთ თქვენი ახალი არომატით. გმადლობთ, რომ აირჩიეთ AVON2FLAME!</p>
        <div class="order-box">
          <div class="order-row"><span>შეკვეთა №</span><strong>#${shortId(c.orderId)}</strong></div>
          <div class="order-row"><span>ჯამი</span><strong>${c.orderTotal} ₾</strong></div>
        </div>
        <a href="${c.siteUrl}" class="cta">ახალი არომატის აღმოჩენა</a>
      `),
    }),
    en: (c) => ({
      subject: `Your order has been delivered — #${shortId(c.orderId)}`,
      html: wrapHtml(`
        <h1 class="heading">Your order has been delivered 💝</h1>
        <p class="body-text">Hello <strong>${c.customerName}</strong>,<br><br>
        Your order has been successfully delivered. We hope you enjoy your new fragrance. Thank you for choosing AVON2FLAME!</p>
        <div class="order-box">
          <div class="order-row"><span>Order №</span><strong>#${shortId(c.orderId)}</strong></div>
          <div class="order-row"><span>Total</span><strong>${c.orderTotal} ₾</strong></div>
        </div>
        <a href="${c.siteUrl}" class="cta">Discover more fragrances</a>
      `),
    }),
    ru: (c) => ({
      subject: `Ваш заказ доставлен — #${shortId(c.orderId)}`,
      html: wrapHtml(`
        <h1 class="heading">Ваш заказ доставлен 💝</h1>
        <p class="body-text">Здравствуйте, <strong>${c.customerName}</strong>,<br><br>
        Ваш заказ успешно доставлен. Надеемся, вы насладитесь новым ароматом. Спасибо, что выбрали AVON2FLAME!</p>
        <div class="order-box">
          <div class="order-row"><span>Заказ №</span><strong>#${shortId(c.orderId)}</strong></div>
          <div class="order-row"><span>Сумма</span><strong>${c.orderTotal} ₾</strong></div>
        </div>
        <a href="${c.siteUrl}" class="cta">Открыть новые ароматы</a>
      `),
    }),
  },
  cancelled: {
    ka: (c) => ({
      subject: `შენი შეკვეთა გაუქმდა — #${shortId(c.orderId)}`,
      html: wrapHtml(`
        <h1 class="heading">შენი შეკვეთა გაუქმდა</h1>
        <p class="body-text">გამარჯობა <strong>${c.customerName}</strong>,<br><br>
        გვინდა გაცნობოთ, რომ თქვენი შეკვეთა გაუქმდა. თუ კითხვები გაქვთ, გთხოვთ, დაგვიკავშირდეთ ვებგვერდის Contact გვერდის მეშვეობით.</p>
        <div class="order-box">
          <div class="order-row"><span>შეკვეთა №</span><strong>#${shortId(c.orderId)}</strong></div>
          <div class="order-row"><span>ჯამი</span><strong>${c.orderTotal} ₾</strong></div>
        </div>
        <a href="${c.siteUrl}/contact" class="cta">დაკავშირება</a>
      `, '#6b7280'),
    }),
    en: (c) => ({
      subject: `Your order has been cancelled — #${shortId(c.orderId)}`,
      html: wrapHtml(`
        <h1 class="heading">Your order has been cancelled</h1>
        <p class="body-text">Hello <strong>${c.customerName}</strong>,<br><br>
        We're writing to let you know that your order has been cancelled. If you have any questions, please reach out via our Contact page.</p>
        <div class="order-box">
          <div class="order-row"><span>Order №</span><strong>#${shortId(c.orderId)}</strong></div>
          <div class="order-row"><span>Total</span><strong>${c.orderTotal} ₾</strong></div>
        </div>
        <a href="${c.siteUrl}/contact" class="cta">Contact us</a>
      `, '#6b7280'),
    }),
    ru: (c) => ({
      subject: `Ваш заказ отменён — #${shortId(c.orderId)}`,
      html: wrapHtml(`
        <h1 class="heading">Ваш заказ отменён</h1>
        <p class="body-text">Здравствуйте, <strong>${c.customerName}</strong>,<br><br>
        Сообщаем вам, что ваш заказ отменён. По любым вопросам, пожалуйста, свяжитесь с нами через страницу контактов.</p>
        <div class="order-box">
          <div class="order-row"><span>Заказ №</span><strong>#${shortId(c.orderId)}</strong></div>
          <div class="order-row"><span>Сумма</span><strong>${c.orderTotal} ₾</strong></div>
        </div>
        <a href="${c.siteUrl}/contact" class="cta">Связаться с нами</a>
      `, '#6b7280'),
    }),
  },
};

export function getEmailTemplate(
  status: EmailStatus,
  lang: EmailLang,
  ctx: TemplateContext
): Template {
  return T[status][lang](ctx);
}
```

### MODIFIED files

#### `src/pages/Checkout.tsx`
Pass current i18n language to RPC. Single-line change.

```tsx
// at top of file, near useTranslation:
import { useTranslation } from "react-i18next";
const { t, i18n } = useTranslation();  // add i18n

// inside handleSubmit, inside the rpc call:
const { error: rpcError } = await supabase.rpc('create_order', {
  p_customer_name: formData.name,
  p_customer_phone: formData.phone,
  p_customer_address: formData.address,
  p_items: cart.map(item => ({
    product_id: item.id,
    quantity: item.quantity
  })),
  p_user_id: user?.id ?? null,
  p_language: i18n.language as 'ka' | 'en' | 'ru',  // <-- ADD THIS
});
```

Make sure `i18n.language` is one of `'ka' | 'en' | 'ru'` — if it's `'en-US'` or similar locale, strip to base. (Sonnet: verify by logging `i18n.language` at runtime; if needed, add `.slice(0, 2)` or whitelist.)

---

## 🎨 Email Design Decisions

- **Rose accent for processing/completed** (`#ec4899`), **gray accent for cancelled** (`#6b7280`) — visually communicates positivity vs neutral
- **Inline CSS only** (email clients strip `<style>` blocks unreliably — but `<style>` in `<head>` works in major clients including Gmail. We use both for safety.)
- **No images** — pure HTML/CSS for maximum deliverability and no external image hosting needed
- **Logo as text** — `AVON2FLAME` rendered in Georgia serif font like the site
- **Mobile-responsive** — max-width 560px, flexible padding
- **One CTA per email** — clear next step (View order / Discover more / Contact us)

---

## 🔒 Security

1. **Webhook signature verification** — `Authorization: Bearer <WEBHOOK_SECRET>` header. Function rejects anything else with 401.
2. **Service role key** — only used inside Edge Function, never exposed.
3. **Resend API key** — Supabase secret, never reaches client.
4. **Idempotency** — `notification_log` UNIQUE constraint prevents duplicate sends on webhook retries.
5. **RLS on notification_log** — service_role bypasses, no anon/auth access. Admin can read via service_role if needed for support.
6. **Email enumeration** — function returns 200 (don't retry) even when user has no email. Doesn't leak whether email exists.

---

## 🧪 Acceptance Criteria

**Happy path:**
1. Logged-in customer places order via `/checkout` — status `pending`, language `ka`/`en`/`ru` based on UI
2. Admin opens `/admin/orders`, changes status `pending → processing`
3. Within ~5 seconds, customer's inbox has email "შენი შეკვეთა მზადდება" (or en/ru per their checkout language)
4. Admin changes to `completed` → second email arrives
5. `notification_log` shows 2 rows for that order

**Status-change to same status:**
- Admin clicks status, picks same value → webhook fires but function exits early (no email, no log row)

**Webhook retry safety:**
- If Supabase retries (e.g., network blip), second call hits UNIQUE constraint → returns 200 "Already sent" → no duplicate email

**Anonymous order:**
- Status changes on order with `user_id IS NULL` → function exits early (no email, no log row)

**Resend failure:**
- API key invalid / Resend down → function returns 500, log row has `error` populated, Supabase retries up to 3x
- Once Resend recovers, retry succeeds, log row gets `resend_id`

**Language fallback:**
- Old orders (pre-migration) have `language = 'ka'` from DEFAULT → emails in Georgian (correct default for Georgian market)

---

## 📦 Deliverable Sequence (Sonnet execution order)

**Pre-flight:** Confirm USER completed Manual Setup Steps 1–4 (Steps 5 + 6 happen AFTER deploy).

1. **Create `supabase/functions/notify-order-status/index.ts`**
2. **Create `supabase/functions/notify-order-status/templates.ts`**
3. **Deploy function** to Supabase via Supabase CLI:
   ```bash
   npx supabase functions deploy notify-order-status --project-ref rhfzdzipciasljblbmtf
   ```
   *(If Supabase CLI not installed: `npm i -g supabase` first. User may need to `supabase login`.)*
4. **Update `src/pages/Checkout.tsx`** — add `i18n` to useTranslation + add `p_language` to RPC call
5. **TypeScript check** — `npx tsc --noEmit`
6. **Build** — verify customer bundle unchanged (Edge Function is backend, doesn't enter bundle)
7. **Commit + push** — branch `master`, single commit per Phase 4 pattern
8. **REPORT back to USER** with:
   - Function URL (for Step 5 webhook setup)
   - Instructions for USER to do Manual Setup Step 5 (Webhook) + Step 6 (confirmation)
9. **USER does Webhook setup** + tests an order status change
10. **Smoke test report** from USER → Sonnet diagnoses if anything fails

---

## ⚠️ Watch Out For

- **Supabase Edge Function cold start** — first invocation can take 2-3s; subsequent calls are instant. Not a customer-facing latency concern (admin sees no delay; customer doesn't wait for email).
- **Email going to spam** — until DNS reputation builds, some Gmail/Yahoo users may see emails in spam. Tell user to mark first one as "Not spam" → improves deliverability quickly.
- **Resend free tier limit** — 100/day. AVON2FLAME volume is well under this. If it ever approaches, alert and upgrade ($20/mo for 50k/mo).
- **CORS** — not needed (server-to-server webhook call). Don't add CORS middleware (waste of code).
- **`auth.admin.getUserById`** — requires service_role key, which Edge Functions have via `SUPABASE_SERVICE_ROLE_KEY` env (auto-provisioned by Supabase). No manual config.
- **`old_record` may be undefined** for INSERT events — we filter on `type === 'UPDATE'` so this is safe, but Sonnet should add defensive null check.
- **Local i18n value** — `i18n.language` might be `'en-US'` not `'en'`. Verify at runtime, add `.split('-')[0]` if needed.
- **Migration ordering** — `language` column must exist BEFORE Sonnet deploys function (function reads `payload.record.language`). User runs SQL migration before Step 5.

---

## 🚦 Hand-off Protocol

**▸ BLOCKER triggers:**
- Resend domain verification fails (DNS not propagated, wrong records)
- Supabase CLI not available to deploy function (need user to install)
- `create_order` RPC signature differs from spec — need to merge with existing body
- Edge Function returns 401 on webhook test (secret mismatch)
- Format: `🚨 Senior Fullstack Opus 4.7-ის შემოსვლა მჭირდება — blocker: [აღწერე]`

**▸ Phase 4E COMPLETE:**
```
🔄 გადართე Opus 4.7-ზე — Phase 4E done. AVON2FLAME = feature-complete!
   Ready for: final code review, then maintenance mode / marketing prep.
```

---

## 📊 Report Format (when complete)

When done, report:
- Deliverables completed / blocked
- Resend domain verified? (yes/no)
- First test email received? (which status, which language)
- `notification_log` row populated correctly?
- Bundle size impact (should be 0 — Edge Function is server-side)
- Open questions for Opus

---

## 🏁 After Phase 4E — Roadmap Closed

**AVON2FLAME is feature-complete.** Future work shifts to:
- Marketing (SEO content, social media)
- Operations (admin onboarding new products, order fulfillment workflow)
- Optional optimizations (lighthouse audits, image lazy-loading review)
- Bug fixes as they arise

No more planned feature phases. The store can run.
