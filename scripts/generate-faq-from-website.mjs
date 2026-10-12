#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_SITE = 'https://tattantat67k1.web.app';
const DEFAULT_ARTICLES = 'outputs/tattantat67k1-articles.csv';
const DEFAULT_OUTPUT = 'outputs/tattantat67k1-faq.csv';

function option(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

const config = {
  site: option('site', DEFAULT_SITE).replace(/\/$/, ''),
  articles: option('articles', DEFAULT_ARTICLES),
  output: option('out', DEFAULT_OUTPUT),
  publish: process.argv.includes('--publish'),
  categoryId: Number(option('category-id', process.env.TALK67_FAQ_CATEGORY_ID || '')) || null,
  agentId: Number(option('agent-id', process.env.TALK67_FAQ_AGENT_ID || '')) || null,
  maxPages: Math.max(1, Number(option('max-pages', '40')) || 40),
};

function parseCsv(text) {
  const rows = [];
  let row = [], cell = '', quoted = false;
  text = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { cell += '"'; i += 1; }
      else quoted = !quoted;
    } else if (char === ',' && !quoted) { row.push(cell); cell = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i += 1;
      row.push(cell); cell = '';
      if (row.some((value) => value.length)) rows.push(row);
      row = [];
    } else cell += char;
  }
  row.push(cell);
  if (row.some((value) => value.length)) rows.push(row);
  return rows;
}

function csvCell(value) { return `"${String(value ?? '').replaceAll('"', '""')}"`; }
function toCsv(rows) { return `\uFEFF${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}\r\n`; }
function decode(value) {
  return String(value ?? '')
    .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'").replace(/&lt;/gi, '<').replace(/&gt;/gi, '>');
}
function stripHtml(value) {
  return decode(String(value ?? '').replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}
function firstMatch(text, expression) { return decode(text.match(expression)?.[1]?.trim() ?? ''); }
function compact(value, limit = 1100) {
  const text = stripHtml(value);
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit);
  return `${cut.slice(0, Math.max(cut.lastIndexOf('.'), cut.lastIndexOf(' ')))}…`;
}
function urlFromHtml(html, fallback) {
  const href = html.match(/href=["'](https?:\/\/[^"']+)["']/i)?.[1];
  return href || fallback;
}
function featureName(title) {
  return title.replace(/^Tổng quan\s+/i, '').replace(/^Hệ thống\s+/i, '').trim();
}
function makeFaqs(article, index) {
  const name = featureName(article.name);
  const source = article.url || config.site;
  const summary = compact(article.content, 1250);
  const usage = summary.match(/(?:Người dùng|Người xem|Người chơi|Quản trị viên)[^.]{20,}\./g)?.slice(0, 3).join(' ') || summary;
  const link = `\n\n[Xem trên Tất tần tật Phú Tân](${source})`;
  return [
    {
      question: index === 0 ? 'Tất tần tật Phú Tân 67K1 có những tính năng gì?' : `${name} là gì và dùng để làm gì?`,
      answers: `${summary}${link}`.slice(0, 3995), source_url: source, article: article.name,
    },
    {
      question: index === 0 ? 'Tôi bắt đầu sử dụng website Tất tần tật Phú Tân từ đâu?' : `Làm thế nào để sử dụng ${name}?`,
      answers: `${compact(usage, 900)} Mở liên kết bên dưới và làm theo hướng dẫn hiển thị trên trang.${link}`.slice(0, 3995), source_url: source, article: article.name,
    },
  ];
}

