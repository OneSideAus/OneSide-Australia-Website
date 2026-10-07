// api/scan.js
// OneSide Australia — Updates Agent (one region per call)
//
// Called once per region (?region=VIC, ?region=NSW, ...) by the weekly GitHub
// Actions workflow, so every state gets its own agent and its own time budget.
// Each agent:
//   1. diffs its watched regulator pages against last week's snapshot,
//   2. pulls region-specific Google News results as leads,
//   3. has Claude search and read the region's OFFICIAL websites (web search +
//      web fetch restricted to those domains) and follow links to detail pages,
//   4. independently re-fetches every claimed source and fact-checks the draft.
// It returns its findings as JSON; api/digest.js combines all regions, saves
// state and sends the single weekly email. This endpoint writes nothing.

import crypto from 'node:crypto';
import { REGIONS } from './_lib/regions.js';
import { readRepoFile, extractPublishedTitles } from './_lib/github.js';

export const config = { maxDuration: 300 };

const AGENT_MODEL = 'claude-opus-5-5';
const VERIFY_MODEL = 'claude-sonnet-4-5';
const TIME_BUDGET_MS = 280000; // leave headroom under maxDuration

// ─── Google News RSS (leads only — official sources are what get published) ──

async function fetchGoogleNewsRSS(query, sinceDate) {
  const encodedQuery = encodeURIComponent(`${query} after:${sinceDate}`);
  const url = `https://news.google.com/rss/search?q=${encodedQuery}&hl=en-AU&gl=AU&ceid=AU:en`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'OneSide Australia Updates Agent/1.0' },
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) return [];
    return parseRSSItems(await res.text());
  } catch (err) {
    console.error(`RSS fetch failed for "${query}":`, err.message);
    return [];
  }
}

function parseRSSItems(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    const title   = decodeXml(itemXml.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '');
    const link    = itemXml.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() || '';
    const pubDate = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || '';
    const source  = decodeXml(itemXml.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1] || '');
    if (title && link) items.push({ title, link, pubDate, source });
  }
  return items;
}

function decodeXml(str) {
  return str
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ').trim();
}

// ─── Page fetching ───────────────────────────────────────────────────────────

function decodeEntities(str) {
  return str
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

function extractPageText(html, limit) {
  return decodeEntities(html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, limit);
}

// "Link text | absolute URL" for every link on the page, so a new link like
// "Changes to Working with Children Check" shows up as a lead with its URL.
function extractLinks(html, baseUrl) {
  const links = new Set();
  const linkRegex = /<a\s[^>]*href="([^"#]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = linkRegex.exec(html)) !== null && links.size < 300) {
    const text = decodeEntities(m[2].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
    if (!text) continue;
    try {
      const url = new URL(decodeEntities(m[1]), baseUrl);
      if (url.protocol === 'https:' || url.protocol === 'http:') links.add(`${text} | ${url.href}`);
    } catch { /* ignore malformed hrefs */ }
  }
  return [...links];
}

async function fetchPage(url, textLimit) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OneSide Australia Updates Agent/2.0)' },
      signal: AbortSignal.timeout(15000)
    });
    if (!res.ok) return null;
    const html = await res.text();
    return { text: extractPageText(html, textLimit), links: extractLinks(html, url) };
  } catch (err) {
    console.error(`Page fetch failed for "${url}":`, err.message);
    return null;
  }
}

const hashText = (text) => crypto.createHash('sha256').update(text).digest('hex');

// ─── Watched pages: what changed since last week's snapshot ─────────────────

async function checkWatchedPages(region, previousState) {
  const snapshots = {};
  const changes = [];

  await Promise.all(region.watchedPages.map(async (page) => {
    const current = await fetchPage(page.url, 8000);
    if (!current) return;

    const hash = hashText(current.text);
    snapshots[page.url] = { hash, text: current.text, links: current.links, lastChecked: new Date().toISOString() };

    const prev = previousState[page.url];
    const newLinks = prev?.links ? current.links.filter(l => !prev.links.includes(l)) : [];
    if (!prev || prev.hash !== hash || newLinks.length > 0) {
      // Older snapshots stored no links, so pass the whole list for the agent to follow.
      changes.push({ ...page, oldText: prev?.text || null, newText: current.text,
        links: prev?.links ? newLinks : current.links.slice(0, 120), linksAreNew: Boolean(prev?.links) });
    }
  }));

  return { snapshots, changes };
}

// ─── The region agent ────────────────────────────────────────────────────────

