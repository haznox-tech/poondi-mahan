import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import prerender from './scripts/prerender.js'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import nodemailer from 'nodemailer'
import { createRequire } from 'module'

// ---------------------------------------------------------------------------
// Load .env manually so nodemailer can access SMTP credentials in vite server
// ---------------------------------------------------------------------------
const _require = createRequire(import.meta.url);

function getSmtpConfig() {
  const dotenvPath = path.resolve(process.cwd(), '.env');
  const env = {};
  if (fs.existsSync(dotenvPath)) {
    const envLines = fs.readFileSync(dotenvPath, 'utf-8').split('\n');
    for (const line of envLines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx < 1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      if (key) env[key] = val;
    }
  }
  return {
    user: (env.SMTP_USER || process.env.SMTP_USER || '').trim(),
    pass: (env.SMTP_PASS || process.env.SMTP_PASS || '').replace(/\s+/g, ''),
    from: (env.SMTP_FROM || process.env.SMTP_FROM || env.SMTP_USER || process.env.SMTP_USER || '').trim(),
    to: (env.SMTP_TO || process.env.SMTP_TO || env.SMTP_USER || process.env.SMTP_USER || '').trim(),
  };
}

function seoPrerenderPlugin() {
  return {
    name: 'seo-prerender-plugin',
    apply: 'build',
    enforce: 'post',
    async closeBundle() {
      await prerender();
    },
  };
}

/**
 * Gallery File API & Authentication OTP middleware — only active during `vite dev`.
 * Handles upload, delete and rename of admin-uploaded gallery images,
 * and handles server-side cryptographic 6-digit OTP generation, rate-limiting, and verification.
 */
