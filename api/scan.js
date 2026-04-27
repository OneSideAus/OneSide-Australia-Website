// api/scan.js
// OneSide Australia — Updates Agent
// Scans child safety sources weekly, drafts updates, emails digest to Angela for approval

const SOURCES = [
  // Federal / National
  { name: 'Australian Institute of Family Studies', url: 'https://aifs.gov.au/news', category: 'national' },
  { name: 'Sport Integrity Australia', url: 'https://www.sportintegrity.gov.au/news-media', category: 'national' },
  { name: 'Australian Human Rights Commission', url: 'https://humanrights.gov.au/about/news/media-releases', category: 'national' },
  { name: 'National Principles for Child Safe Organisations', url: 'https://www.dss.gov.au/our-responsibilities/families-and-children/programs-services/child-protection/national-principles-for-child-safe-organisations', category: 'national' },
  { name: 'National Redress Scheme', url: 'https://www.nationalredress.gov.au/news', category: 'national' },

  // State & Territory Regulators
  { name: 'VIC — Social Services Regulator', url: 'https://www.ssr.vic.gov.au/news', category: 'vic' },
  { name: 'VIC — Commission for Children and Young People', url: 'https://ccyp.vic.gov.au/news', category: 'vic' },
  { name: 'NSW — Office of the Children\'s Guardian', url: 'https://www.ocg.nsw.gov.au/news-and-media/news', category: 'nsw' },
  { name: 'QLD — Blue Card Services', url: 'https://www.bluecard.qld.gov.au/news', category: 'qld' },
  { name: 'SA — Department for Child Protection', url: 'https://www.childprotection.sa.gov.au/news', category: 'sa' },
  { name: 'WA — Working with Children Check', url: 'https://workingwithchildren.wa.gov.au/news', category: 'wa' },
  { name: 'TAS — Office of the Children\'s Commissioner', url: 'https://www.childcomm.tas.gov.au/news', category: 'tas' },
  { name: 'ACT — Working with Vulnerable People', url: 'https://www.accesscanberra.act.gov.au/working-with-vulnerable-people', category: 'act' },
  { name: 'NT — Office of the Children\'s Commissioner', url: 'https://childcomm.nt.gov.au/news', category: 'nt' },

  // Sporting Bodies
  { name: 'AFL — Play AFL Safeguarding', url: 'https://play.afl/safeguarding', category: 'afl' },
  { name: 'AFL Victoria', url: 'https://www.aflvic.com.au/news', category: 'afl' },
  { name: 'Netball Australia', url: 'https://netball.com.au/integrity', category: 'netball' },
  { name: 'Netball Victoria', url: 'https://vic.netball.com.au/child-safeguarding-resource-hub', category: 'netball' },
  { name: 'Cricket Australia', url: 'https://www.cricket.com.au/news', category: 'cricket' },
  { name: 'Cricket Victoria', url: 'https://www.cricketvictoria.com.au/news', category: 'cricket' },
  { name: 'Football Australia', url: 'https://www.footballaustralia.com.au/news', category: 'soccer' },
  { name: 'Football Victoria', url: 'https://www.footballvictoria.com.au/news', category: 'soccer' },
  { name: 'NRL', url: 'https://www.nrl.com/news', category: 'rugby-league' },
  { name: 'Rugby Australia', url: 'https://australia.rugby/news', category: 'rugby-union' },
  { name: 'Basketball Australia', url: 'https://basketball.com.au/news', category: 'basketball' },
  { name: 'Tennis Australia', url: 'https://tennis.com.au/news', category: 'tennis' },
  { name: 'Golf Australia', url: 'https://golf.org.au/news', category: 'golf' },
  { name: 'Vicsport', url: 'https://vicsport.com.au/news', category: 'national' },
  { name: 'Play by the Rules', url: 'https://www.playbytherules.net.au/latest-news', category: 'national' },
];

