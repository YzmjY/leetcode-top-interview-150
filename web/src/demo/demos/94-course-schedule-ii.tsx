import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badge, Badges, Cell, Hint, Stat, TONE } from './stage'

/* ------------------------------------------------------------------ */
/* 94. 课程表 II —— 模式 F：有向图 + Kahn 入度法，边输出拓扑序            */
/* 边方向以题解为准：prerequisites[i] = [a, b] 表示「学 a 前必须先学 b」， */
/* 即先修边 b → a：graph[b] 存 a，indegree[a]++                          */
/* ------------------------------------------------------------------ */

const NUM_COURSES = 4
/** 题解示例 2：numCourses = 4, prerequisites = [[1,0],[2,0],[3,1],[3,2]] → [0,1,2,3] */
const PREREQUISITES: [number, number][] = [
  [1, 0],
  [2, 0],
  [3, 1],
  [3, 2],
]

const COURSES = Array.from({ length: NUM_COURSES }, (_, i) => i)
/** 有向边：先修课 from → 后修课 to */
const EDGES = PREREQUISITES.map(([a, b]) => ({ from: b, to: a }))

const edgeKey = (from: number, to: number) => `${from}>${to}`

interface Step {
  phase: 'init' | 'build' | 'seed' | 'dequeue' | 'relax' | 'done'
  /** 各课程当前入度快照 */
  indeg: number[]
  /** 队列快照（队首在前） */
  queue: number[]
  /** 已排入拓扑序的课程 */
  order: number[]
  /** 已经建好的先修边，形如 "0>1" */
  builtEdges: string[]
  /** 已经松弛过的先修边 */
  relaxed: string[]
  /** 本步刚出队的课程 */
  current: number | null
  /** 本步正在松弛的边 */
  activeEdge: [number, number] | null
  /** 本步正在新建的边 */
  builtEdge: [number, number] | null
  /** 下一步动作（由后一个快照统一回填，供 Hint 使用） */
  next: string
  note: string
}