async function fetchText(url) {
  const response = await fetch(url, { headers: { 'user-agent': 'tattantat67k1-faq-generator/1.0' }, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.text();
}

async function crawlWebsite() {
  const found = [];
  try {
    const sitemap = await fetchText(`${config.site}/sitemap_v1.xml`);
    const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => decode(match[1])).slice(0, config.maxPages);
    for (const url of urls) {
      try {
        const html = await fetchText(url);
        const title = firstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
        const description = firstMatch(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)
          || firstMatch(html, /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
        if (title || description) found.push({ name: title || new URL(url).pathname, content: description, url });
      } catch (error) { console.warn(`Bỏ qua ${url}: ${error.message}`); }
    }
  } catch (error) { console.warn(`Không đọc được sitemap, tiếp tục bằng article CSV: ${error.message}`); }
  return found;
}

async function loadArticles() {
  const text = await fs.readFile(config.articles, 'utf8');
  const [headers, ...data] = parseCsv(text);
  const nameIndex = headers.findIndex((value) => /^(name|title|tên|tiêu đề)$/i.test(value.trim()));
  const contentIndex = headers.findIndex((value) => /^(content|nội dung)$/i.test(value.trim()));
  if (nameIndex < 0 || contentIndex < 0) throw new Error('Article CSV cần cột Name/Title và Content.');
  return data.filter((row) => row[nameIndex]?.trim() && row[contentIndex]?.trim()).map((row) => ({
    name: row[nameIndex].trim(), content: row[contentIndex].trim(), url: urlFromHtml(row[contentIndex], config.site),
  }));
}

async function gateway(body) {
  const base = process.env.TALK67_SUPABASE_URL?.replace(/\/$/, '');
  const anonKey = process.env.TALK67_SUPABASE_ANON_KEY;
  const token = process.env.TALK67_ACCESS_TOKEN;
  const companyId = Number(process.env.TALK67_COMPANY_ID);
  if (!base || !anonKey || !token || !companyId) {
    throw new Error('Thiếu TALK67_SUPABASE_URL, TALK67_SUPABASE_ANON_KEY, TALK67_ACCESS_TOKEN hoặc TALK67_COMPANY_ID.');
  }
  const response = await fetch(`${base}/functions/v1/api`, {
    method: 'POST', headers: { apikey: anonKey, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: '/backend/cs-agent/v1/faq', method: body.method, company_id: companyId, params: body.params || {}, body: body.data || {} }),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok || json.code !== 0) throw new Error(json.message || `HTTP ${response.status}`);
  return json.data;
}

async function publishFaqs(faqs) {
  const existing = await gateway({ method: 'GET', params: { page: 1, limit: 500 } });
  const questions = new Set((existing?.items || []).map((item) => String(item.question || '').trim().toLocaleLowerCase('vi')));
  let created = 0, skipped = 0;
  for (const faq of faqs) {
    const key = faq.question.trim().toLocaleLowerCase('vi');
    if (questions.has(key)) { skipped += 1; continue; }
    await gateway({ method: 'POST', data: { question: faq.question, answers: faq.answers, category_id: config.categoryId, agent_id: config.agentId } });
    questions.add(key); created += 1;
    console.log(`Đã tạo FAQ: ${faq.question}`);
  }
  return { created, skipped };
}

async function main() {
  const [articles, crawled] = await Promise.all([loadArticles(), crawlWebsite()]);
  // A React SPA often returns the same app-shell title/description for every
  // route. Use crawled metadata only as a fallback; curated articles contain
  // the rendered feature detail and canonical links.
  if (!articles.length) articles.push(...crawled.filter((page) => page.content));
  const seen = new Set();
  const faqs = articles.flatMap(makeFaqs).filter((faq) => {
    const key = faq.question.toLocaleLowerCase('vi');
    if (seen.has(key)) return false;
    seen.add(key); return true;
  });
  await fs.mkdir(path.dirname(config.output), { recursive: true });
  await fs.writeFile(config.output, toCsv([
    ['question', 'answers', 'category_id', 'agent_id', 'source_url', 'source_article'],
    ...faqs.map((faq) => [faq.question, faq.answers, config.categoryId || '', config.agentId || '', faq.source_url, faq.article]),
  ]), 'utf8');
  console.log(`Đã tạo ${faqs.length} FAQ tại ${config.output}.`);
  if (config.publish) {
    const result = await publishFaqs(faqs);
    console.log(`Publish hoàn tất: tạo ${result.created}, bỏ qua ${result.skipped} FAQ đã tồn tại.`);
  } else console.log('Chưa ghi lên 67talk. Dùng --publish sau khi kiểm tra CSV và cấu hình biến môi trường.');
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
