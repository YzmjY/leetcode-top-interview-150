import test from 'node:test';
import assert from 'node:assert/strict';
import {lessonsB} from '../src/lessons-b.js';
import {lessonsC} from '../src/lessons-c.js';
import {traceLesson} from '../src/lesson-kit.js';

const lessons=[...lessonsB,...lessonsC];
const trace=(id,input)=>{const lesson=lessons.find(l=>l.id===id);return traceLesson(lesson,input??lesson.input);};

test('heap headings remain captions when the heap is empty or changing',()=>{
  for(const id of [215,502,373,295])for(const frame of trace(id).frames){
    for(const node of frame.scene.nodes??[])if(['heap','low','high','transfer'].includes(node.id)){
      assert.equal(node.caption,true,`lesson ${id}: ${node.label} is a heading, not a heap item`);
      assert.equal(node.slot,undefined);
    }
  }
});

test('large pair sums retain both source indices in separate readable label lines',()=>{
  const {frames,result}=trace(373,{nums1:[1000000000],nums2:[1000000000],k:1});
  assert.deepEqual(result,[[1000000000,1000000000]]);
  const node=frames.flatMap(f=>f.scene.nodes??[]).find(n=>n.id==='pair:0:0');
  assert.equal(node.label,'2000000000,0,0');
  assert.deepEqual(node.labelLines,['sum=2000000000','i=0, j=0']);
});

test('clone graph shows source and copy groups even before copy edges exist',()=>{
  const {frames}=trace(133);
  for(const frame of frames)for(const node of frame.scene.nodes){
    assert.equal(node.group,node.id.startsWith('o')?'原图':'副本');
  }
  const created=frames.find(f=>f.scene.nodes.some(n=>n.id==='c0'));
  assert.ok(created.scene.nodes.some(n=>n.id==='o0'&&n.group==='原图'));
  assert.ok(created.scene.nodes.some(n=>n.id==='c0'&&n.group==='副本'));
});

test('LCA pointer identities remain distinct from node values, including duplicate values',()=>{
  for(const input of [{root:[3,5,1,6,2,0,8,null,null,7,4],p:1,q:10},{root:[5,5,5,9],p:1,q:3}]){
    const {frames}=trace(236,input);
    for(const frame of frames){
      assert.ok(frame.scene.pointers,'LCA frames must identify their target pointers');
      assert.equal(frame.scene.pointerLabels?.p,'目标节点p');
      assert.equal(frame.scene.pointerLabels?.q,'目标节点q');
      assert.equal(frame.scene.pointers.p,String(input.p));
      assert.equal(frame.scene.pointers.q,String(input.q));
      for(const name of ['left','right','返回'])if(name in frame.scene.pointers){
        assert.equal(frame.scene.pointerLabels[name],{left:'左子树返回',right:'右子树返回',返回:'本层返回节点'}[name]);
        const id=frame.scene.pointers[name],node=frame.scene.nodes.find(n=>n.id===id);
        const valueKey=name==='返回'?'返回节点值':`${name}.Val`;
        assert.equal(frame.vars[valueKey],node?Number(node.label):null);
      }
    }
    assert.ok(frames.some(f=>f.scene.pointers['返回']===String(input.p)));
  }
});

test('visual max heaps explain the negated values used by the Go min heap',()=>{
  for(const id of [502,295])assert.ok(trace(id).frames.some(f=>/Go.*相反数/.test(f.description)),`lesson ${id} must explain the value mapping`);
});

test('combination sum distinguishes current rest from the next recursive argument',()=>{
  const lesson=lessons.find(l=>l.id===39);
  for(const frame of trace(39).frames.filter(f=>f.title==='选择可重复候选')){
    const path=frame.scene.values;
    const prior=path.slice(0,-1).reduce((sum,x)=>sum+x,0);
    assert.equal(frame.vars.rest,lesson.input.target-prior);
    assert.equal(frame.vars['下一层rest'],lesson.input.target-path.reduce((sum,x)=>sum+x,0));
  }
});

test('word search uses readable matched prefixes after occupied cells become markers',()=>{
  const input={board:[['a','b']],words:['ab','aba','b']};
  for(const frame of trace(212,input).frames.filter(f=>f.title==='匹配前缀并占用路径格')){
    const prefix=frame.scene.done.map(([r,c])=>input.board[r][c]).join('');
    assert.equal(frame.vars['已匹配前缀'],prefix);
    assert.equal(frame.vars['前缀节点'],undefined);
  }
});

test('snakes and ladders labels every square with its snake-order number',()=>{
  const frames=trace(909).frames;
  for(const frame of frames){
    assert.ok(frame.scene.cellLabels,'every board frame needs square numbers');
    assert.equal(frame.scene.cellLabels[5][0],'编号 1');
    assert.equal(frame.scene.cellLabels[5][1],'编号 2');
    assert.equal(frame.scene.cellLabels[4][5],'编号 7');
    assert.equal(frame.scene.cellLabels[3][2],'编号 15');
    assert.equal(frame.scene.cellLabels[0][0],'编号 36');
  }
});

test('binary addition aligns unequal inputs and marks precisely the bits read and written',()=>{
  const input={a:'111',b:'1'};
  const steps=trace(67,input).frames.filter(f=>f.phase==='step');
  for(const [i,frame] of steps.entries()){
    const width=4;
    assert.equal(frame.scene.bitWidth,width);
    assert.deepEqual(frame.scene.activeByRow,[i<3?[width-1-i]:[],i<1?[width-1-i]:[],[width-1-i]]);
    assert.equal(frame.vars.i,Math.max(-1,input.a.length-2-i));
    assert.equal(frame.vars.j,-1);
  }
});

test('reverse bits highlights each current source LSB and the just-appended result LSB',()=>{
  const steps=trace(190,{n:13}).frames.filter(f=>f.phase==='step');
  let num=13,ans=0;
  for(const frame of steps){
    ans=((ans<<1)|(num&1))>>>0;
    assert.equal(frame.scene.bitWidth,32);
    assert.deepEqual(frame.scene.activeByRow,[[31],[31]]);
    assert.equal(parseInt(frame.scene.values[0],2),num);
    assert.equal(parseInt(frame.scene.values[1],2),ans);
    assert.equal(frame.vars.num,num);
    num>>>=1;
  }
});
