import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Camera, Video } from 'lucide-react';
import SEO from '../components/SEO.jsx';
import PageHero from '../components/PageHero.jsx';
import SectionHeading from '../components/SectionHeading.jsx';
import GalleryGrid from '../components/GalleryGrid.jsx';
import VideoGallery from '../components/VideoGallery.jsx';
import { getAllGalleryItems, getAllVideos, syncFromCodebase } from '../admin/adminStore.js';
import { BreadcrumbSchema, WebPageSchema } from '../components/StructuredData.jsx';
import { pageSEO } from '../data/seo.js';
import clsx from 'clsx';

export default function Gallery() {
  const seo = pageSEO.gallery;
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState('photos'); // 'photos' | 'videos'

  const [photosCount, setPhotosCount] = useState(() => {
    return typeof window !== 'undefined' ? getAllGalleryItems().length : 36;
  });
  const [videosCount, setVideosCount] = useState(() => {
    return typeof window !== 'undefined' ? getAllVideos().length : 4;
  });

  useEffect(() => {
    let isMounted = true;
    const syncCounts = () => {
      if (!isMounted) return;
      setPhotosCount(getAllGalleryItems().length);
      setVideosCount(getAllVideos().length);
    };

    syncCounts();
    syncFromCodebase().then(() => {
      syncCounts();
    });

    window.addEventListener('storage', syncCounts);
    window.addEventListener('pm_gallery_updated', syncCounts);
    window.addEventListener('pm_videos_updated', syncCounts);

    return () => {
      isMounted = false;
      window.removeEventListener('storage', syncCounts);
      window.removeEventListener('pm_gallery_updated', syncCounts);
      window.removeEventListener('pm_videos_updated', syncCounts);
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
      <BreadcrumbSchema
        items={[{ name: 'Home', path: '/' }, { name: 'Gallery', path: '/gallery' }]}
      />
      <WebPageSchema name={seo.title} description={seo.description} url="/gallery" />

      <PageHero
        title={t('galleryPage.heroTitle', 'Sacred Photo & Video Gallery')}
        subtitle={t('galleryPage.heroSubtitle', 'Photographs and sacred videos from the ashramam, devotional gatherings, Annadanam Seva and the life of Sri Poondi Mahan.')}
        breadcrumbs={[{ label: t('nav.gallery', 'Gallery') }]}
        bgImage="/images/hero/sri-poondi-mahan-tapas-illumination.webp"
      />

      <section className="py-16 bg-[#FAF7F0]" aria-labelledby="gallery-main-heading">
        <div className="max-w-7xl mx-auto px-4 lg:px-10">
          <SectionHeading
            overline={t('galleryPage.overline', 'Glimpses of Grace')}
            heading={t('galleryPage.heading', 'Sacred Gallery')}
            id="gallery-main-heading"
          />

          {/* Section Switcher: Photos & Videos */}
          <div className="flex justify-center mb-10 -mt-2">
            <div className="inline-flex p-1.5 rounded-2xl bg-[#EFE8D8] border border-[#E0D3BC] shadow-inner gap-1.5">
              <button
                type="button"
                onClick={() => setActiveSection('photos')}
                className={clsx(
                  'flex items-center gap-2 px-5 sm:px-7 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all duration-200 cursor-pointer active:scale-95',
                  activeSection === 'photos'
                    ? 'bg-[#173F35] text-[#FAF7F0] shadow-md shadow-[#173F35]/25'
                    : 'text-[#5C584E] hover:text-[#173F35] hover:bg-[#FAF7F0]/80'
                )}
                aria-pressed={activeSection === 'photos'}
              >
                <Camera size={16} className={activeSection === 'photos' ? 'text-[#D8B86A]' : 'text-[#77736A]'} />
                <span className="font-semibold">{t('galleryPage.tabPhotos', 'Photos')}</span>
                <span
                  className={clsx(
                    'text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-mono font-bold',
                    activeSection === 'photos'
                      ? 'bg-[#B78A3B] text-[#FAF7F0]'
                      : 'bg-[#E0D3BC] text-[#5C584E]'
                  )}
                >
                  {photosCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSection('videos')}
                className={clsx(
                  'flex items-center gap-2 px-5 sm:px-7 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all duration-200 cursor-pointer active:scale-95',
                  activeSection === 'videos'
                    ? 'bg-[#173F35] text-[#FAF7F0] shadow-md shadow-[#173F35]/25'
                    : 'text-[#5C584E] hover:text-[#173F35] hover:bg-[#FAF7F0]/80'
                )}
                aria-pressed={activeSection === 'videos'}
              >
                <Video size={16} className={activeSection === 'videos' ? 'text-[#D8B86A]' : 'text-[#77736A]'} />
                <span className="font-semibold">{t('galleryPage.tabVideos', 'Videos')}</span>
                <span
                  className={clsx(
                    'text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-mono font-bold',
                    activeSection === 'videos'
                      ? 'bg-[#B78A3B] text-[#FAF7F0]'
                      : 'bg-[#E0D3BC] text-[#5C584E]'
                  )}
                >
                  {videosCount}
                </span>
              </button>
            </div>
          </div>

          {/* Active Section Content */}
          {activeSection === 'photos' ? <GalleryGrid /> : <VideoGallery />}

          <div className="mt-16 pt-12 border-t border-[#E8D7B5] flex flex-wrap gap-4">
            <Link
              to="/about"
              className="inline-flex items-center gap-2 border border-[#B78A3B] text-[#B78A3B] font-sans font-semibold text-sm px-5 py-3 rounded hover:bg-[#B78A3B] hover:text-[#FAF7F0] transition-colors"
            >
              <span>{t('common.learnAboutMahan', 'Learn About Sri Poondi Mahan')}</span>
            </Link>
            <Link
              to="/donation"
              className="inline-flex items-center gap-2 bg-[#173F35] text-[#FAF7F0] font-sans font-semibold text-sm px-5 py-3 rounded hover:bg-[#0E2D27] transition-colors"
            >
              <span>{t('common.supportSeva', 'Support Annadanam Seva')}</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

