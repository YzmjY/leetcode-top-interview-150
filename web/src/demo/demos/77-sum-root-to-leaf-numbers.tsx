import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badge, Badges, Hint, Stat, TONE } from './stage'

/* ------------------------------------------------------------------ */
/* 77. 求根节点到叶节点数字之和 —— 模式 E：树 + 前序 DFS 携带前缀数字 cur  */
/* ------------------------------------------------------------------ */

/** 固定示例输入（题解「示例 2」：root = [4,9,0,5,1]，输出 1026） */
const LEVELS: (number | null)[] = [4, 9, 0, 5, 1]
const INPUT_TEXT = `[${LEVELS.map((v) => (v === null ? 'null' : v)).join(', ')}]`

interface TreeNode {
  id: string
  val: number
  left: TreeNode | null
  right: TreeNode | null
}

const ROOT_ID = 'R'

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

const ROOT = buildTree(LEVELS, 0, ROOT_ID)

const NODES: Record<string, TreeNode> = {}
const VAL_OF: Record<string, number> = {}
const DEPTH_OF: Record<string, number> = {}
/** 中序展开：同一层节点的 x 槽位按中序顺序分配 */
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

const MAX_DEPTH = Math.max(...ORDER.map((id) => DEPTH_OF[id]))
/** 叶子数 = 根到叶路径数（每个内部节点都至少有一个孩子） */
const LEAF_COUNT = ORDER.filter((id) => !NODES[id].left && !NODES[id].right).length

function childText(node: TreeNode): string {
  const { left, right } = node
  if (left && right) return `左右孩子是 ${left.val} 和 ${right.val}`
  if (left) return `只有左孩子 ${left.val}`
  if (right) return `只有右孩子 ${right.val}`
  return '没有孩子'
}

interface Step {
  phase: 'init' | 'enter' | 'leaf' | 'return' | 'done'
  /** 本步正在处理的节点 id；init / done 为 null */
  cur: string | null
  /** 本步算出的路径数字 cur = from × 10 + 节点值 */
  curNum: number
  /** 进入节点前的 cur，用于展示「添位」算式 */
  from: number
  /** 本步返回给父节点的值：叶子返回 cur，非叶返回左右子树之和 */
  ret: number
  /** 已算出 cur 的节点快照（id → cur） */
  numAt: Record<string, number>
  /** 已累加进 sum 的叶节点 id（按累加顺序） */
  leafIds: string[]
  /** 递归调用栈快照，栈顶在末尾 */
  path: string[]
  /** 累计总和 */
  sum: number
  note: string
  /** 下一步动作；由后一个快照统一回填，供 Hint 使用 */
  next: string
}

