// api/review.js
// OneSide Australia — Review page for the weekly updates digest.
//
// Every Approve / Discard / Approve all button in the digest email opens this
// page. It asks for the review password (APPROVE_PASSWORD in Vercel) once;
// after that, this browser can approve and discard for 5 minutes.
//
// Email links only open the page (GET). Nothing changes until a button on the
// page is pressed (POST), so email link scanners can't approve or discard.

import { readPending, writePending, recordDiscarded } from './_lib/pending.js';
import { publishUpdates, escapeHtml, safeUrl } from './_lib/publish.js';
import { passwordConfigured, passwordMatches, unlockedFor, unlockCookie, UNLOCK_SECONDS } from './_lib/auth.js';

const ACTIONS = ['approve', 'discard', 'approve-all'];

function readForm(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  return Object.fromEntries(new URLSearchParams(typeof req.body === 'string' ? req.body : ''));
}

// Approve, discard or approve all. Returns { banner, items } where items is the
// waiting list after the action (GitHub can briefly serve the old copy, so the
// page uses this rather than re-reading).
async function perform(action, id) {
  const { items, sha } = await readPending();
  const result = (ok, text, left = items) => ({ banner: { ok, text }, items: left });

  if (action === 'approve-all') {
    const verified = items.filter(i => i.status === 'verified');
    if (!verified.length) return result(false, 'There are no verified updates waiting.');
    await publishUpdates(verified);
    const left = items.filter(i => i.status !== 'verified');
    const saved = await writePending(left, sha, `Approve all: remove ${verified.length} published update(s) from pending`);
    return result(true, `Published ${verified.length} update${verified.length !== 1 ? 's' : ''}. The website will update in about 30 seconds.${saved ? '' : ' (Warning: the waiting list could not be updated, so these may still show as waiting.)'}`, left);
  }

  const item = items.find(i => i.id === id);
  if (!item) return result(false, 'That update has already been approved or discarded.');
  const remaining = items.filter(i => i.id !== id);

  if (action === 'approve') {
    await publishUpdates([item]);
    const saved = await writePending(remaining, sha, `Remove published update from pending: ${item.title}`);
    return result(true, `Published "${item.title}". The website will update in about 30 seconds.${saved ? '' : ' (Warning: the waiting list could not be updated, so it may still show as waiting.)'}`, remaining);
  }

  await recordDiscarded([item]);
  await writePending(remaining, sha, `Remove discarded update from pending: ${item.title}`);
  return result(true, `Discarded "${item.title}". Future scans won't suggest it again.`, remaining);
}

// ─── Page ────────────────────────────────────────────────────────────────────

const VERB = { approve: 'approve', discard: 'discard', 'approve-all': 'approve all verified updates' };

function hidden(action, id) {
  return `<input type="hidden" name="do" value="${escapeHtml(action)}">${id ? `<input type="hidden" name="id" value="${escapeHtml(id)}">` : ''}`;
}

function actionButtons(item) {
  return `<div class="actions">
      <form method="post" action="/api/review">${hidden('approve', item.id)}<button class="btn primary">${item.status === 'check' ? 'Approve anyway' : 'Approve and publish'}</button></form>
      <form method="post" action="/api/review">${hidden('discard', item.id)}<button class="btn ghost">Discard</button></form>
    </div>`;
}

