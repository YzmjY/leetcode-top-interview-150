import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badge, Badges, Hint, Pointer, Stat, TONE } from './stage'

/* ------------------------------------------------------------------ */
/* 7. 买卖股票的最佳时机 —— 模式 B：柱状图 + 历史最低价水位线             */
/* ------------------------------------------------------------------ */

/** 题解示例 1：[7,1,5,3,6,4]，输出 5（第 2 天买入、第 5 天卖出） */
const PRICES = [7, 1, 5, 3, 6, 4]
/** 题解示例 2（单调下跌）作为对照，见 info —— 全程不产生正利润 */
const FALLING = [7, 6, 4, 3, 1]

interface Step {
  /** 当前遍历到的卖出日（下标） */
  today: number
  /** 历史最低价及其所在下标 */
  minPrice: number
  minDay: number
  /** 今天卖出能获得的利润（不参与取最大，可能为负） */
  profit: number
  /** 历史最大利润及对应卖出日（null = 尚未发生任何盈利交易） */
  maxProfit: number
  bestDay: number | null
  phase: 'init' | 'step' | 'done'
  note: string
}

function buildSteps(): Step[] {
  const n = PRICES.length
  const steps: Step[] = []
  // 题解注明通用实现需先处理空数组；本题约束保证 n >= 1
  if (n === 0) return steps

  const snap = (
    today: number,
    profit: number,
    bestDay: number | null,
    phase: Step['phase'],
    note: string
  ) => {
    steps.push({ today, minPrice, minDay, profit, maxProfit, bestDay, phase, note })
  }

  let minPrice = PRICES[0]
  let minDay = 0
  let maxProfit = 0
  let profit = 0
  let bestDay: number | null = null

  snap(
    0,
    0,
    bestDay,
    'init',
    '初始化：第 0 天先当作历史最低买入价，minPrice = 7、minDay = 0，maxProfit = 0。' +
      '观察：买入日必须早于卖出日，而任一天卖出的最优买入价，就是它左边出现过的最低价。' +
      '判断：maxProfit 从 0 起算而不是 prices[1] - prices[0]，单调下跌时会自然返回 0。'
  )

  for (let i = 1; i < n; i++) {
    profit = PRICES[i] - minPrice
    const isNewBest = profit > maxProfit
    if (isNewBest) {
      maxProfit = profit
      bestDay = i
    }
    const isNewLow = PRICES[i] < minPrice

    let note: string
    if (isNewLow) {
      note =
        `观察：第 ${i} 天价格 ${PRICES[i]}，历史最低价仍是 ${minPrice}（第 ${minDay} 天）。` +
        `判断：今天卖出只能得到 ${PRICES[i]} − ${minPrice} = ${profit}（为负，不可行），` +
        `但今天的价格更便宜。动作：把历史最低价下调为 minPrice = ${PRICES[i]}、minDay = ${i}，maxProfit 保持 ${maxProfit}。`
    } else {
      note =
        `观察：第 ${i} 天价格 ${PRICES[i]}，历史最低价 ${minPrice}（第 ${minDay} 天）。` +
        `判断：今天卖出可获利 ${PRICES[i]} − ${minPrice} = ${profit}，` +
        (isNewBest
          ? `超过了 maxProfit。`
          : `未超过 maxProfit = ${maxProfit}。`) +
        `动作：${isNewBest ? `更新 maxProfit = ${maxProfit}、bestDay = ${i}，` : '利润与 bestDay 都保持不动，'}价格没有更低，minPrice 不变。`
    }
    snap(i, profit, bestDay, 'step', note)
  }

  const last = n - 1
  snap(
    last,
    profit,
    bestDay,
    'done',
    bestDay === null
      ? `扫描结束：全程没有一天能在更早的低价买入后获利，最大利润 = 0（不交易）。` +
        `时间 O(n)，只扫一遍；空间 O(1)，只用了 minPrice 与 maxProfit。`
      : `扫描结束：最大利润 = ${maxProfit}，第 ${minDay} 天（价格 ${PRICES[minDay]}）买入、` +
        `第 ${bestDay} 天（价格 ${PRICES[bestDay]}）卖出。时间 O(n)，只扫一遍；空间 O(1)，只用了 minPrice 与 maxProfit。`
  )
  return steps
}

