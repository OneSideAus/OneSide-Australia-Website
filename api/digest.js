// api/digest.js
// OneSide Australia — Weekly digest
//
// Runs after every region agent (api/scan.js) has finished. The GitHub Actions
// workflow POSTs all of their results here as {"results": [...]}. This:
//   - can purge Updates page cards older than 6 months (switched off for now),
//   - saves the watched-page snapshots for next week's diff,
//   - ADDS new finds to the review queue (_pending-updates.json), skipping
//     anything already waiting, published or discarded; items stay until
//     they're approved, discarded or have waited 4 weeks,
//   - sends one email: what each region found, new verified updates, new items
//     worth a manual check, and anything still waiting from earlier weeks.
//     Every button opens the password-protected review page (api/review.js).

import { REGIONS, REGION_KEYS } from './_lib/regions.js';
import { readRepoFile, writeRepoFile, extractPublishedTitles } from './_lib/github.js';
import { listCards, setUpdatesList } from './_lib/publish.js';
import { readPending, writePending, readDiscarded, updateId, titleKey, isExpired, PENDING_MAX_DAYS } from './_lib/pending.js';

export const config = { maxDuration: 60 };

const EMAIL_TO = ['info@onesideaustralia.com.au', 'Angela_Marcon@hotmail.com'];
const EMAIL_FROM = 'OneSide Updates Agent <updates@onesideaustralia.com.au>';

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ─── Purge Updates page cards older than 6 months ────────────────────────────

// Off until Angela decides: it has never actually run (a card-matching bug
// stopped it), and switching it on would remove every card older than 6 months.
const PURGE_OLD_CARDS = false;

async function purgeExpiredCards() {
  if (!PURGE_OLD_CARDS) return;
  const file = await readRepoFile('updates.html');
  if (!file) return;

  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - 6);
  const cutoff = `${cutoffDate.getFullYear()}-${String(cutoffDate.getMonth() + 1).padStart(2, '0')}`;

  const cards = listCards(file.text);
  const kept = cards.filter(c => c.sortdate >= cutoff);
  const expired = cards.length - kept.length;
  if (expired === 0) return;

  const purged = setUpdatesList(file.text, kept);
  if (purged && await writeRepoFile('updates.html', purged, `Purge ${expired} update(s) older than 6 months`, file.sha)) {
    console.log(`Purged ${expired} expired card(s) from updates.html`);
  }
}

// ─── Dedupe across regions (e.g. National and VIC reporting the same change) ─

function deduplicate(updates) {
  const seenTitles = new Set();
  const seenUrls = new Set();
  return updates.filter(u => {
    const titleKey = String(u.title).toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 40);
    const urlKey = `${u.sourceUrl}|${String(u.title).toLowerCase().split(' ').slice(0, 3).join(' ')}`;
    if (seenTitles.has(titleKey) || seenUrls.has(urlKey)) return false;
    seenTitles.add(titleKey);
    seenUrls.add(urlKey);
    return true;
  });
}

// ─── Email ───────────────────────────────────────────────────────────────────

function regionSummaryRows(results) {
  return REGION_KEYS.map(key => {
    const r = results.find(x => x.region === key);
    const name = REGIONS[key].name;
    let status;
    if (!r) status = '<span style="color:#D24530;">Did not run</span>';
    else if (r.error && !(r.updates || []).length) status = `<span style="color:#D24530;">Problem: ${escapeHtml(String(r.error).substring(0, 120))}</span>`;
    else {
      const found = (r.updates || []).length;
      const dropped = (r.dropped || []).length;
      status = found ? `<strong style="color:#0D1F35;">${found} update${found !== 1 ? 's' : ''}</strong>` : 'Nothing new';
      if (dropped) status += ` · ${dropped} to check manually`;
    }
    const unloaded = (r?.watchFailures || []).length;
    if (unloaded) status += ` · <span style="color:#D24530;">${unloaded} watched page${unloaded !== 1 ? 's' : ''} didn't load</span>`;
    return `<tr><td style="padding:6px 0;font-size:13px;color:#4A6580;">${escapeHtml(name)}</td><td style="padding:6px 0;font-size:13px;color:#4A6580;text-align:right;">${status}</td></tr>`;
  }).join('');
}

function reviewUrl(base, action, id) {
  const params = new URLSearchParams({ do: action, ...(id ? { id } : {}) });
  return `${base}/api/review?${params}`;
}

const BTN_PRIMARY = 'display:inline-block;background:#F25C44;color:white;font-size:13px;font-weight:600;padding:8px 20px;border-radius:6px;text-decoration:none;margin-right:8px;';
const BTN_GHOST = 'display:inline-block;background:white;color:#D24530;border:1px solid #F25C44;font-size:13px;font-weight:600;padding:7px 18px;border-radius:6px;text-decoration:none;';

