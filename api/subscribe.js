// api/subscribe.js
// OneSide Australia — Newsletter subscription endpoint
// Writes directly to OneDrive Excel spreadsheet via Microsoft Graph API
// and sends a notification email via Resend

async function getGraphToken() {
  const res = await fetch(
    `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'client_credentials',
        client_id:     process.env.AZURE_CLIENT_ID,
        client_secret: process.env.AZURE_CLIENT_SECRET,
        scope:         'https://graph.microsoft.com/.default'
      })
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(`Token error: ${JSON.stringify(data)}`);
  return data.access_token;
}

async function isAlreadySubscribed(email, token) {
  const userEmail = 'info@onesideaustralia.com.au';
  const filePath  = 'OneSide Subscribers/Subscribers.xlsx';
  const tableName = 'SubscriberTable';

  const url = `https://graph.microsoft.com/v1.0/users/${userEmail}/drive/root:/${filePath}:/workbook/tables/${tableName}/rows`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!res.ok) return false; // if check fails, allow the add to proceed
  const data = await res.json();
  const rows = data.value || [];
  return rows.some(row => {
    const cellEmail = (row.values?.[0]?.[0] || '').toString().trim().toLowerCase();
    return cellEmail === email;
  });
}

async function addSubscriberToSheet(email, token) {
  const userEmail  = 'info@onesideaustralia.com.au';
  const filePath   = 'OneSide Subscribers/Subscribers.xlsx';
  const tableName  = 'SubscriberTable';
  const now        = new Date();
  const date       = `${now.getDate()} ${now.toLocaleString('en-AU', { month: 'long' })} ${now.getFullYear()}`;

  const url = `https://graph.microsoft.com/v1.0/users/${userEmail}/drive/root:/${filePath}:/workbook/tables/${tableName}/rows/add`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type':  'application/json'
    },
    body: JSON.stringify({ values: [[email, date]] })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Graph API error: ${err}`);
  }
  return true;
}

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
    // 1. Check for duplicate
    const token = await getGraphToken();
    const duplicate = await isAlreadySubscribed(sanitised, token);
    if (duplicate) {
      return res.status(200).json({ ok: true, duplicate: true });
    }

    // 2. Write to spreadsheet via Graph API
    await addSubscriberToSheet(sanitised, token);

    // 3. Send notification email
    if (process.env.RESEND_API_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from:    'OneSide Updates <updates@onesideaustralia.com.au>',
          to:      ['info@onesideaustralia.com.au'],
          subject: `New subscriber: ${sanitised}`,
          html:    `<p><strong>${sanitised}</strong> has subscribed to the OneSide newsletter.</p>`
        })
      }).catch(err => console.error('Notification email failed (non-fatal):', err.message));
    }

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('Subscribe handler error:', err);
    return res.status(500).json({ error: err.message });
  }
}
