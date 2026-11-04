import {readdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
for(const directory of ['src','scripts'])for(const filename of await readdir(new URL(`../${directory}/`,import.meta.url))){
 if(!filename.endsWith('.js')&&!filename.endsWith('.mjs'))continue;
 const result=spawnSync(process.execPath,['--check',`${directory}/${filename}`],{stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);
}
console.log('All application and maintenance modules pass syntax checks.');