function buildSteps(): Step[] {
  const graph: number[][] = COURSES.map(() => [])
  const indeg: number[] = COURSES.map(() => 0)
  const queue: number[] = []
  const order: number[] = []
  const builtEdges: string[] = []
  const relaxed: string[] = []

  const steps: Step[] = []

  const snap = (phase: Step['phase'], note: string, extra: Partial<Step> = {}) => {
    steps.push({
      phase,
      note,
      next: '',
      indeg: indeg.slice(),
      queue: queue.slice(),
      order: order.slice(),
      builtEdges: builtEdges.slice(),
      relaxed: relaxed.slice(),
      current: null,
      activeEdge: null,
      builtEdge: null,
      ...extra,
    })
  }

  snap(
    'init',
    `观察：输入 numCourses = ${NUM_COURSES}、prerequisites = ${PREREQUISITES.map(
      ([a, b]) => `[${a},${b}]`
    ).join('、')}（题解示例 2），其中 [a, b] 表示学课程 a 之前必须先学课程 b。判断：此刻邻接表 graph 和入度数组 indegree = [${indeg.join(
      ', '
    )}] 都是初始值，图上还一条边都没有。动作：逐条读入先修对，为每条先修对建一条「先修课 → 后修课」的边，并把后修课的入度加 1。为什么：入度的含义是「这门课还有几门先修课没学完」，它是后面判断一门课能否立刻学习的唯一依据。`
  )

  for (const [a, b] of PREREQUISITES) {
    graph[b].push(a)
    indeg[a]++
    builtEdges.push(edgeKey(b, a))
    snap(
      'build',
      `观察：先修对 [${a},${b}] 表示学课程 ${a} 之前必须先学课程 ${b}。判断：依赖方向是先修课 → 后修课，所以这条边是 ${b}→${a} 而不是 ${a}→${b}，方向写反就会得到倒序的结果。动作：把 ${a} 追加进 graph[${b}]，课程 ${a} 的入度加 1，此时 indegree = [${indeg.join(
        ', '
      )}]。为什么：只有把「谁挡住谁」记在入度上，某门课入度归零时才能确定它真的可以学了。`,
      { builtEdge: [b, a] }
    )
  }

  const zeros = COURSES.filter((v) => indeg[v] === 0)
  zeros.forEach((v) => queue.push(v))
  snap(
    'seed',
    `观察：邻接表建好了 —— ${COURSES.map((v) => `graph[${v}] = [${graph[v].join(',')}]`).join(
      '，'
    )}，indegree = [${indeg.join(', ')}]。判断：入度为 0 的课程是 ${zeros.join(
      '、'
    )}，它没有任何未完成的先修课，可以最先学。动作：按题解代码从 0 到 ${
      NUM_COURSES - 1
    } 依次扫描入度表，把 ${zeros.join('、')} 入队，queue = [${queue.join(
      ', '
    )}]。为什么：入队顺序决定了具体输出，从小号扫起，示例 2 因此得到 [0,1,2,3] 而不是 [0,2,1,3]（两者都是合法答案）。`
  )

  while (queue.length > 0) {
    const course = queue.shift()
    if (course === undefined) break
    order.push(course)
    const succ = graph[course]

    snap(
      'dequeue',
      `观察：队首课程 ${course} 出队，追加到结果数组，order = [${order.join(', ')}]，已输出 ${
        order.length
      } / ${NUM_COURSES}。判断：它的入度已经归零，说明全部先修课都排在它前面，这个位置不会违反任何先后约束。动作：${
        succ.length > 0
          ? `遍历它的后继 graph[${course}] = [${succ.join(',')}]，把每个后继的入度减 1。`
          : '它没有后继，本步不需要更新任何入度。'
      }为什么：每松弛一条边，后继就少一门必须排在它前面的先修课。`,
      { current: course }
    )

    for (let k = 0; k < succ.length; k++) {
      const next = succ[k]
      const before = indeg[next]
      indeg[next]--
      const toZero = indeg[next] === 0
      if (toZero) queue.push(next)
      relaxed.push(edgeKey(course, next))
      snap(
        'relax',
        `观察：松弛边 ${course}→${next}，课程 ${next} 的入度由 ${before} 减为 ${indeg[next]}${
          toZero ? '，降到 0' : '，仍大于 0'
        }。判断：${
          toZero ? '它的全部先修课都已排进顺序，现在可以学了。' : '它还有先修课没有被排进顺序，条件还不满足。'
        }动作：${
          toZero
            ? `把课程 ${next} 入队，queue = [${queue.join(', ')}]。`
            : '本步不入队，回到队列继续处理其他课程。'
        }为什么：入度归零是入队的唯一条件，只有这样才能保证出队顺序满足所有先修约束。`,
        { current: course, activeEdge: [course, next] }
      )
    }
  }

  snap(
    'done',
    `观察：队列已空，出队总数 ${order.length} / ${NUM_COURSES}，结果数组 order = [${order.join(
      ', '
    )}]。判断：每门课都排在它全部先修课之后，长度正好等于课程总数，说明图中无环（若长度小于 numCourses，则剩余课程互相牵制成环，必须返回空数组）。动作：答案就是这个拓扑序 [${order.join(
      ', '
    )}]，读法是从左到右依次学习。为什么：每个课程入队、出队各一次，每条先修边恰好松弛一次，时间 O(V + E)；邻接表与入度数组占 O(V + E) 空间。`
  )

  // 「下一步动作」由后一个快照统一回填，保证 Hint 描述的动作与步骤数据完全一致
  steps.forEach((s, i) => {
    const b = steps[i + 1]
    if (!b) return
    if (b.phase === 'build' && b.builtEdge) {
      s.next = `建边 ${b.builtEdge[0]}→${b.builtEdge[1]}，课程 ${b.builtEdge[1]} 的入度加 1`
    } else if (b.phase === 'seed') {
      s.next = `扫描入度表，把入度为 0 的课程 ${b.queue.join('、')} 入队`
    } else if (b.phase === 'dequeue') {
      s.next = `出队队首课程 ${b.current}，追加到结果数组`
    } else if (b.phase === 'relax' && b.activeEdge) {
      s.next = `松弛边 ${b.activeEdge[0]}→${b.activeEdge[1]}，把课程 ${b.activeEdge[1]} 的入度减 1`
    } else if (b.phase === 'done') {
      s.next = `队列已空，检查已输出数是否等于 numCourses = ${NUM_COURSES}`
    }
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

const W = 640
const H = 330
const NODE_R = 30

/** 手写坐标表（模式 F 禁止力导向布局）：按 DAG 分层 0 → {1, 2} → 3 */
const POS: Record<number, { x: number; y: number }> = {
  0: { x: 116, y: 166 },
  1: { x: 320, y: 82 },
  2: { x: 320, y: 250 },
  3: { x: 524, y: 166 },
}

/** 边标签坐标：放在远离图形中心 (320, 166) 的一侧，避免压线 */
const EDGE_LABEL: Record<string, { x: number; y: number }> = {
  '0>1': { x: 209, y: 102 },
  '0>2': { x: 209, y: 230 },
  '1>3': { x: 431, y: 102 },
  '2>3': { x: 431, y: 230 },
}

type NodeState = 'idle' | 'queued' | 'current' | 'out'

const NODE_SKIN: Record<NodeState, { fill: string; stroke: string; text: string }> = {
  idle: { fill: 'hsl(var(--card))', stroke: 'hsl(var(--border))', text: 'hsl(var(--ink))' },
  queued: { fill: 'hsl(var(--teal-soft))', stroke: TONE.teal, text: TONE.teal },
  current: { fill: 'hsl(var(--amber-soft))', stroke: TONE.amber, text: TONE.amber },
  out: { fill: 'hsl(var(--easy-soft))', stroke: TONE.easy, text: TONE.easy },
}

/** 状态文字：不靠颜色也能读出节点处于哪一步 */
const STATE_LABEL: Record<NodeState, string> = {
  idle: '未入队',
  queued: '队列中',
  current: '当前出队',
  out: '已输出',
}

/** 本步正在做什么，作为动作徽章（Hint 只讲下一步） */
function actionOf(s: Step): string {
  if (s.phase === 'init') return '读入先修关系'
  if (s.phase === 'build' && s.builtEdge) return `建边 ${s.builtEdge[0]}→${s.builtEdge[1]}`
  if (s.phase === 'seed') return `课程 ${s.queue.join('、')} 入队`
  if (s.phase === 'dequeue') return `出队课程 ${s.current}`
  if (s.phase === 'relax' && s.activeEdge) return `松弛边 ${s.activeEdge[0]}→${s.activeEdge[1]}`
  return '收尾判断'
}

const LABEL_W = 64
const SLOT_W = 44
const GRID_MAX = LABEL_W + NUM_COURSES * SLOT_W + (NUM_COURSES - 1) * 6

function Stage(step: Step) {
  const stateOf = (v: number): NodeState => {
    if (step.current === v) return 'current'
    if (step.order.includes(v)) return 'out'
    if (step.queue.includes(v)) return 'queued'
    return 'idle'
  }

  const edgeSkin = (from: number, to: number) => {
    const isActive =
      (step.activeEdge !== null && step.activeEdge[0] === from && step.activeEdge[1] === to) ||
      (step.builtEdge !== null && step.builtEdge[0] === from && step.builtEdge[1] === to)
    if (isActive) {
      return {
        stroke: TONE.amber,
        label: TONE.amber,
        width: 3.5,
        marker: 'url(#u94-arrow-amber)',
      }
    }
    if (step.relaxed.includes(edgeKey(from, to))) {
      return { stroke: TONE.easy, label: TONE.easy, width: 2.5, marker: 'url(#u94-arrow-easy)' }
    }
    return {
      stroke: 'hsl(var(--ink) / 0.35)',
      label: 'hsl(var(--ink-soft))',
      width: 2,
      marker: 'url(#u94-arrow-idle)',
    }
  }

  /** 边两端各留出节点半径，箭头才不会被圆盖住 */
  const stick = (from: number, to: number) => {
    const p = POS[from]
    const q = POS[to]
    const dx = q.x - p.x
    const dy = q.y - p.y
    const len = Math.hypot(dx, dy) || 1
    const off = NODE_R + 9
    return {
      x1: p.x + (dx / len) * off,
      y1: p.y + (dy / len) * off,
      x2: q.x - (dx / len) * off,
      y2: q.y - (dy / len) * off,
    }
  }

  const shown = EDGES.filter((e) => step.builtEdges.includes(edgeKey(e.from, e.to)))

  return (
    <div className="flex flex-col items-center gap-4">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full select-none">
        <defs>
          {[
            { id: 'u94-arrow-idle', color: 'hsl(var(--ink) / 0.35)' },
            { id: 'u94-arrow-amber', color: TONE.amber },
            { id: 'u94-arrow-easy', color: TONE.easy },
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

        {/* 1. 先修边 b → a：琥珀 = 本步新建或正在松弛，绿 = 已松弛，灰 = 还没轮到 */}
        {shown.map((e) => {
          const s = edgeSkin(e.from, e.to)
          const { x1, y1, x2, y2 } = stick(e.from, e.to)
          return (
            <line
              key={`line-${e.from}>${e.to}`}
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

        {/* 2. 边标签：把先修方向写成文字 */}
        {shown.map((e) => {
          const s = edgeSkin(e.from, e.to)
          const at = EDGE_LABEL[edgeKey(e.from, e.to)]
          return (
            <text
              key={`label-${e.from}>${e.to}`}
              x={at.x}
              y={at.y}
              textAnchor="middle"
              fontSize="12"
              fontWeight="600"
              className="font-code"
              fill={s.label}
            >
              {e.from}→{e.to}
            </text>
          )
        })}

        {/* 3. 课程节点：圆内课程号、上方状态文字、下方实时入度 */}
        {COURSES.map((v) => {
          const p = POS[v]
          const st = stateOf(v)
          const skin = NODE_SKIN[st]
          const deg = step.indeg[v]
          return (
            <g key={`node-${v}`}>
              {st === 'current' && (
                <circle cx={p.x} cy={p.y} r={NODE_R + 6} fill="none" stroke={TONE.amber} strokeWidth="3" />
              )}
              <circle cx={p.x} cy={p.y} r={NODE_R} fill={skin.fill} stroke={skin.stroke} strokeWidth="2.5" />
              <text
                x={p.x}
                y={p.y + 4}
                textAnchor="middle"
                fontSize="20"
                fontWeight="700"
                className="font-code"
                fill={skin.text}
              >
                {v}
              </text>
              <text x={p.x} y={p.y - NODE_R - 12} textAnchor="middle" fontSize="11" fontWeight="700" fill={skin.text}>
                {STATE_LABEL[st]}
              </text>
              <text
                x={p.x}
                y={p.y + NODE_R + 20}
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
                className="font-code"
                fill={deg === 0 ? TONE.ink : 'hsl(var(--ink-soft))'}
              >
                入度 {deg}
              </text>
            </g>
          )
        })}
      </svg>

      {/* 队列与结果数组：固定 NUM_COURSES 个槽位，空位用灰点占位 */}
      <div
        className="grid w-full gap-1.5"
        style={{
          gridTemplateColumns: `${LABEL_W / 16}rem repeat(${NUM_COURSES}, minmax(0, 1fr))`,
          maxWidth: GRID_MAX,
        }}
      >
        <span className="flex items-center justify-end pr-1 font-code text-[10px] text-ink-soft sm:text-[11px]">
          队列
        </span>
        {COURSES.map((slot) => (
          <Cell
            key={`queue-${slot}`}
            size="sm"
            state={slot < step.queue.length ? 'new' : 'dim'}
            className="w-full min-w-0 sm:min-w-0"
          >
            {slot < step.queue.length ? step.queue[slot] : '·'}
          </Cell>
        ))}

        <span className="flex items-center justify-end pr-1 font-code text-[10px] text-ink-soft sm:text-[11px]">
          结果
        </span>
        {COURSES.map((slot) => (
          <Cell
            key={`order-${slot}`}
            size="sm"
            state={slot < step.order.length ? 'ok' : 'dim'}
            className="w-full min-w-0 sm:min-w-0"
          >
            {slot < step.order.length ? step.order[slot] : '·'}
          </Cell>
        ))}

        <span className="flex items-center justify-end pr-1 font-code text-[10px] text-ink-soft sm:text-[11px]">
          下标
        </span>
        {COURSES.map((slot) => (
          <div key={`index-${slot}`} className="flex h-5 items-center justify-center">
            <span className="font-code text-[11px] text-ink-soft">{slot}</span>
          </div>
        ))}
      </div>

      <Badges className="justify-center">
        <Stat label="已输出" value={`${step.order.length} / ${NUM_COURSES}`} tone="easy" />
        <Badge tone="teal">
          队列{' '}
          <b className="font-code text-xs">
            {step.queue.length > 0 ? `[${step.queue.join(', ')}]` : '（空）'}
          </b>
        </Badge>
        {step.phase !== 'done' && (
          <Badge tone="amber">
            本步 <b className="font-code text-xs">{actionOf(step)}</b>
          </Badge>
        )}
        {step.phase !== 'done' && <Hint>{step.next}</Hint>}
        {step.phase === 'done' && (
          <Answer>
            拓扑序 = <b className="font-code">[{step.order.join(', ')}]</b>，共{' '}
            <b className="font-code">{step.order.length}</b> 门课全部解锁，无环
          </Answer>
        )}
      </Badges>
    </div>
  )
}

export default function CourseScheduleIiDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="Kahn 入度法输出拓扑序"
      info={`输入：numCourses = ${NUM_COURSES}，prerequisites = [[1,0],[2,0],[3,1],[3,2]]（题解示例 2，答案 [0,1,2,3]）；[a, b] 表示学 a 前必须先学 b，即先修边 b → a。为完整展示「建边 → 入队 → 出队 → 松弛」的全过程，这里取示例 2（4 门课）而不是只有 2 门课的示例 1，全流程共 ${steps.length} 步。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '当前出队的课程 / 本步新建或正在松弛的边' },
        { color: TONE.teal, label: '队列中，入度已归零' },
        { color: TONE.easy, label: '已排入拓扑序 / 已松弛的边' },
        { color: TONE.muted, label: '空槽位：队列 / 结果还没填到这里（·）' },
        { color: 'hsl(var(--ink) / 0.35)', label: '已建好但还没松弛的先修边' },
      ]}
    />
  )
}
