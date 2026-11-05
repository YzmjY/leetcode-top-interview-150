import test from 'node:test';
import assert from 'node:assert/strict';
import {lessons,getLesson} from '../src/lessons.js';

const {renderHeroArt}=await import('../src/hero-art.js').catch(error=>{
  if(error.code!=='ERR_MODULE_NOT_FOUND')throw error;
  return {renderHeroArt:()=>''};
});
const art=id=>renderHeroArt(getLesson(id));
const afterValues=svg=>[...svg.matchAll(/<circle[^>]*data-phase="after"[^>]*data-value="([^"]+)"/g)].map(m=>Number(m[1]));

test('all 150 lessons have self-contained finite SVG hero diagrams without mutating lessons',()=>{
  assert.equal(lessons.length,150);
  for(const lesson of lessons){
    const before=JSON.stringify(lesson.input),svg=renderHeroArt(lesson);
    assert.match(svg,/^<svg\b/);assert.match(svg,/viewBox="0 0 400 240"/);assert.match(svg,/<\/svg>$/);
    assert.match(svg,/data-art-kind="[a-z-]+"/);assert.ok(svg.length>500,`lesson ${lesson.id} needs an actual diagram`);
    assert.doesNotMatch(svg,/<(?:script|image|foreignObject)\b|(?:NaN|undefined|Infinity)|https?:/);
    assert.equal(JSON.stringify(lesson.input),before);
  }
});

test('algorithm families render distinct structural relations',()=>{
  const examples=[[88,'merge'],[25,'reverse-groups'],[92,'reverse-range'],[56,'intervals'],[155,'min-stack'],[104,'tree'],[133,'graph'],[54,'matrix'],[208,'trie'],[215,'heap'],[190,'bits'],[72,'dp'],[35,'binary-search'],[3,'window'],[125,'two-pointers'],[1,'hash'],[77,'backtrack'],[55,'greedy'],[27,'compact'],[9,'math']];
  const shapes=new Set();
  for(const [id,kind] of examples){
    const svg=art(id);assert.match(svg,new RegExp(`data-art-kind="${kind}"`));
    shapes.add(svg.replace(/<title>[\s\S]*?<\/title>/,'').replace(/data-problem="\d+"/,'').replaceAll(`hero-arrow-${id}`,'hero-arrow'));
  }
  assert.equal(shapes.size,examples.length);
});

test('k-group reversal draws the real node order, complete groups, and unchanged short tail',()=>{
  const svg=art(25);
  assert.deepEqual(afterValues(svg),[2,1,4,3,5]);
  assert.match(svg,/data-role="reverse-group"/);assert.match(svg,/marker-end=/);assert.match(svg,/尾段保留/);
  const custom=renderHeroArt({...getLesson(25),input:{head:[1,2,3,4,5,6,7],k:3}});
  assert.deepEqual(afterValues(custom),[3,2,1,6,5,4,7]);
  assert.match(custom,/data-role="tail"/);
});

test('range reversal preserves nodes outside the selected interval',()=>{
  const svg=renderHeroArt({...getLesson(92),input:{head:[1,2,3,4,5],left:2,right:4}});
  assert.deepEqual(afterValues(svg),[1,4,3,2,5]);assert.match(svg,/区间翻转/);
});

test('interval merging, min stack, and trees show their actual data structures',()=>{
  const intervals=art(56);assert.match(intervals,/data-role="interval"/);assert.match(intervals,/合并重叠/);
  const stack=art(155);assert.match(stack,/data-role="paired-stack"/);assert.match(stack,/data-role="value-column"/);assert.match(stack,/data-role="minimum-column"/);assert.match(stack,/每层保存值与最小值/);assert.match(stack,/当前最小/);
  assert.doesNotMatch(stack,/data-role="(?:value|minimum)-stack"/);
  assert.ok((art(104).match(/data-role="tree-edge"/g)??[]).length>=4);
  assert.ok((art(133).match(/data-role="graph-edge"/g)??[]).length>=4);
});

test('SVG text and attributes escape user-controlled values',()=>{
  const svg=renderHeroArt({...getLesson(92),title:'<script>bad</script>',input:{head:['<img onerror=1>','&'],left:1,right:2}});
  assert.doesNotMatch(svg,/<script>|<img /);assert.match(svg,/&lt;script&gt;/);assert.match(svg,/&amp;/);
});

test('small illustrations keep operation semantics for binary, decimal, and coordinate problems',()=>{
  assert.match(art(67),/逐位相加与进位/);
  assert.match(art(67),/>10101<|>1<.*>0<.*>1<.*>0<.*>1</);
  assert.match(art(201),/公共前缀/);
  assert.match(art(66),/逐位进位/);
  assert.match(art(149),/data-role="coordinate-point"/);
  assert.match(art(172),/因子/);
  assert.match(art(13),/相邻符号加减/);
  assert.match(art(58),/最后一个单词/);
  assert.match(art(80),/保留至多两项/);
});

test('SVG primitives never repeat radius or fill attributes',()=>{
  for(const lesson of lessons){
    const svg=renderHeroArt(lesson);
    assert.doesNotMatch(svg,/<[^>]+\br="[^"]+"[^>]+\br="/);
    assert.doesNotMatch(svg,/<[^>]+\bfill="[^"]+"[^>]+\bfill="/);
  }
});

test('heap illustrations distinguish the k-candidate min heap, profit max heap, and median pair',()=>{
  assert.match(art(215),/data-role="heap-root" data-value="5"/);
  assert.match(art(502),/data-role="heap-root" data-value="3"/);
  assert.match(art(295),/data-role="low-heap"/);assert.match(art(295),/data-role="high-heap"/);
  assert.match(art(295),/两堆边界/);
});

test('LRU cache illustrates its bidirectional order and access promotion',()=>{
  const svg=art(146);assert.match(svg,/data-role="cache-order"/);assert.match(svg,/data-role="previous-link"/);assert.match(svg,/访问后移到表头/);
});
