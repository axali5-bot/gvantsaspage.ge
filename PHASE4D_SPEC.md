# Phase 4D — Auth Recovery + Google OAuth

**Architect:** Claude Opus 4.7
**Executor:** Claude Sonnet 4.6 (after USER manual setup)
**Created:** 2026-05-24
**Status:** READY (BLOCKED ON MANUAL GOOGLE CLOUD + SUPABASE SETUP)
**Depends on:** Phase 4A–4C complete

---

## 🎯 Goal

Two user-facing auth improvements:
1. **Google OAuth** — one-click signup/login via Google account
2. **Password reset flow** — `/auth/forgot-password` + `/auth/reset-password`

**Non-goals (dropped from roadmap):**
- ~~Leaked-password protection~~ — Supabase free plan does not support
- ~~MFA (TOTP)~~ — overkill for single-admin store; dropped

After Phase 4D, AVON2FLAME auth surface = signup/login/Google/password recovery + admin. Complete.

---

## 🛑 PRE-PHASE 4D — Manual setup (USER does this before Sonnet starts)

These steps cannot be automated — they require Google Cloud Console + Supabase Dashboard clicks. Sonnet will WAIT until USER confirms steps complete.

### Step 1 — Google Cloud Console: Create OAuth 2.0 Client ID

1. Go to https://console.cloud.google.com/
2. Create new project: **"AVON2FLAME"** (or select existing)
3. Left sidebar → **APIs & Services** → **OAuth consent screen**
   - User Type: **External**
   - App name: `AVON2FLAME`
   - User support email: `j19mt85@gmail.com`
   - Developer contact: `j19mt85@gmail.com`
   - Save
4. Left sidebar → **APIs & Services** → **Credentials** → **+ Create Credentials** → **OAuth client ID**
   - Application type: **Web application**
   - Name: `AVON2FLAME Web Client`
   - **Authorized JavaScript origins:**
     - `https://gvantsaspage-ge.vercel.app`
     - `https://gvantsaspage.ge` (if you have a custom domain)
     - `http://localhost:5173`
   - **Authorized redirect URIs:**
     - `https://rhfzdzipciasljblbmtf.supabase.co/auth/v1/callback`
   - **Create**
5. Copy **Client ID** and **Client Secret** → save somewhere safe (you'll paste them into Supabase)

### Step 2 — Supabase Dashboard: Enable Google provider

1. Go to https://supabase.com/dashboard/project/rhfzdzipciasljblbmtf/auth/providers
2. Find **Google** → toggle **Enable Sign in with Google**
3. Paste:
   - **Client ID (for OAuth)**: from Step 1
   - **Client Secret (for OAuth)**: from Step 1
4. **Save**

### Step 3 — Supabase Auth → URL Configuration

1. Go to https://supabase.com/dashboard/project/rhfzdzipciasljblbmtf/auth/url-configuration
2. **Site URL**: `https://gvantsaspage-ge.vercel.app` (or your custom domain if set)
3. **Redirect URLs** (add ALL of these, one per line):
   - `https://gvantsaspage-ge.vercel.app/**`
   - `https://gvantsaspage.ge/**` (if custom domain)
   - `http://localhost:5173/**`
4. **Save**

### Step 4 — (Optional but recommended) Customize password reset email template

1. Go to https://supabase.com/dashboard/project/rhfzdzipciasljblbmtf/auth/templates
2. Select **Reset Password** template
3. Modify subject: `AVON2FLAME — პაროლის აღდგენა`
4. Body (HTML): keep `{{ .ConfirmationURL }}` placeholder, customize Georgian text
5. **Save**

### Step 5 — Confirm to Sonnet 4.6

User confirms: "Google OAuth setup დასრულდა, Phase 4D-ის implementation დაიწყე"

---

## 📊 Current State

**Auth infrastructure (READY):**
- `useAuth` hook provides `user`, `profile`, `signIn`, `signUp`, `signOut`, `refreshProfile`, `isAdmin`
- `signIn` and `signUp` use email/password (Supabase Auth)
- Routes `/auth/signup` and `/auth/login` exist
- `ProtectedCustomerRoute` redirects unauthenticated users to `/auth/login?next=<path>`

**Missing (Phase 4D adds):**
- `signInWithGoogle()` method
- `/auth/forgot-password` route + page
- `/auth/reset-password` route + page
- "Continue with Google" button on Login + Signup
- "Forgot password?" link on Login

---

## 🗄️ Database Migration

**NONE.** Supabase Auth handles OAuth identities and password recovery tokens natively.

---

## 📁 Files to Create / Modify

### NEW files

#### `src/components/auth/GoogleOAuthButton.tsx`
**Purpose:** Reusable "Continue with Google" button.

```tsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

interface GoogleOAuthButtonProps {
  mode?: 'signup' | 'login';
}

export const GoogleOAuthButton = ({ mode = 'login' }: GoogleOAuthButtonProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    const next = new URLSearchParams(location.search).get('next') || '/account';
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}${next}`,
      },
    });
    if (error) {
      toast.error(t('auth.oauth_error'));
      setLoading(false);
    }
    // Note: success path redirects to Google, no further code runs
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 h-11 bg-white border border-rose-100 hover:border-rose-200 hover:shadow-sm rounded-xl font-body text-sm text-gray-700 transition-all disabled:opacity-60"
    >
      {/* Google "G" inline SVG */}
      <svg width="18" height="18" viewBox="0 0 18 18">
        <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
        <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.71H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
        <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
        <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
      </svg>
      {loading ? '...' : t('auth.continue_with_google')}
    </button>
  );
};
```

#### `src/pages/auth/ForgotPassword.tsx`
**Purpose:** Email input → trigger reset email.

Layout: Header + centered card with email form, similar style to Login/Signup pages.

Key logic:
```tsx
const handleSubmit = async (data: { email: string }) => {
  setLoading(true);
  const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });
  setLoading(false);
  // ALWAYS show success message (don't leak whether email exists — security)
  setSent(true);
};
```

UI states:
- **Initial:** email input + "Send reset link" button + "← Back to login" link
- **Sent:** success message "If an account exists, a reset link has been sent to your email ✉️" + "Back to login" link

Validation: Zod schema, `email: z.string().email()`.

#### `src/pages/auth/ResetPassword.tsx`
**Purpose:** New password form (user arrives here via email link).

Key logic:
```tsx
const [isRecovery, setIsRecovery] = useState(false);

