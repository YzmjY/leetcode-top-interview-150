import {nodeMetrics} from './node-metrics.js';

const NODES_PER_ROW = 7;
const NODE_GAP = 38;
const HORIZONTAL_PADDING = 29;
const ROW_GAP = 144;
const FIRST_Y = 104;

function isNextEdge(edge) {
  const names = [edge.label, edge.kind, edge.type].map((name) => String(name ?? '').trim().toLowerCase());
  if (names.some((name) => /^(random|prev)\b/.test(name))) return false;
  return names.includes('next') || edge.structural !== false;
}

// Unlabelled edges are the next links in older linked-list scenes. Traversal
// considers IDs, never displayed values, and stops at an already-placed tail.
function inferChains(ids, edges) {
  const available = new Set(ids);
  const next = new Map();
  for (const edge of edges) {
    const from = String(edge.from), to = String(edge.to);
    if (available.has(from) && available.has(to) && isNextEdge(edge) && !next.has(from)) next.set(from, to);
  }
  const incoming = new Set(next.values());
  const seen = new Set();
  const chains = [];
  const walk = (start) => {
    if (seen.has(start)) return;
    const chain = [];
    let id = start;
    while (available.has(id) && !seen.has(id)) {
      seen.add(id);
      chain.push(id);
      id = next.get(id);
    }
    chains.push(chain);
  };
  for (const id of ids) if (!incoming.has(id)) walk(id);
  for (const id of ids) walk(id); // Remaining components may be cycles.
  return chains;
}

/**
 * Lay out stable node IDs in logical next order. `chains` contains display rows;
 * each row's y is its node centre, leaving room above for labels and pointers.
 * A long logical chain can occupy several consecutive display rows.
 */
export function layoutLinked(scene = {}) {
  const ids = [...new Set((scene.nodes || []).map((node) => String(node.id)))];
  const sizes = new Map((scene.nodes || []).map((node) => [String(node.id), nodeMetrics(node)]));
  const nodeHeight = Math.max(46, ...[...sizes.values()].map((size) => size.height));
  const rowGap = Math.max(ROW_GAP, nodeHeight + 98);
  const firstY = Math.max(FIRST_Y, nodeHeight / 2 + 81);
  const available = new Set(ids);
  const removed = [...new Set((scene.removed || []).map(String))].filter((id) => available.has(id));
  const removedSet = new Set(removed);
  const used = new Set(removed);
  const groups = [];
  const explicit = Array.isArray(scene.chains);

  if (explicit) {
    for (const [index, chain] of scene.chains.entries()) {
      const chainIds = [];
      for (const item of chain.ids || []) {
        const id = String(item);
        if (available.has(id) && !used.has(id)) {
          used.add(id);
          chainIds.push(id);
        }
      }
      if (chainIds.length) groups.push({ label: String(chain.label || `链表 ${index + 1}`), ids: chainIds });
    }
  }

  const uncovered = ids.filter((id) => !used.has(id));
  const inferred = inferChains(uncovered, scene.edges || []);
  inferred.forEach((chainIds, index) => {
    const label = explicit ? '暂存 / 未接回' : '链表';
    groups.push({ label: inferred.length > 1 ? `${label} ${index + 1}` : label, ids: chainIds });
  });
  if (removedSet.size) groups.push({ label: '已移除', ids: removed });

  const positions = new Map();
  const chains = [];
  let width = 350;
  for (const group of groups) {
    for (let offset = 0; offset < group.ids.length; offset += NODES_PER_ROW) {
      const rowIds = group.ids.slice(offset, offset + NODES_PER_ROW);
      const y = firstY + chains.length * rowGap;
      const label = offset ? `${group.label}（续）` : group.label;
      chains.push({ label, ids: rowIds, y });
      let cursor = HORIZONTAL_PADDING;
      for (const id of rowIds) {
        const {width: nodeWidth} = sizes.get(id);
        positions.set(id, {x: cursor + nodeWidth / 2, y});
        cursor += nodeWidth + NODE_GAP;
      }
      width = Math.max(width, cursor - NODE_GAP + HORIZONTAL_PADDING);
    }
  }

  return {
    positions,
    width,
    height: Math.max(190, firstY + Math.max(0, chains.length - 1) * rowGap + Math.max(60, nodeHeight / 2 + 37)),
    chains,
    removed,
  };
}
