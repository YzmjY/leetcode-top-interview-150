const SIBLING_GAP = 72;
const SINGLE_OFFSET = 48;
const LEVEL_GAP = 90;
const PADDING = 44;

function edgeRole(edge) {
  const role = String(edge.role ?? edge.label ?? '').trim().toUpperCase();
  return role === 'LEFT' ? 'L' : role === 'RIGHT' ? 'R' : role;
}

function childOrder(role, index) {
  const slots = { L: 0, R: 1, TL: 0, TR: 1, BL: 2, BR: 3 };
  return slots[role] ?? 4 + index;
}

/**
 * Place only existing subtrees, retaining a binary tree's empty left/right
 * slots. Bounds grow with the actual nodes rather than a complete tree's depth.
 */
export function layoutTree(scene = {}) {
  const ids = [...new Set((scene.nodes || []).map((node) => String(node.id)))];
  const children = new Map(ids.map((id) => [id, []]));
  const incoming = new Set();
  for (const edge of scene.edges || []) {
    const role = edgeRole(edge);
    if (edge.structural === false || /^(NEXT|RANDOM|PREV)\b/.test(role)) continue;
    const from = String(edge.from), to = String(edge.to);
    if (!children.has(from) || !children.has(to)) continue;
    children.get(from).push({ id: to, role });
    incoming.add(to);
  }
  for (const entries of children.values()) {
    const order = new Map(entries.map((entry, index) => [entry, childOrder(entry.role, index)]));
    entries.sort((a, b) => order.get(a) - order.get(b));
  }

  const seen = new Set();
  function build(id) {
    seen.add(id);
    const branches = [];
    for (const child of children.get(id)) {
      if (!seen.has(child.id)) branches.push({ role: child.role, tree: build(child.id), offset: 0 });
    }
    if (branches.length === 1) {
      const branch = branches[0];
      const slots = { L: -1, R: 1, TL: -3, TR: -1, BL: 1, BR: 3 };
      branch.offset = (slots[branch.role] ?? 0) * SINGLE_OFFSET;
    } else if (branches.length > 1) {
      let cursor = 0;
      for (const branch of branches) {
        branch.offset = cursor - branch.tree.min;
        cursor += branch.tree.max - branch.tree.min + SIBLING_GAP;
      }
      const centre = (branches[0].offset + branches.at(-1).offset) / 2;
      for (const branch of branches) branch.offset -= centre;
    }
    return {
      id,
      branches,
      min: Math.min(0, ...branches.map((branch) => branch.offset + branch.tree.min)),
      max: Math.max(0, ...branches.map((branch) => branch.offset + branch.tree.max)),
    };
  }

  const forest = [];
  for (const id of ids) if (!incoming.has(id) && !seen.has(id)) forest.push(build(id));
  for (const id of ids) if (!seen.has(id)) forest.push(build(id)); // Cycles or disconnected fragments.

  let occupiedWidth = 0;
  const roots = forest.map((tree) => {
    const radius = Math.max(-tree.min, tree.max);
    const x = occupiedWidth + radius;
    occupiedWidth += radius * 2 + SIBLING_GAP;
    return { tree, x };
  });
  if (roots.length) occupiedWidth -= SIBLING_GAP;
  const width = Math.max(350, occupiedWidth + PADDING * 2);
  const margin = (width - occupiedWidth) / 2;
  const positions = new Map();
  let maxDepth = 0;
  function place(tree, x, depth) {
    positions.set(tree.id, { x: x + margin, y: 56 + depth * LEVEL_GAP });
    maxDepth = Math.max(maxDepth, depth);
    for (const branch of tree.branches) place(branch.tree, x + branch.offset, depth + 1);
  }
  for (const { tree, x } of roots) place(tree, x, 0);
  return { positions, width, height: Math.max(180, 112 + maxDepth * LEVEL_GAP) };
}
