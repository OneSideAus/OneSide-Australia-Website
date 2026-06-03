// api/scan.js
// OneSide Australia — Updates Agent
// Searches Google News RSS for child safety updates relevant to Australian sporting clubs

export const config = { maxDuration: 300 };

// ─── Search queries ───────────────────────────────────────────────────────────

const SEARCH_QUERIES = [
  // National regulatory & standards
  { query: 'child safe standards Australia sport compliance', label: 'National — Standards' },
  { query: 'Working With Children Check Australia changes', label: 'National — WWCC' },
  { query: 'mandatory child safety training Australia sport volunteers', label: 'National — Training' },
  { query: 'Sport Integrity Australia safeguarding child safety update', label: 'National — Sport Integrity' },
  { query: 'child safety legislation Australia sport new policy', label: 'National — Legislation' },
  { query: 'child safety resources toolkit sport Australia', label: 'National — Resources' },
  { query: 'child protection sport Australia inquiry review tribunal', label: 'National — News & Inquiries' },

  // State — Victoria
  { query: 'child safe sport Victoria child safety update', label: 'VIC' },
  { query: 'Working With Children Check Victoria changes', label: 'VIC — WWCC' },
  { query: 'Social Services Regulator Victoria child safety sport', label: 'VIC — Regulator' },

  // State — New South Wales
  { query: 'child safe sport NSW child safety update', label: 'NSW' },
  { query: 'Working With Children Check NSW changes', label: 'NSW — WWCC' },
  { query: 'Office of the Children\'s Guardian NSW sport', label: 'NSW — Regulator' },

  // State — Queensland
  { query: 'child safe sport Queensland child safety update', label: 'QLD' },
  { query: 'Working With Children Check Queensland Blue Card changes', label: 'QLD — WWCC' },
  { query: 'Queensland child safe standards sport compliance deadline', label: 'QLD — Standards' },
  { query: 'Reportable Conduct Scheme Queensland sport', label: 'QLD — Reportable Conduct' },

  // State — South Australia
  { query: 'child safe sport South Australia update', label: 'SA' },
  { query: 'Working With Children Check South Australia changes', label: 'SA — WWCC' },

  // State — Western Australia
  { query: 'child safe sport Western Australia update', label: 'WA' },
  { query: 'Working With Children Check Western Australia changes', label: 'WA — WWCC' },

  // State — Tasmania, ACT, NT
  { query: 'child safe sport Tasmania ACT Northern Territory update', label: 'TAS/ACT/NT' },

  // eSafety Commissioner
  { query: 'site:esafety.gov.au sport online safety update', label: 'eSafety Commissioner' },
  { query: 'eSafety Commissioner sport community clubs online safety', label: 'eSafety — Sport' },

  // Sport-specific
  { query: 'AFL child safeguarding safe sport update', label: 'AFL' },
  { query: 'Football Australia soccer child safeguarding update', label: 'Soccer' },
  { query: 'Rugby Australia child safeguarding safe sport update', label: 'Rugby' },
  { query: 'Cricket Australia child safeguarding safe sport update', label: 'Cricket' },
  { query: 'Basketball Australia child safeguarding safe sport update', label: 'Basketball' },
  { query: 'Netball Australia child safeguarding safe sport update', label: 'Netball' },
  { query: 'Tennis Australia child safeguarding safe sport update', label: 'Tennis' },
  { query: 'Golf Australia child safeguarding safe sport update', label: 'Golf' },
];

// ─── Fetch Google News RSS for a query ───────────────────────────────────────

async function fetchGoogleNewsRSS(query, sinceDate) {
  // Build query — add date filter if sinceDate provided
  const dateFilter = sinceDate ? ` after:${sinceDate}` : '';
  const encodedQuery = encodeURIComponent(query + dateFilter);
  const url = `https://news.google.com/rss/search?q=${encodedQuery}&hl=en-AU&gl=AU&ceid=AU:en`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'OneSide Australia Updates Agent/1.0' },
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRSSItems(xml);
  } catch (err) {
    console.error(`RSS fetch failed for "${query}":`, err.message);
    return [];
  }
}

