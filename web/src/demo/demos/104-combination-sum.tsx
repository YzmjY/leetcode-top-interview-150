import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badge, Badges, Hint, Stat, TONE } from './stage'

/* ------------------------------------------------------------------ */
/* 104. 组合总和 —— 模式 E：递归决策树 + 剩余目标                        */
/* 可重复选取（下一层传 i）+ 升序剪枝（候选 > remaining 就 break）        */
/* ------------------------------------------------------------------ */

/** 固定示例输入：题解示例 1（candidates = [2,3,6,7]、target = 7，答案 [[2,2,3],[7]]） */
const CANDIDATES = [2, 3, 6, 7]
const TARGET = 7
const N = CANDIDATES.length
const ROOT_ID = 'r'
const ghostId = (id: string, idx: number) => `${id}!${idx}`

/* ---------------- 决策树：模块级一次性构建（纯数据，非渲染期副作用） ---------------- */

interface TNode {
  id: string
  /** 从根到此节点依次选中的候选下标（非递减） */
  idxPath: number[]
  /** 本节点选中的候选值；根节点为 null */
  value: number | null
  /** 本层的剩余目标 remaining */
  remaining: number
  /** 本层循环起点 start */
  start: number
  depth: number
  children: string[]
  /** 触发 break 剪枝的候选下标；本层没有剪枝为 null */
  cutIdx: number | null
  x: number
  y: number
}

/** 剪枝幽灵节点：若选下去 remaining 会变成负数，实际代码在这里 break */
interface CutNode {
  id: string
  parent: string
  idx: number
  value: number
  remaining: number
  depth: number
  x: number
  y: number
}

const NODES: Record<string, TNode> = {}
const CUTS: Record<string, CutNode> = {}
/** 先序遍历的真实节点顺序，渲染顺序固定 */
const ORDER: string[] = []

NODES[ROOT_ID] = {
  id: ROOT_ID,
  idxPath: [],
  value: null,
  remaining: TARGET,
  start: 0,
  depth: 0,
  children: [],
  cutIdx: null,
  x: 0,
  y: 0,
}

function buildTree(id: string): void {
  const node = NODES[id]
  ORDER.push(id)
  if (node.remaining === 0) return // remaining == 0：收集，不再往下选
  for (let i = node.start; i < N; i++) {
    if (CANDIDATES[i] > node.remaining) {
      node.cutIdx = i // 数组已升序，后面的候选只会更大，直接 break
      return
    }
    const childId = `${id}.${i}`
    NODES[childId] = {
      id: childId,
      idxPath: [...node.idxPath, i],
      value: CANDIDATES[i],
      remaining: node.remaining - CANDIDATES[i],
      start: i, // 传 i 而不是 i + 1：同一个数字可以重复选
      depth: node.depth + 1,
      children: [],
      cutIdx: null,
      x: 0,
      y: 0,
    }
    node.children.push(childId)
    buildTree(childId)
  }
}
buildTree(ROOT_ID)

for (const node of Object.values(NODES)) {
  if (node.cutIdx === null) continue
  const id = ghostId(node.id, node.cutIdx)
  CUTS[id] = {
    id,
    parent: node.id,
    idx: node.cutIdx,
    value: CANDIDATES[node.cutIdx],
    remaining: node.remaining - CANDIDATES[node.cutIdx],
    depth: node.depth + 1,
    x: 0,
    y: 0,
  }
}

/* ---------------- 坐标：先给叶子（含剪枝幽灵）等宽槽位，内部节点居中于子节点 ---------------- */

const W = 860
const PAD = 46
const TOP = 52
const LAYER_GAP = 78
const NODE_R = 20

const layoutKids = (id: string): string[] => {
  const node = NODES[id]
  const kids = [...node.children]
  if (node.cutIdx !== null) kids.push(ghostId(id, node.cutIdx))
  return kids
}

