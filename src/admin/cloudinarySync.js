/**
 * Cloudinary Media Storage Service
 * Handles client-side direct uploads, URL transformations, thumbnail generation,
 * and permanent asset deletion for Sri Poondi Mahan Gallery.
 */

import {
  getAllGalleryItems,
  saveAllGalleryItems,
  compressImageFile,
  flushToCodebase,
} from './adminStore.js';
import { syncGalleryDataJsonToGitHub, hasGitHubToken } from './githubSync.js';

// LocalStorage Keys
const STORAGE_KEYS = {
  CLOUD_NAME: 'pm_cloudinary_cloud_name',
  UPLOAD_PRESET: 'pm_cloudinary_upload_preset',
};

/**
 * Retrieves Cloudinary configuration from environment variables or localStorage.
 * Only cloud name + unsigned upload preset are needed client-side — the API
 * key/secret used for deletion live on the server only (server/galleryRoutes.js).
 */
export function getCloudinaryConfig() {
  if (typeof window === 'undefined') {
    return { cloudName: '', uploadPreset: '' };
  }

  const cloudName =
    (import.meta.env?.VITE_CLOUDINARY_CLOUD_NAME || '').trim() ||
    (localStorage.getItem(STORAGE_KEYS.CLOUD_NAME) || '').trim();

  let uploadPreset =
    (import.meta.env?.VITE_CLOUDINARY_UPLOAD_PRESET || '').trim() ||
    (localStorage.getItem(STORAGE_KEYS.UPLOAD_PRESET) || '').trim();

  // Auto-normalize if user typed poondi-gallery with hyphen
  if (uploadPreset === 'poondi-gallery') {
    uploadPreset = 'poondi_gallery';
  }

  return { cloudName, uploadPreset };
}

/**
 * Saves Cloudinary configuration to localStorage.
 */
export function setCloudinaryConfig({ cloudName, uploadPreset }) {
  if (typeof window === 'undefined') return;

  if (cloudName !== undefined) {
    if (cloudName) localStorage.setItem(STORAGE_KEYS.CLOUD_NAME, cloudName.trim());
    else localStorage.removeItem(STORAGE_KEYS.CLOUD_NAME);
  }

  if (uploadPreset !== undefined) {
    if (uploadPreset) localStorage.setItem(STORAGE_KEYS.UPLOAD_PRESET, uploadPreset.trim());
    else localStorage.removeItem(STORAGE_KEYS.UPLOAD_PRESET);
  }
}

/**
 * Checks if Cloudinary is configured with at least cloud name and upload preset.
 */
export function hasCloudinaryConfig() {
  const { cloudName, uploadPreset } = getCloudinaryConfig();
  return Boolean(cloudName && uploadPreset);
}

/**
 * Generates an optimized Cloudinary thumbnail URL with automatic format and quality.
 */
export function getCloudinaryThumbUrl(url, width = 600, height = 450) {
  if (!url || !url.includes('res.cloudinary.com')) {
    return url;
  }

  // Insert Cloudinary transformation before upload path
  const transform = `c_fill,w_${width},h_${height},g_auto,q_auto,f_auto`;
  if (url.includes('/upload/')) {
    return url.replace('/upload/', `/upload/${transform}/`);
  }
  return url;
}

/**
 * Generates an optimized Cloudinary full-display URL with responsive quality and webp/avif.
 */
export function getCloudinaryDisplayUrl(url, maxWidth = 1920) {
  if (!url || !url.includes('res.cloudinary.com')) {
    return url;
  }

  const transform = `c_limit,w_${maxWidth},q_auto,f_auto`;
  if (url.includes('/upload/')) {
    return url.replace('/upload/', `/upload/${transform}/`);
  }
  return url;
}

/**
 * Tests the Cloudinary credentials by uploading a 1x1 transparent GIF ping.
 */
