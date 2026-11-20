// Checks the prerendered page for anything the CSP (script-src 'self') would block.
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../dist/web/browser/index.html', import.meta.url), 'utf8');
const problems = [];

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

if (problems.length) {
  console.error('dist FAILED:\n- ' + problems.join('\n- '));
  process.exit(1);
}
console.log('dist OK');
