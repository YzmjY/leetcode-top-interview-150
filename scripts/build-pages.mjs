import {readFile,writeFile,mkdir,rm,lstat} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(fileURLToPath(new URL('../',import.meta.url)));
const output=path.resolve(root,'dist');
// Recursive cleanup is confined to this project's literal dist directory.
if(path.dirname(output)!==root||path.basename(output)!=='dist')throw Error('Unsafe build directory');
try{if((await lstat(output)).isSymbolicLink())throw Error('dist must not be a symbolic link');}catch(error){if(error.code!=='ENOENT')throw error;}
await rm(output,{recursive:true,force:true});
await mkdir(path.join(output,'src'),{recursive:true});
const html=await readFile(path.join(root,'index.html'),'utf8');
if(html.includes('"/src/'))throw Error('Pages project sites require relative asset URLs');
await writeFile(path.join(output,'index.html'),html);
const queue=[...html.matchAll(/(?:href|src)="(\.\/src\/[^"#]+)"/g)].map(m=>m[1].slice(2));
const copied=new Set();
while(queue.length){
 const file=queue.shift();if(copied.has(file))continue;
 if(!/^src\/[a-z0-9-]+\.(js|css|svg)$/i.test(file))throw Error(`Unexpected public asset: ${file}`);
 const sourcePath=path.resolve(root,file);
 if(path.dirname(sourcePath)!==path.join(root,'src')||(await lstat(sourcePath)).isSymbolicLink())throw Error(`Unsafe public asset: ${file}`);
 const source=await readFile(sourcePath,'utf8');await writeFile(path.join(output,file),source);copied.add(file);
 if(file.endsWith('.js'))for(const match of source.matchAll(/\b(?:from\s*|import\s*)['"](\.\/[^'"]+)['"]/g))queue.push(path.posix.normalize(path.posix.join(path.posix.dirname(file),match[1])));
}
const commit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
await writeFile(path.join(output,'build-info.json'),JSON.stringify({commit,questions:150},null,2)+'\n');
await writeFile(path.join(output,'.nojekyll'),'');
console.log(`GitHub Pages bundle: ${copied.size+3} files in dist/; commit ${commit}`);
