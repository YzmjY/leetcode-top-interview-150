import test from 'node:test';
import assert from 'node:assert/strict';
import {lessonsA} from '../src/lessons-a.js';
import {traceLesson} from '../src/lesson-kit.js';

const ids=[27,26,80,169,189,121,122,55,45,274,380,238,134,135,42,13,12,58,14,151,6,28,68,125,392,167,11,15,209,3,30,76,383,205,290,242,49,1,202,219,128,228,56,57,452,20,71,155,150,224];
test('A 组精确覆盖指定 50 题且没有重复',()=>assert.deepEqual(lessonsA.map(x=>x.id).sort((a,b)=>a-b),[...ids].sort((a,b)=>a-b)));
for(const id of ids) test(`题目 ${id} 的真实结果、边界案例与动态快照`,()=>{
  const lesson=lessonsA.find(x=>x.id===id);
  assert.ok(lesson,`缺少 ${id}`);
  assert.equal(lesson.steps.length,3);
  assert.ok(lesson.summary.length>12 && lesson.rule.length>5);
  assert.ok(lesson.cases.length>=2);
  const original=structuredClone(lesson.input);
  const {frames,result}=traceLesson(lesson,lesson.input);
  assert.deepEqual(result,lesson.expected);
  assert.ok(frames.length>=3,`题目 ${id} 缺少动态计算过程`);
  assert.ok(new Set(frames.slice(0,-1).map(f=>JSON.stringify(f.scene))).size>=2,`题目 ${id} 场景没有变化`);
  const lineCount=(Array.isArray(lesson.code)?lesson.code:lesson.code.split('\n')).length;
  for(const frame of frames){
    assert.ok(frame.lines.length);
    assert.ok(frame.lines.every(n=>n>=1&&n<=lineCount));
    assert.ok(['array','text','matrix','table','intervals','stack','state'].includes(frame.scene.kind));
  }
  for(const c of lesson.cases) assert.deepEqual(traceLesson(lesson,c.input).result,c.expected,`题目 ${id} 边界例 ${JSON.stringify(c.input)}`);
  assert.deepEqual(lesson.input,original,'求解不能污染默认 JSON 示例');
});

const run=(id,input)=>traceLesson(lessonsA.find(x=>x.id===id),input).result;
test('随机集合未提供回放 ticket 时真正从随机下标抽取',t=>{
  t.mock.method(Math,'random',()=>0.99);
  assert.deepEqual(run(380,{operations:[['RandomizedSet'],['insert',10],['insert',20],['insert',30],['getRandom']]}),[null,true,true,true,30]);
});
test('计算器拒绝未用括号隔开的连续运算符',()=>{
  assert.throws(()=>run(224,{s:'1--2'}),/连续|格式|运算/);
});
test('Z 字形与对齐跨行边界',()=>{
  assert.equal(run(6,{s:'PAYPALISHIRING',numRows:4}),'PINALSIGYAHRPI');
  assert.deepEqual(run(68,{words:['What','must','be','acknowledgment','shall','be'],maxWidth:16}),['What   must   be','acknowledgment  ','shall be        ']);
});
test('窗口维护重复词频、边界跳跃和目标重复次数',()=>{
  assert.deepEqual(run(30,{s:'aaaaaa',words:['aa','aa']}),[0,1,2]);
  assert.equal(run(76,{s:'ABAACBAB',t:'AABC'}),'BAAC');
  assert.equal(run(3,{s:'dvdf'}),3);
});
test('双向约束与零元素组合',()=>{
  assert.equal(run(135,{ratings:[1,3,4,5,2]}),11);
  assert.deepEqual(run(238,{nums:[-1,1,0,-3,3]}),[0,0,9,0,0]);
  assert.equal(run(42,{height:[4,2,0,3,2,5]}),9);
  assert.equal(run(224,{s:'2-(5-6)'}),3);
});
test('非法、超规模或违反题意的输入应安全拒绝',()=>{
  for(const [id,input] of [[27,{nums:Array(81).fill(1),val:0}],[26,{nums:[2,1]}],[45,{nums:[0,1]}],[169,{nums:[1,2]}],[209,{target:5,nums:[0,5]}],[30,{s:'abc',words:['a','bb']}],[150,{tokens:['1','0','/']}],[155,{operations:[['MinStack'],['pop']]}],[380,{operations:[['RandomizedSet'],['getRandom']]}],[68,{words:['long'],maxWidth:2}]]){
    assert.throws(()=>run(id,input));
  }
});
test('过大的文本组合与畸形设计操作给出中文校验错误',()=>{
  assert.throws(()=>run(14,{strs:Array(30).fill('a'.repeat(100))}),/字符总量/);
  assert.throws(()=>run(380,{operations:[null]}),/首|构造/);
  assert.throws(()=>run(155,{operations:[null]}),/首|构造/);
});
test('随机集合交换删除后位置表仍然可用',()=>{
  assert.deepEqual(run(380,{operations:[['RandomizedSet'],['insert',1],['insert',2],['insert',3],['remove',2],['remove',3],['getRandom',999],['remove',2]]}),[null,true,true,true,true,true,1,false]);
});
test('逆波兰表达式支持 32 位有符号整数的最小值',()=>{
  assert.equal(run(150,{tokens:['-2147483648','1','*']}),-2147483648);
});

