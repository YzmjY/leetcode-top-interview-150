import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badges, Hint, Pointer, Stat, TONE } from './stage'

/* ------------------------------------------------------------------ */
/* 51. 用最少数量的箭引爆气球 —— 模式 B：横向区间条 + 竖直箭矢虚线        */
/* ------------------------------------------------------------------ */

/** 固定示例输入（题解「示例 1」：points = [[10,16],[2,8],[1,6],[7,12]]，输出 2） */
const INPUT: [number, number][] = [
  [10, 16],
  [2, 8],
  [1, 6],
  [7, 12],
]

/** 贪心第 1 步：按右端点 x_end 升序排序（排序结果唯一，与 sort.Slice 等价） */
const SORTED: [number, number][] = [...INPUT].sort((a, b) => a[1] - b[1])
const N = SORTED.length

const fmt = (p: [number, number]) => `[${p[0]},${p[1]}]`
const list = (ps: [number, number][]) => ps.map(fmt).join('、')
const ends = (ps: [number, number][]) => ps.map((p) => p[1]).join('、')

type Phase = 'init' | 'sorted' | 'shoot' | 'covered' | 'new-arrow' | 'done'

interface Arrow {
  /** 箭所在的 x 坐标（= 触发它的那个气球的右端点） */
  pos: number
  /** 这支箭引爆的气球下标 */
  covers: number[]
}

interface Step {
  phase: Phase
  /** 展示顺序下的气球：init 为原始顺序，之后为右端点升序 */
  bars: [number, number][]
  /** 已射出的箭（每步一份不可变副本） */
  arrows: Arrow[]
  /** 最后一支箭的位置；还没射箭时为 null */
  arrowPos: number | null
  /** 本步正在考察的行下标（贪心循环变量 i）；-1 表示没有 */
  cur: number
  /** 每行是否已被某支箭引爆 */
  burst: boolean[]
  /** 下一步动作（由后一个快照回填，保证与步骤数据一致） */
  next: string
  note: string
}