export async function testCloudinaryConnection(cloudName, uploadPreset) {
  const cn = (cloudName || '').trim();
  let up = (uploadPreset || '').trim();

  if (!cn) throw new Error('Cloud Name is required.');
  if (!up) throw new Error('Upload Preset is required.');

  // 1x1 transparent PNG data URI
  const test1px =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

  async function tryUpload(presetToUse) {
    const formData = new FormData();
    formData.append('file', test1px);
    formData.append('upload_preset', presetToUse);
    formData.append('folder', 'poondi-mahan/connection-test');

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cn}/image/upload`, {
      method: 'POST',
      body: formData,
    });
    return res.json();
  }

  let data = await tryUpload(up);
  if (data.error?.message === 'Upload preset not found' && up.includes('-')) {
    const altPreset = up.replace(/-/g, '_');
    const altData = await tryUpload(altPreset);
    if (!altData.error) {
      data = altData;
      up = altPreset;
    }
  }

  if (data.error) {
    throw new Error(data.error.message || 'Failed to upload test image to Cloudinary.');
  }

  return {
    ok: true,
    publicId: data.public_id,
    url: data.secure_url,
    effectivePreset: up,
  };
}

/**
 * Uploads an image File or blob to Cloudinary.
 * Compresses the image on canvas before upload to ensure fast transmission.
 *
 * @param {File|Blob} file - The image file to upload
 * @param {Object} [options]
 * @param {string} [options.folder='poondi-mahan/gallery']
 * @param {Function} [options.onProgress]
 * @returns {Promise<{ secure_url: string, public_id: string, width: number, height: number, format: string }>}
 */
export async function uploadImageToCloudinary(file, options = {}) {
  const { cloudName, uploadPreset } = getCloudinaryConfig();

  if (!cloudName || !uploadPreset) {
    throw new Error(
      'Cloudinary is not configured. Please set your Cloud Name and Upload Preset in Cloudinary Settings.'
    );
  }

  const folder = options.folder || 'poondi-mahan/gallery';
  const onProgress = options.onProgress;

  if (onProgress) onProgress('Optimizing image before Cloudinary upload...');

  // Compress image on canvas to WebP with max 1600px dimension
  let uploadPayload = file;
  try {
    const { dataUrl } = await compressImageFile(file, 1600, 1600, 0.86);
    uploadPayload = dataUrl;
  } catch {
    uploadPayload = file;
  }

  if (onProgress) onProgress('Uploading image to Cloudinary CDN...');

  const formData = new FormData();
  formData.append('file', uploadPayload);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    const errorMsg = data.error?.message || 'Cloudinary upload failed.';
    throw new Error(errorMsg);
  }

  return {
    secure_url: data.secure_url,
    public_id: data.public_id,
    width: data.width,
    height: data.height,
    format: data.format,
    created_at: data.created_at,
  };
}

/**
 * Extracts the Cloudinary public_id from either a full Cloudinary URL or a raw ID.
 */
export function extractCloudinaryPublicId(urlOrId) {
  if (!urlOrId || typeof urlOrId !== 'string') return null;
  const clean = urlOrId.trim();
  if (!clean.includes('res.cloudinary.com')) {
    return clean.replace(/^\//, '');
  }
  try {
    const uploadIdx = clean.indexOf('/upload/');
    if (uploadIdx === -1) return null;
    let pathPart = clean.slice(uploadIdx + '/upload/'.length);
    const segments = pathPart.split('/');
    const cleanSegments = [];
    let pastTransformations = false;
    for (const seg of segments) {
      if (!pastTransformations) {
        if (/^v\d+$/.test(seg)) {
          pastTransformations = true;
          continue;
        }
        if (seg.includes(',') || /^[a-z]_[a-z0-9]/i.test(seg)) {
          continue;
        }
        pastTransformations = true;
      }
      cleanSegments.push(seg);
    }
    const fullPathWithExt = cleanSegments.join('/');
    const lastDot = fullPathWithExt.lastIndexOf('.');
    return lastDot !== -1 ? fullPathWithExt.slice(0, lastDot) : fullPathWithExt;
  } catch {
    return null;
  }
}

/**
 * Deletes an image from Cloudinary using its public_id or full URL.
 * Always routes through the authenticated server endpoint — the API secret
 * never leaves the server, and the request is only honored for a logged-in
 * admin session.
 */
export async function deleteImageFromCloudinary(publicIdOrUrl) {
  const publicId = extractCloudinaryPublicId(publicIdOrUrl);
  if (!publicId) return false;

  try {
    const res = await fetch('/api/cloudinary/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ publicId }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data.ok || data.result === 'ok');
  } catch (err) {
    console.warn('[cloudinarySync] Cloudinary delete failed:', err);
    return false;
  }
}

/**
 * High-level orchestration:
 * 1. Uploads photo directly to Cloudinary
 * 2. Computes optimized display URL and thumbnail
 * 3. Saves item to local gallery store
 * 4. Syncs updated galleryData.json to GitHub repository & server codebase
 */
export async function uploadPhotoAndSyncCloudinary(file, photoMetadata, onProgress = null) {
  // 1. Upload to Cloudinary
  const uploadResult = await uploadImageToCloudinary(file, { onProgress });

  const secureUrl = uploadResult.secure_url;
  const publicId = uploadResult.public_id;
  const thumbUrl = getCloudinaryThumbUrl(secureUrl, 600, 450);

  if (onProgress) onProgress('Saving gallery catalog...');

  const currentItems = getAllGalleryItems();
  const newItem = {
    ...photoMetadata,
    id: 'photo_' + Date.now(),
    src: secureUrl,
    thumb: thumbUrl,
    cloudinaryPublicId: publicId,
    width: uploadResult.width || 800,
    height: uploadResult.height || 600,
    isAdmin: true,
    createdAt: new Date().toISOString(),
  };

  const updatedItems = [newItem, ...currentItems];

  // 2. Save to local storage for immediate UI update
  saveAllGalleryItems(updatedItems);

  // 3. Flush to local dev server codebase
  await flushToCodebase();

  // 4. Sync to GitHub repository if PAT is available
  if (hasGitHubToken()) {
    if (onProgress) onProgress('Synchronizing catalog to GitHub...');
    try {
      await syncGalleryDataJsonToGitHub(updatedItems);
    } catch (err) {
      console.warn('[cloudinarySync] GitHub sync failed:', err);
    }
  }

  if (onProgress) onProgress('Completed successfully!');

  return {
    ok: true,
    item: newItem,
    url: secureUrl,
  };
}
