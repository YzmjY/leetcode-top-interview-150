import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badge, Badges, Hint, Stat, TONE } from './stage'

/* ------------------------------------------------------------------ */
/* 95. 蛇梯棋 —— 模式 F：棋盘蛇形编号 + 无权图 BFS 分层扩展             */
/* 坐标为确定性的手写换算（编号 → 格子矩形），无任何力导向 / 自动布局     */
/* ------------------------------------------------------------------ */

/** 题解「示例 1」：6×6 棋盘，梯子 2→15、14→35，蛇 17→13，输出 4 */
const N = 6
const TARGET = N * N
const BOARD = [
  [-1, -1, -1, -1, -1, -1],
  [-1, -1, -1, -1, -1, -1],
  [-1, -1, -1, -1, -1, -1],
  [-1, 35, -1, -1, 13, -1],
  [-1, -1, -1, -1, -1, -1],
  [-1, 15, -1, -1, -1, -1],
]

const IDS = Array.from({ length: TARGET }, (_, i) => i + 1)

/** 编号 → 矩阵下标：row = n-1-(id-1)/n；(id-1)/n 为奇数（该行从右往左编号）时列翻转 */
function idToMatrix(id: number): { r: number; c: number } {
  const fromBottom = Math.floor((id - 1) / N)
  const col = (id - 1) % N
  return { r: N - 1 - fromBottom, c: fromBottom % 2 === 1 ? N - 1 - col : col }
}

/** 蛇 / 梯去向表（下标即编号）：-1 表示该格既没有蛇也没有梯 */
const JUMP_OF: number[] = new Array<number>(TARGET + 1).fill(-1)
IDS.forEach((id) => {
  const { r, c } = idToMatrix(id)
  JUMP_OF[id] = BOARD[r][c]
})

const JUMP_IDS = IDS.filter((id) => JUMP_OF[id] !== -1)
const LADDER_DESC = JUMP_IDS.filter((id) => JUMP_OF[id] > id)
  .map((id) => `${id}→${JUMP_OF[id]}`)
  .join('、')
const SNAKE_DESC = JUMP_IDS.filter((id) => JUMP_OF[id] < id)
  .map((id) => `${id}→${JUMP_OF[id]}`)
  .join('、')

interface Roll {
  /** 骰子点数 */
  k: number
  /** curr + k 对应的格子编号 */
  next: number
  /** 搭乘蛇 / 梯之后的真实落点 */
  landed: number
  jumped: boolean
  isNew: boolean
}

interface Step {
  phase: 'init' | 'expand' | 'done'
  /** 当前层：同一掷骰次数的全部编号，按入队顺序 */
  layer: number[]
  /** 本步出队的编号；init 为 null */
  cur: number | null
  /** 已掷骰次数（当前层深度） */
  depth: number
  visited: number[]
  /** 本步新入队的编号（传送之后的编号） */
  fresh: number[]
  rolls: Roll[]
  answer: number | null
  note: string
  /** 下一步动作：由后一个快照统一回填 */
  next: string
}

