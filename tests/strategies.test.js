import test from 'node:test';
import assert from 'node:assert/strict';
import {lessons, getLesson} from '../src/lessons.js';
import {getStrategy} from '../src/strategies.js';

const layouts = new Set(['insight', 'flow', 'vertical', 'decision', 'recurrence', 'comparison']);
const text = value => typeof value === 'string' && value.trim().length > 0;
const strategy = id => getStrategy(getLesson(id));

test('字符矩阵的正方形转移与Go的字符常量一致',()=>assert.match(strategy(221).formula,/matrix\[r-1\]\[c-1\] == '1'/));

test('all 150 lessons have complete algorithm-specific strategies', () => {
  assert.equal(lessons.length, 150);
  for (const lesson of lessons) {
    const profile = getStrategy(lesson);
    assert.ok(layouts.has(profile.layout), `${lesson.id}: supported layout`);
    assert.ok(text(profile.lead), `${lesson.id}: explains the main idea`);
    assert.ok(profile.steps.length >= 1 && profile.steps.length <= 5, `${lesson.id}: natural step count`);
    for (const step of profile.steps) {
      assert.ok(text(step.title), `${lesson.id}: step title`);
      assert.ok(text(step.body), `${lesson.id}: step explanation`);
    }
    for (const key of ['formula', 'note', 'visual']) {
      if (key in profile) assert.ok(text(profile[key]), `${lesson.id}: nonempty ${key}`);
    }
    if (profile.layout === 'comparison') assert.equal(profile.steps.length, 2, `${lesson.id}: two sides`);
    if (['flow', 'vertical'].includes(profile.layout)) assert.ok(profile.steps.length >= 2);
    if (profile.layout === 'insight') assert.equal(profile.steps.length, 1, `${lesson.id}: one core observation`);
    if (profile.layout === 'recurrence') {
      assert.ok(text(profile.formula), `${lesson.id}: a real recurrence`);
      assert.ok(profile.steps.length >= 3, `${lesson.id}: state, transition, evaluation`);
    }
    if (profile.layout === 'decision') assert.ok(profile.branches.length >= 2, `${lesson.id}: actual branches`);
    for (const branch of profile.branches ?? []) {
      for (const key of ['condition', 'title', 'body']) assert.ok(text(branch[key]), `${lesson.id}: branch ${key}`);
    }
  }
});

test('presentation varies with the algorithm and most lessons do not have three steps', () => {
  const profiles = lessons.map(getStrategy);
  assert.deepEqual(new Set(profiles.map(p => p.layout)), layouts);
  assert.deepEqual(new Set(profiles.map(p => p.steps.length)), new Set([1, 2, 3, 4, 5]));
  assert.ok(profiles.filter(p => p.steps.length !== 3).length > 75);
  assert.ok(profiles.filter(p => p.layout === 'flow' && p.steps.length === 3).length < 30);
  assert.equal(strategy(191).layout, 'insight');
  assert.equal(strategy(48).steps.length, 2);
  assert.equal(strategy(54).steps.length, 5);
  for (const id of [19, 25, 92, 105, 106, 130, 207, 210, 212]) assert.equal(strategy(id).layout, 'vertical');
});

test('peak search shows the two slopes, preserves mid on descent, and converges', () => {
  const peak = strategy(162);
  assert.equal(peak.layout, 'decision');
  assert.equal(peak.steps.length, 1);
  assert.equal(peak.branches.length, 2);
  assert.match(peak.branches[0].condition, /nums\[mid\] < nums\[mid\+1\]/);
  assert.match(peak.branches[0].body, /lo = mid \+ 1/);
  assert.match(peak.branches[1].body, /hi = mid/);
  assert.match(peak.steps[0].body, /lo == hi/);
  assert.match(peak.note, /相邻.*不相等/);
});