function buildSteps(): Step[] {
  const steps: Step[] = []
  const numAt: Record<string, number> = {}
  const leafIds: string[] = []
  const path: string[] = []
  let sum = 0

  const snap = (args: {
    phase: Step['phase']
    cur?: string | null
    curNum?: number
    from?: number
    ret?: number
    note: string
  }): Step => ({
    phase: args.phase,
    cur: args.cur ?? null,
    curNum: args.curNum ?? 0,
    from: args.from ?? 0,
    ret: args.ret ?? 0,
    numAt: { ...numAt },
    leafIds: leafIds.slice(),
    path: path.slice(),
    sum,
    note: args.note,
    next: '',
  })

  steps.push(
    snap({
      phase: 'init',
      note: `观察：输入 root = ${INPUT_TEXT}（层序表示，null 为空节点），dfs(root, 0) 从 cur = 0、sum = 0 开始，整棵树共有 ${LEAF_COUNT} 条根到叶路径。判断：一条路径的数字可以边走边算——每下降一层就 cur = cur × 10 + 节点值，等于在数字末尾添一位，不必保存整条路径。动作：从根节点 ${VAL_OF[ROOT_ID]} 开始前序 DFS，把 cur 作为参数往下一层传。为什么：只有叶子才产生数字，中间节点的 cur 只是它下面所有路径共享的前缀。`,
    })
  )

  function dfs(id: string, cur: number): number {
    const node = NODES[id]
    const { val, left, right } = node
    const next = cur * 10 + val
    const isRoot = id === ROOT_ID
    path.push(id)
    numAt[id] = next
    const here = path.map((p) => VAL_OF[p]).join(' → ')

    if (!left && !right) {
      sum += next
      leafIds.push(id)
      steps.push(
        snap({
          phase: 'leaf',
          cur: id,
          curNum: next,
          from: cur,
          ret: next,
          note: `观察：进入节点 ${val}，父节点传来的 cur = ${cur}。判断：cur = ${cur} × 10 + ${val} = ${next}，节点 ${val} ${childText(node)}，是叶子节点，路径 ${here} 代表的数字就是 ${next}。动作：把 ${next} 累加进总和，sum = ${sum - next} + ${next} = ${sum}，并向父节点返回 ${next}。为什么：只有叶子才产生数字，返回 ${next} 让父节点能把左右两个结果相加。`,
        })
      )
      path.pop()
      return next
    }

    steps.push(
      snap({
        phase: 'enter',
        cur: id,
        curNum: next,
        from: cur,
        note: `观察：进入节点 ${val}，父节点传来的 cur = ${cur}。判断：cur = ${cur} × 10 + ${val} = ${next}，节点 ${val} ${childText(node)}，不是叶子，本步不产生数字。动作：先把 cur = ${next} 传给左子树递归，左子树返回后再处理右子树。为什么：${next} 是它下面所有根到叶路径共享的前缀，同一个前缀添上不同后缀才拼出不同的路径数字。`,
      })
    )

    const l = left ? dfs(left.id, next) : 0
    const r = right ? dfs(right.id, next) : 0
    path.pop()
    steps.push(
      snap({
        phase: 'return',
        cur: id,
        curNum: next,
        from: cur,
        ret: l + r,
        note: isRoot
          ? `观察：节点 ${val} 的左右子树都返回了，分别得到 ${l} 和 ${r}。判断：${l} + ${r} 覆盖了从根出发的全部 ${LEAF_COUNT} 条根到叶路径，中间节点自己不产生数字。动作：把 ${l + r} 作为 dfs(root, 0) 的返回值交给调用方。为什么：每次汇总都是两棵子树的返回值相加，真正的累加只发生在叶子处，每条路径的数字恰好被计入一次。`
          : `观察：节点 ${val} 的左右子树都返回了，分别得到 ${l} 和 ${r}。判断：这两个值就是路径 ${here} 往下全部路径的数字之和，节点 ${val} 不是叶子、不再产生新数字。动作：把 ${l} + ${r} = ${l + r} 返回给父节点 ${VAL_OF[id.slice(0, -1)]}。为什么：中间节点的返回值只用于向上汇总，累加只发生在叶子处，不会重复计数。`,
      })
    )
    return l + r
  }

  const answer = dfs(ROOT_ID, 0)
  const nums = leafIds.map((id) => numAt[id])

  steps.push(
    snap({
      phase: 'done',
      curNum: answer,
      ret: answer,
      note: `观察：DFS 遍历结束，${leafIds.length} 条根到叶路径的数字分别是 ${nums.join('、')}。判断：${nums.join(' + ')} = ${answer}，正好是全部路径数字之和。动作：dfs(root, 0) 返回 ${answer}，答案就读作这个返回值。为什么：每个节点只被访问一次，时间 O(n)；递归栈最深等于树高 h，空间 O(h)。`,
    })
  )

  // 「下一步动作」由后一个快照统一回填，保证 Hint 描述的一定是真正的下一步
  steps.forEach((s, i) => {
    const b = steps[i + 1]
    if (!b) return
    const bv = b.cur === null ? 0 : VAL_OF[b.cur]
    if (b.phase === 'done') s.next = 'DFS 已走完全部路径，读出返回值'
    else if (b.phase === 'leaf')
      s.next = `下降进入叶节点 ${bv}：cur = ${b.from} × 10 + ${bv} = ${b.curNum}，并累加进 sum`
    else if (b.phase === 'enter')
      s.next = `下降进入节点 ${bv}：cur = ${b.from} × 10 + ${bv} = ${b.curNum}`
    else s.next = `回溯节点 ${bv}：左右子树返回值相加得到 ${b.ret}`
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

const W = 680
const PAD_L = 66
const PAD_R = 66
const NODE_R = 22
const TOP = 52
const LEVEL_GAP = 78
const H = TOP + MAX_DEPTH * LEVEL_GAP + NODE_R + 28
const SLOT = (W - PAD_L - PAD_R) / ORDER.length

type NodeState = 'current' | 'path' | 'num' | 'leaf' | 'idle'

const FILL: Record<NodeState, string> = {
  current: 'hsl(var(--amber-soft))',
  path: 'hsl(var(--paper))',
  num: 'hsl(var(--teal-soft))',
  leaf: 'hsl(var(--easy-soft))',
  idle: 'hsl(var(--ink) / 0.18)',
}

const STROKE: Record<NodeState, string> = {
  current: 'hsl(var(--amber))',
  path: 'hsl(var(--amber))',
  num: 'hsl(var(--teal))',
  leaf: 'hsl(var(--easy))',
  idle: 'hsl(var(--border))',
}

const STROKE_W: Record<NodeState, number> = {
  current: 3,
  path: 2.5,
  num: 2.5,
  leaf: 2.5,
  idle: 2,
}

const VALUE_FILL: Record<NodeState, string> = {
  current: 'hsl(var(--amber))',
  path: 'hsl(var(--ink))',
  num: 'hsl(var(--teal))',
  leaf: 'hsl(var(--easy))',
  idle: 'hsl(var(--ink-soft))',
}

function Stage(step: Step) {
  const x = (id: string) => PAD_L + SLOT * (ORDER.indexOf(id) + 0.5)
  const y = (id: string) => TOP + DEPTH_OF[id] * LEVEL_GAP

  const stateOf = (id: string): NodeState => {
    if (step.leafIds.includes(id)) return 'leaf'
    if (step.cur === id) return 'current'
    if (step.path.includes(id)) return 'path'
    if (id in step.numAt) return 'num'
    return 'idle'
  }

  const leafNums = step.leafIds.map((id) => step.numAt[id])

  const sideLabel = (id: string, st: NodeState): string | null => {
    if (st === 'leaf') return step.cur === id ? '累加' : null
    if (st === 'current') return step.phase === 'return' ? '回溯' : '添位'
    if (st === 'path') return '路径中'
    return null
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full select-none">
        {/* 1. 边：直线连接父子，后画的节点圆盖住端点 */}
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
                stroke={
                  step.cur === child.id
                    ? 'hsl(var(--amber))'
                    : child.id in step.numAt
                      ? 'hsl(var(--teal))'
                      : 'hsl(var(--border))'
                }
                strokeWidth={step.cur === child.id ? 2.5 : 2}
              />
            ))
        )}

        {/* 2. 节点圆 */}
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
                strokeDasharray={st === 'path' ? '5 4' : undefined}
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

        {/* 3. 节点小字：上方是 cur（叶子显示它贡献的数字），右侧是状态文字 */}
        {ORDER.map((id) => {
          const st = stateOf(id)
          const known = id in step.numAt
          const side = sideLabel(id, st)
          return (
            <g key={`label-${id}`}>
              {known && (
                <text
                  x={x(id)}
                  y={y(id) - NODE_R - 10}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="700"
                  className="font-code"
                  fill={
                    st === 'leaf'
                      ? 'hsl(var(--easy))'
                      : st === 'current'
                        ? 'hsl(var(--amber))'
                        : 'hsl(var(--teal))'
                  }
                >
                  {step.leafIds.includes(id) ? `+${step.numAt[id]}` : `cur=${step.numAt[id]}`}
                </text>
              )}
              {side && (
                <text
                  x={x(id) + NODE_R + 8}
                  y={y(id) + 4}
                  textAnchor="start"
                  fontSize="11"
                  fontWeight="700"
                  className="font-code"
                  fill={st === 'leaf' ? 'hsl(var(--easy))' : 'hsl(var(--amber))'}
                >
                  {side}
                </text>
              )}
            </g>
          )
        })}
      </svg>

      {/* 递归调用栈（栈顶在右侧，另有文字标注） */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px]">
        <span className="text-ink-soft">递归调用栈</span>
        {step.path.length === 0 ? (
          <span className="font-code text-ink-soft">
            {step.phase === 'init'
              ? '（空，尚未开始）'
              : step.phase === 'done'
                ? '（已全部返回）'
                : '（空，根节点正在回溯）'}
          </span>
        ) : (
          step.path.map((id, k) => (
            <span key={id} className="flex items-center gap-1.5">
              {k > 0 && <span className="text-ink-soft">→</span>}
              <span
                className={
                  k === step.path.length - 1
                    ? step.leafIds.includes(id)
                      ? 'rounded-md border border-[hsl(var(--easy))]/50 bg-[hsl(var(--easy-soft))] px-2 py-0.5 font-code font-semibold text-[hsl(var(--easy))]'
                      : 'rounded-md border border-[hsl(var(--amber))]/50 bg-[hsl(var(--amber-soft))] px-2 py-0.5 font-code font-semibold text-[hsl(var(--amber))]'
                    : 'rounded-md border border-border bg-card px-2 py-0.5 font-code text-ink-soft'
                }
              >
                dfs({VAL_OF[id]})
              </span>
              {k === step.path.length - 1 && (
                <span className="text-[10px] text-ink-soft">栈顶</span>
              )}
            </span>
          ))
        )}
      </div>

      <Badges className="justify-center">
        <Stat
          label="当前 cur"
          value={step.phase === 'init' ? 0 : step.phase === 'done' ? '—' : step.curNum}
          tone="amber"
        />
        <Stat label="已累加 sum" value={step.sum} tone="easy" />
        {leafNums.length === 0 ? (
          <Badge>还没有叶节点产生数字</Badge>
        ) : (
          <Badge tone="easy">
            叶贡献 <b className="font-code">{leafNums.join(' + ')}</b>
          </Badge>
        )}
        {step.phase !== 'done' && <Hint>{step.next}</Hint>}
        {step.phase === 'done' && (
          <Answer>
            <b className="font-code">{step.sum}</b>（{leafNums.join(' + ')}）
          </Answer>
        )}
      </Badges>
    </div>
  )
}

export default function SumRootToLeafNumbersDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="前序 DFS 携带前缀数字 cur 一路添位"
      info={`root = ${INPUT_TEXT}（题解示例 2，层序表示，null 为空节点），三条根到叶路径代表 495、491、40。演示完整 DFS，共 ${steps.length} 步；示例 1（[1,2,3]）规模更小但不含 0 值与单子树，为看清「边下降边添位」这里选用示例 2。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '当前节点（实线）/ 当前递归路径上的祖先（虚线）' },
        { color: TONE.teal, label: '已算出 cur 的节点与已走过的边（上方小字 cur=）' },
        { color: TONE.easy, label: '叶节点：数字已计入 sum（上方 +数字）' },
        { color: TONE.muted, label: '尚未访问' },
      ]}
    />
  )
}
