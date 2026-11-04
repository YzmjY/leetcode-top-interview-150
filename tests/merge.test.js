import test from 'node:test';
import assert from 'node:assert/strict';

const modulePromise = import('../src/merge.js').catch(() => null);

async function api() {
  const module = await modulePromise;
  assert.ok(module, '算法状态模块尚未实现：需要 src/merge.js');
  return module;
}

function chineseError(error) {
  return error instanceof Error && /[\u3400-\u9fff]/u.test(error.message);
}

const examples = [
  { name: '官方示例一：交错的两个有序数组', a: [1, 2, 3, 0, 0, 0], m: 3, b: [2, 5, 6], n: 3, want: [1, 2, 2, 3, 5, 6] },
  { name: '官方示例二：nums2 为空', a: [1], m: 1, b: [], n: 0, want: [1] },
  { name: '官方示例三：nums1 有效前缀为空', a: [0], m: 0, b: [1], n: 1, want: [1] },
  { name: '零是有效元素而非空位标记', a: [0, 2, 91, 90], m: 2, b: [-1, 0], n: 2, want: [-1, 0, 0, 2] },
  { name: '负数与重复元素保留全部次数', a: [-8, -2, -2, 0, 0, 0], m: 3, b: [-9, -2, 3], n: 3, want: [-9, -8, -2, -2, -2, 3] },
  { name: 'nums2 先耗尽时保留 nums1 未移动的前缀', a: [1, 2, 0], m: 2, b: [3], n: 1, want: [1, 2, 3] },
  { name: 'nums1 先耗尽时复制 nums2 剩余前缀', a: [4, 0, 0, 0], m: 1, b: [1, 2, 3], n: 3, want: [1, 2, 3, 4] },
  { name: '允许范围两端的整数', a: [-1000000000, 1000000000, 0, 0], m: 2, b: [-1000000000, 1000000000], n: 2, want: [-1000000000, -1000000000, 1000000000, 1000000000] },
];

for (const { name, a, m, b, n, want } of examples) {
  test(name, async () => {
    const { buildMergeTrace } = await api();
    const frames = buildMergeTrace(a, m, b, n);
    assert.deepEqual(frames.at(-1).a, want);
    assert.equal(frames.at(-1).phase, 'done');
    assert.equal(frames.at(-1).sortedFrom, 0);
  });
}

test('n 为零时直接从初始化结束，不比较、不写入', async () => {
  const { buildMergeTrace } = await api();
  const frames = buildMergeTrace([0, 1], 2, [], 0);
  assert.deepEqual(frames.map((frame) => frame.phase), ['initial', 'done']);
  assert.equal(frames.at(-1).comparisons, 0);
  assert.equal(frames.at(-1).writes, 0);
});

test('相等元素从 nums2 选取，比较、写入与指针移动分别成帧', async () => {
  const { buildMergeTrace } = await api();
  const frames = buildMergeTrace([2, 0], 1, [2], 1);
  assert.deepEqual(frames.map((frame) => frame.phase), ['initial', 'compare', 'write', 'move', 'done']);
  const [initial, compare, write, move, done] = frames;
  assert.deepEqual([initial.i, initial.j, initial.k], [0, 0, 1]);
  assert.equal(compare.selected, 'b');
  assert.equal(compare.comparisons, 1);
  assert.equal(compare.writes, 0);
  assert.deepEqual(compare.a, [2, 0]);
  assert.deepEqual(write.a, [2, 2]);
  assert.equal(write.selected, 'b');
  assert.equal(write.writeIndex, 1);
  assert.deepEqual([write.i, write.j, write.k], [0, 0, 1]);
  assert.deepEqual([move.i, move.j, move.k], [0, -1, 0]);
  assert.equal(write.sortedFrom, 1);
  assert.equal(move.sortedFrom, 1);
  assert.equal(done.writes, 1);
});

