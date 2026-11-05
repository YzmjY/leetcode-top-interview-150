import test from 'node:test';
import assert from 'node:assert/strict';
import { layoutTree } from '../src/tree-layout.js';

const nodes = (...ids) => ids.map((id) => ({ id, label: '2' }));
const edge = (from, to, label, extra = {}) => ({ from, to, label, ...extra });

test('226 mirroring a sparse tree moves the same identities into opposite child slots', () => {
  const before = layoutTree({ nodes: nodes('root', 'a', 'b'), edges: [edge('root', 'a', 'L'), edge('a', 'b', 'R')] });
  const after = layoutTree({ nodes: nodes('root', 'a', 'b'), edges: [edge('root', 'a', 'R'), edge('a', 'b', 'L')] });

  assert.ok(before.positions.get('a').x < before.positions.get('root').x);
  assert.ok(after.positions.get('a').x > after.positions.get('root').x);
  assert.notDeepEqual(after.positions.get('a'), before.positions.get('a'));
  assert.ok(before.positions.get('b').x > before.positions.get('a').x);
  assert.ok(after.positions.get('b').x < after.positions.get('a').x);
});

test('114 flattening changes a left child into a visibly rightward continuation', () => {
  const initial = layoutTree({ nodes: nodes('0', '1', '2'), edges: [edge('0', '1', 'L'), edge('1', '2', 'L')] });
  const flattened = layoutTree({ nodes: nodes('0', '1', '2'), edges: [edge('0', '1', 'R'), edge('1', '2', 'R')] });

  assert.ok(initial.positions.get('1').x < initial.positions.get('0').x);
  assert.ok(flattened.positions.get('1').x > flattened.positions.get('0').x);
  assert.ok(flattened.positions.get('2').x > flattened.positions.get('1').x);
  assert.notDeepEqual(flattened.positions.get('1'), initial.positions.get('1'));
});

test('role overrides label and explicit left/right children are ordered independently of edge input order', () => {
  const layout = layoutTree({ nodes: nodes('root', 'left', 'right'), edges: [edge('root', 'right', 'L', { role: 'R' }), edge('root', 'left', 'R', { role: 'L' })] });

  assert.ok(layout.positions.get('left').x < layout.positions.get('root').x);
  assert.ok(layout.positions.get('right').x > layout.positions.get('root').x);
  assert.equal(layout.positions.get('left').y, layout.positions.get('right').y);
});

test('same-level next and random links do not change structural positions or depths', () => {
  const scene = { nodes: nodes('r', 'a', 'b', 'c', 'd'), edges: [edge('r', 'a', 'L'), edge('r', 'b', 'R'), edge('a', 'c', 'R'), edge('b', 'd', 'L')] };
  const base = layoutTree(scene);
  const withAuxiliary = layoutTree({ ...scene, edges: [...scene.edges, edge('c', 'd', 'next'), edge('d', 'r', 'random'), edge('b', 'a', 'L', { structural: false })] });

  assert.deepEqual(withAuxiliary, base);
  assert.equal(base.positions.get('c').y, base.positions.get('d').y);
});

test('duplicate displayed values keep separate positions and all nodes stay inside the canvas', () => {
  const layout = layoutTree({ nodes: nodes(0, 1, 2, 3), edges: [edge(0, 1, 'L'), edge(0, 2, 'R'), edge(1, 3, 'R')] });

  assert.equal(layout.positions.size, 4);
  assert.equal(new Set([...layout.positions.values()].map(({ x, y }) => `${x},${y}`)).size, 4);
  for (const { x, y } of layout.positions.values()) {
    assert.ok(x >= 23 && x + 23 <= layout.width);
    assert.ok(y >= 23 && y + 23 <= layout.height);
  }
});

test('a 200-node single-child tree uses linear space while preserving every left slot', () => {
  const ids = Array.from({ length: 200 }, (_, i) => String(i));
  const layout = layoutTree({ nodes: nodes(...ids), edges: ids.slice(1).map((id, i) => edge(ids[i], id, 'L')) });

  assert.equal(layout.positions.size, 200);
  assert.ok(Number.isFinite(layout.width) && layout.width <= 200 * 100);
  assert.ok(Number.isFinite(layout.height) && layout.height <= 200 * 120);
  for (let i = 1; i < ids.length; i++) {
    assert.ok(layout.positions.get(ids[i]).x < layout.positions.get(ids[i - 1]).x);
    assert.ok(layout.positions.get(ids[i]).y > layout.positions.get(ids[i - 1]).y);
  }
});

test('a complete tree has no same-depth collisions and does not reserve exponential empty slots', () => {
  const ids = Array.from({ length: 63 }, (_, i) => String(i));
  const edges = ids.slice(1).map((id, i) => edge(String(Math.floor(i / 2)), id, i % 2 ? 'R' : 'L'));
  const layout = layoutTree({ nodes: nodes(...ids), edges });

  assert.equal(layout.positions.size, 63);
  assert.ok(layout.width <= 63 * 100);
  const levels = new Map();
  for (const pos of layout.positions.values()) {
    if (!levels.has(pos.y)) levels.set(pos.y, []);
    levels.get(pos.y).push(pos.x);
  }
  for (const xs of levels.values()) {
    xs.sort((a, b) => a - b);
    for (let i = 1; i < xs.length; i++) assert.ok(xs[i] - xs[i - 1] >= 60);
  }
});

test('unordered generic children retain their edge order', () => {
  const layout = layoutTree({ nodes: nodes('r', 'a', 'b', 'c'), edges: [edge('r', 'b', 'middle'), edge('r', 'c', 'last'), edge('r', 'a', 'first')] });

  assert.ok(layout.positions.get('b').x < layout.positions.get('c').x);
  assert.ok(layout.positions.get('c').x < layout.positions.get('a').x);
});

test('quadtree children follow TL, TR, BL, BR order', () => {
  const layout = layoutTree({ nodes: nodes('r', 'tl', 'tr', 'bl', 'br'), edges: [edge('r', 'br', 'BR'), edge('r', 'tl', 'TL'), edge('r', 'bl', 'BL'), edge('r', 'tr', 'TR')] });
  const order = ['tl', 'tr', 'bl', 'br'];
  for (let i = 1; i < order.length; i++) assert.ok(layout.positions.get(order[i - 1]).x < layout.positions.get(order[i]).x);
});

test('edge-free nodes form a visible forest and cycles cannot drop nodes or loop forever', () => {
  const forest = layoutTree({ nodes: nodes('a', 'b', 'c'), edges: [] });
  assert.equal(forest.positions.size, 3);
  assert.equal(new Set([...forest.positions.values()].map(({ y }) => y)).size, 1);
  assert.equal(new Set([...forest.positions.values()].map(({ x }) => x)).size, 3);

  const cyclic = layoutTree({ nodes: nodes('a', 'b', 'c'), edges: [edge('a', 'b', 'L'), edge('b', 'a', 'R')] });
  assert.equal(cyclic.positions.size, 3);
  for (const { x, y } of cyclic.positions.values()) assert.ok(Number.isFinite(x) && Number.isFinite(y));
});

test('tree layout is pure and empty scenes have finite dimensions', () => {
  const scene = { nodes: nodes('r', 'c'), edges: [edge('r', 'c', 'R')] };
  const saved = structuredClone(scene);
  layoutTree(scene);
  assert.deepEqual(scene, saved);
  const empty = layoutTree({});
  assert.equal(empty.positions.size, 0);
  assert.ok(Number.isFinite(empty.width) && empty.width > 0);
  assert.ok(Number.isFinite(empty.height) && empty.height > 0);
});