useEffect(() => {
  // Supabase auto-detects token from URL hash + fires event
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') {
      setIsRecovery(true);
    }
  });
  return () => subscription.unsubscribe();
}, []);

const handleSubmit = async (data: { password: string; confirm: string }) => {
  if (data.password !== data.confirm) {
    toast.error(t('auth.passwords_dont_match'));
    return;
  }
  setLoading(true);
  const { error } = await supabase.auth.updateUser({ password: data.password });
  setLoading(false);
  if (error) {
    toast.error(error.message);
    return;
  }
  toast.success(t('auth.password_updated'));
  navigate('/account');
};
```

UI:
- New password input (min 6 chars per existing pattern)
- Confirm password input
- "Update password" button
- If `!isRecovery` show fallback: "Invalid or expired reset link. [Request new link]"

### MODIFIED files

#### `src/hooks/useAuth.tsx`
Add `signInWithGoogle` to context. Not strictly necessary since the button calls `supabase.auth.signInWithOAuth` directly, but exposing through hook is cleaner.

**Decision: DON'T add to hook.** The GoogleOAuthButton owns the OAuth call. Hook stays focused on session/profile state.

**However:** the `onAuthStateChange` listener in AuthProvider must handle the OAuth callback properly. Verify that after Google redirect, the session populates and `profile` is fetched. The trigger `handle_new_user` (from Phase 4A migration) creates a profile row for any new auth user — Google sign-ins included. ✓

#### `src/pages/auth/Login.tsx`
Add at the bottom of the form, BEFORE submit button:
```tsx
<div className="text-right -mt-2">
  <Link to="/auth/forgot-password" className="text-xs text-rose-400 hover:text-rose-500 font-body">
    {t('auth.forgot_password')}
  </Link>
</div>
```

Add at the bottom of the card, AFTER submit button:
```tsx
<div className="relative my-6">
  <div className="absolute inset-0 flex items-center">
    <div className="w-full border-t border-rose-100" />
  </div>
  <div className="relative flex justify-center text-xs">
    <span className="bg-white px-3 text-muted-foreground uppercase tracking-widest">
      {t('auth.or')}
    </span>
  </div>