function buildAgentPrompt(region, sinceDate, today, changes, articles, publishedTitles) {
  const changeSection = changes.length === 0
    ? '(none of the watched pages changed)'
    : changes.map(c => [
        `PAGE: ${c.label} (${c.url})`,
        c.oldText ? `PREVIOUS TEXT:\n${c.oldText}` : 'PREVIOUS TEXT: (first time this page has been tracked)',
        `CURRENT TEXT:\n${c.newText}`,
        c.links.length ? `${c.linksAreNew ? 'LINKS THAT ARE NEW SINCE LAST WEEK' : 'LINKS ON THIS PAGE'}:\n${c.links.join('\n')}` : ''
      ].filter(Boolean).join('\n\n')).join('\n\n---\n\n');

  const articleSection = articles.length === 0
    ? '(no news results)'
    : articles.map((a, i) => `[${i + 1}] ${a.title} (${a.source || 'unknown source'}, ${a.pubDate})`).join('\n');

  return `You are the ${region.name} updates agent for OneSide Australia, a child safety consultancy for Australian community sporting clubs. Your job is to find every genuinely new, official change to child safety requirements that affects sporting clubs in your area, so the clubs OneSide works with are not caught out.

Today is ${today}. Report changes published, announced, or taking effect since ${sinceDate} (or taking effect in the coming months, if announced since then).

YOUR AREA
${region.focus}

HOW TO WORK
1. Use web_search and web_fetch to check the official websites for your area yourself. Do not rely on the leads below alone; regulators often change requirements without any news coverage. Look specifically for: Working With Children Check / screening changes (new systems, new training or ID requirements, fees, renewal changes), child safe standards and compliance deadlines, reportable conduct schemes, changes of regulator or where guidance lives, new mandatory training, and new official guidance or resources for sport and recreation organisations.
2. When a page links to a "changes to…", "what's new", news or media release page, open it. The details usually live one click deeper than the landing page.
3. Investigate the leads below: watched pages that changed since last week, and news headlines. For a news lead, find the official page it is about; never cite the media article itself.
4. Skip anything already published (list below), anything outside your area, and anything that isn't about child safety obligations or resources relevant to organisations working with children. A general change (for example to Working With Children Checks or child safe standards) applies to sporting clubs and should be included; a change limited to an unrelated sector (schools only, early childhood only, aged care, disability services) should not, unless the official page itself says it applies to sport or community organisations.
5. Every fact you write must be stated on the official page you cite. Your work is independently re-checked against that page and anything it doesn't support is discarded.

LEADS: WATCHED PAGES THAT CHANGED SINCE LAST WEEK
${changeSection}

LEADS: NEWS HEADLINES SINCE ${sinceDate}
${articleSection}

ALREADY PUBLISHED (do not repeat these or anything substantially overlapping)
${publishedTitles.length ? publishedTitles.map(t => `- ${t}`).join('\n') : '(none yet)'}

OUTPUT
Finish with a single JSON object and nothing after it:
{"updates": [{"title": "Short descriptive title", "body": "2-3 sentence summary in plain Australian English, factual and helpful, no em dashes", "category": "${region.category}", "type": "New | Update | Reminder | Resource | News", "source": "Official organisation name", "sourceUrl": "https://the official page that states these facts", "date": "Month Year", "evidence": "a short direct quote from that page supporting the update"}]}
If you find nothing new, return {"updates": []}.`;
}

function parseAgentJson(text) {
  // The agent may think aloud before answering; the JSON is the last thing it writes.
  const starts = [...text.matchAll(/\{\s*"updates"/g)];
  const start = starts.length ? starts[starts.length - 1].index : -1;
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

async function runRegionAgent(region, prompt, deadline) {
  const tools = [
    { type: 'web_search_20260209', name: 'web_search', max_uses: 10, allowed_domains: region.domains,
      user_location: { type: 'approximate', country: 'AU' } },
    { type: 'web_fetch_20260209', name: 'web_fetch', max_uses: 12, allowed_domains: region.domains }
  ];
  const messages = [{ role: 'user', content: prompt }];
  let text = '';

  // Server-side tool loops can pause (stop_reason "pause_turn"); resend to resume.
  for (let attempt = 0; attempt < 4; attempt++) {
    const remaining = deadline - Date.now() - 45000; // keep time for verification
    if (remaining < 20000) throw new Error('ran out of time while searching');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'server-side-fallback-2026-07-01'
      },
      body: JSON.stringify({
        model: AGENT_MODEL,
        max_tokens: 16000,
        fallbacks: 'default',
        output_config: { effort: 'medium' },
        tools,
        messages
      }),
      signal: AbortSignal.timeout(remaining)
    });

    if (!response.ok) throw new Error(`Claude API ${response.status}: ${(await response.text()).substring(0, 300)}`);
    const data = await response.json();
    if (data.stop_reason === 'refusal') throw new Error('Claude declined the request');

    text += (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    if (data.stop_reason !== 'pause_turn') break;
    messages.push({ role: 'assistant', content: data.content });
  }

  const parsed = parseAgentJson(text);
  if (!parsed) throw new Error(`could not read agent output: ${text.slice(-300)}`);
  return Array.isArray(parsed.updates) ? parsed.updates : [];
}

// ─── Independent verification against the live source page ──────────────────

