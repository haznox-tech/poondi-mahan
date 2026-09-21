#!/usr/bin/env node
/**
 * Sets the admin login email/password used by the server backend.
 * Never commit the plaintext password anywhere — this only ever writes a
 * bcrypt hash to server/data/admin-credentials.json (gitignored).
 *
 * Usage:
 *   node scripts/set-admin-password.js <email> <password>
 */
import { setAdminCredentials } from '../server/credentialsStore.js';

const [, , email, password] = process.argv;

if (!email || !password) {
  console.error('Usage: node scripts/set-admin-password.js <email> <password>');
  process.exit(1);
}

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('Error: please provide a valid email address.');
  process.exit(1);
}

if (password.length < 8) {
  console.error('Error: password must be at least 8 characters long.');
  process.exit(1);
}

const record = setAdminCredentials(email, password);
console.log(`✅ Admin credentials updated for: ${record.email}`);
