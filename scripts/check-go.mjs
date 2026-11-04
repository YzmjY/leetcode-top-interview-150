import {mkdir,writeFile,rm} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {lessons} from '../src/lessons.js';
import {displayCode} from '../src/presentation.js';
const root=fileURLToPath(new URL('../.local/go-check/',import.meta.url));
await mkdir(root,{recursive:true});
await writeFile(path.join(root,'go.mod'),'module algofieldcheck\n\ngo 1.22\n');
let count=0;
for(const lesson of lessons){
 if(!lesson.code)continue;
 const directory=path.join(root,`p${lesson.id}`);await mkdir(directory,{recursive:true});
 const code=displayCode(lesson).replace(/^\s*package\s+\w+\s*\n/,'');
 await writeFile(path.join(directory,'solution.go'),`package p${lesson.id}\n\n${code}\n`);
 let types='';
 if(!/\btype\s+ListNode\s+struct/.test(code))types+='type ListNode struct { Val int; Next *ListNode }\n';
 if(!/\btype\s+TreeNode\s+struct/.test(code))types+='type TreeNode struct { Val int; Left, Right *TreeNode }\n';
 if(!/\btype\s+Node\s+struct/.test(code))types+=lesson.id===427?'type Node struct { Val bool; IsLeaf bool; TopLeft, TopRight, BottomLeft, BottomRight *Node }\n':lesson.id===133?'type Node struct { Val int; Neighbors []*Node }\n':lesson.id===138?'type Node struct { Val int; Next, Random *Node }\n':'type Node struct { Val int; Left, Right, Next *Node }\n';
 await writeFile(path.join(directory,'platform_types.go'),`package p${lesson.id}\n\n${types}`);count++;
}
console.log(`Compiling ${count} independent Go solutions (platform node types supplied).`);
const child=spawn('go',['test','./...'],{cwd:root,stdio:'inherit',env:{...process.env,GOTOOLCHAIN:'local'}});
child.on('error',error=>{console.error(error.message);process.exitCode=1;});
child.on('exit',code=>{process.exitCode=code||0;});
