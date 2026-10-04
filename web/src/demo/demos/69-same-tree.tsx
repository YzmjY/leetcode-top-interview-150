import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badges, Hint, Stat, TONE } from './stage'

/* ------------------------------------------------------------------ */
/* 69. 相同的树 —— 模式 E：两棵树并排 + 同步递归逐对比较「结构 + 值」      */
/* ------------------------------------------------------------------ */

/** 题解示例 3：p = [1,2,1]，q = [1,1,2]（层序表示，null 为空节点），输出 false */
const P_LEVELS: (number | null)[] = [1, 2, 1]
const Q_LEVELS: (number | null)[] = [1, 1, 2]

const asText = (lv: (number | null)[]) => `[${lv.map((v) => (v === null ? 'null' : v)).join(', ')}]`
const P_TEXT = asText(P_LEVELS)
const Q_TEXT = asText(Q_LEVELS)

interface TreeNode {
  id: string
  val: number
  left: TreeNode | null
  right: TreeNode | null
}

function buildTree(level: (number | null)[], i: number, id: string): TreeNode | null {
  if (i >= level.length) return null
  const val = level[i]
  if (val === null) return null
  return {
    id,
    val,
    left: buildTree(level, 2 * i + 1, `${id}L`),
    right: buildTree(level, 2 * i + 2, `${id}R`),
  }
}

const P_ROOT = buildTree(P_LEVELS, 0, 'P')
const Q_ROOT = buildTree(Q_LEVELS, 0, 'Q')

const P_NODES: Record<string, TreeNode> = {}
const Q_NODES: Record<string, TreeNode> = {}
const P_DEPTH: Record<string, number> = {}
const Q_DEPTH: Record<string, number> = {}
/** 中序展开：同一层节点的 x 槽位按中序顺序分配 */
const P_ORDER: string[] = []
const Q_ORDER: string[] = []

function collect(
  node: TreeNode | null,
  depth: number,
  nodes: Record<string, TreeNode>,
  depths: Record<string, number>,
  order: string[]
) {
  if (!node) return
  nodes[node.id] = node
  depths[node.id] = depth
  collect(node.left, depth + 1, nodes, depths, order)
  order.push(node.id)
  collect(node.right, depth + 1, nodes, depths, order)
}

collect(P_ROOT, 0, P_NODES, P_DEPTH, P_ORDER)
collect(Q_ROOT, 0, Q_NODES, Q_DEPTH, Q_ORDER)

interface Step {
  phase: 'init' | 'enter' | 'equal' | 'mismatch' | 'short' | 'done'
  /** 本步正在比较的一对节点（空表示本步不再比较） */
  curP: string | null
  curQ: string | null
  /** 值不匹配、导致返回 false 的那一对节点 */
  badP: string | null
  badQ: string | null
  /** 已比较过且值相等的节点（不可变快照） */
  passedP: string[]
  passedQ: string[]
  /** 已通过的节点对数 */
  passedPairs: number
  note: string
  /** 下一步动作（由后一个快照回填，供 Hint 使用） */
  next: string
}