/** 跑一遍真实贪心：排序 → 第一支箭射在首个区间右端点 → 线性扫描补箭 */
function buildSteps(): Step[] {
  const steps: Step[] = []
  let arrows: Arrow[] = []
  let arrowPos: number | null = null
  const burst = new Array<boolean>(N).fill(false)

  const snap = (phase: Phase, bars: [number, number][], cur: number, note: string) => {
    steps.push({
      phase,
      bars: bars.map((p) => [p[0], p[1]] as [number, number]),
      arrows: arrows.map((a) => ({ pos: a.pos, covers: a.covers.slice() })),
      arrowPos,
      cur,
      burst: burst.slice(),
      next: '',
      note,
    })
  }

  snap(
    'init',
    INPUT,
    -1,
    `观察：points = ${list(INPUT)}，共 ${N} 个气球，右端点依次是 ${ends(INPUT)}，顺序是乱的。判断：一支箭就是 x 轴上的一个点，要引爆所有气球等价于用最少的点刺穿所有区间，所以先按右端点 x_end 升序排序。动作：排序得到 ${list(SORTED)}，随后把第一支箭射在第一个气球的右端点上。为什么：还没被引爆的气球里右端点最小的那个最早结束，箭放在它的右端点上既必定引爆它，又尽可能靠右、能顺带覆盖更多后面的区间。`
  )

  const first = SORTED[0]
  snap(
    'sorted',
    SORTED,
    -1,
    `观察：按右端点升序排序后得到 ${list(SORTED)}，右端点依次是 ${ends(SORTED)}，单调不减。判断：此刻还没有射箭，arrows = 0。动作：确定第一支箭的位置——射在下标 0 的气球 ${fmt(first)} 的右端点 x = ${first[1]} 上，arrows 记为 1。为什么：任何能引爆 ${fmt(first)} 的箭都必须落在 ${first[0]} ≤ x ≤ ${first[1]} 内，取其中最靠右的 x = ${first[1]}，覆盖力最强。`
  )

  // 第一支箭在进入循环之前就已射出（射在第一个气球的右端点），所以 arrows 初值是 1
  arrows = [{ pos: first[1], covers: [0] }]
  arrowPos = first[1]
  burst[0] = true
  snap(
    'shoot',
    SORTED,
    0,
    `观察：i = 0 的气球 ${fmt(first)} 是所有气球里右端点最小的，x_end = ${first[1]}。判断：能引爆它的箭必须满足 ${first[0]} ≤ x ≤ ${first[1]}，其中最靠右的可行位置是 x = ${first[1]}。动作：在 x = ${first[1]} 射出第 1 支箭，arrows = 1、arrowPos = ${first[1]}，${fmt(first)} 被引爆。为什么：箭越靠右越可能顺带引爆右端点更大的气球；注意第一支箭在循环之前就已射出，所以 arrows 初值是 1 而不是 0。`
  )

  for (let i = 1; i < N; i++) {
    const p = SORTED[i]
    const prevPos = arrowPos
    if (prevPos !== null && p[0] > prevPos) {
      arrows = [...arrows, { pos: p[1], covers: [i] }]
      arrowPos = p[1]
      burst[i] = true
      snap(
        'new-arrow',
        SORTED,
        i,
        `观察：i = ${i} 的气球 ${fmt(p)} 左端点 ${p[0]} > arrowPos = ${prevPos}。判断：当前这支箭落在 x = ${prevPos}，在 ${fmt(p)} 的左边，够不到它，必须补箭。动作：arrows 增到 ${arrows.length}，新箭射在它的右端点 x = ${p[1]}，arrowPos 更新为 ${p[1]}。为什么：新箭同样取当前最紧迫气球的右端点，才能在保证引爆它的前提下尽量覆盖右侧剩下的气球。`
      )
    } else {
      arrows = arrows.map((a, k) => ({
        pos: a.pos,
        covers: k === arrows.length - 1 ? [...a.covers, i] : a.covers.slice(),
      }))
      burst[i] = true
      snap(
        'covered',
        SORTED,
        i,
        `观察：i = ${i} 的气球 ${fmt(p)} 左端点 ${p[0]} ≤ arrowPos = ${prevPos}。判断：排序保证它的右端点 ${p[1]} ≥ arrowPos，所以 x = ${prevPos} 落在 ${fmt(p)} 区间内。动作：arrows 保持 ${arrows.length} 不变，${fmt(p)} 计入最后一支箭的覆盖范围，即已被这支箭引爆。为什么：判据必须是严格大于——只有 points[i][0] > arrowPos 才需要新箭，写成 ≥ 会把仅共享端点的气球误判成打不到（题解示例 3 正是靠 x = 2 一箭引爆 [1,2] 与 [2,3]）。`
      )
    }
  }

  const posText = arrows.map((a) => `x = ${a.pos}`).join(' 与 ')
  snap(
    'done',
    SORTED,
    -1,
    `观察：${N} 个气球全部处理完，arrows = ${arrows.length}，${arrows.length} 支箭分别在 ${posText}，每支箭引爆 ${arrows.map((a) => a.covers.length).join(' 个、')} 个气球。判断：每支箭都射在「当时尚未引爆的气球中右端点最小者」的右端点上，由贪心选择性质（交换论证）可知这样得到的箭数不可能再少。动作：答案 = arrows = ${arrows.length}，题目只要箭的数量，不要求给出位置。为什么：排序是瓶颈 O(n log n)，之后只线性扫描一趟 O(n)；除排序外只用 arrows、arrowPos 等常数个变量，排序递归栈 O(log n)。`
  )

  // 「下一步动作」统一由后一个快照回填，保证 Hint 说的就是下一步真正会发生的事
  steps.forEach((s, k) => {
    const b = steps[k + 1]
    if (!b) return
    if (b.phase === 'sorted') {
      s.next = `按右端点升序重排成 ${list(SORTED)}`
    } else if (b.phase === 'shoot') {
      s.next = `射出第 1 支箭：射在下标 0 的气球 ${fmt(SORTED[0])} 的右端点 x = ${SORTED[0][1]}`
    } else if (b.phase === 'covered') {
      s.next = `继续扫描：考察 i = ${b.cur} 的气球 ${fmt(SORTED[b.cur])}，比较左端点 ${SORTED[b.cur][0]} 与 arrowPos = ${s.arrowPos}`
    } else if (b.phase === 'new-arrow') {
      s.next = `继续扫描：考察 i = ${b.cur} 的气球 ${fmt(SORTED[b.cur])}，左端点 ${SORTED[b.cur][0]} > arrowPos = ${s.arrowPos}，需要补一支箭`
    } else {
      s.next = `所有气球处理完，读出最少需要 ${b.arrows.length} 支箭`
    }
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

const W = 680
const H = 320
const PAD_L = 54
const PAD_R = 18
const TOP = 56
const BOTTOM = 32
const ROW_H = (H - TOP - BOTTOM) / N
const BAR_H = 24
const ROWS_BOTTOM = TOP + N * ROW_H
const AXIS_Y = ROWS_BOTTOM + 8

/** x 轴值域固定按全部气球取（左右各留 0.8 的空白），所有步骤共用同一套换算 */
const X_LO = Math.min(...INPUT.map((p) => p[0]))
const X_HI = Math.max(...INPUT.map((p) => p[1]))
const V_MIN = X_LO - 0.8
const V_MAX = X_HI + 0.8
const xOf = (v: number) => PAD_L + ((v - V_MIN) / (V_MAX - V_MIN)) * (W - PAD_L - PAD_R)
const rowY = (i: number) => TOP + i * ROW_H + (ROW_H - BAR_H) / 2
const centerOf = (p: [number, number]) => (xOf(p[0]) + xOf(p[1])) / 2
const TICKS = Array.from({ length: X_HI - X_LO + 1 }, (_, k) => X_LO + k)

const INK_SOFT = 'hsl(var(--ink-soft))'

function Stage(step: Step) {
  const done = step.phase === 'done'
  /** 本步新射出的那支箭用琥珀；更早射出的箭用红虚线 */
  const newArrow = step.phase === 'shoot' || step.phase === 'new-arrow' ? step.arrows.length - 1 : -1
  const arrowColor = (k: number) => (k === newArrow ? TONE.amber : TONE.hard)
  const burstCount = step.burst.filter(Boolean).length

  /** 每行的状态：文字标签保证不靠颜色也能区分 */
  const stateOf = (i: number) => {
    if (!done && i === step.cur) return { text: '考察中', color: TONE.amber }
    if (step.burst[i]) return { text: '已引爆', color: TONE.easy }
    if (step.phase === 'sorted') return { text: '待扫描', color: INK_SOFT }
    return { text: '未处理', color: INK_SOFT }
  }

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full select-none" role="img">
        {/* 标题 */}
        <text x={8} y={13} fontSize="11" fill={INK_SOFT}>
          {step.phase === 'init' ? '区间条 = 气球（输入的原始顺序）' : '区间条 = 气球（已按右端点 x_end 升序）'}
        </text>

        {/* 1. 区间条：已引爆 = easy 绿，未处理 = dim 灰，本步考察 = amber 描边 */}
        {step.bars.map((p, i) => (
          <rect
            key={`bar-${i}`}
            className="demo-bar"
            x={xOf(p[0])}
            y={rowY(i)}
            width={Math.max(14, xOf(p[1]) - xOf(p[0]))}
            height={BAR_H}
            rx={BAR_H / 2}
            fill={step.burst[i] ? TONE.easy : TONE.muted}
            stroke={!done && i === step.cur ? TONE.amber : 'none'}
            strokeWidth={2.5}
          />
        ))}

        {/* 2. 箭矢虚线：竖直贯穿所有区间条，画在条之上体现「射穿」 */}
        {step.arrows.map((a, k) => (
          <line
            key={`arrow-${k}`}
            x1={xOf(a.pos)}
            x2={xOf(a.pos)}
            y1={TOP - 10}
            y2={ROWS_BOTTOM - 6}
            stroke={arrowColor(k)}
            strokeWidth="2"
            strokeDasharray="5 4"
          />
        ))}

        {/* 3. 箭头与箭的标签 */}
        {step.arrows.map((a, k) => (
          <g key={`head-${k}`}>
            <polygon
              points={`${xOf(a.pos) - 6},${TOP - 19} ${xOf(a.pos) + 6},${TOP - 19} ${xOf(a.pos)},${TOP - 10}`}
              fill={arrowColor(k)}
            />
            <text
              x={xOf(a.pos)}
              y={TOP - 24}
              textAnchor="middle"
              fontSize="11"
              fontWeight="700"
              className="font-code"
              fill={arrowColor(k)}
            >
              {`箭${k + 1} x=${a.pos}`}
            </text>
          </g>
        ))}

        {/* 4. 本步考察行的指针旗标 */}
        {!done && step.cur >= 0 && (
          <Pointer x={centerOf(step.bars[step.cur])} y={rowY(step.cur) - 12} label="i" tone="amber" />
        )}

        {/* 5. 区间文本；纸色描边保证箭矢虚线不会压住数字 */}
        {step.bars.map((p, i) => (
          <text
            key={`label-${i}`}
            x={centerOf(p)}
            y={rowY(i) + BAR_H / 2 + 4}
            textAnchor="middle"
            fontSize="12"
            fontWeight="700"
            className="font-code"
            fill={step.burst[i] ? 'hsl(var(--paper))' : INK_SOFT}
            stroke="hsl(var(--paper))"
            strokeWidth="3"
            paintOrder="stroke"
          >
            {fmt(p)}
          </text>
        ))}

        {/* 6. 左侧行号 + 状态文字 */}
        {step.bars.map((_, i) => {
          const st = stateOf(i)
          return (
            <g key={`gutter-${i}`}>
              <text
                x={8}
                y={rowY(i) + 9}
                fontSize="11"
                className="font-code"
                fill={!done && i === step.cur ? TONE.amber : INK_SOFT}
              >
                {`i=${i}`}
              </text>
              <text x={8} y={rowY(i) + 22} fontSize="10" fill={st.color}>
                {st.text}
              </text>
            </g>
          )
        })}

        {/* 7. x 轴与刻度 */}
        <line
          x1={PAD_L - 12}
          x2={W - PAD_R + 8}
          y1={AXIS_Y}
          y2={AXIS_Y}
          stroke="hsl(var(--border))"
          strokeWidth="1.5"
        />
        {TICKS.map((v) => (
          <g key={`tick-${v}`}>
            <line x1={xOf(v)} x2={xOf(v)} y1={AXIS_Y} y2={AXIS_Y + 4} stroke="hsl(var(--border))" strokeWidth="1" />
            {v % 2 === 0 && (
              <text
                x={xOf(v)}
                y={AXIS_Y + 16}
                textAnchor="middle"
                fontSize="9"
                className="font-code"
                fill={INK_SOFT}
              >
                {v}
              </text>
            )}
          </g>
        ))}
        <text x={W - PAD_R + 4} y={AXIS_Y + 16} fontSize="10" fill={INK_SOFT}>
          x
        </text>
      </svg>

      <Badges className="mt-3">
        <Stat label="箭数 arrows" value={step.arrows.length} tone="hard" />
        <Stat label="arrowPos" value={step.arrowPos ?? '—'} tone="amber" />
        <Stat label="已引爆" value={`${burstCount}/${N}`} tone="easy" />
        {!done && step.next && <Hint>{step.next}</Hint>}
        {done && (
          <Answer>
            <b className="font-code">{step.arrows.length}</b>
            {' 支箭（'}
            <span className="font-code">{step.arrows.map((a) => `x = ${a.pos}`).join('、')}</span>
            {'）'}
          </Answer>
        )}
      </Badges>
    </div>
  )
}

export default function MinimumNumberOfArrowsToBurstBalloonsDemo() {
  const steps = useMemo(buildSteps, [])
  const last = steps[steps.length - 1]
  const posText = last.arrows.map((a) => `x = ${a.pos}`).join(' 与 ')

  return (
    <DemoShell
      title="按右端点排序，贪心放箭"
      info={`输入：points = ${list(INPUT)}（题解示例 1，答案 2）。为看清每一步，题解步骤 1 的「按右端点 x_end 升序排序」这里压缩成一步展示，重点演示排序后的线性扫描；贪心给出的 ${last.arrows.length} 支箭在 ${posText}，题解示例的说明给的是 x = 6 与 x = 11——位置可以不同，箭数相同。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '本步正在考察的气球 / 本步新增的箭' },
        { color: TONE.easy, label: '已被某支箭引爆的气球' },
        { color: TONE.muted, label: '尚未引爆 / 待扫描的气球' },
        { color: TONE.hard, label: '之前射出的箭（虚线）' },
      ]}
    />
  )
}
