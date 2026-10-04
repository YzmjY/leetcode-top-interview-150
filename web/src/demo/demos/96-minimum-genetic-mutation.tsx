import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badge, Badges, Hint, Stat, TONE } from './stage'

/* ------------------------------------------------------------------ */
/* 96. 最小基因变化 —— 模式 F：基因串做节点，只差一个字符则连边            */
/* BFS 逐层扩展求无权图最短路；节点坐标手写，不使用力导向布局              */
/* ------------------------------------------------------------------ */

/** 固定示例（题解「示例 2」）：start = "AACCGGTT"，end = "AAACGGTA"，ANSWER = 2 */
const START = 'AACCGGTT'
const END = 'AAACGGTA'
const BANK = ['AACCGGTA', 'AACCGCTA', 'AAACGGTA']
const LEN = START.length
const BASES = ['A', 'C', 'G', 'T']

/** 节点集合：start + 基因库里的 3 条基因（end 本身也在库中），共 4 个节点 */
const NODES = [START, 'AACCGGTA', END, 'AACCGCTA']

/**
 * 相邻关系（只差一个字符）。箭头按 BFS 的扩展方向画（该关系本身是对称的），
 * pos 是发生变化的字符位置，从 1 数起。
 */
const EDGES = [
  { from: START, to: 'AACCGGTA', pos: 8, fromCh: 'T', toCh: 'A', lx: 215, ly: 152 },
  { from: 'AACCGGTA', to: END, pos: 3, fromCh: 'C', toCh: 'A', lx: 436, ly: 108 },
  { from: 'AACCGGTA', to: 'AACCGCTA', pos: 6, fromCh: 'G', toCh: 'C', lx: 456, ly: 240 },
]

const edgeKey = (from: string, to: string) => `${from}>${to}`
const EDGE_BY_KEY = new Map(EDGES.map((e) => [edgeKey(e.from, e.to), e]))

interface Step {
  phase: 'init' | 'expand' | 'discover' | 'layer' | 'done'
  /** 本步正在扩展（刚出队）的基因 */
  current: string | null
  /** 当前层里还没扩展的基因 */
  layer: string[]
  /** 已经出队扩展过的基因 */
  expanded: string[]
  /** 已经标记访问的基因（含刚入队的下一层） */
  visited: string[]
  /** 原始 BFS 队列快照 */
  queue: string[]
  /** 已经走到的边，形如 "AACCGGTT>AACCGGTA" */
  edges: string[]
  /** 本步刚走到的边 */
  activeEdge: string | null
  /** 各基因到 start 的距离 */
  dist: Record<string, number>
  /** 已经扩展完的层数 = 最少变化次数 */
  steps: number
  answer: number | null
  note: string
  /** 下一步动作：由后一个快照统一回填，保证 Hint 说的就是下一步 */
  hint: string
}

