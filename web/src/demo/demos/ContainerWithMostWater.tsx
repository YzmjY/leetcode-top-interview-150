import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'

/* ------------------------------------------------------------------ */
/* 28. 盛最多水的容器 —— 双指针可视化                                    */
/* ------------------------------------------------------------------ */

const HEIGHTS = [1, 8, 6, 2, 5, 4, 8, 3, 7]

interface Step {
  left: number
  right: number
  area: number | null
  maxArea: number
  bestL: number
  bestR: number
  moved: 'L' | 'R' | null
  phase: 'init' | 'step' | 'done'
  note: string
}

function buildSteps(): Step[] {
  const n = HEIGHTS.length
  const steps: Step[] = []
  let left = 0
  let right = n - 1
  let maxArea = 0
  let bestL = 0
  let bestR = n - 1

  steps.push({
    left, right, area: null, maxArea, bestL, bestR, moved: null, phase: 'init',
    note: `初始化：left 指向最左（下标 0，高 ${HEIGHTS[0]}），right 指向最右（下标 ${n - 1}，高 ${HEIGHTS[n - 1]}）。此时宽度最大。水量由「短板」决定：area = 宽 × min(两板高度)。`,
  })

  while (left < right) {
    const hl = HEIGHTS[left]
    const hr = HEIGHTS[right]
    const h = Math.min(hl, hr)
    const area = (right - left) * h
    const isNewBest = area > maxArea
    if (isNewBest) {
      maxArea = area
      bestL = left
      bestR = right
    }
    const moveLeft = hl < hr
    const shortSide = moveLeft ? '左板' : '右板'
    steps.push({
      left, right, area, maxArea, bestL, bestR,
      moved: moveLeft ? 'L' : 'R', phase: 'step',
      note:
        `当前容器：宽 ${right - left} × 高 min(${hl}, ${hr}) = ${h}，水量 = ${area}` +
        (isNewBest ? `，刷新历史最大水量 ${maxArea}！` : `，未超过历史最大 ${maxArea}。`) +
        `${shortSide}（高 ${moveLeft ? hl : hr}）是短板——移动长板只会让宽度变小且高度不可能超过短板，水量必然不增，因此排除短板，${moveLeft ? 'left 右移' : 'right 左移'}。`,
    })
    if (moveLeft) left++
    else right--
  }

  steps.push({
    left, right, area: null, maxArea, bestL, bestR, moved: null, phase: 'done',
    note: `left 与 right 相遇，搜索结束。每一轮都安全地排除了一个「不可能更优」的端点，最优解一定被检查过。最大水量 = ${maxArea}，由下标 ${bestL}（高 ${HEIGHTS[bestL]}）与下标 ${bestR}（高 ${HEIGHTS[bestR]}）构成。`,
  })
  return steps
}

/* ---------------- 舞台渲染 ---------------- */

const W = 680
const H = 340
const PAD_L = 24
const PAD_R = 24
const TOP = 46
const BOTTOM = 34
const PLOT_H = H - TOP - BOTTOM
const MAX_H = Math.max(...HEIGHTS)

