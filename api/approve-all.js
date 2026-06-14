// api/approve-all.js
// OneSide Australia — Approve All endpoint
// Reads _pending-updates.json from GitHub, publishes all updates to updates.html,
// syncs top 3 to index.html, then deletes the pending file.

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).send('Method not allowed');

  const secret = req.query.secret;
  if (!secret || secret !== process.env.SCAN_SECRET) {
    return res.status(401).send('Unauthorized');
  }

  const owner = 'OneSideAus';
  const repo  = 'OneSide-Australia-Website';
  const headers = {
    'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
    'User-Agent': 'OneSide-Updates-Agent'
  };

  try {
    // ── 1. Fetch pending updates ─────────────────────────────────────────────
    const pendingRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/_pending-updates.json`,
      { headers }
    );
    if (!pendingRes.ok) return res.status(404).send(renderPage('error', 'No pending updates found. The digest may have already been approved.'));
    const pendingData = await pendingRes.json();
    const pendingSha  = pendingData.sha;
    const updates     = JSON.parse(Buffer.from(pendingData.content, 'base64').toString('utf-8'));

    if (!updates.length) return res.status(200).send(renderPage('error', 'Pending updates list is empty.'));

    // ── 2. Fetch updates.html ────────────────────────────────────────────────
    const updatesRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/updates.html`,
      { headers }
    );
    if (!updatesRes.ok) throw new Error('Could not fetch updates.html from GitHub');
    const updatesData = await updatesRes.json();
    const updatesSha  = updatesData.sha;
    let updatesHtml   = Buffer.from(updatesData.content, 'base64').toString('utf-8');

    // ── 3. Build and insert all cards at once ────────────────────────────────
    const insertMarker = '<div id="updates-list">';
    if (!updatesHtml.includes(insertMarker)) throw new Error('Could not find updates list in updates.html');

    const allNewCards = updates.map(update => {
      const tagClass    = getTagClass(update.type);
      const regionAttr  = getCategoryRegion(update.category);
      const sportAttr   = getCategorySport(update.category);
      const sortDate    = getSortDate(update.date);
      const displayDate = update.date || new Date().toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });
      const sourceLink  = update.sourceUrl
        ? `<a href="${update.sourceUrl}" class="uc-source-link" target="_blank" rel="noopener">Read more at ${escapeHtml(update.source || 'source')} ↗</a>`
        : '';
      return `            <div class="update-card" data-region="${regionAttr}" data-sport="${sportAttr}" data-sortdate="${sortDate}"><div class="uc-head" onclick="toggleUpdate(this.closest('.update-card'))"><div class="uc-head-inner"><div class="uc-meta"><span class="uc-tag ${tagClass}">${escapeHtml(update.category)} · ${escapeHtml(update.type)}</span><span class="uc-date">${escapeHtml(displayDate)}</span></div><h5>${escapeHtml(update.title)}</h5></div><span class="uc-chevron">▾</span></div><div class="uc-body"><p>${escapeHtml(update.body)}</p>${sourceLink}</div></div>`;
    }).join('\n');

    updatesHtml = updatesHtml.replace(insertMarker, `${insertMarker}\n${allNewCards}`);

    // ── 4. Push updated updates.html ─────────────────────────────────────────
    const pushUpdates = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/updates.html`,
      {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          message: `Approve all: add ${updates.length} updates`,
          content: Buffer.from(updatesHtml).toString('base64'),
          sha: updatesSha
        })
      }
    );
    if (!pushUpdates.ok) throw new Error('Failed to push updates.html to GitHub');

    // ── 5. Extract top 3 and sync index.html ─────────────────────────────────
    const cardRegex = /<div class="update-card"[^>]*data-sortdate="([^"]*)"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/g;
    const allCards = [];
    let m;
    while ((m = cardRegex.exec(updatesHtml)) !== null) {
      allCards.push({ sortdate: m[1], html: m[0] });
    }
    allCards.sort((a, b) => b.sortdate.localeCompare(a.sortdate));
    const top3 = allCards.slice(0, 3).map(c => '      ' + c.html.trim()).join('\n');

    const indexRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/index.html`,
      { headers }
    );
    if (indexRes.ok) {
      const indexData = await indexRes.json();
      let indexHtml = Buffer.from(indexData.content, 'base64').toString('utf-8');
      const homeCardsRegex = /(<div class="section-inner"[^>]*>[\s\S]*?<a href="\/updates"[^>]*>See all updates.*?<\/a>\s*<\/div>\s*)([\s\S]*?)(\s*<\/div>\s*<\/section>\s*<!-- ABOUT TEASER -->)/;
      if (homeCardsRegex.test(indexHtml)) {
        indexHtml = indexHtml.replace(homeCardsRegex, `$1\n${top3}\n    $3`);
        await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/index.html`,
          {
            method: 'PUT',
            headers,
            body: JSON.stringify({
              message: 'Sync home page with 3 newest updates',
              content: Buffer.from(indexHtml).toString('base64'),
              sha: indexData.sha
            })
          }
        );
      }
    }

    // ── 6. Delete _pending-updates.json ──────────────────────────────────────
    await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/_pending-updates.json`,
      {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ message: 'Clear pending updates after approve-all', sha: pendingSha })
      }
    );

    return res.status(200).send(renderPage('success', updates.length));

  } catch (err) {
    console.error('Approve-all error:', err);
    return res.status(500).send(renderPage('error', err.message));
  }
}