function buildSteps(): Step[] {
  const steps: Step[] = []
  const visited = new Set<number>([1])
  const queue: number[] = [1]
  let head = 0
  let depth = 0

  const snapshot = (
    phase: Step['phase'],
    layer: number[],
    cur: number | null,
    rolls: Roll[],
    fresh: number[],
    answer: number | null,
    note: string
  ): Step => ({
    phase,
    layer: layer.slice(),
    cur,
    depth,
    visited: [...visited].sort((a, b) => a - b),
    fresh: fresh.slice(),
    rolls,
    answer,
    note,
    next: '',
  })

  steps.push(
    snapshot(
      'init',
      queue.slice(head),
      null,
      [],
      [],
      null,
      `观察：${N}×${N} 棋盘按蛇形编号——最下面一行 ${IDS[0]}→${N} 由左向右，倒数第二行 ${N + 1}→${2 * N} 由右向左，逐行交替到最上面一行的右端是 ${TARGET}；board 上梯子是 ${LADDER_DESC}，蛇是 ${SNAKE_DESC}。判断：玩家的全部状态只有「当前站在哪个编号」，掷出 1~6 就唯一决定下一格，所以最少投掷次数就是这张无权图上 1→${TARGET} 的最短路。动作：visited[1] = true、queue = [1]、已掷骰次数 steps = 0，第 0 层只有起点 1。为什么：BFS 按层扩展，第一次出队 ${TARGET} 时的层数恰好就是最少投掷次数。`
    )
  )

  while (head < queue.length) {
    const layer = queue.slice(head)
    const size = layer.length
    for (let i = 0; i < size; i++) {
      const cur = queue[head]
      head++

      if (cur === TARGET) {
        steps.push(
          snapshot(
            'done',
            layer,
            cur,
            [],
            [],
            depth,
            `观察：本层出队到方格 ${cur} = n² = ${TARGET}，它就是终点。判断：BFS 保证第一次出队 ${TARGET} 的层数最小，此刻已掷骰次数就是最少移动次数 ${depth}。动作：返回 ${depth}（只有队列排空仍未出队 ${TARGET} 时才返回 -1）。为什么：每个编号最多入队一次、出队时最多枚举 6 个点数，共 6·n² 次转移，时间 O(n²)；visited 与队列各占 O(n²) 空间。`
          )
        )
        return steps
      }

      const rolls: Roll[] = []
      for (let k = 1; k <= 6; k++) {
        const next = cur + k
        if (next > TARGET) break
        const landed = JUMP_OF[next] !== -1 ? JUMP_OF[next] : next
        const isNew = !visited.has(landed)
        if (isNew) {
          visited.add(landed)
          queue.push(landed)
        }
        rolls.push({ k, next, landed, jumped: landed !== next, isNew })
      }

      const jumped = rolls.filter((r) => r.jumped)
      const fresh = rolls.filter((r) => r.isNew).map((r) => r.landed)
      const kept = [...new Set(rolls.filter((r) => !r.isNew).map((r) => r.landed))]
      const left = size - (i + 1)
      const over =
        rolls.length < 6
          ? `；点数 ${rolls.length + 1}~6 会让 curr+k 超过 ${TARGET}，题解在这里直接 break`
          : ''
      const jumpText =
        jumped.length > 0
          ? `判断：${jumped
              .map((r) => `方格 ${r.next} 上是${r.landed > r.next ? '梯子' : '蛇'}，按题意必须送到 ${r.landed}`)
              .join('；')}，每次移动最多搭乘一次、不能链式传送，所以标记 visited 用的是传送后的编号。`
          : rolls.length === 1
            ? '判断：这个落点既没有蛇也没有梯，实际落点就是 curr+k 本身。'
            : `判断：这 ${rolls.length} 个落点既没有蛇也没有梯，实际落点就是 curr+k 本身。`
      const freshText =
        fresh.length > 0
          ? `落点 ${fresh.join('、')} 此前没访问过，标记 visited 并入队到第 ${depth + 1} 层`
          : '这些落点全部已在 visited 中，本步没有新编号入队'
      const keptText = fresh.length > 0 && kept.length > 0 ? `（${kept.join('、')} 已访问过，直接跳过）` : ''
      const progressText =
        left > 0 ? `本层还剩 ${left} 个编号待出队` : `第 ${depth} 层已处理完，下一轮处理第 ${depth + 1} 层`

      steps.push(
        snapshot('expand', layer, cur, rolls, fresh, null, [
          `观察：本层出队方格 ${cur}（第 ${depth} 层，已掷 ${depth} 次），枚举骰子点数得到的候选格是 ${rolls
            .map((r) => r.next)
            .join('、')}${over}。`,
          jumpText,
          `动作：${freshText}${keptText}；${progressText}。`,
          `为什么：第 ${depth + 1} 层里的编号恰好是用 ${depth + 1} 次投掷可达、更少次数不可达的编号，visited 只剪掉不会更优的重复到达，不会漏解。`,
        ].join(''))
      )
    }
    depth++
  }

  // 兜底分支：本题示例必到 36，这里只保证「不可达」时也有唯一的结论步
  steps.push(
    snapshot(
      'done',
      [],
      null,
      [],
      [],
      -1,
      `观察：队列已经排空，visited 里始终没有出现过 ${TARGET}。判断：所有可达编号都扩展过了，终点不在其中。动作：按题解返回 -1。为什么：每个编号只入队一次，队列排空即说明 1→${TARGET} 不可达。`
    )
  )
  return steps
}

