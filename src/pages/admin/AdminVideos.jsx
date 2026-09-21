import { useState, useEffect } from 'react';
import {
  Video,
  Film,
  Smartphone,
  Clapperboard,
  Trash2,
  Edit2,
  Check,
  X,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  Clock,
  ExternalLink,
  Plus,
  Play,
} from 'lucide-react';
import {
  getAllVideos,
  addVideo,
  updateVideo,
  deleteVideo,
  getRecentlyDeletedVideos,
  restoreVideo,
  permanentlyDeleteVideoTrash,
  emptyVideoTrash,
  extractYouTubeId,
  isShortsUrl,
  getYouTubeThumbnail,
  getDaysRemaining,
  syncFromCodebase,
  flushToCodebase,
} from '../../admin/adminStore.js';
import { hasGitHubToken, syncGalleryDataJsonToGitHub } from '../../admin/githubSync.js';
import VideoModal from '../../components/VideoModal.jsx';
import clsx from 'clsx';

const MAX_TITLE_CHARS = 200;
const MAX_DESC_CHARS = 500;

export default function AdminVideos() {
  const [viewMode, setViewMode] = useState('videos'); // 'videos' | 'trash'
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'full' | 'shorts'
  const [activeModalVideo, setActiveModalVideo] = useState(null); // Player preview modal

  const [allVideos, setAllVideos] = useState(() =>
    typeof window !== 'undefined' ? getAllVideos() : []
  );
  const [trashVideos, setTrashVideos] = useState(() =>
    typeof window !== 'undefined' ? getRecentlyDeletedVideos() : []
  );

  // Form State
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [videoType, setVideoType] = useState('full'); // 'full' | 'shorts'
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Modal State
  const [editingVideo, setEditingVideo] = useState(null);
  const [editUrl, setEditUrl] = useState('');
  const [editType, setEditType] = useState('full');
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editError, setEditError] = useState('');
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  // Deletion Modals
  const [deletingId, setDeletingId] = useState(null); // Move to trash
  const [deletingForeverId, setDeletingForeverId] = useState(null); // Permanent delete
  const [confirmEmptyTrash, setConfirmEmptyTrash] = useState(false);

  const refreshVideos = () => {
    setAllVideos(getAllVideos());
    setTrashVideos(getRecentlyDeletedVideos());
  };

  useEffect(() => {
    let isMounted = true;
    const onUpdate = () => {
      if (isMounted) refreshVideos();
    };
    refreshVideos();

    syncFromCodebase().then(() => {
      if (isMounted) refreshVideos();
    });

    window.addEventListener('pm_videos_updated', onUpdate);
    window.addEventListener('pm_video_trash_updated', onUpdate);
    window.addEventListener('storage', onUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('pm_videos_updated', onUpdate);
      window.removeEventListener('pm_video_trash_updated', onUpdate);
      window.removeEventListener('storage', onUpdate);
    };
  }, []);

  // Auto-detect Shorts from URL
  const handleUrlChange = (val) => {
    setYoutubeUrl(val);
    setFormError('');
    if (isShortsUrl(val)) {
      setVideoType('shorts');
    }
  };

  const handleEditUrlChange = (val) => {
    setEditUrl(val);
    setEditError('');
    if (isShortsUrl(val)) {
      setEditType('shorts');
    }
  };

  // Preview YouTube ID & Thumbnail
  const detectedVideoId = extractYouTubeId(youtubeUrl);
  const detectedThumbnail = detectedVideoId ? getYouTubeThumbnail(detectedVideoId) : '';

  const editDetectedVideoId = extractYouTubeId(editUrl);
  const editDetectedThumbnail = editDetectedVideoId ? getYouTubeThumbnail(editDetectedVideoId) : '';

  // Add Video Submit
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!youtubeUrl.trim()) {
      setFormError('Please enter a YouTube video URL.');
      return;
    }

    const videoId = extractYouTubeId(youtubeUrl);
    if (!videoId) {
      setFormError('Invalid YouTube URL. Please enter a valid YouTube watch link, Shorts link, or youtu.be link.');
      return;
    }

    if (!title.trim()) {
      setFormError('Please enter a video title.');
      return;
    }

    setIsSubmitting(true);
    try {
      addVideo({
        youtubeUrl: youtubeUrl.trim(),
        type: videoType,
        title: title.trim(),
        description: description.trim(),
      });

      await flushToCodebase();
      if (hasGitHubToken()) {
        syncGalleryDataJsonToGitHub().catch(() => {});
      }
      refreshVideos();

      setFormSuccess('Video added successfully!');
      setYoutubeUrl('');
      setTitle('');
      setDescription('');
      setVideoType('full');

      setTimeout(() => setFormSuccess(''), 4000);
    } catch (err) {
      setFormError(err.message || 'Failed to add video.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (vid) => {
    setEditingVideo(vid);
    setEditUrl(vid.youtubeUrl || (vid.videoId ? `https://www.youtube.com/watch?v=${vid.videoId}` : ''));
    setEditType(vid.type || 'full');
    setEditTitle(vid.title || '');
    setEditDesc(vid.description || '');
    setEditError('');
  };

  // Save Edit Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingVideo) return;

    if (!editUrl.trim()) {
      setEditError('YouTube URL is required.');
      return;
    }

    const videoId = extractYouTubeId(editUrl);
    if (!videoId) {
      setEditError('Invalid YouTube URL.');
      return;
    }

    if (!editTitle.trim()) {
      setEditError('Video title is required.');
      return;
    }

    setIsEditSubmitting(true);
    try {
      updateVideo(editingVideo.id, {
        youtubeUrl: editUrl.trim(),
        type: editType,
        title: editTitle.trim(),
        description: editDesc.trim(),
      });

      await flushToCodebase();
      if (hasGitHubToken()) {
        await syncGalleryDataJsonToGitHub().catch((err) => {
          console.warn('[AdminVideos] GitHub sync warning:', err);
        });
      }
      refreshVideos();

      setEditingVideo(null);
      setFormSuccess('Video updated successfully!');
      setTimeout(() => setFormSuccess(''), 3000);
    } catch (err) {
      setEditError(err.message || 'Failed to update video.');
    } finally {
      setIsEditSubmitting(false);
    }
  };

  // Delete Video (Move to Recently Deleted / Recycle Bin)
  const handleMoveToTrash = async () => {
    if (!deletingId) return;
    deleteVideo(deletingId);
    await flushToCodebase();
    if (hasGitHubToken()) {
      syncGalleryDataJsonToGitHub().catch(() => {});
    }
    setDeletingId(null);
    refreshVideos();
    setFormSuccess('Video moved to Recently Deleted (Recycle Bin).');
    setTimeout(() => setFormSuccess(''), 4000);
  };

  // Restore Video
  const handleRestore = async (id) => {
    restoreVideo(id);
    await flushToCodebase();
    if (hasGitHubToken()) {
      syncGalleryDataJsonToGitHub().catch(() => {});
    }
    refreshVideos();
    setFormSuccess('Video restored successfully to active videos.');
    setTimeout(() => setFormSuccess(''), 4000);
  };

  // Delete Forever from Trash
  const handlePermanentDelete = async () => {
    if (!deletingForeverId) return;
    permanentlyDeleteVideoTrash(deletingForeverId);
    await flushToCodebase();
    if (hasGitHubToken()) {
      syncGalleryDataJsonToGitHub().catch(() => {});
    }
    setDeletingForeverId(null);
    refreshVideos();
    setFormSuccess('Video permanently deleted.');
    setTimeout(() => setFormSuccess(''), 4000);
  };

  // Empty Entire Trash
  const handleEmptyTrash = async () => {
    emptyVideoTrash();
    await flushToCodebase();
    if (hasGitHubToken()) {
      syncGalleryDataJsonToGitHub().catch(() => {});
    }
    setConfirmEmptyTrash(false);
    refreshVideos();
    setFormSuccess('Recently Deleted videos have been emptied.');
    setTimeout(() => setFormSuccess(''), 4000);
  };

  // Filtered active videos
  const filteredVideos = allVideos.filter((v) => {
    if (activeTab === 'full') return v.type === 'full';
    if (activeTab === 'shorts') return v.type === 'shorts';
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-10 pb-16">
      {/* Page Header */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold text-[#D8B86A]">
              Video Management
            </h1>
            <p className="text-[#77736A] text-xs sm:text-sm mt-1">
              Add YouTube full videos (16:9) and shorts (9:16). Deleted videos are safely kept in Recently Deleted for 10 days.
            </p>
          </div>

          {/* View Switcher: Videos vs Recently Deleted */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setViewMode('videos')}
              className={clsx(
                'px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5',
                viewMode === 'videos'
                  ? 'bg-[#173F35] text-[#FAF7F0] border-[#2a5a4a] shadow-sm'
                  : 'bg-[#0a1210] text-[#77736A] border-[#1e3530] hover:text-[#FAF7F0]'
              )}
            >
              <span>Videos</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-[#0a1210] text-[#D8B86A]">
                {allVideos.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('trash')}
              className={clsx(
                'px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5',
                viewMode === 'trash'
                  ? 'bg-[#2a1a1a] text-[#f87171] border-[#5a2a2a] shadow-sm'
                  : 'bg-[#0a1210] text-[#77736A] border-[#1e3530] hover:text-[#FAF7F0]'
              )}
            >
              <Trash2 size={12} className={viewMode === 'trash' ? 'text-[#f87171]' : 'text-[#77736A]'} />
              <span>Recently Deleted</span>
              {trashVideos.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-[#3a1a1a] text-[#f87171] font-bold">
                  {trashVideos.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Global Toast Messages */}
      {formError && (
        <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#2a1a1a] border border-[#5a2a2a] flex items-start gap-2.5 text-[#f87171] text-xs">
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          <div className="leading-relaxed">{formError}</div>
        </div>
      )}

      {formSuccess && (
        <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#173F35]/60 border border-[#2a5a4a] flex items-center gap-2.5 text-[#4ade80] text-xs">
          <CheckCircle2 size={15} className="shrink-0" />
          <div className="font-medium">{formSuccess}</div>
        </div>
      )}

      {/* RECYCLE BIN / RECENTLY DELETED VIEW */}
      {viewMode === 'trash' && (
        <div className="space-y-6 sm:space-y-8">
          {/* Info Banner */}
          <div className="bg-[#0f1a17] border border-[#2a5a4a] rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2a1a1a] border border-[#5a2a2a] text-[#f87171] flex items-center justify-center shrink-0">
                <Clock size={18} />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-serif font-bold text-[#FAF7F0] flex items-center gap-2">
                  <span>Recently Deleted Videos (Recycle Bin)</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#2a1a1a] text-[#f87171] font-sans font-semibold border border-[#5a2a2a]">
                    10-Day Safe Retention
                  </span>
                </h2>
                <p className="text-xs text-[#77736A] mt-0.5">
                  Deleted videos remain here for 10 days before auto-purging. You can restore them anytime.
                </p>
              </div>
            </div>

            {trashVideos.length > 0 && (
              <button
                type="button"
                onClick={() => setConfirmEmptyTrash(true)}
                className="px-4 py-2 rounded-xl bg-[#2a1a1a] hover:bg-rose-950 border border-[#5a2a2a] text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 self-start sm:self-center"
              >
                <Trash2 size={13} />
                <span>Empty Trash</span>
              </button>
            )}
          </div>

          {trashVideos.length === 0 ? (
            <div className="text-center py-16 px-4 bg-[#0a1210] border border-[#1e3530] rounded-2xl sm:rounded-3xl">
              <Trash2 size={36} className="mx-auto text-[#77736A] mb-3 opacity-40" />
              <p className="text-[#FAF7F0] text-sm font-medium">Recycle Bin is Empty</p>
              <p className="text-[#77736A] text-xs mt-1">No recently deleted videos found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {trashVideos.map((video) => {
                const daysLeft = getDaysRemaining(video.deletedAt);
                const isShorts = video.type === 'shorts';
                return (
                  <div
                    key={video.id}
                    className="bg-[#0a1210] border border-[#2a1a1a] rounded-2xl overflow-hidden flex flex-col justify-between shadow-lg group"
                  >
                    <div>
                      {/* Thumbnail Preview */}
                      <div
                        className={clsx('relative w-full bg-black cursor-pointer overflow-hidden', isShorts ? 'aspect-[9/16] max-h-56' : 'aspect-video')}
                        onClick={() => setActiveModalVideo(video)}
                        title="Click to preview video"
                      >
                        <img
                          src={video.thumbnailUrl || (video.videoId ? `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg` : '')}
                          alt={video.title}
                          className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                          <div className="w-10 h-10 rounded-full bg-[#173F35]/90 group-hover:bg-[#B78A3B] text-white flex items-center justify-center transition-all shadow-lg group-hover:scale-110">
                            <Play size={16} className="ml-0.5 fill-white" />
                          </div>
                        </div>
                        <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10">
                          <span
                            className={clsx(
                              'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full backdrop-blur-xs',
                              isShorts
                                ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                                : 'bg-[#173F35]/80 text-[#D8B86A] border border-[#2a5a4a]'
                            )}
                          >
                            {isShorts ? 'Shorts' : 'Full Video'}
                          </span>
                        </div>
                        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 text-[10px] font-mono text-rose-300 border border-rose-900/60 flex items-center gap-1 z-10">
                          <Clock size={10} />
                          <span>{daysLeft} days left</span>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="p-4 space-y-1.5">
                        <h3
                          className="text-sm font-serif font-semibold text-[#FAF7F0] line-clamp-1 cursor-pointer hover:text-[#D8B86A] transition-colors"
                          onClick={() => setActiveModalVideo(video)}
                        >
                          {video.title}
                        </h3>
                        {video.description && (
                          <p className="text-xs text-[#77736A] line-clamp-2">
                            {video.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-4 pt-0 border-t border-[#1e3530]/60 mt-3 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleRestore(video.id)}
                        className="flex-1 py-2 px-3 rounded-xl bg-[#173F35] hover:bg-[#1f5246] text-[#FAF7F0] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <RotateCcw size={13} className="text-[#D8B86A]" />
                        <span>Restore Video</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeletingForeverId(video.id)}
                        className="p-2 rounded-xl bg-[#2a1a1a] hover:bg-rose-950 text-rose-400 hover:text-rose-200 border border-[#5a2a2a] transition-colors cursor-pointer"
                        title="Delete Forever"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ACTIVE VIDEOS VIEW */}
      {viewMode === 'videos' && (
        <>
          {/* Add Video Form Card */}
          <div className="bg-[#0a1210] border border-[#1e3530] rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-5 sm:mb-6 pb-3.5 sm:pb-4 border-b border-[#1e3530]">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#173F35] flex items-center justify-center text-[#D8B86A] shrink-0">
                <Clapperboard size={18} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-serif font-semibold text-[#FAF7F0]">
                  Add YouTube Video
                </h2>
                <p className="text-[11px] sm:text-xs text-[#77736A]">
                  Paste YouTube link, select Full Video (landscape) or Shorts (portrait), and provide title & description.
                </p>
              </div>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-5 sm:space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Cols: Form Inputs */}
                <div className="lg:col-span-2 space-y-4">
                  {/* YouTube URL */}
                  <div>
                    <label className="block text-xs font-semibold text-[#77736A] uppercase tracking-wider mb-1.5">
                      YouTube Video URL <span className="text-[#f87171]">*</span>
                    </label>
                    <input
                      type="text"
                      value={youtubeUrl}
                      onChange={(e) => handleUrlChange(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=... or https://youtube.com/shorts/..."
                      className="w-full bg-[#0f1a17] border border-[#1e3530] focus:border-[#B78A3B] text-[#FAF7F0] placeholder-[#3a4a47] rounded-xl px-4 py-2.5 text-sm outline-none transition-colors font-mono"
                    />
                    <p className="text-[11px] text-[#77736A] mt-1">
                      Supports standard YouTube videos, YouTube Shorts, and youtu.be links.
                    </p>
                  </div>

                  {/* Video Type: Full Video or Shorts */}
                  <div>
                    <label className="block text-xs font-semibold text-[#77736A] uppercase tracking-wider mb-2">
                      Video Format / Aspect Ratio <span className="text-[#f87171]">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setVideoType('full')}
                        className={clsx(
                          'flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer',
                          videoType === 'full'
                            ? 'bg-[#173F35] border-[#D8B86A] text-[#FAF7F0] shadow-md'
                            : 'bg-[#0f1a17] border-[#1e3530] text-[#77736A] hover:border-[#B78A3B]/50 hover:text-[#FAF7F0]'
                        )}
                      >
                        <Film size={20} className={videoType === 'full' ? 'text-[#D8B86A]' : 'text-[#77736A]'} />
                        <div>
                          <p className="text-xs font-semibold">Full Video</p>
                          <p className="text-[10px] opacity-75">Landscape (16:9)</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setVideoType('shorts')}
                        className={clsx(
                          'flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer',
                          videoType === 'shorts'
                            ? 'bg-rose-950/80 border-rose-500 text-[#FAF7F0] shadow-md'
                            : 'bg-[#0f1a17] border-[#1e3530] text-[#77736A] hover:border-rose-500/50 hover:text-[#FAF7F0]'
                        )}
                      >
                        <Smartphone size={20} className={videoType === 'shorts' ? 'text-rose-400' : 'text-[#77736A]'} />
                        <div>
                          <p className="text-xs font-semibold">Shorts</p>
                          <p className="text-[10px] opacity-75">Portrait (9:16)</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-semibold text-[#77736A] uppercase tracking-wider">
                        Video Title <span className="text-[#f87171]">*</span>
                      </label>
                      <span
                        className={clsx(
                          'text-[11px] font-mono',
                          title.length > MAX_TITLE_CHARS ? 'text-[#f87171] font-bold' : 'text-[#77736A]'
                        )}
                      >
                        {title.length}/{MAX_TITLE_CHARS}
                      </span>
                    </div>
                    <input
                      type="text"
                      maxLength={MAX_TITLE_CHARS}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Sri Poondi Mahan Divine History & Riverbank Tapas"
                      className="w-full bg-[#0f1a17] border border-[#1e3530] focus:border-[#B78A3B] text-[#FAF7F0] placeholder-[#3a4a47] rounded-xl px-4 py-2.5 text-sm outline-none transition-colors"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-semibold text-[#77736A] uppercase tracking-wider">
                        Description
                      </label>
                      <span
                        className={clsx(
                          'text-[11px] font-mono',
                          description.length > MAX_DESC_CHARS ? 'text-[#f87171] font-bold' : 'text-[#77736A]'
                        )}
                      >
                        {description.length}/{MAX_DESC_CHARS}
                      </span>
                    </div>
                    <textarea
                      rows={2}
                      maxLength={MAX_DESC_CHARS}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Brief details about the video, darshan, or devotional event..."
                      className="w-full bg-[#0f1a17] border border-[#1e3530] focus:border-[#B78A3B] text-[#FAF7F0] placeholder-[#3a4a47] rounded-xl px-4 py-2 text-sm outline-none transition-colors resize-none"
                    />
                  </div>
                </div>

                {/* Right Col: Live Thumbnail Preview */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-[#77736A] uppercase tracking-wider">
                    Cover Preview
                  </label>
                  <div className="border border-[#1e3530] rounded-2xl p-4 bg-[#0f1a17] flex flex-col items-center justify-center min-h-[220px]">
                    {detectedThumbnail ? (
                      <div className="w-full flex flex-col items-center">
                        <div
                          className={clsx(
                            'relative w-full rounded-xl overflow-hidden border border-[#2a5a4a] shadow-md bg-black',
                            videoType === 'shorts' ? 'aspect-[9/16] max-w-[160px]' : 'aspect-video'
                          )}
                        >
                          <img
                            src={detectedThumbnail}
                            alt="Cover Preview"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <Play size={20} className="text-white fill-white" />
                          </div>
                        </div>
                        <span className="text-[11px] text-[#4ade80] mt-2 flex items-center gap-1 font-medium">
                          <Check size={13} /> Thumbnail Detected
                        </span>
                      </div>
                    ) : (
                      <div className="text-center p-4 text-[#77736A]">
                        <Video size={28} className="mx-auto mb-2 opacity-30" />
                        <p className="text-xs">Paste a valid YouTube link above to see the cover thumbnail.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-[#173F35] hover:bg-[#1f5246] text-[#FAF7F0] text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
                >
                  <Plus size={16} className="text-[#D8B86A]" />
                  <span>{isSubmitting ? 'Adding Video...' : 'Add Video to Gallery'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Active Videos List / Grid */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#1e3530]">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-serif font-semibold text-[#FAF7F0]">
                  Uploaded Videos
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-[#173F35] text-[#D8B86A]">
                  {allVideos.length}
                </span>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5">
                {[
                  { key: 'all', label: 'All', count: allVideos.length },
                  { key: 'full', label: 'Full Videos', count: allVideos.filter((v) => v.type === 'full').length },
                  { key: 'shorts', label: 'Shorts', count: allVideos.filter((v) => v.type === 'shorts').length },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={clsx(
                      'px-3 py-1 rounded-xl text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5',
                      activeTab === tab.key
                        ? 'bg-[#173F35] text-[#D8B86A]'
                        : 'text-[#77736A] hover:bg-[#1a2e28] hover:text-[#FAF7F0]'
                    )}
                  >
                    <span>{tab.label}</span>
                    <span className="text-[10px] font-mono opacity-80 font-bold">({tab.count})</span>
                  </button>
                ))}
              </div>
            </div>

            {filteredVideos.length === 0 ? (
              <div className="text-center py-16 bg-[#0a1210] border border-[#1e3530] rounded-2xl">
                <Clapperboard size={36} className="mx-auto text-[#77736A] mb-3 opacity-40" />
                <p className="text-[#FAF7F0] text-sm font-medium">No videos found</p>
                <p className="text-[#77736A] text-xs mt-1">Use the form above to add your first YouTube video.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 items-stretch">
                {filteredVideos.map((vid) => {
                  const isShorts = vid.type === 'shorts';
                  return (
                    <div
                      key={vid.id}
                      className="bg-[#0a1210] border border-[#1e3530] rounded-2xl overflow-hidden flex flex-col justify-between h-full hover:border-[#B78A3B]/60 transition-all shadow-md group"
                    >
                      <div>
                        {/* Thumbnail */}
                        <div
                          className={clsx(
                            'relative w-full bg-black overflow-hidden cursor-pointer',
                            isShorts ? 'aspect-[9/16] max-h-64' : 'aspect-video'
                          )}
                          onClick={() => setActiveModalVideo(vid)}
                          title="Click to play video"
                        >
                          <img
                            src={vid.thumbnailUrl || (vid.videoId ? `https://img.youtube.com/vi/${vid.videoId}/hqdefault.jpg` : '')}
                            alt={vid.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />

                          {/* Hover Play Icon Overlay */}
                          <div className="absolute inset-0 bg-black/25 group-hover:bg-black/45 flex items-center justify-center transition-colors">
                            <div className="w-11 h-11 rounded-full bg-[#173F35]/90 group-hover:bg-[#B78A3B] text-white flex items-center justify-center transition-all shadow-xl group-hover:scale-110">
                              <Play size={20} className="ml-0.5 fill-white" />
                            </div>
                          </div>

                          {/* Badge */}
                          <div className="absolute top-2.5 left-2.5 z-10">
                            <span
                              className={clsx(
                                'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full backdrop-blur-xs shadow-sm',
                                isShorts
                                  ? 'bg-rose-950/90 text-rose-300 border border-rose-800'
                                  : 'bg-[#173F35]/90 text-[#D8B86A] border border-[#2a5a4a]'
                              )}
                            >
                              {isShorts ? 'Shorts' : 'Full Video'}
                            </span>
                          </div>

                          {/* YouTube link button */}
                          {vid.youtubeUrl && (
                            <a
                              href={vid.youtubeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-black/60 text-white hover:text-[#D8B86A] backdrop-blur-xs transition-colors z-10"
                              title="Watch on YouTube"
                            >
                              <ExternalLink size={13} />
                            </a>
                          )}
                        </div>

                        {/* Details */}
                        <div className="p-4 space-y-1">
                          <h3
                            className="text-sm font-serif font-semibold text-[#FAF7F0] line-clamp-2 leading-snug cursor-pointer group-hover:text-[#D8B86A] transition-colors"
                            onClick={() => setActiveModalVideo(vid)}
                          >
                            {vid.title}
                          </h3>
                          {vid.description && (
                            <p className="text-xs text-[#77736A] line-clamp-2 leading-relaxed">
                              {vid.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action Bar: Watch, Edit & Delete */}
                      <div className="p-4 pt-2 border-t border-[#1e3530] flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveModalVideo(vid)}
                          className="py-1.5 px-3 rounded-xl bg-[#173F35] hover:bg-[#1f5246] text-[#FAF7F0] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                          title="Play Video"
                        >
                          <Play size={12} className="text-[#D8B86A] fill-[#D8B86A]" />
                          <span>Watch</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditModal(vid)}
                          className="flex-1 py-1.5 px-3 rounded-xl bg-[#1a2e28] hover:bg-[#25423a] text-[#FAF7F0] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Edit2 size={13} className="text-[#D8B86A]" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeletingId(vid.id)}
                          className="p-2 rounded-xl bg-[#2a1a1a] hover:bg-rose-950 text-rose-400 hover:text-rose-200 border border-[#5a2a2a] transition-colors cursor-pointer"
                          title="Move to Recently Deleted"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* EDIT MODAL */}
      {editingVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setEditingVideo(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-lg bg-[#0a1210] border border-[#2a5a4a] rounded-2xl sm:rounded-3xl p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#1e3530]">
              <h3 className="text-base font-serif font-bold text-[#FAF7F0] flex items-center gap-2">
                <Edit2 size={16} className="text-[#D8B86A]" />
                <span>Edit Video</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingVideo(null)}
                className="p-1.5 text-[#77736A] hover:text-[#FAF7F0] rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-[#2a1a1a] border border-[#5a2a2a] text-[#f87171] text-xs flex items-center gap-2">
                <AlertCircle size={14} />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#77736A] uppercase tracking-wider mb-1.5">
                  YouTube URL
                </label>
                <input
                  type="text"
                  value={editUrl}
                  onChange={(e) => handleEditUrlChange(e.target.value)}
                  className="w-full bg-[#0f1a17] border border-[#1e3530] focus:border-[#B78A3B] text-[#FAF7F0] rounded-xl px-4 py-2.5 text-sm outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#77736A] uppercase tracking-wider mb-1.5">
                  Format
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEditType('full')}
                    className={clsx(
                      'p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer',
                      editType === 'full'
                        ? 'bg-[#173F35] border-[#D8B86A] text-[#FAF7F0]'
                        : 'bg-[#0f1a17] border-[#1e3530] text-[#77736A]'
                    )}
                  >
                    Full Video (16:9)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditType('shorts')}
                    className={clsx(
                      'p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer',
                      editType === 'shorts'
                        ? 'bg-rose-950/80 border-rose-500 text-[#FAF7F0]'
                        : 'bg-[#0f1a17] border-[#1e3530] text-[#77736A]'
                    )}
                  >
                    Shorts (9:16)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#77736A] uppercase tracking-wider mb-1.5">
                  Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-[#0f1a17] border border-[#1e3530] focus:border-[#B78A3B] text-[#FAF7F0] rounded-xl px-4 py-2.5 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#77736A] uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full bg-[#0f1a17] border border-[#1e3530] focus:border-[#B78A3B] text-[#FAF7F0] rounded-xl px-4 py-2 text-sm outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1e3530]">
                <button
                  type="button"
                  onClick={() => setEditingVideo(null)}
                  className="px-4 py-2 rounded-xl text-xs text-[#77736A] hover:text-[#FAF7F0] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#173F35] hover:bg-[#1f5246] text-[#FAF7F0] text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isEditSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MOVE TO TRASH MODAL */}
      {deletingId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setDeletingId(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-sm bg-[#0a1210] border border-[#5a2a2a] rounded-2xl p-6 shadow-2xl text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-[#2a1a1a] text-[#f87171] border border-[#5a2a2a] flex items-center justify-center mx-auto">
              <Trash2 size={22} />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-[#FAF7F0]">Move to Recently Deleted?</h3>
              <p className="text-xs text-[#77736A] mt-1.5 leading-relaxed">
                This video will be safely moved to Recently Deleted (Recycle Bin). You can restore it anytime within 10 days.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="flex-1 py-2 px-3 rounded-xl border border-[#1e3530] text-xs text-[#77736A] hover:text-[#FAF7F0] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleMoveToTrash}
                className="flex-1 py-2 px-3 rounded-xl bg-[#2a1a1a] hover:bg-rose-950 text-rose-300 border border-[#5a2a2a] text-xs font-semibold transition-colors cursor-pointer"
              >
                Move to Trash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PERMANENT DELETE MODAL */}
      {deletingForeverId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setDeletingForeverId(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-sm bg-[#0a1210] border border-rose-900 rounded-2xl p-6 shadow-2xl text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-rose-950 text-rose-400 border border-rose-800 flex items-center justify-center mx-auto">
              <Trash2 size={22} />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-rose-300">Delete Forever?</h3>
              <p className="text-xs text-[#77736A] mt-1.5 leading-relaxed">
                This action cannot be undone. This video will be permanently deleted immediately.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingForeverId(null)}
                className="flex-1 py-2 px-3 rounded-xl border border-[#1e3530] text-xs text-[#77736A] hover:text-[#FAF7F0] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePermanentDelete}
                className="flex-1 py-2 px-3 rounded-xl bg-rose-900 hover:bg-rose-800 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM EMPTY TRASH MODAL */}
      {confirmEmptyTrash && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setConfirmEmptyTrash(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-sm bg-[#0a1210] border border-rose-900 rounded-2xl p-6 shadow-2xl text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-rose-950 text-rose-400 border border-rose-800 flex items-center justify-center mx-auto">
              <Trash2 size={22} />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-rose-300">Empty All Deleted Videos?</h3>
              <p className="text-xs text-[#77736A] mt-1.5 leading-relaxed">
                All {trashVideos.length} deleted videos will be permanently purged immediately.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmEmptyTrash(false)}
                className="flex-1 py-2 px-3 rounded-xl border border-[#1e3530] text-xs text-[#77736A] hover:text-[#FAF7F0] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEmptyTrash}
                className="flex-1 py-2 px-3 rounded-xl bg-rose-900 hover:bg-rose-800 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Empty Trash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Player Modal */}
      <VideoModal video={activeModalVideo} onClose={() => setActiveModalVideo(null)} />
    </div>
  );
}
