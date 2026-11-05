import test from 'node:test';
import assert from 'node:assert/strict';
import {lessonsC} from '../src/lessons-c.js';
import {traceLesson} from '../src/lesson-kit.js';

const lesson=id=>lessonsC.find(l=>l.id===id);
const run=(id,input)=>traceLesson(lesson(id),input??lesson(id).input);
const edge=(scene,from,to)=>scene.edges.some(e=>e.from===from&&e.to===to&&e.label==='next');

function assertVisibleIdentity(trace,values){
  const original=trace.frames[0].scene;
  assert.equal(original.kind,'linked','输入就应展示真实链表节点');
  assert.deepEqual(original.nodes.map(n=>Number(n.label)),values);
  const labels=new Map(original.nodes.map(n=>[n.id,n.label]));
  for(const {scene} of trace.frames){
    assert.equal(scene.kind,'linked');
    const dataNodes=scene.nodes.filter(n=>!n.sentinel),allIds=new Set(scene.nodes.map(n=>n.id));
    assert.equal(dataNodes.length,values.length,'分治和合并过程中不能丢掉其他原节点');
    assert.equal(allIds.size,scene.nodes.length);
    for(const n of dataNodes)assert.equal(n.label,labels.get(n.id),'同一原节点的值不能因位置变化而改写');
    for(const n of scene.nodes.filter(n=>n.sentinel))assert.equal(labels.has(n.id),false,'哨兵不可复用原节点身份');
    assert.ok(Array.isArray(scene.chains),'场景应明确分组的实际摆放顺序');
    const placed=scene.chains.flatMap(c=>c.ids);
    assert.equal(new Set(placed).size,scene.nodes.length,'每个节点及哨兵恰好摆放一次');
    assert.deepEqual([...placed].sort(),[...allIds].sort());
    for(const c of scene.chains){
      assert.equal(typeof c.label,'string');
      for(let i=1;i<c.ids.length;i++)assert.ok(edge(scene,c.ids[i-1],c.ids[i]),'同一展示链内必须存在真实next边');
    }
    for(const e of scene.edges){assert.equal(e.label,'next');assert.ok(allIds.has(e.from)&&allIds.has(e.to));}
    for(const id of Object.values(scene.pointers??{}))assert.ok(id===null||allIds.has(id),'Go指针只能指向实际节点或nil');
  }
  return original.nodes.map(n=>n.id);
}

function assertFinalChain(trace,ids,values){
  const final=trace.frames.at(-1).scene;
  assert.deepEqual(trace.result,values);
  assert.deepEqual(final.chains[0].ids,ids,'最终结果链必须复用原始节点身份');
  const dataIds=new Set(ids),sentinelIds=new Set(final.nodes.filter(n=>n.sentinel).map(n=>n.id));
  assert.ok(final.chains.slice(1).flatMap(c=>c.ids).every(id=>sentinelIds.has(id)),'完成后其他分组只能保留哨兵');
  assert.deepEqual(final.edges.filter(e=>dataIds.has(e.from)).map(e=>[e.from,e.to]).sort(),ids.slice(1).map((id,i)=>[ids[i],id]).sort());
}

test('148排序复用原始节点，重复值按原有身份稳定连接',()=>{
  for(const [input,order,values] of [
    [{head:[4,2,1,3]},[2,1,3,0],[1,2,3,4]],
    [{head:[-1,0,-1]},[0,2,1],[-1,-1,0]],
    [{head:[2,2,1,2]},[2,0,1,3],[1,2,2,2]]
  ]){
    const t=run(148,input),ids=assertVisibleIdentity(t,input.head);
    assertFinalChain(t,order.map(i=>ids[i]),values);
  }
});

test('148断链帧切断slow.Next，并显示Go快慢指针和两条子链',()=>{
  const t=run(148),initial=t.frames[0].scene;
  const split=t.frames.find(f=>f.title==='断开链表');
  assert.ok(split,'必须展示真实分治断链');
  const ids=initial.nodes.map(n=>n.id);
  assert.equal(split.scene.edges.some(e=>e.from===ids[1]&&e.to===ids[2]),false,'第一次分半后原中间边必须断开');
  assert.ok(split.scene.pointers,'断链时应显示真实Go指针');
  assert.equal(split.scene.pointers.slow,ids[1]);
  assert.equal(split.scene.pointers.right,ids[2]);
  assert.deepEqual(split.scene.chains.filter(c=>c.ids.length).slice(0,2).map(c=>c.ids),[ids.slice(0,2),ids.slice(2)]);
  assert.ok(t.frames.some(f=>f.scene.pointers?.tail&&Object.hasOwn(f.scene.pointers,'left')),'合并时应显示Go的tail、left、right');
});

