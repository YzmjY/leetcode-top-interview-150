import test from 'node:test';
import assert from 'node:assert/strict';
import {lessonsA} from '../src/lessons-a.js';
import {traceLesson} from '../src/lesson-kit.js';

const lesson=id=>lessonsA.find(item=>item.id===id);
const frames=id=>traceLesson(lesson(id),lesson(id).input).frames;

test('跳跃范围可以继续扩张，不把尚未覆盖的下标声称为已排除',()=>{
  const trace=frames(55),first=trace[1].scene,next=trace[2].scene;
  assert.deepEqual(first.range,[0,2]);
  assert.deepEqual(next.range,[0,4]);
  assert.match(first.rangeLabel,/可达/);
  assert.match(first.rangeNote,/尚未|未覆盖/);
  assert.doesNotMatch(first.rangeLabel+first.rangeNote,/已排除/);
  const layer=frames(45)[1].scene;
  assert.deepEqual(layer.range,[0,2]);
  assert.match(layer.rangeLabel,/当前跳跃次数.*覆盖/);
});

test('滑动窗口的说明对应当前左右端点，而不是永久排除窗口外的字符',()=>{
  for(const id of [209,3,76]){
    const scene=frames(id)[1].scene;
    assert.deepEqual(scene.range,[0,0],String(id));
    assert.match(scene.rangeLabel,/窗口/,String(id));
    assert.doesNotMatch(scene.rangeLabel+scene.rangeNote,/已排除/,String(id));
  }
});

test('串联单词重置后高亮的是非法单词，不伪装成left到right的有效窗口',()=>{
  const trace=frames(30),valid=trace[2],reset=trace[3];
  assert.deepEqual(valid.scene.range,[0,5]);
  assert.match(valid.scene.rangeLabel,/窗口/);
  assert.equal(reset.vars.left,9);
  assert.equal(reset.vars.right,6);
  assert.deepEqual(reset.scene.range,[6,8]);
  assert.match(reset.scene.rangeLabel,/非法单词/);
  assert.match(reset.scene.rangeNote,/重置|空窗口/);
});

test('字符串匹配和区间压缩明确区分已匹配部分与当前连续段',()=>{
  const matched=frames(28)[1].scene;
  assert.deepEqual(matched.range,[0,0]);
  assert.match(matched.rangeLabel,/已匹配/);
  assert.doesNotMatch(matched.rangeLabel+matched.rangeNote,/已排除/);
  const segment=frames(228)[3].scene;
  assert.deepEqual(segment.range,[0,2]);
  assert.match(segment.rangeLabel,/连续.*(?:段|区间)/);
  assert.doesNotMatch(segment.rangeLabel+segment.rangeNote,/已排除/);
});

test('排版使用当前行的单词范围，盛水使用当前容器边界',()=>{
  const line=frames(68)[3].scene;
  assert.deepEqual(line.range,[0,2]);
  assert.match(line.rangeLabel,/当前行.*单词/);
  assert.match(line.rangeNote,/right.*下一|right.*不包含/);
  const container=frames(11)[2].scene;
  assert.deepEqual(container.range,[1,8]);
  assert.match(container.rangeLabel,/容器|左右.*边界/);
});

test('所有内置A组范围帧都提供自己的范围含义',()=>{
  let checked=0;
  for(const item of lessonsA)for(const input of [item.input,...item.cases.map(c=>c.input)]){
    for(const frame of traceLesson(item,input).frames){
      if(!frame.scene.range)continue;
      checked++;
      assert.equal(typeof frame.scene.rangeLabel,'string',`题${item.id}：${frame.title}`);
      assert.ok(frame.scene.rangeLabel.length>0,`题${item.id}：${frame.title}`);
      assert.equal(typeof frame.scene.rangeNote,'string',`题${item.id}：${frame.title}`);
    }
  }
  assert.ok(checked>100);
});
