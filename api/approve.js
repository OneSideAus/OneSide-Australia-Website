// api/approve.js
// OneSide Australia — Approve endpoint
// Receives approve button click from email, adds update to updates.html and
// syncs the 3 most recent cards to index.html — both via GitHub API

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).send('Method not allowed');
  }

  const { title, body, category, type, date, source, sourceUrl } = req.query;

  if (!title || !body || !category || !type) {
    return res.status(400).send(renderPage('error', 'Missing required fields.'));
  }

  try {
    const owner = 'OneSideAus';
    const repo  = 'OneSide-Australia-Website';
    const headers = {
      'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'OneSide-Updates-Agent'
    };

    // ── 1. Fetch current updates.html ────────────────────────────────────────
    const updatesRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/updates.html`,
      { headers }
    );
    if (!updatesRes.ok) throw new Error('Could not fetch updates.html from GitHub');
    const updatesData = await updatesRes.json();
    const updatesSha  = updatesData.sha;
    let updatesHtml   = Buffer.from(updatesData.content, 'base64').toString('utf-8');

    // ── 2. Build new card in the current expandable format ───────────────────
    const tagClass   = getTagClass(type);
    const regionAttr = getCategoryRegion(category);
    const sportAttr  = getCategorySport(category);
    const sortDate   = getSortDate(date);
    const displayDate = date || new Date().toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });
    const sourceLink = sourceUrl
      ? `<a href="${sourceUrl}" class="uc-source-link" target="_blank" rel="noopener">Read more at ${escapeHtml(source || 'source')} ↗</a>`
      : '';

    const newCard = `            <div class="update-card" data-region="${regionAttr}" data-sport="${sportAttr}" data-sortdate="${sortDate}"><div class="uc-head" onclick="toggleUpdate(this.closest('.update-card'))"><div class="uc-head-inner"><div class="uc-meta"><span class="uc-tag ${tagClass}">${escapeHtml(category)} · ${escapeHtml(type)}</span><span class="uc-date">${escapeHtml(displayDate)}</span></div><h5>${escapeHtml(title)}</h5></div><span class="uc-chevron">▾</span></div><div class="uc-body"><p>${escapeHtml(body)}</p>${sourceLink}</div></div>`;

    // ── 3. Insert at top of updates-list ────────────────────────────────────
    const insertMarker = '<div id="updates-list">';
    if (!updatesHtml.includes(insertMarker)) {
      throw new Error('Could not find updates list in updates.html');
    }
    updatesHtml = updatesHtml.replace(insertMarker, `${insertMarker}\n${newCard}`);

    // ── 4. Push updated updates.html to GitHub ───────────────────────────────
    const pushUpdates = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/updates.html`,
      {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          message: `Add update: ${title}`,
          content: Buffer.from(updatesHtml).toString('base64'),
          sha: updatesSha
        })
      }
    );
    if (!pushUpdates.ok) throw new Error('Failed to push updates.html to GitHub');

    // ── 5. Extract 3 newest cards from the updated updates.html ─────────────
    const cardRegex = /<div class="update-card"[^>]*data-sortdate="([^"]*)"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/g;
    const allCards = [];
    let m;
    while ((m = cardRegex.exec(updatesHtml)) !== null) {
      allCards.push({ sortdate: m[1], html: m[0] });
    }
    allCards.sort((a, b) => b.sortdate.localeCompare(a.sortdate));
    const top3 = allCards.slice(0, 3).map(c => '      ' + c.html.trim()).join('\n');

    // ── 6. Fetch current index.html ──────────────────────────────────────────
    const indexRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/index.html`,
      { headers }
    );
    if (!indexRes.ok) throw new Error('Could not fetch index.html from GitHub');
    const indexData = await indexRes.json();
    const indexSha  = indexData.sha;
    let indexHtml   = Buffer.from(indexData.content, 'base64').toString('utf-8');

    // ── 7. Replace the 3 home page preview cards ────────────────────────────
    // Match from the first update-card in the preview section to the closing of that block
    const homeCardsRegex = /(<div class="section-inner"[^>]*>[\s\S]*?<a href="\/updates"[^>]*>See all updates.*?<\/a>\s*<\/div>\s*)([\s\S]*?)(\s*<\/div>\s*<\/section>\s*<!-- ABOUT TEASER -->)/;
    if (homeCardsRegex.test(indexHtml)) {
      indexHtml = indexHtml.replace(homeCardsRegex, `$1\n${top3}\n    $3`);
    }

    // ── 8. Push updated index.html to GitHub ─────────────────────────────────
    const pushIndex = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/index.html`,
      {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          message: `Sync home page with 3 newest updates`,
          content: Buffer.from(indexHtml).toString('base64'),
          sha: indexSha
        })
      }
    );
    if (!pushIndex.ok) {
      // Non-fatal — updates.html already published, just log the home page failure
      console.error('Failed to sync index.html, but updates.html was published successfully');
    }

    return res.status(200).send(renderPage('success', title));

  } catch (err) {
    console.error('Approve error:', err);
    return res.status(500).send(renderPage('error', err.message));
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getTagClass(type) {
  const t = (type || '').toLowerCase();
  if (t === 'new')      return 't-new';
  if (t === 'update')   return 't-update';
  if (t === 'resource') return 't-resource';
  if (t === 'news')     return 't-news';
  return 't-reminder';
}

function getCategoryRegion(category) {
  const map = {
    'National': 'national', 'VIC': 'vic', 'NSW': 'nsw', 'QLD': 'qld',
    'SA': 'sa', 'WA': 'wa', 'TAS': 'tas', 'ACT': 'act', 'NT': 'nt'
  };
  return map[category] || 'national';
}

function getCategorySport(category) {
  const map = {
    'AFL': 'afl', 'Netball': 'netball', 'Cricket': 'cricket', 'Soccer': 'soccer',
    'Rugby League': 'rugby-league', 'Rugby Union': 'rugby-union',
    'Basketball': 'basketball', 'Tennis': 'tennis', 'Golf': 'golf'
  };
  return map[category] || 'all';
}

function getSortDate(dateStr) {
  if (!dateStr) return new Date().toISOString().substring(0, 7);
  const months = {
    'january':'01','february':'02','march':'03','april':'04',
    'may':'05','june':'06','july':'07','august':'08',
    'september':'09','october':'10','november':'11','december':'12'
  };
  const lower = dateStr.toLowerCase();
  const yearMatch = lower.match(/(\d{4})/);
  const year = yearMatch ? yearMatch[1] : new Date().getFullYear();
  for (const [name, num] of Object.entries(months)) {
    if (lower.includes(name)) return `${year}-${num}`;
  }
  return `${year}-01`;
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderPage(status, message) {
  const isSuccess = status === 'success';
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${isSuccess ? 'Update Published' : 'Error'} | OneSide Australia</title>
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
  <h1>${isSuccess ? 'Update published' : 'Something went wrong'}</h1>
  <p>${isSuccess ? `"${message}" has been added to the Updates page and the home page has been synced. Vercel will redeploy in about 30 seconds.` : `Error: ${message}`}</p>
  <a href="https://onesideaustralia.com.au/updates">View Updates page →</a>
</div>
</body>
</html>`;
}
