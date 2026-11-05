import test from 'node:test';
import assert from 'node:assert/strict';
import { layoutLinked } from '../src/linked-layout.js';

const nodes = (ids) => ids.map((id) => ({ id, label: String(id) }));
const next = (from, to, extra = {}) => ({ from, to, label: 'next', ...extra });
const idsByRow = (layout) => layout.chains.map((chain) => chain.ids);

test('explicit chains move stable node IDs into the real reversal order', () => {
  const original = { nodes: nodes(['a', 'b', 'c', 'd', 'e']), chains: [{ label: 'head', ids: ['a', 'b', 'c', 'd', 'e'] }] };
  const reversed = { ...original, chains: [{ label: 'head', ids: ['a', 'd', 'c', 'b', 'e'] }] };
  const before = layoutLinked(original);
  const after = layoutLinked(reversed);

  assert.deepEqual(idsByRow(after), [['a', 'd', 'c', 'b', 'e']]);
  assert.equal(after.chains[0].label, 'head');
  assert.notDeepEqual(after.positions.get('b'), before.positions.get('b'));
  assert.notDeepEqual(after.positions.get('d'), before.positions.get('d'));
  assert.deepEqual(after.positions.get('a'), before.positions.get('a'));
  assert.ok(after.positions.get('d').x < after.positions.get('c').x);
  assert.ok(after.positions.get('c').x < after.positions.get('b').x);
});

test('legacy scenes follow next edges rather than the node array or auxiliary links', () => {
  const layout = layoutLinked({
    nodes: nodes(['c', 'b', 'a']),
    edges: [next('a', 'b'), { from: 'b', to: 'c' }, { from: 'c', to: 'a', label: 'random' }, { from: 'b', to: 'a', label: 'prev' }],
  });

  assert.deepEqual(idsByRow(layout), [['a', 'b', 'c']]);
  assert.ok(layout.positions.get('a').x < layout.positions.get('b').x);
  assert.ok(layout.positions.get('b').x < layout.positions.get('c').x);
});

test('duplicate values remain distinct nodes, including numeric node IDs', () => {
  const layout = layoutLinked({ nodes: [{ id: 0, label: '2' }, { id: 1, label: '2' }, { id: 2, label: '2' }], chains: [{ label: 'head', ids: [2, 0, 1] }] });

  assert.deepEqual(idsByRow(layout), [['2', '0', '1']]);
  assert.equal(layout.positions.size, 3);
  assert.notDeepEqual(layout.positions.get('0'), layout.positions.get('1'));
});

test('cycles are bounded and every node is placed only once', () => {
  const layout = layoutLinked({ nodes: nodes(['a', 'b', 'c']), edges: [next('a', 'b'), next('b', 'c'), next('c', 'a')] });

  assert.deepEqual(idsByRow(layout), [['a', 'b', 'c']]);
  assert.equal(layout.positions.size, 3);
});

test('disconnected next fragments occupy separate labelled rows', () => {
  const layout = layoutLinked({ nodes: nodes(['a', 'b', 'c', 'd']), edges: [next('a', 'b'), next('c', 'd')] });

  assert.deepEqual(idsByRow(layout), [['a', 'b'], ['c', 'd']]);
  assert.ok(layout.chains.every((chain) => chain.label.length));
  assert.ok(layout.positions.get('c').y - layout.positions.get('a').y > 46);
});

test('uncovered live nodes have a visible staging row while explicit chains remain authoritative', () => {
  const layout = layoutLinked({
    nodes: nodes(['a', 'b', 'c', 'd']),
    chains: [{ label: '已反转', ids: ['b', 'a'] }],
    edges: [next('a', 'b'), next('c', 'd')],
  });

  assert.deepEqual(idsByRow(layout), [['b', 'a'], ['c', 'd']]);
  assert.match(layout.chains[1].label, /暂存|未接回/);
  assert.equal(layout.positions.size, 4);
});

test('an explicit empty chain list keeps existing nodes in a staging area', () => {
  const layout = layoutLinked({ nodes: nodes(['a', 'b']), chains: [], edges: [next('a', 'b')] });

  assert.deepEqual(idsByRow(layout), [['a', 'b']]);
  assert.match(layout.chains[0].label, /暂存|未接回/);
});

test('removed nodes leave active chains and get their own labelled area', () => {
  const layout = layoutLinked({
    nodes: nodes(['a', 'b', 'c', 'd']),
    chains: [{ label: 'head', ids: ['a', 'b', 'c', 'missing'] }],
    removed: ['b', 'd', 'b', 'missing'],
  });

  assert.deepEqual(idsByRow(layout), [['a', 'c'], ['b', 'd']]);
  assert.deepEqual(layout.removed, ['b', 'd']);
  assert.equal(layout.chains[1].label, '已移除');
  assert.equal(layout.positions.size, 4);
  assert.ok(layout.positions.get('b').y > layout.positions.get('a').y);
});

test('shared tails are placed once when multiple inputs converge', () => {
  const layout = layoutLinked({ nodes: nodes(['a', 'b', 'c', 'd']), edges: [next('a', 'c'), next('b', 'c'), next('c', 'd')] });

  assert.deepEqual(idsByRow(layout), [['a', 'c', 'd'], ['b']]);
  assert.equal(layout.positions.size, 4);
});

test('long chains wrap without overlap and preserve traversal order', () => {
  const ids = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o'];
  const layout = layoutLinked({ nodes: nodes(ids), chains: [{ label: 'head', ids }] });

  assert.deepEqual(idsByRow(layout), [['a', 'b', 'c', 'd', 'e', 'f', 'g'], ['h', 'i', 'j', 'k', 'l', 'm', 'n'], ['o']]);
  assert.ok(layout.width <= 680);
  assert.ok(layout.positions.get('a').y >= 80, 'leave space above nodes for pointer names');
  assert.ok(layout.positions.get('h').y > layout.positions.get('g').y);
  const positions = [...layout.positions.values()];
  for (let i = 0; i < positions.length; i++) {
    const a = positions[i];
    assert.ok(a.x >= 23 && a.x + 23 <= layout.width);
    assert.ok(a.y >= 23 && a.y + 23 <= layout.height);
    for (const b of positions.slice(i + 1)) assert.ok(Math.hypot(a.x - b.x, a.y - b.y) >= 70);
  }
});

test('layout leaves scene arrays and chain metadata untouched', () => {
  const scene = { nodes: nodes(['a', 'b', 'c']), chains: [{ label: 'head', ids: ['a', 'b'] }], removed: ['b'], edges: [next('b', 'c')] };
  const saved = structuredClone(scene);
  layoutLinked(scene);
  assert.deepEqual(scene, saved);
});

test('empty scenes have a finite, usable canvas', () => {
  const layout = layoutLinked({});
  assert.equal(layout.positions.size, 0);
  assert.deepEqual(layout.chains, []);
  assert.deepEqual(layout.removed, []);
  assert.ok(Number.isFinite(layout.width) && layout.width > 0);
  assert.ok(Number.isFinite(layout.height) && layout.height > 0);
});
