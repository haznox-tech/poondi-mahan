import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, Heart, Phone, } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { navLinks } from '../data/navigation.js';
import LanguageSwitcher from './LanguageSwitcher.jsx';
import clsx from 'clsx';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const isTamil = i18n.language?.startsWith('ta');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Auto-close mobile menu on route navigation
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Close menu on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const navLinkClass = ({ isActive }) =>
    clsx(
      'relative transition-colors duration-200 pb-1 whitespace-nowrap',
      isTamil
        ? 'font-tamil text-xs xl:text-sm font-medium tracking-normal'
        : 'font-sans text-[11px] xl:text-xs 2xl:text-[13px] font-semibold tracking-wider xl:tracking-widest uppercase',
      'after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:transition-all after:duration-200',
      isActive
        ? 'text-[#B78A3B] after:bg-[#B78A3B] after:opacity-100'
        : 'text-[#FAF7F0]/80 hover:text-[#D8B86A] after:opacity-0'
    );

  return (
    <header
      className={clsx(
        'fixed top-0 left-0 right-0 z-50 transition-colors duration-300',
        menuOpen || scrolled
          ? 'bg-[#0E2D27]/98 backdrop-blur-md shadow-lg shadow-black/20 border-b border-[#B78A3B]/15'
          : 'bg-transparent'
      )}
    >
      <nav
        className={clsx(
          'w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 flex items-center justify-between h-16 sm:h-20 shrink-0 transition-colors',
          menuOpen && 'border-b border-[#B78A3B]/20'
        )}
        aria-label="Main navigation"
      >
        {/* Logo & Brand Name — shrink-0 so it NEVER hides or truncates */}
        <Link
          to="/"
          className="flex items-center gap-2 sm:gap-3 group shrink-0 select-none"
          aria-label="Sri Poondi Mahan — Home"
          onClick={() => setMenuOpen(false)}
        >
          <img
            src="/images/poondimahan-logo.png"
            alt="Sri Poondi Mahan Logo"
            width={44}
            height={44}
            className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-full object-contain border border-[#B78A3B]/40 group-hover:border-[#D8B86A] shadow-md transition-all shrink-0"
          />
          <div className="flex flex-col leading-tight shrink-0">
            <span
              className={clsx(
                "text-sm sm:text-base md:text-lg lg:text-base xl:text-lg font-medium text-[#FAF7F0] group-hover:text-[#D8B86A] transition-colors whitespace-nowrap",
                isTamil ? "font-tamil font-bold tracking-normal" : "font-serif tracking-tight sm:tracking-wide"
              )}
            >
              {t('common.title', 'Sri Poondi Mahan')}
            </span>
            <span
              className={clsx(
                "text-[8.5px] sm:text-[9.5px] md:text-[10px] xl:text-[11px] text-[#E8D7B5]/80 whitespace-nowrap",
                isTamil ? "font-tamil tracking-normal text-[9px] sm:text-[10px]" : "font-sans uppercase tracking-wider sm:tracking-widest"
              )}
            >
              {t('nav.subtitle', 'Attru Swamy Ashramam')}
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links (Center) */}
        <ul className="hidden lg:flex items-center gap-2.5 xl:gap-4 2xl:gap-6 list-none shrink-0" role="list">
          {navLinks.map((item) => (
            <li key={item.path}>
              <NavLink to={item.path} className={navLinkClass} end={item.path === '/'}>
                {t(`nav.${item.key}`, item.label)}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Desktop Action Buttons (Right Side) */}
        <div className="hidden lg:flex items-center gap-2 xl:gap-2.5 shrink-0">
          <NavLink
            to="/contact"
            className={({ isActive }) =>
              clsx(
                'inline-flex items-center justify-center px-2.5 xl:px-3 py-1.5 xl:py-2 rounded-xl transition-all duration-200 whitespace-nowrap',
                isTamil ? 'font-tamil text-xs' : 'font-sans text-[11px] xl:text-xs font-semibold uppercase tracking-wider',
                isActive
                  ? 'bg-[#FAF7F0]/15 text-[#D8B86A] border border-[#B78A3B]'
                  : 'text-[#FAF7F0] border border-[#FAF7F0]/25 hover:border-[#B78A3B] hover:text-[#D8B86A] hover:bg-[#FAF7F0]/5'
              )
            }
          >
            <Phone size={12} className="fill-current mr-1.5 shrink-0" />
            <span>{t('nav.contact', 'Contact')}</span>
          </NavLink>

          <NavLink
            to="/donation"
            className={({ isActive }) =>
              clsx(
                'inline-flex items-center justify-center gap-1.5 px-3 xl:px-3.5 py-1.5 xl:py-2 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 border border-[#FAF7F0]/20 whitespace-nowrap',
                isTamil ? 'font-tamil text-xs font-bold' : 'font-sans text-[11px] xl:text-xs font-bold uppercase tracking-wider',
                isActive
                  ? 'bg-[#D8B86A] text-[#173F35] shadow-[#B78A3B]/30'
                  : 'bg-gradient-to-r from-[#B78A3B] via-[#C59B4B] to-[#9E732E] hover:from-[#D8B86A] hover:to-[#B78A3B] text-[#FAF7F0]'
              )
            }
          >
            <Heart size={12} className="fill-current shrink-0" />
            <span>{t('nav.donation', 'Donation')}</span>
          </NavLink>

          {/* Translation Switcher at end of Navbar */}
          <LanguageSwitcher className="px-2 xl:px-2.5 py-1.5 xl:py-2 text-[11px] xl:text-xs shrink-0" />
        </div>

        {/* Mobile controls: Language Switcher + Hamburger */}
        <div className="lg:hidden flex items-center gap-1.5 sm:gap-2 shrink-0">
          <LanguageSwitcher className="px-2 sm:px-2.5 py-1 sm:py-1.5 text-[10.5px] sm:text-[11px]" />
          <button
            type="button"
            className="p-1.5 sm:p-2 text-[#FAF7F0] hover:text-[#B78A3B] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B78A3B] rounded-lg transition-colors cursor-pointer"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            {menuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Fullscreen Drawer */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="lg:hidden fixed inset-x-0 top-16 sm:top-20 bottom-0 h-[calc(100dvh-4rem)] sm:h-[calc(100dvh-5rem)] bg-[#0E2D27] z-40 overflow-y-auto flex flex-col justify-between border-t border-[#B78A3B]/20 py-6 sm:py-8 px-4 sm:px-6 shadow-2xl"
          >
            <nav className="flex flex-col items-center justify-center flex-1 py-2 sm:py-4 gap-2 sm:gap-3">
              {/* Language Switcher in Mobile Drawer */}
              <div className="w-full max-w-xs mb-2 sm:mb-3">
                <LanguageSwitcher mobile />
              </div>

              {navLinks.map((item, i) => (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.25 }}
                  className="w-full text-center"
                >
                  <NavLink
                    to={item.path}
                    end={item.path === '/'}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      clsx(
                        'inline-block px-6 sm:px-8 py-2 sm:py-2.5 transition-colors duration-200',
                        isTamil
                          ? 'font-tamil text-xl sm:text-2xl font-normal tracking-normal'
                          : 'font-serif text-xl sm:text-2xl font-light tracking-wide',
                        isActive ? 'text-[#D8B86A] font-medium' : 'text-[#FAF7F0]/85 hover:text-[#D8B86A]'
                      )
                    }
                  >
                    {t(`nav.${item.key}`, item.label)}
                  </NavLink>
                </motion.div>
              ))}

              {/* Mobile CTA Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.25 }}
                className="flex flex-col w-full gap-2.5 sm:gap-3 mt-4 sm:mt-6 max-w-xs"
              >
                <NavLink
                  to="/donation"
                  onClick={() => setMenuOpen(false)}
                  className={clsx(
                    "w-full inline-flex items-center justify-center gap-2 py-3 sm:py-3.5 px-4 sm:px-6 rounded-xl bg-gradient-to-r from-[#B78A3B] to-[#9E732E] text-[#FAF7F0] font-bold text-xs sm:text-sm shadow-md active:scale-95 transition-all",
                    isTamil ? "font-tamil" : "font-sans uppercase tracking-wider"
                  )}
                >
                  <Heart size={15} className="fill-current" />
                  <span>{t('nav.donation', 'Donation')}</span>
                </NavLink>
                <NavLink
                  to="/contact"
                  onClick={() => setMenuOpen(false)}
                  className={clsx(
                    "w-full inline-flex items-center justify-center py-3 sm:py-3.5 px-4 sm:px-6 rounded-xl border border-[#FAF7F0]/30 text-[#FAF7F0] font-semibold text-xs sm:text-sm hover:border-[#B78A3B] hover:text-[#D8B86A] active:scale-95 transition-all",
                    isTamil ? "font-tamil" : "font-sans uppercase tracking-wider"
                  )}
                >
                  <span>{t('nav.contact', 'Contact')}</span>
                </NavLink>
              </motion.div>
            </nav>

            <div className="text-center pt-4 sm:pt-6 border-t border-[#B78A3B]/15 shrink-0">
              <p className={clsx(
                "text-[#E8D7B5]/60 text-[10px] sm:text-xs",
                isTamil ? "font-tamil" : "font-sans tracking-wider sm:tracking-widest uppercase"
              )}>
                {isTamil ? 'பூண்டி · கலசப்பாக்கம் · தமிழ்நாடு' : 'Poondi · Kalasapakkam · Tamil Nadu'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}


