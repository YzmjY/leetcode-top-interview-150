import {spawnSync} from 'node:child_process';
import {writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {lessons} from '../src/lessons.js';
const source=lessons.map(lesson=>({id:lesson.id,code:Array.isArray(lesson.code)?lesson.code.join('\n'):lesson.code}));
const result=spawnSync('go',['run','scripts/format-go-helper.go'],{input:JSON.stringify(source),encoding:'utf8',maxBuffer:12*1024*1024,env:{...process.env,GOTOOLCHAIN:'local'}});
if(result.status!==0){process.stderr.write(result.stderr||'Go formatting failed');process.exit(result.status||1);}
const formatted=JSON.parse(result.stdout);
for(const item of source)formatted[item.id].sourceHash=createHash('sha256').update(item.code.trim()).digest('hex');
if(Object.keys(formatted).length!==150)throw Error('Expected 150 formatted solutions');
await writeFile('src/go-display.js',`// Generated with gofmt; token alignment preserves source highlight mapping.\nexport const goDisplay = ${JSON.stringify(formatted)};\n`);
console.log('Formatted all 150 Go solutions and preserved source line mappings.');
