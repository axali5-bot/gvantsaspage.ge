import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
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

const schema = z.object({
  email: z.string().email('არასწორი ელ-ფოსტა'),
  password: z.string().min(1, 'პაროლი სავალდებულოა'),
});

type FormData = z.infer<typeof schema>;

const Login = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const next = searchParams.get('next') || '/account';

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    const { error } = await signIn(data.email, data.password);
    setIsLoading(false);

    if (error) {
      toast.error('ელ-ფოსტა ან პაროლი არასწორია');
      return;
    }

    navigate(next, { replace: true });
  };

  return (
    <div className="min-h-screen bg-rose-50/30 flex items-center justify-center px-4 py-16">
      <SEO title={t('auth.login_title')} description="Sign in to your AVON2FLAME account" />

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
            {t('auth.login_title')}
          </h2>

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
              {isLoading ? '...' : t('auth.login_button')}
            </Button>
          </form>

          <p className="text-center text-xs font-body text-muted-foreground mt-4">
            {/* Phase 4D */}
            <span className="text-rose-300">პაროლის აღდგენა მალე იქნება ხელმისაწვდომი</span>
          </p>

          <p className="text-center text-sm font-body text-muted-foreground mt-4">
            {t('auth.no_account')}{' '}
            <Link to="/auth/signup" className="text-rose-500 hover:text-rose-600 font-medium">
              {t('header.signup')}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
