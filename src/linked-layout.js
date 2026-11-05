const NODES_PER_ROW = 7;
const COLUMN_GAP = 84;
const ROW_GAP = 144;
const FIRST_X = 52;
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
  for (const group of groups) {
    for (let offset = 0; offset < group.ids.length; offset += NODES_PER_ROW) {
      const rowIds = group.ids.slice(offset, offset + NODES_PER_ROW);
      const y = FIRST_Y + chains.length * ROW_GAP;
      const label = offset ? `${group.label}（续）` : group.label;
      chains.push({ label, ids: rowIds, y });
      rowIds.forEach((id, column) => positions.set(id, { x: FIRST_X + column * COLUMN_GAP, y }));
    }
  }

  return {
    positions,
    width: 620,
    height: Math.max(190, FIRST_Y + Math.max(0, chains.length - 1) * ROW_GAP + 60),
    chains,
    removed,
  };
}
