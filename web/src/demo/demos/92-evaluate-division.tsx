import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badge, Badges, Hint, Stat, TONE } from './stage'

/* ------------------------------------------------------------------ */
/* 92. 除法求值 —— 模式 F：带权有向图 + DFS 累乘路径权重                 */
/* a/b = v 拆成 a→b 权 v、b→a 权 1/v；查询 a/c = 路径 a→…→c 的边权乘积   */
/* ------------------------------------------------------------------ */

/** 固定示例输入：题解「示例 1」 */
const EQUATIONS: [string, string][] = [
  ['a', 'b'],
  ['b', 'c'],
]
const VALUES = [2, 3]
const QUERIES: [string, string][] = [
  ['a', 'c'],
  ['b', 'a'],
  ['a', 'e'],
  ['a', 'a'],
  ['x', 'x'],
]

/** 图上出现的变量（由等式推出，保证与输入一致） */
const NODES: string[] = Array.from(new Set(EQUATIONS.flat()))

interface Arc {
  to: string
  w: number
}

/** 邻接表按等式出现顺序构建：DFS 沿这个顺序深入，过程可复现 */
const ADJ: Record<string, Arc[]> = {}
for (const n of NODES) ADJ[n] = []
EQUATIONS.forEach(([u, v], i) => {
  ADJ[u].push({ to: v, w: VALUES[i] })
  ADJ[v].push({ to: u, w: 1 / VALUES[i] })
})

/** 渲染用的有向边（= 邻接表展开），顺序固定 */
const ARCS: { from: string; to: string; w: number }[] = NODES.flatMap((from) =>
  ADJ[from].map((a) => ({ from, to: a.to, w: a.w })),
)

/** 示例 1 的答案，只用于 done 步自检文案 */
const EXPECTED = [6, 0.5, -1, 1, -1]

function fmt(v: number): string {
  if (v === -1) return '-1.0'
  if (Number.isInteger(v)) return v.toFixed(1)
  return String(Math.round(v * 10000) / 10000)
}

type Phase = 'init' | 'start' | 'visit' | 'found' | 'self' | 'absent' | 'done'

interface QueryResult {
  q: [string, string]
  a: number
}

interface Step {
  phase: Phase
  /** 当前查询；init / done 为 null */
  query: [string, string] | null
  /** DFS 当前路径（起点 → 正在处理的节点） */
  path: string[]
  /** 本步出栈的节点 */
  current: string | null
  /** 仍留在栈中、等待探索的节点 */
  stack: string[]
  /** 命中目标时的目标节点 */
  hit: string | null
  /** 当前累计比值（起点 ÷ 当前节点）；无搜索时为 null */
  product: number | null
  /** 已得出答案的查询（含本步刚完成的） */
  results: QueryResult[]
  /** 不在图上的变量名 */
  miss: string | null
  note: string
  /** 下一步动作，由后一个快照统一回填 */
  next: string
}