test('23各层归并保留输入来源身份，并复用相同值的不同节点',()=>{
  const t=run(23),ids=assertVisibleIdentity(t,[1,4,5,1,3,4,2,6]);
  assertFinalChain(t,[0,3,6,4,1,5,2,7].map(i=>ids[i]),[1,1,2,3,4,4,5,6]);
  assert.ok(t.frames.some(f=>f.scene.pointers?.tail&&Object.hasOwn(f.scene.pointers,'a')&&Object.hasOwn(f.scene.pointers,'b')),'合并应显示Go的a、b、tail');
});

test('23和148的默认、内置边界以及空链单链均有真实最终场景',()=>{
  for(const id of [23,148]){
    const l=lesson(id);
    for(const c of [{input:l.input,expected:l.expected},...l.cases]){
      const t=run(id,c.input),values=id===148?c.input.head:c.input.lists.flat();
      assertVisibleIdentity(t,values);
      assert.deepEqual(t.result,c.expected);
      const final=t.frames.at(-1).scene,labels=new Map(final.nodes.map(n=>[n.id,Number(n.label)]));
      assert.deepEqual(final.chains[0].ids.map(id=>labels.get(id)),c.expected);
    }
  }
  for(const [id,input,expected] of [
    [148,{head:[7]},[7]],[148,{head:[2,1]},[1,2]],
    [23,{lists:[[],[],[]]},[]],[23,{lists:[[1,1]]},[1,1]],
    [23,{lists:[[2,2],[1,2],[]]},[1,2,2,2]]
  ]){
    const t=run(id,input);assertVisibleIdentity(t,id===148?input.head:input.lists.flat());
    assert.deepEqual(t.result,expected);
    assert.deepEqual(t.frames.at(-1).scene.chains[0].ids.length,expected.length);
  }
});

test('23和148的Go合并哨兵是真实非nil节点，tail初始化指向它且不混入结果链',()=>{
  for(const id of [23,148]){
    const t=run(id),setups=t.frames.filter(f=>f.phase==='step'&&f.anchor?.includes('dummy')&&f.anchor.includes('&ListNode{}'));
    assert.ok(setups.length>0,`题目${id}应展示dummy和tail初始化`);
    const created=new Set();
    for(const f of setups){
      const {dummy,tail}=f.scene.pointers;
      assert.notEqual(tail,null,'tail:=dummy时tail不是nil');
      assert.equal(tail,dummy);
      assert.equal(f.scene.nodes.find(n=>n.id===dummy)?.sentinel,true);
      assert.equal(f.scene.edges.some(e=>e.from===dummy),false,'新哨兵的Next初始为空');
      assert.equal(created.has(dummy),false,'每次归并应建立独立哨兵');created.add(dummy);
    }
    const known=new Map();
    for(const f of t.frames){
      const sentinels=f.scene.nodes.filter(n=>n.sentinel),ids=new Set(sentinels.map(n=>n.id));
      for(const n of sentinels){if(known.has(n.id))assert.equal(n.label,known.get(n.id));else known.set(n.id,n.label);}
      assert.ok(f.scene.chains[0].ids.every(id=>!ids.has(id)),'结果或待处理数据链不包含哨兵');
      if(Object.hasOwn(f.scene.pointers,'tail'))assert.notEqual(f.scene.pointers.tail,null,'实际存在的tail不可伪装nil');
      if(f.scene.pointers.dummy&&f.scene.chains[0].ids.length)assert.ok(edge(f.scene,f.scene.pointers.dummy,f.scene.chains[0].ids[0]),'dummy.Next真实指向本次输出头节点');
    }
    assert.equal(known.size,created.size);
  }
});

test('23和148只展示当前归并作用域的哨兵，40节点完成后只保留结果数据链',()=>{
  for(const [id,input,count] of [
    [148,{head:Array.from({length:40},(_,i)=>40-i)},40],
    [23,{lists:Array.from({length:12},(_,i)=>[i,i+12,i+24,i+36,i+48])},60]
  ]){
    const t=run(id,input),seen=new Set();
    for(const {scene} of t.frames){
      const sentinels=scene.nodes.filter(n=>n.sentinel);
      assert.ok(sentinels.length<=1,'已返回的归并哨兵不应继续占行');
      const referenced=new Set(Object.values(scene.pointers));
      for(const n of sentinels){assert.ok(referenced.has(n.id),'只显示当前Go指针引用的哨兵');seen.add(n.id);}
      const visible=new Set(scene.nodes.map(n=>n.id));
      for(const e of scene.edges)assert.ok(visible.has(e.from)&&visible.has(e.to),'不能留下隐藏哨兵的入边');
      assert.equal(scene.nodes.filter(n=>!n.sentinel).length,count,'所有数据节点仍完整可见');
    }
    assert.ok(seen.size>1,'不同归并仍使用各自独立哨兵');
    const final=t.frames.at(-1).scene;
    assert.equal(final.nodes.length,count);
    assert.equal(final.nodes.some(n=>n.sentinel),false);
    assert.equal(final.edges.length,count-1);
    assert.equal(final.chains.length,1);
    assert.equal(final.chains[0].ids.length,count);
  }
});
