import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badge, Badges, Hint, Pointer, Stat, TONE } from './stage'

/* ------------------------------------------------------------------ */
/* 15. 分发糖果 —— 模式 B：两层柱状（评分 / 糖果）+ 规则下界虚线          */
/* ------------------------------------------------------------------ */

/** 题解「示例 1」：ratings = [1, 0, 2] → 5。规模最小，且左右两遍都会真正生效。 */
const RATINGS = [1, 0, 2]

/** 糖果柱的值由哪一趟定下：pending = 当前这一趟还没扫到，仍是初值 1 */
type Origin = 'pending' | 'left' | 'right'

interface Step {
  phase: 'init' | 'left' | 'right' | 'done'
  /** 本步处理的孩子下标；init / done 为 -1 */
  i: number
  /** 本步要比较的邻居（左遍是 i-1，右遍是 i+1；没有邻居时为 null） */
  neighbor: number | null
  /** 本步严格大于时规则给出的下界 candies[邻居] + 1；规则不生效时为 null */
  lower: number | null
  /** 左规则下界 inc[i]：左遍逐个算出，也就是「以 i 结尾的严格递增链长度」 */
  inc: number[]
  /** 右规则下界 dec[i]：右遍从右往左逐个补上，还没算到的位置为 null */
  dec: (number | null)[]
  /** 当前糖果数快照 */
  candies: number[]
  origin: Origin[]
  /** 所有步骤中糖果柱的最大值，用来固定柱高映射（避免柱高逐帧跳动） */
  maxCandy: number
  /** 当前糖果总数 */
  total: number
  note: string
}

