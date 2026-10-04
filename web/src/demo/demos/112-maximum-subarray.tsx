import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badge, Badges, Cell, Flag, Hint, Stat, TONE, type CellState, type Tone } from './stage'

/* ------------------------------------------------------------------ */
/* 112. 最大子数组和 —— 模式 H：一维 DP 行，格下标注「以它结尾 cur」+「全局 best」 */
/* ------------------------------------------------------------------ */

/** 固定示例输入（题解示例 1：nums = [-2,1,-3,4,-1,2,1,-5,4]，答案 6） */
const INPUT = [-2, 1, -3, 4, -1, 2, 1, -5, 4]
const N = INPUT.length

interface Step {
  phase: 'init' | 'step' | 'done'
  /** 本轮处理的元素下标；init 步为 0 */
  i: number
  /** 截至本步的 dp 快照：dp[k] = 以 k 结尾的最大子数组和，未计算为 null */
  dp: (number | null)[]
  /** 截至本步的历史最大 maxSoFar，未扫描到为 null */
  best: (number | null)[]
  /** 当前候选窗口左端 start */
  start: number
  /** 历史最优区间的左右端 */
  bestL: number
  bestR: number
  /** 本步是否刷新了 best */
  updated: boolean
  /** 本步是否「从当前元素重新开始」（cur 变非正） */
  restarted: boolean
  /** 下一步动作，由后一个快照统一回填，供 Hint 使用 */
  next: string
  note: string
}

