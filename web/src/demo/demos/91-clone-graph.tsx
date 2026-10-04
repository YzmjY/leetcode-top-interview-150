import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badge, Badges, Hint, Stat, TONE } from './stage'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/* 91. 克隆图 —— 模式 F：原图 / 克隆图并排 + 手写坐标 + 哈希表映射       */
/* 题解 DFS：命中 visited 直接返回；否则新建克隆、先登记、再递归邻居      */
/* ------------------------------------------------------------------ */

/** 固定示例输入（题解「示例 1」：adjList = [[2,4],[1,3],[2,4],[1,3]]） */
const NODES: number[] = [1, 2, 3, 4]
/** 邻接表：NEIGHBORS[v - 1] 是节点 v 的邻居列表 */
const NEIGHBORS: number[][] = [
  [2, 4],
  [1, 3],
  [2, 4],
  [1, 3],
]
/** 去重后的 4 条无向边：1—2、2—3、3—4、1—4，构成环 1—2—3—4—1 */
const EDGES: [number, number][] = [
  [1, 2],
  [2, 3],
  [3, 4],
  [1, 4],
]

/** 克隆节点的文字写法：1′ */
const primeOf = (v: number): string => `${v}′`

type Phase = 'init' | 'enter' | 'descend' | 'reuse' | 'link' | 'return' | 'done'

interface Step {
  phase: Phase
  /** 本步动作的短标签（舞台下方的琥珀徽章） */
  label: string
  /** visited 的 key 快照 = 已有克隆的原节点 */
  memo: number[]
  /** 克隆图已填好的邻居表：cloneAdj[v] = 克隆节点 v′ 的邻居 */
  cloneAdj: Record<number, number[]>
  /** DFS 调用栈快照（存原节点） */
  stack: number[]
  /** 本步正在处理的节点（琥珀） */
  cur: number | null
  /** 本步新建的克隆（phase = 'enter'） */
  created: number | null
  /** 本步即将深入的邻居（phase = 'descend'） */
  descend: number | null
  /** 本步复制到克隆图的边（phase = 'link'） */
  edge: [number, number] | null
  /** 下一步动作，最后用后一个快照统一回填 */
  hint: string
  note: string
}

