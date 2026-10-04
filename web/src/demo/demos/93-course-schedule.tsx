import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badge, Badges, Hint, Stat, TONE } from './stage'

/* ------------------------------------------------------------------ */
/* 93. 课程表 —— 模式 F：有向图 + Kahn（BFS + 入度）拓扑排序              */
/* 有向边方向以题解为准：[a, b] 表示「学 a 前必须先学 b」 → 边 b → a      */
/* ------------------------------------------------------------------ */

const NUM_COURSES = 4
const PREREQUISITES: [number, number][] = [
  [1, 0],
  [2, 0],
  [3, 1],
  [3, 2],
]

const COURSES = Array.from({ length: NUM_COURSES }, (_, i) => i)
const EDGES = PREREQUISITES.map(([a, b]) => ({ from: b, to: a }))

interface Step {
  /** 各课程当前入度快照 */
  indeg: number[]
  /** 队列内容快照（含待处理课程） */
  queue: number[]
  /** 已排入拓扑序的课程 */
  order: number[]
  /** 已松弛过的先修边，形如 "0>1" */
  relaxed: string[]
  /** 本步正在处理的课程（刚出队） */
  current: number | null
  /** 本步松弛的边 */
  activeEdge: [number, number] | null
  phase: 'init' | 'enqueue' | 'dequeue' | 'relax' | 'done'
  hint: string
  note: string
}

function buildSteps(): Step[] {
  const graph: number[][] = COURSES.map(() => [])
  const indeg: number[] = COURSES.map(() => 0)
  for (const [a, b] of PREREQUISITES) {
    graph[b].push(a) // 先修课 b 指向后修课 a
    indeg[a]++
  }

  const steps: Step[] = []
  const queue: number[] = []
  const order: number[] = []
  const relaxed: string[] = []

  const snap = (
    phase: Step['phase'],
    note: string,
    hint: string,
    current: number | null = null,
    activeEdge: [number, number] | null = null
  ) => {
    steps.push({
      indeg: indeg.slice(),
      queue: queue.slice(),
      order: order.slice(),
      relaxed: relaxed.slice(),
      current,
      activeEdge,
      phase,
      hint,
      note,
    })
  }

  const zeros = COURSES.filter((v) => indeg[v] === 0)

  snap(
    'init',
    `初始化：共 ${NUM_COURSES} 门课程 0–${NUM_COURSES - 1}，先修对 ${PREREQUISITES.map(([a, b]) => `[${a},${b}]`).join('、')} 中的 [a, b] 表示「学 a 前必须先学 b」，所以边由 b 指向 a：${EDGES.map((e) => `${e.from}→${e.to}`).join('、')}。据此统计各课入度 indegree = [${indeg.join(', ')}]：入度为 0 的课程有 ${zeros.join('、')}，可以立刻开始；其余课程都还被先修课挡住。`,
    `把入度为 0 的课程 ${zeros.join('、')} 入队`
  )

  zeros.forEach((v) => queue.push(v))
  snap(
    'enqueue',
    `观察入度表：入度为 0 的课程只有 ${zeros.join('、')}，把它入队，queue = [${queue.join(', ')}]。判断：入度为 0 表示没有任何未完成的先修课，这些课程现在就能学。动作：队列中的课程彼此没有先修依赖，它们的处理顺序可以互换。`,
    `出队队首课程 ${queue[0]}`
  )

  while (queue.length > 0) {
    const course = queue.shift()
    if (course === undefined) break
    order.push(course)
    const succ = graph[course]

    snap(
      'dequeue',
      `观察：队首是课程 ${course}，出队并写入拓扑序，order = [${order.join(', ')}]，已输出 ${order.length} / ${NUM_COURSES}。判断：它的入度已经归零，说明全部先修课都排在它前面，放在当前位置不会违反任何先后约束。动作：${
        succ.length > 0
          ? `遍历它的后继 ${succ.join('、')}，把入度各减 1，表示课程 ${course} 这门先修课已经修完。`
          : '它没有后继，出队后没有入度需要更新。'
      }`,
      succ.length > 0
        ? succ.length > 1
          ? `把后继 ${succ.join('、')} 的入度各减 1`
          : `把后继 ${succ[0]} 的入度减 1`
        : queue.length > 0
          ? `出队队首课程 ${queue[0]}`
          : '队列已空，检查 visited 是否等于 numCourses',
      course
    )

    for (let k = 0; k < succ.length; k++) {
      const next = succ[k]
      const before = indeg[next]
      indeg[next]--
      const toZero = indeg[next] === 0
      if (toZero) queue.push(next)
      relaxed.push(`${course}>${next}`)
      const hasMore = k + 1 < succ.length
      snap(
        'relax',
        `观察：松弛边 ${course}→${next}，课程 ${next} 的入度由 ${before} 减为 ${indeg[next]}${toZero ? '，降到 0' : '，仍大于 0'}。判断：${
          toZero
            ? `它的全部先修课（含刚输出的课程 ${course}）都已完成，现在可以学了。`
            : `它还有先修课没有输出完，条件还不满足。`
        }动作：${
          toZero ? `把课程 ${next} 入队，queue = [${queue.join(', ')}]。` : '先不入队，回到队列处理其他课程。'
        }`,
        hasMore
          ? `继续松弛课程 ${course} 的后继 ${succ[k + 1]}`
          : queue.length > 0
            ? `出队队首课程 ${queue[0]}`
            : '队列已空，检查 visited 是否等于 numCourses',
        course,
        [course, next]
      )
    }
  }

  const allOut = order.length === NUM_COURSES
  snap(
    'done',
    `队列已空，出队总数 visited = ${order.length} / ${NUM_COURSES}：${
      allOut
        ? `出队顺序 [${order.join(', ')}] 就是一个拓扑序，每门课都排在它的先修课之后，所以可以修完全部课程，返回 true。`
        : `出队顺序 [${order.join(', ')}] 只覆盖了部分课程，剩余课程入度都大于 0、彼此依赖成环，无法学完，返回 false。`
    }每个课程最多入队一次、每条先修边恰好被松弛一次，时间 O(V + E)；邻接表与入度数组占 O(V + E) 空间。`,
    ''
  )
  return steps
}

