/**
 * galleryRoutes.js
 * Gallery content persistence, image upload/delete/rename, and Cloudinary
 * asset deletion. All state-changing routes require an authenticated session.
 */
import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
import { requireAuth } from './sessionStore.js';

const router = express.Router();

const UPLOAD_DIR = path.resolve(process.cwd(), 'public/images/gallery/uploaded');
const DATA_FILE = path.resolve(process.cwd(), 'src/data/galleryData.json');
const PUBLIC_DATA_FILE = path.resolve(process.cwd(), 'public/data/galleryData.json');
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(path.dirname(PUBLIC_DATA_FILE))) {
  fs.mkdirSync(path.dirname(PUBLIC_DATA_FILE), { recursive: true });
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext) || !ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new Error('Only JPG, PNG, WEBP, and GIF images are allowed.'));
    }
    cb(null, true);
  },
});

function stripCredentials(data) {
  if (!data || typeof data !== 'object') return data;
  const { credentials, ...rest } = data;
  return rest;
}

// ── GET /admin/data ──────────────────────────────────────────────────────
router.get('/admin/data', (req, res) => {
  try {
    const filePath = fs.existsSync(DATA_FILE) ? DATA_FILE : (fs.existsSync(PUBLIC_DATA_FILE) ? PUBLIC_DATA_FILE : null);
    if (!filePath) {
      return res.status(404).json({ error: 'galleryData.json not found' });
    }
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json(stripCredentials(content));
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── POST /admin/data (auth required) ─────────────────────────────────────
router.post('/admin/data', requireAuth, (req, res) => {
  try {
    const body = req.body || {};
    if (!Array.isArray(body.items)) {
      return res.status(400).json({ error: 'Invalid payload: items array is required' });
    }
    // Whitelist fields — never accept a client-supplied `credentials` field.
    const payload = {
      items: body.items,
      featured: Array.isArray(body.featured) ? body.featured : [],
      trash: Array.isArray(body.trash) ? body.trash : [],
      videos: Array.isArray(body.videos) ? body.videos : [],
      videoTrash: Array.isArray(body.videoTrash) ? body.videoTrash : [],
    };
    const formatted = JSON.stringify(payload, null, 2);
    fs.writeFileSync(DATA_FILE, formatted, 'utf-8');
    fs.writeFileSync(PUBLIC_DATA_FILE, formatted, 'utf-8');
    res.json({ ok: true, count: payload.items.length, message: 'Saved to codebase' });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── POST /gallery/upload (auth required) ─────────────────────────────────
router.post('/gallery/upload', requireAuth, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file found in request' });
    }
    const ext = path.extname(req.file.originalname).toLowerCase();
    const safeName = req.file.originalname
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '-')
      .slice(0, 60);
    const fileName = `photo_${Date.now()}_${crypto.randomBytes(4).toString('hex')}_${safeName}${ext}`;
    fs.writeFileSync(path.join(UPLOAD_DIR, fileName), req.file.buffer);
    res.json({ ok: true, path: `/images/gallery/uploaded/${fileName}`, fileName });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

function resolveUploadedPath(publicPath) {
  if (!publicPath || !publicPath.startsWith('/images/gallery/uploaded/')) return null;
  const absPath = path.resolve(path.join(process.cwd(), 'public', publicPath));
  const relative = path.relative(UPLOAD_DIR, absPath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) return null;
  return absPath;
}

// ── POST /gallery/delete (auth required) ──────────────────────────────────
router.post('/gallery/delete', requireAuth, (req, res) => {
  try {
    const absPath = resolveUploadedPath(req.body?.filePath);
    if (!absPath) {
      return res.status(400).json({ error: 'Invalid or non-uploaded path' });
    }
    if (fs.existsSync(absPath)) {
      fs.unlinkSync(absPath);
      return res.json({ ok: true, deleted: req.body.filePath });
    }
    res.json({ ok: true, note: 'File not found on disk, record removed' });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── POST /gallery/rename (auth required) ───────────────────────────────────
router.post('/gallery/rename', requireAuth, (req, res) => {
  try {
    const absOld = resolveUploadedPath(req.body?.oldPath);
    if (!absOld) {
      return res.status(400).json({ error: 'Invalid or non-uploaded path' });
    }
    const ext = path.extname(absOld).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return res.status(400).json({ error: 'Unsupported file extension' });
    }
    const safeName = (req.body?.newName || 'photo_' + Date.now())
      .replace(/[^a-zA-Z0-9_-]/g, '-')
      .slice(0, 80);
    const newFileName = safeName + ext;
    const absNew = path.join(UPLOAD_DIR, newFileName);

    if (!fs.existsSync(absOld)) {
      return res.status(404).json({ error: 'Source file not found' });
    }
    fs.renameSync(absOld, absNew);
    res.json({ ok: true, path: `/images/gallery/uploaded/${newFileName}` });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── POST /cloudinary/delete (auth required) ────────────────────────────────
router.post('/cloudinary/delete', requireAuth, async (req, res) => {
  try {
    const publicId = (req.body?.publicId || '').trim();
    if (!publicId) {
      return res.status(400).json({ error: 'publicId is required' });
    }

    const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME || '').trim();
    const apiKey = (process.env.CLOUDINARY_API_KEY || process.env.VITE_CLOUDINARY_API_KEY || '').trim();
    const apiSecret = (process.env.CLOUDINARY_API_SECRET || '').trim();

    if (!cloudName || !apiKey || !apiSecret) {
      return res.status(400).json({ error: 'Cloudinary credentials are not configured on the server.' });
    }

    const timestamp = Math.round(Date.now() / 1000);
    const toSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(toSign).digest('hex');

    const params = new URLSearchParams();
    params.append('public_id', publicId);
    params.append('api_key', apiKey);
    params.append('timestamp', String(timestamp));
    params.append('signature', signature);

    const cldRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const cldData = await cldRes.json();
    res.status(cldRes.status || 200).json({ ok: cldData.result === 'ok', result: cldData.result });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