function buildSteps(): Step[] {
  const n = RATINGS.length
  const candies = new Array<number>(n).fill(1)
  const inc = new Array<number>(n).fill(1)
  const dec = new Array<number | null>(n).fill(null)
  const origin = new Array<Origin>(n).fill('pending')
  const steps: Step[] = []

  const push = (
    phase: Step['phase'],
    i: number,
    neighbor: number | null,
    lower: number | null,
    note: string
  ) => {
    steps.push({
      phase,
      i,
      neighbor,
      lower,
      inc: inc.slice(),
      dec: dec.slice(),
      candies: candies.slice(),
      origin: origin.slice(),
      maxCandy: 1,
      total: candies.reduce((a, b) => a + b, 0),
      note,
    })
  }

  push(
    'init',
    -1,
    null,
    null,
    `初始化：ratings = [${RATINGS.join(', ')}]，每个孩子先发最少的 1 颗，candies = [${candies.join(', ')}]。观察：约束只作用在相邻的两个孩子之间，可以拆成两个方向分别满足——左遍保证「比左边评分高的孩子拿得更多」，右遍保证「比右边评分高的孩子拿得更多」。判断：两遍各给出一个下界，每个位置取两者的较大值就能同时满足左右两侧，所以按「先左→右、再右→左」各扫一遍。`
  )

  /* 第一趟：左 → 右，candies[i] 就是 inc[i]（以 i 结尾的严格递增链长度） */
  for (let i = 0; i < n; i++) {
    const hasLeft = i > 0
    const fires = hasLeft && RATINGS[i] > RATINGS[i - 1]
    inc[i] = fires ? inc[i - 1] + 1 : 1
    candies[i] = inc[i]
    origin[i] = 'left'

    const move = i + 1 < n ? `i 右移到 ${i + 1}` : `左遍结束，下一趟从最右边 i = ${n - 1} 开始`
    const note = !hasLeft
      ? `观察：i = 0 是最左边的孩子，左边没有邻居。判断：不存在「比左边评分高」这个比较，左规则对他不施加任何约束。动作：candies[0] 保持初值 1，${move}。为什么：1 已经是题目允许的最少糖果数，多给只会让总数变大。`
      : fires
        ? `观察：ratings[${i}] = ${RATINGS[i]} 大于左边的 ratings[${i - 1}] = ${RATINGS[i - 1]}，这个孩子比左邻居高。判断：左规则要求他比左邻居多，candies[${i}] = candies[${i - 1}] + 1。动作：candies[${i}] 取 ${inc[i - 1]} + 1 = ${inc[i]}，${move}。为什么：这样左边这条严格递增链上的每个孩子都比左邻居多 1 颗，已经是最省的给法。`
        : `观察：ratings[${i}] = ${RATINGS[i]} 并不大于左边的 ratings[${i - 1}] = ${RATINGS[i - 1]}。判断：左规则只在严格大于时才要求更多，这个方向给他的下界仍是 1。动作：candies[${i}] 保持 ${candies[i]}，${move}。为什么：约束只在严格大于时生效，评分相等时同样不能加糖。`

    push('left', i, hasLeft ? i - 1 : null, fires ? inc[i] : null, note)
  }

  /* 第二趟：右 → 左，candies[i] = max(inc[i], dec[i]) */
  for (let i = n - 1; i >= 0; i--) {
    const hasRight = i + 1 < n
    const fires = hasRight && RATINGS[i] > RATINGS[i + 1]
    const d = fires ? candies[i + 1] + 1 : 1
    dec[i] = d
    const raised = d > inc[i]
    candies[i] = Math.max(inc[i], d)
    origin[i] = raised ? 'right' : 'left'

    const move = i - 1 >= 0 ? `i 左移到 ${i - 1}` : '右遍结束'
    const note = !hasRight
      ? `观察：i = ${i} 是最右边的孩子，右边没有邻居。判断：不存在「比右边评分高」这个比较，右规则不施加约束，他只要不小于左遍给他的下界 ${inc[i]}。动作：candies[${i}] = max(${inc[i]}, 1) = ${candies[i]} 不变，${move}。为什么：右遍必须从右往左扫，才能保证用到的 candies[i+1] 已经取到最终值。`
      : fires
        ? `观察：ratings[${i}] = ${RATINGS[i]} 大于右边的 ratings[${i + 1}] = ${RATINGS[i + 1]}，右邻居最终拿 ${candies[i + 1]} 颗。判断：右规则要求 candies[${i}] ≥ candies[${i + 1}] + 1 = ${d}，而左遍只给了 ${inc[i]}。动作：candies[${i}] = max(${inc[i]}, ${d}) = ${candies[i]}${raised ? `，比左遍的 ${inc[i]} 提升了` : `，左遍给的 ${inc[i]} 已经不小于 ${d}，保持不动`}，${move}。为什么：取较大值而不是直接覆盖，才能同时满足左右两个方向的下界。`
        : `观察：ratings[${i}] = ${RATINGS[i]} 并不大于右边的 ratings[${i + 1}] = ${RATINGS[i + 1]}。判断：右规则只在严格大于时才要求更多，这个方向的糖果下界仍是 1，而左遍已经给出 ${inc[i]}。动作：candies[${i}] = max(${inc[i]}, 1) = ${candies[i]} 不变，${move}。为什么：取较大值保留了左遍的结果，右遍不会把已经合法的分配改小。`

    push('right', i, hasRight ? i + 1 : null, fires ? d : null, note)
  }

  const total = candies.reduce((a, b) => a + b, 0)
  push(
    'done',
    -1,
    null,
    null,
    `结论：最终 candies = [${candies.join(', ')}]，最少糖果数 = ${candies.join(' + ')} = ${total}。左遍让每个孩子不输给左邻居，右遍让他不输给右邻居，每个位置取两遍下界的较大值，恰好构成一个合法方案，也就是最优解。时间 O(n)（两次线性扫描加一次求和），空间 O(n)。`
  )

  const maxCandy = candies.reduce((m, v) => Math.max(m, v), 1)
  for (const s of steps) s.maxCandy = maxCandy
  return steps
}

/* ---------------- 舞台渲染 ---------------- */

const W = 680
const H = 388
const PAD_L = 30
const PAD_R = 30
/** 上层（评分柱）的地板与基线 */
const R_TOP = 40
const R_BASE = 156
/** 下层（糖果柱）的地板与基线 */
const C_TOP = 246
const C_BASE = 362
const MAX_R = Math.max(1, ...RATINGS)

