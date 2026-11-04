import test from 'node:test';
import assert from 'node:assert/strict';
import {catalog} from '../src/catalog-data.js';
import {lessons} from '../src/lessons.js';
import {getReasoning} from '../src/reasoning.js';

const explanation = id => {
  const lesson = lessons.find(item => item.id === id);
  assert.ok(lesson, `lesson ${id} exists`);
  return getReasoning(lesson);
};
const allText = id => {
  const {principle, invariant, boundaries} = explanation(id);
  return [principle, invariant, ...boundaries.flatMap(item => [item.title, item.body])].join('\n');
};

test('all 150 catalog lessons have explicit, substantial and distinct reasoning', () => {
  assert.equal(catalog.length, 150);
  assert.equal(lessons.length, 150);
  const principles = new Set();
  for (const lesson of lessons) {
    const result = getReasoning(lesson);
    assert.ok(result, `missing reasoning for ${lesson.id} ${lesson.title}`);
    assert.equal(typeof result.principle, 'string');
    assert.ok(result.principle.length >= 45, `${lesson.id}: principle must explain why`);
    assert.match(result.principle, /[\u4e00-\u9fff]/);
    assert.ok(result.invariant?.length >= 15, `${lesson.id}: concrete state or invariant`);
    assert.ok(Array.isArray(result.boundaries) && result.boundaries.length >= 2, `${lesson.id}: two boundaries`);
    assert.equal(new Set(result.boundaries.map(item => item.title)).size, result.boundaries.length);
    for (const item of result.boundaries) {
      assert.ok(item.title.length >= 2, `${lesson.id}: boundary title`);
      assert.ok(item.body.length >= 25, `${lesson.id}: explain boundary handling`);
    }
    assert.ok(!principles.has(result.principle), `${lesson.id}: no shared generic principle`);
    principles.add(result.principle);
    assert.ok(!lesson.steps.some(step => step.body === result.principle), `${lesson.id}: do not duplicate a step`);
  }
});

test('lookup does not silently fabricate reasoning for unknown lessons', () => {
  assert.equal(getReasoning({id:999999}), null);
  assert.equal(getReasoning(null), null);
  assert.equal(getReasoning({id:"toString"}), null);
  assert.equal(getReasoning({id:"__proto__"}), null);
  assert.deepEqual(getReasoning(124), getReasoning({id:124}));
});

test('124 distinguishes a complete path from the one-branch parent contribution', () => {
  const value = explanation(124);
  assert.match(value.principle, /向父节点返回.*只能选一侧/);
  assert.match(value.principle, /n\.Val\+l\+r/);
  assert.match(value.principle, /负贡献取 0/);
  assert.match(value.invariant, /初始化为 root\.Val/);
  const boundaries = value.boundaries.map(item => item.body).join(' ');
  assert.match(boundaries, /best 不能默认 0/);
  assert.match(boundaries, /\[-3\].*-3/);
  assert.match(boundaries, /空树不在.*非空约束/);
  assert.match(boundaries, /max\(2,3\)/);
});

test('binary search intervals and endpoint updates match the displayed Go', () => {
  for (const id of [35,34]) assert.match(allText(id), /左闭右开/);
  for (const id of [74,162,33,153]) assert.match(allText(id), /闭区间/);
  assert.match(allText(35), /hi=mid/);
  assert.match(allText(34), /第一个>target/);
  assert.match(allText(162), /mid\+1 安全/);
  assert.match(allText(153), /不能写 hi=mid-1/);
  assert.match(allText(4), /al>br.*hi=i-1/);
  assert.match(allText(69), /m≤x\/m/);
  assert.match(allText(69), /mid≥1/);
});

test('DP states distinguish prefixes, fixed endpoints and nonempty selections', () => {
  assert.match(explanation(53).invariant, /必须以当前元素结尾/);
  assert.match(allText(53), /从 nums\[0\] 初始化/);
  assert.match(allText(918), /对应空集.*非法/);
  assert.match(explanation(198).invariant, /前 i 间/);
  assert.match(explanation(139).invariant, /dp\[0\]=true/);
  assert.match(allText(322), /不可达初始 amount\+1/);
  assert.match(explanation(300).invariant, /必须以第 i 个元素结尾/);
  assert.match(allText(70), /dp\[0\]=1/);
});

test('multidimensional DP describes initialization, dependency direction and return meaning', () => {
  assert.match(allText(120), /底行.*初始化.*自底向上/);
  assert.match(allText(64), /缺失来源不参与最小值/);
  assert.match(allText(63), /先检查障碍再初始化起点/);
  assert.match(allText(5), /长度递增/);
  assert.match(explanation(97).invariant, /s3\[:i\+j\]/);
  assert.match(explanation(72).invariant, /dp\[i\]\[0\]=i.*dp\[0\]\[j\]=j/);
  assert.match(allText(221), /左上/);
  assert.match(allText(221), /best\*best 而非边长/);
});

test('stock stage DP means at most k trades and reads the previous day', () => {
  for (const id of [123,188]) {
    assert.match(allText(id), /持股.*负无穷/);
    assert.match(allText(id), /前一天/);
    assert.match(allText(id), /空仓/);
    assert.match(allText(id), /至多/);
    assert.match(allText(id), /64 位 int/);
  }
  assert.match(allText(188), /k=0/);
});

test('linked structures explain node identity, null handling and legal index ranges', () => {
  assert.match(allText(141), /指针而非 Val/);
  assert.match(allText(138), /不能用节点值作键/);
  assert.match(allText(236), /身份.*位置 ID/);
  assert.match(allText(19), /1≤n≤长度/);
  assert.match(allText(25), /不足 k/);
  assert.match(allText(86), /保存 next 再断开/);
  assert.match(allText(21), /不共享节点/);
});

test('graph explanations cover cycles, separate components and unknown variables', () => {
  assert.match(allText(133), /先登记副本再递归/);
  assert.match(allText(133), /可达分量/);
  assert.match(allText(399), /未出现 x\/x.*-1/);
  assert.match(allText(399), /不同分量/);
  for (const id of [207,210]) {
    assert.match(allText(id), /不连通/);
    assert.match(allText(id), /环/);
  }
  assert.match(allText(909), /跳一次/);
  assert.match(allText(127), /边数加 1/);
});

test('numeric explanations preserve bit width, signed interpretation and overflow qualifications', () => {
  assert.match(allText(190), /固定执行 32 轮/);
  assert.match(allText(190), /uint32/);
  assert.match(allText(137), /int32\(ans\)/);
  assert.match(allText(137), /负号/);
  assert.match(allText(201), /0≤left≤right≤2³¹-1/);
  assert.match(allText(50), /先转 int64 再取负/);
  assert.match(allText(149), /重复坐标.*除零/);
  assert.match(allText(452), /比较而非相减/);
});

test('assumptions are not replaced with unsupported generic empty-input promises', () => {
  assert.match(allText(169), /非空且确实存在/);
  assert.match(allText(45), /保证终点可达/);
  assert.match(allText(79), /要求非空矩形及非空单词/);
  assert.match(allText(222), /必须检查完全性/);
  assert.match(allText(149), /官方点坐标互异/);
  assert.match(allText(380), /getRandom 只允许在非空集合/);
});
