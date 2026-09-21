import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Lightbox from 'yet-another-react-lightbox';
import Counter from 'yet-another-react-lightbox/plugins/counter';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/counter.css';
import { galleryFilters } from '../data/gallery.js';
import { getAllGalleryItems, getFeaturedIds, normalizeCategory, syncFromCodebase } from '../admin/adminStore.js';
import { ZoomIn } from 'lucide-react';
import clsx from 'clsx';

export default function GalleryGrid({ preview = false }) {
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState('all');
  const [lightboxIndex, setLightboxIndex] = useState(-1);

  // Dynamic state loaded from localStorage unified store
  const [allItems, setAllItems] = useState(() => {
    return typeof window !== 'undefined' ? getAllGalleryItems() : [];
  });
  const [featuredIds, setFeaturedIds] = useState(() => {
    return typeof window !== 'undefined' ? getFeaturedIds() : [];
  });

  useEffect(() => {
    let isMounted = true;
    const syncData = () => {
      if (!isMounted) return;
      setAllItems(getAllGalleryItems());
      setFeaturedIds(getFeaturedIds());
    };
    syncData();

    // Fetch authoritative data from codebase/server on mount
    syncFromCodebase().then(() => {
      syncData();
    });

    window.addEventListener('storage', syncData);
    window.addEventListener('pm_gallery_updated', syncData);
    window.addEventListener('pm_featured_updated', syncData);
    return () => {
      isMounted = false;
      window.removeEventListener('storage', syncData);
      window.removeEventListener('pm_gallery_updated', syncData);
      window.removeEventListener('pm_featured_updated', syncData);
    };
  }, []);

  const filtered =
    activeFilter === 'all'
      ? allItems
      : allItems.filter(
          (i) => normalizeCategory(i.category) === normalizeCategory(activeFilter)
        );

  // When previewing on Home page:
  // If custom 6 featured photos are selected, display them in order.
  // Otherwise, default to first 6 items.
  let displayItems;
  if (preview) {
    if (featuredIds && featuredIds.length === 6) {
      const selected = featuredIds
        .map((id) => allItems.find((i) => String(i.id) === String(id)))
        .filter(Boolean);
      displayItems = selected.length === 6 ? selected : allItems.slice(0, 6);
    } else {
      displayItems = allItems.slice(0, 6);
    }
  } else {
    displayItems = filtered;
  }

  const lightboxSlides = displayItems.map((item) => ({
    src: item.src,
    alt: item.alt,
    title: item.title || item.alt,
    description: item.alt,
    width: item.width || 800,
    height: item.height || 600,
  }));

  const getCount = (key) => {
    if (key === 'all') return allItems.length;
    return allItems.filter(
      (i) => normalizeCategory(i.category) === normalizeCategory(key)
    ).length;
  };



  return (
    <div>
      {/* Filters */}
      {!preview && (
        <div
          className="flex flex-wrap gap-2.5 mb-10 justify-center sm:justify-start"
          role="group"
          aria-label="Filter gallery by category"
        >
          {galleryFilters.map((f) => {
            const count = getCount(f.key);
            const filterKeyMap = {
              all: 'galleryPage.filterAll',
              swami: 'galleryPage.filterSwami',
              ashram: 'galleryPage.filterAshram',
              darshan: 'galleryPage.filterDarshan',
              events: 'galleryPage.filterEvents',
            };
            const label = t(filterKeyMap[f.key], f.label);
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setActiveFilter(f.key)}
                className={clsx(
                  'text-xs font-semibold tracking-wide px-4 py-2 rounded-xl border transition-all duration-200 cursor-pointer flex items-center gap-1.5 active:scale-95',
                  activeFilter === f.key
                    ? 'bg-[#173F35] border-[#173F35] text-[#FAF7F0] shadow-sm shadow-[#173F35]/20'
                    : 'bg-white border-[#E8D7B5] text-[#77736A] hover:border-[#B78A3B] hover:text-[#173F35]'
                )}
                aria-pressed={activeFilter === f.key}
              >
                <span>{label}</span>
                <span
                  className={clsx(
                    'text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold',
                    activeFilter === f.key
                      ? 'bg-[#B78A3B] text-[#FAF7F0]'
                      : 'bg-[#F2EBDD] text-[#77736A]'
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Grid: 3-Column Uniform Grid for Home Preview, Dynamic Masonry for Gallery Page */}
      <div
        className={clsx(
          preview
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4'
        )}
      >
        {displayItems.map((item, idx) => (
          <div
            key={item.id}
            className={clsx(
              'cursor-pointer group relative overflow-hidden rounded-2xl border border-[#E8D7B5]/80 bg-[#F2EBDD] transition-all duration-300 hover:border-[#B78A3B] hover:shadow-xl hover:shadow-[#173F35]/15',
              preview ? 'aspect-[4/3] w-full' : 'break-inside-avoid mb-4'
            )}
            onClick={() => setLightboxIndex(idx)}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setLightboxIndex(idx)}
            tabIndex={0}
            role="button"
            aria-label={`View photo: ${item.title || item.alt}`}
          >
            <img
              src={item.src}
              alt={item.alt}
              width={item.width || 800}
              height={item.height || 600}
              loading="lazy"
              decoding="async"
              className={clsx(
                'transition-transform duration-700 group-hover:scale-105 block',
                preview ? 'w-full h-full object-cover' : 'w-full h-auto object-cover'
              )}
            />

            {/* Hover overlay with Title and Magnifier Icon */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#091e1a]/95 via-[#0E2D27]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-5">
              <div className="flex justify-end">
                <div className="w-8 h-8 rounded-full bg-[#FAF7F0]/20 backdrop-blur-xs text-[#FAF7F0] flex items-center justify-center">
                  <ZoomIn size={16} />
                </div>
              </div>
              <div>
                {item.title && (
                  <p className="text-[#D8B86A] font-serif text-sm font-medium leading-snug mb-1">
                    {item.title}
                  </p>
                )}
                <p className="text-[#FAF7F0]/90 text-xs font-sans leading-tight line-clamp-2">
                  {item.alt}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      <Lightbox
        open={lightboxIndex >= 0}
        close={() => setLightboxIndex(-1)}
        index={lightboxIndex}
        slides={lightboxSlides}
        plugins={[Counter, Zoom]}
        carousel={{ finite: false }}
        controller={{ closeOnBackdropClick: true }}
        styles={{
          container: { backgroundColor: 'rgba(9, 30, 26, 0.98)' },
        }}
        counter={{ style: { top: 'unset', bottom: 20, color: '#E8D7B5', fontSize: '13px' } }}
      />
    </div>
  );
}

