import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badges, Cell, Hint, Pointer, Stat, TONE, type CellState } from './stage'

/* ------------------------------------------------------------------ */
/* 8. 买卖股票的最佳时机 II —— 模式 B：柱状图 + 上涨段累加                */
/* ------------------------------------------------------------------ */

/** 题解「示例 1」：6 天里有 2 段上涨、3 段下跌，答案 7 */
const PRICES = [7, 1, 5, 3, 6, 4]

/** 相邻两天的正差价之和，即本题的收益上界（与最终 totalProfit 相等） */
const best = PRICES.reduce((sum, p, i) => (i > 0 && p > PRICES[i - 1] ? sum + p - PRICES[i - 1] : sum), 0)

/** 一笔单日交易：from 天买入 → to 天卖出，diff 是这段的利润 */
interface Trade {
  from: number
  to: number
  diff: number
}

/** note 用的收益明细：「1→5 赚 4、3→6 赚 3」，由本次实际收下的交易段生成 */
const gainDetail = (trades: Trade[]) =>
  trades.map((t) => `${PRICES[t.from]}→${PRICES[t.to]} 赚 ${t.diff}`).join('、')

/** 答案用的收益明细：「4（1→5）+ 3（3→6）」，同样由本次实际收下的交易段生成 */
const sumDetail = (trades: Trade[]) =>
  trades.map((t) => `${t.diff}（${PRICES[t.from]}→${PRICES[t.to]}）`).join(' + ')

interface Step {
  /** 本步正在比较的「今天」下标 */
  day: number
  /** 上一步已确定的交易（from 天买入 → to 天卖出） */
  edge: Trade | null
  /** 正在结算的上涨边（该笔交易的利润），否则 null */
  gain: Trade | null
  /** 正在跳过的下跌边（差价，可能为 0） */
  drop: Trade | null
  /** 截至本步已收下的交易段（按天序），收益明细由它生成 */
  trades: Trade[]
  total: number
  phase: 'init' | 'step' | 'done'
  note: string
}