function buttons(item, base, approveLabel) {
  return `<a href="${escapeHtml(reviewUrl(base, 'approve', item.id))}" style="${BTN_PRIMARY}">${approveLabel} →</a><a href="${escapeHtml(reviewUrl(base, 'discard', item.id))}" style="${BTN_GHOST}">Discard</a>`;
}

function updateCard(update, base) {
  const correctionBlock = update.correction ? `
      <p style="font-size:12px;color:#7A5A12;background:#fdf5e1;border-radius:6px;padding:10px 12px;margin:0 0 14px;">
        <span style="text-transform:uppercase;font-weight:600;">Corrected by fact-checker: </span>${escapeHtml(update.correction)}
      </p>` : '';
  const quoteBlock = update.verifiedQuote ? `
      <p style="font-size:12px;color:#4A6580;background:#eef4f8;border-radius:6px;padding:10px 12px;margin:0 0 14px;font-style:italic;">
        <span style="text-transform:uppercase;font-style:normal;font-weight:600;color:#1B5E8A;">Verified against source: </span>"${escapeHtml(update.verifiedQuote)}"
      </p>` : '';

  return `
    <div style="background:#f8fafc;border:1px solid #e2eaf0;border-left:3px solid #F25C44;border-radius:0 8px 8px 0;padding:20px;margin-bottom:16px;">
      <div style="margin-bottom:8px;">
        <span style="background:rgba(242,92,68,0.1);color:#D24530;font-size:11px;font-weight:600;padding:3px 10px;border-radius:100px;text-transform:uppercase;">${escapeHtml(update.category)}</span>
        <span style="background:rgba(92,221,154,0.15);color:#3B6D11;font-size:11px;font-weight:600;padding:3px 10px;border-radius:100px;text-transform:uppercase;">${escapeHtml(update.type)}</span>
        <span style="font-size:12px;color:#7A95AA;">${escapeHtml(update.date)}</span>
      </div>
      <h3 style="font-size:15px;font-weight:600;color:#0D1F35;margin:0 0 8px;">${escapeHtml(update.title)}</h3>
      <p style="font-size:14px;color:#4A6580;line-height:1.6;margin:0 0 14px;">${escapeHtml(update.body)}</p>
      <p style="font-size:12px;color:#7A95AA;margin:0 0 14px;">Source: <a href="${escapeHtml(update.sourceUrl)}" style="color:#1B5E8A;">${escapeHtml(update.source)}</a></p>
      ${quoteBlock}
      ${correctionBlock}
      ${buttons(update, base, 'Approve and publish')}
    </div>`;
}

