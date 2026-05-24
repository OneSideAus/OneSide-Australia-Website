// api/contact.js
// OneSide Australia — Contact / Waitlist notification endpoint
// Sends Angela an email via Resend when a form is submitted

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { formType, name, club, email, sport, state, message } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  let subject, html;

  if (formType === 'waitlist') {
    subject = `Sport waitlist signup — ${sport || 'Unknown sport'}${club ? ` · ${club}` : ''}`;
    html = buildWaitlistEmail({ name, club, email, sport, state });
  } else if (formType === 'hero') {
    subject = `Homepage enquiry — ${name || 'Website visitor'}${club ? ` · ${club}` : ''}`;
    html = buildContactEmail({ label: 'Homepage enquiry', name, club, email });
  } else {
    subject = `Discovery call request — ${name || 'Website visitor'}${club ? ` · ${club}` : ''}`;
    html = buildContactEmail({ label: 'Discovery call request', name, club, email, sport, state, message });
  }

  try {
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'OneSide Website <contact@onesideaustralia.com.au>',
        to: ['info@onesideaustralia.com.au'],
        reply_to: email,
        subject,
        html
      })
    });

    if (!emailRes.ok) {
      const err = await emailRes.text();
      console.error('Resend error:', err);
      return res.status(500).json({ error: 'Failed to send notification' });
    }

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('Contact handler error:', err);
    return res.status(500).json({ error: err.message });
  }
}

function row(label, value) {
  if (!value) return '';
  return `<tr>
    <td style="padding:7px 16px 7px 0;font-size:13px;color:#7A95AA;white-space:nowrap;vertical-align:top;">${label}</td>
    <td style="padding:7px 0;font-size:14px;color:#0D1F35;font-weight:500;">${value}</td>
  </tr>`;
}

function buildContactEmail({ label, name, club, email, sport, state, message }) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;background:#f0f4f8;padding:32px 16px;margin:0;">
  <div style="max-width:560px;margin:0 auto;">
    <div style="background:#0D1F35;border-radius:12px;padding:24px;margin-bottom:16px;text-align:center;">
      <p style="font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#D4614E;margin:0 0 6px;">OneSide Australia</p>
      <h1 style="font-size:1.15rem;color:white;margin:0;font-weight:600;">${label}</h1>
    </div>
    <div style="background:white;border-radius:12px;padding:28px;margin-bottom:16px;">
      <table style="width:100%;border-collapse:collapse;">
        ${row('Name', name)}
        ${row('Email', email)}
        ${row('Club', club)}
        ${row('Sport', sport)}
        ${row('State', state)}
        ${message ? `<tr><td colspan="2" style="padding-top:16px;border-top:1px solid #e2eaf0;"></td></tr><tr><td style="padding:6px 16px 6px 0;font-size:13px;color:#7A95AA;vertical-align:top;">Message</td><td style="padding:6px 0;font-size:14px;color:#0D1F35;line-height:1.6;">${message}</td></tr>` : ''}
      </table>
    </div>
    <p style="font-size:12px;color:#7A95AA;text-align:center;margin:0;">Reply to this email to respond directly to ${name || 'the enquirer'}.</p>
  </div>
</body>
</html>`;
}

function buildWaitlistEmail({ name, club, email, sport, state }) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;background:#f0f4f8;padding:32px 16px;margin:0;">
  <div style="max-width:560px;margin:0 auto;">
    <div style="background:#0D1F35;border-radius:12px;padding:24px;margin-bottom:16px;text-align:center;">
      <p style="font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#D4614E;margin:0 0 6px;">OneSide Australia</p>
      <h1 style="font-size:1.15rem;color:white;margin:0;font-weight:600;">Sport waitlist signup</h1>
    </div>
    <div style="background:white;border-radius:12px;padding:28px;">
      <table style="width:100%;border-collapse:collapse;">
        ${row('Sport', sport)}
        ${row('Name', name)}
        ${row('Club', club)}
        ${row('Email', email)}
        ${row('State', state)}
      </table>
    </div>
  </div>
</body>
</html>`;
}
