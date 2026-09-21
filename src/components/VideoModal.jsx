import { useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';
import clsx from 'clsx';

export default function VideoModal({ video, onClose }) {
  useEffect(() => {
    if (!video) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [video, onClose]);

  if (!video) return null;

  const isShorts = video.type === 'shorts';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="video-modal-title"
    >
      <div
        className={clsx(
          'relative w-full bg-[#0a1210] border border-[#2a5a4a] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col',
          isShorts ? 'max-w-xs sm:max-w-sm' : 'max-w-4xl'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#0f1a17] border-b border-[#1e3530]">
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <span
              className={clsx(
                'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0',
                isShorts
                  ? 'bg-rose-900/60 text-rose-300 border border-rose-700/50'
                  : 'bg-[#173F35] text-[#D8B86A] border border-[#2a5a4a]'
              )}
            >
              {isShorts ? 'Shorts' : 'Full Video'}
            </span>
            <h3
              id="video-modal-title"
              className="text-xs sm:text-sm font-medium text-[#FAF7F0] truncate"
              title={video.title}
            >
              {video.title}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {video.youtubeUrl && (
              <a
                href={video.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-[#77736A] hover:text-[#D8B86A] rounded-lg hover:bg-[#1a2e28] transition-colors"
                title="Watch on YouTube"
                aria-label="Watch on YouTube"
              >
                <ExternalLink size={15} />
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[#77736A] hover:text-[#FAF7F0] rounded-lg hover:bg-[#1a2e28] transition-colors cursor-pointer"
              aria-label="Close video"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Video Player Frame */}
        <div
          className={clsx(
            'w-full bg-black relative',
            isShorts ? 'aspect-[9/16]' : 'aspect-video'
          )}
        >
          {video.videoId ? (
            <iframe
              src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1&rel=0&playsinline=1`}
              title={video.title}
              className="absolute inset-0 w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-xs text-[#77736A] p-4 text-center">
              <span>Video source unavailable</span>
              {video.youtubeUrl && (
                <a
                  href={video.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 text-[#D8B86A] underline flex items-center gap-1"
                >
                  <span>Watch on YouTube</span>
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Playback Fallback Bar */}
        <div className="px-4 py-2 bg-[#0d1714] border-t border-[#1e3530] flex items-center justify-between text-[11px] text-[#77736A]">
          <span>Video playback enabled</span>
          <a
            href={video.youtubeUrl || (video.videoId ? `https://www.youtube.com/watch?v=${video.videoId}` : '#')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[#D8B86A] hover:underline font-medium"
          >
            <span>Open in YouTube App / Web</span>
            <ExternalLink size={12} />
          </a>
        </div>

        {/* Footer info (if description exists) */}
        {video.description && (
          <div className="px-4 py-3 bg-[#0a1210] border-t border-[#1e3530] max-h-28 overflow-y-auto">
            <p className="text-xs text-[#b8b3a7] leading-relaxed">
              {video.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
