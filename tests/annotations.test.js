import test from 'node:test';
import assert from 'node:assert/strict';
import {createNodeLabels} from '../src/annotations.js';
import {renderScene} from '../src/scenes.js';

test('节点标识绑定身份，反转或重复值不会重新编号',()=>{
 const frames=[{scene:{nodes:[{id:'dummy',sentinel:true},{id:'0',label:2},{id:'1',label:2}]}},{scene:{nodes:[{id:'1',label:2},{id:'0',label:2},{id:'new',label:2}]}}];
 const names=createNodeLabels(frames);
 assert.equal(names.get('0'),'A');assert.equal(names.get('1'),'B');assert.equal(names.get('new'),'C');assert.equal(names.get('dummy'),'S1');
 const long=createNodeLabels([{scene:{nodes:Array.from({length:60},(_,id)=>({id}))}}]);
 assert.equal(long.get('26'),'AA');assert.equal(long.get('59'),'BH');
});

test('多指针分行解释，不再挤进图中同一文字行',()=>{
 const scene={kind:'linked',nodes:[{id:'0',label:1},{id:'1',label:2},{id:'dummy',label:'哨兵',sentinel:true}],edges:[],chains:[{label:'结果',ids:['0','1']}],pointers:{head:'0',first:'0',cur:'0',pre:'dummy',next:null}};
 const html=renderScene(scene,{lessonId:25,nodeLabels:createNodeLabels([{scene}])});
 assert.match(html,/固定节点标识/);assert.match(html,/节点 A/);assert.match(html,/变量与代码对照/);
 assert.equal((html.match(/class="pointer-entry"/g)||[]).length,5);
 assert.match(html,/本组原头/);assert.match(html,/空指针/);assert.doesNotMatch(html,/<text[^>]*class="linked-pointer"/);
 assert.doesNotMatch(html,/>#0</);
});

test('空链仍解释nil，未在图中的目标不冒充nil',()=>{
 const html=renderScene({kind:'linked',nodes:[],edges:[],pointers:{head:null,cur:'missing'}},{lessonId:25});
 assert.match(html,/空指针/);assert.match(html,/此帧未显示/);assert.match(html,/head/);assert.match(html,/cur/);
});

test('表格单元格显示当前与依赖角色',()=>{
 const html=renderScene({kind:'table',columns:['天','持仓','现金'],rows:[[1,-2,0]],cellPointers:{'当前 dp[day][buy]':[0,1],'保持状态':[0,2]}});
 assert.match(html,/当前 dp\[day\]\[buy\]/);assert.match(html,/保持状态/);assert.match(html,/table-cell-pointer/);
});

test('同一对节点的双向权重沿不同曲线，文字不压在同一点',()=>{
 const html=renderScene({kind:'graph',nodes:[{id:'a',label:'a'},{id:'b',label:'b'}],edges:[{from:'a',to:'b',label:'2',directed:true},{from:'b',to:'a',label:'0.5',directed:true}]});
 const labels=[...html.matchAll(/class="edge-label" x="([^"]+)" y="([^"]+)"/g)].map(m=>m.slice(1));
 assert.notDeepEqual(labels[0],labels[1]);
});

test('堆标题不是数据圆，完整数对按多行展示',()=>{
 const html=renderScene({kind:'tree',nodes:[{id:'title',label:'候选数对小根堆',caption:true},{id:'pair',label:'2147483647,0,15',labelLines:['sum=2147483647','i=0, j=15']}],edges:[{from:'title',to:'pair'}]});
 assert.equal((html.match(/class="node-circle/g)||[]).length,1);assert.match(html,/sum=2147483647/);assert.match(html,/i=0, j=15/);assert.doesNotMatch(html,/…/);
});

test('区间指针放在独立对照区，长名称不压到条形',()=>{
 const html=renderScene({kind:'intervals',intervals:[[1,3]],rowPointers:{合并结果末尾:0}});
 assert.match(html,/interval-pointer-map/);assert.match(html,/合并结果末尾/);assert.doesNotMatch(html,/<text[^>]*>合并结果末尾/);
});

test('二进制位右对齐，单独标记每行的当前位',()=>{
 const html=renderScene({kind:'bits',values:['111','1'],bitWidth:4,activeByRow:[[1],[3]]});
 assert.equal((html.match(/class="bit-cell/g)||[]).length,8);assert.equal((html.match(/bit-cell active/g)||[]).length,2);
 assert.match(html,/2\^0/);assert.match(html,/高位补 0/);
});

test('字符矩阵的空格轴仍可对应数字下标',()=>{
 const html=renderScene({kind:'matrix',matrix:[[0],[1]],rowLabels:['a',' '],colLabels:['∅']});
 assert.match(html,/1 · ␠/);assert.match(html,/0 · ∅/);
});
