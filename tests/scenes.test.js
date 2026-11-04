import test from 'node:test';
import assert from 'node:assert/strict';
import { renderScene } from '../src/scenes.js';

test('数组保留重复值、指针名称和预留位置',()=>{
 const html=renderScene({kind:'array',values:[2,2,0],label:'nums1',pointers:{i:1,k:2},reserved:[2],done:[0]});
 assert.match(html,/nums1/);assert.match(html,/pointer-tag i-tag/);assert.match(html,/pointer-tag k-tag/);assert.match(html,/reserved/);assert.match(html,/settled/);
});
test('矩阵按坐标标记当前格子，不扁平化成数组',()=>{
 const html=renderScene({kind:'matrix',matrix:[[1,0],[0,1]],active:[[1,0]],done:[[0,0]]});
 assert.equal((html.match(/matrix-cell/g)||[]).length,4);assert.match(html,/data-cell="1,0"[^>]*class="[^"]*active/);
});
test('重复值的树节点仍有独立连线和节点身份',()=>{
 const html=renderScene({kind:'tree',nodes:[{id:'a',label:'2'},{id:'b',label:'2'},{id:'c',label:'2'}],edges:[{from:'a',to:'b'},{from:'a',to:'c'}],active:['b']});
 assert.equal((html.match(/class="node-circle/g)||[]).length,3);assert.equal((html.match(/class="scene-edge/g)||[]).length,2);assert.match(html,/data-node="b"/);
});
test('有向图和链表绘制箭头，支持回边',()=>{
 const scene={kind:'linked',nodes:[{id:'0',label:'3'},{id:'1',label:'2'}],edges:[{from:'0',to:'1'},{from:'1',to:'0'}]};
 const html=renderScene(scene);assert.match(html,/marker-end/);assert.match(html,/edge-label/);assert.match(html,/svg/);
});
test('场景内容转义，输入不会注入 HTML',()=>{
 const html=renderScene({kind:'text',text:'<img onerror=x>'});assert.ok(!html.includes('<img'));assert.match(html,/&lt;/);
 const table=renderScene({kind:'table',columns:['<script>'],rows:[['&'] ]});assert.ok(!table.includes('<script>'));assert.match(table,/&amp;/);
});
test('负区间与零长度区间均显示',()=>{
 const html=renderScene({kind:'intervals',intervals:[[-5,-2],[0,0],[1,4]],points:[-2]});assert.match(html,/-5/);assert.match(html,/0/);assert.equal((html.match(/interval-bar/g)||[]).length,3);
});
test('位运算展示每个二进制位',()=>{const html=renderScene({kind:'bits',values:['0101','0011'],labels:['n','mask'],active:[2]});assert.equal((html.match(/bit-cell/g)||[]).length,8);assert.match(html,/mask/);});
test('树的next边不参与父子布局，同层节点保持同高',()=>{
 const scene={kind:'tree',nodes:[{id:'0',label:'1'},{id:'1',label:'2'},{id:'2',label:'3'}],edges:[{from:'0',to:'1',label:'L'},{from:'0',to:'2',label:'R'},{from:'1',to:'2',label:'next',directed:true}]};
 const html=renderScene(scene);const a=html.match(/data-node="1"[\s\S]*?node-circle[^>]*cy="([^"]+)"/)[1];const b=html.match(/data-node="2"[\s\S]*?node-circle[^>]*cy="([^"]+)"/)[1];assert.equal(a,b);
});
test('半开区间上界n显示为边界标记，不伪装为有效元素',()=>{const html=renderScene({kind:'array',values:[1,3],pointers:{lo:0,mid:1,hi:2}});assert.match(html,/boundary-marker/);assert.match(html,/hi/);assert.match(html,/2/);});
test('矩阵中点与行列变量可对应到格子',()=>{const html=renderScene({kind:'matrix',matrix:[[1,3],[5,7]],active:[[0,1]],cellPointers:{mid:[0,1]},rowPointers:{r:0},colPointers:{c:1}});assert.match(html,/mid/);assert.match(html,/r/);assert.match(html,/c/);});
