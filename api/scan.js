// api/scan.js
// OneSide Australia — Updates Agent
// Uses Claude web search to find child safety updates relevant to Australian sporting clubs

export const config = { maxDuration: 300 };

// ─── Search queries ───────────────────────────────────────────────────────────
// Each query targets a specific topic area. Claude will web-search each one
// and return any relevant updates it finds.

const SEARCH_QUERIES = [
  // Regulatory & standards
  { query: 'child safe standards Australia sport compliance 2026', label: 'Child Safe Standards' },
  { query: 'mandatory child safety training Australia sport volunteers 2026', label: 'Mandatory Training' },
  { query: 'Working With Children Check Australia changes updates 2026', label: 'WWCC' },
  { query: 'child safety legislation Australia sport 2026', label: 'Legislation' },

  // Government & regulators
  { query: 'site:vic.gov.au OR site:ccyp.vic.gov.au child safety sport 2026', label: 'VIC Government' },
  { query: 'site:ocg.nsw.gov.au OR site:sport.nsw.gov.au child safety sport 2026', label: 'NSW Government' },
  { query: 'site:sport.qld.gov.au OR site:bluecard.qld.gov.au child safety sport 2026', label: 'QLD Government' },
  { query: 'site:sportintegrity.gov.au safeguarding sport 2026', label: 'Sport Integrity Australia' },
  { query: 'site:playbytherules.net.au child safety update 2026', label: 'Play by the Rules' },
  { query: 'site:aifs.gov.au child safety sport 2026', label: 'AIFS' },
  { query: 'site:education.gov.au child safety sport 2026', label: 'Dept of Education' },
  { query: 'site:acecqa.gov.au child safety changes 2026', label: 'ACECQA' },

  // Resources & tools
  { query: 'child safe sport toolkit resources Australia 2026 new', label: 'Resources & Tools' },
  { query: 'child safeguarding policy template sport Australia 2026', label: 'Policy Templates' },

  // News & incidents
  { query: 'child safety sport Australia inquiry review tribunal 2026', label: 'News & Inquiries' },
  { query: 'safeguarding children Australian sport news 2026', label: 'Safeguarding News' },
];

// ─── Run a single search query via Claude with web search tool ────────────────

async function searchWithClaude(queryObj, sinceDate) {
  const today = new Date().toISOString().split('T')[0];
  const since = sinceDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const prompt = `You are the updates agent for OneSide Australia, a child safety consultancy for Australian sporting clubs.

Today is ${today}. Search for: "${queryObj.query}"

Find any content published since ${since} that is relevant to child safety in Australian sport. This includes:
- Child safe standards, regulatory changes, compliance requirements
- Working With Children Check updates, fee changes, process changes
- New resources, toolkits, training modules, or guidance for sporting clubs
- Notable safeguarding incidents, inquiries, reviews, or tribunal outcomes in sport

For each relevant item you find:
- Write a 2-3 sentence update in OneSide Australia's voice: plain Australian English, factual, helpful, no em dashes, no AI writing patterns
- Assign a category: National, VIC, NSW, QLD, SA, WA, TAS, ACT, NT, AFL, Netball, Cricket, Soccer, Rugby League, Rugby Union, Basketball, Tennis, Golf
- Assign a type: New, Update, Reminder, Resource, News

Only include items published since ${since}. If nothing relevant was published since then, respond with exactly: NO_NEW_CONTENT

If you find relevant items, respond in this exact JSON format only — no other text:
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
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'web-search-2025-03-05'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 2000,
      tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 3 }],
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    console.error(`Claude search failed for "${queryObj.label}":`, response.status);
    return null;
  }

  const data = await response.json();

  // Extract the final text response (may come after tool_use blocks)
  const textBlock = data.content?.findLast(b => b.type === 'text');
  const text = textBlock?.text?.trim() || '';

  if (!text || text === 'NO_NEW_CONTENT') return null;

  try {
    const clean = text.replace(/```json|```/g, '').trim();
    // Handle case where response starts with NO_NEW_CONTENT in some wrapper
    if (clean.startsWith('NO_NEW_CONTENT')) return null;
    return JSON.parse(clean);
  } catch {
    console.error(`JSON parse failed for "${queryObj.label}":`, text.substring(0, 200));
    return null;
  }
}

// ─── Deduplicate updates by title similarity ──────────────────────────────────

function deduplicateUpdates(updates) {
  const seen = new Set();
  return updates.filter(u => {
    // Normalise title to catch near-duplicates
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
  console.log(`OneSide Updates Agent starting web search scan... ${sinceDate ? `(since ${sinceDate})` : '(last 7 days)'}`);

  const allUpdates = [];

  // Run search queries in small parallel batches
  const BATCH_SIZE = 4;
  for (let i = 0; i < SEARCH_QUERIES.length; i += BATCH_SIZE) {
    const batch = SEARCH_QUERIES.slice(i, i + BATCH_SIZE);
    console.log(`Searching batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.map(q => q.label).join(', ')}`);
    const results = await Promise.allSettled(
      batch.map(q => searchWithClaude(q, sinceDate))
    );
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value?.updates) {
        allUpdates.push(...result.value.updates);
      }
    }
  }

  const dedupedUpdates = deduplicateUpdates(allUpdates);
  console.log(`Found ${allUpdates.length} updates, ${dedupedUpdates.length} after deduplication.`);

  if (dedupedUpdates.length === 0) {
    console.log('No new updates found.');
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'OneSide Updates Agent <updates@onesideaustralia.com.au>',
        to: ['info@onesideaustralia.com.au'],
        subject: 'OneSide Weekly Digest — No changes this week',
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#f8fafc;"><div style="background:#0D1F35;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;"><h1 style="color:white;font-size:1.3rem;margin:0;">OneSide Weekly Digest</h1><p style="color:rgba(255,255,255,0.5);font-size:13px;margin:6px 0 0;">${new Date().toLocaleDateString('en-AU', { weekday:'long',day:'numeric',month:'long',year:'numeric' })}</p></div><div style="background:white;border-radius:12px;padding:24px;"><p style="font-size:15px;color:#0D1F35;font-weight:600;margin:0 0 8px;">No changes detected this week</p><p style="font-size:14px;color:#4A6580;line-height:1.6;margin:0;">The agent searched all sources and found nothing new relevant to child safety in sport. No action needed.</p></div><p style="font-size:12px;color:#aaa;text-align:center;margin-top:20px;">Next scan: Sunday/Tuesday · <a href="https://onesideaustralia.com.au/updates" style="color:#D4614E;">View Updates page</a></p></div>`
      })
    });
    return res.status(200).json({ message: 'No new updates found', count: 0 });
  }

  const approveBaseUrl = process.env.SITE_URL || 'https://onesideaustralia.com.au';
  const emailHtml = buildEmailHtml(dedupedUpdates, approveBaseUrl);

  const emailResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
    },
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
