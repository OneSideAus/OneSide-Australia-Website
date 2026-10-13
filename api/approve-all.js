// api/approve-all.js
// Old digest emails linked here with the scan secret in the URL. Approving now
// happens on the password-protected review page, so this only redirects there.

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.writeHead(302, { Location: '/api/review?do=approve-all' });
  res.end();
}
