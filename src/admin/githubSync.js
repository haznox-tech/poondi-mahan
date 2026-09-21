/**
 * githubSync.js
 * Directly commits uploaded gallery images and updated galleryData.json
 * to the GitHub repository (divagar199/poondi-mahan) via the GitHub REST API.
 *
 * This triggers automatic Vercel deployments and permanently saves photos
 * into the GitHub repository folder so they are visible across all browsers and devices.
 */

import {
  getAllGalleryItems,
  getFeaturedIds,
  getRecentlyDeletedItems,
  getAllVideos,
  getRecentlyDeletedVideos,
  saveAllGalleryItems,
  compressImageFile,
} from './adminStore.js';

export const GITHUB_REPO_OWNER = 'haznox-tech';
export const GITHUB_REPO_NAME = 'poondi-mahan';
export const GITHUB_BRANCH = 'main';

const GITHUB_TOKEN_KEY = 'pm_github_token';

/**
 * Retrieves the GitHub Personal Access Token from environment or localStorage.
 * No hardcoded fallback — must be configured explicitly.
 */
export function getGitHubToken() {
  if (typeof window === 'undefined') return '';
  const fromEnv = (import.meta.env.VITE_GITHUB_TOKEN || '').trim();
  if (fromEnv) return fromEnv;
  return (localStorage.getItem(GITHUB_TOKEN_KEY) || '').trim();
}

/**
 * Saves the GitHub Personal Access Token in localStorage.
 */
export function setGitHubToken(token) {
  if (typeof window === 'undefined') return;
  const clean = (token || '').trim();
  if (clean) {
    localStorage.setItem(GITHUB_TOKEN_KEY, clean);
  } else {
    localStorage.removeItem(GITHUB_TOKEN_KEY);
  }
}

/**
 * Returns true if a GitHub token is configured.
 */
export function hasGitHubToken() {
  return Boolean(getGitHubToken());
}

/**
 * Converts any UTF-8 string to base64 safely (handles Unicode/Tamil characters).
 */
export function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Converts a base64 string back to UTF-8 text safely (handles Unicode/Tamil characters).
 */
export function base64ToUtf8(base64) {
  try {
    const cleanBase64 = (base64 || '').replace(/\s/g, '');
    const binary = window.atob(cleanBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch (err) {
    console.warn('[githubSync] base64ToUtf8 error:', err);
    return '';
  }
}

/**
 * Tests connection to GitHub repository with a token.
 * Returns { ok: true, login, permissions } or throws an Error.
 */
export async function testGitHubConnection(customToken = null) {
  const token = (customToken || getGitHubToken()).trim();
  if (!token) {
    throw new Error('Please provide a GitHub Personal Access Token.');
  }

  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Invalid GitHub token. Please verify that your token has not expired.');
    }
    if (res.status === 404) {
      throw new Error(
        `Repository "${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}" not found or token lacks 'repo' permission.`
      );
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `GitHub error (HTTP ${res.status})`);
  }

  const data = await res.json();
  const permissions = data.permissions || {};

  if (!permissions.push && !permissions.admin) {
    throw new Error(
      'Token is valid, but does not have write (push) access to this repository. Ensure the "repo" scope is selected.'
    );
  }

  return {
    ok: true,
    fullName: data.full_name,
    permissions,
    defaultBranch: data.default_branch,
  };
}

/**
 * Retrieves the current SHA of a file on GitHub (needed to update/overwrite existing files).
 * Uses cache-busting timestamp and no-store to ensure the SHA is never stale.
 */
