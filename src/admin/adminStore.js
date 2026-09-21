/**
 * adminStore.js
 * Codebase & localStorage synced helpers for the Admin Panel.
 * Changes are permanently written to src/data/galleryData.json on disk!
 */
import { galleryItems as defaultStaticItems } from '../data/gallery.js';
import codebaseData from '../data/galleryData.json' with { type: 'json' };
import { fetchLatestGalleryDataFromGitHub } from './githubSync.js';

// ---------------------------------------------------------------------------
// Storage Keys
// ---------------------------------------------------------------------------
export const KEYS = {
  CREDENTIALS: 'pm_admin_credentials',
  LOCKOUT: 'pm_admin_lockout',
  GALLERY: 'pm_admin_all_gallery',
  LEGACY_GALLERY: 'pm_admin_gallery',
  FEATURED: 'pm_admin_featured_ids',
  TRASH: 'pm_admin_gallery_trash',
  PERMANENT_DELETIONS: 'pm_permanently_deleted_ids',
  RESTORED_PHOTOS: 'pm_restored_photo_ids',
  VIDEOS: 'pm_admin_videos',
  VIDEO_TRASH: 'pm_admin_video_trash',
  PERMANENT_VIDEO_DELETIONS: 'pm_permanently_deleted_video_ids',
  RESTORED_VIDEOS: 'pm_restored_video_ids',
};

// ---------------------------------------------------------------------------
// Permanent Deletion Tracking (Prevents server sync from resurrecting deleted items)
// ---------------------------------------------------------------------------
export function getPermanentlyDeletedIds() {
  if (typeof window === 'undefined') return new Set();
  const raw = localStorage.getItem(KEYS.PERMANENT_DELETIONS);
  if (raw) {
    try {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr.map(String));
    } catch {}
  }
  return new Set();
}

export function recordPermanentDeletion(id) {
  if (!id || typeof window === 'undefined') return;
  const set = getPermanentlyDeletedIds();
  set.add(String(id));
  localStorage.setItem(KEYS.PERMANENT_DELETIONS, JSON.stringify(Array.from(set)));
}

export function getPermanentlyDeletedVideoIds() {
  if (typeof window === 'undefined') return new Set();
  const raw = localStorage.getItem(KEYS.PERMANENT_VIDEO_DELETIONS);
  if (raw) {
    try {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr.map(String));
    } catch {}
  }
  return new Set();
}

export function recordPermanentVideoDeletion(id) {
  if (!id || typeof window === 'undefined') return;
  const set = getPermanentlyDeletedVideoIds();
  set.add(String(id));
  localStorage.setItem(KEYS.PERMANENT_VIDEO_DELETIONS, JSON.stringify(Array.from(set)));
}

// ---------------------------------------------------------------------------
// Restored Items Tracking (Prevents server sync from resurrecting into trash)
// ---------------------------------------------------------------------------
export function getRestoredPhotoIds() {
  if (typeof window === 'undefined') return new Set();
  const raw = localStorage.getItem(KEYS.RESTORED_PHOTOS);
  if (raw) {
    try {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr.map(String));
    } catch {}
  }
  return new Set();
}

export function recordRestoredPhoto(id) {
  if (!id || typeof window === 'undefined') return;
  const set = getRestoredPhotoIds();
  set.add(String(id));
  localStorage.setItem(KEYS.RESTORED_PHOTOS, JSON.stringify(Array.from(set)));
}

export function unrecordRestoredPhoto(id) {
  if (!id || typeof window === 'undefined') return;
  const set = getRestoredPhotoIds();
  set.delete(String(id));
  localStorage.setItem(KEYS.RESTORED_PHOTOS, JSON.stringify(Array.from(set)));
}

export function getRestoredVideoIds() {
  if (typeof window === 'undefined') return new Set();
  const raw = localStorage.getItem(KEYS.RESTORED_VIDEOS);
  if (raw) {
    try {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr.map(String));
    } catch {}
  }
  return new Set();
}

export function recordRestoredVideo(id) {
  if (!id || typeof window === 'undefined') return;
  const set = getRestoredVideoIds();
  set.add(String(id));
  localStorage.setItem(KEYS.RESTORED_VIDEOS, JSON.stringify(Array.from(set)));
}

export function unrecordRestoredVideo(id) {
  if (!id || typeof window === 'undefined') return;
  const set = getRestoredVideoIds();
  set.delete(String(id));
  localStorage.setItem(KEYS.RESTORED_VIDEOS, JSON.stringify(Array.from(set)));
}

// ---------------------------------------------------------------------------
// Category Normalizer (handles keys, labels, whitespace, case)
// ---------------------------------------------------------------------------
export function normalizeCategory(cat) {
  if (!cat) return 'swami';
  const lower = String(cat).trim().toLowerCase();
  if (lower === 'ashram' || lower.includes('ashram') || lower.includes('sanctum')) return 'ashram';
  if (lower === 'darshan' || lower.includes('darshan') || lower.includes('devotee')) return 'darshan';
  if (lower === 'events' || lower.includes('event') || lower.includes('puja') || lower.includes('festival')) return 'events';
  if (lower === 'swami' || lower.includes('swami') || lower.includes('mahan')) return 'swami';
  return lower;
}

// ---------------------------------------------------------------------------
// Codebase Persistence API (Authoritative Server Disk Storage)
// ---------------------------------------------------------------------------

let syncDebounceTimer = null;

