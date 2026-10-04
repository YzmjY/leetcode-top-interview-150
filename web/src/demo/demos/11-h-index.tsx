import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badge, Badges, Cell, Flag, Hint, Stat, TONE, type CellState } from './stage'

/* ------------------------------------------------------------------ */
/* 11. H 指数 —— 模式 A：降序单元格行 + 逐格比较 citations[i] ≥ i+1       */
/* ------------------------------------------------------------------ */

/** 固定的示例输入：题解示例 1，n = 5，且同时出现「取等成立」与「下一步失败」两种边界。 */
const INPUT = [3, 0, 6, 1, 5]

interface Step {
  /** 降序排序后的引用次数快照（不可变） */
  sorted: number[]
  /** 本步正在比较的下标 i（0 起，1 起候选 h = i + 1）；init / done 为 null */
  cmp: number | null
  /** 目前已经确认可行的最大 h */
  h: number
  phase: 'init' | 'ok' | 'fail' | 'done'
  note: string
}

function buildSteps(): Step[] {
  const sorted = INPUT.slice().sort((a, b) => b - a)
  const n = sorted.length
  const steps: Step[] = []
  let h = 0

  steps.push({
    sorted: sorted.slice(),
    cmp: null,
    h,
    phase: 'init',
    note: `初始化：citations 一共 n = ${n} 篇论文，先按引用次数降序排序得到 [${sorted.join(', ')}]。观察：h 指数要求「至少 h 篇论文每篇至少被引用 h 次」，降序后前 k 篇正是引用次数最多的 k 篇。判断：只要第 k 篇（前 k 篇里引用最少的一篇）满足 citations[k-1] ≥ k，就确实存在 k 篇论文各自被引用至少 k 次。动作：从 k = 1 起逐格比较 citations[k-1] 与 k，把满足条件的最大 k 记为 h。`,
  })

  for (let i = 0; i < n; i++) {
    const need = i + 1
    const cur = sorted[i]
    if (cur >= need) {
      h = need
      const tie =
        cur === need
          ? ` 注意这里是取等：${cur} = ${need}，「至少 h 篇」和「每篇至少 h 次」用的是同一个 h，取等同样成立。`
          : ''
      steps.push({
        sorted: sorted.slice(),
        cmp: i,
        h,
        phase: 'ok',
        note: `观察：降序第 ${need} 篇（i = ${i}）有 citations[${i}] = ${cur} 次引用，本步要判定 h 能否取 ${need}。判断：${cur} ≥ ${need} 成立，前 ${need} 篇的引用数都不少于 ${need}，h = ${need} 可行。${tie}动作：h 暂记为 ${need}，i 右移到 ${i + 1} 继续试探更大的值 —— 要找的是最大的可行 h。`,
      })
    } else {
      const reach = sorted.filter((v) => v >= need).length
      steps.push({
        sorted: sorted.slice(),
        cmp: i,
        h,
        phase: 'fail',
        note: `观察：降序第 ${need} 篇（i = ${i}）的引用数是 citations[${i}] = ${cur}，本步要判定 h 能否取 ${need}。判断：${cur} ≥ ${need} 不成立，引用数 ≥ ${need} 的只有前 ${reach} 篇（${sorted.slice(0, reach).join('、')}），凑不出 ${need} 篇，h = ${need} 不可行。动作：数组已降序，往后每篇的引用数只会更小，h ≥ ${need} 全部不可能，立即停止扫描，h 取上一个可行值 ${h}。`,
      })
      break
    }
  }

  steps.push({
    sorted: sorted.slice(),
    cmp: null,
    h,
    phase: 'done',
    note: `扫描结束：h = ${h}，即降序前 ${h} 篇 [${sorted.slice(0, h).join(', ')}] 每篇至少被引用 ${h} 次，其余 ${n - h} 篇（${sorted.slice(h).join('、')}）都少于 ${h} 次。这与题解示例 1 的输出 3 一致；本演示用的是题解分析里的朴素做法（降序排序 + 一次线性扫描），时间 O(n log n) 加上 O(n) 扫描，额外空间 O(1)，题解主解法改用计数排序，把它降到 O(n) 时间、O(n) 空间。`,
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

function Stage(step: Step) {
  const n = step.sorted.length
  const cur = step.cmp

  const cellState = (k: number): CellState => {
    if (step.phase === 'init') return 'idle'
    if (step.phase === 'done') return k < step.h ? 'ok' : 'dim'
    if (cur !== null && k === cur) return step.phase === 'fail' ? 'bad' : 'active'
    if (k < step.h) return 'ok'
    return 'dim'
  }

  /** 格下的文字标签：状态不靠颜色单独区分 */
  const tagOf = (k: number): { text: string; color: string } | null => {
    if (step.phase === 'init') return null
    if (step.phase === 'done') {
      return k < step.h
        ? { text: k === step.h - 1 ? `h = ${step.h}` : '满足', color: TONE.easy }
        : { text: '未满足', color: TONE.muted }
    }
    if (cur !== null && k === cur) {
      return step.phase === 'fail'
        ? { text: '不成立', color: TONE.hard }
        : { text: '满足', color: TONE.amber }
    }
    if (k < step.h) return { text: '满足', color: TONE.easy }
    return { text: '未比较', color: TONE.muted }
  }

  /** 旗标文字与颜色：状态不靠颜色单独区分 */
  const flagOf = (k: number): { label?: string; tone: 'amber' | 'hard' | 'easy' } => {
    if (step.phase === 'init') return { tone: 'amber' }
    if (step.phase === 'done') {
      return step.h > 0 && k === step.h - 1 ? { label: 'h', tone: 'easy' } : { tone: 'easy' }
    }
    if (cur !== null && k === cur) {
      return step.phase === 'fail' ? { label: 'i', tone: 'hard' } : { label: 'i', tone: 'amber' }
    }
    return { tone: 'amber' }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex w-full flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] text-ink-soft">
        <span>citations 降序排列：格内是引用次数，格下 [i] 是下标，第 k 篇即前 k 篇里引用最少的一篇</span>
        <span className="font-code">n = {n}</span>
      </div>

      {/* 单元格行：旗标在格上、下标在格下 */}
      <div
        className="grid w-full gap-1.5"
        style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
      >
        {step.sorted.map((v, k) => {
          const flag = flagOf(k)
          const tag = tagOf(k)
          return (
            <div key={k} className="flex flex-col items-center">
              <Flag label={flag.label} tone={flag.tone} />
              <Cell state={cellState(k)} className="w-full min-w-0">
                {v}
              </Cell>
              <span className="mt-1 font-code text-[11px] text-ink-soft">[{k}]</span>
              <span
                className="mt-0.5 h-4 font-code text-[10px] font-bold"
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
            <Stat label="论文数 n" value={n} />
            <Stat label="当前 h" value={step.h} tone="amber" />
            <Hint>
              从 i = 0 开始，比较 citations[0] = {step.sorted[0]} 是否 ≥ 1
            </Hint>
          </>
        )}

        {(step.phase === 'ok' || step.phase === 'fail') && cur !== null && (
          <>
            <Stat label={`i = ${cur} · citations[i]`} value={step.sorted[cur]} tone="amber" />
            <Stat
              label="比较 citations[i] ≥ i+1"
              value={`${step.sorted[cur]} ≥ ${cur + 1} ${step.phase === 'ok' ? '✓' : '✗'}`}
              tone={step.phase === 'ok' ? 'easy' : 'hard'}
            />
            {step.phase === 'ok' && <Stat label="当前 h" value={step.h} tone="easy" />}
            {step.phase === 'ok' ? (
              <Hint>
                {cur + 1 < n
                  ? `i 右移到 ${cur + 1}，比较 citations[${cur + 1}] = ${step.sorted[cur + 1]} ≥ ${cur + 2}`
                  : '已比较完最后一篇，给出答案'}
              </Hint>
            ) : (
              <Hint tone="hard">给出结论：h = {step.h}</Hint>
            )}
          </>
        )}

        {step.phase === 'done' && (
          <>
            <Stat label="H 指数 h" value={step.h} tone="easy" />
            <Answer>
              h = {step.h}：降序前 {step.h} 篇 [{step.sorted.slice(0, step.h).join(', ')}] 每篇至少被引用{' '}
              {step.h} 次
            </Answer>
            <Badge>时间 O(n log n) · 额外空间 O(1)</Badge>
          </>
        )}
      </Badges>
    </div>
  )
}

export default function HIndexDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="降序扫描求 H 指数"
      info={`输入：citations = [${INPUT.join(', ')}]（题解示例 1），输出 3。做法是题解分析里的朴素解法：先降序排序，再逐格判断 citations[i] ≥ i+1，取最大的可行 h（时间 O(n log n)；题解的计数排序把它优化到 O(n)）。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '当前比较的 citations[i]' },
        { color: TONE.easy, label: '已满足：构成长度 h 的前缀' },
        { color: TONE.hard, label: '条件不成立，扫描在此停止' },
        { color: TONE.muted, label: '未比较 / 未满足' },
      ]}
    />
  )
}
