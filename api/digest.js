// api/digest.js
// OneSide Australia — Weekly digest
//
// Runs after every region agent (api/scan.js) has finished. The GitHub Actions
// workflow POSTs all of their results here as {"results": [...]}. This:
//   - purges Updates page cards older than 6 months,
//   - saves the watched-page snapshots for next week's diff,
//   - saves verified updates to _pending-updates.json for "Approve all",
//   - sends one email: what each region found, plus anything drafted but not
//     verified (so a real change is never silently dropped).

import { REGIONS, REGION_KEYS } from './_lib/regions.js';
import { readRepoFile, writeRepoFile } from './_lib/github.js';

export const config = { maxDuration: 60 };

const EMAIL_TO = ['info@onesideaustralia.com.au', 'Angela_Marcon@hotmail.com'];
const EMAIL_FROM = 'OneSide Updates Agent <updates@onesideaustralia.com.au>';

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ─── Purge Updates page cards older than 6 months ────────────────────────────

async function purgeExpiredCards() {
  const file = await readRepoFile('updates.html');
  if (!file) return;

  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - 6);
  const cutoff = `${cutoffDate.getFullYear()}-${String(cutoffDate.getMonth() + 1).padStart(2, '0')}`;

  const cardRegex = /<div class="update-card"[^>]*data-sortdate="([^"]*)"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/g;
  const kept = [];
  let expired = 0;
  let m;
  while ((m = cardRegex.exec(file.text)) !== null) {
    if (m[1] < cutoff) expired++;
    else kept.push({ sortdate: m[1], html: m[0] });
  }
  if (expired === 0) return;

  kept.sort((a, b) => b.sortdate.localeCompare(a.sortdate));
  const listHtml = kept.map(c => '            ' + c.html.trim()).join('\n');
  const purged = file.text.replace(/(<div id="updates-list">)([\s\S]*?)(\n {10}<\/div>)/, `$1\n${listHtml}$3`);
  if (await writeRepoFile('updates.html', purged, `Purge ${expired} update(s) older than 6 months`, file.sha)) {
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
    return `<tr><td style="padding:6px 0;font-size:13px;color:#4A6580;">${escapeHtml(name)}</td><td style="padding:6px 0;font-size:13px;color:#4A6580;text-align:right;">${status}</td></tr>`;
  }).join('');
}

function approveUrlFor(update, approveBaseUrl) {
  const params = ['title', 'body', 'category', 'type', 'date', 'source', 'sourceUrl']
    .map(k => `${k}=${encodeURIComponent(update[k] || '')}`).join('&');
  return `${approveBaseUrl}/api/approve?id=${encodeURIComponent(update.title)}&${params}`;
}