</div>
<GoogleOAuthButton mode="login" />
```

#### `src/pages/auth/Signup.tsx`
Same divider + GoogleOAuthButton at the bottom of the card, AFTER submit button. Same pattern as Login.

#### `src/App.tsx`
Add two routes alongside existing auth routes:

```tsx
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

// Inside <Routes>:
<Route path="/auth/forgot-password" element={<ForgotPassword />} />
<Route path="/auth/reset-password" element={<ResetPassword />} />
```

These are eager imports (small pages, used by auth flow which is critical path).

#### `src/i18n/translations.json`
Add to `auth` namespace in all 3 languages (en / ka / ru):

```json
"auth": {
  ...existing...,
  "or": "or" / "ან" / "или",
  "continue_with_google": "Continue with Google" / "Google-ით გაგრძელება" / "Продолжить с Google",
  "forgot_password": "Forgot password?" / "დაგავიწყდა პაროლი?" / "Забыли пароль?",
  "forgot_password_title": "Reset your password" / "პაროლის აღდგენა" / "Сброс пароля",
  "forgot_password_subtitle": "Enter your email to receive a reset link" / "შეიყვანე ელ-ფოსტა აღდგენის ბმულის მისაღებად" / "Введите email для получения ссылки на восстановление",
  "send_reset_link": "Send reset link" / "ბმულის გაგზავნა" / "Отправить ссылку",
  "reset_link_sent": "If an account exists, a reset link has been sent to your email ✉️" / "თუ ანგარიში არსებობს, აღდგენის ბმული გაიგზავნა თქვენს ელ-ფოსტაზე ✉️" / "Если аккаунт существует, ссылка для сброса отправлена на вашу почту ✉️",
  "back_to_login": "← Back to login" / "← უკან შესვლაზე" / "← Назад к входу",
  "reset_password_title": "Set new password" / "ახალი პაროლის დაყენება" / "Установка нового пароля",
  "reset_password_subtitle": "Choose a strong password" / "აირჩიე ძლიერი პაროლი" / "Выберите надёжный пароль",
  "new_password": "New password" / "ახალი პაროლი" / "Новый пароль",
  "confirm_password": "Confirm password" / "გაიმეორე პაროლი" / "Подтвердите пароль",
  "update_password": "Update password" / "პაროლის განახლება" / "Обновить пароль",
  "password_updated": "Password updated successfully" / "პაროლი წარმატებით განახლდა" / "Пароль успешно обновлён",
  "passwords_dont_match": "Passwords don't match" / "პაროლები არ ემთხვევა" / "Пароли не совпадают",
  "invalid_reset_link": "Invalid or expired reset link" / "არასწორი ან ვადაგასული ბმული" / "Недействительная или истёкшая ссылка",
  "request_new_link": "Request a new link" / "ახალი ბმულის მოთხოვნა" / "Запросить новую ссылку",
  "oauth_error": "Google sign-in failed. Please try again." / "Google-ით შესვლა ვერ მოხერხდა. სცადე თავიდან." / "Не удалось войти через Google. Попробуйте снова."
}
```

---

## 🎨 Design Guidance

- **Reuse existing Login/Signup styling**: white card, rose-100 borders, rose-500 primary buttons
- **GoogleOAuthButton**: white background (NOT rose), subtle rose-100 border — visually distinct from primary submit
- **Divider with "OR"**: thin rose-100 line + small uppercase label
- **No gold** (Hybrid C — gold locked to 6 customer-side spots, auth is not one)
- **Mobile**: forms stack naturally, no special breakpoints needed

---

## 🔒 Security

- **Email enumeration protection**: ForgotPassword ALWAYS shows the same "If account exists..." message regardless of whether email is registered. Never leak which emails are registered.
- **Token validation**: Supabase handles reset token validation server-side. We rely on `PASSWORD_RECOVERY` event to gate the form.
- **Rate limiting**: Supabase rate-limits `resetPasswordForEmail` server-side (5/hour per email by default). No client-side check needed.
- **Redirect URL safety**: Supabase only accepts redirect URLs that match the configured allowlist (Step 3 in pre-setup). Anything else is rejected at the OAuth server.
- **No client-side secrets**: Google Client Secret stays in Supabase Dashboard. Frontend only knows the public Client ID is being used (indirectly).

---

## 🧪 Acceptance Criteria

**Google OAuth flow:**
1. User clicks "Continue with Google" on Signup or Login
2. Redirected to Google account picker
3. Selects account → returns to `/account` (or `?next=...` path)
4. Session established, profile auto-created via `handle_new_user` trigger
5. `full_name` populated from Google profile (Google sends it via OAuth metadata)
6. User can now use the app normally

**Password reset flow:**
1. User on Login clicks "Forgot password?" → `/auth/forgot-password`
2. Enters email → sees "If account exists..." message regardless
3. (Real user) checks email, gets reset link
4. Clicks link → arrives at `/auth/reset-password` with token in URL hash
5. `PASSWORD_RECOVERY` event fires, form unlocks
6. Enters new password twice → submits
7. Password updated, redirected to `/account`, signed in

**Error states:**
1. Google OAuth fails → toast "Google sign-in failed. Try again."
2. Invalid/expired reset link → form locked, shows "Invalid or expired link. Request a new link" → links to /auth/forgot-password
3. Passwords don't match in ResetPassword → toast, no submit

**i18n:**
1. All 3 languages render correctly on both new pages
2. Toast messages translated

---

## 📦 Deliverable Sequence (Sonnet execution order)

**BEFORE STARTING:** Confirm with USER that Pre-Phase 4D Steps 1–4 are done.

1. **Create `GoogleOAuthButton.tsx`**
2. **Create `ForgotPassword.tsx`**
3. **Create `ResetPassword.tsx`**
4. **Update `Login.tsx`** — add "Forgot password?" link + divider + Google button
5. **Update `Signup.tsx`** — add divider + Google button
6. **Update `App.tsx`** — add two routes
7. **Update `i18n/translations.json`** — all new keys ka/en/ru
8. **TypeScript check**
9. **Build**
10. **Manual smoke test** (USER tests both flows on production)
11. **Commit + push**
12. **Verify Vercel**
13. **Report**

---

## ⚠️ Watch Out For

- **`handle_new_user` trigger**: must populate `email` and optionally `full_name` from `raw_user_meta_data`. Google sends `full_name` as `name` and `email` as standard claim. Verify the trigger reads `NEW.raw_user_meta_data->>'name'` AS fallback. (Phase 4A trigger may only read `'full_name'` — Google sends `'name'`.) **If trigger needs adjustment, BLOCKER → Opus.**
- **`PASSWORD_RECOVERY` event timing**: Supabase fires this AFTER URL hash parsing. Use `useEffect` with subscription, don't read URL manually.
- **OAuth redirectTo with `next` param**: ensure encoded properly via `encodeURIComponent`.
- **Toast duplication**: don't show error toast if user cancels OAuth (cancel = expected, not error). Supabase typically returns `error.code === 'flow_state_not_found'` or similar for cancellation.
- **Cancel button on Login `?next=` carryover**: if user came from `/checkout`, after Google OAuth they should land at `/checkout`, not `/account`. The button reads `next` from current URL — verify.

---

## 🚦 Hand-off Protocol

**▸ BLOCKER triggers:**
- `handle_new_user` trigger doesn't pick up Google `raw_user_meta_data.name`
- OAuth redirect lands on URL not in Supabase allowlist → user sees Supabase error page
- `PASSWORD_RECOVERY` event doesn't fire (Supabase config issue)
- Format: `🚨 Senior Fullstack Opus 4.7-ის შემოსვლა მჭირდება — blocker: [აღწერე]`

**▸ Phase 4D COMPLETE:**
```
🔄 გადართე Opus 4.7-ზე — Phase 4D done. Ready for:
   - Code review by Senior Architect
   - Phase 4E planning (Email Notifications — Edge Function + Resend/SMTP)
```

---

## 📊 Report Format (when complete)

When done, report:
- Deliverables completed / blocked
- Did `handle_new_user` trigger work for Google signups?
- Smoke test: 1) Google OAuth signup success on production, 2) Password reset email received + new password works
- Mobile sanity (1 sentence)
- Production URL where verified
- Open questions for Opus

---

## 🚦 After Phase 4D → Phase 4E Preview

**Phase 4E — Order Status Email Notifications**
- Supabase Edge Function `notify-order-status` triggered via DB webhook on `orders` UPDATE
- Resend (free tier 100/day, 3000/month) — recommended provider
- ka/en/ru templates per status transition (pending → processing → completed/cancelled)
- Optional: customer email preference toggle in `/account`

Phase 4E is the LAST planned feature phase. After it, AVON2FLAME is feature-complete.