// ─── Parse RSS XML into article objects ──────────────────────────────────────

function parseRSSItems(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];

    const title   = decodeXml(itemXml.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '');
    const link    = itemXml.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() ||
                    itemXml.match(/<link\s+href="([^"]+)"/)?.[1] || '';
    const pubDate = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || '';
    const source  = decodeXml(itemXml.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1] || '');
    const desc    = decodeXml(stripHtml(itemXml.match(/<description>([\s\S]*?)<\/description>/)?.[1] || ''));

    if (title && link) {
      items.push({ title, link, pubDate, source, desc });
    }
  }

  return items;
}

function decodeXml(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function stripHtml(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

// ─── Have Claude assess and write up the articles ────────────────────────────

async function assessArticlesWithClaude(articles, sinceDate) {
  if (articles.length === 0) return null;

  const today = new Date().toISOString().split('T')[0];
  const since = sinceDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Format articles for Claude
  const articleList = articles.slice(0, 30).map((a, i) =>
    `[${i + 1}] ${a.title}\nSource: ${a.source || 'Unknown'}\nDate: ${a.pubDate}\nURL: ${a.link}\nSummary: ${a.desc}`
  ).join('\n\n');

  const prompt = `You are the updates agent for OneSide Australia, a child safety consultancy for Australian sporting clubs.

Today is ${today}. You have been given a list of news articles found since ${since}.

Articles:
${articleList}

Your task:
1. Identify which articles are genuinely relevant to child safety in Australian sport. Include:
   - Child safe standards, regulatory changes, compliance deadlines
   - Working With Children Check changes
   - New resources, toolkits, training, or guidance for sporting clubs
   - Notable safeguarding incidents, inquiries, or reviews in an Australian sport context

2. Exclude anything not relevant to Australian sporting clubs (e.g. school education, international news with no Australian relevance, unrelated child welfare topics).

3. For each relevant article, write a 2-3 sentence update in OneSide Australia's voice: plain Australian English, factual, helpful tone, no em dashes, no AI writing patterns.

4. Assign:
   - category: National, VIC, NSW, QLD, SA, WA, TAS, ACT, NT, AFL, Netball, Cricket, Soccer, Rugby League, Rugby Union, Basketball, Tennis, Golf
   - type: New, Update, Reminder, Resource, News

5. For sourceUrl, always use the official primary source — the government website, regulator, or sporting body's own page — NOT a media article or news coverage of the item. If you only have a media article URL, find the official source it refers to and use that instead.

If NONE of the articles are relevant, respond with exactly: NO_NEW_CONTENT

If there are relevant articles, respond in this exact JSON format only — no other text:
{
  "updates": [
    {
      "title": "Short descriptive title",
      "body": "2-3 sentence summary in OneSide voice",
      "category": "National",
      "type": "New",
      "source": "Source organisation name",
      "sourceUrl": "https://...",
      "date": "Month Year"
    }
  ]
}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) return null;
  const data = await response.json();
  const text = data.content?.[0]?.text?.trim() || '';

  if (!text || text === 'NO_NEW_CONTENT') return null;

  try {
    const clean = text.replace(/```json|```/g, '').trim();
    if (clean.startsWith('NO_NEW_CONTENT')) return null;
    return JSON.parse(clean);
  } catch {
    console.error('JSON parse failed:', text.substring(0, 200));
    return null;
  }
}

// ─── Deduplicate by title ─────────────────────────────────────────────────────

function deduplicateUpdates(updates) {
  const seen = new Set();
  return updates.filter(u => {
    const key = u.title.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 40);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Build email HTML ─────────────────────────────────────────────────────────

function buildEmailHtml(allUpdates, approveBaseUrl) {
  const date = new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const updateCards = allUpdates.map((update) => {
    const approveUrl = `${approveBaseUrl}/api/approve?id=${encodeURIComponent(update.title)}&title=${encodeURIComponent(update.title)}&body=${encodeURIComponent(update.body)}&category=${encodeURIComponent(update.category)}&type=${encodeURIComponent(update.type)}&date=${encodeURIComponent(update.date)}&source=${encodeURIComponent(update.source)}&sourceUrl=${encodeURIComponent(update.sourceUrl)}`;

    return `
    <div style="background:#f8fafc;border:1px solid #e2eaf0;border-left:3px solid #D4614E;border-radius:0 8px 8px 0;padding:20px;margin-bottom:16px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
        <span style="background:rgba(212,97,78,0.1);color:#B84A39;font-size:11px;font-weight:600;padding:3px 10px;border-radius:100px;text-transform:uppercase;">${update.category}</span>
        <span style="background:rgba(92,221,154,0.15);color:#3B6D11;font-size:11px;font-weight:600;padding:3px 10px;border-radius:100px;text-transform:uppercase;">${update.type}</span>
        <span style="font-size:12px;color:#7A95AA;">${update.date}</span>
      </div>
      <h3 style="font-size:15px;font-weight:600;color:#0D1F35;margin:0 0 8px;">${update.title}</h3>
      <p style="font-size:14px;color:#4A6580;line-height:1.6;margin:0 0 14px;">${update.body}</p>
      <p style="font-size:12px;color:#7A95AA;margin:0 0 14px;">Source: <a href="${update.sourceUrl}" style="color:#1B5E8A;">${update.source}</a></p>
      <a href="${approveUrl}" style="display:inline-block;background:#D4614E;color:white;font-size:13px;font-weight:600;padding:8px 20px;border-radius:6px;text-decoration:none;">Approve and publish →</a>
    </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:'DM Sans',Arial,sans-serif;background:#f0f4f8;padding:32px 16px;margin:0;">
  <div style="max-width:640px;margin:0 auto;">
    <div style="background:#0D1F35;border-radius:12px;padding:24px;margin-bottom:24px;text-align:center;">
      <p style="font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#D4614E;margin:0 0 8px;">OneSide Australia</p>
      <h1 style="font-size:1.4rem;color:white;margin:0 0 6px;">Weekly Updates Digest</h1>
      <p style="font-size:13px;color:rgba(255,255,255,0.5);margin:0;">${date}</p>
    </div>
    <div style="background:white;border-radius:12px;padding:24px;margin-bottom:16px;">
      <p style="font-size:14px;color:#4A6580;margin:0 0 6px;">Found <strong style="color:#0D1F35;">${allUpdates.length} potential update${allUpdates.length !== 1 ? 's' : ''}</strong> this week.</p>
      <p style="font-size:13px;color:#7A95AA;margin:0;">Review each update below and click <strong>Approve and publish</strong> for any you want to add to the Updates page. Ignored updates will not be published.</p>
    </div>
    ${updateCards}
    <p style="font-size:12px;color:#7A95AA;text-align:center;margin-top:24px;">OneSide Australia — Updates Agent · <a href="https://onesideaustralia.com.au" style="color:#D4614E;">onesideaustralia.com.au</a></p>
  </div>
</body>
</html>`;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = req.headers['x-scan-secret'] || req.query.secret;
  const isCron = req.headers['x-vercel-cron'] === '1';
  if (!isCron && secret !== process.env.SCAN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const sinceDate = req.query.since || null;
  console.log(`OneSide Updates Agent starting Google News scan... ${sinceDate ? `(since ${sinceDate})` : '(last 7 days)'}`);

  // Fetch all RSS feeds in parallel
  const rssResults = await Promise.allSettled(
    SEARCH_QUERIES.map(q => fetchGoogleNewsRSS(q.query, sinceDate))
  );

  // Collect and deduplicate articles by URL before sending to Claude
  const seenUrls = new Set();
  const allArticles = [];
  for (const result of rssResults) {
    if (result.status === 'fulfilled') {
      for (const article of result.value) {
        if (!seenUrls.has(article.link)) {
          seenUrls.add(article.link);
          allArticles.push(article);
        }
      }
    }
  }

  console.log(`Collected ${allArticles.length} unique articles from Google News.`);

  if (allArticles.length === 0) {
    console.log('No articles found from Google News.');
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.RESEND_API_KEY}` },
      body: JSON.stringify({
        from: 'OneSide Updates Agent <updates@onesideaustralia.com.au>',
        to: ['info@onesideaustralia.com.au'],
        subject: 'OneSide Weekly Digest — No articles found',
        html: `<p style="font-family:Arial,sans-serif;">The Google News scan returned no articles this week. This may be a temporary issue — the agent will run again next week.</p>`
      })
    });
    return res.status(200).json({ message: 'No articles found', count: 0 });
  }

  // Send articles to Claude in batches of 30 for assessment
  const allUpdates = [];
  const BATCH_SIZE = 30;
  for (let i = 0; i < allArticles.length; i += BATCH_SIZE) {
    const batch = allArticles.slice(i, i + BATCH_SIZE);
    const result = await assessArticlesWithClaude(batch, sinceDate);
    if (result?.updates) allUpdates.push(...result.updates);
  }

  const dedupedUpdates = deduplicateUpdates(allUpdates);
  console.log(`Found ${dedupedUpdates.length} relevant updates after Claude assessment.`);

  const date = new Date().toLocaleDateString('en-AU', { weekday:'long',day:'numeric',month:'long',year:'numeric' });

  if (dedupedUpdates.length === 0) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.RESEND_API_KEY}` },
      body: JSON.stringify({
        from: 'OneSide Updates Agent <updates@onesideaustralia.com.au>',
        to: ['info@onesideaustralia.com.au'],
        subject: 'OneSide Weekly Digest — No changes this week',
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#f8fafc;"><div style="background:#0D1F35;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;"><h1 style="color:white;font-size:1.3rem;margin:0;">OneSide Weekly Digest</h1><p style="color:rgba(255,255,255,0.5);font-size:13px;margin:6px 0 0;">${date}</p></div><div style="background:white;border-radius:12px;padding:24px;"><p style="font-size:15px;color:#0D1F35;font-weight:600;margin:0 0 8px;">No changes detected this week</p><p style="font-size:14px;color:#4A6580;line-height:1.6;margin:0;">The agent scanned Google News across all sources and found nothing new relevant to child safety in sport. No action needed.</p></div><p style="font-size:12px;color:#aaa;text-align:center;margin-top:20px;">Next scan: Sunday/Tuesday · <a href="https://onesideaustralia.com.au/updates" style="color:#D4614E;">View Updates page</a></p></div>`
      })
    });
    return res.status(200).json({ message: 'No relevant updates found', count: 0 });
  }

  const approveBaseUrl = process.env.SITE_URL || 'https://onesideaustralia.com.au';
  const emailHtml = buildEmailHtml(dedupedUpdates, approveBaseUrl);

  const emailResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.RESEND_API_KEY}` },
    body: JSON.stringify({
      from: 'OneSide Updates Agent <updates@onesideaustralia.com.au>',
      to: ['info@onesideaustralia.com.au'],
      subject: `OneSide Updates Digest${sinceDate ? ` (since ${sinceDate})` : ''} — ${dedupedUpdates.length} update${dedupedUpdates.length !== 1 ? 's' : ''} found`,
      html: emailHtml
    })
  });

  if (!emailResponse.ok) {
    const err = await emailResponse.text();
    console.error('Email send failed:', err);
    return res.status(500).json({ error: 'Failed to send email', details: err });
  }

  console.log(`Digest sent with ${dedupedUpdates.length} updates.`);
  return res.status(200).json({ message: 'Digest sent', count: dedupedUpdates.length });
}