const LEAVES: string[] = []
function collectLeaves(id: string): void {
  const kids = layoutKids(id)
  if (kids.length === 0) {
    LEAVES.push(id)
    return
  }
  for (const k of kids) collectLeaves(k)
}
collectLeaves(ROOT_ID)

const SLOT = (W - 2 * PAD) / LEAVES.length
LEAVES.forEach((id, k) => {
  const x = PAD + SLOT * (k + 0.5)
  if (id in NODES) NODES[id].x = x
  else CUTS[id].x = x
})

function layoutX(id: string): number {
  const node = NODES[id]
  const kids = layoutKids(id)
  if (kids.length === 0) return node.x
  const xs = kids.map((k) => (k in NODES ? layoutX(k) : CUTS[k].x))
  node.x = xs.reduce((a, b) => a + b, 0) / xs.length
  return node.x
}
layoutX(ROOT_ID)

const ALL_NODES = [...Object.values(NODES), ...Object.values(CUTS)]
const MAX_DEPTH = Math.max(...ALL_NODES.map((n) => n.depth))
const H = TOP + MAX_DEPTH * LAYER_GAP + 74
for (const n of ALL_NODES) n.y = TOP + n.depth * LAYER_GAP

/* ---------------- 步骤：真实 DFS 跑一遍，每轮存一个不可变快照 ---------------- */

interface Step {
  phase: 'init' | 'choose' | 'collect' | 'prune' | 'undo' | 'done'
  /** 本步所在节点 id（collect / prune 就是收集或剪枝发生的那一层） */
  cur: string
  /** 根 → cur 的节点 id 链（快照） */
  pathIds: string[]
  /** 当前 path 上已选中的候选值，不含根（快照） */
  path: number[]
  /** 已进入过的节点 id（快照） */
  visited: string[]
  /** 已收集的组合（快照） */
  results: number[][]
  /** 已收集组合对应的叶子节点 id（快照） */
  collectedNodes: string[]
  /** 已经露出的剪枝幽灵节点 id（快照） */
  cuts: string[]
  /** 本步刚选中的节点（choose），否则 '' */
  chosen: string
  /** 本步刚露出的剪枝幽灵节点（prune），否则 '' */
  cut: string
  /** 本步刚撤销的节点（undo），否则 '' */
  undo: string
  /** 本步所在层的剩余目标 */
  remaining: number
  /** 本步所在层循环的起点下标 */
  start: number
  note: string
  /** 下一步动作：最后用后一个快照统一回填，供 Hint 使用 */
  next: string
}

