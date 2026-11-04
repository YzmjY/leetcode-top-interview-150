import test from 'node:test';
import assert from 'node:assert/strict';
import {lessons,getLesson} from '../src/lessons.js';
import {catalog} from '../src/catalog-data.js';
import {traceLesson} from '../src/lesson-kit.js';
import {renderScene} from '../src/scenes.js';

test('官方题单150题和23个分组完整且无重复',()=>{
 assert.equal(catalog.length,150);assert.equal(new Set(catalog.map(p=>p.id)).size,150);assert.equal(new Set(catalog.map(p=>p.category)).size,23);assert.equal(catalog[0].id,88);assert.equal(catalog.at(-1).id,221);
});
test('每题有独立实现和完整的基础教学内容',()=>{
 assert.equal(lessons.length,150);
 for(const lesson of lessons){
  assert.equal(typeof lesson.solve,'function',`${lesson.id} 缺少实现`);
  assert.ok(lesson.summary?.length>=8,`${lesson.id} 缺少题干`);assert.ok(lesson.rule?.length>=6,`${lesson.id} 缺少规则`);
  assert.ok(lesson.steps?.length>=1,`${lesson.id} 策略不完整`);
  for(const step of lesson.steps)assert.ok(step.title&&step.body,`${lesson.id} 策略内容缺失`);
  assert.ok(lesson.time&&lesson.space,`${lesson.id} 缺少复杂度`);
  assert.ok(lesson.code?.length,`${lesson.id} 缺少Go代码`);
 }
});
for(const meta of catalog)test(`${meta.ordinal}. ${meta.id} ${meta.title}：默认例及全部帧可呈现`,()=>{
 const lesson=getLesson(meta.id);const input=structuredClone(lesson.input);const {frames,result}=traceLesson(lesson,input);
 assert.deepEqual(result,lesson.expected);assert.deepEqual(input,lesson.input,'运行不得改变用户原始输入');assert.ok(frames.length>=2);
 for(const f of frames){assert.ok(f.scene?.kind);assert.doesNotThrow(()=>renderScene(f.scene));assert.ok(f.lines.length>0);}
 assert.equal(frames.at(-1).phase,'done');assert.deepEqual(frames.at(-1).result,result);
});