test('nums1 较大时从 nums1 写入，并只在移动帧递减 i', async () => {
  const { buildMergeTrace } = await api();
  const frames = buildMergeTrace([3, 0], 1, [1], 1);
  const compare = frames.find((frame) => frame.phase === 'compare');
  const write = frames.find((frame) => frame.phase === 'write');
  const move = frames.find((frame) => frame.phase === 'move');
  assert.equal(compare.selected, 'a');
  assert.deepEqual(write.a, [3, 3]);
  assert.deepEqual([write.i, write.j, write.k], [0, 0, 1]);
  assert.deepEqual([move.i, move.j, move.k], [-1, 0, 0]);
  assert.equal(frames.at(-1).comparisons, 1);
  assert.equal(frames.at(-1).writes, 2);
});

test('nums1 耗尽后的复制不会增加数值比较次数', async () => {
  const { buildMergeTrace } = await api();
  const frames = buildMergeTrace([0, 0], 0, [-1, 2], 2);
  assert.ok(frames.filter((frame) => frame.phase === 'write').every((frame) => frame.selected === 'b'));
  assert.equal(frames.at(-1).comparisons, 0);
  assert.equal(frames.at(-1).writes, 2);
});

test('输入和所有历史帧的数组快照互相独立', async () => {
  const { buildMergeTrace } = await api();
  const a = [1, 4, 0, 0];
  const b = [2, 3];
  const frames = buildMergeTrace(a, 2, b, 2);
  assert.deepEqual(a, [1, 4, 0, 0]);
  assert.deepEqual(b, [2, 3]);
  assert.deepEqual(frames[0].a, a);
  assert.deepEqual(frames[0].b, b);
  assert.equal(new Set(frames.map((frame) => frame.a)).size, frames.length);
  assert.equal(new Set(frames.map((frame) => frame.b)).size, frames.length);
  frames.at(-1).a[0] = 999;
  frames.at(-1).b[0] = 999;
  assert.deepEqual(frames[0].a, [1, 4, 0, 0]);
  assert.deepEqual(frames[0].b, [2, 3]);
  assert.deepEqual(a, [1, 4, 0, 0]);
  assert.deepEqual(b, [2, 3]);
});

test('每次写入都发生在未读前缀之后，确认后缀始终等于最终有序结果', async () => {
  const { buildMergeTrace } = await api();
  const original = [1, 4, 6, 0, 0, 0];
  const expected = [1, 2, 3, 4, 5, 6];
  const frames = buildMergeTrace(original, 3, [2, 3, 5], 3);
  for (const frame of frames) {
    assert.deepEqual(frame.a.slice(frame.sortedFrom), expected.slice(frame.sortedFrom));
    assert.deepEqual(frame.a.slice(0, frame.i + 1), original.slice(0, frame.i + 1));
    if (frame.phase === 'write') assert.ok(frame.writeIndex > frame.i);
  }
});

test('所有帧提供完整显示字段与有效 Go 高亮行号', async () => {
  const { GO_CODE, buildMergeTrace } = await api();
  assert.ok(Array.isArray(GO_CODE));
  assert.ok(GO_CODE.length > 0 && GO_CODE.every((line) => typeof line === 'string'));
  const keys = ['phase', 'a', 'b', 'i', 'j', 'k', 'sortedFrom', 'selected', 'writeIndex', 'lines', 'title', 'description', 'comparisons', 'writes'].sort();
  for (const fixture of examples) {
    let comparisons = 0;
    let writes = 0;
    for (const frame of buildMergeTrace(fixture.a, fixture.m, fixture.b, fixture.n)) {
      assert.deepEqual(Object.keys(frame).sort(), keys);
      assert.ok(['initial', 'compare', 'write', 'move', 'done'].includes(frame.phase));
      assert.ok(['a', 'b', null].includes(frame.selected));
      assert.ok(frame.writeIndex === null || Number.isInteger(frame.writeIndex));
      assert.ok(frame.lines.length > 0);
      assert.ok(frame.lines.every((line) => Number.isInteger(line) && line >= 1 && line <= GO_CODE.length));
      assert.match(frame.title, /[\u3400-\u9fff]/u);
      assert.match(frame.description, /[\u3400-\u9fff]/u);
      assert.ok(frame.comparisons >= comparisons);
      assert.ok(frame.writes >= writes);
      comparisons = frame.comparisons;
      writes = frame.writes;
    }
  }
});

