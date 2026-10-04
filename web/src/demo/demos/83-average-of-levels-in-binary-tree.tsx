import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badges, Hint, Stat, TONE } from './stage'

/* ------------------------------------------------------------------ */
/* 83. 二叉树的层平均值 —— 模式 E：SVG 树 + 层序（BFS）逐层求和再平均     */
/* ------------------------------------------------------------------ */

/** 官方示例 1 的层序数组，null 表示该位置没有节点（3 层 5 个节点） */
const LEVELS: (number | null)[] = [3, 9, 20, null, null, 15, 7]
const INPUT_TEXT = `[${LEVELS.map((v) => (v === null ? 'null' : v)).join(', ')}]`

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

const ROOT = buildTree(LEVELS, 0, 'R') as TreeNode

const NODES: Record<string, TreeNode> = {}
const VAL_OF: Record<string, number> = {}
const DEPTH_OF: Record<string, number> = {}
/** 中序展开：同一层节点的 x 槽位按中序顺序分配，父子连线不会交叉 */
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

const MAX_DEPTH = Math.max(...Object.values(DEPTH_OF))
const LEVELS_OF_TREE = Array.from({ length: MAX_DEPTH + 1 }, (_, d) => d)

/** 3 → "3"，14.5 → "14.5"（题解示例 1 的三个平均值都是有限小数） */
function fmt(v: number): string {
  return Number.isInteger(v) ? String(v) : String(Math.round(v * 1e5) / 1e5)
}

interface Step {
  phase: 'init' | 'levelStart' | 'pop' | 'levelEnd' | 'done'
  /** 本步出队的节点 id；其余步为 null */
  cur: string | null
  /** 正在处理（或刚处理完）的层号 */
  level: number
  /** 本层节点数快照 levelSize；尚未开始时为 0 */
  levelSize: number
  /** 本层累加和 */
  levelSum: number
  /** 本层已累加个数 */
  levelCount: number
  /** 已求出平均值的层（不可变快照） */
  results: { level: number; avg: number }[]
  /** 队列快照，队首在左 */
  queue: string[]
  /** 本层已累加过的节点（不可变快照） */
  processed: string[]
  /** 本步用琥珀色块标出的层；没有则为 null */
  activeLevel: number | null
  /** 下一步动作，由后一个快照统一回填 */
  next: string
  note: string
}

