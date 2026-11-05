import test from 'node:test';
import assert from 'node:assert/strict';
import {lessonsB} from '../src/lessons-b.js';
import {traceLesson} from '../src/lesson-kit.js';

const run=(id,input)=>traceLesson(lessonsB.find(l=>l.id===id),input);
const nextEdges=scene=>scene.edges.filter(e=>!e.label||e.label==='next');
const nextOf=(scene,id)=>nextEdges(scene).find(e=>e.from===id)?.to??null;
const resultIds=scene=>scene.chains.find(c=>c.label==='结果')?.ids;
const values=(scene,ids)=>ids.map(id=>Number(scene.nodes.find(n=>n.id===id).label));

// A fixed input-order layout, swapped values, stale heads, or invented adjacency
// must fail even when the solver's returned values happen to be correct.
function checkFrames(trace,{stableValues=true}={}){
 const labels=new Map(),seenIds=new Set();
 for(const {scene} of trace.frames){
  assert.equal(scene.kind,'linked');
  assert.ok(Array.isArray(scene.chains),'every linked frame exposes logical chains');
  assert.ok(scene.pointers&&typeof scene.pointers==='object');
  assert.ok(Array.isArray(scene.removed));
  const ids=new Set(scene.nodes.map(n=>n.id)),placed=[];
  for(const n of scene.nodes){
   if(stableValues&&labels.has(n.id))assert.equal(n.label,labels.get(n.id),'node values cannot be swapped to simulate moving identities');
   labels.set(n.id,n.label);
  }
  for(const id of seenIds)assert.ok(ids.has(id),'created identities remain available, including removed nodes');
  for(const id of ids)seenIds.add(id);
  for(const edge of scene.edges)assert.ok(ids.has(edge.from)&&ids.has(edge.to));
  for(const chain of scene.chains){
   assert.equal(new Set(chain.ids).size,chain.ids.length,'walks must stop on cycles');
   for(let j=0;j<chain.ids.length;j++){
    const id=chain.ids[j];assert.ok(ids.has(id));assert.ok(!scene.removed.includes(id));placed.push(id);
    if(j)assert.equal(nextOf(scene,chain.ids[j-1]),id,'chain order follows actual next edges');
   }
  }
  assert.equal(new Set(placed).size,placed.length,'each identity gets one layout position');
  assert.deepEqual(new Set(placed),new Set(scene.nodes.filter(n=>!scene.removed.includes(n.id)).map(n=>n.id)));
  for(const id of Object.values(scene.pointers))assert.ok(id===null||ids.has(id),'pointers refer to identities or nil');
  for(const id of scene.removed)assert.ok(ids.has(id)&&scene.nodes.find(n=>n.id===id).removed);
  if(scene.pointers.dummy){
   const fromHead=[],visited=new Set();let id=nextOf(scene,scene.pointers.dummy);
   while(id!==null&&!visited.has(id)){visited.add(id);fromHead.push(id);id=nextOf(scene,id);}
   assert.deepEqual(resultIds(scene),fromHead,'every result row starts at the current dummy.Next and follows the entire real list');
  }
 }
}

test('92 exposes each head-insertion pointer write and physically reorders stable identities',()=>{
 const trace=run(92,{head:[1,2,3,4,5],left:2,right:4});checkFrames(trace);
 const edits=trace.frames.filter(f=>f.phase==='step'&&['cur.Next=move.Next','move.Next=pre.Next','pre.Next=move'].includes(f.anchor));
 assert.equal(edits.length,6,'three visible next writes for each of two moved nodes');
 assert.deepEqual(edits.slice(0,3).map(f=>f.anchor),['cur.Next=move.Next','move.Next=pre.Next','pre.Next=move']);
 assert.deepEqual(edits[0].scene.pointers,{dummy:'dummy',head:'0',pre:'0',cur:'1',move:'2'});
 assert.equal(nextOf(edits[0].scene,'1'),'3');assert.equal(nextOf(edits[0].scene,'2'),'3');
 assert.deepEqual(resultIds(edits[0].scene),['0','1','3','4']);
 assert.equal(nextOf(edits[1].scene,'2'),'1');assert.equal(nextOf(edits[1].scene,'0'),'1');
 assert.deepEqual(resultIds(edits[2].scene),['0','2','1','3','4']);
 assert.deepEqual(resultIds(trace.frames.at(-1).scene),['0','3','2','1','4']);
 assert.deepEqual(values(trace.frames.at(-1).scene,resultIds(trace.frames.at(-1).scene)),[1,4,3,2,5]);
 const fromHead=run(92,{head:[1,2,3],left:1,right:3});checkFrames(fromHead);
 assert.deepEqual(resultIds(fromHead.frames.at(-1).scene),['2','1','0']);
 assert.equal(nextOf(fromHead.frames.at(-1).scene,'dummy'),'2');
 const duplicates=run(92,{head:[1,2,2,3],left:1,right:3});checkFrames(duplicates);
 assert.deepEqual(resultIds(duplicates.frames.at(-1).scene),['2','1','0','3']);
});

