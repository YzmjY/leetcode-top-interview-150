import test from 'node:test';
import assert from 'node:assert/strict';
import {lessons,getLesson} from '../src/lessons.js';
import {renderHeroArt} from '../src/hero-art.js';
const art=id=>renderHeroArt(getLesson(id));
const geometry=svg=>[...svg.matchAll(/<(path|line|circle|rect|ellipse|polygon|polyline)\b([^>]*)/g)].map(([,tag,attrs])=>tag+[...attrs.matchAll(/\b(d|points|x|y|x1|y1|x2|y2|cx|cy|r|rx|ry|width|height|transform|stroke-dasharray)="([^"]*)"/g)].map(([,key,value])=>`${key}=${value}`).join(';')).join('|');
test('all 150 heroes are abstract finite SVGs without example values or text boxes',()=>{
 for(const lesson of lessons){const input=JSON.stringify(lesson.input),svg=renderHeroArt(lesson);assert.match(svg,/^<svg\b/);assert.match(svg,/viewBox="0 0 400 240"/);assert.match(svg,/<\/svg>$/);assert.match(svg,/data-art-kind="[a-z-]+"/);assert.ok(svg.length>500);assert.doesNotMatch(svg,/<text\b|示例状态|逐次读取|依次读取|累计状态|示例输入|data-value=|data-phase=/);assert.doesNotMatch(svg,/<(?:script|image|foreignObject)\b|(?:NaN|undefined|Infinity)|https?:/);assert.equal(JSON.stringify(lesson.input),input);}
});
test('all 150 differ geometrically after titles, IDs, and labels are removed',()=>{
 const signatures=new Map();for(const lesson of lessons){const signature=geometry(renderHeroArt(lesson));assert.ok(signature.length>100);assert.equal(signatures.has(signature),false,`lessons ${signatures.get(signature)} and ${lesson.id} share geometry`);signatures.set(signature,lesson.id);}assert.equal(signatures.size,150);
});
test('abstract diagrams depend on the problem rather than concrete input or trace results',()=>{
 for(const id of [25,92,88,122,155,295,35,3,104,72]){const lesson=getLesson(id);assert.equal(renderHeroArt({...lesson,input:{nums:[999999999],head:[888888],k:7,x:123456789,s:'SENSITIVE_EXAMPLE'},expected:'CONCRETE_RESULT'}),art(id));}
});
test('families retain recognisable structural motifs',()=>{
 const examples=[[88,'merge'],[25,'reverse-groups'],[92,'reverse-range'],[56,'intervals'],[155,'min-stack'],[104,'tree'],[133,'graph'],[54,'matrix'],[208,'trie'],[215,'heap'],[190,'bits'],[72,'dp'],[35,'binary-search'],[3,'window'],[125,'two-pointers'],[1,'hash'],[77,'backtrack'],[55,'greedy'],[27,'compact']];for(const [id,kind]of examples)assert.match(art(id),new RegExp(`data-art-kind="${kind}"`));assert.match(art(25),/data-role="group-twist"/);assert.match(art(92),/data-role="range-twist"/);assert.match(art(155),/data-role="paired-stack"/);assert.match(art(104),/data-role="tree-branch"/);assert.match(art(133),/data-role="graph-link"/);assert.match(art(35),/data-role="convergence"/);assert.match(art(3),/data-role="window-region"/);assert.match(art(72),/data-role="state-flow"/);
});
test('stock heroes use price contours and 122 highlights multiple rises',()=>{
 for(const id of [121,122,123,188]){assert.match(art(id),/data-art-kind="stock"/);assert.match(art(id),/data-role="price-curve"/);}assert.ok((art(122).match(/data-role="profit-rise"/g)??[]).length>=3);assert.equal(new Set([121,122,123,188].map(id=>geometry(art(id)))).size,4);
});
test('formerly repeated arrays use different algorithm-specific compositions',()=>{
 const roles=[[169,'majority-cluster'],[189,'rotation-ring'],[27,'filter-gate'],[80,'duplicate-limit'],[134,'supply-cycle'],[135,'gradient-allocation'],[274,'rank-threshold'],[380,'set-index']];for(const [id,role]of roles)assert.match(art(id),new RegExp(`data-role="${role}"`));assert.equal(new Set(roles.map(([id])=>geometry(art(id)))).size,roles.length);
});
test('metadata is escaped and primitives never duplicate attributes',()=>{
 const svg=renderHeroArt({...getLesson(92),title:'<script>bad & unsafe</script>'});assert.doesNotMatch(svg,/<script>/);assert.match(svg,/&lt;script&gt;bad &amp; unsafe/);for(const lesson of lessons){const s=renderHeroArt(lesson);assert.doesNotMatch(s,/<[^>]+\br="[^"]+"[^>]+\br="/);assert.doesNotMatch(s,/<[^>]+\bfill="[^"]+"[^>]+\bfill="/);}
});
test('similar data structures emphasise the actual algorithm instead of coordinate jitter',()=>{
 const cases=[[23,'multiway-merge'],[104,'depth-spine'],[530,'inorder-neighbours'],[105,'preorder-construction'],[106,'postorder-construction'],[112,'target-leaf'],[129,'leaf-contributions'],[230,'rank-selection'],[17,'keypad-branching'],[46,'permutation-weave'],[34,'dual-boundaries'],[162,'peak-search'],[69,'square-root'],[70,'step-recurrence'],[322,'coin-sources'],[64,'minimum-route'],[97,'interleave-streams'],[72,'edit-dependencies']];
 for(const [id,role]of cases)assert.match(art(id),new RegExp(`data-role="${role}"`));
});
test('remaining shared structures distinguish traversal, multiplicity, direction, and acyclic dependencies',()=>{
 const cases=[[117,'level-successors'],[199,'right-contour'],[637,'level-aggregation'],[102,'breadth-flow'],[136,'pair-cancellation'],[137,'triple-cancellation'],[153,'rotated-minimum'],[210,'topological-dag'],[66,'carry-left']];
 for(const [id,role]of cases)assert.match(art(id),new RegExp(`data-role="${role}"`));
 assert.match(art(27),/stroke-width="1\.5"/);assert.match(art(55),/opacity="\.85"/);
});
test('course-order arrows form a DAG and decimal carry arrows point toward higher places',()=>{
 const dag=[...art(210).matchAll(/<line\b([^>]*)\/>/g)].map(m=>m[1]).filter(a=>a.includes('marker-end'));
 assert.ok(dag.length>=6);
 for(const a of dag){const x1=Number(a.match(/x1="([^"]+)"/)[1]),x2=Number(a.match(/x2="([^"]+)"/)[1]);assert.ok(x2>x1,'every dependency advances strictly rightward, so a directed cycle is impossible');}
 const carry=art(66).match(/<g data-role="carry-left"[^>]*>([\s\S]*?)<\/g>/)[1];
 const arrows=[...carry.matchAll(/d="M ([\d.]+) ([\d.]+) Q ([\d.]+) ([\d.]+) ([\d.]+) ([\d.]+)"/g)];
 assert.equal(arrows.length,3);for(const a of arrows)assert.ok(Number(a[5])<Number(a[1]),'carry advances left toward higher decimal places');
});
test('LCA shows target convergence and gene mutation differs structurally from word ladders',()=>{
 assert.match(art(236),/data-role="ancestor-convergence"/);assert.match(art(433),/data-role="gene-site-replacement"/);assert.match(art(127),/data-role="word-ladder"/);
});
test('subsequence scans forward, character patterns are bijections, and Sudoku uses nine-square axes',()=>{
 assert.match(art(392),/data-role="codirectional-subsequence"/);
 for(const id of [205,290])assert.match(art(id),/data-role="bijection-pair"/);
 const sudoku=art(36);assert.match(sudoku,/data-role="sudoku-nine-grid"/);
 const horizontal=[...sudoku.matchAll(/<line\b([^>]*)\/>/g)].map(m=>m[1]).filter(a=>a.match(/y1="([^"]+)"/)[1]===a.match(/y2="([^"]+)"/)[1]);assert.equal(horizontal.length,10);
});
test('hash relations, addition, deletion, flattening and complete subtrees use their own motifs',()=>{
 const cases=[[1,'complement-pair'],[202,'square-cycle'],[219,'duplicate-distance'],[128,'consecutive-membership'],[242,'frequency-overlap'],[49,'anagram-clusters'],[2,'positional-addition'],[19,'skip-single-node'],[82,'skip-duplicate-cluster'],[114,'flattened-spine'],[222,'complete-subtree-block']];for(const [id,role]of cases)assert.match(art(id),new RegExp(`data-role="${role}"`));
});
test('obstacle path arrows are orthogonal, never diagonal',()=>{
 const svg=art(63);assert.match(svg,/data-role="obstacle-paths"/);assert.match(svg,/data-role="obstacle"/);
 const arrows=[...svg.matchAll(/<line\b([^>]*)\/>/g)].map(m=>m[1]).filter(a=>a.includes('marker-end'));assert.ok(arrows.length>10);
 for(const a of arrows){const value=key=>Number(a.match(new RegExp(`${key}="([^"]+)"`))[1]);assert.ok(value('x1')===value('x2')||value('y1')===value('y2'));}
});
test('contiguity, triangular adjacency, boundary escape, board search and partition motifs stay faithful',()=>{
 const cases=[[200,'island-components'],[130,'boundary-escape'],[212,'prefix-board-branches'],[53,'contiguous-run'],[918,'circular-contiguous'],[120,'triangle-adjacency'],[5,'palindromic-interval'],[909,'snake-and-shortcuts'],[148,'split-then-merge'],[52,'queen-attack-lines'],[4,'balanced-partitions'],[74,'matrix-convergence']];for(const [id,role]of cases)assert.match(art(id),new RegExp(`data-role="${role}"`));
 assert.doesNotMatch(art(53),/d="[^"]*Q /,'contiguous subarrays cannot skip positions');
});