function buildSteps(): Step[] {
  const n = N
  const steps: Step[] = []
  const dp = new Array<number | null>(n).fill(null)
  const best = new Array<number | null>(n).fill(null)

  let cur = INPUT[0]
  let maxSoFar = INPUT[0]
  let start = 0
  let bestL = 0
  let bestR = 0

  dp[0] = cur
  best[0] = maxSoFar
  steps.push({
    phase: 'init',
    i: 0,
    dp: dp.slice(),
    best: best.slice(),
    start,
    bestL,
    bestR,
    updated: true,
    restarted: false,
    next: '',
    note: `观察：nums = [${INPUT.join(', ')}]，第 0 个元素是 ${INPUT[0]}；唯一以它结尾的子数组就是它自己，所以 cur = ${cur}，全局最大 best 也先记为 ${cur}。判断：答案取 max(dp[0..n-1])，不能只看最后一个 dp，因为最大子数组不一定以最后一个元素结尾。动作：从 i = 1 开始，每轮先算 cur = max(nums[i], cur + nums[i])，再用它挑战 best。为什么：maxSoFar 必须用 nums[0] 而不是 0 初始化，否则全负数数组会被错误地返回 0。`,
  })

  for (let i = 1; i < n; i++) {
    const prevCur = cur
    const prevBest = maxSoFar
    const v = INPUT[i]
    const extend = prevCur + v
    const restart = v

    // 等价于 dp[i] = max(nums[i], dp[i-1] + nums[i])
    const joined = extend > restart
    cur = joined ? extend : restart
    const restarted = !joined
    if (restarted) start = i

    const updated = cur > maxSoFar
    if (updated) {
      maxSoFar = cur
      bestL = start
      bestR = i
    }

    dp[i] = cur
    best[i] = maxSoFar

    let note = `观察：nums[${i}] = ${v}，上一轮的 cur = ${prevCur}。判断：接在旧窗口后面是 ${prevCur} + (${v}) = ${extend}，从当前元素重新开始是 ${v}，`
    note += joined
      ? `${extend} > ${v}，说明旧窗口的和还是正的，接上更划算。动作：cur = ${cur}，候选窗口拉长为 nums[${start}..${i}]。`
      : `${extend} ≤ ${v}（等价于旧的 cur = ${prevCur} ≤ 0），再背着旧窗口只会让和变小。动作：舍弃前面的部分，从 i = ${i} 重新开始，cur = ${cur}。`
    note += updated
      ? ` 再和历史最大 ${prevBest} 比较：${cur} > ${prevBest}，best 刷新为 ${maxSoFar}，最优区间记为 nums[${bestL}..${bestR}]。`
      : ` 再和历史最大 ${prevBest} 比较：${cur} ≤ ${prevBest}，best 不变（但它对应的 dp 已存好，最后要取所有 dp 的最大值）。`
    steps.push({
      phase: 'step',
      i,
      dp: dp.slice(),
      best: best.slice(),
      start,
      bestL,
      bestR,
      updated,
      restarted,
      next: '',
      note,
    })
  }

  const winSum = INPUT.slice(bestL, bestR + 1).reduce((a, b) => a + b, 0)
  steps.push({
    phase: 'done',
    i: n - 1,
    dp: dp.slice(),
    best: best.slice(),
    start,
    bestL,
    bestR,
    updated: false,
    restarted: false,
    next: '',
    note: `观察：9 个元素扫描完毕，最后一轮的 cur = ${dp[n - 1]}，而所有 dp 的最大值是 ${maxSoFar}。判断：best 是逐步取最大值得到的，所以它就是 max(dp[0..n-1])，也就是答案。动作：答案 = ${maxSoFar}，对应子数组 nums[${bestL}..${bestR}] = [${INPUT.slice(bestL, bestR + 1).join(', ')}]，其元素和 = ${winSum}。为什么：每个元素只被处理一次，时间 O(n)；全程只用 cur 和 best 两个滚动变量，额外空间 O(1)。`,
  })

  // Hint 由后一个快照回填，保证描述的是真正的下一步动作
  steps[0].next = `处理 i = 1：算 max(${INPUT[1]}, ${INPUT[0]} + ${INPUT[1]}) 得到新的 cur，再与 best 比较`
  for (let k = 1; k < steps.length; k++) {
    const b = steps[k]
    const a = steps[k - 1]
    if (b.phase === 'step') {
      a.next = `处理 i = ${b.i}：算 max(nums[${b.i}], cur + nums[${b.i}])，再看是否刷新 best`
    } else if (b.phase === 'done') {
      a.next = '数组已扫完，输出 best 作为答案'
    }
  }

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

/** 与栅格共用的几何：左侧标签列宽（1rem = 16px，与栅格第一列的 3rem 对齐） */
const LABEL_W = 48
const GAP = 6
/** 弧线层几何：与单元格行同高（Cell md = h-9 = 36px），弧顶留 4px */
const ARC_H = 36
/** 栅格内一列（含间距）在 700 宽 viewBox 下的等比宽度：(700 - 48 - 8 * 6) / 9 ≈ 67.1 */
const STEP_W = (700 - LABEL_W - (N - 1) * GAP) / N
const PAD_L = 4
const APPEND_Y = 8

function Stage(step: Step) {
  const done = step.phase === 'done'
  /** 当前正在处理的元素（先移除上浮，让依赖弧线可从格内出发） */
  const ci = step.i
  const cols = `repeat(${N}, minmax(0, 1fr))`
  const restartIdx = !done && step.restarted ? step.start : -1
  const showStart = !done && step.start !== ci

  const stateOf = (k: number): CellState => {
    if (done) return k === step.bestR ? 'ok' : 'dim'
    if (step.phase === 'init') return k === 0 ? 'ok' : 'dim'
    if (k === step.bestL) return 'ok'
    if (k === ci) return 'active'
    if (k === step.start) return 'warn'
    return k < ci ? 'idle' : 'dim'
  }

  /** 单元格行上方的旗标：正在处理、窗口起点 */
  const flagOf = (k: number): { label: string; tone: Tone } | null => {
    if (done) return k === step.bestL && step.bestR > step.bestL ? { label: 'L', tone: 'easy' } : null
    if (step.phase === 'init') return k === 0 ? { label: 'i', tone: 'amber' } : null
    if (k === ci) return { label: 'i', tone: 'amber' }
    if (k === step.start && showStart) return { label: 'start', tone: 'medium' }
    return null
  }

  /** 单元格行下方的写法：cur 行（以它结尾的最大和）与 best 行（全局最大） */
  const curToneOf = (k: number): string => {
    if (done) return TONE.ink
    if (k === ci) return TONE.amber
    if (k === restartIdx) return TONE.medium
    return TONE.teal
  }
  const bestToneOf = (k: number): string => {
    if (done) return k === step.bestR ? TONE.easy : TONE.ink
    return k === step.bestL ? TONE.easy : TONE.ink
  }
  const markOf = (k: number): { text: string; tone: Tone } | null => {
    if (done) return k === step.bestR ? { text: '答案', tone: 'easy' } : null
    if (k === step.start && restartIdx >= 0) return { text: '重新开始', tone: 'medium' }
    if (k === ci) return { text: '扫描中', tone: 'amber' }
    return null
  }

  return (
    <div className="flex flex-col items-center gap-5">
      {/* 依赖方向：cur 要么接在 i-1 的 dp 后面，要么从 nums[i] 重新开始 */}
      <svg viewBox={`0 0 700 ${ARC_H}`} className="w-full select-none">
        <defs>
          <marker id="ka-append" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(var(--teal))" />
          </marker>
          <marker id="ka-restart" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(var(--medium))" />
          </marker>
        </defs>
        {step.phase === 'step' && (
          <>
            <path
              d={`M ${PAD_L} 22 L ${695} 22`}
              stroke="hsl(var(--ink))"
              strokeOpacity="0.12"
              strokeWidth="1"
              strokeDasharray="3 4"
              fill="none"
            />
            <path
              d={
                step.restarted
                  ? `M 4 ${APPEND_Y} L 22 ${APPEND_Y}`
                  : `M ${PAD_L + (ci - 1) * STEP_W} ${APPEND_Y} L ${PAD_L + ci * STEP_W - 6} ${APPEND_Y}`
              }
              stroke={step.restarted ? 'hsl(var(--medium))' : 'hsl(var(--teal))'}
              strokeWidth="1.6"
              fill="none"
              markerEnd={step.restarted ? 'url(#ka-restart)' : 'url(#ka-append)'}
            />
            {step.restarted ? (
              <text
                x={PAD_L + ci * STEP_W}
                y="20"
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                className="font-code"
                fill="hsl(var(--medium))"
              >
                cur ≤ 0 → 从 nums[{ci}] 重新开始
              </text>
            ) : (
              <text
                x={PAD_L + (ci - 0.5) * STEP_W}
                y="20"
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                className="font-code"
                fill="hsl(var(--teal))"
              >
                dp[{ci - 1}] + nums[{ci}]
              </text>
            )}
            <path
              d={`M ${PAD_L + ci * STEP_W - 5} 26 L ${PAD_L + ci * STEP_W + 5} 26 L ${PAD_L + ci * STEP_W} ${ARC_H} z`}
              fill="hsl(var(--amber))"
            />
          </>
        )}
      </svg>

      {/* 单元格行：格内是 nums[k]，格下第一行是以 k 结尾的 dp[k]，第二行是全局最大 best */}
      <div
        className="grid w-full"
        style={{ gridTemplateColumns: cols, paddingLeft: `${LABEL_W / 16}rem` }}
      >
        {INPUT.map((v, k) => {
          const hasCur = step.dp[k] !== null
          const hasBest = step.best[k] !== null
          const f = flagOf(k)
          const m = markOf(k)
          return (
            <div
              key={k}
              className="flex min-w-0 flex-col items-center gap-1"
              style={{ paddingLeft: k === 0 ? 0 : `${GAP / 2}px`, paddingRight: k === N - 1 ? 0 : `${GAP / 2}px` }}
            >
              <Flag label={f?.label} tone={f?.tone} />
              <Cell state={stateOf(k)} className="w-full min-w-0 sm:min-w-0">
                {v}
              </Cell>
              <span
                className="font-code text-[11px] font-semibold leading-none text-ink-soft"
                style={hasCur ? { color: curToneOf(k) } : undefined}
              >
                {hasCur ? step.dp[k] : '—'}
              </span>
              <span
                className="font-code text-[11px] font-semibold leading-none text-ink-soft"
                style={hasBest ? { color: bestToneOf(k) } : undefined}
              >
                {hasBest ? step.best[k] : '—'}
              </span>
              <span
                className="flex min-h-[2.6em] flex-col items-center leading-none"
                style={m ? { color: TONE[m.tone] } : undefined}
              >
                {m && (
                  <>
                    <span className="text-[8px] font-bold">{m.text}</span>
                    <span className="mt-px text-[9px] font-bold">▲</span>
                  </>
                )}
              </span>
            </div>
          )
        })}
      </div>

      <Badges className="justify-center">
        {!done && <Stat label={`i = ${ci}`} value={INPUT[ci]} tone="amber" />}
        {!done && <Stat label="cur（以 i 结尾）" value={step.dp[ci]} tone="teal" />}
        <Stat label="best（全局最大）" value={done ? step.best[step.bestR] : step.best[ci]} tone="easy" />
        {!done && step.next && <Hint>{step.next}</Hint>}
        {done && (
          <>
            <Answer>
              <b className="font-code">{step.best[step.bestR]}</b>
              {`，子数组 nums[${step.bestL}..${step.bestR}] = [${INPUT.slice(step.bestL, step.bestR + 1).join(', ')}]`}
            </Answer>
            <Badge>时间 O(n) · 空间 O(1)（只用 cur 与 best 两个滚动变量）</Badge>
          </>
        )}
      </Badges>
    </div>
  )
}

export default function MaximumSubarrayDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="Kadane 一次扫描：以每个位置结尾的最大和"
      info={`输入：nums = [${INPUT.join(', ')}]（题解示例 1，答案 6，共 10 步）。示例 3 全是正数、示例 2 只有一个元素，都看不出「cur 为负就重新开始」，所以取示例 1。每格下方第一行是 dp[k] = 以 k 结尾的最大子数组和 cur，第二行是截至该处的全局最大 best。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '正在处理的位置 i（cur = dp[i]）' },
        { color: TONE.medium, label: 'cur ≤ 0，从当前元素重新开始的起点' },
        { color: TONE.easy, label: 'best 的来源位置' },
        { color: TONE.teal, label: '格下 teal 数值：以该格结尾的 cur = dp[k]' },
        { color: TONE.muted, label: '尚未扫描到的部分（数值为 —）' },
      ]}
    />
  )
}