function galleryApiPlugin() {
  const UPLOAD_DIR = path.resolve('./public/images/gallery/uploaded');
  const DATA_FILE = path.resolve('./src/data/galleryData.json');
  const PUBLIC_DATA_FILE = path.resolve('./public/data/galleryData.json');

  // Server-side secure OTP storage (in-memory, HMAC-SHA256 hashed)
  const SERVER_SECRET = crypto.randomBytes(32).toString('hex');
  const activeOtps = new Map(); // email -> { hash, salt, expiresAt, attempts, resendAvailableAt, createdAt }
  const verifiedTokens = new Map(); // token -> { email, expiresAt }
  const requestCounters = new Map(); // ip_email -> { count, windowStart }

  function maskEmail(email) {
    if (!email || !email.includes('@')) return email;
    const [user, domain] = email.split('@');
    if (user.length <= 2) return `${user[0]}*@${domain}`;
    return `${user[0]}${'*'.repeat(Math.min(user.length - 2, 5))}${user.slice(-1)}@${domain}`;
  }

  // Ensure directories exist
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
  const publicDataDir = path.dirname(PUBLIC_DATA_FILE);
  if (!fs.existsSync(publicDataDir)) {
    fs.mkdirSync(publicDataDir, { recursive: true });
  }

  return {
    name: 'gallery-api-plugin',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const parsedUrl = new URL(req.url, 'http://localhost');
        const pathname = parsedUrl.pathname;

        // ── POST /api/auth/send-otp ──────────────────────────────────────
        if (req.method === 'POST' && pathname === '/api/auth/send-otp') {
          try {
            const chunks = [];
            for await (const chunk of req) chunks.push(chunk);
            const body = JSON.parse(Buffer.concat(chunks).toString('utf-8'));
            const email = (body.email || '').trim().toLowerCase();

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!email || !emailRegex.test(email)) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Please enter a valid email address.' }));
              return;
            }

            // Rate limit per IP/email (max 10 per 10m window)
            const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'local';
            const rateKey = `${clientIp}_${email}`;
            const now = Date.now();
            const counter = requestCounters.get(rateKey) || { count: 0, windowStart: now };

            if (now - counter.windowStart > 10 * 60 * 1000) {
              // Window expired — reset counter
              counter.count = 1;
              counter.windowStart = now;
            } else {
              counter.count++;
              if (counter.count > 10) {
                const waitSec = Math.ceil((10 * 60 * 1000 - (now - counter.windowStart)) / 1000);
                const waitMin = Math.ceil(waitSec / 60);
                res.writeHead(429, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: `Too many OTP requests. Please wait ${waitMin} minute${waitMin !== 1 ? 's' : ''} before trying again.` }));
                return;
              }
            }
            requestCounters.set(rateKey, counter);

            // Resend cooldown (30 seconds)
            const existing = activeOtps.get(email);
            if (existing && now < existing.resendAvailableAt) {
              const remainingSec = Math.ceil((existing.resendAvailableAt - now) / 1000);
              res.writeHead(429, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: `Please wait ${remainingSec} seconds before requesting a new code.` }));
              return;
            }

            // Generate cryptographically secure 6-digit OTP (100% server-side)
            const otpCode = String(crypto.randomInt(100000, 1000000));
            const salt = crypto.randomBytes(16).toString('hex');
            const hash = crypto.createHmac('sha256', SERVER_SECRET).update(otpCode + salt).digest('hex');

            activeOtps.set(email, {
              hash,
              salt,
              expiresAt: now + 10 * 60 * 1000, // 10 minutes
              attempts: 0,
              resendAvailableAt: now + 30 * 1000, // 30 seconds cooldown
              createdAt: now,
            });

            // Always log OTP to terminal for debugging
            console.log('\n======================================================');
            console.log(`📧 [OTP EMAIL] Verification code for: ${email}`);
            console.log(`🔑 6-Digit OTP: ${otpCode}`);
            console.log(`⏱️  Valid for 10 minutes | Resend cooldown: 30s`);
            console.log('======================================================\n');

            // ── Send OTP via Gmail SMTP if credentials are configured ──────
            const smtp = getSmtpConfig();
            const smtpUser = smtp.user;
            const smtpPass = smtp.pass;
            const smtpFrom = smtp.from;
            const smtpTo   = email || smtp.to;

            let emailSent = false;
            let emailErrorMsg = '';

            if (smtpUser && smtpPass) {
              try {
                // Use explicit Gmail SMTP settings (port 465, TLS)
                const transporter = nodemailer.createTransport({
                  host: 'smtp.gmail.com',
                  port: 465,
                  secure: true, // TLS
                  auth: {
                    user: smtpUser,
                    pass: smtpPass,
                  },
                  tls: { rejectUnauthorized: false },
                });

                await transporter.sendMail({
                  from: `"Sri Poondi Mahan Admin" <${smtpFrom}>`,
                  to: smtpTo,
                  subject: `Your Admin Login Verification Code — ${otpCode}`,
                  text: [
                    'Sri Poondi Mahan | Attru Swamy Ashramam',
                    '',
                    `Your 6-digit verification code is: ${otpCode}`,
                    '',
                    'This code is valid for 10 minutes.',
                    'Do not share it with anyone.',
                    '',
                    'If you did not request this, please ignore this email.',
                  ].join('\n'),
                  html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a1210;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a1210;padding:32px 16px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#0f1a17;border:1px solid #1e3530;border-radius:16px;overflow:hidden;max-width:480px;width:100%;">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#173F35,#0E2D27);padding:28px 32px;text-align:center;border-bottom:1px solid #1e3530;">
          <p style="margin:0 0 4px;font-size:20px;font-weight:700;color:#D8B86A;letter-spacing:1px;">Sri Poondi Mahan</p>
          <p style="margin:0;font-size:11px;color:#77736A;letter-spacing:3px;text-transform:uppercase;">Attru Swamy Ashramam · Admin Panel</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px 32px 24px;text-align:center;">
          <p style="margin:0 0 8px;font-size:14px;color:#A69B89;">Your verification code is</p>
          <div style="display:inline-block;background:#132920;border:2px solid #B78A3B;border-radius:12px;padding:18px 36px;margin:12px 0;">
            <span style="font-size:38px;font-weight:800;letter-spacing:10px;color:#D8B86A;font-family:'Courier New',monospace;">${otpCode}</span>
          </div>
          <p style="margin:16px 0 0;font-size:12px;color:#77736A;">Valid for <strong style="color:#D8B86A;">10 minutes</strong>. Do not share this code with anyone.</p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#0a1210;border-top:1px solid #1e3530;padding:16px 32px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#3a4a47;">If you did not request this code, you can safely ignore this email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
                });
                emailSent = true;
                console.log(`✅ [OTP EMAIL] Sent to ${smtpTo} successfully.`);
              } catch (mailErr) {
                emailErrorMsg = mailErr.message;
                console.error(`❌ [OTP EMAIL] Failed to send email!`);
                console.error(`   Message : ${mailErr.message}`);
                console.error(`   Code    : ${mailErr.code || 'N/A'}`);
                console.error(`   Response: ${mailErr.response || 'N/A'}`);
              }
            } else {
              console.warn('⚠️  [OTP EMAIL] SMTP credentials not set in .env — OTP shown in terminal only.');
            }

            res.writeHead(200, {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
            });
            res.end(JSON.stringify({
              ok: true,
              emailSent,
              message: emailSent
                ? "We've sent a 6-digit verification code to your email address."
                : (emailErrorMsg ? `Email delivery issue: ${emailErrorMsg}. Please check server terminal for OTP.` : "Verification code generated. Please check your inbox or server terminal."),
              devOtp: process.env.NODE_ENV !== 'production' ? otpCode : undefined,
              maskedEmail: maskEmail(email),
              resendIn: 30,
            }));
          } catch (err) {
            console.error('[auth-api] send-otp error:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Server error sending verification code.' }));
          }
          return;
        }

        // ── POST /api/auth/verify-otp ────────────────────────────────────
        if (req.method === 'POST' && pathname === '/api/auth/verify-otp') {
          try {
            const chunks = [];
            for await (const chunk of req) chunks.push(chunk);
            const body = JSON.parse(Buffer.concat(chunks).toString('utf-8'));
            const email = (body.email || '').trim().toLowerCase();
            const otp = String(body.otp || '').trim();

            const record = activeOtps.get(email);
            if (!record) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'No verification code requested for this email. Please request a new code.' }));
              return;
            }

            const now = Date.now();
            if (now > record.expiresAt) {
              activeOtps.delete(email);
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'This verification code has expired. Please request a new code.' }));
              return;
            }

            if (record.attempts >= 5) {
              activeOtps.delete(email);
              res.writeHead(429, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Too many incorrect attempts. This code has been revoked. Please request a new code.' }));
              return;
            }

            // Verify HMAC-SHA256
            const candidateHash = crypto.createHmac('sha256', SERVER_SECRET).update(otp + record.salt).digest('hex');
            if (candidateHash !== record.hash) {
              record.attempts++;
              const remaining = 5 - record.attempts;
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                error: 'Invalid verification code. Please try again.',
                remainingAttempts: remaining,
              }));
              return;
            }

            // Verification success: delete OTP and generate single-use verificationToken
            activeOtps.delete(email);
            const verificationToken = crypto.randomBytes(32).toString('hex');
            verifiedTokens.set(verificationToken, {
              email,
              expiresAt: now + 15 * 60 * 1000, // token valid for 15 minutes
            });

            res.writeHead(200, {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
            });
            res.end(JSON.stringify({
              ok: true,
              message: 'Email verified successfully!',
              verificationToken,
            }));
          } catch (err) {
            console.error('[auth-api] verify-otp error:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Server error verifying code.' }));
          }
          return;
        }

        // ── POST /api/auth/reset-password ────────────────────────────────
        if (req.method === 'POST' && pathname === '/api/auth/reset-password') {
          try {
            const chunks = [];
            for await (const chunk of req) chunks.push(chunk);
            const body = JSON.parse(Buffer.concat(chunks).toString('utf-8'));
            const { email, verificationToken, newPassword } = body;

            const tokenRecord = verifiedTokens.get(verificationToken);
            if (!tokenRecord || tokenRecord.email !== (email || '').trim().toLowerCase() || Date.now() > tokenRecord.expiresAt) {
              res.writeHead(403, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Unauthorized: You must verify your email with OTP before changing password.' }));
              return;
            }

            if (!newPassword || newPassword.length < 6) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Password must be at least 6 characters long.' }));
              return;
            }

            // Invalidate token immediately so it cannot be reused
            verifiedTokens.delete(verificationToken);

            // Read current data file
            let dataObj = { items: [], featured: [], trash: [], credentials: {} };
            if (fs.existsSync(DATA_FILE)) {
              dataObj = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
            }

            // Hash password matching existing hashPassword implementation
            let hash = 0;
            for (let i = 0; i < newPassword.length; i++) {
              const char = newPassword.charCodeAt(i);
              hash = (hash << 5) - hash + char;
              hash |= 0;
            }
            const passwordHash = hash.toString(16);

            dataObj.credentials = {
              email: (email || '').trim().toLowerCase(),
              passwordHash,
            };

            const formatted = JSON.stringify(dataObj, null, 2);
            fs.writeFileSync(DATA_FILE, formatted, 'utf-8');
            fs.writeFileSync(PUBLIC_DATA_FILE, formatted, 'utf-8');

            res.writeHead(200, {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
            });
            res.end(JSON.stringify({
              ok: true,
              message: 'Password updated successfully!',
            }));
          } catch (err) {
            console.error('[auth-api] reset-password error:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Server error updating password.' }));
          }
          return;
        }

        // ── GET /api/admin/data ──────────────────────────────────────────
        if (req.method === 'GET' && pathname === '/api/admin/data') {
          try {
            let content = null;
            if (fs.existsSync(DATA_FILE)) {
              content = fs.readFileSync(DATA_FILE, 'utf-8');
            } else if (fs.existsSync(PUBLIC_DATA_FILE)) {
              content = fs.readFileSync(PUBLIC_DATA_FILE, 'utf-8');
            }

            if (content) {
              res.writeHead(200, {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
              });
              res.end(content);
            } else {
              res.writeHead(404, {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
              });
              res.end(JSON.stringify({ error: 'galleryData.json not found' }));
            }
          } catch (err) {
            console.error('[admin-api] get data error:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: String(err) }));
          }
          return;
        }

        // ── POST /api/admin/data ─────────────────────────────────────────
        if (req.method === 'POST' && pathname === '/api/admin/data') {
          try {
            const chunks = [];
            for await (const chunk of req) chunks.push(chunk);
            const bodyStr = Buffer.concat(chunks).toString('utf-8');
            const parsed = JSON.parse(bodyStr);

            // Validate that we have valid data before writing
            if (!parsed || !Array.isArray(parsed.items)) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Invalid payload: items array is required' }));
              return;
            }

            // Pretty format JSON for clean git tracking in codebase
            const formatted = JSON.stringify(parsed, null, 2);

            // Write to src/data/galleryData.json (triggers Vite HMR!)
            fs.writeFileSync(DATA_FILE, formatted, 'utf-8');

            // Mirror to public/data/galleryData.json
            fs.writeFileSync(PUBLIC_DATA_FILE, formatted, 'utf-8');

            res.writeHead(200, {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
            });
            res.end(JSON.stringify({ ok: true, count: parsed.items.length, message: 'Saved to codebase' }));
          } catch (err) {
            console.error('[admin-api] save data error:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: String(err) }));
          }
          return;
        }

        // ── POST /api/gallery/upload ──────────────────────────────────────
        if (req.method === 'POST' && req.url === '/api/gallery/upload') {
          try {
            const chunks = [];
            for await (const chunk of req) chunks.push(chunk);
            const body = Buffer.concat(chunks);

            // Parse multipart/form-data manually
            const contentType = req.headers['content-type'] || '';
            const boundaryMatch = contentType.match(/boundary=(.+)/);
            if (!boundaryMatch) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Missing boundary' }));
              return;
            }

            const boundary = '--' + boundaryMatch[1];
            const parts = splitMultipart(body, boundary);

            let fileBuffer = null;
            let fileName = 'photo_' + Date.now() + '.webp';

            for (const part of parts) {
              const { headers, data } = part;
              const dispMatch = headers['content-disposition']?.match(/name="([^"]+)"(?:;\s*filename="([^"]+)")?/);
              if (!dispMatch) continue;
              const fieldName = dispMatch[1];
              const origFileName = dispMatch[2];

              if (fieldName === 'file' && origFileName) {
                fileBuffer = data;
                // Build a safe filename: photo_<timestamp>_<sanitized-original>
                const ext = path.extname(origFileName).toLowerCase() || '.webp';
                const safeName = origFileName
                  .replace(/\.[^/.]+$/, '')
                  .replace(/[^a-zA-Z0-9_-]/g, '-')
                  .slice(0, 60);
                fileName = `photo_${Date.now()}_${safeName}${ext}`;
              }
            }

            if (!fileBuffer) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'No file found in request' }));
              return;
            }

            const destPath = path.join(UPLOAD_DIR, fileName);
            fs.writeFileSync(destPath, fileBuffer);
            const publicPath = `/images/gallery/uploaded/${fileName}`;

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true, path: publicPath, fileName }));
          } catch (err) {
            console.error('[gallery-api] upload error:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: String(err) }));
          }
          return;
        }

        // ── POST /api/gallery/delete ──────────────────────────────────────
        if (req.method === 'POST' && req.url === '/api/gallery/delete') {
          try {
            const chunks = [];
            for await (const chunk of req) chunks.push(chunk);
            const { filePath } = JSON.parse(Buffer.concat(chunks).toString());

            if (!filePath || !filePath.startsWith('/images/gallery/uploaded/')) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Invalid or non-uploaded path' }));
              return;
            }

            const absPath = path.resolve('./public' + filePath);
            // Safety: must be inside the UPLOAD_DIR
            if (!absPath.startsWith(UPLOAD_DIR)) {
              res.writeHead(403, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Forbidden path' }));
              return;
            }

            if (fs.existsSync(absPath)) {
              fs.unlinkSync(absPath);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ ok: true, deleted: filePath }));
            } else {
              // File already missing — still return ok so UI removes the record
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ ok: true, note: 'File not found on disk, record removed' }));
            }
          } catch (err) {
            console.error('[gallery-api] delete error:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: String(err) }));
          }
          return;
        }

        // ── POST /api/gallery/rename ──────────────────────────────────────
        if (req.method === 'POST' && req.url === '/api/gallery/rename') {
          try {
            const chunks = [];
            for await (const chunk of req) chunks.push(chunk);
            const { oldPath, newName } = JSON.parse(Buffer.concat(chunks).toString());

            if (!oldPath || !oldPath.startsWith('/images/gallery/uploaded/')) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Invalid or non-uploaded path' }));
              return;
            }

            const absOld = path.resolve('./public' + oldPath);
            if (!absOld.startsWith(UPLOAD_DIR)) {
              res.writeHead(403, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Forbidden path' }));
              return;
            }

            const ext = path.extname(absOld);
            const safeName = (newName || 'photo_' + Date.now())
              .replace(/[^a-zA-Z0-9_-]/g, '-')
              .slice(0, 80);
            const newFileName = safeName + ext;
            const absNew = path.join(UPLOAD_DIR, newFileName);
            const newPublicPath = `/images/gallery/uploaded/${newFileName}`;

            if (fs.existsSync(absOld)) {
              fs.renameSync(absOld, absNew);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ ok: true, path: newPublicPath }));
            } else {
              res.writeHead(404, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Source file not found' }));
            }
          } catch (err) {
            console.error('[gallery-api] rename error:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: String(err) }));
          }
          return;
        }

        // ── POST /api/cloudinary/delete ───────────────────────────────────
        if (req.method === 'POST' && pathname === '/api/cloudinary/delete') {
          try {
            const chunks = [];
            for await (const chunk of req) chunks.push(chunk);
            const body = JSON.parse(Buffer.concat(chunks).toString('utf-8') || '{}');
            const publicId = (body.publicId || '').trim();

            const dotenvPath = path.resolve(process.cwd(), '.env');
            let envSecret = process.env.CLOUDINARY_API_SECRET || '';
            let envKey = process.env.CLOUDINARY_API_KEY || process.env.VITE_CLOUDINARY_API_KEY || '';
            let envCloud = process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME || '';

            if (fs.existsSync(dotenvPath)) {
              const lines = fs.readFileSync(dotenvPath, 'utf-8').split('\n');
              for (const l of lines) {
                const trimmed = l.trim();
                if (!trimmed || trimmed.startsWith('#')) continue;
                const eq = trimmed.indexOf('=');
                if (eq < 1) continue;
                const k = trimmed.slice(0, eq).trim();
                const v = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
                if (k === 'CLOUDINARY_API_SECRET' && !envSecret) envSecret = v;
                if ((k === 'CLOUDINARY_API_KEY' || k === 'VITE_CLOUDINARY_API_KEY') && !envKey) envKey = v;
                if ((k === 'CLOUDINARY_CLOUD_NAME' || k === 'VITE_CLOUDINARY_CLOUD_NAME') && !envCloud) envCloud = v;
              }
            }

            const cloudName = (body.cloudName || envCloud || '').trim();
            const apiKey = (body.apiKey || envKey || '').trim();
            const apiSecret = (body.apiSecret || envSecret || '').trim();

            if (!publicId) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'publicId is required' }));
              return;
            }

            if (!cloudName || !apiKey || !apiSecret) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Cloudinary credentials missing for deletion' }));
              return;
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
            res.writeHead(cldRes.status || 200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: cldData.result === 'ok', result: cldData.result }));
          } catch (err) {
            console.error('[cloudinary-api] delete error:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: String(err) }));
          }
          return;
        }

        next();
      });
    },
  };
}