export async function getFileSha(path, token) {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/${path}?ref=${GITHUB_BRANCH}&t=${Date.now()}`,
      {
        cache: 'no-store',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );
    if (res.ok) {
      const data = await res.json();
      return data.sha;
    }
  } catch {
    // file doesn't exist
  }
  return null;
}

/**
 * Commits a single file directly to GitHub via the Contents API.
 * Automatically handles 409 conflict retries with fresh SHA.
 */
export async function commitFileToGitHub({ path, contentBase64, commitMessage, token }) {
  let sha = await getFileSha(path, token);
  const body = {
    message: commitMessage,
    content: contentBase64,
    branch: GITHUB_BRANCH,
  };
  if (sha) {
    body.sha = sha;
  }

  let res = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/${path}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  // If 409 conflict occurs (concurrent commit or race condition), retry once with fresh SHA
  if (res.status === 409) {
    await new Promise((r) => setTimeout(r, 400));
    sha = await getFileSha(path, token);
    if (sha) body.sha = sha;
    res = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/${path}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to commit ${path} to GitHub (HTTP ${res.status})`);
  }

  return await res.json();
}

/**
 * Fetches the latest authoritative galleryData.json directly from GitHub.
 * Returns the parsed JSON payload immediately without waiting for Vercel deployment builds.
 */
