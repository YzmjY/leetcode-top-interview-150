import test from 'node:test';
import assert from 'node:assert/strict';
import {traceLesson} from '../src/lesson-kit.js';
const loaded = await import('../src/lessons-c.js').catch(()=>({lessonsC:[]}));
const lessons = loaded.lessonsC;
const ids = [17,77,46,39,52,22,79,108,148,427,23,53,918,35,74,162,33,34,153,4,215,502,373,295,67,190,191,136,137,201,9,66,172,69,50,149,70,198,139,322,300,120,64,63,5,97,72,123,188,221];
test('全部50道题具有可执行课程',()=>assert.deepEqual(lessons.map(x=>x.id),ids));
for(const id of ids) test(`题目 ${id} 的示例、边界与动态过程`,()=>{
  const lesson=lessons.find(x=>x.id===id); assert.ok(lesson,`缺少 ${id}`);
  assert.equal(lesson.steps.length,3); assert.ok(lesson.summary&&lesson.rule&&lesson.time&&lesson.space);
  assert.ok(lesson.cases.length>=2); assert.equal(typeof lesson.validate,'function');
  const lines=Array.isArray(lesson.code)?lesson.code:lesson.code.split('\n');
  for(const example of [{input:lesson.input,expected:lesson.expected},...lesson.cases]){
    const {result,frames}=traceLesson(lesson,example.input);
    assert.deepEqual(result,example.expected); assert.ok(frames.length>=2);
    for(const frame of frames){assert.ok(frame.scene.kind);assert.ok(frame.lines.length);assert.ok(frame.lines.every(n=>n>=1&&n<=lines.length));}
  }
  const {frames}=traceLesson(lesson,lesson.input);
  assert.ok(frames.length>2,'默认例须包含多个真实计算步骤');
  assert.ok(new Set(frames.map(f=>JSON.stringify(f.scene))).size>1,'快照必须随算法更新');
  if([67,190,191,136,137,201].includes(id))assert.ok(frames.some(f=>f.scene.kind==='bits'));
  if([52,79,427,74,120,64,63,5,97,72,221].includes(id))assert.ok(frames.some(f=>f.scene.kind==='matrix'));
  if([70,198,139,322,300,123,188].includes(id))assert.ok(frames.some(f=>f.scene.kind==='table'));
});
test('回溯与DP拒绝超过演示预算的输入',()=>{
  for(const [id,input] of [[46,{nums:[1,2,3,4,5,6,7,8]}],[22,{n:10}],[52,{n:12}],[322,{coins:[1],amount:10000}],[72,{word1:'a'.repeat(100),word2:'b'.repeat(100)}]]){
    const lesson=lessons.find(x=>x.id===id);assert.ok(lesson);assert.throws(()=>traceLesson(lesson,input));
  }
});
test('单词搜索在重复字符产生大量分支时主动停止',()=>{
  const lesson=lessons.find(x=>x.id===79);
  assert.throws(()=>traceLesson(lesson,{board:Array.from({length:4},()=>Array(4).fill('A')),word:'AAAAAAAB'}),/搜索分支/);
});
test('单词搜索仅允许Go单字节英文字符，拒绝多字节及非字母',()=>{
  for(const input of [{board:[['é']],word:'é'},{board:[['中']],word:'A'},{board:[['A']],word:'é'},{board:[['1']],word:'1'}]){
    assert.throws(()=>lessonTrace(79,input),/英文字母/);
  }
});
test('边界状态验证符号、全负数、无法解锁项目与有限交易次数',()=>{
  const fixtures=[
    [201,{left:2147483646,right:2147483647},2147483646],
    [190,{n:1},2147483648],
    [137,{nums:[-1,5,5,5]},-1],
    [4,{nums1:[-5,-3],nums2:[-4,-2]},-3.5],
    [918,{nums:[-5]},-5],
    [502,{k:3,w:1,profits:[0,9],capital:[1,2]},1],
    [373,{nums1:[-2,0],nums2:[-1,3],k:9},[[-2,-1],[0,-1],[-2,3],[0,3]]],
    [188,{k:1,prices:[3,2,6,5,0,3]},4],
    [123,{prices:[1,2,3,4,5]},4],
    [79,{board:[['A','B'],['B','C']],word:'ABC'},true],
    [63,{obstacleGrid:[[0,0],[0,1]]},0],
    [97,{s1:'',s2:'abc',s3:'abc'},true],
    [322,{coins:[2,4],amount:7},-1],
    [149,{points:[[1,1],[2,1],[3,1],[4,2]]},3]
  ];
  for(const [id,input,expected] of fixtures)assert.deepEqual(traceLesson(lessons.find(x=>x.id===id),input).result,expected,`题目${id}`);
});
const lessonTrace=(id,input)=>{const lesson=lessons.find(x=>x.id===id);return traceLesson(lesson,input??lesson.input);};
test('数组二分比较帧展示与Go同名的lo、mid、hi和候选区间',()=>{
  for(const id of [35,162,33,34,153]){
    const frames=lessonTrace(id).frames.filter(f=>f.phase==='step'&&Number.isInteger(f.vars.mid));
    assert.ok(frames.length,`题目${id}须暴露mid`);
    for(const frame of frames){
      const {lo,mid,hi}=frame.vars;
      assert.deepEqual(frame.scene.pointers,{lo,mid,hi},`题目${id}指针须精确对应当前Go变量`);
      assert.deepEqual(frame.scene.range,[lo,[35,34].includes(id)?hi-1:hi]);
      assert.equal(mid,Math.floor((lo+hi)/2));
    }
  }
});
test('峰值与旋转最小值完成帧仍显示收敛的lo、hi',()=>{
  for(const [id,input,index] of [[162,{nums:[1,2,1,3,5,6,4]},5],[153,{nums:[3,4,5,1,2]},3],[162,{nums:[7]},0],[153,{nums:[7]},0]]){
    const {frames}=lessonTrace(id,input),last=frames.at(-1);
    assert.deepEqual(last.scene.pointers,{lo:index,hi:index});
    assert.deepEqual(last.scene.range,[index,index]);
    assert.equal(last.vars.lo,index);assert.equal(last.vars.hi,index);
  }
});
test('右开区间保留hi=n边界；插入点和失败区间不伪装为有效元素',()=>{
  const {frames,result}=lessonTrace(35,{nums:[1,3],target:5});
  assert.equal(result,2);assert.equal(frames[0].scene.pointers.hi,2);
  assert.deepEqual(frames.at(-1).scene.pointers,{lo:2,hi:2});
  assert.deepEqual(frames.at(-1).scene.range,[2,1]);
  const failed=lessonTrace(33,{nums:[1],target:0}).frames.at(-1);
  assert.deepEqual(failed.scene.pointers,{lo:1,hi:0});
  assert.deepEqual(failed.scene.range,[1,0]);
});
test('矩阵二分显示虚拟索引和对应单元格，候选区间随搜索缩小',()=>{
  const {frames}=lessonTrace(74),width=4;
  const steps=frames.filter(f=>f.phase==='step'&&Number.isInteger(f.vars.mid));
  assert.ok(steps.length>1);
  for(const frame of steps){
    const {lo,mid,hi,row,col}=frame.vars;
    assert.equal(row,Math.floor(mid/width));assert.equal(col,mid%width);
    assert.deepEqual(frame.scene.range,[lo,hi]);
    for(const [name,index] of Object.entries({lo,mid,hi}))assert.deepEqual(frame.scene.cellPointers[name],[Math.floor(index/width),index%width]);
    assert.equal(frame.scene.rangeCells.length,hi-lo+1);
  }
});
test('双数组中位数以a的i和b的j显示划分，并保留lo、hi',()=>{
  const {frames}=lessonTrace(4,{nums1:[1,2],nums2:[3,4]});
  const steps=frames.filter(f=>f.phase==='step');assert.ok(steps.length>1);
  for(const frame of steps){
    const {lo,hi,i,j}=frame.vars;
    assert.equal(frame.scene.kind,'array');assert.equal(frame.scene.label,'a');assert.equal(frame.scene.secondaryLabel,'b');
    assert.deepEqual(frame.scene.pointers,{lo,i,hi});assert.deepEqual(frame.scene.secondaryPointers,{j});
    assert.deepEqual(frame.scene.range,[lo,hi]);assert.equal(i+j,2);
  }
  assert.equal(frames.at(-1).scene.pointers.i,2,'划分可指向数组末尾边界');
});
test('数组循环与DP单元格明确标记真实下标及前驱，标量面额不充当指针',()=>{
  for(const id of [53,918,66]){
    const frame=lessonTrace(id).frames.find(f=>f.phase==='step'&&Number.isInteger(f.vars.i));
    assert.ok(frame,`题目${id}须暴露i`);assert.equal(frame.scene.pointers.i,frame.vars.i);
  }
  for(const [id,key] of [[70,'i'],[198,'i'],[139,'i'],[322,'a'],[300,'i']]){
    const frame=lessonTrace(id).frames.find(f=>f.phase==='step'&&Number.isInteger(f.vars[key]));
    assert.ok(frame,`题目${id}须暴露${key}`);assert.equal(frame.scene.rowPointers[key],frame.vars[key]);
    assert.deepEqual(frame.scene.cellPointers[key],[frame.vars[key],1]);
    assert.equal(frame.scene.rowPointers.coin,undefined);
  }
  for(const id of [120,64,63,5,97,72,221]){
    const frame=lessonTrace(id).frames.find(f=>f.phase==='step'&&Object.keys(f.scene.cellPointers??{}).length);
    assert.ok(frame,`题目${id}须标记当前DP格及前驱`);
    assert.ok(Object.keys(frame.scene.cellPointers).some(k=>k.startsWith('dp[')));
  }
  for(const id of [123,188]){
    const frame=lessonTrace(id).frames.find(f=>f.phase==='step'&&Number.isInteger(f.vars.s));
    assert.equal(frame.vars.day,0);assert.equal(frame.vars.s,1);
    assert.deepEqual(frame.scene.cellPointers['dp[day+1][s]'],[1,2]);
    assert.deepEqual(frame.scene.cellPointers['dp[day][s-1]'],[0,1]);
  }
});
test('代表性二分轨迹精确保留每轮边界，避免标签比计算提前或落后一步',()=>{
  for(const [id,expected] of [
    [35,[[0,2,4],[0,1,2]]],
    [162,[[0,3,6],[4,5,6],[4,4,5]]],
    [153,[[0,2,4],[3,3,4]]]
  ]){
    const trace=lessonTrace(id);
    assert.deepEqual(trace.frames.filter(f=>f.phase==='step'&&Number.isInteger(f.vars.mid)).map(f=>[f.vars.lo,f.vars.mid,f.vars.hi]),expected);
  }
  const matrixSteps=lessonTrace(74).frames.filter(f=>f.phase==='step'&&Number.isInteger(f.vars.mid));
  assert.deepEqual(matrixSteps.map(f=>[f.vars.lo,f.vars.mid,f.vars.hi]),[[0,5,11],[0,2,4],[0,0,1],[1,1,1]]);
});
test('所有矩阵与表格的标记坐标有效，并与Go下标表达式一致',()=>{
  for(const lesson of lessons){
    const compact=lesson.code.replace(/\s/g,'');
    for(const {scene,vars} of lessonTrace(lesson.id).frames){
      if(!['matrix','table'].includes(scene.kind))continue;
      const rows=scene.kind==='matrix'?scene.matrix:scene.rows;
      for(const [name,[r,c]] of Object.entries(scene.cellPointers??{})){
        assert.ok(Number.isInteger(r)&&r>=0&&r<rows.length,`题目${lesson.id} ${name}行坐标`);
        assert.ok(Number.isInteger(c)&&c>=0&&c<rows[r].length,`题目${lesson.id} ${name}列坐标`);
        if(name.startsWith('dp[')||name.startsWith('board['))assert.ok(compact.includes(name),`题目${lesson.id} Go中缺少下标表达式${name}`);
      }
      for(const [name,index] of Object.entries(scene.rowPointers??{}))if(Object.hasOwn(vars,name))assert.equal(index,vars[name],`题目${lesson.id} ${name}行变量不同步`);
      for(const [name,index] of Object.entries(scene.colPointers??{}))if(Object.hasOwn(vars,name))assert.equal(index,vars[name],`题目${lesson.id} ${name}列变量不同步`);
    }
  }
});
test('C包装器把原始Go语句传给emit以支持格式化后的高亮映射',()=>{
  for(const lesson of lessons){
    let count=0;
    lesson.solve(structuredClone(lesson.input),(_scene,_title,_description,lines,_vars,anchor)=>{
      count++;assert.equal(typeof anchor,'string');assert.ok(anchor.length);
      assert.ok(lesson.code.split('\n')[lines[0]-1].includes(anchor));
    });
    assert.ok(count>0,`题目${lesson.id}必须产生高亮锚点`);
  }
});
