import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badges, Hint, Stat, TONE } from './stage'

/* ------------------------------------------------------------------ */
/* 50. 插入区间 —— 模式 B：横向区间条 + 数轴，一次扫描分三段             */
/* ------------------------------------------------------------------ */

/** 题解示例 2：intervals = [[1,2],[3,5],[6,7],[8,10],[12,16]]，newInterval = [4,8] */
const INTERVALS: number[][] = [[1, 2], [3, 5], [6, 7], [8, 10], [12, 16]]
const NEW_INTERVAL: number[] = [4, 8]
const N = INTERVALS.length

/** 原区间在某一时刻的归属；三种状态与图例一一对应 */
type IvState = 'dim' | 'easy' | 'medium'

/** 真实跑一遍题解的 O(n) 三段扫描（供 info、答案与画布高度复用） */
function insertInto(intervals: number[][], newInterval: number[]): number[][] {
  const result: number[][] = []
  let i = 0
  let start = newInterval[0]
  let end = newInterval[1]
  while (i < intervals.length && intervals[i][1] < start) {
    result.push(intervals[i].slice())
    i++
  }
  while (i < intervals.length && intervals[i][0] <= end) {
    start = Math.min(start, intervals[i][0])
    end = Math.max(end, intervals[i][1])
    i++
  }
  result.push([start, end])
  while (i < intervals.length) {
    result.push(intervals[i].slice())
    i++
  }
  return result
}

const FINAL = insertInto(INTERVALS, NEW_INTERVAL)
const fmtIv = (iv: number[]) => `[${iv[0]},${iv[1]}]`
const FINAL_TEXT = `[${FINAL.map(fmtIv).join(',')}]`

interface Step {
  phase: 'init' | 'left' | 'overlap' | 'insert' | 'right' | 'done'
  /** 扫描下标 i：指向下一个待判定的原区间；i = n 表示已越界 */
  i: number
  /** 合并区间的当前端点；init 时就是 newInterval */
  merged: number[]
  /** 原区间状态快照（不可变） */
  states: IvState[]
  /** 结果序列快照：原区间下标，或 'merged'（合并后的新区间） */
  result: (number | 'merged')[]
  note: string
  /** 真正的下一步动作；由后一个快照回填，避免 Hint 描述本步已完成的动作 */
  next: string
}

