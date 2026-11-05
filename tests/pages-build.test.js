import test,{before} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile,readdir,access} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),dist=path.join(root,'dist');
before(()=>execFileSync(process.execPath,['scripts/build-pages.mjs'],{cwd:root,stdio:'pipe'}));
test('发布包仅包含网站运行文件和版本信息',async()=>{
 assert.deepEqual((await readdir(dist)).sort(),['.nojekyll','build-info.json','index.html','src']);
 for(const file of await readdir(path.join(dist,'src')))assert.match(file,/\.(?:js|css|svg)$/);
 const info=JSON.parse(await readFile(path.join(dist,'build-info.json'),'utf8'));assert.equal(info.questions,150);assert.match(info.commit,/^[0-9a-f]{40}$/);
});
test('项目站子目录下入口和全部模块依赖可正确解析',async()=>{
 const base=new URL('https://example.github.io/leetcode-top-interview-150/');
 const html=await readFile(path.join(dist,'index.html'),'utf8');
 assert.ok(!html.includes('"/src/'),'资源路径不能跳到根域');
 const assets=[...html.matchAll(/(?:href|src)="(\.\/src\/[^"#]+)"/g)].map(m=>new URL(m[1],base));
 for(const name of ['style.css','collection.css','editorial.css','app.js'])assert.ok(assets.some(url=>url.pathname.endsWith(`/src/${name}`)),`发布入口缺少 ${name}`);
 const queue=[...assets],seen=new Set();
 while(queue.length){const url=queue.shift();if(seen.has(url.href))continue;seen.add(url.href);assert.ok(url.pathname.startsWith(base.pathname));const local=path.join(dist,url.pathname.slice(base.pathname.length));await access(local);if(!url.pathname.endsWith('.js'))continue;const source=await readFile(local,'utf8');for(const match of source.matchAll(/\b(?:from\s*|import\s*)['"](\.\/[^'"]+)['"]/g))queue.push(new URL(match[1],url));}
 assert.ok([...seen].some(url=>url.endsWith('/lessons-a.js')));assert.ok([...seen].some(url=>url.endsWith('/reasoning.js')));
});
