import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import SEO from '@/components/SEO';
import { GoogleOAuthButton } from '@/components/auth/GoogleOAuthButton';

const schema = z.object({
  full_name: z.string().min(2, 'სახელი მინიმუმ 2 სიმბოლო'),
  email: z.string().email('არასწორი ელ-ფოსტა'),
  phone: z.string().min(5, 'ტელეფონი მინიმუმ 5 სიმბოლო').optional().or(z.literal('')),
  password: z.string().min(6, 'პაროლი მინიმუმ 6 სიმბოლო'),
});

type FormData = z.infer<typeof schema>;

const Signup = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    const { error } = await signUp(data.email, data.password, data.full_name);
    setIsLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(t('auth.welcome'));
    navigate('/account');
  };

  return (
    <div className="min-h-screen bg-rose-50/30 flex items-center justify-center px-4 py-16">
      <SEO title={t('auth.signup_title')} description="Create your AVON2FLAME account" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <Link to="/" className="block text-center mb-10">
          <h1 className="font-display text-3xl tracking-[0.4em] text-rose-500/90">
            AVON<span className="font-semibold text-rose-700">2</span>FLAME
          </h1>
        </Link>

        <div className="bg-white rounded-[2rem] border border-rose-100 shadow-xl shadow-rose-100/30 p-10">
          <h2 className="font-display text-2xl font-light tracking-tight text-rose-500/90 mb-8 text-center">
            {t('auth.signup_title')}
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="full_name" className="text-[11px] uppercase tracking-widest text-rose-400 font-semibold">
                {t('auth.full_name')}
              </Label>
              <Input
                id="full_name"
                placeholder="Jane Doe"
                className="rounded-xl border-rose-100 focus-visible:ring-rose-300"
                {...register('full_name')}
              />
              {errors.full_name && <p className="text-xs text-red-500">{errors.full_name.message}</p>}
            </div>

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

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-[11px] uppercase tracking-widest text-rose-400 font-semibold">
                {t('auth.phone')} <span className="text-rose-300 normal-case">(optional)</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+995 555 ..."
                className="rounded-xl border-rose-100 focus-visible:ring-rose-300"
                {...register('phone')}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[11px] uppercase tracking-widest text-rose-400 font-semibold">
                {t('auth.password')}
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

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-body text-sm tracking-widest uppercase mt-2"
            >
              {isLoading ? '...' : t('auth.signup_button')}
            </Button>
          </form>

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

          <GoogleOAuthButton mode="signup" />

          <p className="text-center text-sm font-body text-muted-foreground mt-6">
            {t('auth.have_account')}{' '}
            <Link to="/auth/login" className="text-rose-500 hover:text-rose-600 font-medium">
              {t('header.login')}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;
