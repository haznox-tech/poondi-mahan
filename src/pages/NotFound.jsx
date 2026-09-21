import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SEO from '../components/SEO.jsx';
import { pageSEO } from '../data/seo.js';

export default function NotFound() {
  const seo = pageSEO.notFound;
  const { t } = useTranslation();

  return (
    <>
      <SEO
        title={seo.title}
        description={seo.description}
        canonical={null}
        robots={seo.robots}
      />
      <div className="min-h-screen bg-[#FAF7F0] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <Link to="/" className="inline-block mb-6 group">
            <img
              src="/images/poondimahan-logo.png"
              alt="Sri Poondi Mahan Logo"
              width={80}
              height={80}
              className="w-20 h-20 mx-auto rounded-full object-contain border-2 border-[#B78A3B]/40 group-hover:border-[#D8B86A] shadow-xl transition-all"
            />
          </Link>
          <h1 className="font-serif text-5xl text-[#173F35] font-medium mb-4">{t('notFound.title', '404')}</h1>
          <div className="h-px w-16 bg-[#B78A3B] mx-auto mb-6" aria-hidden="true" />
          <p className="font-serif text-xl text-[#77736A] italic mb-6">{t('notFound.subtitle', 'Page Not Found')}</p>
          <p className="text-sm text-[#77736A] font-sans leading-relaxed mb-8">
            {t('notFound.desc', 'The page you are looking for could not be found. It may have been moved or does not exist.')}
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-[#173F35] text-[#FAF7F0] font-sans font-semibold px-8 py-4 rounded-xl hover:bg-[#0E2D27] transition-all shadow-md active:scale-95"
          >
            {t('notFound.returnHome', 'Return Home')}
          </Link>
        </div>
      </div>
    </>
  );
}
