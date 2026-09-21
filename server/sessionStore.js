/**
 * sessionStore.js
 * Minimal in-memory server-side session store backing an httpOnly cookie.
 * Sessions are lost on server restart — acceptable for a single-admin panel.
 */
import crypto from 'crypto';

const SESSION_COOKIE = 'pm_session';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

const sessions = new Map(); // sessionId -> { email, expiresAt }

export function createSession(email) {
  const sessionId = crypto.randomBytes(32).toString('hex');
  sessions.set(sessionId, { email, expiresAt: Date.now() + SESSION_TTL_MS });
  return sessionId;
}

export function destroySession(sessionId) {
  if (sessionId) sessions.delete(sessionId);
}

export function getSession(sessionId) {
  if (!sessionId) return null;
  const record = sessions.get(sessionId);
  if (!record) return null;
  if (Date.now() > record.expiresAt) {
    sessions.delete(sessionId);
    return null;
  }
  return record;
}

export function cookieOptions(req) {
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: isHttps,
    maxAge: SESSION_TTL_MS,
    path: '/',
  };
}

export { SESSION_COOKIE };

export function requireAuth(req, res, next) {
  const sessionId = req.cookies?.[SESSION_COOKIE];
  const session = getSession(sessionId);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.adminEmail = session.email;
  next();
}
