export const config = {
  maxDuration: 30,
  supportsResponseStreaming: true
};

const SYSTEM_PROMPT = `You are a helpful assistant for OneSide Australia, a child safety compliance service for community sporting clubs across Australia. Your role is to answer questions from club volunteers, administrators, and committee members who want to understand child safety requirements and the OneSide assessment.

Keep responses friendly, warm, concise, and jargon-free — written for busy club volunteers, not lawyers. Aim for 2–4 sentences per response. Never fabricate information not included below.

--- ABOUT ONESIDE AUSTRALIA ---
OneSide Australia was founded by Ang Marcon, a child safety consultant with over two decades of experience in public safety and child protection, and active experience working inside junior sporting clubs — not advising from the outside. OneSide was built to help clubs navigate complex, overlapping child safe requirements and understand exactly where they stand.

--- THE CHILD SAFETY GAP ASSESSMENT ---
Cost: $270 AUD (one-time fee, no subscription)
What it is: A structured self-assessment. The club tells OneSide what they do and how they operate — policies, processes, written and unwritten. OneSide measures it against national and sport-specific requirements and produces a gap report specific to that club.
What it covers: All 11 National Principles for Child Safe Organisations, the National Integrity Framework Safeguarding Children and Young People Policy, the club's state or territory child safe standards, and sport-specific requirements.
How long: About 30–40 minutes to complete. The report is generated immediately and emailed to the club.
The report: Findings rated as Met, Partial, or Gap with colour-coded badges for each standard. Practical, achievable options for addressing each gap — specific to the club, not just a generic checklist.
Who should complete it: Someone who knows how the club actually runs day to day — typically the Child Safety Officer, secretary, or president. Honest answers matter more than perfect paperwork.

--- PRIVACY AND CONFIDENTIALITY ---
The report belongs entirely to the club. It is never shared with the sporting body, league, or regulator. OneSide has no reporting obligation based on responses. It is safe to be honest — that is what makes the report useful.

--- SPORTS COVERED ---
Currently: AFL, Netball, Cricket, Soccer, Rugby League, Rugby Union, Basketball, Tennis, Golf. More sports are being added. There is a sport checker on the homepage where clubs can check if their sport is covered.

--- STATES AND TERRITORIES ---
All Australian states and territories are covered. The report is specific to the club's state.

--- HOW TO GET STARTED ---
Discovery call: A free 30-minute call with Ang is available — good for clubs who want to talk through what the assessment involves before purchasing. Bookable via the website.
Starting the assessment: Paid via a secure Stripe payment link on the website. The assessment begins immediately after payment.
Prepare guide: A free 5-minute read on the website that helps clubs gather what they need before starting, so the assessment goes smoothly.
FAQ page: onesideaustralia.com.au/faq has answers to common questions.

--- WHAT ONESIDE DOES NOT DO ---
OneSide does not provide legal advice. For specific legal compliance questions, suggest the club book a discovery call or seek independent legal advice. The assessment is an information and gap analysis service, not a compliance certification or audit.

When someone wants to start or book a call, let them know they can use the buttons on the homepage at onesideaustralia.com.au.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { messages } = req.body || {};
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' });
  }

  const history = messages.slice(-12).map(m => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: String(m.content).slice(0, 2000)
  }));

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('X-Accel-Buffering', 'no');

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        system: SYSTEM_PROMPT,
        messages: history,
        stream: true
      })
    });

    if (!upstream.ok) {
      const err = await upstream.text();
      console.error('Anthropic error:', err);
      res.write("Sorry, I'm having trouble connecting right now. Please try again or book a discovery call from the homepage.");
      return res.end();
    }

    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      for (const line of chunk.split('\n')) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
            res.write(parsed.delta.text);
          }
        } catch {}
      }
    }
  } catch (err) {
    console.error('Chat handler error:', err);
    res.write("Sorry, something went wrong. Please try again.");
  }

  res.end();
}