function buildSteps(): Step[] {
  const steps: Step[] = []
  const queue: TreeNode[] = [ROOT]
  const processed: string[] = []
  const results: { level: number; avg: number }[] = []
  let level = 0
  let levelSize = 0
  let sum = 0
  let count = 0
  let activeLevel: number | null = 0
  let cur: string | null = null

  const snap = (phase: Step['phase'], note: string) => {
    steps.push({
      phase,
      cur,
      level,
      levelSize,
      levelSum: sum,
      levelCount: count,
      results: results.map((r) => ({ level: r.level, avg: r.avg })),
      queue: queue.map((n) => n.id),
      processed: processed.slice(),
      activeLevel,
      next: '',
      note,
    })
  }

  snap(
    'init',
    `观察：root = ${INPUT_TEXT} 是一棵 3 层、5 个节点的二叉树，null 表示该位置没有节点。` +
      `判断：题目要每一层的平均值，就得先把节点按层分组，而层序（BFS）队列弹出的顺序天然就是按层的。` +
      `动作：把根节点 ${VAL_OF[ROOT.id]} 入队，本层累加器 sum 与 count 清零，第 0 层标记为处理中。` +
      `为什么：只要队列里始终只含「本层剩余节点 + 刚入队的下一层节点」，弹出完本层后剩下的就恰好是下一层。`
  )

  while (queue.length > 0) {
    levelSize = queue.length
    level = DEPTH_OF[queue[0].id]
    activeLevel = level
    sum = 0
    count = 0
    cur = null
    const front = queue.map((n) => n.val).join('、')
    snap(
      'levelStart',
      `观察：队列里此刻是 ${front}，共 ${levelSize} 个节点，它们的层号都是 ${level}。` +
        `判断：队列长度就是第 ${level} 层的节点数，先把它记成 levelSize = ${levelSize}，再清零 sum 与 count。` +
        `动作：开始第 ${level} 层的内层循环，逐个弹出队首节点并累加。` +
        `为什么：levelSize 必须在出队前保存快照，否则子节点入队会让队列变长、把两层混进同一个内层循环。`
    )

    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift() as TreeNode
      cur = node.id
      sum += node.val
      count += 1
      const kids: number[] = []
      if (node.left) {
        queue.push(node.left)
        kids.push(node.left.val)
      }
      if (node.right) {
        queue.push(node.right)
        kids.push(node.right.val)
      }
      processed.push(node.id)
      const rest = levelSize - i - 1
      snap(
        'pop',
        `观察：第 ${i + 1}/${levelSize} 次出队的是节点 ${node.val}，${
          kids.length ? `它的孩子 ${kids.join('、')} 依次入队` : '它没有子节点'
        }。` +
          `判断：累加后 sum = ${sum}、count = ${count}，${
            rest > 0
              ? `第 ${level} 层还剩 ${rest} 个节点在队列里`
              : `第 ${level} 层的 ${levelSize} 个节点已全部弹出`
          }。` +
          `动作：${
            rest > 0
              ? `继续弹出队首的节点 ${queue[0].val}`
              : '内层循环结束，接着用 sum / count 求本层平均值'
          }。` +
          `为什么：入队的孩子总是排在队尾，所以内层循环只跑 levelSize 次就恰好清空本层，不会碰到下一层的节点。`
      )
    }

    cur = null
    const avg = sum / levelSize
    results.push({ level, avg })
    activeLevel = null
    const exact = Number.isInteger(avg)
    snap(
      'levelEnd',
      `观察：第 ${level} 层的 ${levelSize} 个节点已全部出队，sum = ${sum}、count = ${levelSize}。` +
        `判断：平均值 = ${sum} / ${levelSize} = ${fmt(avg)}${
          exact ? '' : '，这里必须用浮点数相除，整数除法会把 14.5 截断成 14'
        }。` +
        `动作：把 ${fmt(avg)} 追加到结果数组，第 ${level} 层完成；${
          queue.length > 0
            ? `队列里现在已是第 ${level + 1} 层的 ${queue.length} 个节点`
            : '队列此刻为空'
        }。` +
        `为什么：sum 与 count 都是本层专属的累加量，二者相除正好是题目要求的第 ${level} 层平均值。`
    )
  }

  activeLevel = null
  cur = null
  const levelList = results.map((r) => r.level).join('、')
  const avgList = results.map((r) => fmt(r.avg)).join('、')
  snap(
    'done',
    `观察：队列为空，第 ${levelList} 层都已算出平均值。` +
      `判断：结果数组按层号 ${results.map((r) => r.level).join(', ')} 依次是 ${avgList}。` +
      `动作：输出 [${results.map((r) => fmt(r.avg)).join(', ')}]。` +
      `为什么：每个节点只入队、出队、累加各一次，时间 O(n)；队列最多同时保存一整层，空间 O(w)（w 为最大层宽），再加上结果数组 O(h)。`
  )

  // 「下一步动作」由后一个快照统一推导，保证与步骤数据完全一致
  steps.forEach((s, i) => {
    const b = steps[i + 1]
    if (!b) return
    if (b.phase === 'levelStart') {
      s.next = `进入第 ${b.level} 层：记下 levelSize = ${b.levelSize}，sum 与 count 清零`
    } else if (b.phase === 'pop') {
      s.next = `从队首弹出节点 ${VAL_OF[b.cur as string]}，把它的值累加进 sum`
    } else if (b.phase === 'levelEnd') {
      s.next = `用 sum = ${b.levelSum} / count = ${b.levelCount} 求第 ${b.level} 层平均值`
    } else if (b.phase === 'done') {
      s.next = '队列已空，输出结果数组'
    }
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
const BAND_H = 72
const H = TOP + MAX_DEPTH * LEVEL_GAP + 48

type NodeState = 'current' | 'queued' | 'summed' | 'idle'

const NODE_FILL: Record<NodeState, string> = {
  current: 'hsl(var(--amber-soft))',
  queued: 'hsl(var(--teal-soft))',
  summed: 'hsl(var(--easy-soft))',
  idle: TONE.muted,
}

const NODE_STROKE: Record<NodeState, string> = {
  current: 'hsl(var(--amber))',
  queued: 'hsl(var(--teal))',
  summed: 'hsl(var(--easy))',
  idle: 'hsl(var(--border))',
}

const NODE_TEXT: Record<NodeState, string> = {
  current: 'hsl(var(--amber))',
  queued: 'hsl(var(--teal))',
  summed: 'hsl(var(--easy))',
  idle: 'hsl(var(--ink-soft))',
}

/** 状态文字标签：状态不靠颜色单独区分 */
const NODE_LABEL: Record<NodeState, string> = {
  current: '出队',
  queued: '队列',
  summed: '已累加',
  idle: '未入队',
}

/** 连线颜色跟随子节点状态，与图例同一套色 */
const EDGE: Record<NodeState, string> = {
  current: 'hsl(var(--amber))',
  queued: 'hsl(var(--teal))',
  summed: 'hsl(var(--easy))',
  idle: 'hsl(var(--border))',
}

function Stage(step: Step) {
  const slot = (W - PAD_L - PAD_R) / ORDER.length
  const x = (id: string) => PAD_L + slot * (ORDER.indexOf(id) + 0.5)
  const y = (id: string) => TOP + DEPTH_OF[id] * LEVEL_GAP

  const stateOf = (id: string): NodeState => {
    if (step.cur === id) return 'current'
    if (step.processed.includes(id)) return 'summed'
    if (step.queue.includes(id)) return 'queued'
    return 'idle'
  }

  const done = step.phase === 'done'
  const avgNow = step.levelCount > 0 ? step.levelSum / step.levelCount : null
  const avgOf = (d: number) => step.results.find((r) => r.level === d)?.avg

  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full select-none">
        {/* 1. 层色块：琥珀 = 正在处理的层，绿 = 已求出平均值的层 */}
        {LEVELS_OF_TREE.map((d) => {
          const active = step.activeLevel === d
          const finished = avgOf(d) !== undefined
          if (!active && !finished) return null
          const cy = TOP + d * LEVEL_GAP
          const tone = active ? 'hsl(var(--amber))' : 'hsl(var(--easy))'
          return (
            <g key={`band-${d}`}>
              <rect
                x={6}
                y={cy - BAND_H / 2}
                width={W - 12}
                height={BAND_H}
                rx={12}
                fill={active ? 'hsl(var(--amber-soft))' : 'hsl(var(--easy-soft))'}
              />
              <text
                x={16}
                y={cy - 10}
                fontSize="10"
                fontWeight="700"
                className="font-code"
                fill={tone}
              >
                第 {d} 层
              </text>
              <text x={16} y={cy + 6} fontSize="10" fontWeight="600" fill={tone}>
                {active ? '处理中' : '已完成'}
              </text>
            </g>
          )
        })}

        {/* 2. 边：直线连接父子，后画的节点圆盖住端点 */}
        {ORDER.map((id) =>
          [NODES[id].left, NODES[id].right]
            .filter((c): c is TreeNode => c !== null)
            .map((child) => {
              const cs = stateOf(child.id)
              return (
                <line
                  key={`${id}-${child.id}`}
                  x1={x(id)}
                  y1={y(id)}
                  x2={x(child.id)}
                  y2={y(child.id)}
                  stroke={EDGE[cs]}
                  strokeWidth={cs === 'current' ? 2.5 : 2}
                />
              )
            })
        )}

        {/* 3. 节点圆 */}
        {ORDER.map((id) => {
          const st = stateOf(id)
          return (
            <g key={id}>
              {st === 'current' && (
                <circle
                  cx={x(id)}
                  cy={y(id)}
                  r={NODE_R + 5}
                  fill="none"
                  stroke="hsl(var(--amber))"
                  strokeWidth={2}
                  strokeDasharray="4 3"
                />
              )}
              <circle
                cx={x(id)}
                cy={y(id)}
                r={NODE_R}
                fill={NODE_FILL[st]}
                stroke={NODE_STROKE[st]}
                strokeWidth={st === 'current' ? 3 : 2.5}
              />
              <text
                x={x(id)}
                y={y(id) + 6}
                textAnchor="middle"
                fontSize="17"
                fontWeight="700"
                className="font-code"
                fill={NODE_TEXT[st]}
              >
                {VAL_OF[id]}
              </text>
            </g>
          )
        })}

        {/* 4. 状态文字标签（出队 / 队列 在右侧，已累加 / 未入队 在节点上方） */}
        {ORDER.map((id) => {
          const st = stateOf(id)
          const onRight = st === 'current' || st === 'queued'
          return (
            <text
              key={`label-${id}`}
              x={onRight ? x(id) + NODE_R + 6 : x(id)}
              y={onRight ? y(id) + 4 : y(id) - NODE_R - 7}
              textAnchor={onRight ? 'start' : 'middle'}
              fontSize="11"
              fontWeight="700"
              fill={NODE_TEXT[st]}
            >
              {NODE_LABEL[st]}
            </text>
          )
        })}
      </svg>

      {/* 队列（队首在左，队首用琥珀标出并配文字） */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px]">
        <span className="text-ink-soft">队列（队首在左）</span>
        {step.queue.length === 0 ? (
          <span className="font-code text-ink-soft">（空）</span>
        ) : (
          step.queue.map((id, k) => (
            <span key={id} className="flex items-center gap-1.5">
              <span
                className={
                  k === 0
                    ? 'rounded-md border border-[hsl(var(--amber))]/50 bg-[hsl(var(--amber-soft))] px-2 py-0.5 font-code font-semibold text-[hsl(var(--amber))]'
                    : 'rounded-md border border-[hsl(var(--teal))]/50 bg-[hsl(var(--teal-soft))] px-2 py-0.5 font-code text-[hsl(var(--teal))]'
                }
              >
                {VAL_OF[id]}
              </span>
              {k === 0 && <span className="text-[10px] text-ink-soft">队首</span>}
            </span>
          ))
        )}
      </div>

      {/* 每算完一层就在这里留下一个绿色块，最终结果数组的顺序由此读出 */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px]">
        <span className="text-ink-soft">结果数组</span>
        {step.results.length === 0 ? (
          <span className="font-code text-ink-soft">（还没有算完的层）</span>
        ) : (
          step.results.map((r) => (
            <span
              key={r.level}
              className="rounded-md border border-[hsl(var(--easy))]/50 bg-[hsl(var(--easy-soft))] px-2 py-0.5 font-code font-semibold text-[hsl(var(--easy))]"
            >
              第 {r.level} 层 = {fmt(r.avg)}
            </span>
          ))
        )}
      </div>

      <Badges className="justify-center">
        {!done && <Stat label="本层和 sum" value={step.levelSum} tone="amber" />}
        {!done && <Stat label="本层个数 count" value={step.levelCount} tone="teal" />}
        {!done && (
          <Stat label="本层平均值" value={avgNow === null ? '—' : fmt(avgNow)} tone="easy" />
        )}
        {done && <Stat label="层数" value={step.results.length} tone="teal" />}
        {done && <Stat label="节点数" value={ORDER.length} tone="ink" />}
        {!done && step.next && <Hint>{step.next}</Hint>}
        {done && (
          <Answer>
            层平均值 ={' '}
            <b className="font-code">
              [{step.results.map((r) => fmt(r.avg)).join(', ')}]
            </b>
          </Answer>
        )}
      </Badges>
    </div>
  )
}

export default function AverageOfLevelsInBinaryTreeDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="层序遍历：逐层求和，再除以个数"
      info={`示例取自题解「示例 1」root = ${INPUT_TEXT}（层序表示，null 为空节点），这是一棵 3 层 5 个节点的树，输出 [3, 14.5, 11]；下面完整演示第 0、1、2 层的出队、累加与求平均，共 13 步，没有截断成子树。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '本步出队 / 正在处理的层（带「出队」标注）' },
        { color: TONE.teal, label: '队列中等待处理（带「队列」标注）' },
        { color: TONE.easy, label: '本层已累加 / 已求出平均值（带「已累加」标注）' },
        { color: TONE.muted, label: '尚未入队（带「未入队」标注）' },
      ]}
    />
  )
}
