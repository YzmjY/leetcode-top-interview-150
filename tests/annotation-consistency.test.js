import test from 'node:test';
import assert from 'node:assert/strict';
import {getLesson} from '../src/lessons.js';
import {traceLesson} from '../src/lesson-kit.js';

test('三数之和命中后立即展示已记录结果，完成态与返回值一致',()=>{
  const item=getLesson(15);
  const {frames,result}=traceLesson(item,{nums:[0,0,0,0]});
  assert.deepEqual(result,[[0,0,0]]);
  const recorded=frames.find(frame=>frame.phase!=='done'&&frame.vars.result?.length);
  assert.ok(recorded,'命中后应有记录三元组的独立快照');
  assert.deepEqual(recorded.vars.result,[[0,0,0]]);
  assert.deepEqual(frames.at(-1).vars.result,result);
});

test('合并数组读取耗尽及写入完成时保留真实的负边界指针',()=>{
  const {frames}=traceLesson(getLesson(88),{nums1:[],nums2:[1]});
  assert.equal(frames[0].vars.i,-1);
  assert.equal(frames[0].scene.pointers.i,-1);
  const moved=frames.find(frame=>frame.title==='向左移动指针');
  assert.deepEqual(moved.scene.pointers,{i:-1,k:-1});
  assert.deepEqual(moved.scene.secondaryPointers,{j:-1});
  assert.deepEqual(frames.at(-1).scene.pointers,{i:-1,k:-1});
  assert.deepEqual(frames.at(-1).scene.secondaryPointers,{j:-1});
});

test('合并数组的每帧图示指针均与Go状态变量数值一致',()=>{
  const item=getLesson(88);
  for(const input of [item.input,...item.cases.map(c=>c.input)]){
    for(const frame of traceLesson(item,input).frames){
      assert.equal(frame.scene.pointers.i,frame.vars.i);
      assert.equal(frame.scene.pointers.k,frame.vars.k);
      assert.equal(frame.scene.secondaryPointers.j,frame.vars.j);
    }
  }
});

test('字母计数桶显示完整a-z映射，指针仍使用数字槽位',()=>{
  const alphabet=Array.from('abcdefghijklmnopqrstuvwxyz');
  for(const id of [242,383]){
    const item=getLesson(id);
    for(const input of [item.input,...item.cases.map(c=>c.input)]){
      for(const frame of traceLesson(item,input).frames){
        assert.deepEqual(frame.scene.indexLabels,alphabet,`题${id}：${frame.title}`);
        assert.match(frame.scene.indexNote,/0.*a.*25.*z/);
        for(const at of Object.values(frame.scene.pointers))assert.equal(typeof at,'number');
      }
    }
  }
  const anagram=traceLesson(getLesson(242),{s:'az',t:'za'}).frames[1];
  assert.deepEqual(anagram.scene.pointers,{'s字母槽位':0,'t字母槽位':25});
  assert.equal(anagram.scene.indexLabels[anagram.scene.pointers['t字母槽位']],'z');
});

test('罗马数字、单词计数及文本排版不把全部字符处理声称为匹配',()=>{
  for(const id of [12,13,58,68]){
    const item=getLesson(id);
    const textFrames=traceLesson(item,item.input).frames.filter(frame=>frame.scene.kind==='text'&&frame.phase!=='done');
    assert.ok(textFrames.length>0);
    for(const frame of textFrames){
      assert.doesNotMatch(frame.description,/匹配状态/);
      assert.match(frame.description,/字符|编码|符号|计数|排版|空格/);
    }
  }
});

test('设计题的当前操作绑定输入序号、参数和实际返回，null只是无查询值的占位',()=>{
  for(const id of [155,380]){
    const item=getLesson(id);
    for(const input of [item.input,...item.cases.map(c=>c.input)]){
      const {frames,result}=traceLesson(item,input);
      const steps=frames.filter(frame=>frame.phase!=='done');
      assert.equal(steps.length,input.operations.length);
      for(const frame of steps){
        const current=frame.scene.operation;
        assert.ok(current,`题${id}：${frame.title} 缺少操作身份`);
        const [name,...args]=input.operations[current.index];
        assert.equal(current.name,name);
        assert.deepEqual(current.args,args);
        assert.equal(current.returns,id===155?['top','getMin'].includes(name):['insert','remove','getRandom'].includes(name));
        assert.equal(current.value,result[current.index]);
        assert.equal(current.value,frame.vars['操作返回']);
        assert.deepEqual(frame.vars['逐步结果'],result.slice(0,current.index+1));
      }
      assert.deepEqual(steps.map(frame=>frame.scene.operation.index),Array.from({length:input.operations.length},(_,index)=>index));
      assert.deepEqual(frames.at(-1).scene.operation,steps.at(-1).scene.operation);
    }
  }
});