function buildSteps(): Step[] {
  const steps: Step[] = []
  const memo: number[] = []
  const cloneAdj: Record<number, number[]> = {}
  const stack: number[] = []

  const snapCloneAdj = (): Record<number, number[]> => {
    const out: Record<number, number[]> = {}
    for (const key of Object.keys(cloneAdj)) {
      const v = Number(key)
      out[v] = cloneAdj[v].slice()
    }
    return out
  }

  /** 每个快照都是不可变副本 */
  const snap = (
    phase: Phase,
    label: string,
    note: string,
    at: { cur?: number; created?: number; descend?: number; edge?: [number, number] } = {}
  ): void => {
    steps.push({
      phase,
      label,
      memo: memo.slice(),
      cloneAdj: snapCloneAdj(),
      stack: stack.slice(),
      cur: at.cur ?? null,
      created: at.created ?? null,
      descend: at.descend ?? null,
      edge: at.edge ?? null,
      hint: '',
      note,
    })
  }

  const list = (ns: number[]): string => (ns.length > 0 ? ns.map(primeOf).join('、') : '（空）')
  const nbList = (v: number): string => NEIGHBORS[v - 1].join('、')

  snap(
    'init',
    '准备 dfs(1)',
    `观察：输入 adjList = [[2,4],[1,3],[2,4],[1,3]]（题解示例 1），4 个节点构成环 1—2—3—4—1，入口是节点 1。判断：图里有环，只顺着邻接表递归会在环上绕回已经访问过的节点，所以必须用哈希表 visited 记录「原节点 → 克隆节点」来去重。动作：从 dfs(1) 开始，此刻 visited 为空、DFS 调用栈为空，克隆图里只有 4 个虚线「?」占位。为什么：先把克隆登记进哈希表再递归邻居，环上的第二次访问就会命中哈希表直接返回，既不会重复克隆也不会无限递归。`
  )

  function dfs(v: number): void {
    if (memo.includes(v)) {
      snap(
        'reuse',
        `dfs(${v}) 命中 visited，复用 ${primeOf(v)}`,
        `观察：dfs(${v}) 一进入就命中 visited，节点 ${v} 已经有克隆 ${primeOf(v)}。判断：它已经被别的路径访问过（环上另一条路绕到这里），不能重复创建节点，也不必再递归它的邻居。动作：直接返回已有的克隆 ${primeOf(v)}，本次调用立即结束。为什么：哈希表保证 N 个原节点恰好产生 N 个克隆，同时让环上的递归立刻收敛。`,
        { cur: v }
      )
      return
    }

    memo.push(v)
    cloneAdj[v] = []
    stack.push(v)
    snap(
      'enter',
      `新建克隆节点 ${primeOf(v)} 并登记 visited`,
      `观察：dfs(${v}) 发现节点 ${v} 不在 visited 中。判断：它需要一个全新的克隆节点（值同为 ${v}），并且要先把映射记下来再处理邻居。动作：新建克隆节点 ${primeOf(v)}，登记 visited[${v}] = ${primeOf(v)}，然后按原图顺序递归它的邻居 [${nbList(v)}]。为什么：顺序必须是先登记、后递归——若改成递归完邻居再登记，环绕回来时就会重复创建克隆甚至无限递归。`,
      { cur: v, created: v }
    )

    for (const nb of NEIGHBORS[v - 1]) {
      if (!memo.includes(nb)) {
        snap(
          'descend',
          `dfs(${v}) 先深入邻居 ${nb}`,
          `观察：dfs(${v}) 正在按顺序遍历自己的邻居，轮到 ${nb}，它还没有出现在 visited 中。判断：${primeOf(nb)} 得先由一次新的递归创建出来，才能填进 ${primeOf(v)} 的邻居列表。动作：深入递归 dfs(${nb})，本步不修改任何邻居列表。为什么：邻接关系的复制依赖递归的返回值，深度优先的顺序保证子问题先完成。`,
          { cur: v, descend: nb }
        )
      }

      dfs(nb)
      cloneAdj[v].push(nb)
      snap(
        'link',
        `把 ${primeOf(nb)} 接入 ${primeOf(v)} 的邻居列表`,
        `观察：dfs(${nb}) 返回了克隆节点 ${primeOf(nb)}，并且 ${primeOf(nb)} 的邻居列表已按同样方式填好（无向边 ${v}—${nb} 的另一侧记录在 dfs(${nb}) 里完成）。判断：这条边在克隆图的 ${primeOf(v)} 一侧还缺一条出边记录。动作：把 ${primeOf(nb)} 追加到 ${primeOf(v)} 的邻居列表，${primeOf(v)} 现在指向 [${list(cloneAdj[v])}]。为什么：无向图的每条边在两边邻接表里各出现一次，两个方向都补上，克隆图的邻接关系才与原图逐项一致。`,
        { cur: v, edge: [v, nb] }
      )
    }

    stack.pop()
    snap(
      'return',
      `dfs(${v}) 出栈，返回 ${primeOf(v)}`,
      `观察：dfs(${v}) 已经处理完邻居 [${nbList(v)}]，克隆节点 ${primeOf(v)} 的邻居列表 = [${list(cloneAdj[v])}]。判断：以 ${v} 为根的这部分子图已经拷贝完整，没有遗留工作。动作：dfs(${v}) 出栈，把克隆节点 ${primeOf(v)} 作为返回值交给上一层调用。为什么：上一层正是用这个引用补全自己的边，环上任何再次到达 ${v} 的调用也都会拿到同一个 ${primeOf(v)}。`,
      { cur: v }
    )
  }

  dfs(1)

  snap(
    'done',
    '',
    `观察：dfs(1) 返回，visited 中有 ${NODES.length} 项，克隆图的 ${NODES.length} 个节点与 ${EDGES.length} 条边全部复制完成。判断：每个原节点只克隆一次，克隆图的邻接表 [[2,4],[1,3],[2,4],[1,3]] 与原图逐项一致，并且没有复用原图的任何节点指针。动作：答案是克隆节点 1′，返回的正是这张全新的图。为什么：每个节点克隆一次、每条有向边处理一次，时间 O(N+E)（N = ${NODES.length}、无向边 E = ${EDGES.length}，邻接表中共 ${2 * EDGES.length} 条有向记录）；visited 与克隆节点共 O(N) 空间。`
  )

  // 「下一步动作」由后一个快照统一回填，保证 Hint 与实际步骤数据完全一致
  steps.forEach((s, i) => {
    const b = steps[i + 1]
    if (!b) return
    if (b.phase === 'enter' && b.created !== null) {
      s.hint = `递归 dfs(${b.created})：新建克隆节点 ${primeOf(b.created)}，先登记 visited，再递归它的邻居`
    } else if (b.phase === 'reuse' && b.cur !== null) {
      s.hint = `调用 dfs(${b.cur})，命中 visited → 直接复用克隆节点 ${primeOf(b.cur)}`
    } else if (b.phase === 'descend' && b.descend !== null) {
      s.hint = `深入递归 dfs(${b.descend})，先取得克隆节点 ${primeOf(b.descend)} 的引用`
    } else if (b.phase === 'link' && b.edge !== null) {
      s.hint = `把克隆节点 ${primeOf(b.edge[1])} 追加到 ${primeOf(b.edge[0])} 的邻居列表`
    } else if (b.phase === 'return' && b.cur !== null) {
      s.hint = `dfs(${b.cur}) 的邻居处理完毕 → 出栈，返回克隆节点 ${primeOf(b.cur)}`
    } else if (b.phase === 'done') {
      s.hint = `递归全部收敛，返回克隆节点 ${primeOf(1)}（整张克隆图）`
    }
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

const W = 660
const H = 380
/** 节点半径 */
const R = 28

/** 手写坐标表：模式 F 禁止力导向布局，坐标固定、结果可复现 */
const POS_ORIG: Record<number, { x: number; y: number }> = {
  1: { x: 108, y: 118 },
  2: { x: 250, y: 118 },
  3: { x: 250, y: 272 },
  4: { x: 108, y: 272 },
}
const POS_CLONE: Record<number, { x: number; y: number }> = {
  1: { x: 410, y: 118 },
  2: { x: 552, y: 118 },
  3: { x: 552, y: 272 },
  4: { x: 410, y: 272 },
}

type NodeState = 'unvisited' | 'onStack' | 'current' | 'cloned'

const NODE_SKIN: Record<NodeState, { fill: string; stroke: string; text: string }> = {
  unvisited: {
    fill: 'hsl(var(--card))',
    stroke: 'hsl(var(--border))',
    text: 'hsl(var(--ink-soft))',
  },
  onStack: { fill: 'hsl(var(--teal-soft))', stroke: TONE.teal, text: TONE.teal },
  current: { fill: 'hsl(var(--amber-soft))', stroke: TONE.amber, text: TONE.amber },
  cloned: { fill: 'hsl(var(--easy-soft))', stroke: TONE.easy, text: TONE.easy },
}

/** 状态文字：不靠颜色也能读出节点处于哪一步 */
const STATE_LABEL: Record<NodeState, string> = {
  unvisited: '未访问',
  onStack: '递归中',
  current: '当前访问',
  cloned: '已克隆',
}

function Stage(step: Step) {
  const done = step.phase === 'done'

  const stateOf = (v: number): NodeState => {
    if (step.cur === v) return 'current'
    if (step.stack.includes(v)) return 'onStack'
    if (step.memo.includes(v)) return 'cloned'
    return 'unvisited'
  }

  /** 克隆图里这条边是否已经复制完成（两个方向任一有记录即成边） */
  const cloneCopied = (a: number, b: number): boolean => {
    const sa = step.cloneAdj[a] ?? []
    const sb = step.cloneAdj[b] ?? []
    return sa.includes(b) || sb.includes(a)
  }

  const edgeActive = (a: number, b: number): boolean =>
    step.edge !== null &&
    ((step.edge[0] === a && step.edge[1] === b) || (step.edge[0] === b && step.edge[1] === a))

  /** 克隆节点上的角标：本步新建 / 命中复用 / 递归完成 */
  const markOf = (v: number): { text: string; tone: string } | null => {
    if (step.created === v) return { text: '新建', tone: TONE.amber }
    if (step.phase === 'reuse' && step.cur === v) return { text: '命中复用', tone: TONE.amber }
    if (step.phase === 'return' && step.cur === v) return { text: '完成', tone: TONE.easy }
    return null
  }

  /** 边两端各留出半径，线才不会被圆盖住（坐标换算照抄 93-course-schedule） */
  const stick = (a: number, b: number, pos: Record<number, { x: number; y: number }>) => {
    const p = pos[a]
    const q = pos[b]
    const dx = q.x - p.x
    const dy = q.y - p.y
    const len = Math.hypot(dx, dy) || 1
    const off = R + 8
    return {
      x1: p.x + (dx / len) * off,
      y1: p.y + (dy / len) * off,
      x2: q.x - (dx / len) * off,
      y2: q.y - (dy / len) * off,
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full select-none">
        {/* 0. 分隔线与两侧标题：图层最底 */}
        <line
          x1="330"
          y1="46"
          x2="330"
          y2="322"
          stroke="hsl(var(--border))"
          strokeWidth="1"
          strokeDasharray="5 5"
        />
        <text x="179" y="26" textAnchor="middle" fontSize="13" fontWeight="700" fill="hsl(var(--ink-soft))">
          原图 original
        </text>
        <text x="481" y="26" textAnchor="middle" fontSize="13" fontWeight="700" fill="hsl(var(--ink-soft))">
          克隆图 clone
        </text>

        {/* 1. 原图的 4 条无向边：本步正在复制的那条变琥珀加粗 */}
        {EDGES.map(([a, b]) => {
          const g = stick(a, b, POS_ORIG)
          const active = edgeActive(a, b)
          return (
            <line
              key={`oe-${a}-${b}`}
              x1={g.x1}
              y1={g.y1}
              x2={g.x2}
              y2={g.y2}
              stroke={active ? TONE.amber : 'hsl(var(--ink) / 0.35)'}
              strokeWidth={active ? 3.5 : 2}
            />
          )
        })}

        {/* 2. 克隆图的边：只有真正复制完成的边才画出来 */}
        {EDGES.map(([a, b]) => {
          if (!cloneCopied(a, b)) return null
          const g = stick(a, b, POS_CLONE)
          const active = edgeActive(a, b)
          return (
            <line
              key={`ce-${a}-${b}`}
              x1={g.x1}
              y1={g.y1}
              x2={g.x2}
              y2={g.y2}
              stroke={active ? TONE.amber : TONE.easy}
              strokeWidth={active ? 3.5 : 2.5}
            />
          )
        })}

        {/* 3. 原图节点：琥珀 = 本步正在处理，青 = 递归栈上未返回，绿 = 克隆已完成，灰 = 还没访问 */}
        {NODES.map((v) => {
          const p = POS_ORIG[v]
          const st = stateOf(v)
          const skin = NODE_SKIN[st]
          return (
            <g key={`orig-${v}`}>
              {st === 'current' && (
                <circle cx={p.x} cy={p.y} r={R + 6} fill="none" stroke={TONE.amber} strokeWidth="3" />
              )}
              <circle cx={p.x} cy={p.y} r={R} fill={skin.fill} stroke={skin.stroke} strokeWidth="2.5" />
              <text
                x={p.x}
                y={p.y + 5}
                textAnchor="middle"
                fontSize="19"
                fontWeight="700"
                className="font-code"
                fill={skin.text}
              >
                {v}
              </text>
              <text x={p.x} y={p.y - R - 11} textAnchor="middle" fontSize="11" fontWeight="700" fill={skin.text}>
                {STATE_LABEL[st]}
              </text>
            </g>
          )
        })}

        {/* 4. 克隆节点：已登记 = 绿色的 v′，未登记 = 虚线「?」占位（muted） */}
        {NODES.map((v) => {
          const p = POS_CLONE[v]
          const created = step.memo.includes(v)
          const mark = markOf(v)
          if (!created) {
            return (
              <g key={`clone-${v}`}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={R}
                  fill={TONE.muted}
                  stroke={TONE.muted}
                  strokeWidth="2.5"
                  strokeDasharray="5 4"
                />
                <text
                  x={p.x}
                  y={p.y + 6}
                  textAnchor="middle"
                  fontSize="18"
                  fontWeight="700"
                  className="font-code"
                  fill="hsl(var(--ink-soft))"
                >
                  ?
                </text>
                <text
                  x={p.x}
                  y={p.y - R - 11}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="700"
                  fill="hsl(var(--ink-soft))"
                >
                  未克隆
                </text>
              </g>
            )
          }
          return (
            <g key={`clone-${v}`}>
              {mark && (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={R + 6}
                  fill="none"
                  stroke={mark.tone}
                  strokeWidth="3"
                  strokeDasharray="5 4"
                />
              )}
              <circle cx={p.x} cy={p.y} r={R} fill="hsl(var(--easy-soft))" stroke={TONE.easy} strokeWidth="2.5" />
              <text
                x={p.x}
                y={p.y + 5}
                textAnchor="middle"
                fontSize="19"
                fontWeight="700"
                className="font-code"
                fill={TONE.easy}
              >
                {primeOf(v)}
              </text>
              <text x={p.x} y={p.y - R - 11} textAnchor="middle" fontSize="11" fontWeight="700" fill={TONE.easy}>
                已克隆
              </text>
              {mark && (
                <text x={p.x} y={p.y + R + 17} textAnchor="middle" fontSize="11" fontWeight="700" fill={mark.tone}>
                  {mark.text}
                </text>
              )}
            </g>
          )
        })}
      </svg>

      {/* 映射关系写成文字标签，不依赖颜色：1 → 1′ / 3 → ? */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-medium text-ink-soft">visited 映射</span>
        {NODES.map((v) => {
          const cloned = step.memo.includes(v)
          const active = step.cur === v && (step.phase === 'enter' || step.phase === 'reuse')
          const skin = cloned
            ? active
              ? 'border-[hsl(var(--amber))] bg-[hsl(var(--amber-soft))] text-[hsl(var(--amber))]'
              : 'border-[hsl(var(--easy))]/40 bg-[hsl(var(--easy-soft))] text-[hsl(var(--easy))]'
            : 'border-border bg-card text-ink-soft'
          return (
            <span key={`map-${v}`} className={cn('rounded-md border px-2 py-0.5 font-code text-xs', skin)}>
              {v} → {cloned ? primeOf(v) : '?'}
            </span>
          )
        })}
      </div>

      <Badges className="justify-center">
        <Stat label="已克隆" value={`${step.memo.length} / ${NODES.length}`} tone="easy" />
        <Badge tone="teal">
          DFS 栈{' '}
          <b className="font-code text-xs">{step.stack.length > 0 ? `[${step.stack.join(', ')}]` : '（空）'}</b>
        </Badge>
        {!done && step.label !== '' && (
          <Badge tone="amber">
            本步 <b className="font-code text-xs">{step.label}</b>
          </Badge>
        )}
        {!done && step.hint !== '' && <Hint>{step.hint}</Hint>}
        {done && (
          <Answer>
            克隆图 = <b className="font-code">[[2,4],[1,3],[2,4],[1,3]]</b>，
            <b className="font-code">{NODES.length}</b> 个新节点、<b className="font-code">{EDGES.length}</b> 条边，与原图逐项一致
          </Answer>
        )}
      </Badges>
    </div>
  )
}

export default function CloneGraphDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="DFS + 哈希表：克隆图（深拷贝）"
      info={`输入 adjList = [[2,4],[1,3],[2,4],[1,3]]（题解示例 1）：4 个节点构成环 1—2—3—4—1，这是能体现「先登记、后递归」的最小示例。左侧是原图，右侧是正在构造的克隆图，visited 的映射关系直接用 1 → 1′ 这样的文字标签写出。为看清每一步，这里不演示示例 2 的单节点图与空图（node == nil 返回 nil）边界。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '当前 DFS 节点 / 本步复制的边' },
        { color: TONE.teal, label: '递归栈中尚未返回' },
        { color: TONE.easy, label: '已克隆的节点与已复制的边' },
        { color: TONE.muted, label: '尚未克隆（? 占位）' },
      ]}
    />
  )
}
