import test from 'node:test';
import assert from 'node:assert/strict';
import {interpolatePositions,edgeGeometry} from '../src/scene-motion.js';

test('反转时同一节点沿坐标移动，重复值不影响身份',()=>{
 const before=new Map([['a',{x:52,y:104}],['b',{x:136,y:104}]]);
 const after=new Map([['b',{x:52,y:104}],['a',{x:136,y:104}]]);
 const middle=interpolatePositions(before,after,.25);
 assert.equal(middle.get('a').x,73);
 assert.equal(middle.get('b').x,115);
 assert.ok(middle.get('a').y<104);assert.ok(middle.get('b').y>104);
 assert.deepEqual(interpolatePositions(before,after,1),after);
});

test('断链后暂存区和新增节点的运动坐标完整',()=>{
 const after=new Map([['a',{x:52,y:248}],['new',{x:136,y:248}]]);
 const middle=interpolatePositions(new Map([['a',{x:52,y:104}]]),after,.5);
 assert.equal(middle.get('a').y,176);
 assert.deepEqual(middle.get('new'),after.get('new'));
});

test('交换节点从不同弧线经过，中途不重叠或误画自环',()=>{
 for(const end of [{x:136,y:104},{x:52,y:194}]){
  const from=new Map([['a',{x:52,y:104}],['b',end]]),to=new Map([['a',end],['b',{x:52,y:104}]]);
  const middle=interpolatePositions(from,to,.5),a=middle.get('a'),b=middle.get('b');
  assert.ok(Math.hypot(a.x-b.x,a.y-b.y)>46);
 }
 const zero=edgeGeometry({x:52,y:104},{x:52,y:104},{kind:'linked',self:false});
 assert.ok(!zero.path.includes('-45'));
 assert.match(zero.path,/ L /);
});

test('连线随节点移动，环和跨行连接都有有限路径',()=>{
 for(const b of [{x:136,y:104},{x:52,y:248},{x:52,y:104}]){
  const g=edgeGeometry({x:52,y:104},b,{kind:'linked',directed:true});
  assert.ok(g.path.startsWith('M '));assert.doesNotMatch(g.path,/NaN|Infinity/);
 }
 const a=edgeGeometry({x:52,y:104},{x:136,y:104},{kind:'linked'});
 const b=edgeGeometry({x:94,y:176},{x:136,y:248},{kind:'linked'});
 assert.notEqual(a.path,b.path);
});

test('从首列上移接回链表时，整个节点保持在画布内',()=>{
 const from=new Map([['move',{x:52,y:248}],['tail',{x:136,y:104}]]);
 const to=new Map([['move',{x:52,y:104}],['tail',{x:136,y:104}]]);
 for(const t of [.1,.25,.5,.75,.9]){
  const p=interpolatePositions(from,to,t,{width:620,height:452}).get('move');
  assert.ok(p.x>=28&&p.x<=592&&p.y>=28&&p.y<=424);
 }
});
