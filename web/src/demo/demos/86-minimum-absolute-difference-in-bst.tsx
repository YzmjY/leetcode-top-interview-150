import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badge, Badges, Cell, Flag, Hint, Stat, TONE, type CellState } from './stage'

/* ------------------------------------------------------------------ */
/* 86. 二叉搜索树的最小绝对差 —— 模式 E：BST 中序遍历，只比较相邻两节点    */
/* ------------------------------------------------------------------ */

/** 官方示例 1：root = [4,2,6,1,3]（层序表示，null 为空节点），输出 1 */
const LEVELS: (number | null)[] = [4, 2, 6, 1, 3]
const INPUT_TEXT = `[${LEVELS.map((v) => (v === null ? 'null' : v)).join(',')}]`

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

const ROOT_ID = 'R'
const ROOT = buildTree(LEVELS, 0, ROOT_ID) as TreeNode

const NODES: Record<string, TreeNode> = {}
const VAL_OF: Record<string, number> = {}
const DEPTH_OF: Record<string, number> = {}
/** 中序展开顺序：同一层节点的 x 槽位按中序顺序分配（模式 E 的坐标换算） */
const ORDER: string[] = []

function collect(node: TreeNode | null, depth: number) {
  if (!node) return
  NODES[node.id] = node
  VAL_OF[node.id] = node.val
  DEPTH_OF[node.id] = depth
  collect(node.left, depth + 1)
  ORDER.push(node.id)
  collect(node.right, depth + 1)
}
collect(ROOT, 0)

const INORDER_INDEX: Record<string, number> = {}
ORDER.forEach((id, i) => {
  INORDER_INDEX[id] = i
})

interface SeqItem {
  id: string
  /** 与中序前驱的差；中序首节点为 null */
  diff: number | null
}

interface Step {
  phase: 'init' | 'descend' | 'visit' | 'done'
  /** 本步主角：descend = 刚压栈的节点，visit = 刚出栈访问的节点 */
  cur: string | null
  /** 中序前驱 */
  prev: string | null
  /** 中序栈快照，栈顶在末尾 */
  stack: string[]
  /** 已访问的中序序列快照（不可变） */
  seq: SeqItem[]
  /** 本步的候选差值 */
  diff: number | null
  /** 本步是否刷新了 minDiff */
  refreshed: boolean
  /** 当前最小差；还没比较过为 null */
  minDiff: number | null
  note: string
  /** 下一步动作（由后一个快照回填，供 Hint 使用） */
  next: string
}

