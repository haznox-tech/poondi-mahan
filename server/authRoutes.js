/**
 * authRoutes.js
 * Server-verified admin authentication: login/logout/session, OTP password reset,
 * and in-session credential change. Replaces the old client-side-only auth gate.
 */
import express from 'express';
import crypto from 'crypto';
import {
  getAdminCredentials,
  verifyAdminPassword,
  setAdminCredentials,
} from './credentialsStore.js';
import { createSession, destroySession, getSession, cookieOptions, SESSION_COOKIE, requireAuth } from './sessionStore.js';
import { sendOtpEmail } from './mailer.js';

const router = express.Router();

const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION_MS = 3 * 60 * 60 * 1000; // 3 hours
const loginAttempts = new Map(); // ip -> { attempts, lockedUntil }

function getLoginState(ip) {
  return loginAttempts.get(ip) || { attempts: 0, lockedUntil: null };
}

function isLockedOut(ip) {
  const state = getLoginState(ip);
  if (state.lockedUntil && Date.now() < state.lockedUntil) return state.lockedUntil;
  if (state.lockedUntil && Date.now() >= state.lockedUntil) {
    loginAttempts.set(ip, { attempts: 0, lockedUntil: null });
  }
  return null;
}

function recordFailedLogin(ip) {
  const state = getLoginState(ip);
  const attempts = state.attempts + 1;
  const lockedUntil = attempts >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_DURATION_MS : null;
  loginAttempts.set(ip, { attempts, lockedUntil });
  return { attempts, lockedUntil };
}

function resetLoginState(ip) {
  loginAttempts.set(ip, { attempts: 0, lockedUntil: null });
}

function clientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || 'local';
}

// ── POST /login ────────────────────────────────────────────────────────────
router.post('/login', (req, res) => {
  const ip = clientIp(req);
  const lockedUntil = isLockedOut(ip);
  if (lockedUntil) {
    return res.json({ ok: false, locked: true, lockoutUntil: lockedUntil });
  }

  const { email, password } = req.body || {};
  const creds = getAdminCredentials();
  const emailMatches = (email || '').trim().toLowerCase() === creds.email;
  const passwordMatches = emailMatches && verifyAdminPassword(password);

  if (!emailMatches || !passwordMatches) {
    const { attempts, lockedUntil: newLockout } = recordFailedLogin(ip);
    return res.json({
      ok: false,
      locked: Boolean(newLockout),
      lockoutUntil: newLockout,
      attemptsRemaining: Math.max(0, MAX_ATTEMPTS - attempts),
    });
  }

  resetLoginState(ip);
  const sessionId = createSession(creds.email);
  res.cookie(SESSION_COOKIE, sessionId, cookieOptions(req));
  res.json({ ok: true, email: creds.email });
});

// ── POST /logout ───────────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  destroySession(req.cookies?.[SESSION_COOKIE]);
  res.clearCookie(SESSION_COOKIE, { path: '/' });
  res.json({ ok: true });
});

// ── GET /session ───────────────────────────────────────────────────────────
router.get('/session', (req, res) => {
  const sessionId = req.cookies?.[SESSION_COOKIE];
  const ip = clientIp(req);
  const lockedUntil = isLockedOut(ip);
  const state = getLoginState(ip);

  const session = getSession(sessionId);
  res.json({
    authenticated: Boolean(session),
    email: session?.email,
    lockoutUntil: lockedUntil,
    attemptsRemaining: Math.max(0, MAX_ATTEMPTS - state.attempts),
  });
});

// ── In-memory OTP state ──────────────────────────────────────────────────
const SERVER_SECRET = crypto.randomBytes(32).toString('hex');
const activeOtps = new Map(); // email -> { hash, salt, expiresAt, attempts, resendAvailableAt }
const verifiedTokens = new Map(); // token -> { email, expiresAt }
const otpRequestCounters = new Map(); // ip_email -> { count, windowStart }

function maskEmail(email) {
  if (!email || !email.includes('@')) return email;
  const [user, domain] = email.split('@');
  if (user.length <= 2) return `${user[0]}*@${domain}`;
  return `${user[0]}${'*'.repeat(Math.min(user.length - 2, 5))}${user.slice(-1)}@${domain}`;
}

