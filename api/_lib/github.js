// api/_lib/github.js
// Read/write files in the website repo via the GitHub contents API.

const REPO_API = 'https://api.github.com/repos/OneSideAus/OneSide-Australia-Website/contents';

export const ghHeaders = () => ({
  'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
  'Accept': 'application/vnd.github.v3+json',
  'Content-Type': 'application/json',
  'User-Agent': 'OneSide-Updates-Agent'
});

// Returns { text, sha } or null if the file doesn't exist / can't be read.
export async function readRepoFile(path) {
  try {
    const res = await fetch(`${REPO_API}/${path}`, { headers: ghHeaders() });
    if (!res.ok) return null;
    const data = await res.json();
    return { text: Buffer.from(data.content, 'base64').toString('utf-8'), sha: data.sha };
  } catch (e) {
    console.warn(`Could not read ${path}:`, e.message);
    return null;
  }
}

export async function writeRepoFile(path, text, message, sha) {
  const res = await fetch(`${REPO_API}/${path}`, {
    method: 'PUT',
    headers: ghHeaders(),
    body: JSON.stringify({
      message,
      content: Buffer.from(text).toString('base64'),
      ...(sha ? { sha } : {})
    })
  });
  if (!res.ok) console.error(`Failed to write ${path}:`, await res.text());
  return res.ok;
}

// Titles of every card currently on the Updates page, used for de-duplication.
export function extractPublishedTitles(updatesHtml) {
  const titles = [];
  const titleRegex = /<h5>([^<]+)<\/h5>/g;
  let m;
  while ((m = titleRegex.exec(updatesHtml)) !== null) {
    titles.push(m[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim());
  }
  return titles;
}