test('25 exposes every reversed next and group reconnection, preserving incomplete suffixes',()=>{
 const trace=run(25,{head:[1,2,3,4,5],k:2});checkFrames(trace);
 const reverse=trace.frames.filter(f=>f.phase==='step'&&f.anchor==='cur.Next=prev');
 assert.equal(reverse.length,4);
 assert.equal(nextOf(reverse[0].scene,'0'),'2');
 assert.equal(nextOf(reverse[1].scene,'1'),'0');
 const joins=trace.frames.filter(f=>f.phase==='step'&&f.anchor==='pre.Next=end');
 assert.equal(joins.length,2);
 assert.deepEqual(resultIds(joins[0].scene),['1','0','2','3','4']);
 assert.deepEqual(resultIds(joins[1].scene),['1','0','3','2','4']);
 assert.deepEqual(values(trace.frames.at(-1).scene,resultIds(trace.frames.at(-1).scene)),[2,1,4,3,5]);
 assert.equal(nextOf(trace.frames.at(-1).scene,'4'),null);
 const short=run(25,{head:[1,2],k:3});checkFrames(short);
 assert.equal(short.frames.filter(f=>f.anchor==='cur.Next=prev').length,0);
 assert.deepEqual(resultIds(short.frames.at(-1).scene),['0','1']);
 const single=run(25,{head:[1,2,3],k:1});checkFrames(single);
 assert.deepEqual(resultIds(single.frames.at(-1).scene),['0','1','2']);
 const empty=run(25,{head:[],k:2});checkFrames(empty);assert.deepEqual(resultIds(empty.frames.at(-1).scene),[]);
});

test('19 and 82 move truly deleted identities out of the result while updating its head',()=>{
 for(const [id,input,want,removed] of [
  [19,{head:[1,2,3,4,5],n:2},['0','1','2','4'],['3']],
  [19,{head:[1,2],n:2},['1'],['0']],
  [19,{head:[1],n:1},[],['0']],
  [82,{head:[1,2,3,3,4,4,5]},['0','1','6'],['2','3','4','5']],
  [82,{head:[1,1,1]},[],['0','1','2']],
 ]){
  const trace=run(id,input);checkFrames(trace);const scene=trace.frames.at(-1).scene;
  assert.deepEqual(resultIds(scene),want);assert.deepEqual(scene.removed,removed);
  assert.equal(nextOf(scene,'dummy'),want[0]??null);
  assert.deepEqual(values(scene,want),trace.result);
 }
});

test('61 records a real cycle then moves the new head after breaking it',()=>{
 const trace=run(61,{head:[1,2,3,4,5],k:2});checkFrames(trace);
 const cycle=trace.frames.find(f=>f.anchor==='tail.Next=head');assert.ok(cycle);
 assert.equal(nextOf(cycle.scene,'4'),'0');assert.deepEqual(resultIds(cycle.scene),['0','1','2','3','4']);
 const final=trace.frames.at(-1).scene;
 assert.deepEqual(resultIds(final),['3','4','0','1','2']);assert.equal(nextOf(final,'2'),null);
 assert.equal(final.pointers.result,'3');assert.deepEqual(values(final,resultIds(final)),trace.result);
});

test('86 displays stable small/big partitions and joins actual node identities',()=>{
 const trace=run(86,{head:[1,4,3,2,5,2],x:3});checkFrames(trace);
 const partitioned=trace.frames.find(f=>f.phase==='step'&&f.scene.pointers.head===null&&f.anchor==='head=next');assert.ok(partitioned);
 assert.deepEqual(partitioned.scene.chains.find(c=>c.label==='小值链').ids,['0','3','5']);
 assert.deepEqual(partitioned.scene.chains.find(c=>c.label==='大值链').ids,['1','2','4']);
 assert.deepEqual(resultIds(trace.frames.at(-1).scene),['0','3','5','1','2','4']);
 assert.deepEqual(values(trace.frames.at(-1).scene,resultIds(trace.frames.at(-1).scene)),trace.result);
});

test('21 merges existing identities instead of creating a sorted display-only list',()=>{
 const trace=run(21,{list1:[1,2,4],list2:[1,3,4]});checkFrames(trace);
 const final=trace.frames.at(-1).scene;
 assert.deepEqual(resultIds(final),['a0','b0','a1','b1','a2','b2']);
 assert.deepEqual(values(final,resultIds(final)),trace.result);
 assert.equal(final.pointers.tail,'a2');assert.equal(nextOf(final,'a2'),'b2');
 const empty=run(21,{list1:[],list2:[0]});checkFrames(empty);assert.deepEqual(resultIds(empty.frames.at(-1).scene),['b0']);
});

test('addition, random copying, cycles and LRU also provide the linked layout contract',()=>{
 const addition=run(2,{l1:[9,9],l2:[1]});checkFrames(addition);
 assert.deepEqual(resultIds(addition.frames.at(-1).scene),['s0','s1','s2']);
 assert.deepEqual(values(addition.frames.at(-1).scene,resultIds(addition.frames.at(-1).scene)),[0,0,1]);
 const copy=run(138,{nodes:[[8,0],[8,0]]});checkFrames(copy);
 assert.deepEqual(resultIds(copy.frames.at(-1).scene),['c0','c1']);
 assert.equal(copy.frames.at(-1).scene.edges.find(e=>e.from==='c1'&&e.label==='random').to,'c0');
 checkFrames(run(141,{head:[1,1,1],pos:0}));
 const lru=run(146,{ops:[['LRUCache',2],['put',1,1],['put',2,2],['get',1],['put',3,3]]});checkFrames(lru,{stableValues:false});
 const scene=lru.frames.at(-1).scene;
 assert.deepEqual(scene.chains.find(c=>c.label==='缓存').ids,['h','c2','c0','t']);
 assert.deepEqual(scene.removed,['c1']);
 assert.ok(scene.edges.some(e=>e.from==='c0'&&e.to==='c2'&&e.label==='prev'));
});
