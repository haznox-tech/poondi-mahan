import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  Edit2,
  Check,
  X,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  Clock,
  AlertTriangle,
  ExternalLink,
  KeyRound,
  Eye,
  EyeOff,
  Loader2,
  Video,
  Film,
  Cloud,
  CloudUpload,
  CloudOff,
  Play,
} from 'lucide-react';
import VideoModal from '../../components/VideoModal.jsx';
import { galleryFilters } from '../../data/gallery.js';
import {
  getAllGalleryItems,
  addGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
  normalizeCategory,
  uploadGalleryFile,
  deleteGalleryFile,
  isUploadedPath,
  getRecentlyDeletedItems,
  restoreGalleryItem,
  permanentlyDeleteTrashItem,
  emptyTrash,
  getRecentlyDeletedVideos,
  restoreVideo,
  permanentlyDeleteVideoTrash,
  emptyVideoTrash,
  getDaysRemaining,
  syncFromCodebase,
  flushToCodebase,
} from '../../admin/adminStore.js';
import {
  getGitHubToken,
  setGitHubToken,
  hasGitHubToken,
  testGitHubConnection,
  uploadPhotoAndCommitToGitHub,
  syncGalleryDataJsonToGitHub,
  permanentlyDeletePhotoDirectFromGitHub,
  commitImageToGitHub,
  deleteFileFromGitHub,
  GITHUB_REPO_OWNER,
  GITHUB_REPO_NAME,
} from '../../admin/githubSync.js';
import {
  getCloudinaryConfig,
  setCloudinaryConfig,
  hasCloudinaryConfig,
  testCloudinaryConnection,
  uploadImageToCloudinary,
  deleteImageFromCloudinary,
  extractCloudinaryPublicId,
  getCloudinaryThumbUrl,
  uploadPhotoAndSyncCloudinary,
} from '../../admin/cloudinarySync.js';
import clsx from 'clsx';

const CATEGORIES = [
  { key: 'swami', label: 'Sri Poondi Mahan' },
  { key: 'ashram', label: 'Ashramam & Sanctum' },
  { key: 'darshan', label: 'Devotee Darshan' },
  { key: 'events', label: 'Festivals & Puja' },
];

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_CHARS = 200;

