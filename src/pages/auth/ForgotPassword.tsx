import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';
import SEO from '@/components/SEO';

const schema = z.object({
  email: z.string().email(),
});

type FormData = z.infer<typeof schema>;

const ForgotPassword = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setLoading(false);
    // always show success — never leak whether email exists
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-rose-50/30 flex items-center justify-center px-4 py-16">
      <SEO title={t('auth.forgot_password_title')} description="Reset your AVON2FLAME password" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <Link to="/" className="block text-center mb-10">
          <h1 className="font-display text-3xl tracking-[0.4em] text-rose-500/90">
            AVON<span className="font-semibold text-rose-700">2</span>FLAME
          </h1>
        </Link>

        <div className="bg-white rounded-[2rem] border border-rose-100 shadow-xl shadow-rose-100/30 p-10">
          <h2 className="font-display text-2xl font-light tracking-tight text-rose-500/90 mb-2 text-center">
            {t('auth.forgot_password_title')}
          </h2>
          <p className="text-center text-sm text-muted-foreground font-body mb-8">
            {t('auth.forgot_password_subtitle')}
          </p>

          {sent ? (
            <div className="text-center space-y-6">
              <p className="text-sm font-body text-gray-700 leading-relaxed">
                {t('auth.reset_link_sent')}
              </p>
              <Link
                to="/auth/login"
                className="inline-block text-sm font-body text-rose-500 hover:text-rose-600"
              >
                {t('auth.back_to_login')}
              </Link>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-[11px] uppercase tracking-widest text-rose-400 font-semibold">
                    {t('auth.email')}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="rounded-xl border-rose-100 focus-visible:ring-rose-300"
                    {...register('email')}
                  />
                  {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-body text-sm tracking-widest uppercase mt-2"
                >
                  {loading ? '...' : t('auth.send_reset_link')}
                </Button>
              </form>

              <p className="text-center mt-4">
                <Link
                  to="/auth/login"
                  className="text-sm font-body text-rose-400 hover:text-rose-500"
                >
                  {t('auth.back_to_login')}
                </Link>
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
