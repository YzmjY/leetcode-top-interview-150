/**
 * 内容同步脚本：从上级目录的 MkDocs 内容库 (../docs + ../mkdocs.yml)
 * 生成站点所需的数据文件：
 *   src/content/<chapter-dir>/<file>.md   —— 题解 markdown 原文（拷贝）
 *   src/data/manifest.json                —— 章节 / 题目清单
 *
 * 用法：node scripts/sync-content.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, cpSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const siteRoot = resolve(here, '..');
const repoRoot = resolve(siteRoot, '..');
const docsDir = join(repoRoot, 'docs');
const mkdocsPath = join(repoRoot, 'mkdocs.yml');

const contentOut = join(siteRoot, 'src', 'content');
const dataOut = join(siteRoot, 'src', 'data');
const difficulty = JSON.parse(readFileSync(join(here, 'difficulty.json'), 'utf8'));

/* ---------- 解析 mkdocs.yml 的 nav 段 ---------- */
const mkdocs = readFileSync(mkdocsPath, 'utf8');
const lines = mkdocs.split(/\r?\n/);

/** @type {{name:string, problems:{num:number, slug:string, title:string, path:string}[]}[]} */
const chapters = [];
let current = null;
let inNav = false;

for (const line of lines) {
  if (/^nav:\s*$/.test(line)) { inNav = true; continue; }
  if (!inNav) continue;
  if (/^\S/.test(line)) break; // nav 段结束

  const chapterMatch = line.match(/^ {2}- (.+?):\s*$/);
  if (chapterMatch) {
    const name = chapterMatch[1];
    if (name === '首页') continue;
    current = { name, problems: [] };
    chapters.push(current);
    continue;
  }
  const itemMatch = line.match(/^ {6}- (.+?):\s+(\S+\.md)\s*$/);
  if (itemMatch && current) {
    const [, title, p] = itemMatch;
    if (title === '章节概述') continue;
    const numMatch = title.match(/^(\d+)\.\s*(.+)$/);
    const file = p.split('/').pop().replace(/\.md$/, '');
    current.problems.push({
      num: numMatch ? Number(numMatch[1]) : 0,
      title: numMatch ? numMatch[2] : title,
      slug: file,
      path: p,
    });
  }
}

/* ---------- 拷贝 markdown 并收集元信息 ---------- */
if (existsSync(contentOut)) rmSync(contentOut, { recursive: true, force: true });

let copied = 0;
for (const ch of chapters) {
  for (const prob of ch.problems) {
    const src = join(docsDir, prob.path);
    if (!existsSync(src)) {
      console.warn(`缺失文件: ${prob.path}`);
      continue;
    }
    const md = readFileSync(src, 'utf8');
    const chapterDir = prob.path.split('/')[0];
    const dest = join(contentOut, chapterDir, `${prob.slug}.md`);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, md);
    prob.chapterDir = chapterDir;
    prob.hasDemo = /<iframe[\s\S]*?assets\/interactive\//.test(md);
    prob.difficulty = difficulty[String(prob.num)] || 'medium';
    // 提取首个 ```go 代码块
    const codeMatch = md.match(/```go\n([\s\S]*?)```/);
    prob.hasCode = !!codeMatch;
    copied++;
  }
}

mkdirSync(dataOut, { recursive: true });
const total = chapters.reduce((s, c) => s + c.problems.length, 0);
writeFileSync(
  join(dataOut, 'manifest.json'),
  JSON.stringify({ total, chapters }, null, 2)
);
console.log(`已同步 ${copied} 篇题解，共 ${chapters.length} 个章节 / ${total} 道题目`);