function buildSteps(): Step[] {
  const steps: Step[] = []
  const pathIds: string[] = []
  const path: number[] = []
  const visited: string[] = []
  const results: number[][] = []
  const collectedNodes: string[] = []
  const cuts: string[] = []

  const snap = (
    phase: Step['phase'],
    cur: string,
    hit: { chosen?: string; cut?: string; undo?: string },
    note: string
  ): void => {
    steps.push({
      phase,
      cur,
      pathIds: pathIds.slice(),
      path: path.slice(),
      visited: visited.slice(),
      results: results.map((r) => r.slice()),
      collectedNodes: collectedNodes.slice(),
      cuts: cuts.slice(),
      chosen: hit.chosen ?? '',
      cut: hit.cut ?? '',
      undo: hit.undo ?? '',
      remaining: NODES[cur].remaining,
      start: NODES[cur].start,
      note,
      next: '',
    })
  }

  visited.push(ROOT_ID)
  pathIds.push(ROOT_ID)

  snap(
    'init',
    ROOT_ID,
    {},
    `观察：candidates 按升序排成 [${CANDIDATES.join(', ')}]，target = ${TARGET}，path 为空、剩余目标 remaining = ${TARGET}。判断：同一个数字可以重复选取，所以下一层递归要传 i 而不是 i + 1，而每层只从下标 start 起选才能保证组合不重复。动作：从 backtrack(0, ${TARGET}) 开始，本层先尝试下标 0 的候选 ${CANDIDATES[0]}。为什么：下一层仍传 i ⇒ 数字可重复选，每层只从 start 起选 ⇒ 每个组合只按非递减顺序生成一次。`
  )

  /** 调用前 nodeId 已经压入 pathIds / visited / path */
  function walk(nodeId: string): void {
    const node = NODES[nodeId]

    if (node.remaining === 0) {
      results.push(path.slice())
      collectedNodes.push(nodeId)
      snap(
        'collect',
        nodeId,
        {},
        `观察：path = [${path.join(', ')}] 的元素和正好等于 target = ${TARGET}，remaining 减到 0。判断：remaining == 0 是唯一的收集条件，这组数就是答案之一。动作：把 path 深拷贝一份放进 result（必须拷贝，否则后面的弹出会改坏已收集的组合），然后返回上一层。为什么：candidates[i] ≥ 2 > 0 让 remaining 严格递减，递归一定会终止，而 remaining == 0 又保证了和恰好等于 target。`
      )
      return
    }

    for (const kidId of node.children) {
      const kid = NODES[kidId]
      const idx = kid.idxPath[kid.idxPath.length - 1]
      const v = kid.value as number
      const parentRem = node.remaining

      visited.push(kidId)
      pathIds.push(kidId)
      path.push(v)
      snap(
        'choose',
        kidId,
        { chosen: kidId },
        `观察：父层 remaining = ${parentRem}，本层从下标 ${node.start} 起，candidates[${idx}] = ${v} 没有超过剩余目标。判断：可以选它，选完剩余目标从 ${parentRem} 减到 ${parentRem} − ${v} = ${kid.remaining}。动作：把 ${v} 追加到 path（[${path.join(', ')}]），并递归 backtrack(${idx}, ${kid.remaining})。为什么：下一层传的下标仍是 ${idx} 而不是 ${idx + 1}，所以 ${v} 还能被继续选取，这就是本题「同一个数字可以无限制重复使用」的实现。`
      )

      walk(kidId)

      pathIds.pop()
      path.pop()
      snap(
        'undo',
        nodeId,
        { undo: kidId },
        `观察：以 [${[...path, v].join(', ')}] 为前缀的子树已经整个走完，途中的收集与剪枝都已记录。判断：继续留在这个前缀上不会再有新的组合。动作：把 ${v} 从 path 末尾弹出，回到 remaining = ${parentRem} 的节点，接着尝试下一个更大的候选。为什么：弹出必须与递归成对执行，漏掉就会让兄弟分支带着已经用过的数字继续搜索，生成重复或错误的组合。`
      )
    }

    if (node.cutIdx !== null) {
      const gid = ghostId(nodeId, node.cutIdx)
      const c = CANDIDATES[node.cutIdx]
      cuts.push(gid)
      snap(
        'prune',
        nodeId,
        { cut: gid },
        `观察：本层从下标 ${node.cutIdx} 起，candidates[${node.cutIdx}] = ${c} 已经大于 remaining = ${node.remaining}。判断：若选 ${c}，剩余目标会变成 ${node.remaining} − ${c} = ${node.remaining - c} < 0，不可能再凑出恰好等于 target 的解；而且数组已升序，下标 ${node.cutIdx} 之后的候选只会更大，同样超出。动作：直接 break，把这一层从下标 ${node.cutIdx} 开始的所有分支整条剪掉。为什么：剪枝只丢掉「当前候选已经大于剩余目标」的分支，这类分支绝不会出现在答案里，也保证不会带着负的 remaining 继续递归。`
      )
    }
  }

  walk(ROOT_ID)

  const listed = results.map((r) => `[${r.join(',')}]`).join('、')
  snap(
    'done',
    ROOT_ID,
    {},
    `观察：backtrack(0, ${TARGET}) 全部返回，path 清空，结果集里留下 ${results.length} 个组合：${listed}。判断：它们正是所有和为 ${TARGET} 的不同组合，其余 ${cuts.length} 条分支都在候选大于剩余目标时被 break 剪掉。动作：答案就是这 ${results.length} 个组合，读法是把每条以 remaining = 0 结束的路径从根到叶依次写下。为什么：时间 O(S)（S 为所有可行解的长度之和，与搜索树访问的节点规模同阶），空间 O(target)（递归深度等于 path 长度，本例最大 ${Math.floor(TARGET / Math.min(...CANDIDATES))}）。`
  )

  // 「下一步动作」由后一个快照统一回填：Hint 必须描述真正的下一步
  steps.forEach((s, i) => {
    const b = steps[i + 1]
    if (!b) return
    if (b.phase === 'choose') {
      const kid = NODES[b.chosen]
      const idx = kid.idxPath[kid.idxPath.length - 1]
      s.next = `把 candidates[${idx}] = ${kid.value} 加入 path，递归 backtrack(${idx}, ${kid.remaining})`
    } else if (b.phase === 'collect') {
      s.next = `remaining 已减到 0，把 [${b.path.join(', ')}] 收进结果集`
    } else if (b.phase === 'prune') {
      const g = CUTS[b.cut]
      s.next = `检查 candidates[${g.idx}] = ${g.value} 是否大于 remaining = ${NODES[b.cur].remaining}`
    } else if (b.phase === 'undo') {
      s.next = `撤销：把 ${NODES[b.undo].value} 从 path 末尾弹出，回到 remaining = ${NODES[b.cur].remaining} 的节点`
    } else if (b.phase === 'done') {
      s.next = '搜索结束，输出结果集里的全部组合'
    }
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

type NodeState = 'current' | 'onpath' | 'collected' | 'cut' | 'off'

const FILL: Record<NodeState, string> = {
  current: 'hsl(var(--amber-soft))',
  onpath: 'hsl(var(--teal-soft))',
  collected: 'hsl(var(--easy-soft))',
  cut: 'hsl(var(--hard-soft))',
  off: 'hsl(var(--paper))',
}

const STROKE: Record<NodeState, string> = {
  current: 'hsl(var(--amber))',
  onpath: 'hsl(var(--teal))',
  collected: 'hsl(var(--easy))',
  cut: 'hsl(var(--hard))',
  off: TONE.muted,
}

const TEXT: Record<NodeState, string> = {
  current: 'hsl(var(--amber))',
  onpath: 'hsl(var(--teal))',
  collected: 'hsl(var(--easy))',
  cut: 'hsl(var(--hard))',
  off: 'hsl(var(--ink-soft))',
}

const WORD: Record<NodeState, string> = {
  current: '当前',
  onpath: '路径上',
  collected: '已收集',
  cut: '剪枝',
  off: '未访问',
}

function Stage(step: Step) {
  const done = step.phase === 'done'
  const chosenIdx = step.phase === 'choose' ? lastIdx(step.chosen) : -1

  const stateOf = (id: string): NodeState => {
    if (step.collectedNodes.includes(id)) return 'collected'
    if (id === step.cur) return 'current'
    if (step.pathIds.includes(id)) return 'onpath'
    return 'off'
  }

  const edgeOf = (id: string): string => {
    const st = stateOf(id)
    return st === 'off' ? TONE.muted : STROKE[st]
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full select-none">
        {/* 1. 边：先画线，节点圆后画盖住端点 */}
        {ORDER.map((id) => {
          const node = NODES[id]
          return (
            <g key={`edge-${id}`}>
              {node.children.map((kidId) => {
                const kid = NODES[kidId]
                const st = stateOf(kidId)
                return (
                  <line
                    key={kidId}
                    x1={node.x}
                    y1={node.y}
                    x2={kid.x}
                    y2={kid.y}
                    stroke={edgeOf(kidId)}
                    strokeWidth={st === 'current' ? 3 : 2}
                    strokeDasharray={st === 'off' && !step.visited.includes(kidId) ? '4 5' : undefined}
                  />
                )
              })}
              {node.cutIdx !== null &&
                step.cuts.includes(ghostId(id, node.cutIdx)) &&
                (() => {
                  const g = CUTS[ghostId(id, node.cutIdx)]
                  return (
                    <line
                      x1={node.x}
                      y1={node.y}
                      x2={g.x}
                      y2={g.y}
                      stroke={TONE.hard}
                      strokeWidth={2}
                      strokeDasharray="5 4"
                    />
                  )
                })()}
            </g>
          )
        })}

        {/* 2. 真实节点圆 + 选中的候选值 */}
        {ORDER.map((id) => {
          const node = NODES[id]
          const st = stateOf(id)
          return (
            <g key={id} className="demo-water">
              <circle
                cx={node.x}
                cy={node.y}
                r={NODE_R}
                fill={FILL[st]}
                stroke={STROKE[st]}
                strokeWidth={st === 'current' ? 3 : 2}
                strokeDasharray={st === 'off' && !step.visited.includes(id) ? '4 4' : undefined}
              />
              <text
                x={node.x}
                y={node.y + (node.value === null ? 5 : 6)}
                textAnchor="middle"
                fontSize={node.value === null ? 12 : 17}
                fontWeight="700"
                className="font-code"
                fill={TEXT[st]}
              >
                {node.value === null ? '起点' : node.value}
              </text>
            </g>
          )
        })}

        {/* 3. 剪枝幽灵节点（红虚线）：若选下去 remaining 已为负 */}
        {step.cuts.map((gid) => {
          const g = CUTS[gid]
          return (
            <g key={gid}>
              <circle
                cx={g.x}
                cy={g.y}
                r={NODE_R}
                fill={FILL.cut}
                stroke={STROKE.cut}
                strokeWidth={2.5}
                strokeDasharray="5 4"
              />
              <text
                x={g.x}
                y={g.y + 6}
                textAnchor="middle"
                fontSize="17"
                fontWeight="700"
                className="font-code"
                fill={TEXT.cut}
              >
                {g.value}
              </text>
            </g>
          )
        })}

        {/* 4. 文字标签：状态词 + 剩余目标（状态不只靠颜色区分） */}
        {ORDER.map((id) => {
          const node = NODES[id]
          const st = stateOf(id)
          const word = st === 'off' ? (step.visited.includes(id) ? '已回退' : WORD.off) : WORD[st]
          return (
            <g key={`label-${id}`}>
              <text
                x={node.x}
                y={node.y + NODE_R + 12}
                textAnchor="middle"
                fontSize="10"
                fontWeight="700"
                className="font-code"
                fill={TEXT[st]}
              >
                {word}
              </text>
              <text
                x={node.x}
                y={node.y + NODE_R + 23}
                textAnchor="middle"
                fontSize="10"
                className="font-code"
                fill="hsl(var(--ink-soft))"
              >
                rem={node.remaining}
              </text>
            </g>
          )
        })}
        {step.cuts.map((gid) => {
          const g = CUTS[gid]
          return (
            <g key={`glabel-${gid}`}>
              <text
                x={g.x}
                y={g.y + NODE_R + 12}
                textAnchor="middle"
                fontSize="10"
                fontWeight="700"
                className="font-code"
                fill={TEXT.cut}
              >
                {WORD.cut}
              </text>
              <text
                x={g.x}
                y={g.y + NODE_R + 23}
                textAnchor="middle"
                fontSize="10"
                fontWeight="700"
                className="font-code"
                fill={TEXT.cut}
              >
                rem={g.remaining}
              </text>
            </g>
          )
        })}

        <text
          x={W / 2}
          y={H - 10}
          textAnchor="middle"
          fontSize="11"
          className="font-code"
          fill="hsl(var(--ink-soft))"
        >
          红色虚线幽灵节点 = 若选该候选，remaining 会变成负数，实际代码在这里 break；灰色虚线 = 尚未访问，灰色实线 = 已回退
        </text>
      </svg>

      {/* 候选数组（题解第 1 步先升序排序，便于剪枝）与剩余目标 */}
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <span className="text-[11px] text-ink-soft">candidates（已升序）：</span>
        {CANDIDATES.map((c, i) => (
          <Badge
            key={i}
            tone={
              step.phase === 'prune' && CUTS[step.cut].idx === i
                ? 'hard'
                : i === chosenIdx
                  ? 'amber'
                  : i === step.start
                    ? 'teal'
                    : i < step.start
                      ? 'muted'
                      : 'plain'
            }
          >
            <b className="font-code">
              [{i}] = {c}
            </b>
          </Badge>
        ))}
      </div>

      {/* 当前 path 与已收集的结果集 */}
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5">
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-ink-soft">path：</span>
          {step.path.length === 0 ? (
            <span className="font-code text-[11px] text-ink-soft">（空）</span>
          ) : (
            step.path.map((v, k) => (
              <Badge
                key={k}
                tone={
                  step.phase === 'collect'
                    ? 'easy'
                    : k === step.path.length - 1 && step.phase === 'choose'
                      ? 'amber'
                      : 'plain'
                }
              >
                <b className="font-code">{v}</b>
              </Badge>
            ))
          )}
          <span className="text-[11px] text-ink-soft">
            path 之和 <b className="font-code">{TARGET - step.remaining}</b>
          </span>
        </span>
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-ink-soft">结果集：</span>
          {step.results.length === 0 ? (
            <span className="font-code text-[11px] text-ink-soft">（还没有收集到组合）</span>
          ) : (
            step.results.map((r, k) => (
              <Badge key={k} tone="easy">
                <b className="font-code">[{r.join(',')}]</b>
              </Badge>
            ))
          )}
        </span>
      </div>

      <Badges className="justify-center">
        <Stat label="当前层 remaining" value={done ? '—' : step.remaining} tone="amber" />
        <Stat label="已收集组合" value={step.results.length} tone="easy" />
        <Stat label="已剪枝分支" value={step.cuts.length} tone="hard" />
        {!done && step.next && <Hint>{step.next}</Hint>}
        {done && (
          <Answer>
            共 <b className="font-code">{step.results.length}</b> 个组合：
            {step.results.map((r, k) => (
              <span key={k}>
                {k > 0 && '、'}
                <b className="font-code">[{r.join(',')}]</b>
              </span>
            ))}
          </Answer>
        )}
      </Badges>
    </div>
  )
}

/** 取节点「从根到它」下标链的最后一个下标 */
function lastIdx(id: string): number {
  const p = NODES[id].idxPath
  return p[p.length - 1]
}

export default function CombinationSumDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="决策树上的可重复选择与排序剪枝"
      info={`输入取题解示例 1：candidates = [${CANDIDATES.join(', ')}]、target = ${TARGET}，答案 [[2,2,3],[7]]。示例 3（candidates = [2]、target = 1）只有一次剪枝、没有组合可收集，示例 2 的解更多、步数更长；示例 1 是能同时看清「remaining 减到 0 收集」与「候选大于剩余目标 break」的最小官方示例，共 ${steps.length} 步。`}
      steps={steps}
      autoMs={1200}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '本步所在节点 / 刚选中的候选' },
        { color: TONE.teal, label: '当前 path 上的祖先 / 本层起点 start' },
        { color: TONE.easy, label: 'remaining = 0，组合被收集' },
        { color: TONE.hard, label: '剪枝：候选 > remaining（剩余会变负）' },
        { color: TONE.muted, label: '不在当前 path 上：未访问（虚线）/ 已回退（实线）' },
      ]}
    />
  )
}
