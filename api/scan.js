// api/scan.js
// OneSide Australia — Updates Agent
// Scans child safety sources weekly, drafts updates, emails digest to Angela for approval

export const config = { maxDuration: 300 };

const SOURCES = [
  // Federal / National
  { name: 'Australian Institute of Family Studies', url: 'https://aifs.gov.au/news', category: 'national' },
  { name: 'Sport Integrity Australia', url: 'https://www.sportintegrity.gov.au/news-media', category: 'national' },
  { name: 'Australian Human Rights Commission', url: 'https://humanrights.gov.au/about/news/media-releases', category: 'national' },
  { name: 'National Principles for Child Safe Organisations', url: 'https://www.dss.gov.au/our-responsibilities/families-and-children/programs-services/child-protection/national-principles-for-child-safe-organisations', category: 'national' },
  { name: 'National Redress Scheme', url: 'https://www.nationalredress.gov.au/news', category: 'national' },
  { name: 'Play by the Rules', url: 'https://www.playbytherules.net.au/latest-news', category: 'national' },

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

  // Peak State Sport Bodies
  { name: 'Vicsport', url: 'https://vicsport.com.au/news', category: 'vic' },
  { name: 'Sport NSW', url: 'https://www.sportnsw.com.au/news', category: 'nsw' },
  { name: 'Sport Queensland', url: 'https://www.sport.qld.gov.au/news', category: 'qld' },
  { name: 'Sport SA', url: 'https://www.sportssa.com.au/news', category: 'sa' },
  { name: 'Sport and Recreation WA', url: 'https://www.dlgsc.wa.gov.au/sport-and-recreation', category: 'wa' },
  { name: 'Sport Tasmania', url: 'https://www.sport.tas.gov.au', category: 'tas' },
  { name: 'Sport ACT', url: 'https://sport.act.gov.au', category: 'act' },

  // AFL — National + All States
  { name: 'AFL — Play AFL Safeguarding', url: 'https://play.afl/safeguarding', category: 'afl' },
  { name: 'AFL Victoria', url: 'https://www.aflvic.com.au/news', category: 'afl' },
  { name: 'AFL NSW/ACT', url: 'https://www.aflnswact.com.au/news', category: 'afl' },
  { name: 'AFL Queensland', url: 'https://www.aflq.com.au/news', category: 'afl' },
  { name: 'SANFL (South Australia)', url: 'https://www.sanfl.com.au/news', category: 'afl' },
  { name: 'AFL WA', url: 'https://www.aflwa.com.au/news', category: 'afl' },
  { name: 'AFL Tasmania', url: 'https://www.afltasmania.com.au/news', category: 'afl' },
  { name: 'AFL NT', url: 'https://www.aflnt.com.au/news', category: 'afl' },

  // Netball — National + All States
  { name: 'Netball Australia', url: 'https://netball.com.au/integrity', category: 'netball' },
  { name: 'Netball Victoria', url: 'https://vic.netball.com.au/child-safeguarding-resource-hub', category: 'netball' },
  { name: 'Netball NSW', url: 'https://www.netballnsw.com/news', category: 'netball' },
  { name: 'Netball Queensland', url: 'https://netballq.com.au/news', category: 'netball' },
  { name: 'Netball SA', url: 'https://netballsa.com.au/news', category: 'netball' },
  { name: 'Netball WA', url: 'https://www.netballwa.com.au/news', category: 'netball' },
  { name: 'Netball Tasmania', url: 'https://www.netballtasmania.com.au/news', category: 'netball' },
  { name: 'Netball NT', url: 'https://www.netballnt.com.au', category: 'netball' },
  { name: 'Netball ACT', url: 'https://www.netballact.com.au', category: 'netball' },

  // Cricket — National + All States
  { name: 'Cricket Australia', url: 'https://www.cricket.com.au/news', category: 'cricket' },
  { name: 'Cricket Victoria', url: 'https://www.cricketvictoria.com.au/news', category: 'cricket' },
  { name: 'Cricket NSW', url: 'https://www.cricketnsw.com.au/news', category: 'cricket' },
  { name: 'Cricket Queensland', url: 'https://www.cricketqueensland.com.au/news', category: 'cricket' },
  { name: 'Cricket SA', url: 'https://www.cricketsa.com.au/news', category: 'cricket' },
  { name: 'Cricket WA', url: 'https://www.cricketwa.com.au/news', category: 'cricket' },
  { name: 'Cricket Tasmania', url: 'https://www.crickettas.com.au/news', category: 'cricket' },
  { name: 'Cricket ACT', url: 'https://www.cricketact.com.au/news', category: 'cricket' },
  { name: 'NT Cricket', url: 'https://www.ntcricket.com.au/news', category: 'cricket' },

  // Football/Soccer — National + All States
  { name: 'Football Australia', url: 'https://www.footballaustralia.com.au/news', category: 'soccer' },
  { name: 'Football Victoria', url: 'https://www.footballvictoria.com.au/news', category: 'soccer' },
  { name: 'Football NSW', url: 'https://www.footballnsw.com.au/news', category: 'soccer' },
  { name: 'Football Queensland', url: 'https://www.footballqueensland.com.au/news', category: 'soccer' },
  { name: 'Football SA', url: 'https://www.ffsa.com.au/news', category: 'soccer' },
  { name: 'Football West (WA)', url: 'https://www.footballwest.com.au/news', category: 'soccer' },
  { name: 'Football Federation Tasmania', url: 'https://www.footballtasmania.org.au/news', category: 'soccer' },
  { name: 'Capital Football (ACT)', url: 'https://www.capitalfootball.com.au/news', category: 'soccer' },
  { name: 'Football NT', url: 'https://www.footballnt.com.au/news', category: 'soccer' },

  // Rugby League — National + Key States
  { name: 'NRL', url: 'https://www.nrl.com/news', category: 'rugby-league' },
  { name: 'NSWRL', url: 'https://www.nswrl.com.au/news', category: 'rugby-league' },
  { name: 'Queensland Rugby League', url: 'https://www.qrl.com.au/news', category: 'rugby-league' },
  { name: 'SA Rugby League', url: 'https://www.sarl.com.au/news', category: 'rugby-league' },
  { name: 'Rugby League WA', url: 'https://www.rugbyleaguewa.com.au/news', category: 'rugby-league' },

  // Rugby Union — National + All States
  { name: 'Rugby Australia', url: 'https://australia.rugby/news', category: 'rugby-union' },
  { name: 'NSW Rugby', url: 'https://www.nswrugby.com.au/news', category: 'rugby-union' },
  { name: 'Rugby Queensland', url: 'https://www.rugbyqld.com.au/news', category: 'rugby-union' },
  { name: 'Rugby Victoria', url: 'https://www.rugbyvictoria.com.au/news', category: 'rugby-union' },
  { name: 'Rugby WA', url: 'https://www.warugby.com.au/news', category: 'rugby-union' },
  { name: 'Rugby SA', url: 'https://www.rugbysa.com.au/news', category: 'rugby-union' },
  { name: 'Rugby Tasmania', url: 'https://www.rugbytas.com.au/news', category: 'rugby-union' },
  { name: 'Rugby ACT', url: 'https://www.rugbyact.com.au/news', category: 'rugby-union' },

  // Basketball — National + All States
  { name: 'Basketball Australia', url: 'https://basketball.com.au/news', category: 'basketball' },
  { name: 'Basketball Victoria', url: 'https://www.bv.basketball/news', category: 'basketball' },
  { name: 'Basketball NSW', url: 'https://www.bnsw.basketball/news', category: 'basketball' },
  { name: 'Basketball Queensland', url: 'https://www.bq.basketball/news', category: 'basketball' },
  { name: 'Basketball SA', url: 'https://www.bsa.basketball/news', category: 'basketball' },
  { name: 'Basketball WA', url: 'https://www.bwa.basketball/news', category: 'basketball' },
  { name: 'Basketball Tasmania', url: 'https://www.bt.basketball/news', category: 'basketball' },
  { name: 'Basketball ACT', url: 'https://www.bact.basketball/news', category: 'basketball' },
  { name: 'Basketball NT', url: 'https://www.bnt.basketball/news', category: 'basketball' },

  // Tennis — National + All States
  { name: 'Tennis Australia', url: 'https://tennis.com.au/news', category: 'tennis' },
  { name: 'Tennis Victoria', url: 'https://www.tennisvictoria.com.au/news', category: 'tennis' },
  { name: 'Tennis NSW', url: 'https://www.tennisnsw.com.au/news', category: 'tennis' },
  { name: 'Tennis Queensland', url: 'https://www.tennisqueensland.com.au/news', category: 'tennis' },
  { name: 'Tennis SA', url: 'https://www.tennissa.com.au/news', category: 'tennis' },
  { name: 'Tennis West (WA)', url: 'https://www.tenniswest.com.au/news', category: 'tennis' },
  { name: 'Tennis Tasmania', url: 'https://www.tennistas.com.au/news', category: 'tennis' },

  // Golf — National + All States
  { name: 'Golf Australia', url: 'https://golf.org.au/news', category: 'golf' },
  { name: 'Golf Victoria', url: 'https://www.golfvic.org.au/news', category: 'golf' },
  { name: 'Golf NSW', url: 'https://www.golfnsw.org.au/news', category: 'golf' },
  { name: 'Golf Queensland', url: 'https://www.golfqld.org.au/news', category: 'golf' },
  { name: 'Golf SA', url: 'https://www.golfsouthaustralia.com.au/news', category: 'golf' },
  { name: 'Golf WA', url: 'https://www.golfwa.org.au/news', category: 'golf' },
  { name: 'Golf Tasmania', url: 'https://www.golftas.org.au/news', category: 'golf' },
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

async function analyseSourceWithClaude(source, content, sinceDate = null) {
  const today = new Date().toISOString().split('T')[0];
  const since = sinceDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const periodLabel = sinceDate ? `since ${since}` : `in the last 7 days (since ${since})`;

  const prompt = `You are monitoring child safety regulatory sources for OneSide Australia, a child safety consultancy for Australian sporting clubs.

Today is ${today}. You are looking for content published ${periodLabel}.

Source: ${source.name}
URL: ${source.url}
Category: ${source.category}

Page content:
${content}

Your task:
1. Identify any NEW content published ${periodLabel} that falls into ANY of these four categories:
   a) Child safety in sport — child safe standards, mandatory reporting, safeguarding regulations, policy changes
   b) Working With Children Checks — renewal deadlines, fee changes, process updates, state-by-state alerts
   c) Safeguarding news from sport — notable incidents, tribunal outcomes, parliamentary inquiries, published reviews or investigations relating to child safety in a sporting context
   d) Resources and tools — new toolkits, templates, policy guides, training modules, or practical resources released by peak bodies, government agencies, or sporting organisations that clubs could use
2. If you find relevant new content, draft a short update in OneSide Australia's voice — plain Australian English, factual, helpful tone, no em dashes, no AI writing patterns.
3. Each update should be 2-3 sentences maximum.
4. Assign a category tag from: National, VIC, NSW, QLD, SA, WA, TAS, ACT, NT, AFL, Netball, Cricket, Soccer, Rugby League, Rugby Union, Basketball, Tennis, Golf.
5. Assign a type tag from: New, Update, Reminder, Resource, News.

If there is NO new relevant content in the period, respond with exactly: NO_NEW_CONTENT

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
const isCron = req.headers['x-vercel-cron'] === '1';
if (!isCron && secret !== process.env.SCAN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const sinceDate = req.query.since || null; // e.g. ?since=2026-02-01
  console.log(`OneSide Updates Agent starting scan... ${sinceDate ? `(since ${sinceDate})` : '(last 7 days)'}`);

  const allUpdates = [];

  // Scan sources in parallel batches to stay within 300s limit
  const BATCH_SIZE = 10;
  for (let i = 0; i < SOURCES.length; i += BATCH_SIZE) {
    const batch = SOURCES.slice(i, i + BATCH_SIZE);
    console.log(`Scanning batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.map(s => s.name).join(', ')}`);
    const batchResults = await Promise.allSettled(
      batch.map(async (source) => {
        const content = await fetchSourceContent(source);
        if (!content) return null;
        return analyseSourceWithClaude(source, content, sinceDate);
      })
    );
    for (const result of batchResults) {
      if (result.status === 'fulfilled' && result.value?.updates) {
        allUpdates.push(...result.value.updates);
      }
    }
  }

  if (allUpdates.length === 0) {
    console.log('No new updates found this week.');
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
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#f8fafc;"><div style="background:#0D1F35;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;"><h1 style="color:white;font-size:1.3rem;margin:0;">OneSide Weekly Digest</h1><p style="color:rgba(255,255,255,0.5);font-size:13px;margin:6px 0 0;">${new Date().toLocaleDateString('en-AU', { weekday:'long',day:'numeric',month:'long',year:'numeric' })}</p></div><div style="background:white;border-radius:12px;padding:24px;"><p style="font-size:15px;color:#0D1F35;font-weight:600;margin:0 0 8px;">No changes detected this week</p><p style="font-size:14px;color:#4A6580;line-height:1.6;margin:0;">The agent scanned all sources and found nothing new relevant to child safety in sport. No action needed.</p></div><p style="font-size:12px;color:#aaa;text-align:center;margin-top:20px;">Next scan: Monday · <a href="https://onesideaustralia.com.au/updates" style="color:#D4614E;">View Updates page</a></p></div>`
      })
    });
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
      subject: `OneSide Updates Digest${sinceDate ? ` (since ${sinceDate})` : ''} — ${allUpdates.length} update${allUpdates.length !== 1 ? 's' : ''} found`,
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