/**
 * Minimal multipart/form-data parser.
 * Returns array of { headers: {key: value}, data: Buffer }
 */
function splitMultipart(body, boundary) {
  const boundaryBuf = Buffer.from(boundary);
  const parts = [];
  let start = 0;

  while (start < body.length) {
    const boundaryIdx = indexOf(body, boundaryBuf, start);
    if (boundaryIdx === -1) break;

    const afterBoundary = boundaryIdx + boundaryBuf.length;
    // Check for terminating boundary (--)
    if (body[afterBoundary] === 45 && body[afterBoundary + 1] === 45) break;
    // Skip \r\n after boundary
    const headerStart = afterBoundary + 2;

    // Find double CRLF separating headers from body
    const doubleCRLF = Buffer.from('\r\n\r\n');
    const headerEnd = indexOf(body, doubleCRLF, headerStart);
    if (headerEnd === -1) break;

    const headerStr = body.slice(headerStart, headerEnd).toString();
    const headers = {};
    for (const line of headerStr.split('\r\n')) {
      const colonIdx = line.indexOf(':');
      if (colonIdx !== -1) {
        headers[line.slice(0, colonIdx).trim().toLowerCase()] = line.slice(colonIdx + 1).trim();
      }
    }

    const dataStart = headerEnd + 4; // skip \r\n\r\n
    const nextBoundary = indexOf(body, boundaryBuf, dataStart);
    const dataEnd = nextBoundary !== -1 ? nextBoundary - 2 : body.length; // trim trailing \r\n

    parts.push({ headers, data: body.slice(dataStart, dataEnd) });
    start = nextBoundary !== -1 ? nextBoundary : body.length;
  }

  return parts;
}

/** indexOf for Buffers */
function indexOf(buf, search, fromIndex = 0) {
  for (let i = fromIndex; i <= buf.length - search.length; i++) {
    let found = true;
    for (let j = 0; j < search.length; j++) {
      if (buf[i + j] !== search[j]) { found = false; break; }
    }
    if (found) return i;
  }
  return -1;
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    galleryApiPlugin(),
    seoPrerenderPlugin(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom') || id.includes('react-helmet-async')) {
              return 'vendor-react';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('swiper')) {
              return 'vendor-swiper';
            }
            if (id.includes('i18next')) {
              return 'vendor-i18n';
            }
            return 'vendor-utils';
          }
        },
      },
    },
    chunkSizeWarningLimit: 800,
  },
})