function droppedCard(item, base) {
  return `
    <div style="border:1px dashed #cdd9e3;border-radius:8px;padding:14px 16px;margin-bottom:12px;">
      <p style="font-size:11px;font-weight:600;text-transform:uppercase;color:#7A95AA;margin:0 0 6px;">${escapeHtml(item.regionName || item.category)} · not verified</p>
      <p style="font-size:14px;font-weight:600;color:#0D1F35;margin:0 0 6px;">${escapeHtml(item.title)}</p>
      <p style="font-size:13px;color:#4A6580;line-height:1.5;margin:0 0 6px;">${escapeHtml(item.body)}</p>
      ${item.evidence ? `<p style="font-size:12px;color:#4A6580;font-style:italic;margin:0 0 6px;">Agent's evidence: "${escapeHtml(item.evidence)}"</p>` : ''}
      <p style="font-size:12px;color:#7A95AA;margin:0 0 12px;">Why it wasn't verified: ${escapeHtml(item.reason)}${item.sourceUrl ? ` · <a href="${escapeHtml(item.sourceUrl)}" style="color:#1B5E8A;">Check the source</a>` : ''}</p>
      ${buttons(item, base, 'Approve anyway')}
    </div>`;
}

function waitingCard(item, base) {
  const weeks = Math.max(1, Math.round((Date.now() - new Date(item.addedAt).getTime()) / (7 * 24 * 60 * 60 * 1000)));
  return `
    <div style="border:1px solid #e2eaf0;border-radius:8px;padding:14px 16px;margin-bottom:12px;">
      <p style="font-size:11px;font-weight:600;text-transform:uppercase;color:#7A95AA;margin:0 0 6px;">${escapeHtml(item.category)} · ${item.status === 'check' ? 'not verified' : 'verified'} · waiting ${weeks} week${weeks !== 1 ? 's' : ''}</p>
      <p style="font-size:14px;font-weight:600;color:#0D1F35;margin:0 0 6px;">${escapeHtml(item.title)}</p>
      <p style="font-size:13px;color:#4A6580;line-height:1.5;margin:0 0 12px;">${escapeHtml(item.body)}</p>
      ${buttons(item, base, item.status === 'check' ? 'Approve anyway' : 'Approve and publish')}
    </div>`;
}

function buildEmailHtml({ results, newVerified, newCheck, waiting, verifiedWaiting, base, sinceDate }) {
  const date = new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const updatesSection = newVerified.length ? `
    ${newVerified.map(u => updateCard(u, base)).join('')}` : `
    <div style="background:white;border-radius:12px;padding:24px;margin-bottom:16px;">
      <p style="font-size:15px;color:#0D1F35;font-weight:600;margin:0 0 8px;">No new verified updates this week</p>
      <p style="font-size:14px;color:#4A6580;line-height:1.6;margin:0;">Every agent searched its official sites and news, and nothing new could be confirmed against an official source.${newCheck.length ? ' Have a look at the items below to check manually.' : ''}</p>
    </div>`;

  const approveAllSection = verifiedWaiting > 1 ? `
    <div style="background:white;border-radius:12px;padding:24px;text-align:center;margin-bottom:16px;">
      <p style="font-size:14px;color:#4A6580;margin:0 0 16px;">Happy with everything? Publish all ${verifiedWaiting} verified updates (including any still waiting from earlier weeks) in one go.</p>
      <a href="${escapeHtml(reviewUrl(base, 'approve-all'))}" style="display:inline-block;background:#0D1F35;color:white;font-size:14px;font-weight:600;padding:14px 32px;border-radius:8px;text-decoration:none;">Approve all ${verifiedWaiting} updates →</a>
    </div>` : '';

  const droppedSection = newCheck.length ? `
    <div style="background:white;border-radius:12px;padding:24px;margin-bottom:16px;">
      <p style="font-size:15px;color:#0D1F35;font-weight:600;margin:0 0 6px;">Worth a manual check</p>
      <p style="font-size:13px;color:#7A95AA;line-height:1.5;margin:0 0 16px;">The agents found these but couldn't confirm them word-for-word on the official page (sometimes the site blocks automated checks, or the source was a news article). Check the source first: these are only published if you click Approve anyway.</p>
      ${newCheck.map(d => droppedCard(d, base)).join('')}
    </div>` : '';

  const waitingSection = waiting.length ? `
    <div style="background:white;border-radius:12px;padding:24px;margin-bottom:16px;">
      <p style="font-size:15px;color:#0D1F35;font-weight:600;margin:0 0 6px;">Still waiting from earlier weeks</p>
      <p style="font-size:13px;color:#7A95AA;line-height:1.5;margin:0 0 16px;">You haven't approved or discarded these yet. They're removed automatically after ${PENDING_MAX_DAYS / 7} weeks.</p>
      ${waiting.map(w => waitingCard(w, base)).join('')}
    </div>` : '';

  const watchFailures = results.flatMap(r => (r.watchFailures || []).map(p => ({ ...p, regionName: r.regionName || r.region })));
  const watchFailuresSection = watchFailures.length ? `
    <div style="background:white;border-radius:12px;padding:24px;margin-bottom:16px;">
      <p style="font-size:15px;color:#0D1F35;font-weight:600;margin:0 0 6px;">Watched pages that didn't load</p>
      <p style="font-size:13px;color:#7A95AA;line-height:1.5;margin:0 0 12px;">These pages couldn't be checked for changes this week. If one keeps appearing, it has probably moved or the site is blocking the agent, so the address needs updating.</p>
      ${watchFailures.map(p => `<p style="font-size:13px;color:#4A6580;margin:0 0 6px;">${escapeHtml(p.regionName)}: <a href="${escapeHtml(p.url)}" style="color:#1B5E8A;">${escapeHtml(p.label)}</a></p>`).join('')}
    </div>` : '';

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:'DM Sans',Arial,sans-serif;background:#f0f4f8;padding:32px 16px;margin:0;">
  <div style="max-width:640px;margin:0 auto;">
    <div style="background:#0D1F35;border-radius:12px;padding:24px;margin-bottom:24px;text-align:center;">
      <p style="font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#F25C44;margin:0 0 8px;">OneSide Australia</p>
      <h1 style="font-size:1.4rem;color:white;margin:0 0 6px;">Weekly Updates Digest</h1>
      <p style="font-size:13px;color:rgba(255,255,255,0.5);margin:0;">${date} · changes since ${escapeHtml(sinceDate)}</p>
    </div>
    <div style="background:white;border-radius:12px;padding:24px;margin-bottom:16px;">
      <p style="font-size:14px;color:#0D1F35;font-weight:600;margin:0 0 10px;">What each agent found</p>
      <table style="width:100%;border-collapse:collapse;">${regionSummaryRows(results)}</table>
    </div>
    ${updatesSection}
    ${approveAllSection}
    ${droppedSection}
    ${waitingSection}
    ${watchFailuresSection}
    <p style="font-size:12px;color:#7A95AA;text-align:center;margin-top:24px;">Approving or discarding asks for your review password once, then stays unlocked for 5 minutes. <a href="${escapeHtml(`${base}/api/review`)}" style="color:#F25C44;">Review everything on one page</a> · <a href="${escapeHtml(`${base}/updates`)}" style="color:#F25C44;">View Updates page</a></p>
  </div>
</body>
</html>`;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const secret = req.headers['x-scan-secret'] || req.query.secret;
  if (secret !== process.env.SCAN_SECRET) return res.status(401).json({ error: 'Unauthorized' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const results = Array.isArray(body?.results) ? body.results : [];
  console.log(`Digest received results from ${results.length} region(s)`);

  await purgeExpiredCards();

  // Save watched-page snapshots for next week (one write, so regions never race).
  const snapshotEntries = results.flatMap(r => Object.entries(r.snapshots || {}));
  if (snapshotEntries.length) {
    const watchedFile = await readRepoFile('_watched-pages.json');
    let state = {};
    try { state = watchedFile ? JSON.parse(watchedFile.text) : {}; } catch { /* start fresh */ }
    for (const [url, snap] of snapshotEntries) state[url] = snap;
    await writeRepoFile('_watched-pages.json', JSON.stringify(state, null, 2), 'Update watched-pages snapshot', watchedFile?.sha);
  }

  const sinceDate = results.find(r => r.sinceDate)?.sinceDate || 'last week';
  const now = new Date().toISOString();

  // This week's finds: verified first, so a duplicate keeps its verified copy.
  const found = deduplicate([
    ...results.flatMap(r => r.updates || []).map(u => ({ ...u, status: 'verified' })),
    ...results.flatMap(r => (r.dropped || []).map(d => ({
      ...d, status: 'check', regionName: r.regionName || r.region,
      category: d.category || REGIONS[r.region]?.category || 'National', type: d.type || 'Update'
    })))
  ]).map(u => ({ ...u, id: updateId(u), addedAt: now }));

  // Merge into the review queue instead of replacing it.
  const [pending, discarded, updatesFile] = await Promise.all([readPending(), readDiscarded(), readRepoFile('updates.html')]);
  const publishedKeys = new Set((updatesFile ? extractPublishedTitles(updatesFile.text) : []).map(titleKey));
  const waiting = pending.items.filter(i => !isExpired(i) && !publishedKeys.has(titleKey(i.title)));
  const seenIds = new Set([...waiting, ...discarded.items].map(i => i.id));
  const seenKeys = new Set([...[...waiting, ...discarded.items].map(i => titleKey(i.title)), ...publishedKeys]);
  const fresh = found.filter(u => !seenIds.has(u.id) && !seenKeys.has(titleKey(u.title)));
  const queue = [...waiting, ...fresh];

  if (JSON.stringify(queue) !== JSON.stringify(pending.items)) {
    await writePending(queue, pending.sha, `Update review queue: ${fresh.length} new, ${waiting.length} still waiting`);
  }

  const newVerified = fresh.filter(u => u.status === 'verified');
  const newCheck = fresh.filter(u => u.status === 'check');
  const verifiedWaiting = queue.filter(u => u.status === 'verified').length;

  const failedRegions = REGION_KEYS.filter(k => {
    const r = results.find(x => x.region === k);
    return !r || (r.error && !(r.updates || []).length);
  });

  const subject = (newVerified.length
    ? `OneSide Updates Digest — ${newVerified.length} new update${newVerified.length !== 1 ? 's' : ''}`
    : `OneSide Weekly Digest — No new verified updates${newCheck.length ? `, ${newCheck.length} to check` : ''}`)
    + (waiting.length ? ` (${waiting.length} still waiting)` : '');

  const emailResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.RESEND_API_KEY}` },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: EMAIL_TO,
      subject: failedRegions.length ? `${subject} (${failedRegions.length} agent${failedRegions.length !== 1 ? 's' : ''} had problems)` : subject,
      html: buildEmailHtml({
        results, newVerified, newCheck, waiting, verifiedWaiting, sinceDate,
        base: process.env.SITE_URL || 'https://onesideaustralia.com.au'
      })
    })
  });

  if (!emailResponse.ok) {
    const err = await emailResponse.text();
    console.error('Email send failed:', err);
    return res.status(500).json({ error: 'Failed to send email', details: err });
  }

  return res.status(200).json({ message: 'Digest sent', newUpdates: newVerified.length, newToCheck: newCheck.length, stillWaiting: waiting.length, failedRegions });
}
