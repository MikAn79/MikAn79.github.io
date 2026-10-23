import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectDir = path.dirname(fileURLToPath(import.meta.url));
const rawUrl = process.argv[2];

if (!rawUrl) {
  console.error('Укажите основной HTTPS-адрес сайта, например: node generate-indexing-files.mjs https://example.ru');
  process.exit(1);
}

let siteUrl;
try {
  siteUrl = new URL(rawUrl);
} catch {
  console.error('Адрес сайта должен быть корректным URL, например https://example.ru');
  process.exit(1);
}

if (siteUrl.protocol !== 'https:' || siteUrl.username || siteUrl.password || siteUrl.pathname !== '/' || siteUrl.search || siteUrl.hash) {
  console.error('Укажите только основной HTTPS-адрес сайта без пути, параметров и якоря. Пример: https://example.ru');
  process.exit(1);
}

const origin = siteUrl.origin;
const sitemapUrl = `${origin}/sitemap.xml`;
const robots = `User-agent: *\nAllow: /\n\nSitemap: ${sitemapUrl}\n`;
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${origin}/</loc>\n  </url>\n</urlset>\n`;

const indexPath = path.join(projectDir, 'index.html');
let html = await readFile(indexPath, 'utf8');
const canonicalTag = `<link rel="canonical" href="${origin}/">`;
const ogUrlTag = `<meta property="og:url" content="${origin}/">`;

if (/<link\s+rel=["']canonical["'][^>]*>/i.test(html)) {
  html = html.replace(/<link\s+rel=["']canonical["'][^>]*>/i, canonicalTag);
} else {
  html = html.replace('</head>', `  ${canonicalTag}\n</head>`);
}

if (/<meta\s+property=["']og:url["'][^>]*>/i.test(html)) {
  html = html.replace(/<meta\s+property=["']og:url["'][^>]*>/i, ogUrlTag);
} else {
  html = html.replace(canonicalTag, `${canonicalTag}\n  ${ogUrlTag}`);
}

await Promise.all([
  writeFile(path.join(projectDir, 'robots.txt'), robots),
  writeFile(path.join(projectDir, 'sitemap.xml'), sitemap),
  writeFile(indexPath, html),
]);

console.log(`Созданы robots.txt и sitemap.xml для ${origin}; canonical и og:url добавлены в index.html.`);