function buildSteps(): Step[] {
  const steps: Step[] = []
  const states: IvState[] = new Array<IvState>(N).fill('dim')
  const result: (number | 'merged')[] = []
  /** 阶段二吞并掉的原区间下标 */
  const absorbed: number[] = []
  let start = NEW_INTERVAL[0]
  let end = NEW_INTERVAL[1]
  let i = 0

  const snap = (phase: Step['phase'], note: string) => {
    steps.push({
      phase,
      i,
      merged: [start, end],
      states: states.slice(),
      result: result.slice(),
      note,
      next: '',
    })
  }

  snap(
    'init',
    `观察：intervals 已按起点升序且互不重叠，newInterval = [${NEW_INTERVAL[0]}, ${NEW_INTERVAL[1]}]，合并区间先记为 start = ${start}、end = ${end}，i = 0、result 为空。判断：原列表有序，与新区间相交的区间一定是连续一段——左侧一段的终点都 < start，右侧一段的起点都 > end，不必重新排序。动作：从 i = 0 开始，先扫描左侧的不重叠段。`
  )

  /* 阶段一：整体落在合并区间左侧的区间原样进结果 */
  while (i < N && INTERVALS[i][1] < start) {
    const iv = INTERVALS[i]
    result.push(i)
    states[i] = 'easy'
    const moved = i + 1
    snap(
      'left',
      `观察：intervals[${i}] = [${iv[0]}, ${iv[1]}]，终点 ${iv[1]} < 合并区间起点 ${start}。判断：它整体落在新区间左侧，与新区间没有公共点。动作：原样放入 result，i 移到 ${moved}。为什么：判据必须是严格小于——终点恰好等于 start（端点相接）算重叠，不能提前归入左侧段。`
    )
    i = moved
  }

  /* 阶段二：与合并区间重叠的区间被吞并，端点取 min / max */
  while (i < N && INTERVALS[i][0] <= end) {
    const iv = INTERVALS[i]
    const beforeStart = start
    const beforeEnd = end
    const touch = iv[0] === beforeEnd
    const leftShift = iv[0] < beforeStart
    const grew = iv[1] > beforeEnd
    start = Math.min(beforeStart, iv[0])
    end = Math.max(beforeEnd, iv[1])
    absorbed.push(i)
    states[i] = 'medium'
    const moved = i + 1
    snap(
      'overlap',
      `观察：intervals[${i}] = [${iv[0]}, ${iv[1]}]，起点 ${iv[0]} ${touch ? '恰好等于' : '≤'} 合并区间当前终点 ${beforeEnd}。判断：${touch ? '端点相接也算相交（判据是 ≤，不是 <），' : ''}必须并入：start = min(${beforeStart}, ${iv[0]}) = ${start}、end = max(${beforeEnd}, ${iv[1]}) = ${end}${grew || leftShift ? '' : '，端点没有扩大（该区间被合并区间完全包含）'}。动作：i 移到 ${moved}，下一步仍拿新的终点 ${end} 与下一个区间的起点比较。为什么：${touch ? '起点等于终点也算相交，判据若写成 < 就会漏掉这个区间。' : leftShift ? `合并区间的起点左移为 min(${beforeStart}, ${iv[0]}) = ${start}，保证并集覆盖两个区间的全部端点。` : grew ? 'end 被撑大后，后面更多区间可能落进重叠段，所以下一步必须用新的终点继续判断。' : '当前区间被合并区间完全包含，取 min/max 后端点不变，并集仍是同一段连续区间。'}`
    )
    i = moved
  }

  /* 重叠段结束时，把合并后的新区间放进结果 */
  const absorbedText =
    absorbed.length > 0
      ? `已连续吞并 ${absorbed
          .map((k) => `[${INTERVALS[k][0]}, ${INTERVALS[k][1]}]`)
          .join('、')} 共 ${absorbed.length} 段，它们与新区间的并集正是 [${start}, ${end}]`
      : `没有区间与新区间重叠，合并区间就是原始 newInterval [${start}, ${end}]`
  const stopText =
    i < N
      ? `intervals[${i}] = [${INTERVALS[i][0]}, ${INTERVALS[i][1]}] 的起点 ${INTERVALS[i][0]} > 合并区间终点 ${end}，重叠段到此为止`
      : `原列表已扫完，重叠段到此为止`
  result.push('merged')
  snap(
    'insert',
    `观察：${stopText}。判断：${absorbedText}。动作：把新建的 [${start}, ${end}] 放入 result，而不是复用传入的 newInterval。为什么：重叠区间在有序列表里是连续的一段，放完这段后，剩下的区间起点都大于 end。`
  )

  /* 阶段三：整体落在合并区间右侧的区间原样进结果 */
  while (i < N) {
    const iv = INTERVALS[i]
    result.push(i)
    states[i] = 'easy'
    const moved = i + 1
    snap(
      'right',
      `观察：intervals[${i}] = [${iv[0]}, ${iv[1]}]，起点 ${iv[0]} > 合并区间终点 ${end}。判断：它整体落在右侧，不可能再与 [${start}, ${end}] 相交。动作：原样放入 result，i 移到 ${moved}${moved === N ? ' = n，扫描结束' : ''}。为什么：起点升序保证更靠后的区间起点只会更大，剩余区间都可以直接照搬。`
    )
    i = moved
  }

  snap(
    'done',
    `观察：i 已扫到 ${i} = n，三段分类结束。判断：result 由「左侧段照搬 + 合并后的 [${start}, ${end}] + 右侧段照搬」拼成，共 ${result.length} 段，仍按起点升序且两两不重叠。动作：答案直接读 result。为什么：i 只增不减，每个区间最多被访问一次，时间 O(n)；除输出数组外只用了 i、start、end，额外空间 O(1)。`
  )

  /* Hint 的「下一步：」前缀由组件硬编码，所以这里回填的必须是尚未发生的动作 */
  steps.forEach((s, idx) => {
    const b = steps[idx + 1]
    if (!b) return
    const k = b.i
    const iv = k < N ? INTERVALS[k] : null
    if (b.phase === 'left' && iv) {
      s.next = `区间终点 ${iv[1]} < 合并区间起点 ${s.merged[0]}，把 intervals[${k}] = [${iv[0]}, ${iv[1]}] 原样放入 result，i 移到 ${k + 1}`
    } else if (b.phase === 'overlap' && iv) {
      s.next = `并入 intervals[${k}] = [${iv[0]}, ${iv[1]}]：起点 ${iv[0]} ≤ 合并区间当前终点 ${s.merged[1]}，端点扩展为 [${b.merged[0]}, ${b.merged[1]}]`
    } else if (b.phase === 'insert') {
      s.next = `把合并后的 [${b.merged[0]}, ${b.merged[1]}] 放入 result`
    } else if (b.phase === 'right' && iv) {
      s.next = `区间起点 ${iv[0]} > 合并区间终点 ${s.merged[1]}，把 intervals[${k}] = [${iv[0]}, ${iv[1]}] 原样放入 result`
    } else if (b.phase === 'done') {
      s.next = `扫描结束，输出 result（共 ${b.result.length} 段）`
    }
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

const X_MIN = 0
const X_MAX = 16
const W = 720
const X0 = 56
const X1 = 700
const ROW_H = 30
const BAR_H = 20
const Y_IV = 24
const Y_MERGED = Y_IV + N * ROW_H + 12
const MERGED_H = 22
const Y_AXIS = Y_MERGED + MERGED_H + 26
const Y_RES_CAP = Y_AXIS + 36
const Y_RES = Y_RES_CAP + 10
const H = Y_RES + FINAL.length * ROW_H + 6
/** 合并区间的覆盖带，垫在所有区间条之下（模式 B 的区域填充） */
const BAND_TOP = Y_IV - 8
const BAND_BOTTOM = Y_MERGED + MERGED_H

/** 数轴线性映射：端点值 → viewBox 横坐标（与题 16 / 28 同一套换算） */
const xOf = (v: number) => X0 + ((v - X_MIN) / (X_MAX - X_MIN)) * (X1 - X0)
const TICKS = Array.from({ length: X_MAX - X_MIN + 1 }, (_, k) => X_MIN + k)

const IV_FILL: Record<IvState, string> = {
  dim: TONE.muted,
  easy: 'hsl(var(--easy) / 0.18)',
  medium: 'hsl(var(--medium) / 0.18)',
}
const IV_STROKE: Record<IvState, string> = {
  dim: 'hsl(var(--border))',
  easy: TONE.easy,
  medium: TONE.medium,
}
const IV_TAG: Record<IvState, string> = { dim: '', easy: '已放', medium: '并入' }

function Stage(step: Step) {
  const done = step.phase === 'done'
  /** i 越界（done 步）时不再画指针 */
  const cur = step.i < N ? step.i : -1
  const absorbed = step.states.filter((s) => s === 'medium').length
  const bandL = xOf(step.merged[0])
  const bandR = xOf(step.merged[1])

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full select-none">
        {/* 1. 合并区间的覆盖带：落在带内的原区间就是被吞并的对象 */}
        <g>
          <rect
            x={bandL}
            y={BAND_TOP}
            width={bandR - bandL}
            height={BAND_BOTTOM - BAND_TOP}
            fill="hsl(var(--amber) / 0.08)"
          />
          <line
            x1={bandL}
            x2={bandL}
            y1={BAND_TOP}
            y2={BAND_BOTTOM}
            stroke={TONE.amber}
            strokeWidth="1"
            strokeDasharray="4 3"
            opacity="0.5"
          />
          <line
            x1={bandR}
            x2={bandR}
            y1={BAND_TOP}
            y2={BAND_BOTTOM}
            stroke={TONE.amber}
            strokeWidth="1"
            strokeDasharray="4 3"
            opacity="0.5"
          />
        </g>

        {/* 2. 原区间：一区间一条，左侧标下标与归属 */}
        <text x="8" y="14" fontSize="12" fontWeight="700" className="fill-[hsl(var(--ink-soft))]">
          原区间 intervals（按起点升序、互不重叠）
        </text>
        {INTERVALS.map((iv, k) => {
          const y = Y_IV + k * ROW_H
          const st = step.states[k]
          const bx = xOf(iv[0])
          const ex = xOf(iv[1])
          const cy = y + BAR_H / 2
          return (
            <g key={k}>
              <rect
                x={bx}
                y={y}
                width={ex - bx}
                height={BAR_H}
                rx={5}
                fill={IV_FILL[st]}
                stroke={IV_STROKE[st]}
                strokeWidth={st === 'dim' ? 1.5 : 2.5}
              />
              <text
                x={(bx + ex) / 2}
                y={y + 14}
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                className="font-code"
                fill={st === 'dim' ? 'hsl(var(--ink) / 0.7)' : IV_STROKE[st]}
              >
                {fmtIv(iv)}
              </text>
              <text
                x="20"
                y={y + 14}
                textAnchor="end"
                fontSize="11"
                className="font-code fill-[hsl(var(--ink-soft))]"
              >
                {k}
              </text>
              {IV_TAG[st] && (
                <text
                  x="50"
                  y={y + 14}
                  textAnchor="end"
                  fontSize="10"
                  fontWeight="700"
                  className="font-code"
                  fill={IV_STROKE[st]}
                >
                  {IV_TAG[st]}
                </text>
              )}
              {/* 当前扫描位置：字母 i + 三角，不靠颜色也能区分 */}
              {k === cur && (
                <g>
                  <path d={`M ${bx - 10} ${cy - 5} l 6 5 l -6 5 z`} fill={TONE.teal} />
                  <text
                    x={bx - 13}
                    y={cy + 4}
                    textAnchor="end"
                    fontSize="12"
                    fontWeight="800"
                    className="font-code"
                    fill={TONE.teal}
                  >
                    i
                  </text>
                </g>
              )}
            </g>
          )
        })}

        {/* 3. 待插入 / 合并中的新区间 */}
        <text
          x="8"
          y={Y_MERGED - 8}
          fontSize="11"
          fontWeight="700"
          className="fill-[hsl(var(--amber))]"
        >
          待插入 / 正在合并的区间
        </text>
        <rect
          x={bandL}
          y={Y_MERGED}
          width={bandR - bandL}
          height={MERGED_H}
          rx={5}
          fill="hsl(var(--amber) / 0.18)"
          stroke={TONE.amber}
          strokeWidth="2.5"
        />
        <text
          x={(bandL + bandR) / 2}
          y={Y_MERGED + 15}
          textAnchor="middle"
          fontSize="12"
          fontWeight="700"
          className="font-code"
          fill={TONE.amber}
        >
          {fmtIv(step.merged)}
        </text>
        <text
          x="50"
          y={Y_MERGED + 15}
          textAnchor="end"
          fontSize="11"
          fontWeight="700"
          className="fill-[hsl(var(--amber))]"
        >
          合并
        </text>

        {/* 4. 数轴：高亮段就是合并区间覆盖的端点范围 */}
        <line
          x1={X0 - 8}
          x2={X1 + 8}
          y1={Y_AXIS}
          y2={Y_AXIS}
          stroke="hsl(var(--border))"
          strokeWidth="1.5"
        />
        <line x1={bandL} x2={bandR} y1={Y_AXIS} y2={Y_AXIS} stroke={TONE.amber} strokeWidth="3" />
        {TICKS.map((v) => {
          const inBand = v >= step.merged[0] && v <= step.merged[1]
          return (
            <g key={v}>
              <line
                x1={xOf(v)}
                x2={xOf(v)}
                y1={Y_AXIS}
                y2={Y_AXIS + 4}
                stroke="hsl(var(--border))"
                strokeWidth="1"
              />
              {v % 2 === 0 && (
                <text
                  x={xOf(v)}
                  y={Y_AXIS + 16}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight={inBand ? 700 : 400}
                  className="font-code"
                  fill={inBand ? TONE.amber : 'hsl(var(--ink-soft))'}
                >
                  {v}
                </text>
              )}
            </g>
          )
        })}

        {/* 5. 结果：左段原样 + 合并后的新区间 + 右段原样 */}
        <text x="8" y={Y_RES_CAP} fontSize="11" fontWeight="700" className="fill-[hsl(var(--ink-soft))]">
          {`结果 result（共 ${step.result.length} 段）`}
        </text>
        {step.result.length === 0 && (
          <text x={X0} y={Y_RES + 14} fontSize="11" className="fill-[hsl(var(--ink-soft))]">
            （结果为空，左侧段还没有区间）
          </text>
        )}
        {step.result.map((item, idx) => {
          const iv = item === 'merged' ? step.merged : INTERVALS[item]
          const isNew = item === 'merged'
          const bx = xOf(iv[0])
          const ex = xOf(iv[1])
          const y = Y_RES + idx * ROW_H
          const tone = isNew ? TONE.amber : TONE.easy
          return (
            <g key={`${item}-${idx}`}>
              <rect
                x={bx}
                y={y}
                width={ex - bx}
                height={BAR_H}
                rx={5}
                fill={isNew ? 'hsl(var(--amber) / 0.18)' : 'hsl(var(--easy) / 0.18)'}
                stroke={tone}
                strokeWidth="2.5"
              />
              <text
                x={(bx + ex) / 2}
                y={y + 14}
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                className="font-code"
                fill={tone}
              >
                {fmtIv(iv)}
              </text>
              <text
                x="50"
                y={y + 14}
                textAnchor="end"
                fontSize="10"
                fontWeight="700"
                className="font-code"
                fill={tone}
              >
                {`结果${idx}`}
              </text>
            </g>
          )
        })}
      </svg>

      <Badges className="mt-3">
        <Stat label="扫描下标 i" value={step.i} tone="teal" />
        <Stat label="合并区间" value={fmtIv(step.merged)} tone="amber" />
        {!done && <Stat label="结果段数" value={step.result.length} tone="easy" />}
        {!done && <Hint>{step.next}</Hint>}
        {done && <Stat label="被吞并" value={`${absorbed} 段`} tone="medium" />}
        {done && (
          <Answer>
            <b className="font-code">{FINAL_TEXT}</b>
          </Answer>
        )}
      </Badges>
    </div>
  )
}

export default function InsertIntervalDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="一次扫描，三段分类插入区间"
      info={`intervals = [[1,2],[3,5],[6,7],[8,10],[12,16]]，newInterval = [4,8]（题解示例 2，输出 ${FINAL_TEXT}）。示例 1 只有 2 个区间且左侧段为空，为完整看到「左侧不重叠 / 重叠合并 / 右侧不重叠」三段，这里取示例 2 这个规模最小的三段示例，共 ${steps.length} 步；合并区间 [3,10] 一次吞掉 [3,5]、[6,7]、[8,10]。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '待插入 / 正在合并的区间 [start, end]' },
        { color: TONE.teal, label: '当前扫描到的原区间（i 标记）' },
        { color: TONE.medium, label: '被吞并的重叠区间' },
        { color: TONE.easy, label: '已确定放入 result 的区间' },
        { color: TONE.muted, label: '尚未处理的原区间' },
      ]}
    />
  )
}
