import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badges, Hint, Pointer, Stat, TONE } from './stage'

/* ------------------------------------------------------------------ */
/* 16. 接雨水 —— 模式 B：柱状图 + 区域填充                               */
/* ------------------------------------------------------------------ */

const HEIGHTS = [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]

interface Step {
  left: number
  right: number
  leftMax: number
  rightMax: number
  waterAt: number[]
  resolved: boolean[]
  water: number
  settled: number
  phase: 'init' | 'step' | 'done'
  note: string
}

function buildSteps(): Step[] {
  const n = HEIGHTS.length
  const waterAt = new Array<number>(n).fill(0)
  const resolved = new Array<boolean>(n).fill(false)
  const steps: Step[] = []
  let left = 0
  let right = n - 1
  let leftMax = 0
  let rightMax = 0
  let water = 0

  const snapshot = (settled: number, phase: Step['phase'], note: string): Step => ({
    left, right, leftMax, rightMax,
    waterAt: waterAt.slice(), resolved: resolved.slice(), water, settled, phase, note,
  })

  steps.push(
    snapshot(
      -1,
      'init',
      `初始化：left = 0、right = ${n - 1}，leftMax = rightMax = 0，water = 0。位置 i 能接的水 = min(左边最高柱, 右边最高柱) - height[i]，水位由较矮的一侧决定。双指针的妙处在于：不必先算出全局左右最高柱，只要比较两侧已见过的最高柱，矮的那一侧的答案就已经确定。`
    )
  )

  while (left < right) {
    if (HEIGHTS[left] > leftMax) leftMax = HEIGHTS[left]
    if (HEIGHTS[right] > rightMax) rightMax = HEIGHTS[right]

    if (leftMax < rightMax) {
      const add = leftMax - HEIGHTS[left]
      water += add
      waterAt[left] = add
      resolved[left] = true
      steps.push(
        snapshot(
          left,
          'step',
          `观察：h[${left}] = ${HEIGHTS[left]}，h[${right}] = ${HEIGHTS[right]}，本轮 leftMax = ${leftMax}、rightMax = ${rightMax}。判断：leftMax < rightMax，左侧更矮，下标 ${left} 的水位被 leftMax 卡死——右边即便还有更高的墙，水位也不会超过更矮的这一边。动作：结算 ${leftMax} - ${HEIGHTS[left]} = ${add} 单位水，water 累加到 ${water}，随后 left 右移。`
        )
      )
      left++
    } else {
      const add = rightMax - HEIGHTS[right]
      water += add
      waterAt[right] = add
      resolved[right] = true
      steps.push(
        snapshot(
          right,
          'step',
          `观察：h[${left}] = ${HEIGHTS[left]}，h[${right}] = ${HEIGHTS[right]}，本轮 leftMax = ${leftMax}、rightMax = ${rightMax}。判断：leftMax ≥ rightMax，右侧不高于左侧，下标 ${right} 的水位由 rightMax 卡住。动作：结算 ${rightMax} - ${HEIGHTS[right]} = ${add} 单位水，water 累加到 ${water}，随后 right 左移。`
        )
      )
      right--
    }
  }

  steps.push(
    snapshot(
      -1,
      'done',
      `两指针在下标 ${left} 相遇，循环结束——相遇处是全局最高的一堵墙，它自己存不住水，两侧的水在之前都已结算完。最终接雨水量 = ${water}。每个下标只被处理一次，时间 O(n)；全程只用 left、right、leftMax、rightMax、water 五个变量，空间 O(1)。`
    )
  )
  return steps
}

/* ---------------- 舞台渲染 ---------------- */

const W = 680
const H = 300
const PAD_L = 22
const PAD_R = 22
const TOP = 56
const BOTTOM = 30
const PLOT_H = H - TOP - BOTTOM
const BASE = TOP + PLOT_H
const MAX_H = Math.max(...HEIGHTS)

