import test from 'node:test';
import assert from 'node:assert/strict';
import {lessonsC} from '../src/lessons-c.js';
import {traceLesson} from '../src/lesson-kit.js';

const run=(id,input)=>traceLesson(lessonsC.find(l=>l.id===id),input);
const items=scene=>scene.nodes.filter(n=>Number.isInteger(n.slot));
const heapItems=(scene,heap)=>items(scene).filter(n=>n.heap===heap).sort((a,b)=>a.slot-b.slot);

// Slot identities that merely change labels cannot satisfy these movement
// checks: the same immutable item must appear at a different actual heap slot.
function checkTrace(trace){
 const labels=new Map();let swaps=0;
 for(let fi=0;fi<trace.frames.length;fi++){
  const {scene,anchor,phase}=trace.frames[fi];assert.equal(scene.kind,'tree');
  assert.ok(scene.nodes.every(n=>typeof n.id==='string'));
  assert.equal(new Set(scene.nodes.map(n=>n.id)).size,scene.nodes.length);
  for(const n of items(scene)){
   if(labels.has(n.id))assert.equal(n.label,labels.get(n.id),'entity label is immutable when its slot changes');
   labels.set(n.id,n.label);
  }
  const heaps=[...new Set(items(scene).map(n=>n.heap))];
  for(const heap of heaps){
   const a=heapItems(scene,heap);
   assert.deepEqual(a.map(n=>n.slot),a.map((_,i)=>i));
   for(let i=1;i<a.length;i++)assert.ok(scene.edges.some(e=>e.from===a[(i-1)>>1].id&&e.to===a[i].id&&e.role===(i%2?'left':'right')),'edges follow current heap slots');
  }
  if(phase==='step'&&scene.heapStep?.type==='swap'){
   swaps++;assert.ok(fi>0);assert.match(anchor,/Swap\(i,j int\)/,'library swaps highlight the actual Go Swap method');
   const {heap,slots:[a,b]}=scene.heapStep,before=heapItems(trace.frames[fi-1].scene,heap),after=heapItems(scene,heap);
   assert.equal(after[a].id,before[b].id);assert.equal(after[b].id,before[a].id);
   assert.notEqual(after[a].id,before[a].id);
   assert.deepEqual(before.map(n=>n.id).filter((_,i)=>i!==a&&i!==b),after.map(n=>n.id).filter((_,i)=>i!==a&&i!==b),'one visible swap changes only its two slots');
  }
 }
 assert.ok(labels.size,'real heap items expose identities and slots');
 return {swaps,labels};
}

test('215 moves duplicate-value entities through real append, upward, root-tail and downward swaps',()=>{
 const trace=run(215,{nums:[5,5,1,4,3,2],k:3});const {swaps,labels}=checkTrace(trace);
 assert.equal(trace.result,4);assert.equal(labels.size,6);
 assert.equal([...labels.values()].filter(v=>v==='5').length,2);
 assert.ok(swaps>=5);
 for(const direction of ['up','root-tail','down'])assert.ok(trace.frames.some(f=>f.scene.heapStep?.direction===direction),`missing ${direction} movement`);
 const firstAppend=trace.frames.find(f=>f.scene.heapStep?.type==='append');assert.ok(firstAppend);
 assert.deepEqual(heapItems(firstAppend.scene,'heap').map(n=>n.label),['5']);
});

test('502 keeps duplicate-profit projects distinct while moving and consuming heap entities',()=>{
 const trace=run(502,{k:3,w:0,profits:[1,8,2,8],capital:[0,0,0,0]});const {swaps,labels}=checkTrace(trace);
 assert.equal(trace.result,18);assert.equal(labels.size,4);assert.ok(swaps>0);
 assert.equal([...labels.values()].filter(v=>v==='8').length,2);
 const removals=trace.frames.filter(f=>f.phase==='step'&&f.scene.heapStep?.type==='remove');assert.equal(removals.length,3);
 assert.equal(new Set(removals.map(f=>f.scene.heapStep.item.id)).size,3,'each selected project is consumed once');
});

test('373 preserves index-pair identities through each heap swap even with equal pair values',()=>{
 const trace=run(373,{nums1:[1,1,2],nums2:[1,1,3],k:5});const {swaps,labels}=checkTrace(trace);
 assert.deepEqual(trace.result,[[1,1],[1,1],[1,1],[1,1],[2,1]]);assert.ok(swaps>0);
 assert.ok(labels.has('pair:0:0')&&labels.has('pair:1:0'));
 assert.equal(trace.frames.filter(f=>f.phase==='step'&&f.scene.heapStep?.type==='remove').length,5);
});

test('295 transfers the same duplicate-value item between heaps without renaming or dropping it',()=>{
 const operations=[['MedianFinder'],...[[5],[5],[1],[9],[2],[3]].flatMap(([x])=>[['addNum',x],['findMedian']])];
 const trace=run(295,{operations});const {swaps,labels}=checkTrace(trace);assert.ok(swaps>0);assert.equal(labels.size,6);
 assert.deepEqual(trace.result,[null,null,5,null,5,null,5,null,5,null,5,null,4]);
 const locations=new Map(),created=new Set();
 for(const {scene} of trace.frames){
  const current=new Set(items(scene).map(n=>n.id));
  for(const id of created)assert.ok(current.has(id),'a stream item remains visible while moving between heaps');
  for(const n of items(scene)){created.add(n.id);if(!locations.has(n.id))locations.set(n.id,new Set());locations.get(n.id).add(n.heap);}
 }
 assert.ok([...locations.values()].some(s=>s.has('low')&&s.has('high')),'one identity actually crosses the two heaps');
 assert.equal([...labels.values()].filter(v=>v==='5').length,2);
 const final=trace.frames.at(-1).scene;
 assert.equal(heapItems(final,'low')[0].label,'3');assert.equal(heapItems(final,'high')[0].label,'5');
});
