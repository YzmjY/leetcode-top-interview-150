import test from 'node:test';
import assert from 'node:assert/strict';
import {lessonsB} from '../src/lessons-b.js';
import {lessonsC} from '../src/lessons-c.js';
import {traceLesson} from '../src/lesson-kit.js';
import {getPointerMeaning} from '../src/pointer-meanings.js';

const linkedLessonIds=[2,19,21,23,25,61,82,86,92,138,141,146,148];
const lessons=[...lessonsB,...lessonsC];
const fallback='代码中的指针';

test('分组反转区分组前驱、反转前驱和暂存后继',()=>{
  assert.equal(getPointerMeaning(25,'pre'),'本组前驱');
  assert.equal(getPointerMeaning(25,'prev'),'反转时的前驱');
  assert.equal(getPointerMeaning(25,'next'),'暂存原后继');
  assert.equal(getPointerMeaning(25,'end'),'组尾探查指针');
  assert.equal(getPointerMeaning(19,'fast'),'先行指针');
});

test('同名指针按具体题目的代码含义解释',()=>{
  assert.equal(getPointerMeaning(25,'head'),'原链头');
  assert.equal(getPointerMeaning(86,'head'),'当前待分区节点');
  assert.equal(getPointerMeaning(148,'head'),'本次递归子链的原头');
  assert.equal(getPointerMeaning(61,'tail'),'原链尾');
  assert.equal(getPointerMeaning(21,'tail'),'结果接入尾');
  assert.equal(getPointerMeaning(146,'c.head'),'最近端哨兵');
});

test('未知题目和未知变量仅返回通用含义，不猜测用途',()=>{
  assert.equal(getPointerMeaning(999,'head'),fallback);
  assert.equal(getPointerMeaning(25,'unknown'),fallback);
  assert.equal(getPointerMeaning(25,'toString'),fallback);
  assert.equal(getPointerMeaning('__proto__','toString'),fallback);
});

for(const id of linkedLessonIds){
  test(`题目${id}默认与内置用例中的每个指针均有显式中文解释`,()=>{
    const lesson=lessons.find(l=>l.id===id);
    assert.ok(lesson,`题目${id}必须存在`);
    const names=new Set();
    for(const {input} of [{input:lesson.input},...lesson.cases]){
      const trace=traceLesson(lesson,input);
      for(const {scene} of trace.frames){
        assert.equal(scene.kind,'linked');
        for(const name of Object.keys(scene.pointers??{})){
          names.add(name);
          const meaning=getPointerMeaning(id,name);
          assert.equal(typeof meaning,'string');
          assert.notEqual(meaning,fallback,`题目${id}的${name}需要显式解释`);
          assert.match(meaning,/[\u4e00-\u9fff]/);
        }
      }
    }
    assert.ok(names.size>0,`题目${id}必须实际核查指针`);
  });
}