test('all DP formulas describe the state used by the existing implementation', () => {
  const expected = new Map([
    [53, /end = max\(nums\[i\], end \+ nums\[i\]\)/],
    [918, /total - worst/],
    [70, /dp\[i\] = dp\[i-1\] \+ dp\[i-2\]/],
    [198, /dp\[i\+1\] = max\(dp\[i\], nums\[i\] \+ \(i > 0 \? dp\[i-1\] : 0\)\)/],
    [139, /dp\[j\] && s\[j:i\]/],
    [322, /dp\[a-coin\] \+ 1/],
    [300, /nums\[j\] < nums\[i\]/],
    [120, /triangle\[r\]\[c\] \+ min\(dp\[r\+1\]\[c\], dp\[r\+1\]\[c\+1\]\)/],
    [64, /grid\[r\]\[c\] \+ min\(dp\[r-1\]\[c\], dp\[r\]\[c-1\]\)/],
    [63, /障碍.*dp\[r\]\[c\] = 0/],
    [5, /s\[l\] == s\[r\] && \(r-l <= 1 \|\| dp\[l\+1\]\[r-1\]\)/],
    [97, /s1\[i-1\] == s3\[i\+j-1\]/],
    [72, /1 \+ min\(dp\[i-1\]\[j-1\], dp\[i-1\]\[j\], dp\[i\]\[j-1\]\)/],
    [123, /dp\[day\+1\]\[s\] = max\(dp\[day\]\[s\], dp\[day\]\[s-1\] \+ delta\)/],
    [188, /dp\[day\+1\]\[s\] = max\(dp\[day\]\[s\], dp\[day\]\[s-1\] \+ delta\)/],
    [221, /1 \+ min\(dp\[r-1\]\[c\], dp\[r\]\[c-1\], dp\[r-1\]\[c-1\]\)/],
  ]);
  for (const [id, formula] of expected) {
    const profile = strategy(id);
    assert.equal(profile.layout, 'recurrence', `${id}: exposes DP reasoning`);
    assert.match(profile.formula, formula, `${id}: correct transition`);
    assert.match(profile.steps[0].body, /表示|定义|必须|状态/, `${id}: defines the state`);
  }
  assert.match(strategy(300).note, /O\(n²\)/);
  assert.match(strategy(918).note, /全负/);
  assert.match(strategy(123).lead, /2/);
  assert.match(strategy(188).lead, /k/);
  assert.match(strategy(97).note, /长度/);
});

test('invariants and boundaries are preserved in condensed strategies', () => {
  assert.match(strategy(80).formula, /nums\[write-2\]/);
  assert.match(strategy(34).formula, /bound\(true\) - 1/);
  assert.match(strategy(124).formula, /max\(l, r\)/);
  assert.match(strategy(124).note, /全负/);
  assert.match(strategy(207).note, /受环阻塞/);
  assert.match(strategy(103).steps.map(s => s.body).join(''), /size-1-j/);
  assert.match(strategy(133).steps[0].body, /递归.*之前|先.*登记/);
  assert.match(strategy(137).note, /int32|有符号/);
});

test('explanations use Go identifiers and method/field casing across all 150 lessons', () => {
  const terminology = new Set(['O', 'max', 'min', 'true', 'false', 'nil', 'Go', 'BFS', 'Trie', 'Kadane', 'Z', 'IV', 'A', 'B', 'AB', 'BA']);
  for (const lesson of lessons) {
    const p = getStrategy(lesson);
    const code = Array.isArray(lesson.code) ? lesson.code.join('\n') : lesson.code;
    const identifiers = new Set(code.match(/[A-Za-z_][A-Za-z_0-9]*/g));
    const prose = [p.lead, p.formula, p.note, ...p.steps.flatMap(s => [s.title, s.body]),
      ...(p.branches ?? []).flatMap(b => [b.condition, b.title, b.body])].join(' ');
    for (const name of new Set(prose.match(/[A-Za-z_][A-Za-z_0-9]*/g))) {
      // n is a mathematical input-size symbol in LIS's O(n²), not a local variable.
      assert.ok(identifiers.has(name) || terminology.has(name) || (lesson.id === 300 && name === 'n'),
        `${lesson.id}: ${name} is not a variable, method, or field in the Go solution`);
    }
  }
  assert.match(strategy(124).formula, /n\.Val/);
  assert.match(strategy(129).formula, /value = value.*n\.Val/);
  assert.match(strategy(201).formula, /left << shift/);
  assert.match(strategy(295).formula, /-m\.low\[0\]/);
  assert.match(strategy(222).branches[0].condition, /l == r/);
});

test('selected problems request drawings with specific explanatory purposes', () => {
  assert.equal(strategy(162).visual, 'binary-slope');
  assert.equal(strategy(124).visual, 'tree-gain');
  assert.equal(strategy(88).visual, 'reverse-merge');
  assert.equal(strategy(42).visual, 'water-level');
  assert.equal(strategy(76).visual, 'window-cover');
  assert.equal(strategy(200).visual, 'grid-components');
  assert.equal(strategy(207).visual, 'topological');
  assert.equal(strategy(72).visual, 'edit-grid');
  assert.equal(strategy(146).visual, 'lru-order');
  assert.ok(lessons.filter(lesson => getStrategy(lesson).visual).length < 75);
});

test('strategies are independent of input difficulty and callers cannot mutate shared content', () => {
  const lesson = getLesson(162);
  const before = structuredClone(lesson.steps);
  const profile = getStrategy({...lesson, difficulty: '另一个难度'});
  assert.deepEqual(profile, getStrategy(lesson));
  profile.steps[0].title = 'changed';
  profile.branches[0].body = 'changed';
  assert.notEqual(getStrategy(lesson).steps[0].title, 'changed');
  assert.notEqual(getStrategy(lesson).branches[0].body, 'changed');
  assert.deepEqual(lesson.steps, before);
});