/* ---------------- 舞台渲染 ---------------- */

const W = 680
const H = 330
const PAD_L = 26
const PAD_R = 26
const TOP = 62
const BOTTOM = 32
const PLOT_H = H - TOP - BOTTOM
const BASE = TOP + PLOT_H
const MAX_V = Math.max(...PRICES)

function Stage(step: Step) {
  const n = PRICES.length
  const slot = (W - PAD_L - PAD_R) / n
  const barW = Math.min(44, slot * 0.6)
  /** 柱高线性映射：值为 0 时留 3px 底座，始终可见地立在基线上 */
  const barH = (v: number) => (v <= 0 ? 3 : Math.max(3, (v / MAX_V) * PLOT_H))
  const x = (i: number) => PAD_L + slot * i + (slot - barW) / 2
  const y = (v: number) => BASE - barH(v)

  const active = step.phase !== 'done'
  const todayIsMin = step.today === step.minDay
  const profitAt = step.today >= 1 && !todayIsMin ? step.profit : null
  /** 利润标签贴在卖出柱顶部，与柱顶数值错开，避免文字重叠 */
  const profitY = (step.today >= 1 ? y(PRICES[step.today]) : BASE) - (profitAt !== null ? 25 : 10)

  /** 历史最低价水位虚线：从买入日一直延伸到右边界 */
  const levelY = y(step.minPrice)
  const levelLabelX = step.minDay <= (n - 1) / 2 ? x(step.minDay) + barW : x(step.minDay)
  const levelLabelAnchor = step.minDay <= (n - 1) / 2 ? 'start' : 'end'

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full select-none">
        {/* 1. 最佳交易区间（仅 done）：买入价到卖出价之间的利润空间 */}
        {step.phase === 'done' && step.bestDay !== null && (
          <g className="fade-up">
            <rect
              x={x(step.minDay) + barW}
              y={y(PRICES[step.bestDay])}
              width={Math.max(0, x(step.bestDay) - x(step.minDay) - barW)}
              height={BASE - y(PRICES[step.bestDay])}
              fill={TONE.easy}
              opacity="0.13"
            />
            <line
              x1={x(step.minDay) + barW}
              x2={x(step.bestDay) + barW}
              y1={y(PRICES[step.bestDay])}
              y2={y(PRICES[step.bestDay])}
              stroke={TONE.easy}
              strokeWidth="1.5"
              strokeDasharray="5 4"
            />
          </g>
        )}

        {/* 2. 历史最低价水位虚线（贯穿到右边界） */}
        <g>
          <line
            x1={x(step.minDay) + barW / 2}
            x2={W - PAD_R + 6}
            y1={levelY}
            y2={levelY}
            stroke={TONE.teal}
            strokeWidth="1.5"
            strokeDasharray="6 4"
            opacity="0.8"
          />
          <text
            x={levelLabelX}
            y={levelY - 6}
            textAnchor={levelLabelAnchor}
            fontSize="11"
            fontWeight="700"
            className="font-code"
            fill={TONE.teal}
          >
            {`minPrice ${step.minPrice}`}
          </text>
        </g>

        {/* 3. 价格柱：填充区分已遍历 / 未遍历，描边区分今天、最低价日、最佳卖出日 */}
        {PRICES.map((v, i) => {
          const h = barH(v)
          const visited = active ? i <= step.today : true
          const isToday = active && i === step.today
          const isMinDay = i === step.minDay
          const isBestSell = step.bestDay === i
          let stroke: string = 'none'
          if (active) {
            if (isMinDay) stroke = TONE.teal
            else if (isToday) stroke = TONE.amber
          } else if (isMinDay || isBestSell) {
            /* done 步：最优买入日与最佳卖出日统一用绿描边，与利润区间呼应 */
            stroke = TONE.easy
          }
          return (
            <rect
              key={i}
              className="demo-bar"
              x={x(i)}
              y={BASE - h}
              width={barW}
              height={h}
              rx={4}
              fill={visited ? 'hsl(var(--ink) / 0.28)' : 'hsl(var(--ink) / 0.09)'}
              stroke={stroke}
              strokeWidth="2.5"
            />
          )
        })}

        {/* 4. 指针旗标：今天 */}
        {active && (
          <Pointer x={x(step.today) + barW / 2} y={TOP - 34} label="今天" tone="amber" />
        )}

        {/* 5. 今天卖出的利润（贴在对应柱顶） */}
        {profitAt !== null && (
          <text
            x={x(step.today) + barW / 2}
            y={profitY}
            textAnchor="middle"
            fontSize="12"
            fontWeight="700"
            className="font-code"
            fill={TONE.amber}
          >
            {`利润 ${profitAt}`}
          </text>
        )}

        {/* 6. 数值与天序号 */}
        {PRICES.map((v, i) => (
          <g key={i}>
            <text
              x={x(i) + barW / 2}
              y={y(v) - 9}
              textAnchor="middle"
              fontSize="12"
              fontWeight={active && i === step.today ? 700 : 400}
              className="font-code fill-[hsl(var(--ink)/0.75)]"
            >
              {v}
            </text>
            <text
              x={x(i) + barW / 2}
              y={BASE + 16}
              textAnchor="middle"
              fontSize="11"
              className="font-code fill-[hsl(var(--ink-soft))]"
            >
              {`第${i}天`}
            </text>
          </g>
        ))}

        {/* 7. 基线 */}
        <line
          x1={PAD_L - 6}
          x2={W - PAD_R + 6}
          y1={BASE}
          y2={BASE}
          stroke="hsl(var(--border))"
          strokeWidth="1.5"
        />
      </svg>

      {/* 状态徽章（2–4 个） */}
      <Badges className="mt-3">
        <Stat label="minPrice" value={step.minPrice} tone="teal" />
        {step.phase === 'init' && (
          <>
            <Stat label="maxProfit" value={step.maxProfit} tone="easy" />
            <Hint>从第 1 天起逐日扫描：先算今天卖出的利润，再更新历史最低价</Hint>
          </>
        )}
        {step.phase === 'step' && (
          <>
            <Stat label={`第${step.today}天利润`} value={step.profit} tone="amber" />
            <Stat label="maxProfit" value={step.maxProfit} tone="easy" />
            <Hint>
              {step.today < n - 1
                ? `看第 ${step.today + 1} 天价格 ${PRICES[step.today + 1]}：先算 ${PRICES[step.today + 1]} − ${step.minPrice} 的利润，再决定是否下调 minPrice`
                : '已扫描到最后一天，给出答案'}
            </Hint>
          </>
        )}
        {step.phase === 'done' && (
          <>
            <Stat label="maxProfit" value={step.maxProfit} tone="easy" />
            <Badge tone="ink">
              时间 O(n) · 空间 O(1)
            </Badge>
            <Answer>
              {step.bestDay === null
                ? '最大利润 0（不交易）'
                : `最大利润 ${step.maxProfit} = 第${step.minDay}天 ${PRICES[step.minDay]} 买入、第${step.bestDay}天 ${PRICES[step.bestDay]} 卖出`}
            </Answer>
          </>
        )}
      </Badges>
    </div>
  )
}

export default function BestTimeToBuyAndSellStockDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="一次扫描：历史最低价 + 当日利润"
      info={`prices = [${PRICES.join(', ')}]（题解示例 1，输出 5）。对照示例 2 prices = [${FALLING.join(', ')}] 全程只有下跌，每天利润均为负，maxProfit 保持初值 0。只能买入一次、卖出一次，不能累加多笔收益。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '当前遍历到的卖出日（今天）' },
        { color: TONE.teal, label: '历史最低价 minPrice / 买入日' },
        { color: TONE.easy, label: '最佳卖出日 / 最佳交易利润区间' },
        { color: TONE.muted, label: '尚未遍历到的日子' },
      ]}
    />
  )
}