async function verifySourceClaim(update) {
  const page = update.sourceUrl ? await fetchPage(update.sourceUrl, 40000) : null;
  if (!page) return { verdict: 'UNVERIFIABLE', reason: 'the source page could not be fetched for checking' };

  const prompt = `You are a strict fact-checker for OneSide Australia, a child safety consultancy for Australian sporting clubs. Publishing an unsupported regulatory claim is a serious credibility risk for this business, so reject anything not directly and explicitly stated in the source text below.

DRAFT ITEM
Title: ${update.title}
Body: ${update.body}
Claimed source: ${update.source} (${update.sourceUrl})

ACTUAL TEXT FETCHED FROM THAT SOURCE URL JUST NOW:
${page.text}

Check strictly, using only the fetched text above — no outside knowledge, no inference:
1. Does the source text explicitly state the core facts asserted in the title and body? "Plausible" or "likely true" is not enough — it must be directly stated.
2. If the title or body claims relevance specifically to sport, sporting clubs, sporting organisations, or athletes, the fetched text must itself support that. A general requirement (e.g. a Working With Children Check or child safe standards change that applies to everyone working with children) does not need to mention sport. But a page about an unrelated sector (e.g. early childhood education, aged care, disability services) does NOT support a sport-relevance claim.
3. If the fetched text doesn't mention the claim at all, or covers a different topic than the URL was claimed to support, that's CONTRADICTED, not UNCONFIRMED.

Respond in exactly this JSON format, no other text:
{
  "verdict": "VERIFIED" | "CONTRADICTED" | "UNCONFIRMED",
  "reason": "one sentence explaining the verdict",
  "quote": "a direct quote (max 40 words) from the fetched text that supports the claim, or empty string if not VERIFIED"
}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({ model: VERIFY_MODEL, max_tokens: 400, messages: [{ role: 'user', content: prompt }] }),
      signal: AbortSignal.timeout(40000)
    });
    if (!response.ok) return { verdict: 'UNVERIFIABLE', reason: 'verification request failed' };
    const data = await response.json();
    const text = data.content?.[0]?.text?.trim() || '';
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    if (!['VERIFIED', 'CONTRADICTED', 'UNCONFIRMED'].includes(parsed.verdict)) {
      return { verdict: 'UNVERIFIABLE', reason: 'malformed verifier response' };
    }
    return parsed;
  } catch (e) {
    return { verdict: 'UNVERIFIABLE', reason: `verification failed: ${e.message}` };
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  const startedAt = Date.now();
  const deadline = startedAt + TIME_BUDGET_MS;

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const secret = req.headers['x-scan-secret'] || req.query.secret;
  if (secret !== process.env.SCAN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const regionKey = String(req.query.region || '').toUpperCase();
  const region = REGIONS[regionKey];
  if (!region) {
    return res.status(400).json({ error: `Unknown region "${req.query.region}". Use one of: ${Object.keys(REGIONS).join(', ')}` });
  }

  // 8-day window so a run that's a day late doesn't leave a gap.
  const sinceDate = req.query.since || new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const today = new Date().toISOString().split('T')[0];
  console.log(`[${regionKey}] Updates agent starting (since ${sinceDate})`);

  const [updatesFile, watchedFile] = await Promise.all([
    readRepoFile('updates.html'),
    readRepoFile('_watched-pages.json')
  ]);
  const publishedTitles = updatesFile ? extractPublishedTitles(updatesFile.text) : [];
  let previousState = {};
  try { previousState = watchedFile ? JSON.parse(watchedFile.text) : {}; } catch { /* start fresh */ }

  // Leads: watched-page changes and news headlines, gathered in parallel.
  const [{ snapshots, changes }, rssResults] = await Promise.all([
    checkWatchedPages(region, previousState),
    Promise.all(region.queries.map(q => fetchGoogleNewsRSS(q, sinceDate)))
  ]);
  const seen = new Set();
  const articles = rssResults.flat().filter(a => !seen.has(a.title) && seen.add(a.title)).slice(0, 60);
  console.log(`[${regionKey}] ${changes.length} watched-page change(s), ${articles.length} news lead(s)`);

  let drafted = [];
  let agentError = null;
  try {
    const prompt = buildAgentPrompt(region, sinceDate, today, changes, articles, publishedTitles);
    drafted = await runRegionAgent(region, prompt, deadline);
  } catch (e) {
    agentError = e.message;
    console.error(`[${regionKey}] Agent failed:`, e.message);
  }
  console.log(`[${regionKey}] Agent drafted ${drafted.length} update(s)`);

  const results = await Promise.all(drafted.map(async (update) => ({ update, result: await verifySourceClaim(update) })));
  const updates = [];
  const dropped = [];
  for (const { update, result } of results) {
    if (result.verdict === 'VERIFIED') {
      const { evidence, ...rest } = update;
      updates.push({ ...rest, verifiedQuote: result.quote });
    } else {
      dropped.push({ title: update.title, body: update.body, sourceUrl: update.sourceUrl, evidence: update.evidence || '', verdict: result.verdict, reason: result.reason });
      console.log(`[${regionKey}] Dropped "${update.title}" — ${result.verdict}: ${result.reason}`);
    }
  }

  return res.status(200).json({
    region: regionKey,
    regionName: region.name,
    sinceDate,
    updates,
    dropped,
    error: agentError,
    stats: { watchedPagesChanged: changes.length, newsLeads: articles.length, drafted: drafted.length, seconds: Math.round((Date.now() - startedAt) / 1000) },
    snapshots
  });
}
