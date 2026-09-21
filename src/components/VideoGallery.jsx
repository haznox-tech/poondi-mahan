import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Film, Smartphone, Clapperboard, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, A11y } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import { getAllVideos, syncFromCodebase } from '../admin/adminStore.js';
import VideoModal from './VideoModal.jsx';
import clsx from 'clsx';

export default function VideoGallery() {
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeVideo, setActiveVideo] = useState(null);

  const fullSwiperRef = useRef(null);
  const shortsSwiperRef = useRef(null);

  const [videos, setVideos] = useState(() => {
    return typeof window !== 'undefined' ? getAllVideos() : [];
  });

  useEffect(() => {
    let isMounted = true;
    const syncData = () => {
      if (!isMounted) return;
      setVideos(getAllVideos());
    };
    syncData();

    syncFromCodebase().then(() => {
      syncData();
    });

    window.addEventListener('storage', syncData);
    window.addEventListener('pm_videos_updated', syncData);
    return () => {
      isMounted = false;
      window.removeEventListener('storage', syncData);
      window.removeEventListener('pm_videos_updated', syncData);
    };
  }, []);

  const totalCount = videos.length;
  const fullVideos = videos.filter((v) => v.type === 'full');
  const shortsVideos = videos.filter((v) => v.type === 'shorts');

  const filterTabs = [
    { key: 'all', label: t('galleryPage.videoFilterAll', 'All Videos'), count: totalCount, icon: Clapperboard },
    { key: 'full', label: t('galleryPage.videoFilterFull', 'Full Videos'), count: fullVideos.length, icon: Film },
    { key: 'shorts', label: t('galleryPage.videoFilterShorts', 'Shorts'), count: shortsVideos.length, icon: Smartphone },
  ];

  /* -------------------------------------------------------------------------- */
  /* Full Video Card (16:9 Landscape - Uniform Height & Baseline)               */
  /* -------------------------------------------------------------------------- */
  const renderFullVideoCard = (video) => (
    <div className="group flex flex-col h-full bg-white rounded-2xl sm:rounded-3xl border border-[#E8D7B5]/80 overflow-hidden shadow-sm hover:shadow-xl hover:border-[#B78A3B] transition-all duration-300 select-none">
      {/* 16:9 Landscape Thumbnail Container */}
      <div
        className="relative w-full aspect-video bg-[#0a1210] overflow-hidden cursor-pointer"
        onClick={() => setActiveVideo(video)}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveVideo(video)}
        tabIndex={0}
        role="button"
        aria-label={`Play ${video.title}`}
      >
        <img
          src={
            video.thumbnailUrl ||
            (video.videoId ? `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg` : '/images/poondimahan-logo.png')
          }
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            if (video.videoId && !e.target.dataset.fallbackTried) {
              e.target.dataset.fallbackTried = 'true';
              e.target.src = `https://img.youtube.com/vi/${video.videoId}/0.jpg`;
            }
          }}
        />

        {/* Ambient Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

        {/* Badge: Full Video */}
        <div className="absolute top-3 left-3 z-10">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full backdrop-blur-md bg-[#173F35]/90 text-[#D8B86A] border border-[#2a5a4a] shadow-sm">
            {t('galleryPage.fullVideoBadge', 'Full Video')}
          </span>
        </div>

        {/* Centered Play Button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#173F35]/90 group-hover:bg-[#B78A3B] text-white flex items-center justify-center transition-all duration-300 shadow-xl group-hover:scale-110">
            <Play size={22} className="ml-1 fill-white" />
          </div>
        </div>

        {/* YouTube Brand Tag */}
        <div className="absolute bottom-3 right-3 text-[10px] text-white/90 font-medium flex items-center gap-1 bg-black/60 px-2.5 py-0.5 rounded-md backdrop-blur-xs">
          <span>YouTube</span>
        </div>
      </div>

      {/* Card Body - Content & Actions (Equal Height Alignment) */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between bg-white">
        <div>
          <h3
            className="font-serif font-semibold text-[#173F35] text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-[#B78A3B] transition-colors cursor-pointer"
            onClick={() => setActiveVideo(video)}
            title={video.title}
          >
            {video.title}
          </h3>
          {video.description && (
            <p className="mt-2 text-xs text-[#77736A] line-clamp-2 leading-relaxed">
              {video.description}
            </p>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-[#F2EBDD] flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => setActiveVideo(video)}
            className="text-[#173F35] hover:text-[#B78A3B] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <span>{t('galleryPage.watchVideo', 'Watch Video')}</span>
            <Play size={12} className="fill-current" />
          </button>

          {video.youtubeUrl && (
            <a
              href={video.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#77736A] hover:text-[#173F35] transition-colors p-1"
              title="Open on YouTube"
              aria-label="Open on YouTube"
            >
              <ExternalLink size={14} />
            </a>
          )}
        </div>
      </div>
    </div>
  );

  /* -------------------------------------------------------------------------- */
  /* Shorts Card (9:16 Portrait - Native Vertical Mobile Ratio)                 */
  /* -------------------------------------------------------------------------- */
  const renderShortsCard = (video) => (
    <div
      className="group relative aspect-[9/16] rounded-2xl sm:rounded-3xl overflow-hidden border border-[#E8D7B5]/80 bg-[#0a1210] shadow-sm hover:shadow-xl hover:border-[#B78A3B] transition-all duration-300 cursor-pointer flex flex-col justify-between select-none"
      onClick={() => setActiveVideo(video)}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveVideo(video)}
      tabIndex={0}
      role="button"
      aria-label={`Play shorts: ${video.title}`}
    >
      {/* Background Poster Image */}
      <img
        src={
          video.thumbnailUrl ||
          (video.videoId ? `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg` : '/images/poondimahan-logo.png')
        }
        alt={video.title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
        onError={(e) => {
          if (video.videoId && !e.target.dataset.fallbackTried) {
            e.target.dataset.fallbackTried = 'true';
            e.target.src = `https://img.youtube.com/vi/${video.videoId}/0.jpg`;
          }
        }}
      />

      {/* Vertical Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-black/40 group-hover:from-black/90 transition-colors" />

      {/* Top Header inside card */}
      <div className="relative z-10 p-3 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full backdrop-blur-md bg-rose-950/85 text-rose-300 border border-rose-800/60 shadow-sm">
          {t('galleryPage.shortsBadge', 'Shorts')}
        </span>
        <span className="text-[10px] text-white/80 font-medium px-2 py-0.5 rounded bg-black/40 backdrop-blur-xs">
          YouTube
        </span>
      </div>

      {/* Center Play Button Overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-rose-600/90 group-hover:bg-[#B78A3B] text-white flex items-center justify-center transition-all duration-300 shadow-xl group-hover:scale-110">
          <Play size={18} className="ml-0.5 fill-white" />
        </div>
      </div>

      {/* Bottom Title & Details */}
      <div className="relative z-10 p-3 sm:p-4">
        <h4
          className="font-sans font-semibold text-xs sm:text-sm text-white leading-snug line-clamp-2 drop-shadow-sm group-hover:text-[#D8B86A] transition-colors"
          title={video.title}
        >
          {video.title}
        </h4>
        {video.description && (
          <p className="mt-1 text-[11px] text-white/70 line-clamp-1 leading-normal">
            {video.description}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div>
      {/* Video Filter Pills */}
      <div
        className="flex flex-wrap gap-2.5 mb-10 justify-center sm:justify-start"
        role="group"
        aria-label="Filter videos by category"
      >
        {filterTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveFilter(tab.key)}
              className={clsx(
                'text-xs font-semibold tracking-wide px-4 py-2 rounded-xl border transition-all duration-200 cursor-pointer flex items-center gap-2 active:scale-95',
                isActive
                  ? 'bg-[#173F35] border-[#173F35] text-[#FAF7F0] shadow-sm shadow-[#173F35]/20'
                  : 'bg-white border-[#E8D7B5] text-[#77736A] hover:border-[#B78A3B] hover:text-[#173F35]'
              )}
              aria-pressed={isActive}
            >
              <Icon size={14} className={isActive ? 'text-[#D8B86A]' : 'text-[#77736A]'} />
              <span>{tab.label}</span>
              <span
                className={clsx(
                  'text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold',
                  isActive ? 'bg-[#B78A3B] text-[#FAF7F0]' : 'bg-[#F2EBDD] text-[#77736A]'
                )}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Empty State */}
      {videos.length === 0 && (
        <div className="text-center py-16 px-4 bg-white border border-[#E8D7B5] rounded-3xl shadow-sm">
          <Clapperboard size={36} className="mx-auto text-[#B78A3B] mb-3 opacity-60" />
          <p className="text-[#77736A] text-sm font-medium">
            {t('galleryPage.noVideos', 'No videos found in this category.')}
          </p>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* MODE 1: ALL VIDEOS (Swiper for Full Videos + Swiper for Sacred Shorts)*/}
      {/* -------------------------------------------------------------------- */}
      {activeFilter === 'all' && videos.length > 0 && (
        <div className="space-y-12">
          {/* SECTION A: Full Videos Swiper Carousel */}
          {fullVideos.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E8D7B5]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#173F35] flex items-center justify-center text-[#D8B86A] shrink-0">
                    <Film size={16} />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-base sm:text-lg text-[#173F35]">
                      {t('galleryPage.sectionFullVideos', 'Full Videos')}
                    </h3>
                    <p className="text-xs text-[#77736A] hidden sm:block">
                      {t('galleryPage.fullVideosSubtitle', 'Devotional speeches, ashramam history, and sanctum darshan.')}
                    </p>
                  </div>
                </div>

                {/* Header Controls: Count + Navigation Arrow Buttons */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-[#B78A3B]">
                    {fullVideos.length} {fullVideos.length === 1 ? 'Video' : 'Videos'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => fullSwiperRef.current?.slidePrev()}
                      className="w-8 h-8 rounded-full border border-[#E8D7B5] bg-white text-[#173F35] hover:bg-[#173F35] hover:text-[#FAF7F0] hover:border-[#173F35] flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                      aria-label="Previous full video"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => fullSwiperRef.current?.slideNext()}
                      className="w-8 h-8 rounded-full border border-[#E8D7B5] bg-white text-[#173F35] hover:bg-[#173F35] hover:text-[#FAF7F0] hover:border-[#173F35] flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                      aria-label="Next full video"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Swiper Container for Full Videos */}
              <div className="relative py-2 -mx-1 px-1">
                <Swiper
                  modules={[Navigation, Pagination, A11y]}
                  onBeforeInit={(swiper) => {
                    fullSwiperRef.current = swiper;
                  }}
                  spaceBetween={24}
                  slidesPerView={1}
                  grabCursor
                  pagination={{ clickable: true, dynamicBullets: true }}
                  breakpoints={{
                    640: { slidesPerView: 2, spaceBetween: 20 },
                    1024: { slidesPerView: 3, spaceBetween: 24 },
                  }}
                  className="pb-10!"
                >
                  {fullVideos.map((video) => (
                    <SwiperSlide key={video.id} className="h-auto! flex">
                      {renderFullVideoCard(video)}
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
            </div>
          )}

          {/* SECTION B: Sacred Shorts Swiper Carousel */}
          {shortsVideos.length > 0 && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between pb-3 border-b border-[#E8D7B5]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-950 flex items-center justify-center text-rose-400 shrink-0">
                    <Smartphone size={16} />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-base sm:text-lg text-[#173F35]">
                      {t('galleryPage.sectionShorts', 'Sacred Shorts')}
                    </h3>
                    <p className="text-xs text-[#77736A] hidden sm:block">
                      {t('galleryPage.shortsSubtitle', 'Short divine glimpses and blessings of Sri Poondi Mahan.')}
                    </p>
                  </div>
                </div>

                {/* Header Controls: Count + Navigation Arrow Buttons */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-rose-600">
                    {shortsVideos.length} {shortsVideos.length === 1 ? 'Short' : 'Shorts'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => shortsSwiperRef.current?.slidePrev()}
                      className="w-8 h-8 rounded-full border border-[#E8D7B5] bg-white text-[#173F35] hover:bg-[#173F35] hover:text-[#FAF7F0] hover:border-[#173F35] flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                      aria-label="Previous shorts"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => shortsSwiperRef.current?.slideNext()}
                      className="w-8 h-8 rounded-full border border-[#E8D7B5] bg-white text-[#173F35] hover:bg-[#173F35] hover:text-[#FAF7F0] hover:border-[#173F35] flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                      aria-label="Next shorts"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Swiper Container for Sacred Shorts */}
              <div className="relative py-2 -mx-1 px-1">
                <Swiper
                  modules={[Navigation, Pagination, A11y]}
                  onBeforeInit={(swiper) => {
                    shortsSwiperRef.current = swiper;
                  }}
                  spaceBetween={14}
                  slidesPerView={2}
                  grabCursor
                  pagination={{ clickable: true, dynamicBullets: true }}
                  breakpoints={{
                    480: { slidesPerView: 2, spaceBetween: 14 },
                    640: { slidesPerView: 3, spaceBetween: 16 },
                    768: { slidesPerView: 4, spaceBetween: 16 },
                    1024: { slidesPerView: 5, spaceBetween: 18 },
                    1280: { slidesPerView: 6, spaceBetween: 20 },
                  }}
                  className="pb-10!"
                >
                  {shortsVideos.map((video) => (
                    <SwiperSlide key={video.id} className="h-auto!">
                      {renderShortsCard(video)}
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* MODE 2: FULL VIDEOS TAB (Swiper Carousel)                            */}
      {/* -------------------------------------------------------------------- */}
      {activeFilter === 'full' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8D7B5]">
            <span className="text-xs font-mono font-bold text-[#B78A3B]">
              {fullVideos.length} {fullVideos.length === 1 ? 'Video' : 'Videos'} Available
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => fullSwiperRef.current?.slidePrev()}
                className="w-8 h-8 rounded-full border border-[#E8D7B5] bg-white text-[#173F35] hover:bg-[#173F35] hover:text-[#FAF7F0] hover:border-[#173F35] flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                aria-label="Previous full video"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => fullSwiperRef.current?.slideNext()}
                className="w-8 h-8 rounded-full border border-[#E8D7B5] bg-white text-[#173F35] hover:bg-[#173F35] hover:text-[#FAF7F0] hover:border-[#173F35] flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                aria-label="Next full video"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {fullVideos.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white border border-[#E8D7B5] rounded-3xl shadow-sm">
              <Film size={36} className="mx-auto text-[#B78A3B] mb-3 opacity-60" />
              <p className="text-[#77736A] text-sm font-medium">No full videos found.</p>
            </div>
          ) : (
            <div className="relative py-2 -mx-1 px-1">
              <Swiper
                modules={[Navigation, Pagination, A11y]}
                onBeforeInit={(swiper) => {
                  fullSwiperRef.current = swiper;
                }}
                spaceBetween={24}
                slidesPerView={1}
                grabCursor
                pagination={{ clickable: true, dynamicBullets: true }}
                breakpoints={{
                  640: { slidesPerView: 2, spaceBetween: 20 },
                  1024: { slidesPerView: 3, spaceBetween: 24 },
                }}
                className="pb-10!"
              >
                {fullVideos.map((video) => (
                  <SwiperSlide key={video.id} className="h-auto! flex">
                    {renderFullVideoCard(video)}
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* MODE 3: SHORTS TAB (Swiper Carousel)                                 */}
      {/* -------------------------------------------------------------------- */}
      {activeFilter === 'shorts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8D7B5]">
            <span className="text-xs font-mono font-bold text-rose-600">
              {shortsVideos.length} {shortsVideos.length === 1 ? 'Short' : 'Shorts'} Available
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => shortsSwiperRef.current?.slidePrev()}
                className="w-8 h-8 rounded-full border border-[#E8D7B5] bg-white text-[#173F35] hover:bg-[#173F35] hover:text-[#FAF7F0] hover:border-[#173F35] flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                aria-label="Previous shorts"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => shortsSwiperRef.current?.slideNext()}
                className="w-8 h-8 rounded-full border border-[#E8D7B5] bg-white text-[#173F35] hover:bg-[#173F35] hover:text-[#FAF7F0] hover:border-[#173F35] flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                aria-label="Next shorts"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {shortsVideos.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white border border-[#E8D7B5] rounded-3xl shadow-sm">
              <Smartphone size={36} className="mx-auto text-[#B78A3B] mb-3 opacity-60" />
              <p className="text-[#77736A] text-sm font-medium">No shorts found.</p>
            </div>
          ) : (
            <div className="relative py-2 -mx-1 px-1">
              <Swiper
                modules={[Navigation, Pagination, A11y]}
                onBeforeInit={(swiper) => {
                  shortsSwiperRef.current = swiper;
                }}
                spaceBetween={14}
                slidesPerView={2}
                grabCursor
                pagination={{ clickable: true, dynamicBullets: true }}
                breakpoints={{
                  480: { slidesPerView: 2, spaceBetween: 14 },
                  640: { slidesPerView: 3, spaceBetween: 16 },
                  768: { slidesPerView: 4, spaceBetween: 16 },
                  1024: { slidesPerView: 5, spaceBetween: 18 },
                  1280: { slidesPerView: 6, spaceBetween: 20 },
                }}
                className="pb-10!"
              >
                {shortsVideos.map((video) => (
                  <SwiperSlide key={video.id} className="h-auto!">
                    {renderShortsCard(video)}
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          )}
        </div>
      )}

      {/* Video Modal Player */}
      <VideoModal video={activeVideo} onClose={() => setActiveVideo(null)} />
    </div>
  );
}