function buildSteps(): Step[] {
  const steps: Step[] = []
  const results: QueryResult[] = []

  const snap = (phase: Phase, note: string, patch: Partial<Step> = {}) => {
    steps.push({
      phase,
      query: null,
      path: [],
      current: null,
      stack: [],
      hit: null,
      product: null,
      results: results.map((r) => ({ q: [r.q[0], r.q[1]] as [string, string], a: r.a })),
      miss: null,
      note,
      next: '',
      ...patch,
    })
  }

  snap(
    'init',
    `观察：equations = [["a","b"],["b","c"]]、values = [2.0, 3.0]，共 ${NODES.length} 个变量 ${NODES.join('、')}，之后有 5 组查询。判断：a/b = 2.0 可以拆成两条有向边 —— a→b 权 2.0、b→a 权 0.5（即 1/2.0）；b/c = 3.0 同理拆成 b→c 权 3.0、c→b 权 0.3333。动作：把 ${EQUATIONS.length} 个等式建成图上这 ${ARCS.length} 条带权有向边，查询 a/c 就等于在图上找一条路径并把路径上的边权相乘。为什么：路径 a→b→c 给出 (a/b)×(b/c) = a/c，中间变量 b 被约掉；反向边让 b/a 这类倒过来的查询也能直接查。`,
  )

  for (const [A, B] of QUERIES) {
    if (!NODES.includes(A) || !NODES.includes(B)) {
      const miss = NODES.includes(A) ? B : A
      const missText =
        !NODES.includes(A) && !NODES.includes(B)
          ? `查询里出现的变量 ${A} 从未在任何等式中出现过`
          : `变量 ${miss} 从未在任何等式中出现过`
      results.push({ q: [A, B], a: -1 })
      snap(
        'absent',
        `观察：查询 ${A}/${B}，${missText}，图上没有这个点。判断：图中的边全都连不到它，也就没有任何已知比值可以传递给它。动作：直接返回 -1.0，连 DFS 都不必开始。为什么：题解要求图上不存在的变量一律用 -1.0 替代 —— 这与「同一个变量比值为 1.0」并不冲突，因为 1.0 那个结论只在变量确实存在时才成立。`,
        { query: [A, B], miss },
      )
      continue
    }

    if (A === B) {
      results.push({ q: [A, B], a: 1 })
      snap(
        'self',
        `观察：查询 ${A}/${A}，两个变量是图上同一个点。判断：${A}/${A} = 1.0，不需要搜索 —— DFS 在起点就会命中目标。动作：直接写入结果 1.0。为什么：题解里 weight[${A}]/weight[${A}] 恒等于 1.0，但它只对图上存在的变量成立。`,
        { query: [A, B], path: [A], current: A, hit: A, product: 1 },
      )
      continue
    }

    interface Frame {
      node: string
      product: number
      path: string[]
    }

    const frames: Frame[] = [{ node: A, product: 1, path: [A] }]
    const visited = new Set<string>()
    const firstQuery = results.length === 0

    snap(
      'start',
      `观察：查询 ${A}/${B}，两个变量都在图上，需要从 ${A} 出发做一次 DFS。判断：${firstQuery ? '这是第一组查询，visited 还是空的' : '上一次查询留下的 visited 不能复用，本次搜索要重新开始'}，累计比值从 1.0 起算（等价于 ${A}/${A} = 1.0）。动作：把起点帧「节点 ${A}、累计 1.0、路径 ${A}」压入栈。为什么：只有同一次搜索内沿路径连续相乘，累计值才等于「起点 ÷ 当前节点」，跨查询复用就会算错。`,
      { query: [A, B], path: [A], stack: [A], product: 1 },
    )

    while (frames.length > 0) {
      const cur = frames.pop()
      if (cur === undefined) break
      if (visited.has(cur.node)) continue
      visited.add(cur.node)

      if (cur.node === B) {
        results.push({ q: [A, B], a: cur.product })
        const rest = frames.map((f) => f.node)
        snap(
          'found',
          `观察：出栈 ${cur.node}，它正是查询目标 ${B}，路径是 ${cur.path.join(' → ')}，累计比值 ${fmt(cur.product)}。判断：路径上每一条边权都是「上一跳 ÷ 下一跳」，逐段相乘后中间变量全部约掉，剩下的就是 ${A} ÷ ${B}。动作：写入答案 ${A}/${B} = ${fmt(cur.product)}，本次查询结束${rest.length > 0 ? `，栈中剩余的 ${rest.join('、')} 不再展开` : ''}。为什么：DFS 一命中目标就立即返回，不必再去试探其它分支。`,
          {
            query: [A, B],
            path: cur.path.slice(),
            current: cur.node,
            hit: cur.node,
            stack: rest.slice().reverse(),
            product: cur.product,
          },
        )
        break
      }

      const outs = ADJ[cur.node] ?? []
      const fresh = outs.filter((e) => !visited.has(e.to))
      const skipped = outs.filter((e) => visited.has(e.to)).map((e) => e.to)

      // 反向压栈：邻接表中第一个未访问邻居落在栈顶，下一步先出栈它
      for (let k = fresh.length - 1; k >= 0; k--) {
        frames.push({
          node: fresh[k].to,
          product: cur.product * fresh[k].w,
          path: [...cur.path, fresh[k].to],
        })
      }

      const outText =
        outs.length === 0
          ? `${cur.node} 没有任何出边`
          : `${cur.node} 的出边有 ${outs.map((e) => `${cur.node}→${e.to}（权 ${fmt(e.w)}）`).join('、')}`

      const actionText =
        fresh.length > 0
          ? `把 ${fresh.map((e) => `${cur.node}→${e.to}（×${fmt(e.w)} → 累计 ${fmt(cur.product * e.w)}）`).join('、')}压入栈${skipped.length > 0 ? `，已访问过的 ${skipped.join('、')} 跳过` : ''}；栈顶是 ${fresh[0].to}，下一步先出栈它`
          : skipped.length > 0
            ? `没有未访问的出边可以扩展（${skipped.join('、')} 已在 visited 里），这条分支到此为止`
            : '没有出边可以扩展，这条分支到此为止'

      snap(
        'visit',
        `观察：出栈 ${cur.node}，路径 ${cur.path.join(' → ')} 的累计比值是 ${fmt(cur.product)}，它不是目标 ${B}。判断：${outText}。动作：${actionText}。为什么：边权表示「本节点 ÷ 下一跳」，乘到累计比值上就得到「起点 ÷ 下一跳」；跳过已访问节点是为了避免在有向图里绕圈。`,
        {
          query: [A, B],
          path: cur.path.slice(),
          current: cur.node,
          stack: frames.map((f) => f.node).reverse(),
          product: cur.product,
        },
      )
    }
  }

  snap(
    'done',
    `观察：5 组查询全部处理完，答案依次是 ${results.map((r) => `${r.q[0]}/${r.q[1]} = ${fmt(r.a)}`).join('、')}，与题解示例 1 的输出 [${EXPECTED.map(fmt).join(', ')}] 一致。判断：a、b、c 属于同一个连通分量，两两之间都有路径；e 和 x 从未出现在任何等式里，所以 a/e 与 x/x 不可达。动作：按查询顺序返回 [${results.map((r) => fmt(r.a)).join(', ')}]。为什么：每条查询就是图上一次 DFS，时间 O(V + E)；每条等式建两条有向边，空间 O(V + E)。`,
  )

  // 「下一步动作」由后一个快照回填，保证 Hint 与实际步骤完全一致
  steps.forEach((s, i) => {
    const b = steps[i + 1]
    if (!b) return
    if (b.phase === 'done') {
      s.next = '汇总 5 组查询的答案'
      return
    }
    if (!b.query) return
    const [qa, qb] = b.query
    if (b.phase === 'start') {
      s.next = `开始查询 ${qa}/${qb}：从 ${qa} 出发，累计比值置 1.0`
    } else if (b.phase === 'visit') {
      s.next = `出栈 ${b.current}，看它是否等于目标 ${qb}`
    } else if (b.phase === 'found') {
      s.next = `出栈 ${b.current}：命中目标 ${qb}，写入答案 ${qa}/${qb} = ${b.product === null ? '' : fmt(b.product)}`
    } else if (b.phase === 'self') {
      s.next = `查询 ${qa}/${qb}：两个变量是同一点，直接返回 1.0`
    } else if (b.phase === 'absent') {
      s.next = `查询 ${qa}/${qb}：变量 ${b.miss} 不在图上，不可达，返回 -1.0`
    }
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

const W = 640
const H = 230
const NODE_R = 30
const ROW_DY = 20
const NODE_Y = 140
const EDGE_IDLE = 'hsl(var(--ink) / 0.35)'

/** 手写坐标表（模式 F：禁止力导向布局，同一输入永远得到同一张图） */
const POS: Record<string, { x: number; y: number }> = {
  a: { x: 110, y: NODE_Y },
  b: { x: 320, y: NODE_Y },
  c: { x: 530, y: NODE_Y },
}

/** 一对节点之间的两条反向边走上 / 下两条平行线：字母序小的当正向走上面 */
function arcDy(from: string, to: string): number {
  return from < to ? -ROW_DY : ROW_DY
}

/** 图上不存在的变量，用场外虚影节点表示 */
const GHOST = { x: 586, y: 198, r: 20 }

type NodeState = 'idle' | 'stack' | 'target' | 'path' | 'current' | 'hit'

const NODE_SKIN: Record<NodeState, { fill: string; stroke: string; text: string }> = {
  idle: { fill: TONE.muted, stroke: 'hsl(var(--border))', text: 'hsl(var(--ink-soft))' },
  stack: { fill: 'hsl(var(--teal-soft))', stroke: TONE.teal, text: TONE.teal },
  target: { fill: 'hsl(var(--easy-soft))', stroke: TONE.easy, text: TONE.easy },
  path: { fill: 'hsl(var(--amber-soft))', stroke: TONE.amber, text: TONE.amber },
  current: { fill: 'hsl(var(--amber-soft))', stroke: TONE.amber, text: TONE.amber },
  hit: { fill: 'hsl(var(--easy-soft))', stroke: TONE.easy, text: TONE.easy },
}

/** 状态文字：不靠颜色也能读出节点处于哪一步 */
const STATE_LABEL: Record<NodeState, string> = {
  idle: '未访问',
  stack: '栈中待探索',
  target: '查询目标',
  path: '路径上',
  current: '正在出栈',
  hit: '命中目标',
}

function nodeStateOf(step: Step, name: string): NodeState {
  if (step.hit === name) return 'hit'
  if (step.current === name) return 'current'
  if (step.query && step.query[1] === name) return 'target'
  if (step.path.includes(name)) return 'path'
  if (step.stack.includes(name)) return 'stack'
  return 'idle'
}

function edgeOnPath(path: string[], from: string, to: string): boolean {
  for (let i = 0; i + 1 < path.length; i++) {
    if (path[i] === from && path[i + 1] === to) return true
  }
  return false
}

function Stage(step: Step) {
  const done = step.phase === 'done'
  const resultText = step.results.map((r) => fmt(r.a)).join(', ')

  return (
    <div className="flex flex-col gap-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full select-none">
        <defs>
          <marker
            id="ed-amber"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M0,1 L10,5 L0,9 z" fill={TONE.amber} />
          </marker>
          <marker
            id="ed-idle"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M0,1 L10,5 L0,9 z" fill={EDGE_IDLE} />
          </marker>
        </defs>

        {/* 顶部：本步正在回答的查询 */}
        <text
          x={W / 2}
          y={36}
          textAnchor="middle"
          fontSize="13"
          fontWeight="700"
          className="font-code"
          fill={step.query ? 'hsl(var(--ink))' : 'hsl(var(--ink-soft))'}
        >
          {done
            ? '全部查询完成'
            : step.query
              ? `查询 ${step.query[0]} / ${step.query[1]}`
              : 'equations → 带权有向图'}
        </text>

        {/* 1. 有向边：琥珀 = 当前路径，灰 = 其它边 */}
        {ARCS.map((e) => {
          const p = POS[e.from]
          const q = POS[e.to]
          const dy = arcDy(e.from, e.to)
          const y = p.y + dy
          const half = Math.sqrt(NODE_R * NODE_R - dy * dy)
          const dir = q.x > p.x ? 1 : -1
          const x1 = p.x + dir * (half + 5)
          const x2 = q.x - dir * (half + 5)
          const active = edgeOnPath(step.path, e.from, e.to)
          const stroke = active ? TONE.amber : EDGE_IDLE
          return (
            <g key={`${e.from}>${e.to}`}>
              <line
                x1={x1}
                y1={y}
                x2={x2}
                y2={y}
                stroke={stroke}
                strokeWidth={active ? 3.5 : 2}
                markerEnd={active ? 'url(#ed-amber)' : 'url(#ed-idle)'}
              />
              <text
                x={(p.x + q.x) / 2}
                y={y + (dy < 0 ? -16 : 16)}
                textAnchor="middle"
                fontSize="12"
                fontWeight="600"
                className="font-code"
                fill={stroke}
              >
                {`${e.from}/${e.to}=${fmt(e.w)}`}
              </text>
            </g>
          )
        })}

        {/* 2. 图上不存在的变量：场外虚影 */}
        {step.miss && (
          <g>
            <circle
              cx={GHOST.x}
              cy={GHOST.y}
              r={GHOST.r}
              fill="none"
              stroke={TONE.hard}
              strokeWidth="2"
              strokeDasharray="5 4"
            />
            <text
              x={GHOST.x}
              y={GHOST.y + 6}
              textAnchor="middle"
              fontSize="16"
              fontWeight="700"
              className="font-code"
              fill={TONE.hard}
            >
              {step.miss}
            </text>
            <text
              x={GHOST.x}
              y={GHOST.y - GHOST.r - 8}
              textAnchor="middle"
              fontSize="10"
              fontWeight="600"
              fill={TONE.hard}
            >
              不在图上
            </text>
          </g>
        )}

        {/* 3. 变量节点：圆内变量名，上方状态文字 */}
        {NODES.map((name) => {
          const p = POS[name]
          const st = nodeStateOf(step, name)
          const skin = NODE_SKIN[st]
          return (
            <g key={name}>
              {step.current === name && (
                <circle cx={p.x} cy={p.y} r={NODE_R + 6} fill="none" stroke={TONE.amber} strokeWidth="3" />
              )}
              {st === 'target' && (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={NODE_R + 6}
                  fill="none"
                  stroke={TONE.easy}
                  strokeWidth="2.5"
                  strokeDasharray="5 4"
                />
              )}
              <circle cx={p.x} cy={p.y} r={NODE_R} fill={skin.fill} stroke={skin.stroke} strokeWidth="2.5" />
              <text
                x={p.x}
                y={p.y + 7}
                textAnchor="middle"
                fontSize="20"
                fontWeight="700"
                className="font-code"
                fill={skin.text}
              >
                {name}
              </text>
              <text
                x={p.x}
                y={p.y - NODE_R - 10}
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                fill={skin.text}
              >
                {STATE_LABEL[st]}
              </text>
            </g>
          )
        })}
      </svg>

      {/* 当前路径 / 累计比值 */}
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs">
        {done ? (
          <span className="text-ink-soft">
            5 组查询全部完成：a、b、c 在同一连通分量内 3 组有解，e、x 不在图上 2 组不可达
          </span>
        ) : step.phase === 'absent' ? (
          <span style={{ color: TONE.hard }}>
            变量 <b className="font-code">{step.miss}</b> 不在图上，从 {step.query ? step.query[0] : '?'} 出发也没有任何边通向它
          </span>
        ) : step.query ? (
          <>
            <span className="text-ink-soft">当前路径</span>
            <b className="font-code text-ink">{step.path.length > 0 ? step.path.join(' → ') : '—'}</b>
            <span className="text-ink-soft">｜累计比值</span>
            <b className="font-code" style={{ color: TONE.amber }}>
              {step.product === null ? '—' : fmt(step.product)}
            </b>
          </>
        ) : (
          <span className="text-ink-soft">
            {NODES.length} 个变量、{ARCS.length} 条有向边（每个等式拆成正反两条），下面逐条查询做 DFS
          </span>
        )}
      </div>

      <Badges className="justify-center">
        {done ? (
          <>
            <Stat label="已解出" value={`${QUERIES.length} / ${QUERIES.length}`} tone="easy" />
            <Stat label="不可达" value="2 组（a/e、x/x）" tone="hard" />
            <Answer>
              <b className="font-code">[{resultText}]</b>
            </Answer>
          </>
        ) : (
          <>
            <Stat
              label="当前查询"
              value={step.query ? `${step.query[0]} / ${step.query[1]}` : '—'}
              tone="amber"
            />
            {step.phase === 'absent' ? (
              <Badge tone="hard">
                不可达：<b className="font-code">{step.miss}</b> 不在图上 → -1.0
              </Badge>
            ) : (
              <Stat
                label="累计比值"
                value={step.product === null ? '—' : fmt(step.product)}
                tone="teal"
              />
            )}
            <Stat label="已解出" value={`${step.results.length} / ${QUERIES.length}`} tone="easy" />
            {step.next && <Hint>{step.next}</Hint>}
          </>
        )}
      </Badges>
    </div>
  )
}

export default function EvaluateDivisionDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="带权有向图 + DFS 累乘路径权重"
      info={`输入取题解「示例 1」：equations = [["a","b"],["b","c"]]，values = [2.0, 3.0]，queries = [["a","c"],["b","a"],["a","e"],["a","a"],["x","x"]]，输出 [6.0, 0.5, -1.0, 1.0, -1.0]。这里的 12 步把 5 组查询全部演示完：每个等式先拆成正反两条有向边建图，再逐条查询做 DFS 并累乘边权，不可达的 a/e、x/x 返回 -1.0。`}
      steps={steps}
      autoMs={1500}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '当前搜索路径（节点与边）' },
        { color: TONE.teal, label: '已入栈、待探索的节点' },
        { color: TONE.easy, label: '查询目标 / 命中答案' },
        { color: TONE.muted, label: '尚未访问的变量' },
        { color: EDGE_IDLE, label: '不在当前路径上的有向边' },
      ]}
    />
  )
}