export default function AdminGallery() {
  const location = useLocation();
  const navigate = useNavigate();

  const isTrashRoute = location.pathname.includes('/admin/trash');
  const [allItems, setAllItems] = useState(() =>
    typeof window !== 'undefined' ? getAllGalleryItems() : []
  );
  const [trashItems, setTrashItems] = useState(() =>
    typeof window !== 'undefined' ? getRecentlyDeletedItems() : []
  );
  const [trashVideos, setTrashVideos] = useState(() =>
    typeof window !== 'undefined' ? getRecentlyDeletedVideos() : []
  );
  const [trashTab, setTrashTab] = useState('photos'); // 'photos' | 'videos'
  const [viewMode, setViewMode] = useState(() => (isTrashRoute ? 'trash' : 'gallery'));
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (location.pathname.includes('/admin/trash')) {
      setViewMode('trash');
      const curPhotos = getRecentlyDeletedItems();
      const curVideos = getRecentlyDeletedVideos();
      if (curPhotos.length === 0 && curVideos.length > 0) {
        setTrashTab('videos');
      }
    } else {
      setViewMode('gallery');
    }
  }, [location.pathname]);

  const handleSwitchView = (mode) => {
    setViewMode(mode);
    navigate(mode === 'trash' ? '/admin/trash' : '/admin/gallery');
  };

  // Form State
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('ashram');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Modal State
  const [editingItem, setEditingItem] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('swami');
  const [editFile, setEditFile] = useState(null);
  const [editFilePreview, setEditFilePreview] = useState(null);
  const [editError, setEditError] = useState('');
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  // Modals for Deletion
  const [deletingId, setDeletingId] = useState(null); // Move to trash
  const [deletingForeverId, setDeletingForeverId] = useState(null); // Permanent delete photo from trash
  const [confirmEmptyTrash, setConfirmEmptyTrash] = useState(false); // Empty all photo trash
  const [deletingForeverVideoId, setDeletingForeverVideoId] = useState(null); // Permanent delete video from trash
  const [confirmEmptyVideoTrash, setConfirmEmptyVideoTrash] = useState(false); // Empty all video trash
  const [previewTrashVideo, setPreviewTrashVideo] = useState(null); // Video player modal for deleted videos

  // GitHub Integration State
  const [githubConnected, setGithubConnected] = useState(() => hasGitHubToken());
  const [showGitHubModal, setShowGitHubModal] = useState(false);
  const [githubTokenInput, setGithubTokenInput] = useState(() => getGitHubToken());
  const [showTokenText, setShowTokenText] = useState(false);
  const [tokenTesting, setTokenTesting] = useState(false);
  const [tokenError, setTokenError] = useState('');
  const [tokenSuccess, setTokenSuccess] = useState('');
  const [uploadProgress, setUploadProgress] = useState('');

  const handleSaveGitHubToken = async (e) => {
    e?.preventDefault?.();
    const clean = githubTokenInput.trim();
    if (!clean) {
      setTokenError('Please enter a GitHub Personal Access Token.');
      return;
    }

    setTokenTesting(true);
    setTokenError('');
    setTokenSuccess('');

    try {
      await testGitHubConnection(clean);
      setGitHubToken(clean);
      setGithubConnected(true);
      setTokenSuccess('Connected to GitHub repository divagar199/poondi-mahan successfully!');
      setTimeout(() => {
        setShowGitHubModal(false);
        setTokenSuccess('');
      }, 1500);
    } catch (err) {
      setTokenError(err.message || 'Failed to connect with this GitHub token.');
    } finally {
      setTokenTesting(false);
    }
  };

  const handleDisconnectGitHub = () => {
    setGitHubToken('');
    setGithubTokenInput('');
    setGithubConnected(false);
    setTokenSuccess('');
    setTokenError('GitHub repository disconnected.');
    setTimeout(() => {
      setShowGitHubModal(false);
      setTokenError('');
    }, 1200);
  };

  // Cloudinary Media Integration State
  const [cloudinaryConnected, setCloudinaryConnected] = useState(() => hasCloudinaryConfig());
  const [showCloudinaryModal, setShowCloudinaryModal] = useState(false);
  const [cldCloudName, setCldCloudName] = useState(() => getCloudinaryConfig().cloudName);
  const [cldUploadPreset, setCldUploadPreset] = useState(() => getCloudinaryConfig().uploadPreset);
  const [cldTesting, setCldTesting] = useState(false);
  const [cldError, setCldError] = useState('');
  const [cldSuccess, setCldSuccess] = useState('');

  const handleSaveCloudinary = async (e) => {
    e?.preventDefault?.();
    const cn = cldCloudName.trim();
    const up = cldUploadPreset.trim();

    if (!cn) {
      setCldError('Please enter your Cloudinary Cloud Name.');
      return;
    }
    if (!up) {
      setCldError('Please enter your Cloudinary Unsigned Upload Preset.');
      return;
    }

    setCldTesting(true);
    setCldError('');
    setCldSuccess('');

    try {
      await testCloudinaryConnection(cn, up);
      setCloudinaryConfig({ cloudName: cn, uploadPreset: up });
      setCloudinaryConnected(true);
      setCldSuccess('Connected to Cloudinary successfully! Test upload verified.');
      setTimeout(() => {
        setShowCloudinaryModal(false);
        setCldSuccess('');
      }, 1500);
    } catch (err) {
      setCldError(err.message || 'Failed to connect to Cloudinary.');
    } finally {
      setCldTesting(false);
    }
  };

  const handleDisconnectCloudinary = () => {
    setCloudinaryConfig({ cloudName: '', uploadPreset: '' });
    setCldCloudName('');
    setCldUploadPreset('');
    setCloudinaryConnected(false);
    setCldSuccess('');
    setCldError('Cloudinary disconnected.');
    setTimeout(() => {
      setShowCloudinaryModal(false);
      setCldError('');
    }, 1200);
  };

  const refreshItems = () => {
    setAllItems(getAllGalleryItems());
    setTrashItems(getRecentlyDeletedItems());
    setTrashVideos(getRecentlyDeletedVideos());
  };

  useEffect(() => {
    let isMounted = true;
    const onUpdate = () => {
      if (isMounted) refreshItems();
    };
    refreshItems();

    // Pull authoritative data from server codebase on mount
    syncFromCodebase().then(() => {
      if (isMounted) refreshItems();
    });

    window.addEventListener('pm_gallery_updated', onUpdate);
    window.addEventListener('pm_trash_updated', onUpdate);
    window.addEventListener('pm_videos_updated', onUpdate);
    window.addEventListener('pm_video_trash_updated', onUpdate);
    window.addEventListener('storage', onUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('pm_gallery_updated', onUpdate);
      window.removeEventListener('pm_trash_updated', onUpdate);
      window.removeEventListener('pm_videos_updated', onUpdate);
      window.removeEventListener('pm_video_trash_updated', onUpdate);
      window.removeEventListener('storage', onUpdate);
    };
  }, []);

  // When clicking a tab, also auto-sync the category dropdown in the upload card
  const handleTabClick = (tabKey) => {
    setActiveTab(tabKey);
    if (tabKey !== 'all') {
      setCategory(tabKey);
    }
  };

  // Handle File Select — store the raw File and create a local object URL for preview
  const handleFileChange = (e) => {
    setFormError('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFormError('Only image files (JPG, PNG, WebP, GIF) are allowed. Videos or other files are strictly prohibited.');
      setSelectedFile(null);
      setFilePreview(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setFormError(`Image file size (${sizeMB} MB) exceeds the 5 MB limit. Please select a smaller photo.`);
      setSelectedFile(null);
      setFilePreview(null);
      return;
    }

    // Revoke previous object URL to avoid memory leaks
    if (filePreview && filePreview.startsWith('blob:')) {
      URL.revokeObjectURL(filePreview);
    }

    setSelectedFile(file);
    // Create a local blob URL just for the preview thumbnail
    setFilePreview(URL.createObjectURL(file));
  };

  // Handle Edit File Select — replacement photo in edit modal
  const handleEditFileChange = (e) => {
    setEditError('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setEditError('Only image files (JPG, PNG, WebP, GIF) are allowed.');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setEditError(`Image file size (${sizeMB} MB) exceeds the 5 MB limit.`);
      return;
    }

    if (editFilePreview && editFilePreview.startsWith('blob:')) {
      URL.revokeObjectURL(editFilePreview);
    }

    setEditFile(file);
    setEditFilePreview(URL.createObjectURL(file));
  };

  // Submit New Photo — upload file to disk via dev API, store real URL path in localStorage
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!selectedFile) {
      setFormError('Please select an image file to upload.');
      return;
    }

    const trimmedTitle = title.trim();
    const trimmedDesc = description.trim();

    if (!trimmedTitle) {
      setFormError('Please enter a heading/title for the image.');
      return;
    }

    if (!trimmedDesc) {
      setFormError('Please enter image hover text/description.');
      return;
    }

    if (trimmedTitle.length > MAX_CHARS) {
      setFormError(`Title exceeds 200 characters limit (${trimmedTitle.length}/${MAX_CHARS}).`);
      return;
    }

    if (trimmedDesc.length > MAX_CHARS) {
      setFormError(`Hover text/description exceeds 200 characters limit (${trimmedDesc.length}/${MAX_CHARS}).`);
      return;
    }

    setIsSubmitting(true);
    setUploadProgress('');

    try {
      const chosenCategory = normalizeCategory(category);

      if (hasCloudinaryConfig()) {
        // Priority 1: Direct Cloudinary Global CDN upload
        await uploadPhotoAndSyncCloudinary(
          selectedFile,
          {
            title: trimmedTitle,
            alt: trimmedDesc,
            category: chosenCategory,
          },
          (progressMsg) => setUploadProgress(progressMsg)
        );

        setFormSuccess('Photo uploaded directly to Cloudinary CDN! Fast delivery, auto-webp & CDN caching active.');
      } else if (hasGitHubToken()) {
        // Priority 2: Direct commit to GitHub repository (public/images/gallery/uploaded/) & Vercel auto-deploy
        await uploadPhotoAndCommitToGitHub(
          selectedFile,
          {
            title: trimmedTitle,
            alt: trimmedDesc,
            category: chosenCategory,
          },
          (progressMsg) => setUploadProgress(progressMsg)
        );

        setFormSuccess('Photo committed directly to your GitHub image folder! Vercel is now deploying changes across all browsers.');
      } else {
        // Pure Front-End Local Storage fallback
        const { path: uploadedPath, thumb: thumbPath, width, height } = await uploadGalleryFile(selectedFile);

        addGalleryItem({
          src: uploadedPath,
          thumb: thumbPath || uploadedPath,
          title: trimmedTitle,
          alt: trimmedDesc,
          category: chosenCategory,
          width: width || 800,
          height: height || 600,
          createdAt: new Date().toISOString(),
        });

        await flushToCodebase();

        setFormSuccess('Photo saved in this browser! Connect Cloudinary or GitHub to store images permanently in the cloud.');
      }

      // Revoke the object URL used for preview
      if (filePreview && filePreview.startsWith('blob:')) {
        URL.revokeObjectURL(filePreview);
      }

      // Reset form
      setSelectedFile(null);
      setFilePreview(null);
      setTitle('');
      setDescription('');
      setUploadProgress('');
      refreshItems();

      setTimeout(() => {
        setFormSuccess('');
      }, 5000);
    } catch (err) {
      console.error(err);
      setFormError(err.message || 'Failed to upload image. Please try again.');
    } finally {
      setIsSubmitting(false);
      setUploadProgress('');
    }
  };

  // Start Editing
  const handleStartEdit = (item) => {
    setEditingItem(item);
    setEditTitle(item.title || '');
    setEditDescription(item.alt || '');
    setEditCategory(normalizeCategory(item.category) || 'swami');
    setEditFile(null);
    setEditFilePreview(item.src || null);
    setEditError('');
    setIsEditSubmitting(false);
  };

  // Save Edit (complete update including photo file replacement)
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingItem || isEditSubmitting) return;

    const trimmedTitle = editTitle.trim();
    const trimmedDesc = editDescription.trim();

    if (!trimmedTitle) {
      setEditError('Title cannot be empty.');
      return;
    }
    if (!trimmedDesc) {
      setEditError('Description cannot be empty.');
      return;
    }
    if (trimmedTitle.length > MAX_CHARS) {
      setEditError(`Title exceeds 200 characters (${trimmedTitle.length}/${MAX_CHARS}).`);
      return;
    }
    if (trimmedDesc.length > MAX_CHARS) {
      setEditError(`Description exceeds 200 characters (${trimmedDesc.length}/${MAX_CHARS}).`);
      return;
    }

    setIsEditSubmitting(true);
    setEditError('');

    try {
      let finalSrc = editingItem.src;
      let finalThumb = editingItem.thumb || editingItem.src;
      let finalCldId = editingItem.cloudinaryPublicId || null;

      // If user uploaded a new replacement photo:
      if (editFile) {
        if (hasCloudinaryConfig()) {
          const cldRes = await uploadImageToCloudinary(editFile);
          finalSrc = cldRes.secure_url;
          finalThumb = getCloudinaryThumbUrl(finalSrc, 600, 450);
          finalCldId = cldRes.public_id;

          // Clean up old Cloudinary asset if previously hosted there
          if (editingItem.cloudinaryPublicId) {
            deleteImageFromCloudinary(editingItem.cloudinaryPublicId).catch(() => {});
          }
        } else if (hasGitHubToken()) {
          const committed = await commitImageToGitHub(editFile);
          finalSrc = committed.path;
          finalThumb = committed.thumb;

          // If previous image was an uploaded file on GitHub, clean up old file
          if (editingItem.src && editingItem.src.startsWith('/images/gallery/uploaded/')) {
            const oldRelativePath = 'public' + editingItem.src;
            deleteFileFromGitHub(oldRelativePath, `chore(gallery): replace old image ${editingItem.src}`, getGitHubToken()).catch(() => {});
          }
        } else {
          const { path: uploadedPath, thumb: thumbPath } = await uploadGalleryFile(editFile);
          finalSrc = uploadedPath;
          finalThumb = thumbPath || uploadedPath;

          // If previous image was an uploaded file on disk, delete the old file
          if (isUploadedPath(editingItem.src) && editingItem.src !== uploadedPath) {
            deleteGalleryFile(editingItem.src).catch(() => {});
          }
        }
      }

      updateGalleryItem(editingItem.id, {
        title: trimmedTitle,
        alt: trimmedDesc,
        category: normalizeCategory(editCategory),
        src: finalSrc,
        thumb: finalThumb,
        cloudinaryPublicId: finalCldId,
      });

      // Ensure persistence to server codebase is complete
      await flushToCodebase();
      if (hasGitHubToken()) {
        await syncGalleryDataJsonToGitHub().catch((err) => {
          console.warn('[AdminGallery] GitHub sync warning:', err);
        });
      }

      if (editFilePreview && editFilePreview.startsWith('blob:')) {
        URL.revokeObjectURL(editFilePreview);
      }

      setEditingItem(null);
      setEditFile(null);
      setEditFilePreview(null);
      refreshItems();
      setFormSuccess('Photo details updated successfully!');
      setTimeout(() => setFormSuccess(''), 4000);
    } catch (err) {
      console.error(err);
      setEditError('Failed to save changes: ' + (err.message || ''));
    } finally {
      setIsEditSubmitting(false);
    }
  };

  // Delete Action (Move to Recently Deleted for 10-day safety)
  const handleConfirmDelete = async () => {
    if (deletingId) {
      deleteGalleryItem(deletingId);
      await flushToCodebase();
      if (hasGitHubToken()) {
        syncGalleryDataJsonToGitHub().catch(() => {});
      }
      setDeletingId(null);
      refreshItems();
      setFormSuccess('Photo moved to Recently Deleted (held for 10 days before permanent deletion).');
      setTimeout(() => setFormSuccess(''), 5000);
    }
  };

  // Restore Action from Recently Deleted
  const handleRestore = async (id) => {
    const restored = restoreGalleryItem(id);
    if (restored) {
      await flushToCodebase();
      if (hasGitHubToken()) {
        syncGalleryDataJsonToGitHub().catch(() => {});
      }
      refreshItems();
      setFormSuccess(`"${restored.title || 'Photo'}" restored to live Gallery!`);
      setTimeout(() => setFormSuccess(''), 5000);
    }
  };

  // Permanently Delete Single Item from Trash
  const handleConfirmPermanentDelete = async () => {
    if (deletingForeverId) {
      const trash = getRecentlyDeletedItems();
      const target = trash.find((i) => String(i.id) === String(deletingForeverId));

      // Destroy Cloudinary asset if hosted on Cloudinary
      const cldPublicId = target?.cloudinaryPublicId || extractCloudinaryPublicId(target?.src);
      if (cldPublicId) {
        await deleteImageFromCloudinary(cldPublicId).catch((err) => {
          console.warn('[AdminGallery] Cloudinary delete error:', err);
        });
      }

      if (hasGitHubToken()) {
        await permanentlyDeletePhotoDirectFromGitHub(deletingForeverId, target).catch(() => {});
      }
      permanentlyDeleteTrashItem(deletingForeverId);
      await flushToCodebase();
      if (hasGitHubToken()) {
        syncGalleryDataJsonToGitHub().catch(() => {});
      }
      setDeletingForeverId(null);
      refreshItems();
      setFormSuccess('Photo permanently erased from Cloudinary and gallery.');
      setTimeout(() => setFormSuccess(''), 4000);
    }
  };

  // Empty All Items from Trash
  const handleConfirmEmptyTrash = async () => {
    const currentTrash = getRecentlyDeletedItems();
    for (const item of currentTrash) {
      const cldPublicId = item.cloudinaryPublicId || extractCloudinaryPublicId(item.src);
      if (cldPublicId) {
        await deleteImageFromCloudinary(cldPublicId).catch(() => {});
      }
      if (hasGitHubToken()) {
        await permanentlyDeletePhotoDirectFromGitHub(item.id, item).catch(() => {});
      }
    }
    emptyTrash();
    await flushToCodebase();
    if (hasGitHubToken()) {
      syncGalleryDataJsonToGitHub().catch(() => {});
    }
    setConfirmEmptyTrash(false);
    refreshItems();
    setFormSuccess('Recently Deleted has been emptied and all photos erased from Cloudinary.');
    setTimeout(() => setFormSuccess(''), 4000);
  };

  // Video Trash Handlers
  const handleRestoreVideo = async (id) => {
    const restored = restoreVideo(id);
    if (restored) {
      await flushToCodebase();
      if (hasGitHubToken()) {
        syncGalleryDataJsonToGitHub().catch(() => {});
      }
      refreshItems();
      setFormSuccess(`"${restored.title || 'Video'}" restored to live Videos!`);
      setTimeout(() => setFormSuccess(''), 5000);
    }
  };

  const handleConfirmPermanentDeleteVideo = async () => {
    if (deletingForeverVideoId) {
      permanentlyDeleteVideoTrash(deletingForeverVideoId);
      await flushToCodebase();
      if (hasGitHubToken()) {
        syncGalleryDataJsonToGitHub().catch(() => {});
      }
      setDeletingForeverVideoId(null);
      refreshItems();
      setFormSuccess('Video permanently erased.');
      setTimeout(() => setFormSuccess(''), 4000);
    }
  };

  const handleConfirmEmptyVideoTrash = async () => {
    emptyVideoTrash();
    await flushToCodebase();
    if (hasGitHubToken()) {
      syncGalleryDataJsonToGitHub().catch(() => {});
    }
    setConfirmEmptyVideoTrash(false);
    refreshItems();
    setFormSuccess('Recently Deleted Videos have been emptied.');
    setTimeout(() => setFormSuccess(''), 4000);
  };

  // Filtered displayed items using normalized category check
  const filteredItems = activeTab === 'all'
    ? allItems
    : allItems.filter(
        (i) => normalizeCategory(i.category) === normalizeCategory(activeTab)
      );

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-10 pb-16">
      {/* Header */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold text-[#D8B86A]">
              Gallery Management
            </h1>
            <p className="text-[#77736A] text-xs sm:text-sm mt-1">
              All gallery photos can be edited or deleted. Deleted photos are safely stored in Recently Deleted for 10 days.
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => handleSwitchView('gallery')}
              className={clsx(
                'px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5',
                viewMode === 'gallery'
                  ? 'bg-[#173F35] text-[#FAF7F0] border-[#2a5a4a] shadow-sm'
                  : 'bg-[#0a1210] text-[#77736A] border-[#1e3530] hover:text-[#FAF7F0]'
              )}
            >
              <span>Gallery</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-[#0a1210] text-[#D8B86A]">
                {allItems.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchView('trash')}
              className={clsx(
                'px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5',
                viewMode === 'trash'
                  ? 'bg-[#2a1a1a] text-[#f87171] border-[#5a2a2a] shadow-sm'
                  : 'bg-[#0a1210] text-[#77736A] border-[#1e3530] hover:text-[#FAF7F0]'
              )}
            >
              <Trash2 size={12} className={viewMode === 'trash' ? 'text-[#f87171]' : 'text-[#77736A]'} />
              <span>Recently Deleted</span>
              {(trashItems.length + trashVideos.length) > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-[#3a1a1a] text-[#f87171] font-bold">
                  {trashItems.length + trashVideos.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

    {/* Recently Deleted View */}
    {viewMode === 'trash' && (
      <div className="space-y-6 sm:space-y-8">
        {/* Subtabs for Photos vs Videos */}
        <div className="flex items-center gap-2 border-b border-[#1e3530] pb-3">
          <button
            type="button"
            onClick={() => setTrashTab('photos')}
            className={clsx(
              'px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer',
              trashTab === 'photos'
                ? 'bg-[#173F35] text-[#FAF7F0] border border-[#2a5a4a] shadow-sm'
                : 'bg-[#0a1210] text-[#77736A] border border-[#1e3530] hover:text-[#FAF7F0]'
            )}
          >
            <ImageIcon size={15} />
            <span>Deleted Photos</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-[#0a1210] text-[#D8B86A]">
              {trashItems.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setTrashTab('videos')}
            className={clsx(
              'px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer',
              trashTab === 'videos'
                ? 'bg-[#173F35] text-[#FAF7F0] border border-[#2a5a4a] shadow-sm'
                : 'bg-[#0a1210] text-[#77736A] border border-[#1e3530] hover:text-[#FAF7F0]'
            )}
          >
            <Film size={15} />
            <span>Deleted Videos</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-[#0a1210] text-[#D8B86A]">
              {trashVideos.length}
            </span>
          </button>
        </div>

        {/* Info Banner */}
        <div className="bg-[#0f1a17] border border-[#2a5a4a] rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2a1a1a] border border-[#5a2a2a] text-[#f87171] flex items-center justify-center shrink-0">
              <Clock size={18} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-serif font-bold text-[#FAF7F0] flex items-center gap-2">
                <span>{trashTab === 'photos' ? 'Recently Deleted Photos' : 'Recently Deleted Videos'}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#2a1a1a] text-[#f87171] font-sans font-semibold border border-[#5a2a2a]">
                  10-Day Safe Retention
                </span>
              </h2>
              <p className="text-xs text-[#77736A] mt-1">
                {trashTab === 'photos'
                  ? 'Photos here are held for 10 days before automatic permanent deletion. You can restore any photo back to the live gallery anytime before expiration.'
                  : 'Videos here are held for 10 days before automatic permanent deletion. You can restore any video back to live videos anytime before expiration.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={() => handleSwitchView('gallery')}
              className="px-3.5 py-2 rounded-xl border border-[#1e3530] hover:border-[#2a5a4a] text-[#FAF7F0] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Back to Gallery</span>
            </button>
            {trashTab === 'photos' && trashItems.length > 0 && (
              <button
                type="button"
                onClick={() => setConfirmEmptyTrash(true)}
                className="px-3.5 py-2 rounded-xl bg-[#2a1a1a] hover:bg-[#3a1a1a] text-[#f87171] border border-[#5a2a2a] text-xs font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
              >
                <Trash2 size={13} />
                <span>Empty All ({trashItems.length})</span>
              </button>
            )}
            {trashTab === 'videos' && trashVideos.length > 0 && (
              <button
                type="button"
                onClick={() => setConfirmEmptyVideoTrash(true)}
                className="px-3.5 py-2 rounded-xl bg-[#2a1a1a] hover:bg-[#3a1a1a] text-[#f87171] border border-[#5a2a2a] text-xs font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
              >
                <Trash2 size={13} />
                <span>Empty All ({trashVideos.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Deleted Photos Tab Content */}
        {trashTab === 'photos' && (
          trashItems.length === 0 ? (
            <div className="text-center py-16 sm:py-24 bg-[#0a1210] border border-[#1e3530] rounded-2xl sm:rounded-3xl p-6">
              <div className="w-12 h-12 rounded-2xl bg-[#173F35]/30 flex items-center justify-center text-[#77736A] mx-auto mb-3">
                <Trash2 size={24} />
              </div>
              <p className="text-sm font-medium text-[#FAF7F0]">No recently deleted photos</p>
              <p className="text-xs text-[#77736A] mt-1 max-w-sm mx-auto">
                Any photos you delete from the gallery will be safely kept here for 10 days before permanent deletion.
              </p>
              <button
                type="button"
                onClick={() => handleSwitchView('gallery')}
                className="mt-4 px-4 py-2 rounded-xl bg-[#173F35] text-[#FAF7F0] hover:bg-[#1f5246] text-xs font-semibold transition-colors cursor-pointer"
              >
                Back to Gallery
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {trashItems.map((item) => {
                const daysLeft = getDaysRemaining(item.deletedAt);
                const deletedDateStr = item.deletedAt
                  ? new Date(item.deletedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : '';

                return (
                  <div
                    key={item.id}
                    className="bg-[#0a1210] border border-[#2a1a1a] hover:border-[#5a2a2a] rounded-2xl overflow-hidden flex flex-col transition-all duration-200 shadow-md group"
                  >
                    {/* Thumbnail with countdown badge */}
                    <div className="relative aspect-[4/3] bg-[#0f1a17] overflow-hidden">
                      <img
                        src={item.src}
                        alt={item.title || item.alt || 'Deleted photo'}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        loading="lazy"
                      />
                      <div className="absolute top-2 left-2 flex items-center gap-1.5">
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-[#2a1a1a]/95 text-[#f87171] border border-[#5a2a2a] backdrop-blur-xs flex items-center gap-1">
                          <Clock size={10} />
                          <span>{daysLeft === 0 ? 'Expires today' : `${daysLeft} days left`}</span>
                        </span>
                      </div>
                      <div className="absolute top-2 right-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-black/80 text-[#FAF7F0] border border-white/10 backdrop-blur-xs capitalize">
                          {item.category || 'swami'}
                        </span>
                      </div>
                    </div>

                    {/* Metadata & Actions */}
                    <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h4 className="text-xs sm:text-sm font-serif font-bold text-[#FAF7F0] line-clamp-1">
                          {item.title || 'Untitled Photo'}
                        </h4>
                        <p className="text-[11px] text-[#77736A] line-clamp-2 mt-0.5">
                          {item.alt || 'No description provided.'}
                        </p>
                        {deletedDateStr && (
                          <p className="text-[10px] text-[#55524a] mt-1.5 flex items-center gap-1">
                            <span>Deleted on {deletedDateStr}</span>
                          </p>
                        )}
                      </div>

                      {/* Restore & Permanent Delete buttons */}
                      <div className="flex items-center gap-2 pt-2 border-t border-[#1e3530]">
                        <button
                          type="button"
                          onClick={() => handleRestore(item.id)}
                          className="flex-1 py-1.5 px-3 rounded-lg bg-[#173F35] hover:bg-[#1f5246] text-[#FAF7F0] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                          title="Restore back to live gallery"
                        >
                          <RotateCcw size={12} className="text-[#D8B86A]" />
                          <span>Restore</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingForeverId(item.id)}
                          className="p-1.5 rounded-lg bg-[#2a1a1a] hover:bg-[#3a1a1a] text-[#f87171] border border-[#5a2a2a] transition-colors cursor-pointer"
                          title="Permanently delete forever"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* Deleted Videos Tab Content */}
        {trashTab === 'videos' && (
          trashVideos.length === 0 ? (
            <div className="text-center py-16 sm:py-24 bg-[#0a1210] border border-[#1e3530] rounded-2xl sm:rounded-3xl p-6">
              <div className="w-12 h-12 rounded-2xl bg-[#173F35]/30 flex items-center justify-center text-[#77736A] mx-auto mb-3">
                <Trash2 size={24} />
              </div>
              <p className="text-sm font-medium text-[#FAF7F0]">No recently deleted videos</p>
              <p className="text-xs text-[#77736A] mt-1 max-w-sm mx-auto">
                Any videos you delete will be safely kept here for 10 days before permanent deletion.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {trashVideos.map((video) => {
                const daysLeft = getDaysRemaining(video.deletedAt);
                const isShorts = video.type === 'shorts';
                return (
                  <div
                    key={video.id}
                    className="bg-[#0a1210] border border-[#2a1a1a] hover:border-[#5a2a2a] rounded-2xl overflow-hidden flex flex-col transition-all duration-200 shadow-md group"
                  >
                    <div
                      className={clsx('relative w-full bg-black overflow-hidden cursor-pointer', isShorts ? 'aspect-[9/16] max-h-56' : 'aspect-video')}
                      onClick={() => setPreviewTrashVideo(video)}
                      title="Click to preview video"
                    >
                      <img
                        src={video.thumbnailUrl || (video.videoId ? `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg` : '')}
                        alt={video.title}
                        className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity"
                        loading="lazy"
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
                      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 text-[10px] font-mono text-[#f87171] border border-[#5a2a2a] flex items-center gap-1 backdrop-blur-xs z-10">
                        <Clock size={10} />
                        <span>{daysLeft === 0 ? 'Expires today' : `${daysLeft} days left`}</span>
                      </div>
                    </div>

                    <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h4 className="text-xs sm:text-sm font-serif font-bold text-[#FAF7F0] line-clamp-1">
                          {video.title || 'Untitled Video'}
                        </h4>
                        <p className="text-[11px] text-[#77736A] line-clamp-2 mt-0.5">
                          {video.description || 'No description provided.'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-[#1e3530]">
                        <button
                          type="button"
                          onClick={() => handleRestoreVideo(video.id)}
                          className="flex-1 py-1.5 px-3 rounded-lg bg-[#173F35] hover:bg-[#1f5246] text-[#FAF7F0] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                          title="Restore back to live videos"
                        >
                          <RotateCcw size={12} className="text-[#D8B86A]" />
                          <span>Restore Video</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingForeverVideoId(video.id)}
                          className="p-1.5 rounded-lg bg-[#2a1a1a] hover:bg-[#3a1a1a] text-[#f87171] border border-[#5a2a2a] transition-colors cursor-pointer"
                          title="Permanently delete forever"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    )}

      {/* Active Gallery View */}
      {viewMode === 'gallery' && (
        <>
          {/* Upload Form Card */}
          <div className="bg-[#0a1210] border border-[#1e3530] rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-5 sm:mb-6 pb-3.5 sm:pb-4 border-b border-[#1e3530]">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#173F35] flex items-center justify-center text-[#D8B86A] shrink-0">
            <Upload size={18} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-serif font-semibold text-[#FAF7F0]">
              Upload New Photo
            </h2>
            <p className="text-[11px] sm:text-xs text-[#77736A]">
              Select an image file, choose category, title, and hover description.
            </p>
          </div>
        </div>



        {formError && (
          <div className="mb-5 sm:mb-6 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#2a1a1a] border border-[#5a2a2a] flex items-start gap-2.5 text-[#f87171] text-xs">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <div className="leading-relaxed">{formError}</div>
          </div>
        )}

        {formSuccess && (
          <div className="mb-5 sm:mb-6 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#173F35]/50 border border-[#2a5a4a] flex items-center gap-2.5 text-[#4ade80] text-xs">
            <CheckCircle2 size={15} className="shrink-0" />
            <div className="font-medium">{formSuccess}</div>
          </div>
        )}

        <form onSubmit={handleUploadSubmit} className="space-y-5 sm:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {/* Left: File Picker & Preview */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-[#77736A] uppercase tracking-wider">
                Photo File <span className="text-[#f87171]">*</span> (Images only, under 5 MB)
              </label>

              <div
                className={clsx(
                  'relative border-2 border-dashed rounded-2xl p-6 text-center transition-all flex flex-col items-center justify-center min-h-[200px] sm:min-h-[220px]',
                  filePreview
                    ? 'border-[#B78A3B]/60 bg-[#0f1a17]'
                    : 'border-[#1e3530] hover:border-[#B78A3B]/40 bg-[#0a1210]'
                )}
              >
                {filePreview ? (
                  <div className="relative w-full h-full flex flex-col items-center">
                    <img
                      src={filePreview}
                      alt="Preview"
                      className="max-h-40 sm:max-h-48 rounded-xl object-contain shadow-md mb-3"
                    />
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-[#4ade80] flex items-center gap-1 font-medium">
                        <Check size={14} /> Ready ({((selectedFile?.size || 0) / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          setFilePreview(null);
                        }}
                        className="text-xs text-[#f87171] hover:underline cursor-pointer"
                      >
                        Change Image
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#1a2e28] flex items-center justify-center text-[#D8B86A] mb-3">
                      <ImageIcon size={24} />
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-[#FAF7F0] mb-1">
                      Choose photo or drag and drop
                    </p>
                    <p className="text-[10px] sm:text-xs text-[#77736A] mb-4">
                      JPG, PNG, WEBP up to 5 MB (no videos)
                    </p>
                    <label className="inline-flex items-center gap-2 bg-[#173F35] hover:bg-[#1f5246] text-[#FAF7F0] text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer transition-colors shadow-sm">
                      <Upload size={14} className="text-[#D8B86A]" />
                      <span>Browse Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </>
                )}
              </div>
            </div>

            {/* Right: Metadata Inputs */}
            <div className="space-y-4">
              {/* Category Select */}
              <div>
                <label className="block text-xs font-semibold text-[#77736A] uppercase tracking-wider mb-2">
                  Select Category <span className="text-[#f87171]">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#0f1a17] border border-[#1e3530] focus:border-[#B78A3B] text-[#FAF7F0] rounded-xl px-4 py-3 text-sm outline-none transition-colors cursor-pointer"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.key} value={cat.key} className="bg-[#0a1210] text-[#FAF7F0]">
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title Heading */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold text-[#77736A] uppercase tracking-wider">
                    Text Heading / Title <span className="text-[#f87171]">*</span>
                  </label>
                  <span
                    className={clsx(
                      'text-[11px] font-mono',
                      title.length > MAX_CHARS ? 'text-[#f87171] font-bold' : 'text-[#77736A]'
                    )}
                  >
                    {title.length}/{MAX_CHARS}
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={MAX_CHARS}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Sacred Ashramam Sanctum Altar"
                  className="w-full bg-[#0f1a17] border border-[#1e3530] focus:border-[#B78A3B] text-[#FAF7F0] placeholder-[#3a4a47] rounded-xl px-4 py-2.5 text-sm outline-none transition-colors"
                />
              </div>

              {/* Description / Alt text */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold text-[#77736A] uppercase tracking-wider">
                    Image Text (Hover Description) <span className="text-[#f87171]">*</span>
                  </label>
                  <span
                    className={clsx(
                      'text-[11px] font-mono',
                      description.length > MAX_CHARS ? 'text-[#f87171] font-bold' : 'text-[#77736A]'
                    )}
                  >
                    {description.length}/{MAX_CHARS}
                  </span>
                </div>
                <textarea
                  maxLength={MAX_CHARS}
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Divine peaceful sanctum of Sri Poondi Mahan Ashramam in Kalasapakkam..."
                  className="w-full bg-[#0f1a17] border border-[#1e3530] focus:border-[#B78A3B] text-[#FAF7F0] placeholder-[#3a4a47] rounded-xl px-4 py-2.5 text-sm outline-none transition-colors resize-none"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedFile}
                  className="w-full bg-[#B78A3B] hover:bg-[#D8B86A] disabled:opacity-40 disabled:cursor-not-allowed text-[#0a1210] font-bold py-3 px-6 rounded-xl transition-all duration-200 text-xs sm:text-sm tracking-wide shadow-md shadow-[#B78A3B]/20 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>{uploadProgress || 'Saving Photo...'}</span>
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      <span>Upload & Add to Gallery</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Gallery Items List / Management */}
      <div className="space-y-5 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1e3530] pb-3.5 sm:pb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-serif font-semibold text-[#FAF7F0]">
              Existing Gallery Items
            </h2>
            <p className="text-[11px] sm:text-xs text-[#77736A] mt-0.5">
              Click edit to change heading, hover description, or category for any photo. Click trash to delete.
            </p>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {galleryFilters.map((f) => {
              const count = f.key === 'all'
                ? allItems.length
                : allItems.filter((i) => normalizeCategory(i.category) === normalizeCategory(f.key)).length;

              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => handleTabClick(f.key)}
                  className={clsx(
                    'text-[11px] sm:text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5',
                    activeTab === f.key
                      ? 'bg-[#173F35] border-[#173F35] text-[#D8B86A]'
                      : 'bg-[#0a1210] border-[#1e3530] text-[#77736A] hover:text-[#FAF7F0]'
                  )}
                >
                  <span>{f.label}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-[#0a1210] text-[#77736A]">
                    {count}
                  </span>
                </button>
              );
            })}
            {/* Quick button to jump to recently deleted */}
            <button
              type="button"
              onClick={() => handleSwitchView('trash')}
              className={clsx(
                'text-[11px] sm:text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ml-auto sm:ml-2',
                trashItems.length > 0
                  ? 'border-[#5a2a2a] bg-[#1a0f0f] text-[#f87171] hover:bg-[#2a1a1a]'
                  : 'border-[#1e3530] bg-[#0a1210] text-[#77736A] hover:text-[#FAF7F0]'
              )}
              title="View Recently Deleted Photos (Held for 10 days)"
            >
              <Trash2 size={11} />
              <span>Recently Deleted</span>
              {trashItems.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-[#2a1a1a] text-[#f87171] font-bold">
                  {trashItems.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Grid of Items */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 sm:py-16 bg-[#0a1210] border border-[#1e3530] rounded-2xl sm:rounded-3xl p-4">
            <ImageIcon size={32} className="text-[#77736A] mx-auto mb-2 opacity-40" />
            <p className="text-xs sm:text-sm font-medium text-[#FAF7F0]">No photos found in this category</p>
            <p className="text-[11px] text-[#77736A] mt-1">Upload a photo using the form above to add one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-[#0a1210] border border-[#1e3530] hover:border-[#2a5a4a] rounded-2xl overflow-hidden flex flex-col transition-all duration-200 shadow-md group"
              >
                {/* Photo Thumbnail */}
                <div className="relative aspect-[4/3] bg-[#0f1a17] overflow-hidden">
                  <img
                    src={item.src}
                    alt={item.alt}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  {/* Category Badge */}
                  <div className="absolute top-2.5 left-2.5">
                    <span className="bg-[#0a1210]/85 backdrop-blur-xs text-[#D8B86A] text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md border border-[#B78A3B]/30">
                      {CATEGORIES.find((c) => c.key === normalizeCategory(item.category))?.label || item.category}
                    </span>
                  </div>

                  {/* Uploaded Tag */}
                  {item.isAdmin && (
                    <div className="absolute top-2.5 right-2.5">
                      <span className="bg-[#173F35]/90 backdrop-blur-xs text-[#4ade80] text-[9px] sm:text-[10px] font-semibold px-2 py-0.5 rounded-md border border-[#2a5a4a]">
                        New Upload
                      </span>
                    </div>
                  )}
                </div>

                {/* Content Details */}
                <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-2.5">
                  <div>
                    <h3 className="text-xs sm:text-sm font-serif font-semibold text-[#D8B86A] leading-snug line-clamp-1 mb-1">
                      {item.title || 'Untitled Photo'}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-[#FAF7F0]/80 leading-relaxed line-clamp-2">
                      {item.alt}
                    </p>
                  </div>

                  {/* Action Buttons (Available for ALL Photos) */}
                  <div className="pt-2 border-t border-[#1e3530] flex items-center justify-between">
                    <span className="text-[10px] text-[#77736A]">
                      ID: {item.id}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(item)}
                        className="p-1.5 rounded-lg bg-[#1a2e28] hover:bg-[#173F35] text-[#D8B86A] transition-colors cursor-pointer"
                        title="Edit Title, Description & Category"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingId(item.id)}
                        className="p-1.5 rounded-lg bg-[#2a1a1a] hover:bg-[#3a1a1a] text-[#f87171] transition-colors cursor-pointer"
                        title="Delete Photo"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )}

  {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#0f1a17] border border-[#1e3530] rounded-2xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-6 lg:p-8 shadow-2xl relative my-auto">
            <div className="flex items-center justify-between mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-[#1e3530]">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#173F35] flex items-center justify-center text-[#D8B86A] shrink-0">
                  <Edit2 size={15} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-serif font-semibold text-[#FAF7F0]">
                    Edit Photo Details
                  </h3>
                  <p className="text-[10px] sm:text-xs text-[#77736A]">Update heading, hover text, or category</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-[#77736A] hover:text-[#FAF7F0] p-1 cursor-pointer"
              >
                <X size={17} />
              </button>
            </div>

            {editError && (
              <div className="mb-4 p-2.5 sm:p-3 rounded-xl bg-[#2a1a1a] border border-[#5a2a2a] text-[#f87171] text-xs flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-3.5 sm:space-y-4">
              {/* Photo Preview & Replace */}
              <div>
                <label className="block text-[11px] sm:text-xs font-semibold text-[#77736A] uppercase tracking-wider mb-2">
                  Photo / Image
                </label>
                <div className="flex items-center gap-3.5 bg-[#0a1210] border border-[#1e3530] rounded-xl p-3">
                  <img
                    src={editFilePreview || editingItem.src}
                    alt="Preview"
                    className="w-20 h-16 sm:w-24 sm:h-20 rounded-lg object-cover border border-[#2a5a4a] shrink-0 bg-[#050b09]"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#FAF7F0] truncate font-medium mb-1">
                      {editFile ? editFile.name : (editingItem.title || 'Current Photo')}
                    </p>
                    {editFile ? (
                      <p className="text-[10px] text-[#4ade80] mb-2 font-mono">
                        New photo selected ({(editFile.size / (1024 * 1024)).toFixed(2)} MB)
                      </p>
                    ) : (
                      <p className="text-[10px] text-[#77736A] mb-2 truncate font-mono">
                        {editingItem.src}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#173F35] hover:bg-[#1f5246] text-[#FAF7F0] text-xs font-semibold cursor-pointer transition-colors">
                        <Upload size={13} className="text-[#D8B86A]" />
                        <span>{editFile ? 'Change Photo' : 'Replace Photo'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleEditFileChange}
                          className="hidden"
                          disabled={isEditSubmitting}
                        />
                      </label>
                      {editFile && (
                        <button
                          type="button"
                          disabled={isEditSubmitting}
                          onClick={() => {
                            if (editFilePreview && editFilePreview.startsWith('blob:')) {
                              URL.revokeObjectURL(editFilePreview);
                            }
                            setEditFile(null);
                            setEditFilePreview(editingItem.src);
                          }}
                          className="text-xs text-[#f87171] hover:underline cursor-pointer"
                        >
                          Revert
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-[11px] sm:text-xs font-semibold text-[#77736A] uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full bg-[#0a1210] border border-[#1e3530] focus:border-[#B78A3B] text-[#FAF7F0] rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm outline-none cursor-pointer"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.key} value={cat.key} className="bg-[#0a1210] text-[#FAF7F0]">
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[11px] sm:text-xs font-semibold text-[#77736A] uppercase tracking-wider">
                    Text Heading (Max 200 chars)
                  </label>
                  <span
                    className={clsx(
                      'text-[10px] font-mono',
                      editTitle.length > MAX_CHARS ? 'text-[#f87171] font-bold' : 'text-[#77736A]'
                    )}
                  >
                    {editTitle.length}/{MAX_CHARS}
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={MAX_CHARS}
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-[#0a1210] border border-[#1e3530] focus:border-[#B78A3B] text-[#FAF7F0] rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm outline-none"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[11px] sm:text-xs font-semibold text-[#77736A] uppercase tracking-wider">
                    Hover Description (Max 200 chars)
                  </label>
                  <span
                    className={clsx(
                      'text-[10px] font-mono',
                      editDescription.length > MAX_CHARS ? 'text-[#f87171] font-bold' : 'text-[#77736A]'
                    )}
                  >
                    {editDescription.length}/{MAX_CHARS}
                  </span>
                </div>
                <textarea
                  maxLength={MAX_CHARS}
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-[#0a1210] border border-[#1e3530] focus:border-[#B78A3B] text-[#FAF7F0] rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm outline-none resize-none"
                  required
                />
              </div>

              <div className="pt-2 sm:pt-3 flex items-center justify-end gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  disabled={isEditSubmitting}
                  className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-[#1e3530] text-xs text-[#77736A] hover:text-[#FAF7F0] cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditSubmitting}
                  className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-[#B78A3B] hover:bg-[#D8B86A] text-[#0a1210] font-bold text-xs shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isEditSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete (Move to Trash) Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3.5 sm:p-4">
          <div className="bg-[#0f1a17] border border-[#5a2a2a] rounded-2xl sm:rounded-3xl max-w-xs sm:max-w-sm w-full p-5 sm:p-6 shadow-2xl text-center">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#2a1a1a] flex items-center justify-center text-[#f87171] mx-auto mb-3.5">
              <Trash2 size={22} />
            </div>
            <h3 className="text-sm sm:text-base font-serif font-bold text-[#FAF7F0] mb-1">
              Move to Recently Deleted?
            </h3>
            <p className="text-[11px] sm:text-xs text-[#77736A] mb-5">
              This photo will be moved to Recently Deleted and kept safely for 10 days. You can restore it anytime within 10 days.
            </p>
            <div className="flex items-center justify-center gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="w-1/2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-[#1e3530] text-xs text-[#77736A] hover:text-[#FAF7F0] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="w-1/2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#ef4444] hover:bg-[#dc2626] text-white font-bold text-xs shadow-md cursor-pointer"
              >
                Delete Photo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permanently Delete Confirmation Modal */}
      {deletingForeverId && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3.5 sm:p-4">
          <div className="bg-[#0f1a17] border border-[#7a1a1a] rounded-2xl sm:rounded-3xl max-w-xs sm:max-w-sm w-full p-5 sm:p-6 shadow-2xl text-center">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#3a1a1a] flex items-center justify-center text-[#f87171] mx-auto mb-3.5">
              <AlertTriangle size={22} />
            </div>
            <h3 className="text-sm sm:text-base font-serif font-bold text-[#FAF7F0] mb-1">
              Permanently Delete?
            </h3>
            <p className="text-[11px] sm:text-xs text-[#77736A] mb-5">
              This will permanently delete this photo from disk. It cannot be recovered or restored.
            </p>
            <div className="flex items-center justify-center gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => setDeletingForeverId(null)}
                className="w-1/2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-[#1e3530] text-xs text-[#77736A] hover:text-[#FAF7F0] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPermanentDelete}
                className="w-1/2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#b91c1c] hover:bg-[#991b1b] text-white font-bold text-xs shadow-md cursor-pointer"
              >
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty Trash Confirmation Modal */}
      {confirmEmptyTrash && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3.5 sm:p-4">
          <div className="bg-[#0f1a17] border border-[#7a1a1a] rounded-2xl sm:rounded-3xl max-w-xs sm:max-w-sm w-full p-5 sm:p-6 shadow-2xl text-center">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#3a1a1a] flex items-center justify-center text-[#f87171] mx-auto mb-3.5">
              <Trash2 size={22} />
            </div>
            <h3 className="text-sm sm:text-base font-serif font-bold text-[#FAF7F0] mb-1">
              Empty Recently Deleted Photos?
            </h3>
            <p className="text-[11px] sm:text-xs text-[#77736A] mb-5">
              All {trashItems.length} photos in Recently Deleted will be permanently deleted and cannot be recovered.
            </p>
            <div className="flex items-center justify-center gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => setConfirmEmptyTrash(false)}
                className="w-1/2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-[#1e3530] text-xs text-[#77736A] hover:text-[#FAF7F0] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmEmptyTrash}
                className="w-1/2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#b91c1c] hover:bg-[#991b1b] text-white font-bold text-xs shadow-md cursor-pointer"
              >
                Yes, Empty All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permanently Delete Video Confirmation Modal */}
      {deletingForeverVideoId && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3.5 sm:p-4">
          <div className="bg-[#0f1a17] border border-[#7a1a1a] rounded-2xl sm:rounded-3xl max-w-xs sm:max-w-sm w-full p-5 sm:p-6 shadow-2xl text-center">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#3a1a1a] flex items-center justify-center text-[#f87171] mx-auto mb-3.5">
              <AlertTriangle size={22} />
            </div>
            <h3 className="text-sm sm:text-base font-serif font-bold text-[#FAF7F0] mb-1">
              Permanently Delete Video?
            </h3>
            <p className="text-[11px] sm:text-xs text-[#77736A] mb-5">
              This video will be permanently erased. It cannot be recovered or restored.
            </p>
            <div className="flex items-center justify-center gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => setDeletingForeverVideoId(null)}
                className="w-1/2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-[#1e3530] text-xs text-[#77736A] hover:text-[#FAF7F0] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPermanentDeleteVideo}
                className="w-1/2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#b91c1c] hover:bg-[#991b1b] text-white font-bold text-xs shadow-md cursor-pointer"
              >
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty Video Trash Confirmation Modal */}
      {confirmEmptyVideoTrash && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3.5 sm:p-4">
          <div className="bg-[#0f1a17] border border-[#7a1a1a] rounded-2xl sm:rounded-3xl max-w-xs sm:max-w-sm w-full p-5 sm:p-6 shadow-2xl text-center">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#3a1a1a] flex items-center justify-center text-[#f87171] mx-auto mb-3.5">
              <Trash2 size={22} />
            </div>
            <h3 className="text-sm sm:text-base font-serif font-bold text-[#FAF7F0] mb-1">
              Empty Deleted Videos?
            </h3>
            <p className="text-[11px] sm:text-xs text-[#77736A] mb-5">
              All {trashVideos.length} videos in Recently Deleted will be permanently deleted and cannot be recovered.
            </p>
            <div className="flex items-center justify-center gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => setConfirmEmptyVideoTrash(false)}
                className="w-1/2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-[#1e3530] text-xs text-[#77736A] hover:text-[#FAF7F0] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmEmptyVideoTrash}
                className="w-1/2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#b91c1c] hover:bg-[#991b1b] text-white font-bold text-xs shadow-md cursor-pointer"
              >
                Yes, Empty All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GitHub Repository Sync Modal */}
      {showGitHubModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3.5 sm:p-4">
          <div className="bg-[#0f1a17] border border-[#2a5a4a] rounded-2xl sm:rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#173F35] flex items-center justify-center text-[#D8B86A]">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 className="text-base font-serif font-bold text-[#FAF7F0]">
                    GitHub Repository Sync
                  </h3>
                  <p className="text-xs text-[#77736A]">
                    Repository: <span className="font-mono text-[#D8B86A]">{GITHUB_REPO_OWNER}/{GITHUB_REPO_NAME}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowGitHubModal(false);
                  setTokenError('');
                  setTokenSuccess('');
                }}
                className="text-[#77736A] hover:text-[#FAF7F0] p-1 rounded-lg hover:bg-white/5 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="text-xs text-[#cfc5b0] bg-[#173F35]/30 p-3.5 rounded-xl border border-[#2a5a4a]/60 space-y-1.5">
              <p className="font-semibold text-[#D8B86A]">Why connect GitHub?</p>
              <p>
                When connected, photos you upload are committed directly into your repository&apos;s <code className="text-[#D8B86A]">public/images/gallery/uploaded/</code> folder and <code className="text-[#D8B86A]">galleryData.json</code> on branch <code className="text-[#D8B86A]">main</code>.
              </p>
              <p className="text-[#a39a88]">
                Vercel automatically deploys each commit, making your photos permanently visible across <strong>all browsers, mobile phones, and all website visitors</strong>.
              </p>
            </div>

            <form onSubmit={handleSaveGitHubToken} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#77736A] uppercase tracking-wider mb-1.5">
                  GitHub Personal Access Token (PAT)
                </label>
                <div className="relative">
                  <input
                    type={showTokenText ? 'text' : 'password'}
                    value={githubTokenInput}
                    onChange={(e) => {
                      setGithubTokenInput(e.target.value);
                      setTokenError('');
                      setTokenSuccess('');
                    }}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full bg-[#0a1210] border border-[#1e3530] focus:border-[#D8B86A] text-[#FAF7F0] rounded-xl px-4 py-2.5 text-xs font-mono pr-10 outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTokenText(!showTokenText)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#77736A] hover:text-[#FAF7F0] cursor-pointer"
                  >
                    {showTokenText ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {tokenError && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{tokenError}</span>
                </div>
              )}

              {tokenSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 size={14} className="shrink-0" />
                  <span>{tokenSuccess}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-1 gap-2">
                {githubConnected ? (
                  <button
                    type="button"
                    onClick={handleDisconnectGitHub}
                    className="px-3.5 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 text-red-300 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Disconnect
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowGitHubModal(false);
                      setTokenError('');
                      setTokenSuccess('');
                    }}
                    className="px-3.5 py-2 rounded-xl border border-[#1e3530] text-xs text-[#77736A] hover:text-[#FAF7F0] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={tokenTesting || !githubTokenInput.trim()}
                    className="px-4 py-2 rounded-xl bg-[#B78A3B] hover:bg-[#D8B86A] disabled:opacity-40 disabled:cursor-not-allowed text-[#0a1210] text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5 transition-all"
                  >
                    {tokenTesting ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <span>Save & Connect</span>
                    )}
                  </button>
                </div>
              </div>
            </form>

            {/* Quick 3-Step Token Guide */}
            <div className="pt-2 border-t border-[#1e3530]/60 text-[11px] text-[#77736A] space-y-1">
              <p className="font-semibold text-[#FAF7F0] flex items-center justify-between">
                <span>How to generate a token (30 seconds):</span>
                <a
                  href="https://github.com/settings/tokens/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#D8B86A] hover:underline flex items-center gap-1 inline-flex"
                >
                  <span>Open GitHub Tokens</span>
                  <ExternalLink size={10} />
                </a>
              </p>
              <ol className="list-decimal list-inside space-y-0.5 text-[#9e9687]">
                <li>Name it <code className="text-[#D8B86A]">poondi-admin</code></li>
                <li>Set expiration (e.g., 90 days or No expiration)</li>
                <li>Check the <strong className="text-[#FAF7F0]">repo</strong> box (Full control of private repositories)</li>
                <li>Click <strong className="text-[#FAF7F0]">Generate token</strong> at the bottom & paste it here</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Cloudinary Configuration Modal */}
      {showCloudinaryModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3.5 sm:p-4">
          <div className="bg-[#0f171d] border border-sky-800/70 rounded-2xl sm:rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#122836] flex items-center justify-center text-sky-400">
                  <Cloud size={20} />
                </div>
                <div>
                  <h3 className="text-base font-serif font-bold text-[#FAF7F0]">
                    Cloudinary Media CDN Setup
                  </h3>
                  <p className="text-xs text-[#8ea4b8]">
                    Global high-speed CDN, automatic WebP/AVIF compression & storage
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCloudinaryModal(false);
                  setCldError('');
                  setCldSuccess('');
                }}
                className="text-[#77736A] hover:text-[#FAF7F0] p-1 rounded-lg hover:bg-white/5 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="text-xs text-[#cfdbe3] bg-[#122430]/60 p-3.5 rounded-xl border border-sky-900/60 space-y-1.5">
              <p className="font-semibold text-sky-300">Why use Cloudinary?</p>
              <p>
                Cloudinary hosts your photos on a worldwide content delivery network (CDN). Uploaded images are served at lightning speed, cached globally, and converted automatically to next-gen formats (WebP/AVIF).
              </p>
            </div>

            <form onSubmit={handleSaveCloudinary} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#8ea4b8] uppercase tracking-wider mb-1.5">
                  Cloud Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={cldCloudName}
                  onChange={(e) => {
                    setCldCloudName(e.target.value);
                    setCldError('');
                    setCldSuccess('');
                  }}
                  placeholder="e.g. your-cloud-name"
                  className="w-full bg-[#091116] border border-[#1b2f3d] focus:border-sky-400 text-[#FAF7F0] rounded-xl px-4 py-2.5 text-xs font-mono outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8ea4b8] uppercase tracking-wider mb-1.5">
                  Upload Preset (Unsigned) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={cldUploadPreset}
                  onChange={(e) => {
                    setCldUploadPreset(e.target.value);
                    setCldError('');
                    setCldSuccess('');
                  }}
                  placeholder="e.g. poondi_gallery or ml_default"
                  className="w-full bg-[#091116] border border-[#1b2f3d] focus:border-sky-400 text-[#FAF7F0] rounded-xl px-4 py-2.5 text-xs font-mono outline-none transition-colors"
                />
                <p className="text-[10px] text-[#6d8496] mt-1">
                  Must be an <strong>Unsigned</strong> preset created in Cloudinary Settings &rarr; Upload.
                </p>
              </div>

              <p className="text-[10px] text-[#6d8496] -mt-1">
                Asset deletion is handled securely by the server and does not require an API key/secret here.
              </p>

              {cldError && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{cldError}</span>
                </div>
              )}

              {cldSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 size={14} className="shrink-0" />
                  <span>{cldSuccess}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 gap-2">
                {cloudinaryConnected ? (
                  <button
                    type="button"
                    onClick={handleDisconnectCloudinary}
                    className="px-3.5 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 text-red-300 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Disconnect
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCloudinaryModal(false);
                      setCldError('');
                      setCldSuccess('');
                    }}
                    className="px-3.5 py-2 rounded-xl border border-[#1b2f3d] text-xs text-[#8ea4b8] hover:text-[#FAF7F0] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={cldTesting || !cldCloudName.trim() || !cldUploadPreset.trim()}
                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5 transition-all"
                  >
                    {cldTesting ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <span>Test & Save</span>
                    )}
                  </button>
                </div>
              </div>
            </form>

            {/* Cloudinary 3-Step Setup Guide */}
            <div className="pt-2 border-t border-[#1b2f3d]/60 text-[11px] text-[#8ea4b8] space-y-1">
              <p className="font-semibold text-[#FAF7F0] flex items-center justify-between">
                <span>How to set up in 60 seconds (Free forever):</span>
                <a
                  href="https://cloudinary.com/users/register_free"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-400 hover:underline flex items-center gap-1 inline-flex"
                >
                  <span>Cloudinary Console</span>
                  <ExternalLink size={10} />
                </a>
              </p>
              <ol className="list-decimal list-inside space-y-0.5 text-[#a8bac7]">
                <li>Sign up / log in to <strong className="text-[#FAF7F0]">cloudinary.com</strong> & copy your <code className="text-sky-300">Cloud Name</code></li>
                <li>Go to <strong className="text-[#FAF7F0]">Settings</strong> (gear icon) &rarr; <strong className="text-[#FAF7F0]">Upload</strong> &rarr; scroll down to <strong className="text-[#FAF7F0]">Upload presets</strong></li>
                <li>Click <strong className="text-[#FAF7F0]">Add upload preset</strong>, set <strong className="text-sky-300">Signing Mode = Unsigned</strong>, name it <code className="text-sky-300">poondi_gallery</code> & click Save</li>
                <li>Paste your Cloud Name and Preset name above & click <strong className="text-sky-400">Test & Save</strong>!</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Video Preview Modal for Recently Deleted Videos */}
      <VideoModal video={previewTrashVideo} onClose={() => setPreviewTrashVideo(null)} />
    </div>
  );
}