// ── Helpers (mirrors approve.js) ─────────────────────────────────────────────

function getTagClass(type) {
  const t = (type || '').toLowerCase();
  if (t === 'new')      return 't-new';
  if (t === 'update')   return 't-update';
  if (t === 'resource') return 't-resource';
  if (t === 'news')     return 't-news';
  return 't-reminder';
}

function getCategoryRegion(category) {
  const map = { 'National':'national','VIC':'vic','NSW':'nsw','QLD':'qld','SA':'sa','WA':'wa','TAS':'tas','ACT':'act','NT':'nt' };
  return map[category] || 'national';
}

function getCategorySport(category) {
  const map = { 'AFL':'afl','Netball':'netball','Cricket':'cricket','Soccer':'soccer','Rugby League':'rugby-league','Rugby Union':'rugby-union','Basketball':'basketball','Tennis':'tennis','Golf':'golf' };
  return map[category] || 'all';
}

function getSortDate(dateStr) {
  if (!dateStr) return new Date().toISOString().substring(0, 7);
  const months = { 'january':'01','february':'02','march':'03','april':'04','may':'05','june':'06','july':'07','august':'08','september':'09','october':'10','november':'11','december':'12' };
  const lower = dateStr.toLowerCase();
  const yearMatch = lower.match(/(\d{4})/);
  const year = yearMatch ? yearMatch[1] : new Date().getFullYear();
  for (const [name, num] of Object.entries(months)) {
    if (lower.includes(name)) return `${year}-${num}`;
  }
  return `${year}-01`;
}

function escapeHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function renderPage(status, value) {
  const isSuccess = status === 'success';
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${isSuccess ? 'All Updates Published' : 'Error'} | OneSide Australia</title>
<style>
  body { font-family: Arial, sans-serif; background: #0D1F35; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 2rem; }
  .card { background: white; border-radius: 16px; padding: 40px; max-width: 480px; width: 100%; text-align: center; }
  .icon { font-size: 3rem; margin-bottom: 16px; }
  h1 { font-size: 1.4rem; color: #0D1F35; margin: 0 0 10px; }
  p { font-size: 14px; color: #4A6580; line-height: 1.6; margin: 0 0 24px; }
  a { display: inline-block; background: #D4614E; color: white; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; }
</style>
</head>
<body>
<div class="card">
  <div class="icon">${isSuccess ? '✅' : '❌'}</div>
  <h1>${isSuccess ? `${value} update${value !== 1 ? 's' : ''} published` : 'Something went wrong'}</h1>
  <p>${isSuccess ? `All ${value} updates have been added to the Updates page and the home page has been synced. Vercel will redeploy in about 30 seconds.` : `Error: ${value}`}</p>
  <a href="https://onesideaustralia.com.au/updates">View Updates page →</a>
</div>
</body>
</html>`;
}
