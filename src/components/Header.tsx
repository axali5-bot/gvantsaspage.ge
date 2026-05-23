import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Search, ShoppingBag, Menu, X, Home, BookOpen, Info, Phone, ChevronDown, Globe } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { CartSheet } from './CartSheet';
import { useCategories } from '@/hooks/useCategories';
import UserMenu from './UserMenu';

const languages = [
  { code: 'ka', label: 'ქარ' },
  { code: 'en', label: 'EN' },
  { code: 'ru', label: 'RU' },
];

interface HeaderProps {
  onSearch: (query: string) => void;
}


const NavLink = ({ children, onClick, to, delay, hasDropdown }: { children: React.ReactNode, onClick?: (e: React.MouseEvent) => void, to?: string, delay: number, hasDropdown?: boolean }) => {
  const content = (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 + delay }}
      className="relative group py-2"
    >
      <span className="font-display text-[11px] md:text-xs tracking-[0.25em] uppercase transition-colors duration-300 group-hover:text-rose-600 cursor-pointer">
        {children}
      </span>
      {hasDropdown && <ChevronDown size={10} className="text-muted-foreground group-hover:text-rose-600 transition-colors" />}
      <span className="absolute bottom-0 left-1/2 w-0 h-[1.5px] bg-gradient-to-r from-transparent via-rose-500 to-transparent transition-all duration-300 group-hover:w-full group-hover:left-0" />
    </motion.div>
  );

  if (to) {
    return <Link to={to} className="no-underline">{content}</Link>;
  }

  return <a href="#" onClick={onClick} className="no-underline">{content}</a>;
};

