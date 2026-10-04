import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badge, Badges, Cell, Hint, Stat, TONE, type CellState } from './stage'

/* ------------------------------------------------------------------ */
/* 137. 爬楼梯 —— 模式 H：一维 DP（单元格行 + 依赖弧线）                  */
/* ------------------------------------------------------------------ */

/** 示例输入：题解示例 n = 2 / 3 规模太小看不清递推，取 n = 6（dp[0..6] 共 7 格）。 */
const INPUT = 6

interface Step {
  /** dp 快照：null 表示该位置还没算到 */
  dp: (number | null)[]
  /** 本步正在计算的 i；init 步为最后一个已填好的边界 */
  i: number
  phase: 'init' | 'step' | 'done'
  note: string
}

function buildSteps(): Step[] {
  const n = INPUT
  const dp = new Array<number | null>(n + 1).fill(null)
  const steps: Step[] = []

  const snap = (i: number, phase: Step['phase'], note: string) => {
    steps.push({ dp: dp.slice(), i, phase, note })
  }

  dp[0] = 1
  dp[1] = 1
  snap(
    1,
    'init',
    `初始化：dp[i] 表示爬到第 i 级台阶的方法数，两个边界 dp[0] = 1（站在原地不动也算一种走法）、dp[1] = 1（只能跨 1 级）。观察：到达第 i 级的最后一步只能是跨 1 级（来自 i-1）或跨 2 级（来自 i-2）。判断：两类走法最后一步的长度不同，互不重叠，又合起来覆盖了全部方案，所以 dp[i] = dp[i-1] + dp[i-2]。`
  )

  for (let i = 2; i <= n; i++) {
    const one = dp[i - 1]!
    const two = dp[i - 2]!
    dp[i] = one + two
    snap(
      i,
      'step',
      `观察：dp[${i - 1}] = ${one}、dp[${i - 2}] = ${two} 都已算好，弧线从这两格连向当前格。判断：到第 ${i} 级的最后一步只有跨 1 级和跨 2 级两类，分别与「爬到第 ${i - 1} 级」「爬到第 ${i - 2} 级」的方法一一对应。动作：dp[${i}] = ${one} + ${two} = ${one + two}，写入当前格。`
    )
  }

  snap(
    n,
    'done',
    `递推结束：dp[${n}] = ${dp[n]}，就是爬 ${n} 级台阶的走法总数。每个 i 只被计算一次，时间 O(n)；dp[i] 只依赖前两项，改用 prev1、prev2 两个滚动变量即可把空间压到 O(1)。`
  )

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

const W = 700
const ARC_H = 76

function Stage(step: Step) {
  const n = INPUT
  const count = n + 1
  /** 第 k 个格子的中心 x：格子序号线性换算，绝不写死像素 */
  const xOf = (k: number) => ((k + 0.5) / count) * W
  const baseY = ARC_H - 3
  const cur = step.i

  const stateOf = (k: number): CellState => {
    if (step.phase === 'init') return k <= 1 ? 'ok' : 'dim'
    if (step.phase === 'done') return k === n ? 'ok' : 'idle'
    if (k === cur) return 'active'
    if (k === cur - 1 || k === cur - 2) return 'new'
    return k > cur ? 'dim' : 'idle'
  }

  /** 格下的文字标签：状态不靠颜色单独区分 */
  const tagOf = (k: number): { text: string; color: string } | null => {
    if (step.phase === 'init') return k <= 1 ? { text: '边界', color: TONE.easy } : null
    if (step.phase === 'done') return k === n ? { text: '答案', color: TONE.easy } : null
    if (k === cur) return { text: 'i', color: TONE.amber }
    if (k === cur - 1) return { text: 'i-1', color: TONE.teal }
    if (k === cur - 2) return { text: 'i-2', color: TONE.teal }
    return null
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* 依赖弧线：从 dp[i-1]、dp[i-2] 连到当前格 dp[i] */}
      <svg viewBox={`0 0 ${W} ${ARC_H}`} className="w-full select-none">
        {step.phase === 'step' &&
          [cur - 2, cur - 1].map((src) => {
            const off = cur - src
            const peak = Math.max(6, baseY - off * 30)
            const mid = (xOf(src) + xOf(cur)) / 2
            return (
              <g key={src}>
                <path
                  d={`M ${xOf(src)} ${baseY} Q ${mid} ${peak} ${xOf(cur)} ${baseY}`}
                  fill="none"
                  stroke="hsl(var(--teal))"
                  strokeWidth="1.5"
                />
                <text
                  x={xOf(src) + 7}
                  y={baseY - 8}
                  fontSize="11"
                  fontWeight="700"
                  className="font-code"
                  fill="hsl(var(--teal))"
                >
                  dp[{src}]
                </text>
              </g>
            )
          })}
        {step.phase === 'step' && (
          <path
            d={`M ${xOf(cur) - 5} ${baseY - 8} L ${xOf(cur) + 5} ${baseY - 8} L ${xOf(cur)} ${baseY + 3} z`}
            fill="hsl(var(--amber))"
          />
        )}
      </svg>

      {/* 单元格行：格内 dp 值、格下下标与文字标签 */}
      <div
        className="grid w-full"
        style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
      >
        {step.dp.map((v, k) => {
          const tag = tagOf(k)
          return (
            <div key={k} className="flex flex-col items-center gap-1">
              <Cell state={stateOf(k)} className="w-full min-w-0">{v === null ? '?' : v}</Cell>
              <span className="font-code text-[11px] text-ink-soft">dp[{k}]</span>
              <span
                className="h-4 font-code text-[10px] font-bold"
                style={tag ? { color: tag.color } : undefined}
              >
                {tag ? tag.text : ''}
              </span>
            </div>
          )
        })}
      </div>

      <Badges className="justify-center">
        {step.phase === 'init' && (
          <>
            <Stat label="dp[0]" value={step.dp[0]} tone="easy" />
            <Stat label="dp[1]" value={step.dp[1]} tone="easy" />
            <Hint>从 i = 2 开始，按 dp[i] = dp[i-1] + dp[i-2] 逐级填表</Hint>
          </>
        )}
        {step.phase === 'step' && (
          <>
            <Stat label="dp[i-1]" value={step.dp[cur - 1]} tone="teal" />
            <Stat label="dp[i-2]" value={step.dp[cur - 2]} tone="teal" />
            <Stat label={`i = ${cur} · dp[i]`} value={step.dp[cur]} tone="amber" />
            <Hint>
              {cur < n ? `i 右移，算 dp[${cur + 1}] = dp[${cur}] + dp[${cur - 1}]` : '表已填满，给出答案'}
            </Hint>
          </>
        )}
        {step.phase === 'done' && (
          <>
            <Stat label="n" value={n} />
            <Answer>
              dp[{n}] = {step.dp[n]}，爬 {n} 级台阶共 {step.dp[n]} 种走法
            </Answer>
            <Badge>时间 O(n) · 空间 O(1)（滚动变量 prev1 / prev2）</Badge>
          </>
        )}
      </Badges>
    </div>
  )
}

export default function ClimbingStairsDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="一维 DP 逐级填表"
      info={`输入：n = ${INPUT}（题解示例为 n = 2 / 3，这里取更易观察递推的 n = ${INPUT}）。dp[i] = 爬到第 i 级台阶的方法数，每次只能跨 1 级或 2 级。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '当前计算的 dp[i]' },
        { color: TONE.teal, label: '依赖来源 dp[i-1] / dp[i-2]' },
        { color: TONE.easy, label: '递推边界 / 最终答案' },
        { color: TONE.muted, label: '尚未计算' },
      ]}
    />
  )
}