function Stage(step: Step) {
  const n = HEIGHTS.length
  const slot = (W - PAD_L - PAD_R) / n
  const barW = Math.min(40, slot * 0.6)
  const x = (i: number) => PAD_L + slot * i + (slot - barW) / 2
  const y = (v: number) => BASE - (v / MAX_H) * PLOT_H
  const active = step.phase !== 'done'

  /* 已结算 = 绿底（与图例一致）；当前指针位置用琥珀 / 青绿描边单独标出 */
  const barFill = (i: number) => (step.resolved[i] ? 'hsl(var(--easy))' : 'hsl(var(--ink) / 0.28)')
  const barStroke = (i: number) => {
    if (!active) return 'none'
    if (i === step.left) return 'hsl(var(--amber))'
    if (i === step.right) return 'hsl(var(--teal))'
    return 'none'
  }

  /* 水位虚线：leftMax 覆盖 [0..left]，rightMax 覆盖 [right..n-1]；为 0 时不画，避免压在基线上 */
  const levels = active
    ? [
        { v: step.leftMax, from: 0, to: step.left, tone: 'water', label: `leftMax ${step.leftMax}` },
        { v: step.rightMax, from: step.right, to: n - 1, tone: 'teal', label: `rightMax ${step.rightMax}` },
      ].filter((lv) => lv.v > 0)
    : []

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full select-none">
        {/* 1. 区域填充：已结算的水 */}
        <g className="demo-water">
          {step.waterAt.map((w, i) =>
            w > 0 ? (
              <rect
                key={i}
                x={x(i)}
                y={y(HEIGHTS[i]) - (w / MAX_H) * PLOT_H}
                width={barW}
                height={(w / MAX_H) * PLOT_H}
                fill="hsl(var(--water) / 0.22)"
              />
            ) : null
          )}
        </g>

        {/* 2. 水位虚线 */}
        {levels.map((lv) => (
          <g key={lv.label}>
            <line
              x1={x(lv.from)}
              x2={x(lv.to) + barW}
              y1={y(lv.v)}
              y2={y(lv.v)}
              stroke={TONE[lv.tone as 'water' | 'teal']}
              strokeWidth="1.5"
              strokeDasharray="5 4"
              opacity="0.75"
            />
            <text
              x={lv.tone === 'water' ? x(lv.from) : x(lv.to) + barW}
              y={y(lv.v) - 5}
              textAnchor={lv.tone === 'water' ? 'start' : 'end'}
              fontSize="11"
              fontWeight="700"
              className="font-code"
              fill={TONE[lv.tone as 'water' | 'teal']}
            >
              {lv.label}
            </text>
          </g>
        ))}

        {/* 3. 柱子（高度 0 的柱子留 2px 底座，始终画在基线之上） */}
        {HEIGHTS.map((v, i) => {
          const h = Math.max(v === 0 ? 2 : 3, (v / MAX_H) * PLOT_H)
          return (
            <rect
              key={i}
              className="demo-bar"
              x={x(i)}
              y={BASE - h}
              width={barW}
              height={h}
              rx={4}
              fill={barFill(i)}
              stroke={barStroke(i)}
              strokeWidth="2.5"
            />
          )
        })}

        {/* 4. 指针旗标 */}
        {active && (
          <g>
            <Pointer x={x(step.left) + barW / 2} y={TOP - 26} label="L" tone="amber" />
            <Pointer x={x(step.right) + barW / 2} y={TOP - 26} label="R" tone="teal" />
          </g>
        )}

        {/* 5. 数值标签 */}
        {HEIGHTS.map((v, i) => (
          <text
            key={i}
            x={x(i) + barW / 2}
            y={y(v) - 9}
            textAnchor="middle"
            fontSize="12"
            fontWeight={i === step.settled ? 700 : 400}
            className="font-code fill-[hsl(var(--ink)/0.75)]"
          >
            {v}
          </text>
        ))}

        {/* 6. 基线 + 下标 */}
        <line
          x1={PAD_L - 6}
          x2={W - PAD_R + 6}
          y1={BASE}
          y2={BASE}
          stroke="hsl(var(--border))"
          strokeWidth="1.5"
        />
        {HEIGHTS.map((_, i) => (
          <text
            key={i}
            x={x(i) + barW / 2}
            y={H - 10}
            textAnchor="middle"
            fontSize="11"
            className="font-code fill-[hsl(var(--ink-soft))]"
          >
            {i}
          </text>
        ))}
      </svg>

      <Badges className="mt-3">
        <Stat label="leftMax" value={step.leftMax} tone="water" />
        <Stat label="rightMax" value={step.rightMax} tone="teal" />
        <Stat label="已接雨水" value={step.water} tone="water" />
        {step.phase === 'step' && (
          <Hint>
            本步结算下标 {step.settled}，
            {step.settled === step.left ? 'left 右移一位' : 'right 左移一位'}
          </Hint>
        )}
        {step.phase === 'done' && <Answer>能接 {step.water} 单位雨水</Answer>}
      </Badges>
    </div>
  )
}

export default function TrappingRainWaterDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="双指针结算水位"
      info={`height = [${HEIGHTS.join(', ')}]，每根柱子宽度为 1，求下雨后能接多少雨水。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.water, label: '接到的雨水 / leftMax 水位' },
        { color: TONE.teal, label: '右指针 R / rightMax 水位' },
        { color: TONE.easy, label: '答案已结算的位置' },
        { color: TONE.amber, label: '左指针 L' },
        { color: TONE.muted, label: '尚未结算的柱子' },
      ]}
    />
  )
}
