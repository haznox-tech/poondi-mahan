/**
 * server/index.js
 * Persistent Express backend — serves the built SPA and the admin API.
 * Works standalone (PM2) or behind cPanel's "Setup Node.js App" (Passenger).
 */
import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import authRoutes from './authRoutes.js';
import galleryRoutes from './galleryRoutes.js';
import { loadOrInitCredentials } from './credentialsStore.js';

loadOrInitCredentials();

const app = express();
const DIST_DIR = path.resolve(process.cwd(), 'dist');

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api', galleryRoutes);

if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR, { index: false }));
  app.get(/^(?!\/api\/).*/, (req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
} else {
  console.warn(`⚠️  ${DIST_DIR} not found — run "npm run build" before starting the server in production.`);
}

// Catches multer/fileFilter errors and any other route errors as clean JSON
// instead of Express's default HTML error page (which leaks stack traces).
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err) {
    console.error('[server] Unhandled error:', err.message);
    res.status(400).json({ error: err.message || 'Request failed.' });
    return;
  }
  next();
});

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '127.0.0.1';
app.listen(PORT, HOST, () => {
  console.log(`✅ Server listening on http://${HOST}:${PORT}`);
});