const framesFor=id=>{const lesson=lessonsA.find(l=>l.id===id);return traceLesson(lesson,lesson.input).frames.filter(f=>f.phase!=='done');};
test('移除与去重用 Go 的 write，未声明的读取下标采用中文说明',()=>{
  for(const id of[27,26,80]){
    const frames=framesFor(id);
    assert.equal(frames[0].vars.write,0);
    for(const f of frames){
      assert.equal(f.scene.pointers.write,f.vars.write);
      assert.ok(!('k'in f.vars)&&!('i'in f.vars));
      assert.ok(!('read'in f.scene.pointers));
      if('读取位置'in f.vars)assert.equal(f.scene.pointers['读取位置'],f.vars['读取位置']);
    }
  }
});
test('双指针、三数之和与窗口变量名称和坐标同步 Go',()=>{
  for(const id of[189,42,151,125,167,11,15,209,3,30,76,228]){
    const frames=framesFor(id).filter(f=>f.scene.kind==='array'||f.scene.kind==='text');
    assert.ok(frames.some(f=>Number.isInteger(f.scene.pointers?.left)&&Number.isInteger(f.scene.pointers?.right)),`${id} 没有左右指针`);
    for(const f of frames){
      assert.ok(!('l'in f.vars)&&!('r'in f.vars));
      for(const name of['left','right','i'])if(name in(f.scene.pointers??{}))assert.equal(f.scene.pointers[name],f.vars[name],`${id} ${name}`);
    }
  }
  assert.ok(framesFor(15).some(f=>f.scene.pointers?.i===f.vars.i));
  const rain=framesFor(42).find(f=>'leftMax'in f.vars);
  assert.ok(rain&&'rightMax'in rain.vars&&!('lm'in rain.vars)&&!('rm'in rain.vars));
});
test('指针必须属于被标记的序列，乘积、投票、箭数不能冒充下标',()=>{
  for(const f of framesFor(238)){
    assert.ok(!('left'in(f.scene.pointers??{}))&&!('right'in(f.scene.pointers??{})));
    if('i'in f.vars)assert.equal(f.scene.pointers.i,f.vars.i);
  }
  for(const f of framesFor(169))assert.ok(!('candidate'in(f.scene.pointers??{}))&&!('votes'in(f.scene.pointers??{})));
  for(const f of framesFor(452))assert.ok(!('arrows'in(f.scene.rowPointers??{}))&&!('end'in(f.scene.rowPointers??{})));
  for(const f of framesFor(392)){
    if('j'in f.vars)assert.equal(f.scene.pointers.j,f.vars.j);
    assert.equal(f.scene.secondaryPointers.i,f.vars.i);
  }
  for(const f of framesFor(6).filter(f=>f.scene.kind==='array')){
    assert.equal(f.scene.pointers.row,f.vars.row);
    if('i'in f.vars)assert.equal(f.scene.secondaryPointers.i,f.vars.i);
    assert.ok(!('i'in f.scene.pointers));
  }
});
test('区间扫描和栈输入游标保留真实变量身份',()=>{
  assert.ok(framesFor(57).some(f=>f.scene.rowPointers?.i===f.vars.i&&Number.isInteger(f.vars.i)));
  for(const id of[20,224])for(const f of framesFor(id).filter(f=>'i'in f.vars)){
    assert.equal(f.scene.secondaryPointers.i,f.vars.i);
    assert.ok('c'in f.vars&&!('char'in f.vars));
  }
  for(const f of framesFor(219).filter(f=>Number.isInteger(f.vars.j)))assert.equal(f.scene.pointers.j,f.vars.j);
});
test('全部 50 题的英文状态名来自 Go，所有可视游标与状态数值一致',()=>{
  for(const lesson of lessonsA)for(const f of framesFor(lesson.id)){
    for(const name of Object.keys(f.vars))if(/^[A-Za-z_]\w*$/.test(name)){
      assert.ok(new RegExp(`\\b${name}\\b`).test(lesson.code),`${lesson.id} ${name} 不是 Go 变量，请用中文说明派生状态`);
    }
    for(const field of['pointers','secondaryPointers','rowPointers'])for(const[name,index]of Object.entries(f.scene[field]??{})){
      assert.ok(Number.isInteger(index),`${lesson.id} ${name} 不是整数下标`);
      assert.equal(index,f.vars[name],`${lesson.id} ${name} 的位置与变量值不同`);
    }
  }
});
