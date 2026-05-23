import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, ShoppingBag, LogOut, LayoutDashboard } from 'lucide-react';

const UserMenu = () => {
  const { user, profile, isAdmin, signOut } = useAuth();
  const { t } = useTranslation();

  const displayName = profile?.full_name || user?.email?.split('@')[0] || '';
  const initials = displayName.slice(0, 1).toUpperCase() || '?';

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          to="/auth/login"
          className="hidden sm:block text-[11px] uppercase tracking-widest font-semibold text-rose-400 hover:text-rose-500 transition-colors"
        >
          {t('header.login')}
        </Link>
        <Link
          to="/auth/signup"
          className="text-[11px] uppercase tracking-widest font-semibold bg-rose-500 hover:bg-rose-600 text-white px-3 py-1.5 rounded-full transition-colors"
        >
          {t('header.signup')}
        </Link>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="w-8 h-8 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 text-sm font-display font-medium hover:bg-rose-200 transition-colors focus:outline-none">
          {initials}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 rounded-2xl border-rose-100 shadow-xl shadow-rose-100/30">
        <div className="px-3 py-2 border-b border-rose-50">
          <p className="text-xs font-semibold text-gray-700 truncate">{displayName}</p>
          <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
        </div>

        <DropdownMenuItem asChild>
          <Link to="/account" className="flex items-center gap-2 cursor-pointer text-sm font-body">
            <User size={14} className="text-rose-400" />
            {t('header.my_account')}
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link to="/account" className="flex items-center gap-2 cursor-pointer text-sm font-body text-muted-foreground">
            <ShoppingBag size={14} className="text-rose-300" />
            {t('header.my_orders')}
          </Link>
        </DropdownMenuItem>

        {isAdmin && (
          <>
            <DropdownMenuSeparator className="bg-rose-50" />
            <DropdownMenuItem asChild>
              <Link to="/admin" className="flex items-center gap-2 cursor-pointer text-sm font-body text-rose-600">
                <LayoutDashboard size={14} />
                {t('header.admin_panel')}
              </Link>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator className="bg-rose-50" />
        <DropdownMenuItem
          onClick={signOut}
          className="flex items-center gap-2 cursor-pointer text-sm font-body text-rose-400 hover:text-rose-600 focus:text-rose-600"
        >
          <LogOut size={14} />
          {t('header.logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
