import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badges, Hint, Stat, TONE } from './stage'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/* 102. 组合 —— 模式 E：递归决策树 + 已选路径（start 推进 + 上界剪枝）    */
/* ------------------------------------------------------------------ */

/** 固定示例输入：题解示例 1（n = 4, k = 2），是能同时看清剪枝与回溯的最小规模 */
const N = 4
const K = 2
const TOTAL = 6

/* ---------------- 决策树（第 k 层深度固定，手写层坐标，非力导向） ---------------- */

interface TreeNode {
  id: string
  /** 本节点选入的数；根节点为 null */
  val: number | null
  /** 已选个数 = 层号 */
  depth: number
  /** 本层候选起点 start */
  start: number
  /** 收集到结果时为该组合的副本；否则为 null */
  solution: number[] | null
  kids: TreeNode[]
}

function makeNode(id: string, val: number | null, depth: number, start: number): TreeNode {
  return { id, val, depth, start, solution: null, kids: [] }
}

const ROOT = makeNode('R', null, 0, 1)

function grow(node: TreeNode) {
  if (node.depth === K) {
    node.solution = []
    return
  }
  const bound = N - (K - node.depth) + 1
  for (let i = node.start; i <= bound; i++) {
    const child = makeNode(`${node.id}i${i}`, i, node.depth + 1, i + 1)
    if (child.depth === K) child.solution = [i]
    grow(child)
    node.kids.push(child)
  }
}
grow(ROOT)

const NODES: TreeNode[] = (function flat(n: TreeNode): TreeNode[] {
  return [n, ...n.kids.flatMap(flat)]
})(ROOT)

const BY_ID: Record<string, TreeNode> = {}
NODES.forEach((n) => (BY_ID[n.id] = n))

const CHILD_OF: Record<string, string> = {}
NODES.forEach((n) => n.kids.forEach((kid) => (CHILD_OF[kid.id] = n.id)))

/** 中序（叶子自左向右）展开：同一层按槽位均匀取 x，层号决定 y */
const SLOT_OF: Record<string, number> = {}
let cursor = 0
;(function place(n: TreeNode): number {
  if (n.kids.length === 0) {
    SLOT_OF[n.id] = cursor++
    return SLOT_OF[n.id]
  }
  const xs = n.kids.map(place)
  const mid = (xs[0]! + xs[xs.length - 1]!) / 2
  SLOT_OF[n.id] = mid
  return mid
})(ROOT)
const LEAF_SLOTS = cursor

/** 空的叶子（候选上界 < start）就是被剪掉的死分支 */
const isDeadEnd = (n: TreeNode) => n.depth === K && n.kids.length === 0

/* ---------------- 步骤数据 ---------------- */

interface Step {
  phase: 'init' | 'focus' | 'choose' | 'exhaust' | 'done'
  /** 本步聚焦的节点 */
  cur: string | null
  /** 根到当前层的已选路径（不可变副本） */
  path: number[]
  /** 尚未回溯的节点 = 递归调用栈 */
  queued: string[]
  /** 已收集成解的叶子 */
  found: string[]
  /** 已确认走不通的剪枝分支 */
  pruned: string[]
  /** 本层的候选上界 n − (k − len(path)) + 1 */
  bound: number | null
  /** 本步试着放入的数 */
  picked: number | null
  /** 已收集的组合，按题解代码的字典序 */
  results: number[]
  note: string
  /** 由后一个快照回填的「下一步」动作 */
  next: string
}

