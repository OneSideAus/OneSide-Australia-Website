// api/_lib/auth.js
// One password (APPROVE_PASSWORD, set in Vercel) unlocks approving and
// discarding for 5 minutes in that browser, via a signed cookie.

import crypto from 'node:crypto';

export const UNLOCK_SECONDS = 5 * 60;
const COOKIE = 'os_review';

const sha256 = (text) => crypto.createHash('sha256').update(text).digest();

// The signing key comes from the password, so changing the password also
// signs out any open session.
const signingKey = () => sha256(`onesideaustralia-review|${process.env.APPROVE_PASSWORD}`);
const sign = (value) => crypto.createHmac('sha256', signingKey()).update(value).digest('hex');

export const passwordConfigured = () => Boolean(process.env.APPROVE_PASSWORD);

export function passwordMatches(attempt) {
  if (!passwordConfigured() || !attempt) return false;
  return crypto.timingSafeEqual(sha256(String(attempt)), sha256(process.env.APPROVE_PASSWORD));
}

function readCookie(req, name) {
  const header = req.headers.cookie || '';
  const match = header.split(';').map(c => c.trim()).find(c => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

// Seconds left on this browser's unlock, or 0 if locked.
export function unlockedFor(req) {
  if (!passwordConfigured()) return 0;
  const token = readCookie(req, COOKIE);
  const [expires, signature] = String(token || '').split('.');
  if (!expires || !signature) return 0;
  const expected = sign(expires);
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return 0;
  return Math.max(0, Math.floor((Number(expires) - Date.now()) / 1000));
}

export function unlockCookie() {
  const expires = String(Date.now() + UNLOCK_SECONDS * 1000);
  return `${COOKIE}=${expires}.${sign(expires)}; Max-Age=${UNLOCK_SECONDS}; Path=/api/review; HttpOnly; Secure; SameSite=Lax`;
}
