import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import clsx from 'clsx';

export default function LanguageSwitcher({ className, mobile = false }) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith('ta') ? 'ta' : 'en';

  const toggleLanguage = () => {
    const nextLang = currentLang === 'en' ? 'ta' : 'en';
    i18n.changeLanguage(nextLang);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = nextLang;
    }
  };

  const setSpecificLanguage = (lang) => {
    i18n.changeLanguage(lang);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  };

  if (mobile) {
    return (
      <div className={clsx('flex items-center justify-center gap-2 p-1.5 rounded-xl bg-[#091e1a]/80 border border-[#B78A3B]/30', className)}>
        <Languages size={15} className="text-[#D8B86A] ml-2 shrink-0" aria-hidden="true" />
        <button
          type="button"
          onClick={() => setSpecificLanguage('en')}
          className={clsx(
            'flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer',
            currentLang === 'en'
              ? 'bg-[#B78A3B] text-[#FAF7F0] shadow-sm'
              : 'text-[#FAF7F0]/70 hover:text-[#FAF7F0]'
          )}
          aria-pressed={currentLang === 'en'}
        >
          English
        </button>
        <button
          type="button"
          onClick={() => setSpecificLanguage('ta')}
          className={clsx(
            'flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer font-tamil',
            currentLang === 'ta'
              ? 'bg-[#B78A3B] text-[#FAF7F0] shadow-sm'
              : 'text-[#FAF7F0]/70 hover:text-[#FAF7F0]'
          )}
          aria-pressed={currentLang === 'ta'}
        >
          தமிழ்
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className={clsx(
        'inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider border transition-all duration-200 cursor-pointer group active:scale-95 select-none',
        'border-[#FAF7F0]/25 bg-[#FAF7F0]/5 hover:bg-[#FAF7F0]/10 hover:border-[#B78A3B] text-[#FAF7F0]',
        className
      )}
      aria-label={`Current language: ${currentLang === 'en' ? 'English' : 'Tamil'}. Click to switch language.`}
      title="Switch Language / மொழியை மாற்றுக"
    >
      <Languages size={15} className="text-[#D8B86A] group-hover:rotate-12 transition-transform duration-200" aria-hidden="true" />
      <span className="font-sans">
        {currentLang === 'en' ? (
          <span className="flex items-center gap-1">
            <strong className="text-[#D8B86A]">EN</strong>
            <span className="text-white/40">/</span>
            <span className="font-tamil text-[11px] font-normal text-white/70">தமிழ்</span>
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <span className="text-white/70 text-[11px]">EN</span>
            <span className="text-white/40">/</span>
            <strong className="font-tamil text-[#D8B86A] font-normal text-xs">தமிழ்</strong>
          </span>
        )}
      </span>
    </button>
  );
}
