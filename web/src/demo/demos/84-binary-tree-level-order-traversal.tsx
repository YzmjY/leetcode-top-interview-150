import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badge, Badges, Cell, Hint, Stat, TONE } from './stage'

/* ------------------------------------------------------------------ */
/* 84. 二叉树的层序遍历 —— 模式 E：树 + 队列按 levelSize 快照逐层出队       */
/* ------------------------------------------------------------------ */

/** 题解示例 1 的层序数组，null 表示该位置没有节点；输出 [[3],[9,20],[15,7]] */
const LEVELS: (number | null)[] = [3, 9, 20, null, null, 15, 7]
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
/** 中序展开：同一层节点的 x 槽位按中序顺序分配（与题 68 的坐标换算一致） */
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

/** 树里出现过的深度，从小到大，用于画每层色块与层序号 */
const DEPTHS = Array.from(new Set(ORDER.map((id) => DEPTH_OF[id]))).sort((a, b) => a - b)

interface Step {
  phase: 'init' | 'level' | 'dequeue' | 'collect' | 'done'
  /** 本步出队的节点 id；没有出队动作（init / level / collect / done）时为 null */
  cur: string | null
  /** 队列快照，队首在左 */
  queue: string[]
  /** 已出队（已收集）节点 id 快照 */
  processed: string[]
  /** 已收集完成的各层结果快照 */
  result: number[][]
  /** 正在收集的这一层的值快照 */
  level: number[]
  /** 当前层序号（从 0 起） */
  levelIndex: number
  /** 出队前记下的 levelSize 快照 */
  levelSize: number
  /** 本层已出队个数 */
  levelDone: number
  /** 当前层所在深度，用于定位色块；init / done 为 -1 */
  levelDepth: number
  note: string
  /** 下一步动作，由后一个快照反推，保证 Hint 说的确实是下一步要做的事 */
  next: string
}

