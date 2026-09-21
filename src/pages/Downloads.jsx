import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SEO from '../components/SEO.jsx';
import PageHero from '../components/PageHero.jsx';
import SectionHeading from '../components/SectionHeading.jsx';
import BookCard from '../components/BookCard.jsx';
import { BreadcrumbSchema, WebPageSchema, BookListSchema } from '../components/StructuredData.jsx';
import { pageSEO } from '../data/seo.js';
import { books } from '../data/books.js';

export default function Downloads() {
  const seo = pageSEO.downloads;
  const { t } = useTranslation();

  return (
    <>
      <SEO
        title={seo.title}
        description={seo.description}
        keywords={seo.keywords}
        canonical={seo.canonical}
        type={seo.type}
        robots={seo.robots}
      />
      <BreadcrumbSchema
        items={[{ name: 'Home', path: '/' }, { name: 'Downloads', path: '/downloads' }]}
      />
      <WebPageSchema name={seo.title} description={seo.description} url="/downloads" />
      <BookListSchema books={books} />

      <PageHero
        title={t('downloadsPage.heroTitle', 'Books & Publications')}
        subtitle={t('downloadsPage.heroSubtitle', 'Read and download available publications about Sri Poondi Mahan and his spiritual legacy.')}
        breadcrumbs={[{ label: t('nav.downloads', 'Downloads') }]}
        bgImage="/images/hero/sri-poondi-mahan-divine-blessing-portrait.webp"
      />

      <section className="py-12 sm:py-16 bg-[#FAF7F0]" aria-labelledby="books-main-heading">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10">
          <SectionHeading
            overline={t('downloadsPage.overline', 'Sacred Literature')}
            heading={t('downloadsPage.heading', 'Books & Publications')}
            id="books-main-heading"
            subheading={t('downloadsPage.subheading', 'The life, teachings, and spiritual legacy of Sri Poondi Mahan preserved in text, available for all devotees to read online and download freely.')}
          />

          <div className="space-y-8 mt-10 sm:mt-12">
            {books.map((book) => (
              <BookCard
                key={book.id}
                book={book}
              />
            ))}
          </div>

          {/* Note / Info Box */}
          <div className="mt-12 sm:mt-16 bg-[#173F35] rounded-2xl p-6 sm:p-8 text-center text-[#E8D7B5] shadow-lg shadow-[#0E2D27]/10 border border-[#B78A3B]/20">
            <p className="font-serif text-xl sm:text-2xl mb-3 text-[#FAF7F0]">
              {t('downloadsPage.prepHeading', 'More Publications in Preparation')}
            </p>
            <p className="text-xs sm:text-sm text-[#E8D7B5]/80 font-sans max-w-2xl mx-auto mb-6 leading-relaxed">
              {t('downloadsPage.prepDesc', 'The Sri Poondi Mahan Attru Swamy Ashramam Committee is dedicated to digitizing and publishing historical records, songs, and devotional literature to benefit future generations.')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Link
                to="/about"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#B78A3B] text-[#FAF7F0] font-sans font-semibold text-sm px-6 py-3 rounded-xl hover:bg-[#D8B86A] transition-colors"
              >
                <span>{t('common.learnAboutMahan', 'Learn About Sri Poondi Mahan')}</span>
              </Link>
              <Link
                to="/donation"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-[#FAF7F0]/40 text-[#FAF7F0] font-sans font-semibold text-sm px-6 py-3 rounded-xl hover:border-[#B78A3B] hover:text-[#B78A3B] transition-colors"
              >
                <span>{t('downloadsPage.supportBtn', 'Support Ashramam Activities')}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}


