/**
 * 演示迁移脚本：把 docs/assets/interactive/*.html 中的内联演示脚本
 * 批量转换为 React 应用可加载的 ES 模块：
 *   site/src/demo/legacy/gen/<num>-<slug>.js   —— 演示定义模块
 *   site/src/demo/legacy/modules.ts            —— 题号 → 懒加载器 映射
 *
 * 用法：node scripts/migrate-demos.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const siteRoot = resolve(here, '..');
const repoRoot = resolve(siteRoot, '..');
const srcDir = join(repoRoot, 'docs', 'assets', 'interactive');
const genDir = join(siteRoot, 'src', 'demo', 'legacy', 'gen');

const manifest = JSON.parse(readFileSync(join(siteRoot, 'src', 'data', 'manifest.json'), 'utf8'));
const knownNums = new Set(manifest.chapters.flatMap((c) => c.problems.map((p) => p.num)));

if (existsSync(genDir)) rmSync(genDir, { recursive: true, force: true });
mkdirSync(genDir, { recursive: true });

const files = readdirSync(srcDir).filter((f) => /^\d+-.*-demo\.html$/.test(f));
const entries = [];
const warnings = [];

for (const file of files) {
  const num = Number(file.match(/^(\d+)-/)[1]);
  const base = file.replace(/\.html$/, '');
  const html = readFileSync(join(srcDir, file), 'utf8');

  // 提取不带 src 的内联 <script> 块
  const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)];
  if (scripts.length !== 1) {
    warnings.push(`${file}: 内联脚本数量异常 (${scripts.length})`);
    continue;
  }
  const body = scripts[0][1].trim();
  if (!body.includes('Demo.create')) {
    warnings.push(`${file}: 未找到 Demo.create`);
    continue;
  }
  if (!knownNums.has(num)) {
    warnings.push(`${file}: 题号 ${num} 不在 manifest 中`);
    continue;
  }

  const mod = `// 由 scripts/migrate-demos.mjs 自动生成，请勿手改
// 源文件：docs/assets/interactive/${file}
import { createDemoScope } from '../runtime'

export default function define() {
  const Demo = createDemoScope()
${body.split('\n').map((l) => (l ? '  ' + l : '')).join('\n')}
  return Demo.__config
}
`;
  writeFileSync(join(genDir, `${base}.js`), mod);
  entries.push({ num, base });
}

entries.sort((a, b) => a.num - b.num);

const index = `// 由 scripts/migrate-demos.mjs 自动生成，请勿手改
// 题号 → 旧版演示模块懒加载器
import type { LegacyConfig } from './runtime'

export const legacyModules: Record<number, () => Promise<{ default: () => LegacyConfig | null }>> = {
${entries.map((e) => `  ${e.num}: () => import('./gen/${e.base}.js'),`).join('\n')}
}
`;
writeFileSync(join(siteRoot, 'src', 'demo', 'legacy', 'modules.ts'), index);

console.log(`已迁移 ${entries.length} 个演示`);
if (warnings.length) {
  console.log('警告：');
  warnings.forEach((w) => console.log('  - ' + w));
}
const missing = [...knownNums].filter((n) => !entries.some((e) => e.num === n)).sort((a, b) => a - b);
if (missing.length) console.log('缺少演示的题目：', missing.join(', '));