// ── POST /send-otp ─────────────────────────────────────────────────────────
router.post('/send-otp', async (req, res) => {
  const email = (req.body?.email || '').trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  // Account-takeover fix: only the currently configured admin email may request an OTP.
  const creds = getAdminCredentials();
  if (email !== creds.email) {
    return res.status(400).json({ error: 'This email is not registered for admin recovery.' });
  }

  const ip = clientIp(req);
  const rateKey = `${ip}_${email}`;
  const now = Date.now();
  const counter = otpRequestCounters.get(rateKey) || { count: 0, windowStart: now };
  if (now - counter.windowStart > 10 * 60 * 1000) {
    counter.count = 1;
    counter.windowStart = now;
  } else {
    counter.count++;
    if (counter.count > 10) {
      const waitMin = Math.ceil((10 * 60 * 1000 - (now - counter.windowStart)) / 60000);
      return res.status(429).json({ error: `Too many OTP requests. Please wait ${waitMin} minute${waitMin !== 1 ? 's' : ''} before trying again.` });
    }
  }
  otpRequestCounters.set(rateKey, counter);

  const existing = activeOtps.get(email);
  if (existing && now < existing.resendAvailableAt) {
    const remainingSec = Math.ceil((existing.resendAvailableAt - now) / 1000);
    return res.status(429).json({ error: `Please wait ${remainingSec} seconds before requesting a new code.` });
  }

  const otpCode = String(crypto.randomInt(100000, 1000000));
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHmac('sha256', SERVER_SECRET).update(otpCode + salt).digest('hex');
  activeOtps.set(email, {
    hash,
    salt,
    expiresAt: now + 10 * 60 * 1000,
    attempts: 0,
    resendAvailableAt: now + 30 * 1000,
  });

  const { emailSent, error } = await sendOtpEmail(email, otpCode);

  res.json({
    ok: true,
    emailSent,
    message: emailSent
      ? "We've sent a 6-digit verification code to your email address."
      : (error ? `Email delivery issue: ${error}. Please check server logs for OTP.` : 'Verification code generated. Please check server logs.'),
    maskedEmail: maskEmail(email),
    resendIn: 30,
  });
});

// ── POST /verify-otp ────────────────────────────────────────────────────────
router.post('/verify-otp', (req, res) => {
  const email = (req.body?.email || '').trim().toLowerCase();
  const otp = String(req.body?.otp || '').trim();

  const record = activeOtps.get(email);
  if (!record) {
    return res.status(400).json({ error: 'No verification code requested for this email. Please request a new code.' });
  }

  const now = Date.now();
  if (now > record.expiresAt) {
    activeOtps.delete(email);
    return res.status(400).json({ error: 'This verification code has expired. Please request a new code.' });
  }

  if (record.attempts >= 5) {
    activeOtps.delete(email);
    return res.status(429).json({ error: 'Too many incorrect attempts. This code has been revoked. Please request a new code.' });
  }

  const candidateHash = crypto.createHmac('sha256', SERVER_SECRET).update(otp + record.salt).digest('hex');
  if (candidateHash !== record.hash) {
    record.attempts++;
    return res.status(400).json({
      error: 'Invalid verification code. Please try again.',
      remainingAttempts: 5 - record.attempts,
    });
  }

  activeOtps.delete(email);
  const verificationToken = crypto.randomBytes(32).toString('hex');
  verifiedTokens.set(verificationToken, { email, expiresAt: now + 15 * 60 * 1000 });

  res.json({ ok: true, message: 'Email verified successfully!', verificationToken });
});

// ── POST /reset-password ────────────────────────────────────────────────────
router.post('/reset-password', (req, res) => {
  const { email, verificationToken, newPassword } = req.body || {};
  const normalizedEmail = (email || '').trim().toLowerCase();

  const tokenRecord = verifiedTokens.get(verificationToken);
  if (!tokenRecord || tokenRecord.email !== normalizedEmail || Date.now() > tokenRecord.expiresAt) {
    return res.status(403).json({ error: 'Unauthorized: You must verify your email with OTP before changing password.' });
  }

  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
  }

  verifiedTokens.delete(verificationToken);
  setAdminCredentials(normalizedEmail, newPassword);
  resetLoginState(clientIp(req));

  res.json({ ok: true, message: 'Password updated successfully!' });
});

// ── POST /change-password (requires active session) ────────────────────────
router.post('/change-password', requireAuth, (req, res) => {
  const { currentPassword, newEmail, newPassword } = req.body || {};

  if (!verifyAdminPassword(currentPassword)) {
    return res.status(403).json({ error: 'Current password is incorrect.' });
  }
  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
  }
  const trimmedEmail = (newEmail || '').trim().toLowerCase();
  if (!trimmedEmail || !trimmedEmail.includes('@')) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  const updated = setAdminCredentials(trimmedEmail, newPassword);
  res.json({ ok: true, email: updated.email });
});

export default router;
