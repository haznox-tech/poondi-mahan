import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Heart, BookOpen, MapPin, Images } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import SEO from '../components/SEO.jsx';
import HeroSwiper from '../components/HeroSwiper.jsx';
import SectionHeading from '../components/SectionHeading.jsx';
import TrusteeCard from '../components/TrusteeCard.jsx';
import GalleryGrid from '../components/GalleryGrid.jsx';
import {
  OrganizationSchema,
  PlaceOfWorshipSchema,
  WebSiteSchema,
  WebPageSchema,
} from '../components/StructuredData.jsx';
import { pageSEO } from '../data/seo.js';
import { trustees } from '../data/trustees.js';
import { getAllGalleryItems, syncFromCodebase } from '../admin/adminStore.js';

export default function Home() {
  const seo = pageSEO.home;
  const { t } = useTranslation();
  const [totalPhotos, setTotalPhotos] = useState(() =>
    typeof window !== 'undefined' ? getAllGalleryItems().length : 35
  );

  useEffect(() => {
    let isMounted = true;
    const updateTotal = () => {
      if (isMounted) setTotalPhotos(getAllGalleryItems().length);
    };
    updateTotal();

    syncFromCodebase().then(() => {
      if (isMounted) updateTotal();
    });

    window.addEventListener('storage', updateTotal);
    window.addEventListener('pm_gallery_updated', updateTotal);
    return () => {
      isMounted = false;
      window.removeEventListener('storage', updateTotal);
      window.removeEventListener('pm_gallery_updated', updateTotal);
    };
  }, []);


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
      <OrganizationSchema />
      <PlaceOfWorshipSchema />
      <WebSiteSchema />
      <WebPageSchema name={seo.title} description={seo.description} url="/" />

      {/* Hero */}
      <HeroSwiper />

      {/* Legacy Section */}
      <section className="py-16 lg:py-32 bg-[#FAF7F0]" aria-labelledby="legacy-heading">
        <div className="max-w-7xl mx-auto px-4 lg:px-10">
          {/* Mobile Heading (visible only on mobile < lg) */}
          <div className="lg:hidden mb-8">
            <SectionHeading
              overline={t('home.legacy.overline', 'Spiritual Heritage')}
              heading={t('home.legacy.heading', 'The Eternal Flame of Devotion')}
              id="legacy-heading-mobile"
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Image */}
            <div className="relative">
              <div className="relative">
                <div className="absolute -inset-4 bg-[#173F35] rounded" aria-hidden="true" />
                <div className="absolute -inset-2 bg-[#B78A3B]/20 rounded" aria-hidden="true" />
                <img
                  src="/images/gallery/poondi-ashramam-courtyard-temple-bell.webp"
                  alt="Sri Poondi Mahan Ashramam Sacred Courtyard and Temple Bell"
                  width={600}
                  height={750}
                  loading="eager"
                  decoding="async"
                  className="relative w-full h-[380px] sm:h-[500px] lg:h-[650px] object-cover rounded"
                />
              </div>
              {/* Gold accent */}
              <div className="absolute -bottom-6 -right-6 bg-[#B78A3B] text-[#FAF7F0] p-6 rounded font-serif text-lg italic hidden lg:block shadow-xl" aria-hidden="true">
                {t('home.legacy.quote', '"He who served all without difference."')}
              </div>
            </div>

            {/* Text Content */}
            <div>
              {/* Desktop Heading (hidden on mobile < lg) */}
              <div className="hidden lg:block">
                <SectionHeading
                  overline={t('home.legacy.overline', 'Spiritual Heritage')}
                  heading={t('home.legacy.heading', 'The Eternal Flame of Devotion')}
                  id="legacy-heading"
                />
              </div>
              <div className="space-y-5 text-[#77736A] leading-relaxed font-sans text-base mb-8 pt-2 lg:pt-0">
                <p>
                  {t('home.legacy.p1', 'Sri Poondi Mahan — revered as Attru Swamy — was a realized sage whose life embodied the highest ideals of selfless service and spiritual devotion. Born in the sacred soil of Tamil Nadu, his journey from ordinary life to divine presence is a story that continues to inspire thousands.')}
                </p>
                <p>
                  {t('home.legacy.p2', 'Establishing the Attru Swamy Ashramam at Poondi near Kalasapakkam in Thiruvannamalai District, he created a sanctuary of peace where every soul was welcomed without distinction. His Annadanam Seva — the offering of free food — became the living expression of his teaching: that to serve humanity is to serve the Divine.')}
                </p>
                <p>
                  {t('home.legacy.p3', 'The committee established in his memory continues to carry forward this sacred mission, preserving his legacy through devotion, seva, and community service.')}
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 bg-[#173F35] text-[#FAF7F0] font-sans font-semibold text-sm px-6 py-3 rounded hover:bg-[#0E2D27] transition-colors"
                >
                  <span>{t('home.legacy.learnAbout', 'Learn About Sri Poondi Mahan')}</span>
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
                <Link
                  to="/gallery"
                  className="inline-flex items-center gap-2 border border-[#B78A3B] text-[#B78A3B] font-sans font-semibold text-sm px-6 py-3 rounded hover:bg-[#B78A3B] hover:text-[#FAF7F0] transition-colors"
                >
                  <span>{t('home.legacy.exploreGallery', 'Explore the Gallery')}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Annadanam Section */}
      <section className="py-10 lg:py-25 bg-[#F2EBDD]" aria-labelledby="annadanam-heading">
        <div className="max-w-7xl mx-auto px-4 lg:px-10">
          {/* Mobile Heading (visible only on mobile < lg) */}
          <div className="lg:hidden mb-8">
            <SectionHeading
              overline={t('home.annadanam.overline', 'Sacred Seva')}
              heading={t('home.annadanam.heading', 'Annadanam — The Gift of Food')}
              id="annadanam-heading-mobile"
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Image (Order 1 on mobile, Order 2 on desktop) */}
            <div className="relative flex justify-center order-1 lg:order-2">
              <div className="relative w-full max-w-lg">
                {/* Decorative background glow */}
                <div className="absolute -inset-2 bg-gradient-to-r from-[#B78A3B]/20 to-[#173F35]/20 rounded-3xl blur-lg" />

                {/* Pure Clean Image Card with Quote Overlay */}
                <div className="relative rounded-lg overflow-hidden bg-[#0E2D27] shadow-2xl border-2 border-[#B78A3B]/35 group">
                  <img
                    src="/images/hero/sri-poondi-mahan-serve-with-love.webp"
                    alt="Sri Poondi Mahan - Serve with love, without expectation"
                    width={600}
                    height={750}
                    className="w-full h-[380px] sm:h-[400px] object-cover transition-transform duration-700 group-hover:scale-105 block"
                    loading="lazy"
                  />

                  {/* Divine Quote Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#091e1a]/95 via-[#0E2D27]/40 to-transparent flex flex-col justify-end p-6 sm:p-8">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[11px] font-sans font-semibold tracking-widest uppercase text-[#D8B86A]">
                        Divine Guidance
                      </span>
                    </div>
                    <blockquote className="font-serif text-2xl sm:text-3xl italic text-[#FAF7F0] font-light leading-snug mb-2">
                      “Serve with love,<br className="hidden sm:inline" /> without expectation.”
                    </blockquote>
                    <p className="font-tamil text-sm text-[#E8D7B5]/90 mb-3" lang="ta">
                      “அன்புடன் சேவை செய், எதையும் எதிர்பார்க்காதே.”
                    </p>
                    <div className="flex items-center justify-between pt-3 border-t border-[#B78A3B]/30 text-xs text-[#E8D7B5]/70 font-sans">
                      <span>— Sri Poondi Mahan</span>
                      <span className="text-[#D8B86A] font-medium">Attru Swamy Ashramam</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content (Order 2 on mobile, Order 1 on desktop) */}
            <div className="order-2 lg:order-1">
              {/* Desktop Heading (hidden on mobile < lg) */}
              <div className="hidden lg:block">
                <SectionHeading
                  overline={t('home.annadanam.overline', 'Sacred Seva')}
                  heading={t('home.annadanam.heading', 'Annadanam — The Gift of Food')}
                  id="annadanam-heading"
                />
              </div>

              {/* Subheading / Description */}
              <p className="text-[#77736A] font-sans text-base leading-relaxed mb-8 pt-2 lg:pt-0">
                {t('home.annadanam.subheading', 'Sri Poondi Mahan believed that feeding a hungry soul is the highest form of worship. The tradition of Annadanam Seva continues every day at the ashramam, nourishing all who come.')}
              </p>

              <div className="grid grid-cols-2 gap-3 sm:gap-6 mb-8 max-w-md">
                {[
                  { stat: t('home.annadanam.stat1Num', '365'), label: t('home.annadanam.stat1Label', 'Days Annadanam') },
                  { stat: t('home.annadanam.stat2Num', '1,10,000+'), label: t('home.annadanam.stat2Label', 'Souls Served per year') },
                ].map((s) => (
                  <div key={s.label} className="flex flex-col items-center justify-center text-center bg-[#FAF7F0] lg:bg-transparent px-3 py-3.5 sm:p-4 lg:p-0 rounded-xl border border-[#E8D7B5]/60 lg:border-0 shadow-2xs sm:shadow-none min-h-[92px] sm:min-h-0">
                    <p className="font-serif text-2xl sm:text-3xl lg:text-4xl text-[#B78A3B] font-semibold sm:font-medium mb-1 tracking-tight whitespace-nowrap">{s.stat}</p>
                    <p className="text-[11px] sm:text-xs text-[#77736A] font-sans uppercase tracking-wide leading-tight">{s.label}</p>
                  </div>
                ))}
              </div>
              <Link
                to="/donation"
                className="inline-flex items-center justify-center sm:justify-start gap-2 bg-[#173F35] text-[#FAF7F0] font-sans font-semibold text-sm px-6 py-3.5 rounded hover:bg-[#0E2D27] transition-colors w-full sm:w-auto text-center"
              >
                <Heart size={15} aria-hidden="true" />
                <span>{t('home.annadanam.supportButton', 'Support Annadanam Seva')}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trustees Preview */}
      <section className="py-10 lg:py-20 bg-[#FAF7F0]" aria-labelledby="trustees-heading">
        <div className="max-w-7xl mx-auto px-4 lg:px-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <SectionHeading
              overline={t('home.trustees.overline', 'Leadership')}
              heading={t('home.trustees.heading', 'Guiding the Path')}
              id="trustees-heading"
              className="mb-0"
            />
            <Link
              to="/trustees"
              className="flex-shrink-0 inline-flex items-center gap-2 text-sm text-[#B78A3B] font-sans font-semibold hover:text-[#173F35] transition-colors"
            >
              <span>{t('home.trustees.meetAll', 'Meet all trustees')}</span>
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>  
          <div className="grid sm:grid-cols-3 gap-6">
            {trustees.map((t) => (
              <TrusteeCard key={t.id} trustee={t} />
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Preview */}
      <section className="py-10 lg:py-25 bg-[#F2EBDD]" aria-labelledby="gallery-heading">
        <div className="max-w-7xl mx-auto px-4 lg:px-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="max-w-2xl">
              <SectionHeading
                overline={t('home.gallery.overline', 'Moments of Grace')}
                heading={t('home.gallery.heading', 'Ashramam Gallery')}
                id="gallery-heading"
                className="mb-0"
                subheading={t('home.gallery.subheading', 'Rare historic photographs of Sri Poondi Mahan, the sacred sanctum, daily puja aradhana, and the holy surroundings of Kalasapakkam.')}
              />
            </div>

            <Link
              to="/gallery"
              className="inline-flex items-center gap-2.5 bg-[#173F35] hover:bg-[#0E2D27] text-[#FAF7F0] font-sans font-semibold text-sm px-6 py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 group shrink-0"
            >
              <Images size={16} className="text-[#D8B86A]" aria-hidden="true" />
              <span>{t('home.gallery.viewAllBtnDynamic', `View All ${totalPhotos} Photos`)}</span>
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </Link>
          </div>

          <GalleryGrid preview />

          {/* Bottom Mobile Friendly CTA */}
          <div className="mt-12 text-center">
            <Link
              to="/gallery"
              className="inline-flex items-center gap-2 border border-[#B78A3B] bg-white hover:bg-[#B78A3B] text-[#173F35] hover:text-[#FAF7F0] font-sans font-semibold text-sm px-8 py-3.5 rounded-xl transition-all duration-200 shadow-sm active:scale-95 group"
            >
              <span>{t('home.gallery.exploreBtn', 'Explore Complete Photo Archive')}</span>
              <ArrowRight size={15} className="text-[#B78A3B] group-hover:text-[#FAF7F0] group-hover:translate-x-1 transition-all" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* Books Teaser */}
      <section className="py-16 lg:py-32 bg-[#173F35]" aria-labelledby="books-heading">
        <div className="max-w-7xl mx-auto px-4 lg:px-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <SectionHeading
                overline={t('home.books.overline', 'Publications')}
                heading={t('home.books.heading', 'Books & Sacred Texts')}
                id="books-heading"
                light
                subheading={t('home.books.subheading', 'Explore the life and teachings of Sri Poondi Mahan through available Tamil publications and devotional texts.')}
              />
              <Link
                to="/downloads"
                className="inline-flex items-center gap-2 bg-[#B78A3B] text-[#FAF7F0] font-sans font-semibold text-sm px-6 py-3 rounded hover:bg-[#D8B86A] transition-colors"
              >
                <BookOpen size={15} aria-hidden="true" />
                <span>{t('home.books.browseBtn', 'Browse Books & Downloads')}</span>
              </Link>
            </div>
            {/* Book Showcase Card */}
            <div className="bg-[#0E2D27] border border-[#B78A3B]/30 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 shadow-xl hover:border-[#B78A3B]/60 transition-all group">
              {/* 3D Book Cover Visual */}
              <div className="w-36 sm:w-44 flex-shrink-0 relative group-hover:scale-105 transition-transform duration-500">
                <div className="relative rounded-lg shadow-2xl shadow-black/80 overflow-hidden border border-[#FAF7F0]/20 bg-[#173F35]">
                  <img
                    src="/images/books-cover/book_cover.webp"
                    alt="Cover of Poondi Swamy Tamil Book - பூண்டி சுவாமி"
                    width={180}
                    height={250}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-auto object-cover block"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/10 pointer-events-none" />
                </div>
              </div>

              {/* Book Information & Actions */}
              <div className="flex-1 text-center sm:text-left">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#B78A3B]/15 border border-[#B78A3B]/30 text-[#D8B86A] text-[11px] font-semibold tracking-widest uppercase font-sans mb-2.5">
                  <span>{t('home.books.badge', 'Tamil Publication')}</span>
                </div>
                <h3 className="font-serif text-2xl sm:text-3xl text-[#FAF7F0] font-medium mb-1">
                  {t('home.books.bookTitle', 'Poondi Swamy')}
                </h3>
                <p className="font-tamil text-lg text-[#D8B86A] mb-3 font-normal" lang="ta">
                  {t('home.books.bookTitleTa', 'பூண்டி சுவாமி')}
                </p>
                <p className="text-xs text-[#E8D7B5]/70 font-sans mb-5 leading-relaxed">
                  {t('home.books.bookDesc', 'A blessed biography recounting the divine life, tapas, and miracles of Sri Poondi Mahan.')}
                </p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                  <Link
                    to="/downloads"
                    className="inline-flex items-center gap-1.5 bg-[#B78A3B] hover:bg-[#D8B86A] text-[#FAF7F0] text-xs font-sans font-semibold px-4.5 py-2.5 rounded-xl transition-all shadow-sm active:scale-95"
                  >
                    <span>{t('home.books.readDownload', 'Read or Download')}</span>
                    <ArrowRight size={13} aria-hidden="true" />
                  </Link>
                  <a
                    href="/images/books/Poondi-Swamy-Tamil-Book-1.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 border border-[#FAF7F0]/30 hover:border-[#B78A3B] text-[#FAF7F0] hover:text-[#D8B86A] text-xs font-sans font-semibold px-4 py-2.5 rounded-xl transition-all"
                    title="Open PDF directly in new tab"
                  >
                    <BookOpen size={14} className="text-[#D8B86A]" />
                    <span>{t('home.books.readPdf', 'Read PDF')}</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Visit CTA with Background Image */}
      <section className="relative py-20 lg:py-32 overflow-hidden text-center text-[#FAF7F0]" aria-labelledby="visit-heading">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{ backgroundImage: "url('/images/hero/sri-poondi-mahan-tapas-illumination.webp')" }}
          aria-hidden="true"
        />

        {/* Gradient Overlay for Optimal Contrast */}
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[20px]" aria-hidden="true" />

        <div className="relative z-10 max-w-3xl mx-auto px-4 lg:px-10">
          <p className="text-[#D8B86A] text-xs font-semibold tracking-widest uppercase font-sans mb-3">
            {t('home.visit.overline', 'Pilgrimage · Peace · Seva')}
          </p>
          <h2 id="visit-heading" className="font-serif text-4xl sm:text-5xl lg:text-6xl text-[#FAF7F0] font-medium mb-6 tracking-tight">
            {t('home.visit.heading', 'Visit the Ashramam')}
          </h2>
          <div className="h-px w-20 bg-gradient-to-r from-transparent via-[#B78A3B] to-transparent mx-auto mb-6" aria-hidden="true" />
          <address className="not-italic text-[#E8D7B5]/90 text-base sm:text-lg leading-relaxed mb-8 font-sans max-w-xl mx-auto">
            <strong className="block text-[#FAF7F0] font-semibold mb-1">
              {t('common.addressTitle', 'Sri Poondi Mahan Attru Swamy Ashramam')}
            </strong>
            {t('common.addressLocation', 'Poondi & Post, Kalasapakkam Taluk, Thiruvannamalai District, Tamil Nadu – 606751, India')}
          </address>
          <Link
            to="/contact"
            className="inline-flex items-center justify-center gap-2 bg-[#B78A3B] hover:bg-[#D8B86A] text-[#FAF7F0] font-sans font-semibold text-sm px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
          >
            <MapPin size={16} aria-hidden="true" />
            <span>{t('home.visit.button', 'Contact & Directions')}</span>
          </Link>
        </div>
      </section>
    </>
  );
}