function buildSteps(): Step[] {
  const n = PRICES.length
  const steps: Step[] = []
  let total = 0
  const picked: Trade[] = []
  let edge: Step['edge'] = null

  steps.push({
    day: 0, edge: null, gain: null, drop: null, trades: [], total, phase: 'init',
    note: `初始化：prices = [${PRICES.join(', ')}]，totalProfit = 0，指针 i 从下标 1 开始。本题允许无限次交易（同一时刻最多持有一股），所以不必找交易的起止点：只要今天比昨天高，就把这段正差价当作「昨天买入、今天卖出」收下。`,
  })

  for (let i = 1; i < n; i++) {
    const diff = PRICES[i] - PRICES[i - 1]
    const gain: Trade | null = diff > 0 ? { from: i - 1, to: i, diff } : null
    const drop: Trade | null = diff > 0 ? null : { from: i - 1, to: i, diff }
    const head = `观察：第 ${i - 1} 天 ${PRICES[i - 1]} → 第 ${i} 天 ${PRICES[i]}，相邻差价 ${diff}。`

    if (gain !== null) {
      total += diff
      picked.push(gain)
      edge = gain
      steps.push({
        day: i, edge: gain, gain, drop: null, trades: picked.slice(), total, phase: 'step',
        note:
          `${head}判断：今天更高，这段上涨做成「第 ${i - 1} 天买入、第 ${i} 天卖出」的合法交易。` +
          `动作：totalProfit += ${diff} 得到 ${total}。为什么：holding 到底的收益 ${PRICES[i]} − ${PRICES[i - 1]} 就是这段差价，正差价取满不会亏。`,
      })
    } else {
      steps.push({
        day: i, edge, gain: null, drop, trades: picked.slice(), total, phase: 'step',
        note:
          `${head}判断：这段下跌（差价为 0 或负）不产生正收益。` +
          `动作：不做交易，totalProfit 保持 ${total}，i 右移。为什么：只有涨的差价才值得拆出来收下，跌的差价跳过即可避免亏损。`,
      })
    }
  }

  steps.push({
    day: n - 1, edge, gain: null, drop: null, trades: picked.slice(), total, phase: 'done',
    note: `扫描结束，i 走到下标 ${n - 1}，最大总利润 = ${total}，由 ${picked.length} 笔单日交易（${gainDetail(picked)}）累加得到。可见贪心收下的正是「所有相邻正差价之和」，把上涨段拆成单日交易不会损失任何利润。每个下标只比较一次：时间 O(n)；只用一个累加变量：空间 O(1)。`,
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

const W = 680
const H = 300
const PAD_L = 26
const PAD_R = 26
const TOP = 62
const BOTTOM = 34
const PLOT_H = H - TOP - BOTTOM
const BASE = TOP + PLOT_H
const MAX_P = Math.max(...PRICES)

/** 取池底高度，保证价格 0 也有一小截可见 */
const barH = (v: number) => Math.max(6, (v / MAX_P) * PLOT_H)

function Stage(step: Step) {
  const n = PRICES.length
  const slot = (W - PAD_L - PAD_R) / n
  const barW = Math.min(52, slot * 0.56)
  const x = (i: number) => PAD_L + slot * i + (slot - barW) / 2
  const topY = (i: number) => BASE - barH(PRICES[i])

  const running = step.total
  const from = step.day - 1
  const isGain = step.gain !== null

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full select-none">
        {/* 1. 本步评估的相邻差价：上涨段 = 累加进答案，下跌段 = 跳过不参与 */}
        {step.day > 0 && (
          <g className="demo-water">
            <polygon
              points={`${x(from)},${topY(from)} ${x(from) + barW},${topY(from)} ${x(step.day) + barW},${topY(step.day)} ${x(step.day)},${topY(step.day)}`}
              fill={isGain ? 'hsl(var(--easy) / 0.24)' : 'hsl(var(--hard) / 0.18)'}
            />
            <line
              x1={x(from) + barW / 2}
              y1={topY(from)}
              x2={x(step.day) + barW / 2}
              y2={topY(step.day)}
              stroke={isGain ? TONE.easy : TONE.hard}
              strokeWidth="3"
            />
            <text
              x={(x(from) + x(step.day)) / 2 + barW / 2}
              y={Math.min(topY(from), topY(step.day)) - 12}
              textAnchor="middle"
              fontSize="13"
              fontWeight="800"
              className="font-code"
              fill={isGain ? TONE.easy : TONE.hard}
            >
              {isGain ? `+${step.gain!.diff}` : `${step.drop!.diff}`}
            </text>
          </g>
        )}

        {/* 2. 价格折线：已收下的上涨段用青色，其余为灰 */}
        {PRICES.slice(1).map((_, k) => {
          const i = k + 1
          const live = i === step.day
          const done = step.edge !== null && i <= step.edge.to
          return (
            <line
              key={i}
              x1={x(i - 1) + barW / 2}
              y1={topY(i - 1)}
              x2={x(i) + barW / 2}
              y2={topY(i)}
              stroke={live ? TONE.amber : done ? TONE.teal : 'hsl(var(--ink) / 0.16)'}
              strokeWidth={live ? 2.5 : 1.5}
              strokeDasharray={live ? undefined : '4 4'}
            />
          )
        })}

        {/* 3. 价格柱：正在评估的一对取绿/红（图例 2/3），done 步只给收下的交易段取青（图例 4），其余取灰（图例 5） */}
        {PRICES.map((v, i) => {
          const live = i === step.day
          const prev = step.day > 0 && i === from
          // 该柱属于某笔被收下的交易（任一侧相邻差价为上涨）—— 贪心会收下全部上涨段
          const traded = (i > 0 && PRICES[i] > PRICES[i - 1]) || (i + 1 < n && PRICES[i + 1] > PRICES[i])
          let fill = TONE.muted
          if (step.phase === 'done') {
            if (traded) fill = 'hsl(var(--teal) / 0.5)'
          } else {
            const collected = step.edge !== null && (i === step.edge.from || i === step.edge.to)
            if (collected) fill = 'hsl(var(--easy) / 0.7)'
            if (prev) fill = isGain ? 'hsl(var(--easy) / 0.7)' : 'hsl(var(--hard) / 0.55)'
            if (live) fill = TONE.amber
          }
          return (
            <rect
              key={i}
              className="demo-bar"
              x={x(i)}
              y={BASE - barH(v)}
              width={barW}
              height={barH(v)}
              rx={5}
              fill={fill}
            />
          )
        })}

        {/* 4. 柱顶价格 */}
        {PRICES.map((v, i) => (
          <text
            key={i}
            x={x(i) + barW / 2}
            y={TOP + PLOT_H - barH(v) - 8}
            textAnchor="middle"
            fontSize="12"
            fontWeight={i === step.day || i === from ? 700 : 400}
            className="font-code fill-[hsl(var(--ink)/0.75)]"
          >
            {v}
          </text>
        ))}

        {/* 5. 指针旗标 */}
        {step.phase !== 'done' && (
          <g>
            {step.day > 0 && (
              <Pointer x={x(from) + barW / 2} y={TOP - 30} label={`i-1=${from}`} tone="muted" />
            )}
            <Pointer x={x(step.day) + barW / 2} y={TOP - 16} label={`i=${step.day}`} tone="amber" />
          </g>
        )}

        {/* 6. 基线 + 天数轴 */}
        <line x1={PAD_L - 6} x2={W - PAD_R + 6} y1={BASE} y2={BASE} stroke="hsl(var(--border))" strokeWidth="1.5" />
        {PRICES.map((_, i) => (
          <text
            key={i}
            x={x(i) + barW / 2}
            y={BASE + 18}
            textAnchor="middle"
            fontSize="11"
            className="font-code fill-[hsl(var(--ink-soft))]"
          >
            第{i}天
          </text>
        ))}
      </svg>

      {/* 每格：本步的相邻差价，附「买入/卖出」或「不交易」字母标签（不只靠颜色区分） */}
      <div className="mt-3 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
        {PRICES.map((_, i) => {
          const diff = i === 0 ? null : PRICES[i] - PRICES[i - 1]
          const live = i === step.day
          const settled = step.edge !== null && i <= step.edge.to
          const state: CellState = diff === null ? 'dim' : live ? (isGain ? 'ok' : 'bad') : settled ? 'new' : 'idle'
          return (
            <div key={i} className="flex min-w-0 flex-col items-center gap-1">
              <Cell size="sm" state={state} className="w-full min-w-0">
                {diff === null ? '—' : diff > 0 ? `+${diff}` : `${diff}`}
              </Cell>
              <span className="font-code text-[11px] text-ink-soft">
                {diff === null ? '起点' : diff > 0 ? `买${i - 1}·卖${i}` : '不交易'}
              </span>
            </div>
          )
        })}
      </div>

      <Badges className="mt-3">
        <Stat label="totalProfit" value={running} tone="teal" />
        <Stat label="上界(正差价和)" value={best} tone="easy" />
        {step.phase === 'step' && (
          <Hint>
            {isGain
              ? `把 i 右移到下标 ${Math.min(step.day + 1, n - 1)}，用 prices[${Math.min(step.day + 1, n - 1)}] 减去今天的 ${PRICES[step.day]} 比下一段差价`
              : `把 i 右移到下标 ${Math.min(step.day + 1, n - 1)}，继续比较下一对相邻价格`}
          </Hint>
        )}
        {step.phase === 'init' && <Hint>先比较第 0 天和第 1 天：prices[1] − prices[0] = {PRICES[1] - PRICES[0]}</Hint>}
        {step.phase === 'done' && <Answer>{running} = {sumDetail(step.trades)}</Answer>}
      </Badges>
    </div>
  )
}

export default function BestTimeToBuyAndSellStockIiDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="累加所有上涨段"
      info={`prices = [${PRICES.join(', ')}]（题解示例 1），可交易任意多次，同一天也可先买后卖，求最大总利润。柱高按本示例最高价 ${MAX_P} 等比缩放，价格 0 也留一小截可见；6 天共 5 段相邻差价，加 init 与 done 恰好 7 步看完，因此沿用这个短示例。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '今天 i（正在评估的柱子）' },
        { color: TONE.easy, label: '上涨段：结算利润并入 totalProfit' },
        { color: TONE.hard, label: '下跌段：不交易' },
        { color: TONE.teal, label: '已收下的交易段' },
        { color: TONE.muted, label: '昨天 i-1 / 其余未处理' },
      ]}
    />
  )
}
