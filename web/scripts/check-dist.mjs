// Checks the prerendered page: nothing the CSP (script-src 'self') would block, and the SEO metadata.
import { existsSync, readFileSync } from 'node:fs';

const root = new URL('../dist/web/browser/', import.meta.url);
const html = readFileSync(new URL('index.html', root), 'utf8');
const problems = [];

// --- CSP ---
if (/\son[a-z]+\s*=\s*["']/i.test(html)) {
  problems.push('inline event handler attribute (e.g. onload=)');
}

for (const match of html.matchAll(/<script\b([^>]*)>/gi)) {
  const attrs = match[1];
  if (/\ssrc\s*=/.test(attrs)) continue;
  const type = /\stype\s*=\s*["']([^"']+)["']/i.exec(attrs)?.[1]?.toLowerCase();
  if (type === 'application/ld+json' || type === 'application/json') continue;
  problems.push(`inline executable <script${attrs}>`);
}

// --- SEO ---
const DESCRIPTION =
  'Meoz Labs is a creative technology hub crafting innovative digital solutions, exploring bold new ideas and pushing the boundaries of web development and software engineering.';
const PORTFOLIO = 'https://duytan.meozlabs.com/';
const GITHUB = 'https://github.com/nguyendtan2030';

const expectIn = (needle, label) => {
  if (!html.includes(needle)) problems.push(`missing ${label}`);
};

if (!/<title>Meoz Labs - Innovation (&amp;|&) Technology<\/title>/.test(html)) {
  problems.push('missing <title>Meoz Labs - Innovation & Technology</title>');
}
expectIn(`name="description" content="${DESCRIPTION}"`, 'meta description');
expectIn('property="og:image" content="https://www.meozlabs.com/images/meoz-lab-560.jpg"', 'og:image');
expectIn('rel="canonical" href="https://www.meozlabs.com/"', 'canonical link');

const ldJson = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html)?.[1];
if (!ldJson) {
  problems.push('missing JSON-LD');
} else {
  const data = JSON.parse(ldJson);
  if (data['@type'] !== 'Organization' || data.name !== 'MeozLabs') problems.push('JSON-LD is not the MeozLabs Organization');
  const founder = data.founder ?? {};
  if (founder['@type'] !== 'Person' || founder.name !== 'Tan Nguyen') problems.push('JSON-LD founder is not Person Tan Nguyen');
  for (const url of [PORTFOLIO, GITHUB]) {
    if (!founder.sameAs?.includes(url)) problems.push(`JSON-LD founder.sameAs lacks ${url}`);
  }
}

for (const file of ['robots.txt', 'sitemap.xml']) {
  if (!existsSync(new URL(file, root))) problems.push(`missing ${file}`);
}

if (problems.length) {
  console.error('dist FAILED:\n- ' + problems.join('\n- '));
  process.exit(1);
}
console.log('dist OK');