function buildSteps(): Step[] {
  const steps: Step[] = []
  const path: number[] = []
  const queued: string[] = []
  const found: string[] = []
  const pruned: string[] = []
  const results: number[] = []

  const snap = (
    phase: Step['phase'],
    cur: string | null,
    note: string,
    extra: { bound?: number | null; picked?: number | null } = {}
  ): Step => ({
    phase,
    cur,
    path: path.slice(),
    queued: queued.slice(),
    found: found.slice(),
    pruned: pruned.slice(),
    bound: extra.bound ?? null,
    picked: extra.picked ?? null,
    results: results.slice(),
    note,
    next: '',
  })

  const pathText = () => (path.length === 0 ? '[]' : `[${path.join(', ')}]`)

  steps.push(
    snap(
      'init',
      ROOT.id,
      `观察：要在 1..${N} 里选 ${K} 个数的全部组合，本质是按递归决策树做 DFS——第 i 层决定组合里的第 i 个数选谁。判断：组合不区分顺序，所以每层只从 start 及之后的数里选（选了 x 就递归 start = x + 1），路径上的数字必然严格递增。动作：path = []、result = []，从 backtrack(1) 开始，path 长度到 ${K} 就收集成一个组合。为什么：递增写法让 [1,2] 与 [2,1] 等同一个序列，天然不重复；start 只增不减又保证不遗漏。`
    )
  )

  function walk(node: TreeNode) {
    if (isDeadEnd(node)) {
      // 空叶子：上层刚试的 i 越过上界，这条分支作废
      pruned.push(node.id)
      const pv = node.val as number
      steps.push(
        snap(
          'focus',
          node.id,
          `观察：本层 start = ${node.start}，而剪枝上界 ${N} − (${K} − ${node.depth}) + 1 = ${node.start - 1} 已经小于 start。判断：即使把剩下的数全选上也凑不满 k = ${K} 个。动作：循环一次都不执行，直接 return，${pv} 这条分支记为剪枝。为什么：它砍掉的都是必然无解的分支，所以答案既不重复也不遗漏。`,
          { bound: node.start - 1 }
        )
      )
      return
    }

    if (node.depth === K) {
      const sol = node.solution as number[]
      results.push(sol[0] as number)
      found.push(node.id)
      steps.push(
        snap(
          'focus',
          node.id,
          `观察：path = ${pathText()}，长度正好等于 k = ${K}。判断：这 ${K} 个数已经构成一个合法组合，不必再往深处选。动作：把 path 拷贝成 [${sol.join(', ')}] 收进 result（必须拷贝，复用的 path 后面还会被改动），然后 return 回上一层。为什么：只在长度等于 k 时收集，结果才不会缺数或多数。`
        )
      )
      return
    }

    const bound = N - (K - node.depth) + 1
    const val = node.val as number
    queued.push(node.id)
    steps.push(
      snap(
        'focus',
        node.id,
        node.depth === 0
          ? `观察：进入 backtrack(1)，path 还是空的。判断：第 ${K} 层选满就收工，所以整棵树深度固定为 k = ${K}；本层候选是 i = 1..${bound}。动作：从 i = ${node.start} 开始逐个尝试，每个 i 都会长出一条子树。为什么：枚举前先算好上界 ${bound}，就能把凑不满 ${K} 个数的分支整条跳过。`
          : `观察：沿 ${pathText()} 进入本层，start = ${node.start}，还需要选 ${K - node.depth} 个数。判断：候选区间是 [${node.start}, ${N}]，只有 n − i + 1 ≥ k − len(path) 才可能凑够，即 i ≤ ${N} − (${K} − ${node.depth}) + 1 = ${bound}。动作：在 i = ${node.start}..${bound} 里逐个把数字压入 path 并递归下一层。为什么：上界之外的 i 后面注定填不满 k 个位置，提前排除就是剪枝。`,
        { bound }
      )
    )

    for (let i = node.start; i <= bound; i++) {
      const kid = node.kids[i - node.start]
      if (!kid) break

      if (isDeadEnd(kid)) {
        // 剩余数字不够：本层枚举到此为止，不再递归
        pruned.push(kid.id)
        steps.push(
          snap(
            'choose',
            node.id,
            `观察：本层试 i = ${i}，放入它之后还差 ${K - kid.depth} 个数，而 [${i + 1}, ${N}] 里只剩 ${N - i} 个。判断：i = ${i} 已经越过剪枝上界 ${bound}，${i} 这条分支不可能产出合法组合。动作：标记成剪枝死路（红色虚线），不进入递归，本层枚举随之结束。为什么：凑不满 ${K} 个数的分支注定无解，砍掉它省下的是整棵子树的无用搜索。`,
            { bound, picked: i }
          )
        )
        break
      }

      // 选择分支：path 里已含 kid 的值，交给子节点自己展开
      path.push(i)
      steps.push(
        snap(
          'choose',
          node.id,
          `观察：本层候选 i = ${node.start}..${bound}，现在试 i = ${i}，它比上一层选的数都大，不会产生重复组合。判断：把 ${i} 压入 path 后得到 ${pathText()}（长度 ${path.length}），${kid.depth === K ? `已经选满 k = ${K} 个数，下一层就该收集结果` : `还需要 ${K - kid.depth} 个数，下一层的 start = ${i + 1}`}。动作：递归 ${kid.depth === K ? '进入这个叶节点' : `backtrack(${i + 1})`}，它返回后再 pop 掉 ${i} 继续试更大的数。为什么：组合内数字递增这一条约束，正是「每个组合只被生成一次」的全部依据。`,
          { bound, picked: i }
        )
      )
      walk(kid)
      path.pop()
    }

    queued.pop()
    if (node.depth > 0) path.pop()
    steps.push(
      snap(
        'exhaust',
        node.id,
        `观察：本层 i = ${node.start}..${bound} 全部试完。判断：这些分支要么已经收进 result，要么已被剪枝，本层没有别的可能。动作：pop 掉路径末尾的 ${val}，把控制权还给上一层继续试更大的数。为什么：回溯必须弹出元素——path 是复用的数组，忘记 pop 会让后面的分支带着多余的数继续。`,
        { bound }
      )
    )
  }

  walk(ROOT)

  steps.push(
    snap(
      'done',
      null,
      `观察：backtrack(1) 的整棵决策树走完了，result 里共 ${results.length} 个组合：[${results
        .map((v) => `[${v}]`)
        .join(', ')}]。判断：每个组合恰好被生成一次——递增路径保证不重，上界剪枝只砍无解分支，所以不漏。动作：返回 result，题目允许任意顺序，题解代码给出的是字典序。为什么：叶子数就是 C(${N}, ${K}) = ${TOTAL}，每个叶子做一次 O(k) 拷贝，时间 O(C(n,k) × k)；path 与递归栈都不超过 k 个数，空间 O(k)。`
    )
  )

  // 「下一步动作」由后一个快照推导，保证 Hint 与步骤数据完全一致
  steps.forEach((s, i) => {
    const b = steps[i + 1]
    if (!b) return
    if (b.phase === 'done') s.next = '整棵树已走完，输出 result'
    else if (b.phase === 'choose') s.next = `在本层试 i = ${b.picked}（上界 ${b.bound}）`
    else if (b.phase === 'exhaust') s.next = `pop 掉 ${s.path[s.path.length - 1]}，回到上一层`
    else s.next = `访问节点 ${b.path.length === 0 ? 'backtrack(1)' : `[${b.path.join(', ')}]`}`
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

const W = 720
const H = 340
const PAD_L = 52
const PAD_R = 52
const TOP = 56
const LEVEL_GAP = 85
const NODE_R = 17

/** 节点状态：当前 / 递归栈中 / 已收集成解 / 已剪枝 / 未扫描 */
type NodeState = 'current' | 'stack' | 'found' | 'pruned' | 'idle'

const FILL: Record<NodeState, string> = {
  current: 'hsl(var(--amber-soft))',
  stack: 'hsl(var(--card))',
  found: 'hsl(var(--easy-soft))',
  pruned: 'hsl(var(--hard-soft))',
  idle: 'hsl(var(--card))',
}

const STROKE: Record<NodeState, string> = {
  current: 'hsl(var(--amber))',
  stack: 'hsl(var(--teal))',
  found: 'hsl(var(--easy))',
  pruned: 'hsl(var(--hard))',
  idle: 'hsl(var(--border))',
}

const STROKE_W: Record<NodeState, number> = {
  current: 3.5,
  stack: 2.2,
  found: 2.2,
  pruned: 2.2,
  idle: 1.6,
}

const VALUE_FILL: Record<NodeState, string> = {
  current: 'hsl(var(--amber))',
  stack: 'hsl(var(--teal))',
  found: 'hsl(var(--easy))',
  pruned: 'hsl(var(--hard))',
  idle: 'hsl(var(--ink-soft))',
}

const PHASE_LABEL: Record<Step['phase'], string> = {
  init: '初始化',
  focus: '访问节点',
  choose: '选择分支',
  exhaust: '回溯',
  done: '完成',
}

function Stage(step: Step) {
  const x = (id: string) => PAD_L + ((W - PAD_L - PAD_R) / LEAF_SLOTS) * (SLOT_OF[id] + 0.5)
  const y = (id: string) => TOP + BY_ID[id].depth * LEVEL_GAP

  const stateOf = (id: string): NodeState => {
    if (step.cur === id) return 'current'
    if (step.queued.includes(id)) return 'stack'
    if (step.found.includes(id)) return 'found'
    if (step.pruned.includes(id)) return 'pruned'
    return 'idle'
  }

  const curVal = step.picked ?? (step.cur ? BY_ID[step.cur].val : null)
  const curLabel =
    curVal === null ? '整棵树已结束' : `节点 ${curVal}${step.cur === ROOT.id ? '（根）' : ''}`

  return (
    <div className="flex flex-col items-center gap-4">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full select-none">
        {/* 1. 边：父 → 子直线，后画的圆盖住端点 */}
        {NODES.filter((n) => n.kids.length > 0).map((n) =>
          n.kids.map((kid) => {
            const parentOnPath = step.queued.includes(n.id)
            const kidOnPath = step.queued.includes(kid.id)
            const kidFound = step.found.includes(kid.id)
            const kidDead = step.pruned.includes(kid.id)
            const taken = step.cur === kid.id || kidFound || (parentOnPath && kidOnPath)
            return (
              <line
                key={`${n.id}-${kid.id}`}
                x1={x(n.id)}
                y1={y(n.id) + NODE_R}
                x2={x(kid.id)}
                y2={y(kid.id) - NODE_R}
                stroke={
                  kidDead
                    ? 'hsl(var(--hard))'
                    : kidFound
                      ? 'hsl(var(--easy))'
                      : taken
                        ? 'hsl(var(--amber))'
                        : 'hsl(var(--border))'
                }
                strokeWidth={step.cur === kid.id ? 3 : taken ? 2.4 : 1.8}
                strokeDasharray={kidDead ? '5 4' : undefined}
              />
            )
          })
        )}

        {/* 2. 节点圆：圆内是选入的数，根节点用 · 表示空路径 */}
        {NODES.map((n) => {
          const st = stateOf(n.id)
          return (
            <g key={n.id}>
              <circle
                cx={x(n.id)}
                cy={y(n.id)}
                r={NODE_R}
                fill={FILL[st]}
                stroke={STROKE[st]}
                strokeWidth={STROKE_W[st]}
              />
              <text
                x={x(n.id)}
                y={y(n.id) + 5}
                textAnchor="middle"
                fontSize="14"
                fontWeight="700"
                className="font-code"
                fill={VALUE_FILL[st]}
              >
                {n.val === null ? '·' : n.val}
              </text>
            </g>
          )
        })}

        {/* 3. 文字状态标签：不靠颜色也能分辨节点状态 */}
        <text
          x={x(ROOT.id)}
          y={y(ROOT.id) - NODE_R - 9}
          textAnchor="middle"
          fontSize="11"
          fontWeight="700"
          className="font-code"
          fill="hsl(var(--ink-soft))"
        >
          backtrack(1)
        </text>
        {NODES.filter((n) => n.depth === 1).map((n) => (
          <text
            key={`start-${n.id}`}
            x={x(n.id)}
            y={y(n.id) - NODE_R - 7}
            textAnchor="middle"
            fontSize="10.5"
            fontWeight="700"
            className="font-code"
            fill="hsl(var(--teal))"
          >
            start={n.start}
          </text>
        ))}
        {NODES.map((n) => {
          const st = stateOf(n.id)
          if (st === 'current') {
            return (
              <text
                key={`tag-${n.id}`}
                x={x(n.id)}
                y={y(n.id) + NODE_R + 15}
                textAnchor="middle"
                fontSize="10.5"
                fontWeight="700"
                className="font-code"
                fill="hsl(var(--amber))"
              >
                当前
              </text>
            )
          }
          if (st === 'found') {
            return (
              <text
                key={`tag-${n.id}`}
                x={x(n.id)}
                y={y(n.id) + NODE_R + 15}
                textAnchor="middle"
                fontSize="10.5"
                fontWeight="700"
                className="font-code"
                fill="hsl(var(--easy))"
              >
                已收集
              </text>
            )
          }
          if (st === 'pruned') {
            return (
              <text
                key={`tag-${n.id}`}
                x={x(n.id)}
                y={y(n.id) + NODE_R + 15}
                textAnchor="middle"
                fontSize="10.5"
                fontWeight="700"
                className="font-code"
                fill="hsl(var(--hard))"
              >
                剪枝
              </text>
            )
          }
          if (st === 'stack') {
            return (
              <text
                key={`tag-${n.id}`}
                x={x(n.id)}
                y={y(n.id) + NODE_R + 15}
                textAnchor="middle"
                fontSize="10.5"
                fontWeight="600"
                className="font-code"
                fill="hsl(var(--teal))"
              >
                栈中
              </text>
            )
          }
          return null
        })}

        {/* 0. 左上角：本步所处阶段与焦点节点，保证文字可读、不只靠颜色 */}
        <text x={14} y={20} fontSize="11" fontWeight="700" className="font-code" fill="hsl(var(--amber))">
          {PHASE_LABEL[step.phase]}
        </text>
        <text x={14} y={35} fontSize="11" className="font-code" fill="hsl(var(--ink-soft))">
          {curLabel}
        </text>

        <text
          x={W / 2}
          y={H - 10}
          textAnchor="middle"
          fontSize="11"
          className="font-code"
          fill="hsl(var(--ink-soft))"
        >
          决策树第 i 层决定组合里第 i 个数，深度固定为 k = {K}
        </text>
      </svg>

      {/* 当前 path：递归不变量的可视化，栈顶在右 */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px]">
        <span className="text-ink-soft">已选路径 path</span>
        {step.path.length === 0 ? (
          <span className="font-code text-ink-soft">
            {step.phase === 'done' ? '（已回溯清空）' : '（空）'}
          </span>
        ) : (
          step.path.map((v, i) => (
            <span key={`${v}-${i}`} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-ink-soft">→</span>}
              <span
                className={cn(
                  'rounded-md border px-2 py-0.5 font-code',
                  i === step.path.length - 1
                    ? 'border-[hsl(var(--amber))]/50 bg-[hsl(var(--amber-soft))] font-semibold text-[hsl(var(--amber))]'
                    : 'border-border bg-card text-ink-soft'
                )}
              >
                {v}
              </span>
              {i === step.path.length - 1 && (
                <span className="text-[10px] text-ink-soft">栈顶</span>
              )}
            </span>
          ))
        )}
      </div>

      {/* 已收集的组合：空位表示还没找到 */}
      <div className="w-full max-w-xl">
        <div className="mb-1.5 text-center text-[11px] text-ink-soft">
          已收集组合 <span className="font-code">{step.results.length}</span> /{' '}
          <span className="font-code">{TOTAL}</span>
        </div>
        <div className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-1.5 sm:grid-cols-[repeat(3,minmax(0,1fr))]">
          {Array.from({ length: TOTAL }, (_, i) => {
            const done = i < step.results.length
            return (
              <div
                key={i}
                className={cn(
                  'flex h-9 w-full min-w-0 items-center justify-center rounded-md border-[1.5px] font-code text-[13px] font-semibold transition-all duration-200 sm:min-w-0',
                  done
                    ? 'border-[hsl(var(--easy))] bg-[hsl(var(--easy-soft))] text-[hsl(var(--easy))]'
                    : 'border-dashed border-border bg-card text-ink-soft'
                )}
              >
                {done ? `[${step.results[i]}]` : '·'}
              </div>
            )
          })}
        </div>
      </div>

      <Badges className="justify-center">
        <Stat
          label="path"
          value={step.path.length === 0 ? '[]' : `[${step.path.join(', ')}]`}
          tone="amber"
        />
        <Stat label="已收集组合" value={step.results.length} tone="easy" />
        <Stat label="已剪枝分支" value={step.pruned.length} tone="hard" />
        {step.phase !== 'done' && step.next && <Hint>{step.next}</Hint>}
        {step.phase === 'done' && (
          <Answer>
            <b className="font-code">{step.results.length}</b> 个组合 ={' '}
            <b className="font-code">
              [{step.results.map((v) => `[${v}]`).join(', ')}]
            </b>
          </Answer>
        )}
      </Badges>
    </div>
  )
}

export default function CombinationsDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="递归决策树枚举组合：start 推进 + 上界剪枝"
      info={`输入：n = ${N}，k = ${K}（题解示例 1，能同时看清剪枝与回溯的最小规模；n = 1, k = 1 只有一个组合，看不出剪枝）。每层候选上界 i ≤ n − (k − len(path)) + 1 在枚举前就砍掉凑不满 k 个的分支，路径数字严格递增保证不重复。C(4,2) = ${TOTAL} 个组合，共 ${steps.length} 步。`}
      steps={steps}
      autoMs={1500}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '当前访问的节点 / 本层正在试的数' },
        { color: TONE.teal, label: '递归栈中已展开、尚未回溯的节点' },
        { color: TONE.easy, label: '已收集成解的叶子（path 已满 k 个）' },
        { color: TONE.hard, label: '剪枝的死分支（红色虚线，凑不满 k 个）' },
        { color: TONE.muted, label: '尚未扫描到的节点' },
      ]}
    />
  )
}
