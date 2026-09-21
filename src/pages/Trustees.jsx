import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import SEO from '../components/SEO.jsx';
import PageHero from '../components/PageHero.jsx';
import SectionHeading from '../components/SectionHeading.jsx';
import TrusteeCard from '../components/TrusteeCard.jsx';
import { BreadcrumbSchema, WebPageSchema } from '../components/StructuredData.jsx';
import { pageSEO } from '../data/seo.js';
import { trustees } from '../data/trustees.js';

export default function Trustees() {
  const seo = pageSEO.trustees;
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
        items={[{ name: 'Home', path: '/' }, { name: 'Trustees', path: '/trustees' }]}
      />
      <WebPageSchema name={seo.title} description={seo.description} url="/trustees" />

      <PageHero
        title={t('trusteesPage.heroTitle', 'Our Trustees')}
        subtitle={t('trusteesPage.heroSubtitle', 'Dedicated individuals serving the Sri Poondi Mahan Attru Swamy Ashramam Committee.')}
        breadcrumbs={[{ label: t('nav.trustees', 'Trustees') }]}
        bgImage="/images/hero/sri-poondi-mahan-golden-light-darshan.webp"
      />

      <section className="py-16 bg-[#FAF7F0]" aria-labelledby="trustees-main-heading">
        <div className="max-w-7xl mx-auto px-4 lg:px-10">
          <SectionHeading
            overline={t('trusteesPage.overline', 'Leadership')}
            heading={t('trusteesPage.heading', 'The Custodians of His Legacy')}
            id="trustees-main-heading"
            align="center"
            subheading={t('trusteesPage.subheading', 'The trustees of Sri Poondi Mahan Attru Swamy Ashramam Committee serve with devotion, ensuring the continuation of Annadanam Seva and the preservation of his spiritual legacy.')}
          />

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
            {trustees.map((tItem) => (
              <TrusteeCard key={tItem.id} trustee={tItem} />
            ))}
          </div>

          {/* Committee Info */}
          <div className="mt-20 bg-[#173F35] rounded-2xl p-8 sm:p-10 text-center text-[#E8D7B5] shadow-xl border border-[#B78A3B]/30">
            <h2 className="font-serif text-2xl sm:text-3xl text-[#FAF7F0] mb-4 font-medium">
              {t('trusteesPage.committeeBoxHeading', 'Sri Poondi Mahan Attru Swamy Ashramam Committee')}
            </h2>
            <div className="h-px w-20 bg-[#B78A3B] mx-auto mb-6" aria-hidden="true" />
            <address className="not-italic text-[#E8D7B5]/80 text-sm leading-relaxed mb-8 font-sans max-w-xl mx-auto">
              {t('common.addressLocation', 'Poondi & Post, Kalasapakkam Taluk, Thiruvannamalai District, Tamil Nadu – 606751, India')}
            </address>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 bg-[#B78A3B] hover:bg-[#D8B86A] text-[#FAF7F0] font-sans font-semibold text-sm px-6 py-3.5 rounded-xl transition-all shadow-md active:scale-95"
            >
              <span>{t('trusteesPage.getInTouch', 'Get in Touch')}</span>
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