function buildSteps(): Step[] {
  const bankSet = new Set(BANK)
  const steps: Step[] = []
  const visited = new Set<string>([START])
  const dist: Record<string, number> = { [START]: 0 }
  const queue: string[] = [START]
  const expanded: string[] = []
  const edges: string[] = []
  /** 当前层里尚未扩展的基因 */
  let layer: string[] = [START]
  let level = 0
  let answer: number | null = null

  const snap = (
    phase: Step['phase'],
    note: string,
    current: string | null = null,
    activeEdge: string | null = null
  ) => {
    steps.push({
      phase,
      current,
      layer: layer.slice(),
      expanded: expanded.slice(),
      visited: Array.from(visited),
      queue: queue.slice(),
      edges: edges.slice(),
      activeEdge,
      dist: { ...dist },
      steps: level,
      answer,
      note,
      hint: '',
    })
  }

  snap(
    'init',
    `观察：start = "${START}"，end = "${END}"，bank = ${JSON.stringify(BANK)}，end 就在基因库中。判断：一次变化只改 8 个字符里的一个，所以「只差一个字符」的两个基因互为邻边，最少变化次数就是无权图上 start 到 end 的最短路径。动作：把 bank 装进 bankSet，start 入队并标记访问，dist["${START}"] = 0。为什么：只有 bankSet 里的基因能当中间序列，start 是唯一允许不在库中的例外。`
  )

  while (queue.length > 0 && answer === null) {
    const size = queue.length
    for (let k = 0; k < size && answer === null; k++) {
      const cur = queue.shift() as string
      expanded.push(cur)
      layer = layer.filter((g) => g !== cur)

      if (cur === END) {
        answer = level
        const left = queue.length > 0 ? `队列里剩下的 ${queue.map((g) => `"${g}"`).join('、')}` : '队列已空'
        snap(
          'done',
          `观察：出队 "${cur}" 时它正好等于 end，此时 steps = ${level}。判断：start →(第 8 位 T→A) "AACCGGTA" →(第 3 位 C→A) "${END}" 一共 ${level} 条边，${left} 不必再扩展。动作：返回最少变化次数 ${level}。为什么：BFS 逐层扩展，第一次遇到 end 的层数就是最短路径长度；时间 O(N × L × 4)（L = ${LEN}），visited 与队列最多存 N + 1 条基因，空间 O(N)。`,
          cur
        )
        break
      }

      // 先只看不改：按题解逐位枚举 8 × 3 = 24 个候选
      const bytes = cur.split('')
      const hits: { gene: string; pos: number; fromCh: string; toCh: string }[] = []
      for (let j = 0; j < LEN; j++) {
        const original = bytes[j]
        for (const b of BASES) {
          if (b === original) continue
          bytes[j] = b
          const next = bytes.join('')
          if (bankSet.has(next) && !visited.has(next)) {
            hits.push({ gene: next, pos: j + 1, fromCh: original, toCh: b })
          }
        }
        bytes[j] = original // 改完必须恢复原位，否则后续位置会被污染
      }

      const hitText =
        hits.length > 0
          ? hits.map((h) => `第 ${h.pos} 位 ${h.fromCh}→${h.toCh} 得到 "${h.gene}"`).join('、')
          : '没有任何候选同时满足「在 bankSet 中」和「未被访问」'

      snap(
        'expand',
        `观察：出队 "${cur}"（dist = ${dist[cur]}），它是第 ${level} 层的基因，本层还剩 ${layer.length} 个待扩展。判断：对 8 个位置各试另外 3 种碱基共 8 × 3 = 24 个候选，只有落在 bankSet 里且没被访问过的才合法，本次命中 ${hitText}。动作：逐位枚举并记下这些命中，下一步把它们依次入队。为什么：bankSet 过滤保证每次变化都合法，visited 过滤保证每个基因只入队一次，BFS 的「首次到达即最短」才成立。`,
        cur
      )

      for (const h of hits) {
        visited.add(h.gene)
        dist[h.gene] = dist[cur] + 1
        queue.push(h.gene)
        const key = edgeKey(cur, h.gene)
        edges.push(key)
        snap(
          'discover',
          `观察：把第 ${h.pos} 位 '${h.fromCh}' 换成 '${h.toCh}' 得到 "${h.gene}"，它在 bankSet 中且未被访问${h.gene === END ? '，而且正好就是 end' : ''}。判断：这是从 "${cur}" 走一条边到达的新基因，距离为 dist["${cur}"] + 1 = ${dist[h.gene]}。动作：标记访问并入队，queue = [${queue.map((g) => `"${g}"`).join(', ')}]。为什么：BFS 第一次发现某条基因时经过的边数一定最短${h.gene === END ? '，但按题解要在出队时才比较 end' : ''}。`,
          cur,
          key
        )
      }
    }

    if (answer === null && queue.length > 0) {
      level++
      layer = queue.slice()
      snap(
        'layer',
        `观察：第 ${level - 1} 层扩展完毕，队列 = [${queue.map((g) => `"${g}"`).join(', ')}]，visited 已有 ${visited.size} 条基因。判断：这些基因离 start 恰好 ${level} 步，构成新的当前层，下一轮就出队它们。动作：steps 增到 ${level}，下一轮从队首 "${queue[0]}" 开始出队。为什么：steps 统计的是已经走过的边数，而第 d 层的基因到 start 的距离恰好是 d，所以出队到 end 时返回 steps 就是最少变化次数。`
      )
    }
  }

  // Hint 用后一个快照回填，保证「下一步」说的确实是下一步要做的动作
  steps.forEach((s, i) => {
    const b = steps[i + 1]
    if (!b) return
    if (b.phase === 'expand') {
      s.hint = `出队 "${b.current}"，对 8 个位置逐位枚举 24 个候选`
    } else if (b.phase === 'discover') {
      const e = b.activeEdge ? EDGE_BY_KEY.get(b.activeEdge) : undefined
      s.hint = e ? `把第 ${e.pos} 位 ${e.fromCh}→${e.toCh} 得到的 "${e.to}" 入队` : '把新基因入队'
    } else if (b.phase === 'layer') {
      s.hint = `第 ${b.steps - 1} 层扩展完毕，steps 增到 ${b.steps}`
    } else if (b.phase === 'done') {
      s.hint = `出队队首 "${b.current}" 并与 end 比较`
    }
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

const W = 680
const H = 350
const NODE_R = 40

/** 手写坐标表（输入固定）：按 BFS 层从左到右，第 2 层两个节点上下分开 */
const NODE_POS: Record<string, { x: number; y: number }> = {
  AACCGGTT: { x: 100, y: 174 },
  AACCGGTA: { x: 330, y: 174 },
  AAACGGTA: { x: 560, y: 92 },
  AACCGCTA: { x: 560, y: 256 },
}

type NodeState = 'active' | 'layer' | 'queued' | 'expanded' | 'reached' | 'unvisited'

const NODE_SKIN: Record<NodeState, { fill: string; stroke: string; text: string }> = {
  active: { fill: 'hsl(var(--amber-soft))', stroke: TONE.amber, text: TONE.amber },
  layer: { fill: 'hsl(var(--amber-soft))', stroke: TONE.amber, text: TONE.amber },
  queued: { fill: 'hsl(var(--teal-soft))', stroke: TONE.teal, text: TONE.teal },
  expanded: { fill: 'hsl(var(--teal-soft))', stroke: TONE.teal, text: TONE.teal },
  reached: { fill: 'hsl(var(--easy-soft))', stroke: TONE.easy, text: TONE.easy },
  // 未发现的基因用与图例 muted 完全一致的 18% ink 灰底
  unvisited: { fill: TONE.muted, stroke: 'hsl(var(--border))', text: 'hsl(var(--ink-soft))' },
}

/** 状态文字：不靠颜色也能读出每个基因处在哪一步 */
const STATE_LABEL: Record<NodeState, string> = {
  active: '正在扩展',
  layer: '本层待扩展',
  queued: '已入队',
  expanded: '已扩展',
  reached: '已到达 end',
  unvisited: '未发现',
}

const IDLE_EDGE = 'hsl(var(--ink) / 0.35)'

function Stage(step: Step) {
  const stateOf = (g: string): NodeState => {
    if (step.answer !== null && g === END) return 'reached'
    if (step.current === g) return 'active'
    if (step.layer.includes(g)) return 'layer'
    if (step.expanded.includes(g)) return 'expanded'
    if (step.visited.includes(g)) return 'queued'
    return 'unvisited'
  }

  const edgeSkin = (key: string) => {
    if (step.activeEdge === key) {
      return { stroke: TONE.amber, width: 3.5, marker: 'url(#gm-arrow-amber)', label: TONE.amber }
    }
    if (step.edges.includes(key)) {
      return { stroke: TONE.teal, width: 2.5, marker: 'url(#gm-arrow-teal)', label: TONE.teal }
    }
    return { stroke: IDLE_EDGE, width: 2, marker: 'url(#gm-arrow-idle)', label: IDLE_EDGE }
  }

  /** 边两端各留出节点半径 + 箭头位置，箭头不会被圆盖住 */
  const stick = (from: string, to: string) => {
    const p = NODE_POS[from]
    const q = NODE_POS[to]
    const dx = q.x - p.x
    const dy = q.y - p.y
    const len = Math.hypot(dx, dy) || 1
    const off = NODE_R + 12
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
        <defs>
          {[
            { id: 'gm-arrow-idle', color: IDLE_EDGE },
            { id: 'gm-arrow-amber', color: TONE.amber },
            { id: 'gm-arrow-teal', color: TONE.teal },
          ].map((m) => (
            <marker
              key={m.id}
              id={m.id}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M0,1 L10,5 L0,9 z" fill={m.color} />
            </marker>
          ))}
        </defs>

        {/* 1. 相邻边：琥珀 = 本步走到，青 = 已走到，灰 = 还没走到 */}
        {EDGES.map((e) => {
          const key = edgeKey(e.from, e.to)
          const s = edgeSkin(key)
          const { x1, y1, x2, y2 } = stick(e.from, e.to)
          return (
            <line
              key={`line-${key}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={s.stroke}
              strokeWidth={s.width}
              markerEnd={s.marker}
            />
          )
        })}

        {/* 2. 边标签：写清是第几个字符发生了变化 */}
        {EDGES.map((e) => {
          const key = edgeKey(e.from, e.to)
          const s = edgeSkin(key)
          return (
            <text
              key={`label-${key}`}
              x={e.lx}
              y={e.ly}
              textAnchor="middle"
              fontSize="12"
              fontWeight="600"
              className="font-code"
              fill={s.label}
            >
              第{e.pos}位 {e.fromCh}→{e.toCh}
            </text>
          )
        })}

        {/* 3. 基因节点：圆内是 8 个字符，圆外是距离与状态文字 */}
        {NODES.map((g) => {
          const p = NODE_POS[g]
          const st = stateOf(g)
          const skin = NODE_SKIN[st]
          const d = step.dist[g]
          const tag = g === START ? 'start' : g === END ? 'end' : null
          const ring = st === 'active' || st === 'reached'
          return (
            <g key={g}>
              {tag && (
                <text
                  x={p.x}
                  y={p.y - NODE_R - 12}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="700"
                  className="font-code"
                  fill={st === 'reached' ? TONE.easy : 'hsl(var(--ink))'}
                >
                  {tag}
                </text>
              )}
              {ring && (
                <circle cx={p.x} cy={p.y} r={NODE_R + 6} fill="none" stroke={skin.stroke} strokeWidth="3" />
              )}
              <circle
                cx={p.x}
                cy={p.y}
                r={NODE_R}
                fill={skin.fill}
                stroke={skin.stroke}
                strokeWidth="2.5"
              />
              <text
                x={p.x}
                y={p.y + 5}
                textAnchor="middle"
                fontSize="13"
                fontWeight="700"
                className="font-code"
                fill={skin.text}
              >
                {g}
              </text>
              <text
                x={p.x}
                y={p.y + NODE_R + 18}
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                fill={skin.text}
              >
                {STATE_LABEL[st]}
              </text>
              <text
                x={p.x}
                y={p.y + NODE_R + 33}
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
                className="font-code"
                fill="hsl(var(--ink-soft))"
              >
                d={d === undefined ? '—' : d}
              </text>
            </g>
          )
        })}
      </svg>

      <Badges>
        <Badge>
          队列{' '}
          <b className="font-code text-xs">
            {step.queue.length > 0 ? `[${step.queue.map((g) => `"${g}"`).join(', ')}]` : '（空）'}
          </b>
        </Badge>
        <Stat label="已扩展层数" value={step.steps} tone="amber" />
        <Stat label="已访问" value={`${step.visited.length} / ${NODES.length}`} tone="easy" />
        {step.phase !== 'done' && step.hint && <Hint>{step.hint}</Hint>}
        {step.phase === 'done' && (
          <Answer>
            最少变化次数 <b className="font-code">{step.answer}</b>
          </Answer>
        )}
      </Badges>
    </div>
  )
}

export default function MinimumGeneticMutationDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="基因图上的 BFS 最短路"
      info={`示例取自题解「示例 2」：start = "${START}"，end = "${END}"，bank = ${JSON.stringify(BANK)}，正确答案 2；题解示例 1 的 bank 只有 1 条基因、图上只有 2 个节点 1 条边，演不出逐层扩展的过程，这里换成示例 2 以完整展示两层扩展与 3 条边。图中 4 个节点是 start 与 bank 里的 3 条基因，边表示「只差一个字符」，边上标注发生变化的字符位置（从 1 数起）与字符替换，箭头画的是 BFS 的扩展方向（该关系本身对称）。从初始状态到返回答案共 ${steps.length} 步。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '当前层的基因（外环 = 正在扩展）/ 本步走到的边' },
        { color: TONE.teal, label: '已访问的基因（已入队或已扩展）/ 已走到的边' },
        { color: TONE.easy, label: '已到达 end，返回最少变化次数' },
        { color: TONE.muted, label: '基因库中尚未发现的基因' },
        { color: IDLE_EDGE, label: '尚未走到的相邻关系' },
      ]}
    />
  )
}