function Stage(step: Step) {
  const n = RATINGS.length
  const slot = (W - PAD_L - PAD_R) / n
  const laneW = slot - 12
  const laneX = (i: number) => PAD_L + slot * i + 6
  const barW = Math.min(64, laneW * 0.55)
  const barX = (i: number) => laneX(i) + (laneW - barW) / 2
  const midX = (i: number) => barX(i) + barW / 2
  /** 评分柱高：线性映射，评分 0 也留一小截底座 */
  const rH = (v: number) => Math.max(v === 0 ? 2 : 4, (v / MAX_R) * (R_BASE - R_TOP))
  const rTop = (v: number) => R_BASE - rH(v)
  /** 糖果柱高：以全过程的糖果最大值为基准，柱高不会逐帧跳动 */
  const cH = (v: number) => Math.max(4, (v / step.maxCandy) * (C_BASE - C_TOP))
  const cTop = (v: number) => C_BASE - cH(v)

  const sweeping = step.phase === 'left' || step.phase === 'right'
  /** 糖果柱的颜色 = 这根柱子的值由哪一趟定下 */
  const candyFill = (i: number) =>
    step.origin[i] === 'right' ? TONE.easy : step.origin[i] === 'left' ? TONE.water : TONE.muted

  const bandTitle =
    step.phase === 'init'
      ? '糖果数 candies（每人先发 1 颗）'
      : step.phase === 'left'
        ? '糖果数 candies — 第一趟 左→右：保证比左邻居多'
        : step.phase === 'right'
          ? '糖果数 candies — 第二趟 右→左：保证比右邻居多'
          : '糖果数 candies — 两趟取较大值后的最终分配'

  const hint =
    step.phase === 'init'
      ? `从左往右扫，先处理下标 0（它没有左邻居）`
      : step.phase === 'left'
        ? step.i + 1 < n
          ? `i 右移到 ${step.i + 1}，比较 ratings[${step.i + 1}] 与 ratings[${step.i}]`
          : `左遍结束，从最右边 i = ${n - 1} 开始右遍扫描`
        : step.phase === 'right'
          ? step.i - 1 >= 0
            ? `i 左移到 ${step.i - 1}，比较 ratings[${step.i - 1}] 与 ratings[${step.i}]`
            : `两遍都结束，把 candies 求和得出答案`
          : null

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full select-none">
        {/* 1. 每个孩子一条泳道，把上层评分柱与下层糖果柱对齐 */}
        {RATINGS.map((_, i) => (
          <rect
            key={i}
            x={laneX(i)}
            y={R_TOP - 12}
            width={laneW}
            height={C_BASE - R_TOP + 12}
            rx={10}
            fill={i === step.i ? 'hsl(var(--amber) / 0.1)' : 'hsl(var(--ink) / 0.035)'}
          />
        ))}

        {/* 2. 两层标题 */}
        <text x={PAD_L - 4} y={26} fontSize="12" fill="hsl(var(--ink-soft))">
          评分 ratings（上层参照柱，高度即评分）
        </text>
        <text x={PAD_L - 4} y={C_TOP - 50} fontSize="12" fill="hsl(var(--ink-soft))">
          {bandTitle}
        </text>

        {/* 3. 规则下界虚线：本步严格大于时，标出「邻居糖果 + 1」这条高度 */}
        {sweeping && step.lower !== null && (
          <g className="demo-water">
            <line
              x1={laneX(step.i)}
              x2={laneX(step.i) + laneW}
              y1={cTop(step.lower)}
              y2={cTop(step.lower)}
              stroke={TONE.teal}
              strokeWidth="1.5"
              strokeDasharray="5 4"
            />
            <text
              x={laneX(step.i) + 4}
              y={cTop(step.lower) - 6}
              fontSize="11"
              fontWeight="700"
              className="font-code"
              fill={TONE.teal}
            >
              ≥ {step.lower}
            </text>
          </g>
        )}

        {/* 4. 上层：评分柱（深色，作为下层糖果数的参照） */}
        <g opacity="0.32">
          {RATINGS.map((v, i) => (
            <rect
              key={i}
              className="demo-bar"
              x={barX(i)}
              y={rTop(v)}
              width={barW}
              height={rH(v)}
              rx={5}
              fill={TONE.ink}
            />
          ))}
        </g>

        {/* 5. 下层：糖果柱 */}
        {step.candies.map((v, i) => (
          <rect
            key={i}
            className="demo-bar"
            x={barX(i)}
            y={cTop(v)}
            width={barW}
            height={cH(v)}
            rx={5}
            fill={candyFill(i)}
            stroke={i === step.i ? TONE.amber : 'none'}
            strokeWidth="2.5"
          />
        ))}

        {/* 6. 答案区域：右遍结束后高亮最终分配 */}
        {step.phase === 'done' && (
          <rect
            x={PAD_L - 2}
            y={C_TOP - 10}
            width={W - PAD_L - PAD_R + 4}
            height={C_BASE - C_TOP + 20}
            rx={10}
            fill="none"
            stroke={TONE.easy}
            strokeWidth="1.5"
            strokeDasharray="6 5"
            opacity="0.75"
            className="demo-pulse"
          />
        )}

        {/* 7. 指针旗标：i = 本步处理的孩子，邻居 = 本步的比较对象 */}
        {sweeping && (
          <g>
            <Pointer x={midX(step.i)} y={C_TOP - 28} label={`i=${step.i}`} tone="amber" />
            {step.neighbor !== null && (
              <Pointer
                x={midX(step.neighbor)}
                y={C_TOP - 28}
                label={`${step.neighbor < step.i ? 'i-1' : 'i+1'}=${step.neighbor}`}
                tone="teal"
              />
            )}
          </g>
        )}

        {/* 8. 数值标签 */}
        {RATINGS.map((v, i) => (
          <text
            key={i}
            x={midX(i)}
            y={rTop(v) - 8}
            textAnchor="middle"
            fontSize="12"
            className="font-code fill-[hsl(var(--ink)/0.7)]"
          >
            {v}
          </text>
        ))}
        {step.candies.map((v, i) => (
          <text
            key={i}
            x={midX(i)}
            y={cTop(v) - 8}
            textAnchor="middle"
            fontSize="13"
            fontWeight={i === step.i || step.phase === 'done' ? 700 : 400}
            className="font-code fill-[hsl(var(--ink))]"
          >
            {v}
          </text>
        ))}

        {/* 9. 两条基线 + 下标 */}
        <line
          x1={PAD_L - 8}
          x2={W - PAD_R + 8}
          y1={R_BASE}
          y2={R_BASE}
          stroke="hsl(var(--border))"
          strokeWidth="1.5"
        />
        <line
          x1={PAD_L - 8}
          x2={W - PAD_R + 8}
          y1={C_BASE}
          y2={C_BASE}
          stroke="hsl(var(--border))"
          strokeWidth="1.5"
        />
        {RATINGS.map((_, i) => (
          <text
            key={i}
            x={midX(i)}
            y={C_BASE + 20}
            textAnchor="middle"
            fontSize="11"
            className="font-code fill-[hsl(var(--ink-soft))]"
          >
            孩子 {i}
          </text>
        ))}
      </svg>

      <Badges className="mt-3">
        <Stat label="糖果合计" value={step.total} tone={step.phase === 'done' ? 'easy' : 'water'} />
        {step.phase === 'left' && (
          <Stat label={`candies[${step.i}]`} value={step.candies[step.i]} tone="amber" />
        )}
        {step.phase === 'right' && (
          <>
            <Stat label="左遍下界" value={step.inc[step.i]} tone="water" />
            <Stat label="右遍下界" value={step.dec[step.i] ?? '—'} tone="teal" />
          </>
        )}
        {step.phase === 'done' && <Badge>时间 O(n) · 空间 O(n)</Badge>}
        {hint !== null && <Hint>{hint}</Hint>}
        {step.phase === 'done' && (
          <Answer>
            最少 {step.total} 颗 = {step.candies.join(' + ')}
          </Answer>
        )}
      </Badges>
    </div>
  )
}

export default function CandyDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="左右两遍，取较大值"
      info={`ratings = [${RATINGS.join(', ')}]（题解示例 1，答案 5）。每个孩子至少 1 颗糖果，相邻孩子中评分更高的必须拿得更多，求最少糖果总数。示例 2 的 [1, 2, 2] 只有左遍会真正生效、看不到「两遍取较大值」，所以取左右两遍都生效的示例 1。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.water, label: '左遍（左→右）定下的糖果下界' },
        { color: TONE.easy, label: '右遍（右→左）下界更大，最终取右遍值' },
        { color: TONE.muted, label: '左遍尚未扫到、仍是初值 1 的孩子' },
        { color: TONE.amber, label: '本步处理的孩子 i（琥珀描边 + 旗标）' },
        { color: TONE.teal, label: '对照的邻居及其给出的下界（虚线）' },
      ]}
    />
  )
}