function buildSteps(): Step[] {
  const steps: Step[] = []
  const stack: string[] = []
  const seq: SeqItem[] = []
  let node: string | null = ROOT_ID
  let prev: string | null = null
  let minDiff: number | null = null
  let diff: number | null = null
  let refreshed = false

  const snap = (phase: Step['phase'], cur: string | null, note: string): Step => ({
    phase,
    cur,
    prev,
    stack: stack.slice(),
    seq: seq.map((s) => ({ ...s })),
    diff,
    refreshed,
    minDiff,
    note,
    next: '',
  })

  steps.push(
    snap(
      'init',
      null,
      `观察：root = ${INPUT_TEXT}，对这棵 BST 做中序遍历会得到升序序列 1 → 2 → 3 → 4 → 6。判断：升序序列里的最小差一定出现在相邻两个元素之间，所以不必枚举所有点对，只要拿当前节点与中序前驱 prev 作差。动作：minDiff 先置为 ∞、prev 置空，用栈从根节点 ${VAL_OF[ROOT_ID]} 开始一路向左下探。为什么：中序里任意两个位置的差值都是中间那些相邻差之和，不可能比最小的相邻差更小。`
    )
  )

  while (node !== null || stack.length > 0) {
    // 中序：一路向左压栈，直到没有左孩子才回头访问栈顶
    while (node !== null) {
      const id = node
      const left = NODES[id].left
      stack.push(id)
      diff = null
      refreshed = false
      steps.push(
        snap(
          'descend',
          id,
          `观察：中序要按 左 → 根 → 右 处理，${VAL_OF[id]} 的左子树还没有走完，此刻不能访问它。判断：先把 ${VAL_OF[id]} 压入栈中暂存，栈里保存的都是「自己还没被访问」的节点，当前共 ${stack.length} 个。动作：${left ? `下探指针继续走到左孩子 ${left.val}` : '左孩子为空，下探结束，下一步该弹出栈顶访问了'}。为什么：只有左子树全部访问完，${VAL_OF[id]} 才能紧接在中序前驱之后被访问。`
        )
      )
      node = left ? left.id : null
    }

    const id = stack.pop() as string
    const right = NODES[id].right
    diff = null
    refreshed = false

    if (prev === null) {
      seq.push({ id, diff: null })
      steps.push(
        snap(
          'visit',
          id,
          `观察：左子树已全部走完，弹出栈顶 ${VAL_OF[id]}，它是中序序列的第一个节点，前面没有任何节点。判断：prev 还是空，没有前驱可以作差，这一步不产生候选差值。动作：把 prev 记为 ${VAL_OF[id]}，再转向它的右子树${right ? ` ${right.val}` : '（右子树为空，接着弹出栈顶）'}。为什么：中序只把「当前节点」和「中序前驱」这一对相邻元素拿来比较。`
        )
      )
    } else {
      const p = VAL_OF[prev]
      const v = VAL_OF[id]
      const oldMin = minDiff
      diff = Math.abs(v - p)
      refreshed = oldMin === null || diff < oldMin
      if (refreshed) minDiff = diff
      seq.push({ id, diff })
      steps.push(
        snap(
          'visit',
          id,
          refreshed
            ? oldMin === null
              ? `观察：${v} 是中序里紧接 ${p} 的节点，作差 |${v} − ${p}| = ${diff}。判断：这是第一对相邻元素，minDiff 还是 ∞。动作：minDiff 直接刷新为 ${diff}，prev 前进到 ${v}，继续中序。为什么：升序序列的最小差必在相邻两数之间，第一对就先立为当前最优。`
              : `观察：${v} 是中序里紧接 ${p} 的节点，作差 |${v} − ${p}| = ${diff}。判断：${diff} 比当前的 minDiff ${oldMin} 更小。动作：minDiff 刷新为 ${diff}，prev 前进到 ${v}，继续中序。为什么：升序序列的最小差必在相邻两数之间，刷新这一对就够了。`
            : `观察：${v} 紧接中序前驱 ${p}，作差 |${v} − ${p}| = ${diff}。判断：${diff} 没有小于当前的 minDiff = ${minDiff}，这一对不更优。动作：答案保持不变，prev 前进到 ${v}，继续中序。为什么：最小值只需保留目前最小的相邻差，后面还有相邻对没比较。`
        )
      )
    }

    prev = id
    node = right ? right.id : null
  }

  const answer = minDiff ?? 0
  // 总结步：遍历已结束，清掉「当前这一对」的临时状态，只留结论
  prev = null
  diff = null
  refreshed = false
  steps.push(
    snap(
      'done',
      null,
      `观察：栈已空、下探指针也为空，中序完整走过 ${seq.length} 个节点：${seq.map((s) => VAL_OF[s.id]).join(' → ')}，共比较了 ${seq.filter((s) => s.diff !== null).length} 对相邻节点。判断：minDiff = ${answer} 就是这些相邻差里最小的，也就是全树任意两个不同节点值之差的最小值（题目保证节点数 ≥ 2，minDiff 至少被刷新过一次）。动作：读出答案 ${answer}。为什么：每个节点只入栈、出栈各一次，时间 O(n)；栈深度等于树高 h，空间 O(h)。`
    )
  )

  // 「下一步动作」一律由后一个快照回填，保证 Hint 描述的是真正会发生的事
  steps.forEach((s, i) => {
    const b = steps[i + 1]
    if (!b) return
    if (b.phase === 'descend' && b.cur) {
      s.next = `把 ${VAL_OF[b.cur]} 压入栈暂存`
    } else if (b.phase === 'visit' && b.cur) {
      s.next =
        b.prev === null
          ? `弹出栈顶 ${VAL_OF[b.cur]}，它是中序第一个节点`
          : `弹出栈顶 ${VAL_OF[b.cur]}，与中序前驱 ${VAL_OF[b.prev]} 作差`
    } else {
      s.next = `遍历结束，输出最小差 ${answer}`
    }
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

const W = 680
const PAD_L = 64
const PAD_R = 64
const NODE_R = 20
const TOP = 48
const LEVEL_GAP = 76
const H = TOP + Math.max(...Object.values(DEPTH_OF)) * LEVEL_GAP + NODE_R + 22

type NodeState = 'current' | 'prev' | 'stack' | 'visited' | 'idle'

const FILL: Record<NodeState, string> = {
  current: 'hsl(var(--amber-soft))',
  prev: 'hsl(var(--teal-soft))',
  stack: 'hsl(var(--paper))',
  visited: 'hsl(var(--easy-soft))',
  idle: 'hsl(var(--ink) / 0.18)',
}

const STROKE: Record<NodeState, string> = {
  current: 'hsl(var(--amber))',
  prev: 'hsl(var(--teal))',
  stack: 'hsl(var(--medium))',
  visited: 'hsl(var(--easy))',
  idle: 'hsl(var(--border))',
}

const STROKE_W: Record<NodeState, number> = {
  current: 3,
  prev: 3,
  stack: 2,
  visited: 2,
  idle: 2,
}

const VALUE_FILL: Record<NodeState, string> = {
  current: 'hsl(var(--amber))',
  prev: 'hsl(var(--teal))',
  stack: 'hsl(var(--medium))',
  visited: 'hsl(var(--easy))',
  idle: 'hsl(var(--ink-soft))',
}

/** 状态文字标签：保证不靠颜色也能区分 */
const NODE_LABEL: Record<NodeState, string> = {
  current: '访问',
  prev: 'prev',
  stack: '栈中',
  visited: '已访问',
  idle: '',
}

function Stage(step: Step) {
  const slot = (W - PAD_L - PAD_R) / ORDER.length
  const x = (id: string) => PAD_L + slot * (INORDER_INDEX[id] + 0.5)
  const y = (id: string) => TOP + DEPTH_OF[id] * LEVEL_GAP

  const visitedIds = new Set(step.seq.map((s) => s.id))

  const stateOf = (id: string): NodeState => {
    if (step.phase === 'done') return 'visited'
    if (step.cur === id) return 'current'
    if (step.prev === id) return 'prev'
    if (step.stack.includes(id)) return 'stack'
    if (visitedIds.has(id)) return 'visited'
    return 'idle'
  }

  const labelOf = (id: string): string => {
    const st = stateOf(id)
    if (st === 'current') return step.phase === 'descend' ? '入栈' : '访问'
    return NODE_LABEL[st]
  }

  const pairing = step.phase === 'visit'
  const curIdx = pairing && step.cur ? step.seq.findIndex((s) => s.id === step.cur) : -1
  const prevIdx = pairing && step.prev ? step.seq.findIndex((s) => s.id === step.prev) : -1

  const cellState = (i: number): CellState => {
    if (i === curIdx) return 'active'
    if (i === prevIdx) return 'new'
    return step.seq[i] ? 'ok' : 'dim'
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* 1. BST 树：x 按中序槽位、y 按层深（坐标手写，结果可复现） */}
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full select-none">
        {ORDER.map((id) =>
          [NODES[id].left, NODES[id].right]
            .filter((c): c is TreeNode => c !== null)
            .map((child) => (
              <line
                key={`${id}-${child.id}`}
                x1={x(id)}
                y1={y(id)}
                x2={x(child.id)}
                y2={y(child.id)}
                stroke={step.cur === child.id ? 'hsl(var(--amber))' : 'hsl(var(--border))'}
                strokeWidth={step.cur === child.id ? 2.5 : 2}
              />
            ))
        )}

        {ORDER.map((id) => {
          const st = stateOf(id)
          return (
            <g key={id} className="demo-water">
              <circle
                cx={x(id)}
                cy={y(id)}
                r={NODE_R}
                fill={FILL[st]}
                stroke={STROKE[st]}
                strokeWidth={STROKE_W[st]}
                strokeDasharray={st === 'stack' ? '5 4' : undefined}
              />
              <text
                x={x(id)}
                y={y(id) + 6}
                textAnchor="middle"
                fontSize="17"
                fontWeight="700"
                className="font-code"
                fill={VALUE_FILL[st]}
              >
                {VAL_OF[id]}
              </text>
            </g>
          )
        })}

        {ORDER.map((id) => {
          const label = labelOf(id)
          if (!label) return null
          const st = stateOf(id)
          return (
            <text
              key={`label-${id}`}
              x={x(id) + NODE_R + 8}
              y={y(id) + 4}
              textAnchor="start"
              fontSize="11"
              fontWeight="700"
              className="font-code"
              fill={STROKE[st]}
            >
              {label}
            </text>
          )
        })}
      </svg>

      {/* 2. 中序访问顺序：节点依次串成一行，当前节点 amber、前驱 teal */}
      <div className="w-full max-w-[560px]">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-x-3 text-[11px] text-ink-soft">
          <span>中序访问顺序（BST 中序 = 升序）</span>
          <span className="font-code">Δ = 与前驱的差</span>
        </div>
        <div
          className="grid w-full gap-1.5"
          style={{ gridTemplateColumns: `repeat(${ORDER.length}, minmax(0, 1fr))` }}
        >
          {ORDER.map((id, i) => (
            <div key={`flag-${id}`} className="flex h-6 items-end justify-center">
              {i === curIdx && <Flag label="cur" tone="amber" />}
              {i === prevIdx && <Flag label="prev" tone="teal" />}
            </div>
          ))}
          {ORDER.map((id, i) => (
            <Cell key={`cell-${id}`} state={cellState(i)} className="w-full min-w-0 sm:min-w-0">
              {step.seq[i] ? VAL_OF[step.seq[i].id] : '·'}
            </Cell>
          ))}
          {ORDER.map((id, i) => {
            const d = step.seq[i]?.diff ?? null
            return (
              <div key={`diff-${id}`} className="flex h-5 items-center justify-center font-code text-[11px]">
                {d === null ? (
                  <span className="text-ink-soft">—</span>
                ) : (
                  <span
                    className={
                      d === step.minDiff
                        ? 'font-bold text-[hsl(var(--easy))]'
                        : 'text-ink-soft'
                    }
                  >
                    Δ{d}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 3. 中序栈（栈顶在右，另有文字标注） */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px]">
        <span className="text-ink-soft">中序栈（栈顶在右）</span>
        {step.stack.length === 0 ? (
          <span className="font-code text-ink-soft">（空）</span>
        ) : (
          step.stack.map((id, k) => (
            <span key={id} className="flex items-center gap-1.5">
              <span
                className={
                  k === step.stack.length - 1
                    ? 'rounded-md border border-[hsl(var(--medium))]/50 bg-[hsl(var(--medium-soft))] px-2 py-0.5 font-code font-semibold text-[hsl(var(--medium))]'
                    : 'rounded-md border border-border bg-card px-2 py-0.5 font-code text-ink-soft'
                }
              >
                {VAL_OF[id]}
              </span>
              {k === step.stack.length - 1 && <span className="text-[10px] text-ink-soft">栈顶</span>}
            </span>
          ))
        )}
      </div>

      <Badges className="justify-center">
        <Stat label="中序前驱 prev" value={step.prev === null ? '—' : VAL_OF[step.prev]} tone="teal" />
        <Stat label="最小差 minDiff" value={step.minDiff === null ? '∞' : step.minDiff} tone="easy" />
        <Badge tone={step.refreshed ? 'easy' : 'plain'}>
          Δ = <b className="font-code text-xs">{step.diff === null ? '—' : step.diff}</b>
          {step.refreshed ? ' · 刷新最小差' : ''}
        </Badge>
        {step.phase !== 'done' && <Hint>{step.next}</Hint>}
        {step.phase === 'done' && (
          <Answer>
            最小绝对差 = <b className="font-code text-sm">{step.minDiff}</b>
          </Answer>
        )}
      </Badges>
    </div>
  )
}

export default function MinimumAbsoluteDifferenceInBstDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="BST 中序遍历，只比较相邻两个节点"
      info={`输入 root = ${INPUT_TEXT}（题解示例 1，输出 1），中序序列 1 → 2 → 3 → 4 → 6 升序。该示例只有 5 个节点，规模最小又能完整展示「向左压栈 → 出栈与前驱作差」，因此全树逐步演示，共 ${steps.length} 步；题目保证节点数 ≥ 2。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '当前节点（下探入栈 / 出栈访问）' },
        { color: TONE.teal, label: '中序前驱 prev（作差的另一项）' },
        { color: TONE.easy, label: '已访问 / 刷新了最小差' },
        { color: TONE.medium, label: '栈中待访问（虚线圆）' },
        { color: TONE.muted, label: '尚未访问' },
      ]}
    />
  )
}
