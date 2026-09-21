import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { navigation } from '../data/navigation.js';

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#091e1a] text-[#E8D7B5]/70" role="contentinfo">
      {/* Top divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#B78A3B]/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 lg:px-10 py-16">
        {/* Brand block */}
        <div className="text-center mb-12">
          <Link to="/" className="inline-block group mb-4">
            <img
              src="/images/poondimahan-logo.png"
              alt="Sri Poondi Mahan Logo"
              width={72}
              height={72}
              className="w-16 h-16 sm:w-18 sm:h-18 mx-auto rounded-full object-contain border-2 border-[#B78A3B]/40 group-hover:border-[#D8B86A] shadow-xl transition-all"
            />
          </Link>
          <h2 className="font-serif text-2xl text-[#FAF7F0] font-medium mb-2">
            {t('common.title', 'Sri Poondi Mahan')}
          </h2>
          <p className="text-sm text-[#E8D7B5]/60 max-w-xs mx-auto leading-relaxed font-sans">
            {t('nav.subtitle', 'Attru Swamy Ashramam')} · {t('common.allRightsReserved', 'Preserving a spiritual legacy through seva and devotion.')}
          </p>
        </div>

        {/* Navigation */}
        <nav aria-label="Footer navigation" className="mb-12">
          <ul className="flex flex-wrap justify-center gap-x-8 gap-y-3 list-none" role="list">
            {navigation.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className="text-xs font-semibold tracking-widest uppercase text-[#E8D7B5]/50 hover:text-[#B78A3B] transition-colors duration-200"
                >
                  {t(`nav.${item.key}`, item.label)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Address */}
        <address className="not-italic text-center text-sm leading-relaxed text-[#E8D7B5]/40 mb-10 font-sans">
          {t('common.addressLocation', 'Poondi & Post, Kalasapakkam Taluk, Thiruvannamalai District, Tamil Nadu – 606751, India')}
        </address>

        {/* Gold divider */}
        <div className="flex items-center gap-4 mb-10">
          <div className="flex-1 h-px bg-[#B78A3B]/20" />
          <span className="text-[#B78A3B]/40 text-xs" aria-hidden="true">✦</span>
          <div className="flex-1 h-px bg-[#B78A3B]/20" />
        </div>

        {/* Copyright & Credits */}
        <div className="flex flex-col items-center justify-center gap-2 text-center text-xs text-[#E8D7B5]/40 font-sans">
          <p>
            © {year} {t('common.addressTitle', 'Sri Poondi Mahan Attru Swamy Ashramam Committee')}. {t('common.allRightsReserved', 'All rights reserved.')}
          </p>
          <p>
            Website designed by{' '}
            <a
              href="https://haznox.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#B78A3B] hover:text-[#D8B86A] transition-colors underline underline-offset-2 font-medium"
            >
              Haznox Tech
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

