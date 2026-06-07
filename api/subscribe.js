// api/subscribe.js
// OneSide Australia — Newsletter subscription endpoint
// Sends a notification email that triggers the Power Automate flow
// which writes the subscriber to the OneDrive spreadsheet

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  const sanitised = email.trim().toLowerCase();

  try {
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'OneSide Updates <updates@onesideaustralia.com.au>',
        to: ['info@onesideaustralia.com.au'],
        subject: `New subscriber: ${sanitised}`,
        html: `<p>${sanitised}</p>`
      })
    });

    if (!emailRes.ok) {
      const err = await emailRes.text();
      console.error('Resend error:', err);
      return res.status(500).json({ error: 'Failed to process subscription' });
    }

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('Subscribe handler error:', err);
    return res.status(500).json({ error: err.message });
  }
}
