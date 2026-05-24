import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import SEO from '@/components/SEO';

const schema = z.object({
  password: z.string().min(6),
  confirm: z.string().min(6),
});

type FormData = z.infer<typeof schema>;

const ResetPassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isRecovery, setIsRecovery] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
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

  return (
    <div className="min-h-screen bg-rose-50/30 flex items-center justify-center px-4 py-16">
      <SEO title={t('auth.reset_password_title')} description="Set a new password for your AVON2FLAME account" />

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
            {t('auth.reset_password_title')}
          </h2>
          <p className="text-center text-sm text-muted-foreground font-body mb-8">
            {t('auth.reset_password_subtitle')}
          </p>

          {!isRecovery ? (
            <div className="text-center space-y-4">
              <p className="text-sm font-body text-gray-600">
                {t('auth.invalid_reset_link')}
              </p>
              <Link
                to="/auth/forgot-password"
                className="inline-block text-sm font-body text-rose-500 hover:text-rose-600"
              >
                {t('auth.request_new_link')}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-[11px] uppercase tracking-widest text-rose-400 font-semibold">
                  {t('auth.new_password')}
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="rounded-xl border-rose-100 focus-visible:ring-rose-300"
                  {...register('password')}
                />
                {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm" className="text-[11px] uppercase tracking-widest text-rose-400 font-semibold">
                  {t('auth.confirm_password')}
                </Label>
                <Input
                  id="confirm"
                  type="password"
                  placeholder="••••••••"
                  className="rounded-xl border-rose-100 focus-visible:ring-rose-300"
                  {...register('confirm')}
                />
                {errors.confirm && <p className="text-xs text-red-500">{errors.confirm.message}</p>}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-body text-sm tracking-widest uppercase mt-2"
              >
                {loading ? '...' : t('auth.update_password')}
              </Button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