function buildSteps(): Step[] {
  const steps: Step[] = []
  const root = ROOT
  if (root === null) return steps

  const queue: TreeNode[] = []
  const processed: string[] = []
  const result: number[][] = []
  let level: number[] = []
  let levelIndex = 0
  let levelSize = 0
  let levelDone = 0
  let levelDepth = -1
  let cur: string | null = null

  const fmtRows = () => result.map((row) => `[${row.join(', ')}]`).join(', ')
  const fmtQueue = () => (queue.length === 0 ? '空' : queue.map((n) => n.val).join(', '))

  const snap = (phase: Step['phase'], note: string) => {
    steps.push({
      phase,
      cur,
      queue: queue.map((n) => n.id),
      processed: processed.slice(),
      result: result.map((row) => row.slice()),
      level: level.slice(),
      levelIndex,
      levelSize,
      levelDone,
      levelDepth,
      note,
      next: '',
    })
  }

  queue.push(root)
  snap(
    'init',
    `观察：输入是题解示例 1 的层序数组 ${INPUT_TEXT}，根节点 ${root.val} 已入队，结果数组还是空的。判断：队列此刻只有第 0 层的根节点，而「一层到哪里结束」必须靠出队前的队列长度 levelSize 记住。动作：进入外层循环，先给 levelSize 取快照，再按这个次数逐个出队。为什么：孩子入队会让 len(queue) 变大，只有先固定 levelSize，一轮内层循环才恰好只处理一层。`
  )

  while (queue.length > 0) {
    levelSize = queue.length
    levelDepth = DEPTH_OF[queue[0].id]
    level = []
    levelDone = 0
    cur = null
    snap(
      'level',
      `观察：第 ${levelIndex} 层开始，队列里是 [${fmtQueue()}]，正好是本层的 ${levelSize} 个节点。判断：队列此刻不含更深层的节点，所以 levelSize = ${levelSize} 就是这一层的边界。动作：新建空数组 level，准备连续出队 ${levelSize} 次，把本层的值收集起来。为什么：内层循环次数写死成这个快照值，后面孩子入队再多，也不会把下一层的节点混进本层的结果。`
    )

    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift()
      if (!node) break
      const left = node.left
      const right = node.right
      cur = node.id
      level.push(node.val)
      levelDone = i + 1
      if (left) queue.push(left)
      if (right) queue.push(right)
      processed.push(node.id)

      const kidText =
        left !== null && right !== null
          ? `它的左孩子 ${left.val}、右孩子 ${right.val} 都要入队`
          : left !== null
            ? `它只有左孩子 ${left.val}，要入队`
            : right !== null
              ? `它只有右孩子 ${right.val}，要入队`
              : '它没有孩子，队列不会加入新节点'

      snap(
        'dequeue',
        `观察：队首是 ${node.val}，它是第 ${levelIndex} 层的第 ${i + 1}/${levelSize} 个节点。判断：它的值属于本层，${kidText}，而这些孩子属于下一层。动作：把 ${node.val} 追加进 level，level = [${level.join(', ')}]，队列变为 [${fmtQueue()}]。为什么：孩子按「先左后右」入队，下一层出队时就自然是从左到右，而 levelSize 快照保证本轮不会碰到它们。`
      )
    }

    result.push(level.slice())
    cur = null
    snap(
      'collect',
      `观察：第 ${levelIndex} 层的 ${levelSize} 个节点全部出队，level = [${level.join(', ')}]。判断：这一层的值已按从左到右的顺序收集完整，可以整体追加进结果。动作：result 变为 ${fmtRows()}，第 ${levelIndex} 层到此结束。为什么：题目要求每一层单独成行，整层追加而不是逐个追加，才不会把不同层的值混进同一行。`
    )
    levelIndex += 1
  }

  levelDepth = -1
  cur = null
  levelSize = 0
  levelDone = 0
  const readout = result.map((row, k) => `第 ${k} 层 [${row.join(', ')}]`).join('、')
  snap(
    'done',
    `观察：队列已空，外层循环结束，result = ${fmtRows()}。判断：${result.length} 层的值都已按从左到右的顺序收集，结果的行数正好等于树的层数。动作：返回 result，读作${readout}。为什么：每个节点入队、出队各一次，时间 O(n)；队列最多同时保存一整层的节点，空间 O(w)，w 为树的最大宽度。`
  )

  // Hint 文案统一由后一个快照反推，保证「下一步」永远是真正要执行的动作
  steps.forEach((s, i) => {
    const b = steps[i + 1]
    if (!b) return
    if (b.phase === 'level') {
      s.next = `取 levelSize = ${b.levelSize} 的快照，开始第 ${b.levelIndex} 层`
    } else if (b.phase === 'dequeue') {
      const id = b.cur
      s.next =
        id === null
          ? '出队队首节点并写入 level'
          : `出队 ${VAL_OF[id]}（第 ${b.levelIndex} 层第 ${b.levelDone}/${b.levelSize} 个）并写入 level`
    } else if (b.phase === 'collect') {
      s.next = `把 level = [${b.level.join(', ')}] 整体追加进 result，结束第 ${b.levelIndex} 层`
    } else if (b.phase === 'done') {
      s.next = '队列已空，输出遍历结果'
    }
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

const W = 680
const H = 286
const PAD_L = 66
const PAD_R = 66
const NODE_R = 22
const TOP = 52
const LEVEL_GAP = 78
const BLOCK_PAD = 16

const SLOT = (W - PAD_L - PAD_R) / ORDER.length
const xOf = (id: string) => PAD_L + SLOT * (ORDER.indexOf(id) + 0.5)
const yOf = (id: string) => TOP + DEPTH_OF[id] * LEVEL_GAP
/** 当前层色块的水平范围：刚好包住这一层所有节点圆 */
function blockX(depth: number) {
  const xs = ORDER.filter((id) => DEPTH_OF[id] === depth).map(xOf)
  return { left: Math.min(...xs) - NODE_R - BLOCK_PAD, right: Math.max(...xs) + NODE_R + BLOCK_PAD }
}

type NodeState = 'current' | 'collected' | 'queued' | 'unseen'

/** current=本步出队的节点（实心 amber）；collected=已出队（实心 easy 绿）；
 *  queued=在队列中（teal 边）；unseen=尚未入队（18% ink 灰，与 TONE.muted 一致） */
const FILL: Record<NodeState, string> = {
  current: 'hsl(var(--amber))',
  collected: 'hsl(var(--easy))',
  queued: 'hsl(var(--teal-soft))',
  unseen: TONE.muted,
}

const STROKE: Record<NodeState, string> = {
  current: 'hsl(var(--amber))',
  collected: 'hsl(var(--easy))',
  queued: 'hsl(var(--teal))',
  unseen: 'hsl(var(--border))',
}

const STROKE_W: Record<NodeState, number> = {
  current: 3,
  collected: 2,
  queued: 2.5,
  unseen: 2,
}

const VALUE_FILL: Record<NodeState, string> = {
  current: 'hsl(var(--card))',
  collected: 'hsl(var(--card))',
  queued: 'hsl(var(--teal))',
  unseen: 'hsl(var(--ink-soft))',
}

/** 节点右侧的状态文字：状态不只靠颜色区分 */
const STATE_LABEL: Record<NodeState, string> = {
  current: '出队',
  collected: '已收集',
  queued: '队列中',
  unseen: '未入队',
}

const LABEL_FILL: Record<NodeState, string> = {
  current: 'hsl(var(--amber))',
  collected: 'hsl(var(--easy))',
  queued: 'hsl(var(--teal))',
  unseen: 'hsl(var(--ink-soft))',
}

function Stage(step: Step) {
  const done = step.phase === 'done'
  const block = step.levelDepth >= 0 ? blockX(step.levelDepth) : null
  const blockY = step.levelDepth >= 0 ? TOP + step.levelDepth * LEVEL_GAP - NODE_R - BLOCK_PAD : 0

  const stateOf = (id: string): NodeState => {
    if (step.cur === id) return 'current'
    if (step.processed.includes(id)) return 'collected'
    if (step.queue.includes(id)) return 'queued'
    return 'unseen'
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* 顶部：按层展示已收集的结果与层序号 */}
      <div className="flex w-full flex-wrap items-center justify-center gap-2">
        <span className="text-[11px] text-ink-soft">已收集结果</span>
        {step.result.length === 0 ? (
          <Badge>还没完成任何一层</Badge>
        ) : (
          step.result.map((row, k) => (
            <Badge key={`row-${k}`} tone="easy">
              第 <b className="font-code">{k}</b> 层{' '}
              <b className="font-code">[{row.join(', ')}]</b>
            </Badge>
          ))
        )}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full select-none">
        {/* 1. 当前层色块：垫在边与节点圆下面 */}
        {block && (
          <rect
            x={block.left}
            y={blockY}
            width={block.right - block.left}
            height={(NODE_R + BLOCK_PAD) * 2}
            rx={14}
            fill="hsl(var(--amber-soft))"
            stroke="hsl(var(--amber))"
            strokeWidth={1.5}
            strokeDasharray="6 4"
            className="demo-water"
          />
        )}

        {/* 2. 每层的层序号（层号用文字标出，不只靠色块位置） */}
        {DEPTHS.map((d) => (
          <text
            key={`depth-${d}`}
            x={8}
            y={TOP + d * LEVEL_GAP + 4}
            textAnchor="start"
            fontSize="11"
            fontWeight="700"
            className="font-code"
            fill={d === step.levelDepth ? 'hsl(var(--amber))' : 'hsl(var(--ink-soft))'}
          >
            第 {d} 层
          </text>
        ))}

        {/* 3. 边：直线连接父子，后画的节点圆盖住端点 */}
        {ORDER.map((id) =>
          [NODES[id].left, NODES[id].right]
            .filter((c): c is TreeNode => c !== null)
            .map((child) => (
              <line
                key={`${id}-${child.id}`}
                x1={xOf(id)}
                y1={yOf(id)}
                x2={xOf(child.id)}
                y2={yOf(child.id)}
                stroke="hsl(var(--border))"
                strokeWidth={2}
              />
            ))
        )}

        {/* 4. 节点圆 + 值 + 状态文字 */}
        {ORDER.map((id) => {
          const st = stateOf(id)
          return (
            <g key={id} className="demo-water">
              <circle
                cx={xOf(id)}
                cy={yOf(id)}
                r={NODE_R}
                fill={FILL[st]}
                stroke={STROKE[st]}
                strokeWidth={STROKE_W[st]}
              />
              <text
                x={xOf(id)}
                y={yOf(id) + 6}
                textAnchor="middle"
                fontSize="17"
                fontWeight="700"
                className="font-code"
                fill={VALUE_FILL[st]}
              >
                {VAL_OF[id]}
              </text>
              <text
                x={xOf(id) + NODE_R + 7}
                y={yOf(id) + 4}
                textAnchor="start"
                fontSize="11"
                fontWeight="600"
                className="font-code"
                fill={LABEL_FILL[st]}
              >
                {STATE_LABEL[st]}
              </text>
            </g>
          )
        })}

        {/* 5. 说明：null 位置不占舞台 */}
        <text
          x={W / 2}
          y={H - 8}
          textAnchor="middle"
          fontSize="11"
          className="font-code"
          fill="hsl(var(--ink-soft))"
        >
          示例 1 共 7 个节点、3 层；null 位置没有节点，不画在舞台上
        </text>
      </svg>

      {/* 队列条：队首在左，与舞台上的 teal 节点是同一批待处理节点 */}
      <div className="flex w-full flex-wrap items-center justify-center gap-1.5">
        <span className="text-[11px] text-ink-soft">队列（队首在左）</span>
        {step.queue.length === 0 ? (
          <span className="font-code text-[11px] text-ink-soft">（空）</span>
        ) : (
          step.queue.map((id, k) => (
            <Cell key={`${id}-${k}`} size="sm" state="new" className="min-w-0">
              {VAL_OF[id]}
            </Cell>
          ))
        )}
      </div>

      <Badges className="justify-center">
        <Stat
          label="本层进度 i/levelSize"
          value={done || step.phase === 'init' ? '—' : `${step.levelDone}/${step.levelSize}`}
          tone="amber"
        />
        <Stat label="队列长度" value={step.queue.length} tone="teal" />
        {!done && step.next && <Hint>{step.next}</Hint>}
        {done && (
          <Answer>
            <b className="font-code">
              [{step.result.map((row) => `[${row.join(', ')}]`).join(', ')}]
            </b>
            （共 <b className="font-code">{step.result.length}</b> 层）
          </Answer>
        )}
      </Badges>
    </div>
  )
}

export default function BinaryTreeLevelOrderTraversalDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="队列 + levelSize 快照，一层一层出队"
      info={`示例取自题解「示例 1」root = ${INPUT_TEXT}（层序表示，null 为空节点），期望输出 [[3], [9, 20], [15, 7]]；演示按 levelSize 快照逐层出队，共 13 步。示例 2 只有单节点、示例 3 是空树，都演示不出「分层」的关键过程，因此只用示例 1 的这棵树。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '当前层色块 / 本步出队的节点' },
        { color: TONE.easy, label: '已出队（已收集）' },
        { color: TONE.teal, label: '队列中待处理' },
        { color: TONE.muted, label: '尚未入队' },
      ]}
    />
  )
}
