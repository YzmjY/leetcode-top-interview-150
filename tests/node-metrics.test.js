import test from 'node:test';
import assert from 'node:assert/strict';
import {nodeMetrics} from '../src/node-metrics.js';
import {layoutTree} from '../src/tree-layout.js';
import {layoutLinked} from '../src/linked-layout.js';

const edge=(from,to,label)=>({from,to,label});
const nodesOf=labels=>labels.map((label,id)=>({id:String(id),label}));

function assertReadableLayout(scene,layout){
  const levels=new Map();
  for(const node of scene.nodes){
    const p=layout.positions.get(String(node.id)),size=nodeMetrics(node);
    assert.ok(p,`节点${node.id}必须保留独立位置`);
    assert.ok(p.x-size.width/2>=0,`节点${node.id}不能越过左边界`);
    assert.ok(p.x+size.width/2<=layout.width,`节点${node.id}不能越过右边界`);
    assert.ok(p.y-size.height/2>=0,`节点${node.id}不能越过上边界`);
    assert.ok(p.y+size.height/2<=layout.height,`节点${node.id}不能越过下边界`);
    if(!levels.has(p.y))levels.set(p.y,[]);
    levels.get(p.y).push({x:p.x,width:size.width});
  }
  for(const row of levels.values()){
    row.sort((a,b)=>a.x-b.x);
    for(let i=1;i<row.length;i++){
      const gap=row[i].x-row[i].width/2-(row[i-1].x+row[i-1].width/2);
      assert.ok(gap>=24,`同层节点至少留24px间隔，实际${gap}`);
    }
  }
}

test('短值保留46px节点，长数字和负数按完整文本扩宽',()=>{
  assert.deepEqual(nodeMetrics({label:'2'}),{width:46,height:46,lines:['2'],caption:false});
  assert.deepEqual(nodeMetrics({label:'1234567890'}),{width:105,height:46,lines:['1234567890'],caption:false});
  const negative=nodeMetrics({label:'-1000000000'});
  assert.equal(negative.width,114);
  assert.deepEqual(negative.lines,['-1000000000']);
});

test('多行tuple每行完整保留，并按最长行及行数给出尺寸',()=>{
  const lines=['sum=2000000000','i=12 j=34'];
  assert.deepEqual(nodeMetrics({label:'旧文本',labelLines:lines}),{width:139,height:56,lines,caption:false});
  assert.deepEqual(nodeMetrics({label:'sum=3\ni=0 j=1'}).lines,['sum=3','i=0 j=1']);
});

test('中文标题按完整字符估宽，caption只占28px高',()=>{
  const label='较小一半（大顶堆）';
  const size=nodeMetrics({label,caption:true});
  assert.equal(size.caption,true);
  assert.equal(size.height,28);
  assert.equal(size.width,Array.from(label).length*14+20);
  assert.deepEqual(size.lines,[label]);
});

test('树的普通短值保持现有左右子树坐标基线',()=>{
  const scene={nodes:nodesOf(['1','2','3']),edges:[edge('0','1','L'),edge('0','2','R')]};
  const layout=layoutTree(scene);
  assert.equal(layout.width,350);
  assert.equal(layout.height,202);
  assert.deepEqual([...layout.positions],[['0',{x:175,y:56}],['1',{x:139,y:146}],['2',{x:211,y:146}]]);
});

test('宽负数和重复值树节点同层不重叠且全部留在画布内',()=>{
  const scene={nodes:nodesOf(Array(15).fill('-1000000000')),edges:Array.from({length:14},(_,i)=>edge(String(i>>1),String(i+1),i%2?'R':'L'))};
  const layout=layoutTree(scene);
  assert.equal(layout.positions.size,15);
  assertReadableLayout(scene,layout);
});

test('中文标题和多行tuple组成的多棵堆树保留完整占位',()=>{
  const scene={nodes:[
    {id:'low',label:'左侧用于存储较小一半的大顶堆',caption:true},
    {id:'high',label:'右侧用于存储较大一半的小顶堆',caption:true},
    {id:'a',labelLines:['sum=-2000000000','i=12 j=34']},
    {id:'b',labelLines:['sum=2000000000','i=56 j=78']},
  ],edges:[edge('low','a',''),edge('high','b','')]};
  assertReadableLayout(scene,layoutTree(scene));
});

test('短链画布按实际行宽收缩，七个节点后仍换行',()=>{
  for(const [count,width] of [[0,350],[1,350],[5,440],[7,608],[8,608]]){
    const nodes=nodesOf(Array(count).fill('2'));
    const layout=layoutLinked({nodes,chains:[{label:'链表',ids:nodes.map(n=>n.id)}]});
    assert.equal(layout.width,width,`${count}节点的画布宽度`);
    assert.equal(layout.chains.length,Math.ceil(count/7));
    if(count)assert.deepEqual(layout.positions.get('0'),{x:52,y:104});
    if(count===8)assert.ok(layout.positions.get('7').y>layout.positions.get('6').y);
  }
});

test('宽链表节点和tuple按真实尺寸排开，重复值身份与原场景保持不变',()=>{
  const nodes=nodesOf(['-1000000000','-1000000000','0','3','4','5','6','7']);
  nodes[2].labelLines=['sum=2000000000','i=12 j=34'];
  const scene={nodes,chains:[{label:'结果',ids:nodes.map(n=>n.id)}],edges:nodes.slice(1).map((n,i)=>edge(nodes[i].id,n.id,'next'))};
  const before=structuredClone(scene),layout=layoutLinked(scene);
  assert.equal(layout.positions.size,nodes.length);
  assert.notDeepEqual(layout.positions.get('0'),layout.positions.get('1'));
  assertReadableLayout(scene,layout);
  assert.deepEqual(scene,before);
});
