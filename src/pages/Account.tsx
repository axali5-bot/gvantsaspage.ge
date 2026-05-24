import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { User, Phone, MapPin, ShoppingBag, LogOut, ChevronRight } from 'lucide-react';
import SEO from '@/components/SEO';

const Account = () => {
  const { user, profile, signOut, refreshProfile, isAdmin } = useAuth();
  const { t } = useTranslation();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: profile?.full_name ?? '',
    phone: profile?.phone ?? '',
    default_address: profile?.default_address ?? '',
  });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? '',
        phone: profile.phone ?? '',
        default_address: profile.default_address ?? '',
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: form.full_name,
        phone: form.phone,
        default_address: form.default_address,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    setIsSaving(false);

    if (error) {
      toast.error('შენახვა ვერ მოხდა');
      return;
    }

    await refreshProfile();
    setIsEditing(false);
    toast.success(t('account.profile_updated'));
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'მომხმარებელი';
  const initials = displayName.slice(0, 1).toUpperCase();

  return (
    <div className="min-h-screen bg-rose-50/30">
      <SEO title={t('account.title')} description="Manage your AVON2FLAME account" />
      <Header onSearch={() => {}} />

      <main className="container mx-auto px-4 py-16 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          {/* Avatar + Name */}
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 text-2xl font-display font-light border border-rose-200">
              {initials}
            </div>
            <div>
              <h1 className="font-display text-2xl font-light text-rose-500/90">{displayName}</h1>
              <p className="font-body text-sm text-muted-foreground">{user?.email}</p>
              {isAdmin && (
                <Link to="/admin" className="text-[10px] uppercase tracking-widest text-rose-400 hover:text-rose-500 font-semibold">
                  {t('header.admin_panel')} →
                </Link>
              )}
            </div>
          </div>

          {/* Profile Card */}
          <div className="bg-white rounded-[1.5rem] border border-rose-100 shadow-sm p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg text-rose-500/80">{t('account.edit_profile')}</h2>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-xs uppercase tracking-widest text-rose-400 hover:text-rose-500 font-semibold"
                >
                  Edit
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-widest text-rose-400 font-semibold flex items-center gap-2">
                  <User size={12} /> {t('auth.full_name')}
                </Label>
                {isEditing ? (
                  <Input
                    value={form.full_name}
                    onChange={e => setForm({ ...form, full_name: e.target.value })}
                    className="rounded-xl border-rose-100 focus-visible:ring-rose-300"
                  />
                ) : (
                  <p className="font-body text-sm text-gray-700 py-2">{profile?.full_name || '—'}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-widest text-rose-400 font-semibold flex items-center gap-2">
                  <Phone size={12} /> {t('auth.phone')}
                </Label>
                {isEditing ? (
                  <Input
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="+995 555 ..."
                    className="rounded-xl border-rose-100 focus-visible:ring-rose-300"
                  />
                ) : (
                  <p className="font-body text-sm text-gray-700 py-2">{profile?.phone || '—'}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-widest text-rose-400 font-semibold flex items-center gap-2">
                  <MapPin size={12} /> {t('checkout.address')}
                </Label>
                {isEditing ? (
                  <Input
                    value={form.default_address}
                    onChange={e => setForm({ ...form, default_address: e.target.value })}
                    placeholder="თბილისი, ..."
                    className="rounded-xl border-rose-100 focus-visible:ring-rose-300"
                  />
                ) : (
                  <p className="font-body text-sm text-gray-700 py-2">{profile?.default_address || '—'}</p>
                )}
              </div>

              {isEditing && (
                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 h-11 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-body text-sm tracking-widest uppercase"
                  >
                    {isSaving ? '...' : t('account.save')}
                  </Button>
                  <Button
                    onClick={() => setIsEditing(false)}
                    variant="outline"
                    className="flex-1 h-11 rounded-xl border-rose-100 text-rose-400 hover:bg-rose-50"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Orders */}
          <Link to="/account/orders" className="block bg-white rounded-[1.5rem] border border-rose-100 shadow-sm p-8 hover:shadow-md hover:border-rose-200 transition-all group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-rose-400">
                <ShoppingBag size={18} />
                <h2 className="font-display text-lg text-rose-500/80 group-hover:text-rose-600">{t('account.my_orders')}</h2>
              </div>
              <ChevronRight size={18} className="text-rose-300 group-hover:text-rose-500 group-hover:translate-x-1 transition-all" />
            </div>
            <p className="font-body text-sm text-muted-foreground mt-2">{t('account_orders.view_all')}</p>
          </Link>

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-sm font-body text-rose-400 hover:text-rose-500 transition-colors"
          >
            <LogOut size={16} />
            {t('account.logout')}
          </button>
        </motion.div>
      </main>
    </div>
  );
};

export default Account;
