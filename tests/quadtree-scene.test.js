import test from 'node:test';
import assert from 'node:assert/strict';
import {lessonsC} from '../src/lessons-c.js';
import {traceLesson} from '../src/lesson-kit.js';

const lesson=lessonsC.find(l=>l.id===427);
const run=input=>traceLesson(lesson,input??lesson.input);
const childKeys={TL:'topLeft',TR:'topRight',BL:'bottomLeft',BR:'bottomRight'};

function visibleTree(scene){
  const incoming=new Set(scene.edges.map(e=>e.to));
  const root=scene.nodes.find(n=>!incoming.has(n.id));
  const nodes=new Map(scene.nodes.map(n=>[n.id,n]));
  function visit(id){
    const node=nodes.get(id),out={val:node.val,isLeaf:node.isLeaf};
    for(const e of scene.edges.filter(e=>e.from===id))out[childKeys[e.label]]=visit(e.to);
    return out;
  }
  return visit(root.id);
}

test('427最终场景展示实际输出四叉树及四个象限标签',()=>{
  const t=run(),scene=t.frames.at(-1).scene;
  assert.equal(scene.kind,'tree','构造完成时应直接看见输出树');
  assert.equal(scene.nodes.length,5);
  assert.deepEqual(scene.edges.map(e=>e.label),['TL','TR','BL','BR']);
  assert.deepEqual(visibleTree(scene),{
    val:1,isLeaf:false,
    topLeft:{val:1,isLeaf:true},topRight:{val:1,isLeaf:true},
    bottomLeft:{val:1,isLeaf:true},bottomRight:{val:0,isLeaf:true}
  });
  assert.deepEqual(visibleTree(scene),t.result);
});

test('427扫描、节点生成与逐个连接过程中同时保留网格和已构建树',()=>{
  const t=run(),trees=t.frames.filter(f=>f.scene.kind==='tree'&&f.phase==='step');
  assert.ok(trees.length>5,'应展示中间构造过程');
  assert.ok(trees.some(f=>f.scene.nodes.length===0),'首次扫描尚未创建输出节点');
  assert.ok(trees.some(f=>f.scene.nodes.length===1));
  assert.ok(trees.some(f=>f.scene.nodes.length>1&&f.scene.nodes.length<5));
  assert.deepEqual([...new Set(trees.map(f=>f.scene.edges.length))],[0,1,2,3,4],'四条子树边逐次接入');
  const identities=new Map();
  for(const {scene,vars,title} of trees){
    assert.deepEqual(scene.sourceMatrix,[[1,1],[1,0]]);
    assert.ok(Array.isArray(scene.sourceActive));
    for(const [r,c] of scene.sourceActive)assert.ok(r>=0&&r<2&&c>=0&&c<2);
    if(title==='检查正方形区域')assert.equal(scene.sourceActive.length,vars.size**2);
    for(const n of scene.nodes){
      const old=identities.get(n.id);
      if(old)assert.deepEqual(n,old,'区域节点的身份和值保持不变');
      else identities.set(n.id,n);
    }
    const ids=new Set(scene.nodes.map(n=>n.id));
    for(const e of scene.edges){assert.ok(ids.has(e.from)&&ids.has(e.to));assert.ok(Object.hasOwn(childKeys,e.label));}
  }
  assert.equal(identities.size,5);
});

test('427同值区域压缩为单叶，递归多层仍完整连接实际输出',()=>{
  for(const c of [{input:lesson.input,expected:lesson.expected},...lesson.cases]){
    const t=run(c.input),scene=t.frames.at(-1).scene;
    assert.equal(scene.kind,'tree');assert.deepEqual(t.result,c.expected);
    assert.deepEqual(visibleTree(scene),c.expected);
    assert.deepEqual(scene.sourceMatrix,c.input.grid);
  }
  const grid=Array.from({length:4},(_,r)=>Array.from({length:4},(_,c)=>(r+c)%2));
  const gridBefore=structuredClone(grid);
  const t=run({grid}),scene=t.frames.at(-1).scene;
  assert.equal(scene.nodes.length,21);assert.equal(scene.edges.length,20);
  assert.equal(new Set(scene.nodes.map(n=>n.id)).size,21);
  assert.deepEqual(visibleTree(scene),t.result);
  const first=t.frames.find(f=>f.scene.kind==='tree');
  assert.equal(first.scene.nodes.length,0,'后续创建不能污染之前的快照');
  assert.deepEqual(grid,gridBefore);
});