export const Header = ({ onSearch }: HeaderProps) => {
  const { t, i18n } = useTranslation();
  const isKa = i18n.language === 'ka';
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isProductsDropdownOpen, setIsProductsDropdownOpen] = useState(false);

  const { data: categories = [] } = useCategories();
  const parentCategories = categories.filter(c => !c.parent_id);

  const navigate = useNavigate();
  const location = useLocation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setIsLangDropdownOpen(false);
  };

  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

  const handleHomeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);

    // Wait for the 500ms menu collapse animation to finish before scrolling
    // to ensure the final layout position is accurate.
    setTimeout(() => {
      if (location.pathname === '/') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        navigate('/');
      }
    }, 550);
  };

  const handleProductsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);

    // Wait for the 500ms menu collapse animation to finish before scrolling
    // to ensure the final layout position is accurate.
    setTimeout(() => {
      if (location.pathname === '/') {
        const element = document.getElementById('products');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        navigate('/#products');
      }
    }, 550);
  };

  return (
    <header className="sticky top-0 z-[100] bg-background/80 backdrop-blur-md border-b border-border/40">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-20 lg:h-24">
          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-foreground/80 hover:text-rose-600 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <a href="/" onClick={handleHomeClick} className="flex flex-col group">
              <h1 className="font-display text-2xl md:text-3xl font-light tracking-[0.3em] text-foreground transition-all duration-500 group-hover:tracking-[0.4em] group-hover:text-rose-600">
                AVON<span className="font-semibold text-gold group-hover:text-gold-deep transition-colors duration-300">2</span>FLAME
              </h1>
              <div className="h-[1px] w-0 bg-gold/30 transition-all duration-700 group-hover:w-full" />
            </a>
          </motion.div>

          {/* New Nav Links for Desktop */}
          <nav className="hidden lg:flex items-center lg:gap-12">
            <NavLink onClick={handleHomeClick} delay={0.1}>{t('nav.home')}</NavLink>

            <NavLink onClick={handleProductsClick} delay={0.2}>{t('nav.products')}</NavLink>

            <NavLink to="/catalog" delay={0.25}>{t('nav.catalog')}</NavLink>
            <NavLink to="/about" delay={0.3}>{t('nav.about')}</NavLink>
            <NavLink to="/contact" delay={0.4}>{t('nav.contact')}</NavLink>
          </nav>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center lg:gap-8">
            {/* Search */}
            <div className="relative">
              {isSearchOpen ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    placeholder={t('search')}
                    className="w-48 h-9 font-body text-sm"
                    onChange={(e) => onSearch(e.target.value)}
                    autoFocus
                  />
                  <button onClick={() => setIsSearchOpen(false)}>
                    <X size={18} className="text-muted-foreground" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="p-2 hover:text-accent transition-colors"
                >
                  <Search size={20} />
                </button>
              )}
            </div>


            {/* Language Switcher - Compact Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                onMouseEnter={() => setIsLangDropdownOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/30 border border-rose-500/20 hover:border-rose-500/40 transition-all duration-300 group"
              >
                <Globe size={14} className="text-rose-500/60 group-hover:text-rose-500" />
                <span className="text-[10px] font-display tracking-[0.2em] uppercase font-medium bg-clip-text text-transparent bg-gradient-to-b from-rose-200 via-pink-400 to-rose-600 group-hover:brightness-110">
                  {currentLang.label}
                </span>
                <ChevronDown
                  size={12}
                  className={`text-rose-500/40 transition-transform duration-300 ${isLangDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              <AnimatePresence>
                {isLangDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 5, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    onMouseLeave={() => setIsLangDropdownOpen(false)}
                    className="absolute right-0 top-full bg-background/95 backdrop-blur-xl border border-rose-500/20 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.3)] overflow-hidden min-w-[100px] z-50 p-1"
                  >
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => changeLanguage(lang.code)}
                        className={`w-full flex items-center justify-between px-4 py-2.5 text-[10px] font-display tracking-[0.2em] uppercase transition-all duration-300 rounded-lg ${i18n.language === lang.code
                          ? 'bg-rose-500/10 text-rose-500 font-semibold'
                          : 'text-muted-foreground hover:bg-secondary/50 hover:text-rose-500'
                          }`}
                      >
                        <span className={i18n.language === lang.code ? "bg-clip-text text-transparent bg-gradient-to-b from-rose-200 via-pink-400 to-rose-600" : ""}>
                          {lang.label}
                        </span>
                        {i18n.language === lang.code && (
                          <div className="w-1 h-1 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User Menu */}
            <UserMenu />

          </nav>

          {/* Mobile: UserMenu + Cart */}
          <div className="flex items-center gap-2">
            <div className="lg:hidden">
              <UserMenu />
            </div>
            <CartSheet />
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="lg:hidden overflow-hidden bg-background/95 backdrop-blur-xl border-t border-border/40"
          >
            <div className="container mx-auto px-6 py-12 flex flex-col gap-12">
              <nav className="flex flex-col gap-6">
                {[
                  { name: t('nav.home'), icon: <Home className="w-5 h-5" />, onClick: handleHomeClick },
                  { name: t('nav.products'), icon: <ShoppingBag className="w-5 h-5" />, onClick: handleProductsClick },
                  { name: t('nav.catalog'), icon: <BookOpen className="w-5 h-5" />, to: "/catalog" },
                  { name: t('nav.about'), icon: <Info className="w-5 h-5" />, to: "/about" },
                  { name: t('nav.contact'), icon: <Phone className="w-5 h-5" />, to: "/contact" },
                ].map((item, idx) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    {item.to ? (
                      <Link
                        to={item.to}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-4 text-2xl font-display font-light tracking-[0.15em] text-foreground hover:text-rose-600 transition-colors group"
                      >
                        <span className="text-rose-500/50 text-xs font-body">0{idx + 1}</span>
                        <span className="p-2 rounded-xl bg-rose-500/5 text-rose-500/80 group-hover:bg-rose-500/10 transition-colors">
                          {item.icon}
                        </span>
                        {item.name}
                      </Link>
                    ) : (
                      <button
                        onClick={item.onClick}
                        className="flex items-center gap-4 text-2xl font-display font-light tracking-[0.15em] text-foreground hover:text-rose-600 transition-colors text-left group"
                      >
                        <span className="text-rose-500/50 text-xs font-body">0{idx + 1}</span>
                        <span className="p-2 rounded-xl bg-rose-500/5 text-rose-500/80 group-hover:bg-rose-500/10 transition-colors">
                          {item.icon}
                        </span>
                        {item.name}
                      </button>
                    )}
                  </motion.div>
                ))}
              </nav>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="space-y-8"
              >
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Input
                    type="text"
                    placeholder={t('search')}
                    className="pl-10 h-12 bg-secondary/50 border-none rounded-2xl focus-visible:ring-rose-500/30"
                    onChange={(e) => onSearch(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-4">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-medium pl-1">
                    {isKa ? 'ენა' : 'Language'}
                  </p>
                  <div className="flex items-center gap-2 p-1 bg-secondary/30 rounded-2xl w-fit">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => changeLanguage(lang.code)}
                        className={`px-6 py-2 text-xs font-body tracking-widest rounded-xl transition-all duration-300 ${i18n.language === lang.code
                          ? 'bg-background text-rose-600 shadow-sm border border-border/50'
                          : 'text-muted-foreground hover:text-foreground'
                          }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="pt-12 border-t border-border/20 text-center"
              >
                <p className="text-[10px] uppercase tracking-[0.5em] text-muted-foreground/60">
                  Luxury Olfactory Experience
                </p>
              </motion.div>
            </div>
          </motion.div >
        )}
      </AnimatePresence >

    </header >
  );
};