/* ---------------- 舞台几何：手写坐标表 ---------------- */

const GAP = 6
const CELL_W = 78
const CELL_H = 84
const PAD = 10
const VIEW_W = PAD * 2 + N * CELL_W + (N - 1) * GAP
const VIEW_H = PAD * 2 + N * CELL_H + (N - 1) * GAP

/** 手写坐标表：编号 → 格子矩形与中心点（列方向由蛇形编号决定，结果完全可复现） */
const BOX: { x: number; y: number; cx: number; cy: number }[] = []
IDS.forEach((id) => {
  const { r, c } = idToMatrix(id)
  const x = PAD + c * (CELL_W + GAP)
  const y = PAD + r * (CELL_H + GAP)
  BOX[id] = { x, y, cx: x + CELL_W / 2, cy: y + CELL_H / 2 }
})

/** 每条蛇 / 梯的弧线控制点偏移与箭头标签位置（手写）：曲线穿过格子间隙，文字不压住格内编号 */
const EDGE_GEO: Record<string, { bx: number; by: number; lx: number; ly: number }> = {
  '2>15': { bx: 0, by: 0, lx: 175, ly: 412 },
  '14>35': { bx: 84, by: 0, lx: 175, ly: 180 },
  '17>13': { bx: 0, by: -94, lx: 217, ly: 271 },
}

/** 二次贝塞尔边：两端各让出 46px，箭头落在格子边缘而不压住格内数字 */
function jumpPath(from: number, to: number, bx: number, by: number): string {
  const a = BOX[from]
  const b = BOX[to]
  const dx = b.cx - a.cx
  const dy = b.cy - a.cy
  const len = Math.hypot(dx, dy) || 1
  const sx = a.cx + (dx / len) * 46
  const sy = a.cy + (dy / len) * 46
  const ex = b.cx - (dx / len) * 46
  const ey = b.cy - (dy / len) * 46
  const mx = (sx + ex) / 2 + bx
  const my = (sy + ey) / 2 + by
  return `M ${sx.toFixed(1)} ${sy.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`
}

/* ---------------- 舞台渲染 ---------------- */