function itemCard(item, { focus = '', buttons = true } = {}) {
  const url = safeUrl(item.sourceUrl);
  return `<div class="card${item.status === 'check' ? ' check' : ''}${focus ? ' focus' : ''}">
    ${focus ? `<p class="focus-label">${escapeHtml(focus)}</p>` : ''}
    <p class="meta"><span class="tag">${escapeHtml(item.category)}</span> <span class="tag soft">${escapeHtml(item.type)}</span> ${escapeHtml(item.date)}${item.status === 'check' ? ' · <strong>not verified, check the source first</strong>' : ''}</p>
    <h3>${escapeHtml(item.title)}</h3>
    <p>${escapeHtml(item.body)}</p>
    ${url ? `<p class="small">Source: <a href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(item.source || url)}</a></p>` : ''}
    ${item.verifiedQuote ? `<p class="note blue">Verified against source: "${escapeHtml(item.verifiedQuote)}"</p>` : ''}
    ${item.correction ? `<p class="note yellow">Corrected by fact-checker: ${escapeHtml(item.correction)}</p>` : ''}
    ${item.reason ? `<p class="note grey">Why it wasn't verified: ${escapeHtml(item.reason)}</p>` : ''}
    ${item.evidence ? `<p class="note grey">Agent's evidence: "${escapeHtml(item.evidence)}"</p>` : ''}
    ${buttons ? actionButtons(item) : ''}
  </div>`;
}

function lockedView({ action, id, items, error }) {
  const item = items.find(i => i.id === id);
  const what = action === 'approve-all'
    ? `approve all ${items.filter(i => i.status === 'verified').length} verified updates`
    : item ? `${VERB[action]} "${item.title}"` : 'review the waiting updates';
  const label = action === 'approve-all' ? 'Unlock and approve all' : item && ACTIONS.includes(action) ? `Unlock and ${action}` : 'Unlock';
  return `
    <div class="card">
      <h2>Enter your review password</h2>
      <p>To ${escapeHtml(what)}. You won't be asked again for ${UNLOCK_SECONDS / 60} minutes in this browser.</p>
      ${error ? `<p class="banner bad">${escapeHtml(error)}</p>` : ''}
      <form method="post" action="/api/review">
        ${item || action === 'approve-all' ? hidden(action, item?.id) : ''}
        <input type="password" name="password" autocomplete="current-password" placeholder="Password" required autofocus>
        <button class="btn primary">${escapeHtml(label)}</button>
      </form>
    </div>
    ${item ? itemCard(item, { focus: 'This update', buttons: false }) : ''}`;
}

function unlockedView({ items, secondsLeft, banner, action, id }) {
  const verified = items.filter(i => i.status === 'verified');
  const toCheck = items.filter(i => i.status === 'check');
  const focusItem = ACTIONS.includes(action) && action !== 'approve-all' ? items.find(i => i.id === id) : null;
  const others = items.filter(i => i !== focusItem);
  const minutes = Math.max(1, Math.ceil(secondsLeft / 60));

  return `
    <p class="small">Unlocked in this browser for about ${minutes} more minute${minutes !== 1 ? 's' : ''}.</p>
    ${banner ? `<p class="banner ${banner.ok ? 'good' : 'bad'}">${escapeHtml(banner.text)}</p>` : ''}
    ${focusItem ? itemCard(focusItem, { focus: action === 'discard' ? 'Discard this update?' : 'Approve this update?' }) : ''}
    ${action === 'approve-all' && !banner && verified.length ? `<div class="card focus"><p class="focus-label">Approve all?</p><p>This publishes all ${verified.length} verified updates listed below.</p>
      <form method="post" action="/api/review">${hidden('approve-all')}<button class="btn primary">Approve all ${verified.length}</button></form></div>` : ''}
    ${items.length === 0 ? `<div class="card"><h2>All done</h2><p>Nothing is waiting for approval.</p><p><a href="/updates">View the Updates page →</a></p></div>` : ''}
    ${others.filter(i => i.status === 'verified').length ? `<h2>Verified updates waiting (${verified.length})</h2>${others.filter(i => i.status === 'verified').map(i => itemCard(i)).join('')}` : ''}
    ${verified.length > 1 && action !== 'approve-all' ? `<form method="post" action="/api/review" class="all">${hidden('approve-all')}<button class="btn dark">Approve all ${verified.length} verified updates</button></form>` : ''}
    ${others.filter(i => i.status === 'check').length ? `<h2>Worth a manual check (${toCheck.length})</h2><p class="small">The fact-checker couldn't confirm these on the official page. Check the source before approving.</p>${others.filter(i => i.status === 'check').map(i => itemCard(i)).join('')}` : ''}`;
}

function page(body) {
  return `<!DOCTYPE html>