async function fetchSourceContent(source) {
  try {
    const response = await fetch(source.url, {
      headers: { 'User-Agent': 'OneSide Australia Updates Agent/1.0' },
      signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) return null;
    const text = await response.text();
    // Return first 3000 chars to keep prompt manageable
    return text.substring(0, 3000);
  } catch (err) {
    console.error(`Failed to fetch ${source.name}:`, err.message);
    return null;
  }
}

async function analyseSourceWithClaude(source, content) {
  const today = new Date().toISOString().split('T')[0];
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const prompt = `You are monitoring child safety regulatory sources for OneSide Australia, a child safety consultancy for Australian sporting clubs.

Today is ${today}. You are looking for content published in the last 7 days (since ${oneWeekAgo}).

Source: ${source.name}
URL: ${source.url}
Category: ${source.category}

Page content:
${content}

Your task:
1. Identify any NEW content published in the last 7 days that is relevant to child safety in sport, child safe standards, Working With Children Checks, mandatory reporting, safeguarding, or related regulatory changes.
2. If you find relevant new content, draft a short update in OneSide Australia's voice — plain Australian English, factual, helpful tone, no em dashes, no AI writing patterns.
3. Each update should be 2-3 sentences maximum.
4. Assign a category tag from: National, VIC, NSW, QLD, SA, WA, TAS, ACT, NT, AFL, Netball, Cricket, Soccer, Rugby League, Rugby Union, Basketball, Tennis, Golf.
5. Assign a type tag from: New, Update, Reminder.

If there is NO new relevant content in the last 7 days, respond with exactly: NO_NEW_CONTENT

If there IS new content, respond in this exact JSON format:
{
  "updates": [
    {
      "title": "Short descriptive title",
      "body": "2-3 sentence summary in OneSide voice",
      "category": "National",
      "type": "New",
      "source": "${source.name}",
      "sourceUrl": "${source.url}",
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
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) return null;
  const data = await response.json();
  const text = data.content?.[0]?.text || '';

  if (text.trim() === 'NO_NEW_CONTENT') return null;

  try {
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return null;
  }
}

function buildEmailHtml(allUpdates, approveBaseUrl) {
  const date = new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const updateCards = allUpdates.map((update, i) => {
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

export default async function handler(req, res) {
  // Allow GET for manual trigger, POST for scheduled
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Simple auth check
  const secret = req.headers['x-scan-secret'] || req.query.secret;
  if (secret !== process.env.SCAN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('OneSide Updates Agent starting scan...');

  const allUpdates = [];

  // Scan each source
  for (const source of SOURCES) {
    console.log(`Scanning: ${source.name}`);
    const content = await fetchSourceContent(source);
    if (!content) continue;

    const result = await analyseSourceWithClaude(source, content);
    if (result?.updates) {
      allUpdates.push(...result.updates);
    }

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 500));
  }

  if (allUpdates.length === 0) {
    console.log('No new updates found this week.');
    return res.status(200).json({ message: 'No new updates found', count: 0 });
  }

  // Send email digest
  const approveBaseUrl = process.env.SITE_URL || 'https://onesideaustralia.com.au';
  const emailHtml = buildEmailHtml(allUpdates, approveBaseUrl);

  const emailResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
    },
    body: JSON.stringify({
      from: 'OneSide Updates Agent <updates@onesideaustralia.com.au>',
      to: ['info@onesideaustralia.com.au'],
      subject: `OneSide Weekly Updates Digest — ${allUpdates.length} update${allUpdates.length !== 1 ? 's' : ''} found`,
      html: emailHtml
    })
  });

  if (!emailResponse.ok) {
    const err = await emailResponse.text();
    console.error('Email send failed:', err);
    return res.status(500).json({ error: 'Failed to send email', details: err });
  }

  console.log(`Digest sent with ${allUpdates.length} updates.`);
  return res.status(200).json({ message: 'Digest sent', count: allUpdates.length });
}