function Stage(step: Step) {
  const n = HEIGHTS.length
  const slot = (W - PAD_L - PAD_R) / n
  const barW = Math.min(46, slot * 0.62)
  const x = (i: number) => PAD_L + slot * i + (slot - barW) / 2
  const barH = (v: number) => (v / MAX_H) * PLOT_H
  const y = (v: number) => TOP + PLOT_H - barH(v)

  const active = step.phase !== 'done'
  const waterTop = active ? Math.min(HEIGHTS[step.left], HEIGHTS[step.right]) : 0

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full select-none">
        {/* 水位区域 */}
        {active && (
          <g className="demo-water">
            <rect
              x={x(step.left) + barW}
              y={y(waterTop)}
              width={x(step.right) - x(step.left) - barW}
              height={barH(waterTop)}
              fill="hsl(var(--water) / 0.22)"
            />
            <line
              x1={x(step.left) + barW}
              x2={x(step.right)}
              y1={y(waterTop)}
              y2={y(waterTop)}
              stroke="hsl(var(--water))"
              strokeWidth="2"
              strokeDasharray="5 4"
            />
            {step.area !== null && (
              <text
                x={(x(step.left) + barW + x(step.right)) / 2}
                y={y(waterTop) + barH(waterTop) / 2 + 5}
                textAnchor="middle"
                className="fill-[hsl(var(--water))] font-code"
                fontSize="15"
                fontWeight="700"
              >
                {step.area}
              </text>
            )}
          </g>
        )}

        {/* 柱子 */}
        {HEIGHTS.map((v, i) => {
          const isL = active && i === step.left
          const isR = active && i === step.right
          const discarded = i < step.left || i > step.right
          const isBest = step.phase === 'done' && (i === step.bestL || i === step.bestR)
          let fill = 'hsl(var(--ink) / 0.28)'
          if (discarded) fill = 'hsl(var(--ink) / 0.09)'
          if (isL) fill = 'hsl(var(--amber))'
          if (isR) fill = 'hsl(var(--teal))'
          if (isBest) fill = 'hsl(var(--water))'
          return (
            <g key={i}>
              <rect
                className="demo-bar"
                x={x(i)}
                y={y(v)}
                width={barW}
                height={barH(v)}
                rx={5}
                fill={fill}
              />
              {/* 最优解光环 */}
              {isBest && (
                <rect
                  x={x(i) - 4}
                  y={y(v) - 4}
                  width={barW + 8}
                  height={barH(v) + 8}
                  rx={8}
                  fill="none"
                  stroke="hsl(var(--water))"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                  className="demo-pulse"
                />
              )}
              {/* 高度值 */}
              <text
                x={x(i) + barW / 2}
                y={y(v) - 8}
                textAnchor="middle"
                fontSize="12"
                fontWeight={isL || isR || isBest ? 700 : 400}
                className={
                  discarded
                    ? 'fill-[hsl(var(--ink)/0.3)]'
                    : 'fill-[hsl(var(--ink)/0.75)] font-code'
                }
              >
                {v}
              </text>
              {/* 指针标记 */}
              {(isL || isR) && (
                <g>
                  <path
                    d={`M ${x(i) + barW / 2 - 7} ${TOP - 26} h 14 l -7 9 z`}
                    fill={isL ? 'hsl(var(--amber))' : 'hsl(var(--teal))'}
                  />
                  <text
                    x={x(i) + barW / 2}
                    y={TOP - 32}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="800"
                    className="font-code"
                    fill={isL ? 'hsl(var(--amber))' : 'hsl(var(--teal))'}
                  >
                    {isL ? 'L' : 'R'}
                  </text>
                </g>
              )}
              {/* 下标 */}
              <text
                x={x(i) + barW / 2}
                y={H - 12}
                textAnchor="middle"
                fontSize="11"
                className="fill-[hsl(var(--ink-soft))] font-code"
              >
                {i}
              </text>
            </g>
          )
        })}

        {/* 基线 */}
        <line
          x1={PAD_L - 6}
          x2={W - PAD_R + 6}
          y1={TOP + PLOT_H}
          y2={TOP + PLOT_H}
          stroke="hsl(var(--border))"
          strokeWidth="1.5"
        />
      </svg>

      {/* 状态数值 */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-ink-soft">
          当前水量{' '}
          <b className="font-code text-sm text-[hsl(var(--water))]">
            {step.area ?? '—'}
          </b>
        </span>
        <span className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-ink-soft">
          历史最大{' '}
          <b className="font-code text-sm text-[hsl(var(--amber))]">{step.maxArea}</b>
        </span>
        {step.moved && step.phase === 'step' && (
          <span className="rounded-lg border border-[hsl(var(--teal))]/30 bg-[hsl(var(--teal-soft))] px-3 py-1.5 text-xs text-[hsl(var(--teal))]">
            下一步：移动 {step.moved === 'L' ? '左指针 L（短板）' : '右指针 R（短板）'}
          </span>
        )}
        {step.phase === 'done' && (
          <span className="rounded-lg border border-[hsl(var(--easy))]/30 bg-[hsl(var(--easy-soft))] px-3 py-1.5 text-xs font-medium text-[hsl(var(--easy))]">
            ✓ 答案 {step.maxArea} = 下标 {step.bestL} × 下标 {step.bestR}
          </span>
        )}
      </div>
    </div>
  )
}

export default function ContainerWithMostWaterDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="双指针收敛过程"
      info={`height = [${HEIGHTS.join(', ')}]，求能容纳最多水的两根柱子。`}
      steps={steps}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: 'hsl(28 92% 45%)', label: '左指针 L' },
        { color: 'hsl(178 60% 32%)', label: '右指针 R' },
        { color: 'hsl(205 85% 55% / 0.4)', label: '当前水量' },
        { color: 'hsl(var(--ink) / 0.12)', label: '已排除' },
      ]}
    />
  )
}