function buildSteps(): Step[] {
  const steps: Step[] = []
  const passedP: string[] = []
  const passedQ: string[] = []

  const push = (
    phase: Step['phase'],
    cur: [string | null, string | null],
    bad: [string | null, string | null],
    note: string
  ) => {
    steps.push({
      phase,
      curP: cur[0],
      curQ: cur[1],
      badP: bad[0],
      badQ: bad[1],
      passedP: passedP.slice(),
      passedQ: passedQ.slice(),
      passedPairs: passedP.length,
      note,
      next: '',
    })
  }

  push(
    'init',
    [null, null],
    [null, null],
    `观察：p = ${P_TEXT}，q = ${Q_TEXT}，两棵树的根都是 1，但 p 的左孩子是 2、q 的左孩子是 1。` +
      `判断：两棵树相同要求结构相同且对应位置的值相同，所以要两个指针同时从根出发逐对比较，任何一对不一致就返回 false。` +
      `动作：先比较根节点对（p 的 1 与 q 的 1），再同步递归左孩子对。` +
      `为什么：一棵树的节点只由根、左子树、右子树组成，对应关系只可能发生在同侧，同步遍历既不会漏判也不会误判。`
  )

  /* ---- 递归：isSameTree(p, q) 的四个动作逐个展开 ---- */
  push(
    'enter',
    ['P', 'Q'],
    [null, null],
    `观察：两个指针同时停在根节点，p 的值是 ${P_NODES['P'].val}、q 的值也是 ${Q_NODES['Q'].val}，两边都不是空节点。` +
      `判断：结构这一层对得上，但值还没有比过，先做值检查再决定要不要递归。` +
      `动作：比较根这一对的值 ${P_NODES['P'].val} 与 ${Q_NODES['Q'].val}。` +
      `为什么：三个终止条件里只有「一边为空」才说明结构不同，两边都有节点时必须继续往下比。`
  )

  passedP.push('P')
  passedQ.push('Q')
  push(
    'equal',
    ['P', 'Q'],
    [null, null],
    `观察：p 的 ${P_NODES['P'].val} 与 q 的 ${Q_NODES['Q'].val} 相等，根这一对通过。` +
      `判断：值相等还不能判定整棵树相同，必须再看左右子树。` +
      `动作：按 isSameTree(p.Left, q.Left) && isSameTree(p.Right, q.Right) 先递归左孩子对（p 的 ${P_NODES['PL'].val} 与 q 的 ${Q_NODES['QL'].val}）。` +
      `为什么：&& 要求两边都为 true，左子树一旦返回 false 就会短路，右子树不会再被访问。`
  )

  push(
    'enter',
    ['PL', 'QL'],
    [null, null],
    `观察：同步走到左孩子对，p 的 ${P_NODES['PL'].val} 与 q 的 ${Q_NODES['QL'].val} 都不是空节点。` +
      `判断：两边都是左孩子，位置一致，结构这一层依然对得上，接下来只剩下比值。` +
      `动作：比较这一对的值 ${P_NODES['PL'].val} 与 ${Q_NODES['QL'].val}。` +
      `为什么：先判空、再比值是递归里两个不同的终止条件，顺序不能颠倒。`
  )

  push(
    'mismatch',
    [null, null],
    ['PL', 'QL'],
    `观察：p 的左孩子是 ${P_NODES['PL'].val}，q 的左孩子是 ${Q_NODES['QL'].val}，${P_NODES['PL'].val} ≠ ${Q_NODES['QL'].val}。` +
      `判断：结构和位置都对得上，但值不同，这两个节点代表的两棵子树不可能相同。` +
      `动作：这一层立即返回 false，不再递归 ${P_NODES['PL'].val} 和 ${Q_NODES['QL'].val} 的任何孩子。` +
      `为什么：题目要求「结构相同且对应位置的值相同」，值不等这一点已经足够否定整棵树。`
  )

  push(
    'short',
    [null, null],
    ['PL', 'QL'],
    `观察：左子树的比较返回 false，表达式 isSameTree(left) && isSameTree(right) 就停在这里。` +
      `判断：&& 短路求值，p 的右子树（值 ${P_NODES['PR'].val}）与 q 的右子树（值 ${Q_NODES['QR'].val}）不会被访问。` +
      `动作：把这一层的 false 逐层向上返回给根节点的调用。` +
      `为什么：只要有一处不一致，整棵树必然不相同，短路只是省掉了多余的访问。`
  )

  push(
    'done',
    [null, null],
    ['PL', 'QL'],
    `观察：顶层 isSameTree(p, q) 返回 false，两棵树不相同。` +
      `判断：第一处不一致出现在左孩子的一对节点 ${P_NODES['PL'].val} 与 ${Q_NODES['QL'].val}，比较在这里终止。` +
      `动作：答案读作 isSameTree(p, q) = false。` +
      `为什么：递归在任一方为空时终止，比较的节点对不超过较小树的节点数，时间 O(min(m, n))；递归栈深度取决于较矮树的高度，空间 O(min(h1, h2))。`
  )

  // 「下一步动作」由后一个快照回填，保证与步骤数据完全一致
  const valOfP = (id: string | null) => (id ? P_NODES[id].val : null)
  const valOfQ = (id: string | null) => (id ? Q_NODES[id].val : null)

  steps.forEach((s, i) => {
    const b = steps[i + 1]
    if (!b) return
    if (b.phase === 'enter') {
      s.next = `进入节点对（p 的 ${valOfP(b.curP)} 与 q 的 ${valOfQ(b.curQ)}），先判两边是否都非空`
    } else if (b.phase === 'equal' || b.phase === 'mismatch') {
      s.next = `比较当前这一对的值：p 的 ${valOfP(b.curP)} 与 q 的 ${valOfQ(b.curQ)}`
    } else if (b.phase === 'short') {
      s.next = '把这一层的 false 沿调用栈向上返回'
    } else if (b.phase === 'done') {
      s.next = '输出两棵树是否相同的结论'
    }
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

const W = 680
const H = 232
const MID = W / 2
const PAD = 40
const PANEL_GAP = 34
const NODE_R = 21
const TOP = 74
const LEVEL_GAP = 70

const LEFT_X = PAD
const LEFT_W = MID - PANEL_GAP / 2 - PAD
const RIGHT_X = MID + PANEL_GAP / 2
const RIGHT_W = W - PAD - RIGHT_X

const P_SLOT = LEFT_W / P_ORDER.length
const Q_SLOT = RIGHT_W / Q_ORDER.length

const px = (id: string) => LEFT_X + P_SLOT * (P_ORDER.indexOf(id) + 0.5)
const py = (id: string) => TOP + P_DEPTH[id] * LEVEL_GAP
const qx = (id: string) => RIGHT_X + Q_SLOT * (Q_ORDER.indexOf(id) + 0.5)
const qy = (id: string) => TOP + Q_DEPTH[id] * LEVEL_GAP

type NodeState = 'current' | 'passed' | 'bad' | 'skipped'

const FILL: Record<NodeState, string> = {
  current: 'hsl(var(--amber-soft))',
  passed: 'hsl(var(--easy-soft))',
  bad: 'hsl(var(--hard-soft))',
  skipped: 'hsl(var(--ink) / 0.18)',
}

const STROKE: Record<NodeState, string> = {
  current: 'hsl(var(--amber))',
  passed: 'hsl(var(--easy))',
  bad: 'hsl(var(--hard))',
  skipped: 'hsl(var(--border))',
}

const STROKE_W: Record<NodeState, number> = {
  current: 3,
  passed: 2.5,
  bad: 3,
  skipped: 2,
}

const VALUE_FILL: Record<NodeState, string> = {
  current: 'hsl(var(--amber))',
  passed: 'hsl(var(--easy))',
  bad: 'hsl(var(--hard))',
  skipped: 'hsl(var(--ink-soft))',
}

const STATE_LABEL: Record<NodeState, string> = {
  current: '比较中',
  passed: '✓ 通过',
  bad: '值不等',
  skipped: '未访问',
}

function Stage(step: Step) {
  const stateOf = (tree: 'p' | 'q', id: string): NodeState => {
    const bad = tree === 'p' ? step.badP : step.badQ
    if (bad === id) return 'bad'
    const cur = tree === 'p' ? step.curP : step.curQ
    if (cur === id) return 'current'
    const passed = tree === 'p' ? step.passedP : step.passedQ
    return passed.includes(id) ? 'passed' : 'skipped'
  }

  const shorted = step.phase === 'short' || step.phase === 'done'
  const labelOf = (st: NodeState) =>
    st === 'skipped' && shorted ? '短路跳过' : STATE_LABEL[st]

  const shownP = step.curP ?? step.badP
  const shownQ = step.curQ ?? step.badQ
  const shownPV = shownP ? P_NODES[shownP].val : null
  const shownQV = shownQ ? Q_NODES[shownQ].val : null
  const pairText = shownPV !== null && shownQV !== null ? `${shownPV} ⟷ ${shownQV}` : '—'

  let caption = ''
  let captionFill = 'hsl(var(--ink-soft))'
  switch (step.phase) {
    case 'init':
      caption = `准备：两棵树的根都是 ${P_NODES['P'].val}，从根节点对开始同步递归`
      captionFill = 'hsl(var(--ink-soft))'
      break
    case 'enter':
      caption = `结构判断：p 的 ${shownPV} 与 q 的 ${shownQV} 都非空 → 接着比较值`
      captionFill = 'hsl(var(--amber))'
      break
    case 'equal':
      caption = `值比较：p 的 ${shownPV} == q 的 ${shownQV} → 这一对通过，继续递归左孩子`
      captionFill = 'hsl(var(--easy))'
      break
    case 'mismatch':
      caption = `值比较：p 的 ${shownPV} ≠ q 的 ${shownQV} → 立即返回 false（不再往下递归）`
      captionFill = 'hsl(var(--hard))'
      break
    case 'short':
      caption = '&& 短路：p 的右子树与 q 的右子树不再访问，false 沿调用栈向上返回'
      captionFill = 'hsl(var(--hard))'
      break
    case 'done':
      caption = `结论：isSameTree(p, q) = false（第一处不一致：p 的左孩子 ${P_NODES['PL'].val} ≠ q 的左孩子 ${Q_NODES['QL'].val}）`
      captionFill = 'hsl(var(--hard))'
      break
  }

  const renderEdges = (tree: 'p' | 'q') => {
    const nodes = tree === 'p' ? P_NODES : Q_NODES
    const order = tree === 'p' ? P_ORDER : Q_ORDER
    const X = tree === 'p' ? px : qx
    const Y = tree === 'p' ? py : qy
    return order.flatMap((id) =>
      [nodes[id].left, nodes[id].right]
        .filter((c): c is TreeNode => c !== null)
        .map((child) => {
          const st = stateOf(tree, child.id)
          return (
            <line
              key={`edge-${id}-${child.id}`}
              x1={X(id)}
              y1={Y(id)}
              x2={X(child.id)}
              y2={Y(child.id)}
              stroke={STROKE[st]}
              strokeWidth={st === 'current' || st === 'bad' ? 3 : 2}
              strokeDasharray={st === 'skipped' ? '5 4' : undefined}
            />
          )
        })
    )
  }

  const renderNodes = (tree: 'p' | 'q') => {
    const nodes = tree === 'p' ? P_NODES : Q_NODES
    const order = tree === 'p' ? P_ORDER : Q_ORDER
    const X = tree === 'p' ? px : qx
    const Y = tree === 'p' ? py : qy
    return order.map((id) => {
      const st = stateOf(tree, id)
      return (
        <g key={`node-${id}`}>
          <circle
            cx={X(id)}
            cy={Y(id)}
            r={NODE_R}
            fill={FILL[st]}
            stroke={STROKE[st]}
            strokeWidth={STROKE_W[st]}
            strokeDasharray={st === 'skipped' ? '5 4' : undefined}
          />
          <text
            x={X(id)}
            y={Y(id) + 6}
            textAnchor="middle"
            fontSize="17"
            fontWeight="700"
            className="font-code"
            fill={VALUE_FILL[st]}
          >
            {nodes[id].val}
          </text>
          <text
            x={X(id)}
            y={Y(id) - NODE_R - 9}
            textAnchor="middle"
            fontSize="11"
            fontWeight="700"
            className="font-code"
            fill={VALUE_FILL[st]}
          >
            {labelOf(st)}
          </text>
        </g>
      )
    })
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full select-none" role="img" aria-label="两棵树同步递归逐对比较">
        {/* 1. 分隔线 + 两侧标题 */}
        <line
          x1={MID}
          y1={8}
          x2={MID}
          y2={172}
          stroke="hsl(var(--border))"
          strokeWidth={1}
          strokeDasharray="5 5"
        />
        <text
          x={LEFT_X + LEFT_W / 2}
          y={26}
          textAnchor="middle"
          fontSize="12.5"
          fontWeight="700"
          className="font-code"
          fill="hsl(var(--ink))"
        >
          {`p = ${P_TEXT}`}
        </text>
        <text
          x={RIGHT_X + RIGHT_W / 2}
          y={26}
          textAnchor="middle"
          fontSize="12.5"
          fontWeight="700"
          className="font-code"
          fill="hsl(var(--ink))"
        >
          {`q = ${Q_TEXT}`}
        </text>

        {/* 2. 边：先画线，节点圆随后盖住端点 */}
        {renderEdges('p')}
        {renderEdges('q')}

        {/* 3. 节点圆 + 状态文字（状态不只靠颜色区分） */}
        {renderNodes('p')}
        {renderNodes('q')}

        {/* 4. 本步结论 + 空节点说明 */}
        <text
          x={MID}
          y={186}
          textAnchor="middle"
          fontSize="12.5"
          fontWeight="700"
          className="font-code"
          fill={captionFill}
        >
          {caption}
        </text>
        <text
          x={MID}
          y={212}
          textAnchor="middle"
          fontSize="11"
          className="font-code"
          fill="hsl(var(--ink-soft))"
        >
          空节点不占舞台位置（两边同时为空该分支返回 true，本示例未走到这一出口）
        </text>
      </svg>

      <Badges className="justify-center">
        <Stat label="当前比较对" value={pairText} tone="amber" />
        <Stat label="值相等的节点对" value={step.passedPairs} tone="easy" />
        {step.phase !== 'done' && <Hint>{step.next}</Hint>}
        {step.phase === 'done' && (
          <Answer>
            isSameTree(p, q) = <b className="font-code">false</b>（两棵树不相同）
          </Answer>
        )}
      </Badges>
    </div>
  )
}

export default function SameTreeDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="两棵树并排，同步递归比较「结构 + 值」"
      info={`p = ${P_TEXT}，q = ${Q_TEXT}（题解示例 3，层序表示，null 为空节点），输出 false。为看清「值不等立即返回 false」这一次比较，这里只用示例 3 的两棵 3 节点小树，共 7 步：没有演示示例 1 那样的全等遍历，也没有走到「两边都为空返回 true」的出口。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '当前比较的一对节点（两侧同色）' },
        { color: TONE.easy, label: '值相等、这一对通过' },
        { color: TONE.hard, label: '值不匹配，立即返回 false' },
        { color: TONE.muted, label: '未访问 / 被 && 短路跳过' },
      ]}
    />
  )
}
