import test from 'node:test';
import assert from 'node:assert/strict';
import {traceLesson} from '../src/lesson-kit.js';
let lessonsB=[];
try { ({lessonsB}=await import('../src/lessons-b.js')); } catch(e) { if(e.code!=='ERR_MODULE_NOT_FOUND')throw e; }
const ids=[36,54,48,73,289,141,2,21,138,92,25,19,82,61,86,146,104,100,226,101,105,106,117,114,112,129,124,173,222,236,199,637,102,103,530,230,98,200,130,133,399,207,210,909,433,127,208,211,212];
test('B contains exactly the assigned 49 lessons',()=>assert.deepEqual(lessonsB.map(x=>x.id),ids));
for(const id of ids)test(`lesson ${id}: examples, independent snapshots and structure`,()=>{
 const l=lessonsB.find(x=>x.id===id);assert.ok(l,`missing ${id}`);
 assert.equal(l.steps.length,3);assert.ok(l.summary&&l.rule&&l.time&&l.space);assert.ok(l.cases.length>=2);
 const expectedKind=[36,54,48,73,289,200,130,909,212].includes(id)?'matrix':[141,2,21,138,92,25,19,82,61,86,146].includes(id)?'linked':[133,399,207,210,433,127].includes(id)?'graph':[208,211].includes(id)?'trie':'tree';
 for(const c of [{input:l.input,expected:l.expected},...l.cases]){
  const before=structuredClone(c.input), {frames,result}=traceLesson(l,c.input);
  assert.deepEqual(result,c.expected);assert.deepEqual(c.input,before);
  assert.ok(frames.some(f=>f.scene.kind===expectedKind),`expected ${expectedKind}`);
  const n=Array.isArray(l.code)?l.code.length:l.code.split('\n').length;
  for(const f of frames){assert.ok(f.lines.length);assert.ok(f.lines.every(x=>x>=1&&x<=n));
   if(f.scene.nodes){const set=new Set(f.scene.nodes.map(x=>x.id));assert.equal(set.size,f.scene.nodes.length);for(const e of f.scene.edges)assert.ok(set.has(e.from)&&set.has(e.to));}
  }
 }
 const frames=traceLesson(l,l.input).frames.filter(f=>f.phase==='step');assert.ok(frames.length>=2);
 assert.ok(new Set(frames.map(f=>JSON.stringify([f.scene,f.vars]))).size>=2,'algorithm state must change');
});
test('compact trees, duplicates, pointer edges and malformed matrices',()=>{
 const run=(id,input)=>traceLesson(lessonsB.find(l=>l.id===id),input);
 if(!lessonsB.length)assert.fail('missing lessons');
 assert.equal(run(104,{root:[1,null,2,3]}).result,3);
 assert.equal(run(100,{p:[1,2,2],q:[1,2,2]}).result,true);
 assert.equal(run(98,{root:[2,2,3]}).result,false);
 assert.deepEqual(run(226,{root:[1,null,2,3]}).result,[1,2,null,null,3]);
 const rev=run(92,{head:[1,2,2,3],left:1,right:3});
 assert.deepEqual(rev.result,[2,2,1,3]);
 assert.ok(rev.frames.some(f=>f.scene.edges.some(e=>e.from==='2'&&e.to==='1')));
 assert.throws(()=>run(48,{matrix:[[1,2],[3]]}),/矩阵/);
 assert.throws(()=>run(25,{head:[1,2],k:0}));
});

test('independent structure regressions: sparse trees, random identity, exact BFS semantics',()=>{
 const run=(id,input)=>traceLesson(lessonsB.find(l=>l.id===id),input);
 assert.deepEqual(run(105,{preorder:[1,2,3,4],inorder:[2,3,1,4]}).result,[1,2,4,null,3]);
 assert.deepEqual(run(106,{inorder:[2,3,1,4],postorder:[3,2,4,1]}).result,[1,2,4,null,3]);
 assert.deepEqual(run(117,{root:[1,2,3,4,null,null,5,null,6,7]}).result,[[1],[2,3],[4,5],[6,7]]);
 assert.deepEqual(run(114,{root:[1,2,3,null,4,5]}).result,[1,null,2,null,4,null,3,null,5]);
 assert.equal(run(236,{root:[5,5,5,9],p:1,q:3}).result,5);
 const copy=run(138,{nodes:[[8,0],[8,0]]});
 assert.deepEqual(copy.result,[[8,0],[8,0]]);
 const copyNodes=copy.frames.at(-1).scene.nodes.filter(n=>n.id.startsWith('c'));
 assert.equal(copyNodes.length,2);
 assert.ok(copy.frames.at(-1).scene.edges.filter(e=>e.from.startsWith('c')).every(e=>e.to.startsWith('c')));
 assert.equal(run(141,{head:[1],pos:0}).result,true);
 assert.equal(run(433,{startGene:'AAAAACCC',endGene:'AACCCCCC',bank:['AAAACCCC','AAACCCCC','AACCCCCC']}).result,3);
 assert.equal(run(127,{beginWord:'hot',endWord:'dog',wordList:['hot','dog']}).result,0);
 assert.deepEqual(run(212,{board:[['a','a']],words:['aa','aaa','a','aa']}).result,['a','aa']);
});

test('validators reject orphan roots, reconstructing live caches, and malformed operation shapes',()=>{
 const run=(id,input)=>traceLesson(lessonsB.find(l=>l.id===id),input);
 assert.throws(()=>run(104,{root:[null,1]}),/根|父/);
 assert.throws(()=>run(146,{ops:[['LRUCache',2],['LRUCache',1]]}),/构造/);
 assert.throws(()=>run(146,{ops:[['LRUCache',2],['get',1,9]]}),/格式/);
 assert.throws(()=>run(173,{root:[2,3,1],ops:['next']}),/搜索树/);
 assert.throws(()=>run(105,{preorder:[1,2,3],inorder:[3,1,2]}),/匹配/);
 assert.throws(()=>run(222,{root:[1,null,2]}),/完全/);
 assert.throws(()=>run(133,{adj:[[2],[]]}),/双向/);
 assert.throws(()=>run(208,{ops:[['Trie'],['insert','']]}),/非空/);
});
