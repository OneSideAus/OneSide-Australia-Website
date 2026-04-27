// api/approve.js
// OneSide Australia — Approve endpoint
// Receives approve button click from email, adds update to updates.html via GitHub API

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).send('Method not allowed');
  }

  const { title, body, category, type, date, source, sourceUrl } = req.query;

  if (!title || !body || !category || !type) {
    return res.status(400).send(renderPage('error', 'Missing required fields.'));
  }

  try {
    // 1. Fetch current updates.html from GitHub
    const owner = 'OneSideAus';
    const repo = 'OneSide-Australia-Website';
    const filePath = 'updates.html';

    const fileResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'OneSide-Updates-Agent'
        }
      }
    );

    if (!fileResponse.ok) {
      const err = await fileResponse.text();
      console.error('GitHub fetch failed:', err);
      return res.status(500).send(renderPage('error', 'Could not fetch updates page from GitHub.'));
    }

    const fileData = await fileResponse.json();
    const currentContent = Buffer.from(fileData.content, 'base64').toString('utf-8');
    const sha = fileData.sha;

    // 2. Build the new update card HTML
    const tagClass = type.toLowerCase() === 'new' ? 't-new' : type.toLowerCase() === 'update' ? 't-update' : 't-reminder';
    const regionAttr = getCategoryRegion(category);
    const sportAttr = getCategorySport(category);

    const newCard = `            <div class="update-card" data-region="${regionAttr}" data-sport="${sportAttr}"><div class="uc-meta"><span class="uc-tag ${tagClass}">${category} · ${type}</span><span class="uc-date">${date || new Date().toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}</span></div><h5>${escapeHtml(title)}</h5><p>${escapeHtml(body)}</p></div>`;

    // 3. Insert new card after the opening of updates-list div
    const insertAfter = '<div id="updates-list">';
    if (!currentContent.includes(insertAfter)) {
      return res.status(500).send(renderPage('error', 'Could not find updates list in page.'));
    }

    const updatedContent = currentContent.replace(
      insertAfter,
      `${insertAfter}\n${newCard}`
    );

    // 4. Push updated file back to GitHub
    const updateResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'OneSide-Updates-Agent'
        },
        body: JSON.stringify({
          message: `Add update: ${title}`,
          content: Buffer.from(updatedContent).toString('base64'),
          sha: sha
        })
      }
    );

    if (!updateResponse.ok) {
      const err = await updateResponse.text();
      console.error('GitHub update failed:', err);
      return res.status(500).send(renderPage('error', 'Failed to publish update to GitHub.'));
    }

    // 5. Success
    return res.status(200).send(renderPage('success', title));

  } catch (err) {
    console.error('Approve error:', err);
    return res.status(500).send(renderPage('error', err.message));
  }
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

function escapeHtml(str) {
  return String(str)
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
  <p>${isSuccess ? `"${message}" has been added to the Updates page. Vercel will redeploy automatically in about 30 seconds.` : `Error: ${message}`}</p>
  <a href="https://onesideaustralia.com.au/updates">View Updates page →</a>
</div>
</body>
</html>`;
}