<html lang="en-AU">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<title>Review updates | OneSide Australia</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: 'DM Sans', Arial, sans-serif; background: #f0f4f8; color: #0D1F35; margin: 0; padding: 24px 16px 48px; }
  main { max-width: 680px; margin: 0 auto; }
  header { background: #0D1F35; color: white; border-radius: 12px; padding: 20px 24px; margin-bottom: 20px; }
  header p { margin: 0; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: #F25C44; font-weight: 600; }
  header h1 { margin: 6px 0 0; font-size: 1.3rem; }
  h2 { font-size: 1.05rem; margin: 28px 0 12px; }
  .card h2 { margin-top: 0; }
  .card { background: white; border: 1px solid #e2eaf0; border-left: 3px solid #F25C44; border-radius: 0 10px 10px 0; padding: 18px 20px; margin-bottom: 14px; }
  .card.check { border-left-color: #cdd9e3; border-style: dashed; border-left-style: solid; }
  .card.focus { border: 2px solid #F25C44; border-radius: 10px; }
  .card h3 { font-size: 15px; margin: 6px 0 8px; }
  .card p { font-size: 14px; line-height: 1.6; color: #4A6580; margin: 0 0 10px; }
  .focus-label { font-weight: 600; color: #D24530 !important; text-transform: uppercase; font-size: 12px !important; letter-spacing: 0.05em; }
  .meta { font-size: 12px !important; color: #7A95AA !important; }
  .tag { background: rgba(242,92,68,0.1); color: #D24530; font-size: 11px; font-weight: 600; padding: 2px 9px; border-radius: 100px; text-transform: uppercase; }
  .tag.soft { background: rgba(92,221,154,0.15); color: #3B6D11; }
  .small { font-size: 12px !important; color: #7A95AA !important; }
  .note { font-size: 12px !important; border-radius: 6px; padding: 8px 10px; }
  .note.blue { background: #eef4f8; font-style: italic; }
  .note.yellow { background: #fdf5e1; color: #7A5A12 !important; }
  .note.grey { background: #f5f7f9; }
  a { color: #1B5E8A; }
  .actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 12px; }
  .actions form { margin: 0; }
  .btn { font: inherit; font-size: 14px; font-weight: 600; padding: 10px 20px; border-radius: 8px; cursor: pointer; border: 1px solid #F25C44; }
  .btn.primary { background: #F25C44; color: white; }
  .btn.ghost { background: white; color: #D24530; }
  .btn.dark { background: #0D1F35; border-color: #0D1F35; color: white; width: 100%; padding: 14px; }
  form.all { margin: 4px 0 8px; }
  input[type=password] { font: inherit; font-size: 16px; padding: 10px 12px; border: 1px solid #cdd9e3; border-radius: 8px; width: 100%; margin: 4px 0 12px; }
  .banner { border-radius: 8px; padding: 12px 14px; font-size: 14px; }
  .banner.good { background: #e8f7ee; color: #1f6b3a; }
  .banner.bad { background: #fdecea; color: #a8321f; }
</style>
</head>
<body>
<main>
  <header><p>OneSide Australia</p><h1>Review updates</h1></header>
  ${body}
</main>
</body>
</html>`;
}

function send(res, status, html, cookie) {
  if (cookie) res.setHeader('Set-Cookie', cookie);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(status).send(page(html));
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Referrer-Policy', 'no-referrer');

  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).send('Method not allowed');

  if (!passwordConfigured()) {
    return send(res, 503, `<div class="card"><h2>Review password not set up</h2><p>Approving is switched off until APPROVE_PASSWORD is added in Vercel (Project → Settings → Environment Variables) and the site is redeployed.</p></div>`);
  }

  if (req.method === 'GET') {
    const action = String(req.query.do || '');
    const id = String(req.query.id || '');
    const { items } = await readPending();
    const secondsLeft = unlockedFor(req);
    return send(res, 200, secondsLeft
      ? unlockedView({ items, secondsLeft, action, id })
      : lockedView({ action, id, items }));
  }

  // POST: only accept forms submitted from this site.
  const origin = req.headers.origin;
  let originHost = null;
  try { originHost = origin ? new URL(origin).host : null; } catch { /* "null" or malformed */ }
  if (origin && originHost !== req.headers.host) return res.status(403).send('Forbidden');

  const form = readForm(req);
  const action = ACTIONS.includes(form.do) ? form.do : '';
  const id = String(form.id || '');
  let secondsLeft = unlockedFor(req);
  let cookie = null;

  if (form.password !== undefined) {
    if (!passwordMatches(form.password)) {
      await new Promise(r => setTimeout(r, 1500)); // slow down guessing
      const { items } = await readPending();
      return send(res, 401, lockedView({ action, id, items, error: 'That password is not right. Please try again.' }));
    }
    cookie = unlockCookie();
    secondsLeft = UNLOCK_SECONDS;
  }

  if (!secondsLeft) {
    const { items } = await readPending();
    return send(res, 401, lockedView({ action, id, items, error: 'Your 5 minutes are up. Enter your password again to carry on.' }));
  }

  let banner = null;
  let items = null;
  if (action) {
    try {
      ({ banner, items } = await perform(action, id));
    } catch (e) {
      console.error('Review action failed:', e);
      banner = { ok: false, text: `Something went wrong: ${e.message}` };
    }
  }
  if (!items) ({ items } = await readPending());
  return send(res, 200, unlockedView({ items, secondsLeft, banner }), cookie);
}