test('穷举短有序数组，使用独立排序 oracle 校验合并结果', async () => {
  const { buildMergeTrace } = await api();
  const prefixes = [[], [-1], [0], [1], [-1, -1], [-1, 0], [-1, 1], [0, 0], [0, 1], [1, 1]];
  for (const left of prefixes) {
    for (const right of prefixes) {
      if (!left.length && !right.length) continue;
      const a = [...left, ...Array(right.length).fill(0)];
      const frames = buildMergeTrace(a, left.length, right, right.length);
      const oracle = [...left, ...right].sort((x, y) => x - y);
      assert.deepEqual(frames.at(-1).a, oracle, `输入 ${JSON.stringify(left)} 与 ${JSON.stringify(right)}`);
      for (const frame of frames) assert.deepEqual(frame.a.slice(frame.sortedFrom), oracle.slice(frame.sortedFrom));
    }
  }
});

test('支持总长度 200 的边界输入', async () => {
  const { buildMergeTrace } = await api();
  const left = Array.from({ length: 100 }, (_, i) => i * 2);
  const right = Array.from({ length: 100 }, (_, i) => i * 2 + 1);
  assert.deepEqual(buildMergeTrace([...left, ...Array(100).fill(0)], 100, right, 100).at(-1).a, Array.from({ length: 200 }, (_, i) => i));
});

const invalidInputs = [
  { name: 'nums1 不是数组', args: [null, 0, [1], 1] },
  { name: 'nums2 不是数组', args: [[1], 1, null, 0] },
  { name: 'm 为小数', args: [[1], 0.5, [], 0] },
  { name: 'n 为字符串', args: [[1], 1, [], '0'] },
  { name: 'm 为负数', args: [[1], -1, [1], 1] },
  { name: 'n 大于 200', args: [[0], 0, [1], 201] },
  { name: '总长度为零', args: [[], 0, [], 0] },
  { name: '总长度超过 200', args: [Array(201).fill(0), 200, [1], 1] },
  { name: 'nums1 长度不匹配', args: [[1, 0, 0], 1, [2], 1] },
  { name: 'nums2 长度不匹配', args: [[1, 0], 1, [2, 3], 1] },
  { name: 'nums1 有效前缀降序', args: [[2, 1, 0], 2, [3], 1] },
  { name: 'nums2 降序', args: [[0, 0], 0, [2, 1], 2] },
  { name: '元素是小数', args: [[0], 0, [1.1], 1] },
  { name: '元素是字符串', args: [[0], 0, ['1'], 1] },
  { name: '元素超出上界', args: [[1000000001], 1, [], 0] },
  { name: '元素超出下界', args: [[0], 0, [-1000000001], 1] },
  { name: '元素为非有限数', args: [[Infinity], 1, [], 0] },
  { name: '稀疏数组', args: [Array(1), 1, [], 0] },
];

for (const { name, args } of invalidInputs) {
  test(`拒绝无效输入并给出中文错误：${name}`, async () => {
    const { buildMergeTrace } = await api();
    assert.throws(() => buildMergeTrace(...args), chineseError);
  });
}

for (const [text, want] of [
  ['1, 2, 3', [1, 2, 3]],
  ['[1,2,3]', [1, 2, 3]],
  [' [-2, 0, 2] ', [-2, 0, 2]],
  ['[]', []],
  [' [ ] ', []],
  ['', []],
  ['  ', []],
  ['-1000000000,1000000000', [-1000000000, 1000000000]],
]) {
  test(`解析自定义整数数组：${JSON.stringify(text)}`, async () => {
    const { parseArray } = await api();
    assert.deepEqual(parseArray(text), want);
  });
}

for (const text of ['1.2,3', '[1.0]', '1,,2', '[1,]', ',1', 'a,2', 'NaN', 'Infinity', '[1,2', '1,2]', '[[1]]', '[1] extra', '1 2', '1e3', '0x10', '1000000001', '-1000000001', null]) {
  test(`解析器拒绝非法输入而非静默丢弃：${JSON.stringify(text)}`, async () => {
    const { parseArray } = await api();
    assert.throws(() => parseArray(text), chineseError);
  });
}