/* ---------------- 舞台渲染 ---------------- */

const W = 640
const H = 330
const NODE_R = 30

/** 手写坐标表（输入固定，允许硬编码）：按 DAG 分层 0 → {1, 2} → 3 */
const POS: Record<number, { x: number; y: number }> = {
  0: { x: 116, y: 166 },
  1: { x: 320, y: 82 },
  2: { x: 320, y: 250 },
  3: { x: 524, y: 166 },
}

/** 边标签坐标：放在远离图形中心（320, 166）的一侧，避免压线 */
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

function Stage(step: Step) {
  const stateOf = (v: number): NodeState => {
    if (step.current === v) return 'current'
    if (step.order.includes(v)) return 'out'
    if (step.queue.includes(v)) return 'queued'
    return 'idle'
  }

  const edgeOf = (from: number, to: number) => {
    const key = `${from}>${to}`
    if (step.activeEdge && step.activeEdge[0] === from && step.activeEdge[1] === to) {
      return { key, stroke: TONE.amber, label: TONE.amber, width: 3.5, marker: 'url(#cs-arrow-amber)' }
    }
    if (step.relaxed.includes(key)) {
      return { key, stroke: TONE.easy, label: TONE.easy, width: 2.5, marker: 'url(#cs-arrow-easy)' }
    }
    return {
      key,
      stroke: 'hsl(var(--ink) / 0.35)',
      label: 'hsl(var(--ink-soft))',
      width: 2,
      marker: 'url(#cs-arrow-idle)',
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

  const allOut = step.order.length === NUM_COURSES

  return (
    <div className="flex flex-col gap-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full select-none">
        <defs>
          {[
            { id: 'cs-arrow-idle', color: 'hsl(var(--ink) / 0.35)' },
            { id: 'cs-arrow-amber', color: TONE.amber },
            { id: 'cs-arrow-easy', color: TONE.easy },
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

        {/* 1. 先修边 b → a：琥珀 = 本步正在松弛，绿 = 已松弛，灰 = 未处理 */}
        {EDGES.map((e) => {
          const s = edgeOf(e.from, e.to)
          const { x1, y1, x2, y2 } = stick(e.from, e.to)
          return (
            <line
              key={s.key}
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
        {EDGES.map((e) => {
          const s = edgeOf(e.from, e.to)
          const at = EDGE_LABEL[s.key]
          return (
            <text
              key={s.key}
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

        {/* 3. 课程节点：圆内课程号，上方状态文字，下方实时入度 */}
        {COURSES.map((v) => {
          const p = POS[v]
          const st = stateOf(v)
          const skin = NODE_SKIN[st]
          const deg = step.indeg[v]
          return (
            <g key={v}>
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
              <text
                x={p.x}
                y={p.y - NODE_R - 12}
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                fill={skin.text}
              >
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

      <Badges>
        <Badge tone="teal">
          队列{' '}
          <b className="font-code text-xs">
            {step.queue.length > 0 ? `[${step.queue.join(', ')}]` : '（空）'}
          </b>
        </Badge>
        <Stat label="已输出" value={`${step.order.length} / ${NUM_COURSES}`} tone="easy" />
        {step.phase !== 'done' && (
          <Badge tone={allOut ? 'easy' : 'medium'}>
            {allOut ? '环：无（全部课程已出队）' : '环：待定'}
          </Badge>
        )}
        {step.phase !== 'done' && <Hint>{step.hint}</Hint>}
        {step.phase === 'done' &&
          (allOut ? (
            <Answer>
              可以修完全部课程，拓扑序 = [{step.order.join(', ')}]，visited = {step.order.length} = numCourses
            </Answer>
          ) : (
            <Answer>{`无法完成：visited = ${step.order.length} < numCourses，剩余课程成环`}</Answer>
          ))}
      </Badges>
    </div>
  )
}

export default function CourseScheduleDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="Kahn 入度法拓扑排序"
      info={`numCourses = ${NUM_COURSES}，prerequisites = [[1,0],[2,0],[3,1],[3,2]]（题解示例为 2 门课，这里换成 4 门课以完整展示入队 / 松弛 / 出队过程）；[a, b] 表示学 a 前必须先学 b，即先修边 b → a。判断能否学完全部课程。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '当前出队的课程' },
        { color: TONE.teal, label: '队列中待处理' },
        { color: TONE.easy, label: '已排入拓扑序 / 已松弛的边' },
        { color: 'hsl(var(--ink) / 0.35)', label: '尚未松弛的先修边' },
      ]}
    />
  )
}
