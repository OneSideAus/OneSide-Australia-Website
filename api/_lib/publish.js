// api/_lib/publish.js
// Adds approved updates to updates.html (newest first) and syncs the 3 newest
// cards to the home page.

import { readRepoFile, writeRepoFile } from './github.js';

export function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Only plain web links may go on the page.
export function safeUrl(url) {
  try {
    const u = new URL(String(url || '').trim());
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : '';
  } catch { return ''; }
}

const TAG_CLASSES = { new: 't-new', update: 't-update', resource: 't-resource', news: 't-news' };
const REGIONS = { National: 'national', VIC: 'vic', NSW: 'nsw', QLD: 'qld', SA: 'sa', WA: 'wa', TAS: 'tas', ACT: 'act', NT: 'nt' };
const SPORTS = {
  AFL: 'afl', Netball: 'netball', Cricket: 'cricket', Soccer: 'soccer', 'Rugby League': 'rugby-league',
  'Rugby Union': 'rugby-union', Basketball: 'basketball', Tennis: 'tennis', Golf: 'golf'
};
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

function sortDate(dateStr) {
  if (!dateStr) return new Date().toISOString().substring(0, 7);
  const lower = dateStr.toLowerCase();
  const year = lower.match(/(\d{4})/)?.[1] || new Date().getFullYear();
  const month = MONTHS.findIndex(m => lower.includes(m));
  return `${year}-${month === -1 ? '01' : String(month + 1).padStart(2, '0')}`;
}

function buildCard(update) {
  const tagClass = TAG_CLASSES[String(update.type || '').toLowerCase()] || 't-reminder';
  const region = REGIONS[update.category] || 'national';
  const sport = SPORTS[update.category] || 'all';
  const displayDate = update.date || new Date().toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });
  const url = safeUrl(update.sourceUrl);
  const sourceLink = url
    ? `<a href="${escapeHtml(url)}" class="uc-source-link" target="_blank" rel="noopener">Read more at ${escapeHtml(update.source || 'source')} ↗</a>`
    : '';
  return `<div class="update-card" data-region="${region}" data-sport="${sport}" data-sortdate="${sortDate(update.date)}"><div class="uc-head" onclick="toggleUpdate(this.closest('.update-card'))"><div class="uc-head-inner"><div class="uc-meta"><span class="uc-tag ${tagClass}">${escapeHtml(update.category)} · ${escapeHtml(update.type)}</span><span class="uc-date">${escapeHtml(displayDate)}</span></div><h5>${escapeHtml(update.title)}</h5></div><span class="uc-chevron">▾</span></div><div class="uc-body"><p>${escapeHtml(update.body)}</p>${sourceLink}</div></div>`;
}

// Every update card sits on its own line, so a card is "one line starting with
// <div class="update-card">". (Matching on closing tags instead used to swallow
// the whole list as one card.)
const CARD_LINE = /^[ \t]*<div class="update-card"[^>]*data-sortdate="([^"]*)".*$/gm;

export const listCards = (text) => [...text.matchAll(CARD_LINE)].map(m => ({ sortdate: m[1], html: m[0].trim(), index: m.index, end: m.index + m[0].length }));

// Replace the card lines in the section that starts at `marker` (up to its
// closing </section>) with `cards`, each indented by `indent`. If the section
// has no cards yet, they go after the line containing `fallbackAnchor`.
// Returns null if the section can't be found.
export function replaceCards(text, marker, cards, indent, fallbackAnchor) {
  const start = text.indexOf(marker);
  const end = start === -1 ? -1 : text.indexOf('</section>', start);
  if (end === -1) return null;
  const section = text.slice(start, end);
  const block = cards.map(c => indent + c.html).join('\n');
  const existing = listCards(section);
  let updated;
  if (existing.length) {
    updated = section.slice(0, existing[0].index) + block + section.slice(existing[existing.length - 1].end);
  } else {
    const anchor = section.indexOf(fallbackAnchor);
    const lineEnd = anchor === -1 ? -1 : section.indexOf('\n', anchor);
    if (lineEnd === -1) return null;
    updated = `${section.slice(0, lineEnd)}\n${block}${section.slice(lineEnd)}`;
  }
  return text.slice(0, start) + updated + text.slice(end);
}

const sortNewestFirst = (cards) => [...cards].sort((a, b) => b.sortdate.localeCompare(a.sortdate));

export const setUpdatesList = (updatesHtml, cards) =>
  replaceCards(updatesHtml, '<div id="updates-list">', sortNewestFirst(cards), '            ', '<div id="updates-list">');

// Home page "UPDATES PREVIEW" section shows the 3 newest cards.
export const syncHomePage = (indexHtml, cards) =>
  replaceCards(indexHtml, '<!-- UPDATES PREVIEW -->', sortNewestFirst(cards).slice(0, 3), '      ', 'See all updates');

export async function publishUpdates(updates) {
  const file = await readRepoFile('updates.html');
  if (!file) throw new Error('Could not fetch updates.html from GitHub');
  const newCards = updates.map(u => ({ sortdate: sortDate(u.date), html: buildCard(u) }));
  const allCards = sortNewestFirst([...newCards, ...listCards(file.text)]);
  const html = setUpdatesList(file.text, allCards);
  if (!html) throw new Error('Could not find the updates list in updates.html');

  const message = updates.length === 1 ? `Add update: ${updates[0].title}` : `Approve all: add ${updates.length} updates`;
  if (!await writeRepoFile('updates.html', html, message, file.sha)) throw new Error('Failed to save updates.html to GitHub');

  // Home page preview: the 3 newest cards. Non-fatal if it fails.
  const index = await readRepoFile('index.html');
  const synced = index && syncHomePage(index.text, allCards);
  if (synced && synced !== index.text) {
    await writeRepoFile('index.html', synced, 'Sync home page with 3 newest updates', index.sha);
  }
}