function Stage(step: Step) {
  const layerSet = new Set(step.layer)
  const visitedSet = new Set(step.visited)
  const freshSet = new Set(step.fresh)
  const activeJump = new Set(step.rolls.filter((r) => r.jumped).map((r) => `${r.next}>${r.landed}`))

  /** 格子状态：编号 → 底色 / 描边 / 状态文字（当前层覆盖「已访问」） */
  const skinOf = (id: number) => {
    const inLayer = layerSet.has(id)
    const isTarget = id === TARGET
    const jumped = JUMP_OF[id] !== -1
    const isVisited = visitedSet.has(id)
    const accent = isTarget
      ? TONE.easy
      : inLayer
        ? TONE.amber
        : isVisited
          ? TONE.teal
          : jumped
            ? TONE.medium
            : 'hsl(var(--border))'
    const fill = isTarget
      ? 'hsl(var(--easy-soft))'
      : inLayer
        ? 'hsl(var(--amber-soft))'
        : isVisited
          ? 'hsl(var(--teal-soft))'
          : TONE.muted
    const label = step.cur === id
      ? isTarget
        ? '终点 · 出队'
        : '▶ 当前出队'
      : isTarget
        ? inLayer
          ? '终点 · 本层'
          : '终点'
        : inLayer
          ? '本层'
          : freshSet.has(id)
            ? '＋ 新入队'
            : isVisited
              ? '已访问'
              : '未访问'
    /** 未访问（含蛇/梯起点）的编号与状态文字用 ink-soft，保证在灰底上仍可读 */
    const text = isTarget || inLayer || isVisited ? accent : 'hsl(var(--ink-soft))'
    return { accent, fill, label, inLayer, isVisited, jumped, isTarget, text }
  }

  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-col gap-3">
      <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="w-full select-none">
        <defs>
          <marker
            id="sl-arrow-active"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path d="M0,1 L10,5 L0,9 z" fill={TONE.amber} />
          </marker>
          <marker
            id="sl-arrow-idle"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path d="M0,1 L10,5 L0,9 z" fill={TONE.medium} />
          </marker>
        </defs>

        {/* 1. 格子底色：当前层琥珀、已访问青绿、终点绿、未访问灰 */}
        {IDS.map((id) => {
          const s = skinOf(id)
          return (
            <rect
              key={`fill-${id}`}
              x={BOX[id].x}
              y={BOX[id].y}
              width={CELL_W}
              height={CELL_H}
              rx={9}
              fill={s.fill}
              stroke={s.accent}
              strokeWidth={s.inLayer ? 2.5 : 2}
              strokeDasharray={!s.isVisited && !s.isTarget && s.jumped ? '5 4' : undefined}
            />
          )
        })}

        {/* 2. 蛇 / 梯传送边：琥珀 = 本步搭乘，橙虚线 = 棋盘上尚未用到的 */}
        {JUMP_IDS.map((id) => {
          const geo = EDGE_GEO[`${id}>${JUMP_OF[id]}`]
          const active = activeJump.has(`${id}>${JUMP_OF[id]}`)
          return (
            <path
              key={`jump-${id}`}
              d={jumpPath(id, JUMP_OF[id], geo.bx, geo.by)}
              fill="none"
              stroke={active ? TONE.amber : TONE.medium}
              strokeWidth={active ? 3 : 1.5}
              strokeDasharray={active ? undefined : '6 5'}
              markerEnd={active ? 'url(#sl-arrow-active)' : 'url(#sl-arrow-idle)'}
            />
          )
        })}

        {/* 3. 当前层的高亮环：当前出队的格子加粗，保证与图例「当前层 amber」一致 */}
        {step.layer.map((id) => (
          <rect
            key={`ring-${id}`}
            x={BOX[id].x - 4}
            y={BOX[id].y - 4}
            width={CELL_W + 8}
            height={CELL_H + 8}
            rx={12}
            fill="none"
            stroke={TONE.amber}
            strokeWidth={step.cur === id ? 3.5 : 1.5}
          />
        ))}

        {/* 4. 格内文字：编号、状态、蛇/梯去向 */}
        {IDS.map((id) => {
          const s = skinOf(id)
          const b = BOX[id]
          return (
            <g key={`text-${id}`}>
              <text
                x={b.cx}
                y={b.cy - 6}
                textAnchor="middle"
                fontSize="21"
                fontWeight="700"
                className="font-code"
                fill={s.text}
              >
                {id}
              </text>
              <text x={b.cx} y={b.cy + 16} textAnchor="middle" fontSize="10" fontWeight="600" fill={s.text}>
                {s.label}
              </text>
              {s.jumped && (
                <text
                  x={b.cx}
                  y={b.cy + 32}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="700"
                  className="font-code"
                  fill={TONE.medium}
                >
                  {JUMP_OF[id] > id ? '梯 ↑' : '蛇 ↓'}
                  {JUMP_OF[id]}
                </text>
              )}
            </g>
          )
        })}

        {/* 5. 骰子点数落点：候选格 k = curr+k */}
        {step.rolls.map((r) => {
          const b = BOX[r.next]
          return (
            <g key={`roll-${r.k}`}>
              <circle cx={b.x + 14} cy={b.y + 14} r={10} fill="hsl(var(--card))" stroke={TONE.amber} strokeWidth="1.5" />
              <text
                x={b.x + 14}
                y={b.y + 17.5}
                textAnchor="middle"
                fontSize="9.5"
                fontWeight="700"
                className="font-code"
                fill={TONE.amber}
              >
                k{r.k}
              </text>
            </g>
          )
        })}

        {/* 6. 已访问 ✓ / 本步新入队 ＋：状态不只靠颜色 */}
        {IDS.filter((id) => visitedSet.has(id)).map((id) => {
          const b = BOX[id]
          const isNew = freshSet.has(id)
          return (
            <text
              key={`mark-${id}`}
              x={b.x + CELL_W - 13}
              y={b.y + 18}
              textAnchor="middle"
              fontSize={isNew ? 13 : 12}
              fontWeight="800"
              fill={TONE.teal}
            >
              {isNew ? '＋' : '✓'}
            </text>
          )
        })}

        {/* 7. 本步搭乘的蛇 / 梯：文字说明跳到哪一格 */}
        {step.rolls
          .filter((r) => r.jumped)
          .map((r) => {
            const geo = EDGE_GEO[`${r.next}>${r.landed}`]
            return (
              <text
                key={`jump-label-${r.k}`}
                x={geo.lx}
                y={geo.ly}
                textAnchor="middle"
                fontSize="10.5"
                fontWeight="700"
                className="font-code"
                fill={TONE.amber}
              >
                {r.landed > r.next ? '梯 ↑' : '蛇 ↓'}
                {r.landed}
              </text>
            )
          })}
      </svg>

      <Badges className="justify-center">
        <Badge tone="teal">
          本层{' '}
          <b className="font-code text-xs">[{step.layer.join(', ')}]</b>
        </Badge>
        <Stat label="已掷骰次数" value={step.depth} tone="amber" />
        <Stat label="已访问" value={`${step.visited.length} / ${TARGET}`} tone="teal" />
        {step.phase !== 'done' && step.next && <Hint>{step.next}</Hint>}
        {step.phase === 'done' &&
          (step.answer !== null && step.answer >= 0 ? (
            <Answer>
              最少 <b className="font-code">{step.answer}</b> 次投掷到达方格{' '}
              <b className="font-code">{TARGET}</b>（第 <b className="font-code">{step.depth}</b> 层出队）
            </Answer>
          ) : (
            <Answer>
              队列排空仍未到达 <b className="font-code">{TARGET}</b>，返回 <b className="font-code">-1</b>
            </Answer>
          ))}
      </Badges>
    </div>
  )
}

export default function SnakesAndLaddersDemo() {
  const steps = useMemo(buildSteps, [])
  const final = steps[steps.length - 1]
  const answer = final.answer === null ? -1 : final.answer
  return (
    <DemoShell
      title="蛇形编号 + BFS 分层扩展"
      info={`输入：board = 题解「示例 1」的 ${N}×${N} 棋盘（梯子 ${LADDER_DESC}，蛇 ${SNAKE_DESC}），题解只给出这一个示例，故直接使用、未另造更小的盘面。演示按「每出队一个编号算一步」逐格展开 BFS，共 ${steps.length} 步，BFS 求得最少投掷次数 ${answer} 次到达方格 ${TARGET}。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '当前层 / ▶ 当前出队 / 本步骰子候选格 k1~k6 与蛇梯弧线' },
        { color: TONE.teal, label: '已访问 ✓ / 本步新入队 ＋' },
        { color: TONE.medium, label: '蛇 / 梯（虚线指向去向，格内标 ↑15、↓13）' },
        { color: TONE.easy, label: '终点方格 36' },
        { color: TONE.muted, label: '未访问' },
      ]}
    />
  )
}
