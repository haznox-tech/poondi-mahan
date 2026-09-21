/**
 * credentialsStore.js
 * Server-only admin credential storage. Never served to the browser.
 * File lives at server/data/admin-credentials.json (gitignored).
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const DATA_DIR = path.resolve(process.cwd(), 'server/data');
const CREDENTIALS_FILE = path.join(DATA_DIR, 'admin-credentials.json');
const SALT_ROUNDS = 12;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
  } else {
    try {
      fs.chmodSync(DATA_DIR, 0o700);
    } catch {
      // best-effort — some filesystems (e.g. certain network mounts) don't support chmod
    }
  }
}

function writeCredentialsFile(record) {
  fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(record, null, 2), { encoding: 'utf-8', mode: 0o600 });
  try {
    fs.chmodSync(CREDENTIALS_FILE, 0o600);
  } catch {
    // best-effort — mode on writeFileSync is only applied when the file is created
  }
}

function generateRandomPassword() {
  return crypto.randomBytes(18).toString('base64url');
}

/**
 * Loads admin credentials, creating them on first run with a random
 * generated password (printed once to the console) if none exist yet.
 */
export function loadOrInitCredentials() {
  ensureDataDir();

  if (fs.existsSync(CREDENTIALS_FILE)) {
    try {
      fs.chmodSync(CREDENTIALS_FILE, 0o600);
    } catch {
      // best-effort
    }
    const raw = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf-8'));
    if (raw && raw.email && raw.passwordHash) return raw;
  }

  const email = (process.env.VITE_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'admin@example.com')
    .trim()
    .toLowerCase();
  const password = generateRandomPassword();
  const passwordHash = bcrypt.hashSync(password, SALT_ROUNDS);
  const record = { email, passwordHash };

  writeCredentialsFile(record);

  console.log('\n======================================================');
  console.log('🔐 [ADMIN SETUP] No admin credentials found — generated one.');
  console.log(`   Email:    ${email}`);
  console.log(`   Password: ${password}`);
  console.log('   Save this now — it will not be shown again.');
  console.log('   Change it any time with: node scripts/set-admin-password.js <email> <password>');
  console.log('======================================================\n');

  return record;
}

export function getAdminCredentials() {
  return loadOrInitCredentials();
}

export function verifyAdminPassword(password) {
  const creds = getAdminCredentials();
  return bcrypt.compareSync(String(password || ''), creds.passwordHash);
}

export function getAdminEmail() {
  return getAdminCredentials().email;
}

export function setAdminCredentials(email, password) {
  ensureDataDir();
  const current = getAdminCredentials();
  const record = {
    email: (email || current.email).trim().toLowerCase(),
    passwordHash: password ? bcrypt.hashSync(String(password), SALT_ROUNDS) : current.passwordHash,
  };
  writeCredentialsFile(record);
  return record;
}
