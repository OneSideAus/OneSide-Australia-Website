// api/approve.js
// Old digest emails linked here with the whole update in the URL, and it
// published without any password. Approving now happens on the password-
// protected review page, so this only redirects there and publishes nothing.

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.writeHead(302, { Location: '/api/review' });
  res.end();
}