function updateCard(update, approveBaseUrl) {
  const approveUrl = approveUrlFor(update, approveBaseUrl);
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
      <a href="${approveUrl}" style="display:inline-block;background:#F25C44;color:white;font-size:13px;font-weight:600;padding:8px 20px;border-radius:6px;text-decoration:none;">Approve and publish →</a>
    </div>`;
}

function droppedCard(item, approveBaseUrl) {
  return `
    <div style="border:1px dashed #cdd9e3;border-radius:8px;padding:14px 16px;margin-bottom:12px;">
      <p style="font-size:11px;font-weight:600;text-transform:uppercase;color:#7A95AA;margin:0 0 6px;">${escapeHtml(item.regionName)} · not verified</p>
      <p style="font-size:14px;font-weight:600;color:#0D1F35;margin:0 0 6px;">${escapeHtml(item.title)}</p>
      <p style="font-size:13px;color:#4A6580;line-height:1.5;margin:0 0 6px;">${escapeHtml(item.body)}</p>
      ${item.evidence ? `<p style="font-size:12px;color:#4A6580;font-style:italic;margin:0 0 6px;">Agent's evidence: "${escapeHtml(item.evidence)}"</p>` : ''}
      <p style="font-size:12px;color:#7A95AA;margin:0 0 12px;">Why it wasn't verified: ${escapeHtml(item.reason)}${item.sourceUrl ? ` · <a href="${escapeHtml(item.sourceUrl)}" style="color:#1B5E8A;">Check the source</a>` : ''}</p>
      ${item.category && item.type ? `<a href="${approveUrlFor(item, approveBaseUrl)}" style="display:inline-block;background:white;color:#D24530;border:1px solid #F25C44;font-size:12px;font-weight:600;padding:6px 16px;border-radius:6px;text-decoration:none;">Approve anyway →</a>` : ''}
    </div>`;
}

function buildEmailHtml({ results, updates, dropped, approveBaseUrl, scanSecret, sinceDate }) {
  const date = new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const updatesSection = updates.length ? `
    ${updates.map(u => updateCard(u, approveBaseUrl)).join('')}
    <div style="background:white;border-radius:12px;padding:24px;text-align:center;margin-bottom:16px;">
      <p style="font-size:14px;color:#4A6580;margin:0 0 16px;">Happy with everything? Publish all ${updates.length} updates in one click.</p>
      <a href="${approveBaseUrl}/api/approve-all?secret=${encodeURIComponent(scanSecret || '')}" style="display:inline-block;background:#0D1F35;color:white;font-size:14px;font-weight:600;padding:14px 32px;border-radius:8px;text-decoration:none;">Approve all ${updates.length} updates →</a>
    </div>` : `
    <div style="background:white;border-radius:12px;padding:24px;margin-bottom:16px;">
      <p style="font-size:15px;color:#0D1F35;font-weight:600;margin:0 0 8px;">No verified updates this week</p>
      <p style="font-size:14px;color:#4A6580;line-height:1.6;margin:0;">Every agent searched its official sites and news, and nothing new could be confirmed against an official source.${dropped.length ? ' Have a look at the items below to check manually.' : ''}</p>
    </div>`;

  const droppedSection = dropped.length ? `
    <div style="background:white;border-radius:12px;padding:24px;margin-bottom:16px;">
      <p style="font-size:15px;color:#0D1F35;font-weight:600;margin:0 0 6px;">Worth a manual check</p>
      <p style="font-size:13px;color:#7A95AA;line-height:1.5;margin:0 0 16px;">The agents found these but couldn't confirm them word-for-word on the official page (sometimes the site blocks automated checks). Check the source first: these are only published if you click Approve anyway.</p>
      ${dropped.map(d => droppedCard(d, approveBaseUrl)).join('')}
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
    ${droppedSection}
    <p style="font-size:12px;color:#7A95AA;text-align:center;margin-top:24px;">OneSide Australia — Updates Agent · <a href="https://onesideaustralia.com.au/updates" style="color:#F25C44;">View Updates page</a></p>
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

  const updates = deduplicate(results.flatMap(r => r.updates || []));
  const dropped = deduplicate(results.flatMap(r => (r.dropped || []).map(d => ({ ...d, regionName: r.regionName || r.region }))));
  const sinceDate = results.find(r => r.sinceDate)?.sinceDate || 'last week';

  if (updates.length) {
    const pendingFile = await readRepoFile('_pending-updates.json');
    await writeRepoFile('_pending-updates.json', JSON.stringify(updates), 'Save pending updates for approve-all', pendingFile?.sha);
  }

  const failedRegions = REGION_KEYS.filter(k => {
    const r = results.find(x => x.region === k);
    return !r || (r.error && !(r.updates || []).length);
  });

  const subject = updates.length
    ? `OneSide Updates Digest — ${updates.length} update${updates.length !== 1 ? 's' : ''} found`
    : `OneSide Weekly Digest — No verified updates${dropped.length ? `, ${dropped.length} to check` : ''}`;

  const emailResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.RESEND_API_KEY}` },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: EMAIL_TO,
      subject: failedRegions.length ? `${subject} (${failedRegions.length} agent${failedRegions.length !== 1 ? 's' : ''} had problems)` : subject,
      html: buildEmailHtml({
        results, updates, dropped, sinceDate,
        approveBaseUrl: process.env.SITE_URL || 'https://onesideaustralia.com.au',
        scanSecret: process.env.SCAN_SECRET
      })
    })
  });

  if (!emailResponse.ok) {
    const err = await emailResponse.text();
    console.error('Email send failed:', err);
    return res.status(500).json({ error: 'Failed to send email', details: err });
  }

  return res.status(200).json({ message: 'Digest sent', updates: updates.length, toCheck: dropped.length, failedRegions });
}