test('当前操作元数据保留零值返回、失败false和getRandom回放参数',()=>{
  const stack=traceLesson(getLesson(155),{operations:[['MinStack'],['push',0],['top'],['pop']]}).frames;
  assert.deepEqual(stack[2].scene.operation,{index:2,name:'top',args:[],returns:true,complete:true,value:0});
  assert.deepEqual(stack[3].scene.operation,{index:3,name:'pop',args:[],returns:false,complete:true,value:null});
  const set=traceLesson(getLesson(380),{operations:[['RandomizedSet'],['insert',0],['insert',0],['getRandom',999]]}).frames;
  assert.deepEqual(set[2].scene.operation,{index:2,name:'insert',args:[0],returns:true,complete:true,value:false});
  assert.deepEqual(set[3].scene.operation,{index:3,name:'getRandom',args:[999],returns:true,complete:true,value:0});
});

test('七道操作题的多帧过程绑定同一输入操作，只在完成帧记录返回及累积结果',()=>{
  const returning={155:['top','getMin'],380:['insert','remove','getRandom'],146:['get'],173:['next','hasNext'],208:['search','startsWith'],211:['search'],295:['findMedian']};
  for(const id of [155,380,146,173,208,211,295]){
    const item=getLesson(id);
    for(const input of [item.input,...item.cases.map(c=>c.input)]){
      const commands=input.operations??input.ops;
      const {frames,result}=traceLesson(item,input);
      const groups=commands.map(()=>[]);
      let started=false;
      for(const frame of frames.filter(frame=>frame.phase!=='done')){
        const current=frame.scene.operation;
        if(!current){assert.equal(started,false,`题${id}：操作执行后丢失身份`);continue;}
        started=true;
        assert.ok(Number.isInteger(current.index)&&current.index>=0&&current.index<commands.length);
        const command=commands[current.index],parts=Array.isArray(command)?command:[command];
        assert.equal(current.name,parts[0]);
        assert.deepEqual(current.args,parts.slice(1));
        assert.equal(current.returns,returning[id].includes(current.name));
        assert.equal(typeof current.complete,'boolean');
        if(current.complete)assert.equal(current.value,result[current.index]);
        else assert.equal(Object.hasOwn(current,'value'),false,'运行中不能显示尚未产生的返回值');
        assert.deepEqual(frame.vars['逐步结果'],result.slice(0,current.index+(current.complete?1:0)));
        groups[current.index].push(current);
      }
      for(const [index,group] of groups.entries()){
        assert.ok(group.length>0,`题${id}：输入操作${index}未被演示`);
        assert.equal(group.at(-1).complete,true);
        assert.ok(group.slice(0,-1).every(operation=>operation.complete===false));
      }
    }
  }
});

test('295的堆交换过程不提前输出addNum占位值，操作完成后才追加null',()=>{
  const {frames,result}=traceLesson(getLesson(295),{operations:[['MedianFinder'],['addNum',2],['findMedian']]});
  assert.deepEqual(result,[null,null,2]);
  const adding=frames.filter(frame=>frame.phase!=='done'&&frame.scene.operation?.index===1);
  assert.ok(adding.length>2,'一次addNum应含实际堆操作过程');
  assert.ok(adding.some(frame=>frame.scene.heapStep));
  for(const frame of adding.slice(0,-1)){
    assert.equal(frame.scene.operation.complete,false);
    assert.equal(Object.hasOwn(frame.scene.operation,'value'),false);
    assert.deepEqual(frame.vars['逐步结果'],[null]);
  }
  assert.deepEqual(adding.at(-1).scene.operation,{index:1,name:'addNum',args:[2],returns:false,complete:true,value:null});
  assert.deepEqual(adding.at(-1).vars['逐步结果'],[null,null]);
});