export async function fetchLatestGalleryDataFromGitHub(token = null) {
  const activeToken = (token || getGitHubToken()).trim();
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
  };
  if (activeToken) {
    headers['Authorization'] = `Bearer ${activeToken}`;
  }
  const cacheBuster = `t=${Date.now()}`;
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/public/data/galleryData.json?ref=${GITHUB_BRANCH}&${cacheBuster}`,
      {
        headers,
        cache: 'no-store',
      }
    );
    if (res.ok) {
      const data = await res.json();
      if (data && data.content) {
        const decodedStr = base64ToUtf8(data.content);
        if (decodedStr) {
          const parsed = JSON.parse(decodedStr);
          return parsed;
        }
      }
    }
  } catch (err) {
    console.warn('[githubSync] fetchLatestGalleryDataFromGitHub error:', err);
  }
  return null;
}

/**
 * Deletes a file from the GitHub repository.
 */
export async function deleteFileFromGitHub(path, commitMessage, token) {
  const sha = await getFileSha(path, token);
  if (!sha) return false;

  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/${path}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: commitMessage,
        sha,
        branch: GITHUB_BRANCH,
      }),
    }
  );

  return res.ok;
}

/**
 * Syncs the entire current gallery state into GitHub's public/data/galleryData.json
 * and src/data/galleryData.json.
 */
export async function syncGalleryDataJsonToGitHub(overrideItems = null, token = null) {
  const activeToken = (token || getGitHubToken()).trim();
  if (!activeToken) {
    throw new Error('No GitHub token configured');
  }

  const items = overrideItems || getAllGalleryItems();
  const payload = {
    items,
    featured: getFeaturedIds(),
    trash: getRecentlyDeletedItems(),
    videos: getAllVideos(),
    videoTrash: getRecentlyDeletedVideos(),
  };

  const jsonStr = JSON.stringify(payload, null, 2);
  const base64Content = utf8ToBase64(jsonStr);

  // Commit public/data/galleryData.json (consumed by client and pre-render)
  await commitFileToGitHub({
    path: 'public/data/galleryData.json',
    contentBase64: base64Content,
    commitMessage: 'feat(gallery): update public/data/galleryData.json via Admin Panel',
    token: activeToken,
  });

  // Commit src/data/galleryData.json (bundled during build)
  await commitFileToGitHub({
    path: 'src/data/galleryData.json',
    contentBase64: base64Content,
    commitMessage: 'feat(gallery): update src/data/galleryData.json via Admin Panel',
    token: activeToken,
  });

  return true;
}

/**
 * Takes an image File, compresses it to WebP, and commits it directly to
 * `public/images/gallery/uploaded/` in the GitHub repository.
 * Returns { path, thumb, fileName, width, height }
 */
export async function commitImageToGitHub(file, token = null) {
  const activeToken = (token || getGitHubToken()).trim();
  if (!activeToken) {
    throw new Error('GitHub Personal Access Token is required to save photos.');
  }

  // 1. Compress image to clean WebP
  const { dataUrl, width, height } = await compressImageFile(file, 1280, 1280, 0.82);
  const base64Content = dataUrl.split(',')[1];

  const baseName = (file.name || 'photo')
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .toLowerCase()
    .slice(0, 45);
  const uniqueSuffix = Math.random().toString(36).slice(2, 8);
  const fileName = `photo_${Date.now()}_${baseName}_${uniqueSuffix}.webp`;
  const githubFilePath = `public/images/gallery/uploaded/${fileName}`;
  const publicWebPath = `/images/gallery/uploaded/${fileName}`;

  // 2. Commit image file to GitHub
  await commitFileToGitHub({
    path: githubFilePath,
    contentBase64: base64Content,
    commitMessage: `feat(gallery): upload image ${fileName}`,
    token: activeToken,
  });

  return {
    path: publicWebPath,
    thumb: publicWebPath,
    fileName,
    width,
    height,
  };
}

/**
 * High-level function: Takes a file and photo metadata, compresses it,
 * commits it directly into `public/images/gallery/uploaded/`, updates `galleryData.json`
 * on GitHub, and triggers a Vercel build.
 */
export async function uploadPhotoAndCommitToGitHub(file, photoMetadata, onProgress = null) {
  const token = getGitHubToken();
  if (!token) {
    throw new Error(
      'GitHub Personal Access Token is required to save photos permanently to your repository. Please configure it in GitHub Settings.'
    );
  }

  if (onProgress) onProgress('Optimizing image & committing to public/images/gallery/uploaded/ on GitHub...');

  const { path: publicWebPath, width, height } = await commitImageToGitHub(file, token);

  if (onProgress) onProgress('Updating gallery metadata on GitHub...');

  // 3. Create the item record with the public GitHub repo path
  const currentItems = getAllGalleryItems();
  const newItem = {
    ...photoMetadata,
    id: 'photo_' + Date.now(),
    src: publicWebPath,
    thumb: publicWebPath,
    width: width || 800,
    height: height || 600,
    isAdmin: true,
    createdAt: new Date().toISOString(),
  };

  const updatedItems = [newItem, ...currentItems];

  // 4. Commit updated JSON to GitHub
  await syncGalleryDataJsonToGitHub(updatedItems, token);

  // 5. Update local store immediately for instant UI feedback in current browser
  saveAllGalleryItems(updatedItems);

  if (onProgress) onProgress('Completed! Saved to public/images/gallery/uploaded.');

  return {
    ok: true,
    item: newItem,
    path: publicWebPath,
  };
}

/**
 * Permanently deletes a photo from GitHub:
 * 1. If it was an uploaded file in public/images/gallery/uploaded/, deletes the file from GitHub.
 * 2. Commits updated galleryData.json to GitHub.
 */
export async function permanentlyDeletePhotoDirectFromGitHub(id, targetItem = null, token = null) {
  const activeToken = (token || getGitHubToken()).trim();
  if (!activeToken) return false;

  let target = targetItem;
  if (!target) {
    const trash = getRecentlyDeletedItems();
    target = trash.find((i) => String(i.id) === String(id));
  }
  if (!target) {
    const all = getAllGalleryItems();
    target = all.find((i) => String(i.id) === String(id));
  }

  // If this was an uploaded photo on disk, delete the file from the GitHub repository
  if (target && target.src && target.src.startsWith('/images/gallery/uploaded/')) {
    const relativePath = 'public' + target.src;
    try {
      await deleteFileFromGitHub(
        relativePath,
        `chore(gallery): delete image file ${target.src}`,
        activeToken
      );
    } catch (err) {
      console.warn('[githubSync] Could not delete file from GitHub:', err);
    }
  }

  // Update galleryData.json on GitHub
  await syncGalleryDataJsonToGitHub(null, activeToken);
  return true;
}
