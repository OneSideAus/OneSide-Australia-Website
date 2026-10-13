// api/_lib/pending.js
// The review queue: updates waiting for Angela to approve or discard.
//
//   _pending-updates.json   items waiting for a decision. A scan ADDS to it;
//                           an item only leaves when it's approved, discarded
//                           or has waited longer than PENDING_MAX_DAYS.
//   _discarded-updates.json items Angela discarded, so scans never suggest
//                           them again.

import crypto from 'node:crypto';
import { readRepoFile, writeRepoFile } from './github.js';

export const PENDING_FILE = '_pending-updates.json';
export const DISCARDED_FILE = '_discarded-updates.json';
export const PENDING_MAX_DAYS = 28;
const DISCARDED_KEEP = 500;

// Loose title match, so "WA: Interstate WWC bans..." and "WA: Interstate WWC
// Bans..." count as the same update.
export const titleKey = (title) => String(title || '').toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 40);

export function updateId(update) {
  return crypto.createHash('sha256')
    .update(`${titleKey(update.title)}|${String(update.sourceUrl || '').trim().toLowerCase()}`)
    .digest('hex').substring(0, 12);
}

function parseList(file) {
  if (!file) return [];
  try {
    const list = JSON.parse(file.text);
    return Array.isArray(list) ? list : [];
  } catch { return []; }
}

// Older pending files held plain updates with no id/status; upgrade them.
function normalise(item) {
  return {
    ...item,
    id: item.id || updateId(item),
    status: item.status || 'verified',
    addedAt: item.addedAt || new Date().toISOString()
  };
}

export async function readPending() {
  const file = await readRepoFile(PENDING_FILE);
  return { items: parseList(file).map(normalise), sha: file?.sha };
}

export async function writePending(items, sha, message) {
  return writeRepoFile(PENDING_FILE, JSON.stringify(items, null, 2), message, sha);
}

export async function readDiscarded() {
  const file = await readRepoFile(DISCARDED_FILE);
  return { items: parseList(file), sha: file?.sha };
}

export async function recordDiscarded(newItems) {
  const { items, sha } = await readDiscarded();
  const entries = newItems.map(u => ({ id: u.id, title: u.title, sourceUrl: u.sourceUrl || '', discardedAt: new Date().toISOString() }));
  const kept = [...entries, ...items].slice(0, DISCARDED_KEEP);
  return writeRepoFile(DISCARDED_FILE, JSON.stringify(kept, null, 2), `Discard update: ${newItems.map(u => u.title).join('; ').substring(0, 120)}`, sha);
}

export const isExpired = (item, now = Date.now()) =>
  now - new Date(item.addedAt).getTime() > PENDING_MAX_DAYS * 24 * 60 * 60 * 1000;
