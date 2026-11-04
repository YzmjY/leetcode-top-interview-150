import test from 'node:test';
import assert from 'node:assert/strict';
import {treeFromLevel,treeToLevel,treeView,traceLesson} from '../src/lesson-kit.js';

test('层序树按非空父节点消费孩子，而不是堆下标',()=>{
 const input=[1,null,2,3];const root=treeFromLevel(input);assert.equal(root.right.left.val,3);assert.deepEqual(treeToLevel(root),input);assert.deepEqual(treeView(root).edges.map(e=>[e.from,e.to]),[['0','2'],['2','3']]);
});
test('相同树值不能合并节点，拒绝没有父节点的尾部数据',()=>{
 const scene=treeView(treeFromLevel([2,2,2]));assert.equal(scene.nodes.length,3);assert.equal(new Set(scene.nodes.map(n=>n.id)).size,3);assert.throws(()=>treeFromLevel([1,null,null,2]),/父节点/);
});
test('跟踪记录是独立快照，不改变原始输入',()=>{
 const lesson={id:0,code:'func example() {}',solve(input,emit){emit({kind:'array',values:input.nums},'原始','',[1]);input.nums[0]=9;emit({kind:'array',values:input.nums},'更新','',[1]);return input.nums;}};
 const input={nums:[1,2]};const run=traceLesson(lesson,input);assert.deepEqual(input.nums,[1,2]);assert.deepEqual(run.frames[0].scene.values,[1,2]);assert.deepEqual(run.result,[9,2]);run.frames[1].scene.values[0]=8;assert.equal(run.frames[0].scene.values[0],1);
});
test('无效高亮不能静默退回第一行',()=>{
 const lesson={id:2,code:'x',solve(_,emit){emit({kind:'state',items:[]},'test','',[4]);return 0;}};assert.throws(()=>traceLesson(lesson,{}),/高亮行号越界/);
});
