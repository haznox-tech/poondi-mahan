import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectFade, Keyboard, A11y } from 'swiper/modules';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/pagination';

const slides = [
  {
    id: 1,
    bg: '/images/hero/sri-poondi-mahan-spiritual-legacy-hero.webp',
    heading: 'SRI POONDI MAHAN',
    headingTa: 'ஸ்ரீ பூண்டி மகான்',
    sub: 'A Life Beyond the Ordinary',
    subTa: 'தவமும் கருணையும் நிறைந்த திருத்தலம்',
    tagline: 'Remembering the divine presence and spiritual legacy of Sri Poondi Mahan.',
    taglineTa: 'கலசப்பாக்கம் திருத்தலத்தில் அருள்பாலிக்கும் ஞானசித்தர் பூண்டி சுவாமிகளின் திருப்பாதங்களை வணங்குவோம்.',
  },
  {
    id: 2,
    bg: '/images/hero/poondi-ashramam-annadanam-seva-hero.webp',
    heading: 'ANNADANAM SEVA',
    headingTa: 'நித்ய அன்னதான சேவை',
    sub: 'Nourishing Souls Every Day',
    subTa: 'பசித்த வயிறுகளுக்கு தினமும் அமுதூட்டும் புனித சேவை',
    tagline: 'Free food offered with love and devotion to every visitor at the ashramam.',
    taglineTa: 'ஆசிரமத்திற்கு வருகை தரும் அனைத்து பக்தர்களுக்கும் நித்ய அன்னதானம் வழங்கப்பட்டு வருகிறது.',
  },
  {
    id: 3,
    bg: '/images/hero/sri-poondi-mahan-attru-swamy-ashramam-hero.webp',
    heading: 'ATTRU SWAMY ASHRAMAM',
    headingTa: 'ஆற்று சுவாமிகள் ஆசிரமம்',
    sub: 'Poondi · Kalasapakkam · Tamil Nadu',
    subTa: 'பூண்டி · கலசப்பாக்கம் · திருவண்ணாமலை மாவட்டம்',
    tagline: 'A sacred sanctuary where the spirit of Mahan lives on through seva.',
    taglineTa: 'அன்பும் அமைதியும் தவமும் நிறைந்த புண்ணிய பூமி.',
  },
];

export default function HeroSwiper() {
  const { t, i18n } = useTranslation();
  const isTamil = i18n.language?.startsWith('ta');

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <section
      aria-label="Sri Poondi Mahan hero slideshow"
      className="relative h-screen min-h-[600px] overflow-hidden"
    >
      <Swiper
        modules={[Navigation, Pagination, Autoplay, EffectFade, Keyboard, A11y]}
        effect="fade"
        loop
        autoplay={prefersReducedMotion ? false : { delay: 5500, disableOnInteraction: false }}
        keyboard={{ enabled: true }}
        pagination={{ clickable: true }}
        a11y={{
          prevSlideMessage: 'Previous slide',
          nextSlideMessage: 'Next slide',
        }}
        className="h-full w-full"
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.id}>
            <div className="relative h-full w-full">
              {/* Background image */}
              <div
                className="absolute inset-0 bg-cover bg-center scale-105 transition-transform duration-[8s]"
                style={{ backgroundImage: `url(${slide.bg})` }}
                aria-hidden="true"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#0E2D27]/70 via-[#0E2D27]/50 to-[#091e1a]/85" />

              {/* Content */}
              <div className="relative h-full flex items-center justify-center text-center px-4">
                <div className="max-w-4xl w-full">
                  <p className="text-[#B78A3B] text-xs font-semibold tracking-widest uppercase mb-6 font-sans">
                    ॐ {t('nav.subtitle', 'Attru Swamy Ashramam')}
                  </p>
                  <h1 className="font-serif text-4xl sm:text-7xl lg:text-8xl font-medium text-[#B78A3B] leading-none mb-4 tracking-tight">
                    {isTamil && slide.headingTa ? slide.headingTa : slide.heading}
                  </h1>
                  <p className="font-serif text-lg sm:text-3xl text-[#E8D7B5] italic mb-6 font-light">
                    {isTamil && slide.subTa ? slide.subTa : slide.sub}
                  </p>
                  <p className="text-[#E8D7B5]/70 text-sm sm:text-lg max-w-xl mx-auto mb-10 font-sans leading-relaxed">
                    {isTamil && slide.taglineTa ? slide.taglineTa : slide.tagline}
                  </p>
                  <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center">
                    <Link
                      to="/about"
                      className="inline-flex items-center justify-center gap-2 bg-[#B78A3B] hover:bg-[#D8B86A] text-[#FAF7F0] font-sans font-semibold text-sm px-8 py-4 rounded transition-all duration-300 active:scale-[0.98] w-full sm:w-auto"
                    >
                      {t('home.hero.exploreHeritage', 'Discover His Life')}
                    </Link>
                    <Link
                      to="/donation"
                      className="inline-flex items-center justify-center gap-2 border border-[#FAF7F0]/50 hover:border-[#B78A3B] hover:text-[#B78A3B] text-[#FAF7F0] font-sans font-semibold text-sm px-8 py-4 rounded transition-all duration-300 active:scale-[0.98] w-full sm:w-auto"
                    >
                      {t('common.supportAnnadanam', 'Support Annadanam')}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1.5" aria-hidden="true">
        {/* <span className="text-[#E8D7B5]/40 text-[10px] tracking-widest uppercase font-sans">Scroll</span> */}
        <div className="w-px h-8 bg-gradient-to-b from-[#B78A3B]/60 to-transparent animate-pulse" />
      </div>
    </section>
  );
}