async function doSave() {
  if (typeof window === 'undefined') return false;
  try {
    const payload = {
      items: getAllGalleryItems(),
      featured: getFeaturedIds(),
      trash: getRecentlyDeletedItems(),
      videos: getAllVideos(),
      videoTrash: getRecentlyDeletedVideos(),
      credentials: getCredentials(),
    };
    const res = await fetch('/api/admin/data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (err) {
    console.warn('[adminStore] Codebase persistence write error:', err);
    return false;
  }
}

/**
 * Persist current state to server codebase (src/data/galleryData.json).
 * @param {boolean} immediate - If true, flushes immediately and returns a Promise<boolean>.
 */
export async function saveToCodebase(immediate = false) {
  if (typeof window === 'undefined') return false;

  if (syncDebounceTimer) {
    clearTimeout(syncDebounceTimer);
    syncDebounceTimer = null;
  }

  if (immediate) {
    return await doSave();
  }

  return new Promise((resolve) => {
    syncDebounceTimer = setTimeout(async () => {
      syncDebounceTimer = null;
      const ok = await doSave();
      resolve(ok);
    }, 100);
  });
}

export const flushToCodebase = () => saveToCodebase(true);

/**
 * Applies authoritative data from server into localStorage and dispatches reactive events.
 * Safely merges local trash so deletions are never lost or resurrected on sync.
 */
export function applyServerData(data) {
  if (!data || typeof window === 'undefined') return null;

  let hasChanges = false;
  const permDeletedPhotoIds = getPermanentlyDeletedIds();
  const permDeletedVideoIds = getPermanentlyDeletedVideoIds();
  const restoredPhotoIds = getRestoredPhotoIds();
  const restoredVideoIds = getRestoredVideoIds();

  // Read current local active items
  let currentLocal = [];
  try {
    const rawLocal = localStorage.getItem(KEYS.GALLERY);
    if (rawLocal) currentLocal = JSON.parse(rawLocal);
  } catch {}
  if (!Array.isArray(currentLocal)) currentLocal = [];
  const localActivePhotoIds = new Set(currentLocal.map((i) => String(i?.id)));

  // 1. Sync & Merge Photo Trash (NEVER wipe local recently deleted items, but NEVER re-trash restored/active items)
  let currentLocalTrash = [];
  try {
    const rawTrash = localStorage.getItem(KEYS.TRASH);
    if (rawTrash) currentLocalTrash = JSON.parse(rawTrash);
  } catch {}
  if (!Array.isArray(currentLocalTrash)) currentLocalTrash = [];

  const serverTrash = Array.isArray(data.trash) ? data.trash : [];
  const mergedTrashMap = new Map();
  for (const item of serverTrash) {
    const sId = String(item?.id);
    if (item && item.id && !permDeletedPhotoIds.has(sId) && !restoredPhotoIds.has(sId) && !localActivePhotoIds.has(sId)) {
      mergedTrashMap.set(sId, item);
    }
  }
  for (const item of currentLocalTrash) {
    const sId = String(item?.id);
    if (item && item.id && !permDeletedPhotoIds.has(sId) && !restoredPhotoIds.has(sId)) {
      mergedTrashMap.set(sId, item);
    }
  }
  const mergedTrash = Array.from(mergedTrashMap.values());
  localStorage.setItem(KEYS.TRASH, JSON.stringify(mergedTrash));
  window.dispatchEvent(new CustomEvent('pm_trash_updated', { detail: mergedTrash }));

  // Read current local active videos
  let currentLocalVideos = [];
  try {
    const rawLocal = localStorage.getItem(KEYS.VIDEOS);
    if (rawLocal) currentLocalVideos = JSON.parse(rawLocal);
  } catch {}
  if (!Array.isArray(currentLocalVideos)) currentLocalVideos = [];
  const localActiveVideoIds = new Set(currentLocalVideos.map((v) => String(v?.id)));

  // 2. Sync & Merge Video Trash (NEVER wipe local recently deleted videos, but NEVER re-trash restored/active videos)
  let currentLocalVideoTrash = [];
  try {
    const rawVideoTrash = localStorage.getItem(KEYS.VIDEO_TRASH);
    if (rawVideoTrash) currentLocalVideoTrash = JSON.parse(rawVideoTrash);
  } catch {}
  if (!Array.isArray(currentLocalVideoTrash)) currentLocalVideoTrash = [];

  const serverVideoTrash = Array.isArray(data.videoTrash) ? data.videoTrash : [];
  const mergedVideoTrashMap = new Map();
  for (const item of serverVideoTrash) {
    const sId = String(item?.id);
    if (item && item.id && !permDeletedVideoIds.has(sId) && !restoredVideoIds.has(sId) && !localActiveVideoIds.has(sId)) {
      mergedVideoTrashMap.set(sId, item);
    }
  }
  for (const item of currentLocalVideoTrash) {
    const sId = String(item?.id);
    if (item && item.id && !permDeletedVideoIds.has(sId) && !restoredVideoIds.has(sId)) {
      mergedVideoTrashMap.set(sId, item);
    }
  }
  const mergedVideoTrash = Array.from(mergedVideoTrashMap.values());
  localStorage.setItem(KEYS.VIDEO_TRASH, JSON.stringify(mergedVideoTrash));
  window.dispatchEvent(new CustomEvent('pm_video_trash_updated', { detail: mergedVideoTrash }));

  // 3. Sync Active Photos (Filter out any photo currently in Trash or Permanently Deleted)
  if (Array.isArray(data.items)) {
    const localTrashPhotoIds = new Set(mergedTrash.map((t) => String(t.id)));
    const hiddenPhotoIds = new Set([...localTrashPhotoIds, ...permDeletedPhotoIds]);
    for (const rId of restoredPhotoIds) {
      hiddenPhotoIds.delete(String(rId));
    }

    const localMap = new Map();
    for (const item of currentLocal) {
      if (item && item.id && !hiddenPhotoIds.has(String(item.id))) {
        localMap.set(String(item.id), item);
      }
    }

    const merged = [];
    const processedIds = new Set();

    for (const serverItem of data.items) {
      if (!serverItem || !serverItem.id) continue;
      const sId = String(serverItem.id);
      if (hiddenPhotoIds.has(sId)) continue;

      processedIds.add(sId);
      const localItem = localMap.get(sId);

      if (!localItem) {
        merged.push({
          ...serverItem,
          category: normalizeCategory(serverItem.category),
        });
        continue;
      }

      const localUpdated = localItem.updatedAt ? new Date(localItem.updatedAt).getTime() : 0;
      const serverUpdated = serverItem.updatedAt ? new Date(serverItem.updatedAt).getTime() : 0;

      // If local item has pending in-flight edits newer than server, protect it
      if (localItem.isModified && localUpdated > serverUpdated) {
        merged.push(localItem);
      } else {
        // Server item is newer or local is not modified in-flight:
        // Update with server details (text edits, category, alt, etc.)
        const isLocalBlob = typeof localItem.src === 'string' && (localItem.src.startsWith('data:') || localItem.src.startsWith('blob:'));
        const isServerWeb = typeof serverItem.src === 'string' && !serverItem.src.startsWith('data:') && !serverItem.src.startsWith('blob:');

        merged.push({
          ...localItem,
          ...serverItem,
          src: (isServerWeb ? serverItem.src : (isLocalBlob ? localItem.src : serverItem.src)),
          thumb: (isServerWeb ? (serverItem.thumb || serverItem.src) : (localItem.thumb || serverItem.thumb || serverItem.src)),
          category: normalizeCategory(serverItem.category),
          isModified: false,
        });
      }
    }

    // Preserve any local items not yet on the server (e.g. newly added offline / in-flight)
    for (const [id, localItem] of localMap.entries()) {
      if (!processedIds.has(id)) {
        merged.push(localItem);
      }
    }

    try {
      localStorage.setItem(KEYS.GALLERY, JSON.stringify(merged));
    } catch (quotaErr) {
      console.warn('[adminStore] localStorage quota exceeded when saving gallery items:', quotaErr);
    }
    window.dispatchEvent(new CustomEvent('pm_gallery_updated', { detail: merged }));
    hasChanges = true;
  }

  // 4. Sync Featured Items (clean up if deleted)
  if (Array.isArray(data.featured)) {
    const hiddenPhotoIds = new Set([...mergedTrash.map((t) => String(t.id)), ...permDeletedPhotoIds]);
    for (const rId of restoredPhotoIds) {
      hiddenPhotoIds.delete(String(rId));
    }
    const validFeatured = data.featured.filter((id) => !hiddenPhotoIds.has(String(id)));
    localStorage.setItem(KEYS.FEATURED, JSON.stringify(validFeatured));
    window.dispatchEvent(new CustomEvent('pm_featured_updated', { detail: validFeatured }));
    hasChanges = true;
  }

  // 5. Sync Active Videos (Filter out any video currently in Video Trash or Permanently Deleted)
  if (Array.isArray(data.videos)) {
    const localTrashVideoIds = new Set(mergedVideoTrash.map((t) => String(t.id)));
    const hiddenVideoIds = new Set([...localTrashVideoIds, ...permDeletedVideoIds]);
    for (const rId of restoredVideoIds) {
      hiddenVideoIds.delete(String(rId));
    }

    const localVideoMap = new Map();
    for (const v of currentLocalVideos) {
      if (v && v.id && !hiddenVideoIds.has(String(v.id))) {
        localVideoMap.set(String(v.id), v);
      }
    }

    const mergedVideos = [];
    const processedVideoIds = new Set();

    for (const serverVideo of data.videos) {
      if (!serverVideo || !serverVideo.id) continue;
      const sId = String(serverVideo.id);
      if (hiddenVideoIds.has(sId)) continue;

      processedVideoIds.add(sId);
      const localVideo = localVideoMap.get(sId);

      if (!localVideo) {
        mergedVideos.push(serverVideo);
        continue;
      }

      const localUpdated = localVideo.updatedAt ? new Date(localVideo.updatedAt).getTime() : 0;
      const serverUpdated = serverVideo.updatedAt ? new Date(serverVideo.updatedAt).getTime() : 0;

      if (localVideo.isModified && localUpdated > serverUpdated) {
        mergedVideos.push(localVideo);
      } else {
        mergedVideos.push({
          ...localVideo,
          ...serverVideo,
          isModified: false,
        });
      }
    }

    // Preserve local videos not yet on the server
    for (const [id, localVideo] of localVideoMap.entries()) {
      if (!processedVideoIds.has(id)) {
        mergedVideos.push(localVideo);
      }
    }

    localStorage.setItem(KEYS.VIDEOS, JSON.stringify(mergedVideos));
    window.dispatchEvent(new CustomEvent('pm_videos_updated', { detail: mergedVideos }));
    hasChanges = true;
  }

  // 6. Sync Admin Credentials
  if (data.credentials && data.credentials.email) {
    localStorage.setItem(KEYS.CREDENTIALS, JSON.stringify(data.credentials));
    window.dispatchEvent(new Event('pm_admin_auth_updated'));
    hasChanges = true;
  }

  if (hasChanges) {
    window.dispatchEvent(new Event('storage'));
  }

  return data;
}

/**
 * STRICTLY READ-ONLY sync from the authoritative server to this browser.
 * NEVER pushes local data to the server on page load!
 */
export async function syncFromCodebase() {
  if (typeof window === 'undefined') return null;

  try {
    const cacheBuster = `t=${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    let res = await fetch(`/api/admin/data?${cacheBuster}`, {
      cache: 'no-store',
      headers: {
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.items)) {
        return applyServerData(data);
      }
    }

    // When dev API endpoint is inactive (e.g. in production on Vercel):
    // 1. First fetch latest data directly from GitHub Contents API.
    // This provides INSTANT cross-browser updates without waiting 2 minutes for Vercel to rebuild!
    try {
      const ghData = await fetchLatestGalleryDataFromGitHub();
      if (ghData && Array.isArray(ghData.items)) {
        return applyServerData(ghData);
      }
    } catch {
      // GitHub API fallback
    }

    // 2. Fallback to static public/data/galleryData.json
    res = await fetch(`/data/galleryData.json?${cacheBuster}`, {
      cache: 'no-store',
      headers: {
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.items)) {
        return applyServerData(data);
      }
    }
  } catch (err) {
    // Network or static hosting fallback: keep local data
  }
  return null;
}

// ---------------------------------------------------------------------------
// Cross-Browser Synchronization Listeners
// ---------------------------------------------------------------------------
if (typeof window !== 'undefined') {
  // 1. Sync on startup
  syncFromCodebase();

  // 2. Sync whenever window or tab regains focus (user switches back to this browser)
  window.addEventListener('focus', () => {
    syncFromCodebase();
  });

  // 3. Sync whenever document visibility changes to visible
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      syncFromCodebase();
    }
  });

  // 4. Background refresh every 6s while the tab is active
  setInterval(() => {
    if (document.visibilityState === 'visible') {
      syncFromCodebase();
    }
  }, 6000);

  // 5. Real-time Vite HMR WebSocket sync across ALL connected browsers
  if (import.meta.hot) {
    import.meta.hot.accept('../data/galleryData.json', (newModule) => {
      if (newModule && newModule.default) {
        applyServerData(newModule.default);
      } else {
        syncFromCodebase();
      }
    });
  }
}

// ---------------------------------------------------------------------------
// Pure Front-End Image Storage & Processing (No External Services Required)
// Uses HTML5 Canvas for client-side WebP/JPEG optimization + IndexedDB cache
// ---------------------------------------------------------------------------

const DB_NAME = 'PoondiGalleryDB';
const DB_STORE = 'photos';

function openPhotoDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(DB_STORE)) {
        db.createObjectStore(DB_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Persists an image data URL to the browser's IndexedDB store (high capacity).
 */
export async function savePhotoToIndexedDB(id, dataUrl) {
  try {
    const db = await openPhotoDB();
    return new Promise((resolve) => {
      const tx = db.transaction(DB_STORE, 'readwrite');
      tx.objectStore(DB_STORE).put({ id, dataUrl, savedAt: Date.now() });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

/**
 * Client-side browser image compression using Canvas.
 * Converts any uploaded image File into a lightweight, high-fidelity WebP/JPEG Data URL.
 * Automatically resizes large camera photos to crisp web dimensions (~50KB-90KB)
 * so they safely fit directly into browser storage without hitting quotas.
 */
export function compressImageFile(file, maxWidth = 1280, maxHeight = 1280, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!file || !(file instanceof Blob)) {
      return reject(new Error('Invalid image file'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to parse image data'));
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return resolve({ dataUrl: e.target.result, width, height });
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Use WebP format if supported, fallback to JPEG
          let dataUrl = canvas.toDataURL('image/webp', quality);
          if (!dataUrl || !dataUrl.startsWith('data:image/webp')) {
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }

          resolve({ dataUrl, width, height });
        } catch {
          resolve({ dataUrl: e.target.result, width: img.width || 800, height: img.height || 600 });
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Returns true if `src` is an uploaded or client-stored photo (not a static asset from /images/).
 */
export function isUploadedPath(src) {
  if (typeof src !== 'string') return false;
  return (
    src.startsWith('/images/gallery/uploaded/') ||
    src.startsWith('data:image/') ||
    src.startsWith('blob:')
  );
}

/**
 * Upload & Store an image completely on the front end.
 *
 * 1. If local Vite dev-server (/api/gallery/upload) is active, tries it.
 * 2. In production (Vercel) or when dev server is offline:
 *    Compresses the image on the client canvas into a sharp, lightweight
 *    data URL and saves it directly in front-end browser storage.
 */
export async function uploadGalleryFile(file) {
  // ── 1. Try local dev-server API if available ──────────────────────────────
  try {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/gallery/upload', { method: 'POST', body: form });
    if (res.ok) {
      const data = await res.json();
      return {
        ok: true,
        path: data.path,
        thumb: data.path,
        fileName: data.fileName || file.name,
      };
    }
  } catch {
    // Local dev API inactive (e.g. on Vercel) — proceed to frontend storage
  }

  // ── 2. Pure Front-End Client Storage ──────────────────────────────────────
  const { dataUrl, width, height } = await compressImageFile(file, 1280, 1280, 0.82);
  const thumbResult = await compressImageFile(file, 400, 400, 0.75).catch(() => ({ dataUrl }));

  const photoId = 'photo_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);

  // Asynchronously back up to IndexedDB for persistent offline storage
  savePhotoToIndexedDB(photoId, dataUrl).catch(() => {});

  return {
    ok: true,
    path: dataUrl,
    thumb: thumbResult.dataUrl || dataUrl,
    fileName: file.name || photoId,
    width,
    height,
  };
}

/**
 * Permanently delete an uploaded file.
 * Silently succeeds on the front end (local data URLs don't need server deletion).
 */
export async function deleteGalleryFile(filePath) {
  if (!isUploadedPath(filePath)) return;

  // Front-end data/blob URLs require no server deletion
  if (filePath.startsWith('data:') || filePath.startsWith('blob:')) {
    return;
  }

  // Local dev server cleanup
  try {
    await fetch('/api/gallery/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath }),
    });
  } catch {
    // Ignore in production
  }
}

/**
 * Rename an uploaded file. Returns original path for front-end stored photos.
 */
export async function renameGalleryFile(oldPath, newName) {
  if (!isUploadedPath(oldPath)) return oldPath;
  if (oldPath.startsWith('data:') || oldPath.startsWith('blob:')) return oldPath;
  try {
    const res = await fetch('/api/gallery/rename', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldPath, newName }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.newPath || oldPath;
    }
  } catch {
    // ignore
  }
  return oldPath;
}

const DEFAULT_EMAIL = 'divagar.m.msc.cs@gmail.com';
const DEFAULT_PASSWORD = 'ponditest';

function hashPassword(password) {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash.toString(16);
}

export function initCredentials() {
  if (!localStorage.getItem(KEYS.CREDENTIALS)) {
    const defaultCreds = (codebaseData && codebaseData.credentials)
      ? codebaseData.credentials
      : {
          email: DEFAULT_EMAIL,
          passwordHash: hashPassword(DEFAULT_PASSWORD),
        };
    localStorage.setItem(KEYS.CREDENTIALS, JSON.stringify(defaultCreds));
  }
}

export function getCredentials() {
  const raw = localStorage.getItem(KEYS.CREDENTIALS);
  if (!raw) {
    initCredentials();
    return JSON.parse(localStorage.getItem(KEYS.CREDENTIALS));
  }
  return JSON.parse(raw);
}

export function verifyPassword(inputPassword) {
  const creds = getCredentials();
  return creds.passwordHash === hashPassword(inputPassword);
}

export function updatePassword(newPassword) {
  const creds = getCredentials();
  creds.passwordHash = hashPassword(newPassword);
  localStorage.setItem(KEYS.CREDENTIALS, JSON.stringify(creds));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('pm_admin_auth_updated'));
    window.dispatchEvent(new Event('storage'));
  }
  saveToCodebase();
}

export function updateAdminEmail(newEmail) {
  const creds = getCredentials();
  if (newEmail && newEmail.trim()) {
    creds.email = newEmail.trim().toLowerCase();
    localStorage.setItem(KEYS.CREDENTIALS, JSON.stringify(creds));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('pm_admin_auth_updated'));
      window.dispatchEvent(new Event('storage'));
    }
    saveToCodebase();
  }
  return creds.email;
}

export function updateAdminCredentials(newEmail, newPassword) {
  const creds = getCredentials();
  if (newEmail && newEmail.trim()) {
    creds.email = newEmail.trim().toLowerCase();
  }
  if (newPassword && newPassword.trim()) {
    creds.passwordHash = hashPassword(newPassword.trim());
  }
  localStorage.setItem(KEYS.CREDENTIALS, JSON.stringify(creds));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('pm_admin_auth_updated'));
    window.dispatchEvent(new Event('storage'));
  }
  saveToCodebase();
  return creds;
}

export function getAdminEmail() {
  return getCredentials().email;
}

// ---------------------------------------------------------------------------
// OTP Password Reset Security Service (Backend API Integration)
// ---------------------------------------------------------------------------
const OTP_TOKEN_KEY = 'pm_admin_verified_token';

/**
 * Request 6-digit OTP from server API.
 * The OTP is generated strictly on the server and never returned to the frontend.
 */
export async function sendOtpToEmail(email) {
  const targetEmail = (email || '').trim().toLowerCase();
  try {
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: targetEmail }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      return { success: false, error: data.error || 'Failed to send verification code.' };
    }
    return {
      success: true,
      email: targetEmail,
      maskedEmail: data.maskedEmail,
      resendIn: data.resendIn || 30,
      message: data.message,
    };
  } catch {
    return { success: false, error: 'Network error connecting to verification service.' };
  }
}

/**
 * Verify 6-digit OTP with server API.
 * On success, server issues a cryptographic single-use verificationToken.
 */
export async function verifyEmailOtp(email, otp) {
  try {
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: (email || '').trim().toLowerCase(),
        otp: String(otp || '').trim(),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      return {
        success: false,
        error: data.error || 'Invalid verification code. Please try again.',
        remainingAttempts: data.remainingAttempts,
      };
    }
    // Save issued verificationToken to sessionStorage for page persistence
    if (typeof window !== 'undefined' && data.verificationToken) {
      sessionStorage.setItem(OTP_TOKEN_KEY, JSON.stringify({
        token: data.verificationToken,
        email: (email || '').trim().toLowerCase(),
        savedAt: Date.now(),
      }));
    }
    return {
      success: true,
      verificationToken: data.verificationToken,
      message: data.message || 'Email verified successfully!',
    };
  } catch {
    return { success: false, error: 'Network error connecting to verification service.' };
  }
}

/**
 * Reset password via server API using the single-use verificationToken.
 */
export async function resetPasswordWithToken(email, verificationToken, newPassword) {
  const targetEmail = (email || getAdminEmail()).trim().toLowerCase();
  try {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: targetEmail,
        verificationToken,
        newPassword,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      return { success: false, error: data.error || 'Failed to reset password.' };
    }
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(OTP_TOKEN_KEY);
    }
    // Update local client storage credentials as well and clear lockout
    if (newPassword) {
      updateAdminCredentials(targetEmail, newPassword);
    }
    resetLockout();
    return { success: true, message: data.message || 'Password updated successfully!' };
  } catch {
    return { success: false, error: 'Network error resetting password.' };
  }
}

// Backward-compatibility wrappers
export function requestPasswordResetOtp(email) {
  return sendOtpToEmail(email);
}

export function verifyPasswordResetOtp(inputCode, email) {
  return verifyEmailOtp(email || getAdminEmail(), inputCode);
}

export function isResetAuthorized(token) {
  if (typeof window === 'undefined') return false;
  const raw = sessionStorage.getItem(OTP_TOKEN_KEY);
  if (!raw) return false;
  try {
    const data = JSON.parse(raw);
    if (!data.token) return false;
    if (token && data.token !== token) return false;
    if (Date.now() - data.savedAt > 15 * 60 * 1000) {
      sessionStorage.removeItem(OTP_TOKEN_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function completePasswordReset(token, newPassword, newEmail) {
  const raw = typeof window !== 'undefined' ? sessionStorage.getItem(OTP_TOKEN_KEY) : null;
  let storedEmail = getAdminEmail();
  let verifiedToken = token;
  if (raw) {
    try {
      const data = JSON.parse(raw);
      if (data.email) storedEmail = data.email;
      if (!verifiedToken && data.token) verifiedToken = data.token;
    } catch {}
  }
  return resetPasswordWithToken(newEmail || storedEmail, verifiedToken, newPassword);
}

export function clearOtpSession() {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(OTP_TOKEN_KEY);
  }
}

export function getActiveOtpSession() {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(OTP_TOKEN_KEY);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    if (Date.now() - data.savedAt > 15 * 60 * 1000) {
      sessionStorage.removeItem(OTP_TOKEN_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Lockout
// ---------------------------------------------------------------------------
const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION_MS = 3 * 60 * 60 * 1000;

function getLockout() {
  const raw = localStorage.getItem(KEYS.LOCKOUT);
  return raw ? JSON.parse(raw) : { attempts: 0, lockedUntil: null };
}

function saveLockout(data) {
  localStorage.setItem(KEYS.LOCKOUT, JSON.stringify(data));
}

export function isLockedOut() {
  const lockout = getLockout();
  if (!lockout.lockedUntil) return false;
  if (Date.now() < lockout.lockedUntil) return true;
  saveLockout({ attempts: 0, lockedUntil: null });
  return false;
}

export function getLockoutUntil() {
  const lockout = getLockout();
  if (lockout.lockedUntil && Date.now() < lockout.lockedUntil) {
    return lockout.lockedUntil;
  }
  return null;
}

export function getFailedAttempts() {
  return getLockout().attempts;
}

export function recordFailedAttempt() {
  const lockout = getLockout();
  const newAttempts = lockout.attempts + 1;
  if (newAttempts >= MAX_ATTEMPTS) {
    saveLockout({ attempts: newAttempts, lockedUntil: Date.now() + LOCKOUT_DURATION_MS });
  } else {
    saveLockout({ attempts: newAttempts, lockedUntil: null });
  }
}

export function resetLockout() {
  saveLockout({ attempts: 0, lockedUntil: null });
}

// ---------------------------------------------------------------------------
// Unified Gallery Store (All 35 static photos + new photos are editable & deletable)
// ---------------------------------------------------------------------------

export function getAllGalleryItems() {
  const trashIds = new Set(getRecentlyDeletedItems().map((t) => String(t.id)));
  const permIds = getPermanentlyDeletedIds();
  const restoredIds = getRestoredPhotoIds();
  for (const rId of restoredIds) {
    trashIds.delete(String(rId));
    permIds.delete(String(rId));
  }
  const isHidden = (id) => trashIds.has(String(id)) || permIds.has(String(id));

  const raw = localStorage.getItem(KEYS.GALLERY);
  if (!raw) {
    // First time initialization: load photos from codebase JSON
    const source = (codebaseData && Array.isArray(codebaseData.items) && codebaseData.items.length > 0)
      ? codebaseData.items
      : defaultStaticItems;
    const initial = source
      .filter((item) => !isHidden(item.id))
      .map((item) => ({
        ...item,
        category: normalizeCategory(item.category),
      }));
    localStorage.setItem(KEYS.GALLERY, JSON.stringify(initial));
    return initial;
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((item) => !isHidden(item.id))
        .map((item) => ({
          ...item,
          category: normalizeCategory(item.category),
        }));
    }
    return defaultStaticItems
      .filter((item) => !isHidden(item.id))
      .map((item) => ({ ...item, category: normalizeCategory(item.category) }));
  } catch {
    return defaultStaticItems
      .filter((item) => !isHidden(item.id))
      .map((item) => ({ ...item, category: normalizeCategory(item.category) }));
  }
}

export function saveAllGalleryItems(items, immediate = false) {
  localStorage.setItem(KEYS.GALLERY, JSON.stringify(items));
  // Notify any active components or pages in this window
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pm_gallery_updated', { detail: items }));
    window.dispatchEvent(new Event('storage'));
  }
  return saveToCodebase(immediate);
}

export function addGalleryItem(item) {
  const items = getAllGalleryItems();
  const nowIso = new Date().toISOString();
  const newItem = {
    ...item,
    id: 'photo_' + Date.now(),
    category: normalizeCategory(item.category),
    isAdmin: true,
    createdAt: nowIso,
    updatedAt: nowIso,
    isModified: true,
  };
  // Prepend to show newly added photo first
  const updated = [newItem, ...items];
  saveAllGalleryItems(updated);
  return newItem;
}

export function updateGalleryItem(id, updates) {
  const items = getAllGalleryItems();
  const idx = items.findIndex((i) => String(i.id) === String(id));
  if (idx !== -1) {
    const updatedCategory = updates.category !== undefined
      ? normalizeCategory(updates.category)
      : items[idx].category;

    items[idx] = {
      ...items[idx],
      ...updates,
      category: updatedCategory,
      isModified: true,
      updatedAt: new Date().toISOString(),
    };
    saveAllGalleryItems(items);
    return items[idx];
  }
  return null;
}

// ---------------------------------------------------------------------------
// Recently Deleted (10-Day Retention & Retrieval)
// ---------------------------------------------------------------------------
export const TRASH_RETENTION_MS = 10 * 24 * 60 * 60 * 1000; // 10 days

export function getDaysRemaining(deletedAt) {
  if (!deletedAt) return 0;
  const elapsed = Date.now() - new Date(deletedAt).getTime();
  const msRemaining = TRASH_RETENTION_MS - elapsed;
  if (msRemaining <= 0) return 0;
  return Math.ceil(msRemaining / (24 * 60 * 60 * 1000));
}

export function getRecentlyDeletedItems() {
  let raw = localStorage.getItem(KEYS.TRASH);
  let parsed = null;
  if (raw) {
    try {
      parsed = JSON.parse(raw);
    } catch {}
  }

  if (!Array.isArray(parsed)) {
    parsed = (codebaseData && Array.isArray(codebaseData.trash)) ? codebaseData.trash : [];
  }

  const permIds = getPermanentlyDeletedIds();

  try {
    const now = Date.now();
    const unexpired = [];
    let changed = false;

    for (const item of parsed) {
      if (!item || !item.id || permIds.has(String(item.id))) {
        changed = true;
        continue;
      }
      const deletedTime = item.deletedAt ? new Date(item.deletedAt).getTime() : 0;
      // Auto-purge ONLY if deletedAt is a valid timestamp and 10 days have elapsed
      if (deletedTime > 0 && (now - deletedTime >= TRASH_RETENTION_MS)) {
        if (isUploadedPath(item.src)) {
          deleteGalleryFile(item.src).catch(() => {});
        }
        recordPermanentDeletion(item.id);
        changed = true;
      } else {
        if (!item.deletedAt) {
          item.deletedAt = new Date().toISOString();
          changed = true;
        }
        unexpired.push(item);
      }
    }

    if (changed) {
      localStorage.setItem(KEYS.TRASH, JSON.stringify(unexpired));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pm_trash_updated', { detail: unexpired }));
        window.dispatchEvent(new Event('storage'));
      }
      saveToCodebase();
    }

    return unexpired.sort(
      (a, b) => new Date(b.deletedAt || 0).getTime() - new Date(a.deletedAt || 0).getTime()
    );
  } catch {
    return [];
  }
}

export function saveTrashItems(items, immediate = false) {
  localStorage.setItem(KEYS.TRASH, JSON.stringify(items));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pm_trash_updated', { detail: items }));
    window.dispatchEvent(new Event('storage'));
  }
  return saveToCodebase(immediate);
}

export function deleteGalleryItem(id) {
  unrecordRestoredPhoto(id);
  const all = getAllGalleryItems();
  const target = all.find((i) => String(i.id) === String(id));
  if (!target) return;

  // Preserve in Recently Deleted for 10 days
  const trashItem = {
    ...target,
    deletedAt: new Date().toISOString(),
  };

  const currentTrash = getRecentlyDeletedItems();
  const updatedTrash = [trashItem, ...currentTrash.filter((t) => String(t.id) !== String(id))];
  saveTrashItems(updatedTrash);

  // Remove from active gallery (reflects immediately on /gallery and Home page)
  const items = all.filter((i) => String(i.id) !== String(id));
  saveAllGalleryItems(items);

  // Also clean up featured list if this photo was featured
  const featured = getFeaturedIds().filter((fid) => String(fid) !== String(id));
  saveFeaturedIds(featured);
}

export function restoreGalleryItem(id) {
  const trash = getRecentlyDeletedItems();
  const target = trash.find((i) => String(i.id) === String(id));
  if (!target) return null;

  // 1. Mark as restored so server sync never re-trashes it
  recordRestoredPhoto(id);

  // 2. Remove from permanent deletions if it was recorded
  const permSet = getPermanentlyDeletedIds();
  if (permSet.has(String(id))) {
    permSet.delete(String(id));
    localStorage.setItem(KEYS.PERMANENT_DELETIONS, JSON.stringify(Array.from(permSet)));
  }

  // 3. Remove from trash
  const updatedTrash = trash.filter((i) => String(i.id) !== String(id));
  saveTrashItems(updatedTrash);

  // 4. Restore back into active gallery items
  const { deletedAt, ...activeItem } = target;
  const currentActive = getAllGalleryItems();
  const updatedActive = [activeItem, ...currentActive.filter((i) => String(i.id) !== String(id))];
  saveAllGalleryItems(updatedActive);

  return activeItem;
}

export function permanentlyDeleteTrashItem(id) {
  unrecordRestoredPhoto(id);
  const trash = getRecentlyDeletedItems();
  const target = trash.find((i) => String(i.id) === String(id));

  if (target && isUploadedPath(target.src)) {
    deleteGalleryFile(target.src).catch(() => {});
  }

  // 1. Record permanent deletion so server sync NEVER resurrects it
  recordPermanentDeletion(id);

  // 2. Remove from trash
  const updatedTrash = trash.filter((i) => String(i.id) !== String(id));
  saveTrashItems(updatedTrash);

  // 3. Ensure removed from active gallery items
  const currentActive = getAllGalleryItems().filter((i) => String(i.id) !== String(id));
  saveAllGalleryItems(currentActive);

  // 4. Ensure removed from featured
  const featured = getFeaturedIds().filter((fid) => String(fid) !== String(id));
  saveFeaturedIds(featured);
}

export function emptyTrash() {
  const trash = getRecentlyDeletedItems();
  for (const item of trash) {
    unrecordRestoredPhoto(item.id);
    if (isUploadedPath(item.src)) {
      deleteGalleryFile(item.src).catch(() => {});
    }
    recordPermanentDeletion(item.id);
  }
  saveTrashItems([]);

  const trashIds = new Set(trash.map((t) => String(t.id)));
  const currentActive = getAllGalleryItems().filter((i) => !trashIds.has(String(i.id)));
  saveAllGalleryItems(currentActive);
}

export function resetGalleryToDefaults() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(KEYS.PERMANENT_DELETIONS);
    localStorage.removeItem(KEYS.PERMANENT_VIDEO_DELETIONS);
  }
  saveTrashItems([]);
  saveVideoTrash([]);
  const defaults = defaultStaticItems.map((item) => ({
    ...item,
    category: normalizeCategory(item.category),
  }));
  saveAllGalleryItems(defaults);
  return defaults;
}

// Aliases for compatibility
export const getAdminGalleryItems = getAllGalleryItems;
export const saveAdminGalleryItems = saveAllGalleryItems;
export const addAdminGalleryItem = addGalleryItem;
export const updateAdminGalleryItem = updateGalleryItem;
export const deleteAdminGalleryItem = deleteGalleryItem;

// ---------------------------------------------------------------------------
// Featured Items
// ---------------------------------------------------------------------------

export function getFeaturedIds() {
  const raw = localStorage.getItem(KEYS.FEATURED);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {}
  }
  return (codebaseData && Array.isArray(codebaseData.featured)) ? codebaseData.featured : [];
}

export function saveFeaturedIds(ids, immediate = false) {
  const sliced = (ids || []).slice(0, 6);
  localStorage.setItem(KEYS.FEATURED, JSON.stringify(sliced));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pm_featured_updated', { detail: sliced }));
    window.dispatchEvent(new Event('storage'));
  }
  return saveToCodebase(immediate);
}

export function hasFeaturedIds() {
  return getFeaturedIds().length > 0;
}

// ---------------------------------------------------------------------------
// YouTube Helpers
// ---------------------------------------------------------------------------

/**
 * Extracts 11-char YouTube video ID from various URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://m.youtube.com/watch?v=VIDEO_ID
 * - Raw 11-char ID
 */
export function extractYouTubeId(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // YouTube Shorts: /shorts/VIDEO_ID
  const shortsMatch = trimmed.match(/(?:youtube\.com\/shorts\/)([\w-]{11})/i);
  if (shortsMatch) return shortsMatch[1];

  // Shortened link: youtu.be/VIDEO_ID
  const shortUrlMatch = trimmed.match(/(?:youtu\.be\/)([\w-]{11})/i);
  if (shortUrlMatch) return shortUrlMatch[1];

  // Standard watch or embed: watch?v=VIDEO_ID or /embed/VIDEO_ID or /live/VIDEO_ID
  const standardMatch = trimmed.match(/(?:youtube\.com\/(?:embed\/|v\/|watch\?v=|live\/))([\w-]{11})/i);
  if (standardMatch) return standardMatch[1];

  // Check query parameter ?v=
  try {
    const urlObj = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    const vParam = urlObj.searchParams.get('v');
    if (vParam && /^[\w-]{11}$/.test(vParam)) {
      return vParam;
    }
  } catch {}

  // If user pasted just the 11 character ID
  if (/^[\w-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * Checks if a given YouTube URL is a YouTube Shorts URL.
 */
export function isShortsUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return url.toLowerCase().includes('/shorts/');
}

/**
 * Returns a high-quality YouTube thumbnail image URL for a given video ID.
 */
export function getYouTubeThumbnail(videoId) {
  if (!videoId) return '';
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

// ---------------------------------------------------------------------------
// Unified Video Store (YouTube Full Videos & Shorts)
// ---------------------------------------------------------------------------

export function getAllVideos() {
  const trashIds = new Set(getRecentlyDeletedVideos().map((t) => String(t.id)));
  const permIds = getPermanentlyDeletedVideoIds();
  const restoredIds = getRestoredVideoIds();
  for (const rId of restoredIds) {
    trashIds.delete(String(rId));
    permIds.delete(String(rId));
  }
  const isHidden = (id) => trashIds.has(String(id)) || permIds.has(String(id));

  const raw = localStorage.getItem(KEYS.VIDEOS);
  if (!raw) {
    const initial = (codebaseData && Array.isArray(codebaseData.videos) && codebaseData.videos.length > 0)
      ? codebaseData.videos
      : [];
    const filtered = initial.filter((v) => !isHidden(v.id));
    localStorage.setItem(KEYS.VIDEOS, JSON.stringify(filtered));
    return filtered;
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v) => !isHidden(v.id)) : [];
  } catch {
    return [];
  }
}

export function saveAllVideos(videos, immediate = false) {
  localStorage.setItem(KEYS.VIDEOS, JSON.stringify(videos));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pm_videos_updated', { detail: videos }));
    window.dispatchEvent(new Event('storage'));
  }
  return saveToCodebase(immediate);
}

export function addVideo(item) {
  const all = getAllVideos();
  const videoId = extractYouTubeId(item.youtubeUrl);
  const nowIso = new Date().toISOString();
  const newVideo = {
    id: 'video_' + Date.now(),
    youtubeUrl: item.youtubeUrl.trim(),
    videoId: videoId || '',
    type: item.type === 'shorts' ? 'shorts' : 'full',
    title: (item.title || '').trim(),
    description: (item.description || '').trim(),
    thumbnailUrl: videoId ? getYouTubeThumbnail(videoId) : (item.thumbnailUrl || ''),
    createdAt: nowIso,
    updatedAt: nowIso,
    isModified: true,
  };

  const updated = [newVideo, ...all];
  saveAllVideos(updated);
  return newVideo;
}

export function updateVideo(id, updates) {
  const all = getAllVideos();
  const idx = all.findIndex((v) => String(v.id) === String(id));
  if (idx !== -1) {
    const updatedUrl = updates.youtubeUrl !== undefined ? updates.youtubeUrl.trim() : all[idx].youtubeUrl;
    const videoId = extractYouTubeId(updatedUrl) || all[idx].videoId;

    all[idx] = {
      ...all[idx],
      ...updates,
      youtubeUrl: updatedUrl,
      videoId,
      thumbnailUrl: videoId ? getYouTubeThumbnail(videoId) : all[idx].thumbnailUrl,
      type: updates.type !== undefined ? (updates.type === 'shorts' ? 'shorts' : 'full') : all[idx].type,
      title: updates.title !== undefined ? updates.title.trim() : all[idx].title,
      description: updates.description !== undefined ? updates.description.trim() : all[idx].description,
      isModified: true,
      updatedAt: new Date().toISOString(),
    };

    saveAllVideos(all);
    return all[idx];
  }
  return null;
}

// ---------------------------------------------------------------------------
// Video Recycle Bin (Recently Deleted Videos)
// ---------------------------------------------------------------------------

export function getRecentlyDeletedVideos() {
  let raw = localStorage.getItem(KEYS.VIDEO_TRASH);
  let parsed = null;
  if (raw) {
    try {
      parsed = JSON.parse(raw);
    } catch {}
  }

  if (!Array.isArray(parsed)) {
    parsed = (codebaseData && Array.isArray(codebaseData.videoTrash)) ? codebaseData.videoTrash : [];
  }

  const permIds = getPermanentlyDeletedVideoIds();

  try {
    const now = Date.now();
    const unexpired = [];
    let changed = false;

    for (const item of parsed) {
      if (!item || !item.id || permIds.has(String(item.id))) {
        changed = true;
        continue;
      }
      const deletedTime = item.deletedAt ? new Date(item.deletedAt).getTime() : 0;
      // Auto-purge ONLY if deletedAt is a valid timestamp and 10 days have elapsed
      if (deletedTime > 0 && (now - deletedTime >= TRASH_RETENTION_MS)) {
        recordPermanentVideoDeletion(item.id);
        changed = true;
      } else {
        if (!item.deletedAt) {
          item.deletedAt = new Date().toISOString();
          changed = true;
        }
        unexpired.push(item);
      }
    }

    if (changed) {
      localStorage.setItem(KEYS.VIDEO_TRASH, JSON.stringify(unexpired));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pm_video_trash_updated', { detail: unexpired }));
        window.dispatchEvent(new Event('storage'));
      }
      saveToCodebase();
    }

    return unexpired.sort(
      (a, b) => new Date(b.deletedAt || 0).getTime() - new Date(a.deletedAt || 0).getTime()
    );
  } catch {
    return [];
  }
}

export function saveVideoTrash(items, immediate = false) {
  localStorage.setItem(KEYS.VIDEO_TRASH, JSON.stringify(items));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pm_video_trash_updated', { detail: items }));
    window.dispatchEvent(new Event('storage'));
  }
  return saveToCodebase(immediate);
}

export function deleteVideo(id) {
  unrecordRestoredVideo(id);
  const all = getAllVideos();
  const target = all.find((v) => String(v.id) === String(id));
  if (!target) return;

  // Move to videoTrash with deletedAt timestamp
  const trashItem = {
    ...target,
    deletedAt: new Date().toISOString(),
  };

  const currentTrash = getRecentlyDeletedVideos();
  const updatedTrash = [trashItem, ...currentTrash.filter((t) => String(t.id) !== String(id))];
  saveVideoTrash(updatedTrash);

  // Remove from active videos
  const updated = all.filter((v) => String(v.id) !== String(id));
  saveAllVideos(updated);
}

export function restoreVideo(id) {
  const trash = getRecentlyDeletedVideos();
  const target = trash.find((v) => String(v.id) === String(id));
  if (!target) return null;

  // 1. Mark as restored so server sync never re-trashes it
  recordRestoredVideo(id);

  // 2. Remove from permanent deletions if it was recorded
  const permSet = getPermanentlyDeletedVideoIds();
  if (permSet.has(String(id))) {
    permSet.delete(String(id));
    localStorage.setItem(KEYS.PERMANENT_VIDEO_DELETIONS, JSON.stringify(Array.from(permSet)));
  }

  // 3. Remove from trash
  const updatedTrash = trash.filter((v) => String(v.id) !== String(id));
  saveVideoTrash(updatedTrash);

  // 4. Restore back to active videos
  const { deletedAt, ...activeVideo } = target;
  const currentActive = getAllVideos();
  const updatedActive = [activeVideo, ...currentActive.filter((v) => String(v.id) !== String(id))];
  saveAllVideos(updatedActive);

  return activeVideo;
}

export function permanentlyDeleteVideoTrash(id) {
  unrecordRestoredVideo(id);
  // 1. Record permanent deletion so server sync NEVER resurrects it
  recordPermanentVideoDeletion(id);

  // 2. Remove from video trash
  const trash = getRecentlyDeletedVideos();
  const updatedTrash = trash.filter((v) => String(v.id) !== String(id));
  saveVideoTrash(updatedTrash);

  // 3. Ensure removed from active videos
  const activeVideos = getAllVideos().filter((v) => String(v.id) !== String(id));
  saveAllVideos(activeVideos);
}

export function emptyVideoTrash() {
  const trash = getRecentlyDeletedVideos();
  for (const item of trash) {
    unrecordRestoredVideo(item.id);
    recordPermanentVideoDeletion(item.id);
  }
  saveVideoTrash([]);

  const trashIds = new Set(trash.map((t) => String(t.id)));
  const activeVideos = getAllVideos().filter((v) => !trashIds.has(String(v.id)));
  saveAllVideos(activeVideos);
}


