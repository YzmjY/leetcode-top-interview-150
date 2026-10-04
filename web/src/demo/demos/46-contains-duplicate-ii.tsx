import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badges, Cell, Flag, Hint, Stat, TONE, type CellState } from './stage'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/* 46. 存在重复元素 II —— 模式 A：数组 + 指针（滑窗 + 哈希表区间块变体） */
/* ------------------------------------------------------------------ */

const NUMS = [1, 0, 1, 1]
const K = 1
/** 数组里出现过的不同数值，用于固定展示哈希表 lastIndex 的条目 */
const KEYS = Array.from(new Set(NUMS))

type Phase = 'init' | 'miss' | 'evict' | 'update' | 'hit' | 'done'

interface Step {
  i: number
  /** 数值 → 最近一次出现的下标 */
  lastIndex: Record<number, number>
  /** 当前元素的上一次出现下标；从未出现过为 −1 */
  prev: number
  /** i − prev；无可比较的上一次出现为 null */
  dist: number | null
  /** 命中位置对（下标小的在前）；未命中为 null */
  answer: [number, number] | null
  /** 本步被逐出窗口、从表中删掉的旧下标（无则 −1） */
  evicted: number
  /** 窗口左端 max(0, i − k)；i < 0 时为 −1（窗口尚未存在） */
  winFrom: number
  phase: Phase
  note: string
}

function buildSteps(): Step[] {
  const steps: Step[] = []
  const lastIndex: Record<number, number> = {}

  /**
   * 记录一步快照。调用前 i / lastIndex 已处于该步应有的状态；
   * winFrom 由本步下标推出，prev / dist / evicted 由调用方给出。
   */
  const push = (
    phase: Phase,
    i: number,
    extra: Partial<Pick<Step, 'prev' | 'dist' | 'answer' | 'evicted'>>,
    note: string
  ) => {
    steps.push({
      i,
      lastIndex: { ...lastIndex },
      prev: extra.prev ?? -1,
      dist: extra.dist ?? null,
      answer: extra.answer ?? null,
      evicted: extra.evicted ?? -1,
      winFrom: i < 0 ? -1 : Math.max(0, i - K),
      phase,
      note,
    })
  }

  push(
    'init',
    -1,
    {},
    `初始化：哈希表 lastIndex 记录「每个数值最近一次出现的下标」，初始为空，k = ${K} 表示只有下标差 ≤ ${K} 的两个相等元素才满足条件。青色区间 [max(0, i − k), i] 标出仍可能与当前元素配对的下标范围；但表只按数值覆盖写入、不随窗口推进而收缩，最坏情况下存下所有不同数值，空间 O(n)。`
  )

  for (let i = 0; i < NUMS.length; i++) {
    const value = NUMS[i]
    const hasPrev = Object.prototype.hasOwnProperty.call(lastIndex, value)
    const prev = hasPrev ? lastIndex[value] : -1
    const dist = hasPrev ? i - prev : null
    const winFrom = Math.max(0, i - K)
    const stale = hasPrev && prev < winFrom

    if (hasPrev && dist !== null && dist <= K) {
      // 命中：本题示例 2 在下标 3 命中，此处返回 true 并结束
      push(
        'hit',
        i,
        { prev, dist, answer: [prev, i] },
        `观察：读到 nums[${i}] = ${value}，表中 lastIndex[${value}] = ${prev}，上一次出现就在窗口内。判断：下标差 ${i} − ${prev} = ${dist} ≤ k = ${K}，等号成立也算满足，这对下标合法。`
      )
      break
    }

    if (hasPrev && dist !== null && dist > K) {
      if (stale) {
        // 旧下标已离开窗口：先逐出，再用当前下标覆盖
        delete lastIndex[value]
        lastIndex[value] = i
        push(
          'evict',
          i,
          { prev, dist, evicted: prev },
          `观察：读到 nums[${i}] = ${value}，表中 lastIndex[${value}] = ${prev}，它已经落在窗口 [${winFrom}, ${i}] 之外。判断：下标差 ${i} − ${prev} = ${dist} > k = ${K}，这一对不满足条件。动作：把过期记录 ${prev} 逐出表，再记下 lastIndex[${value}] = ${i}。为什么：更早的出现只会离得更远，最近一次都超限，就说明当前元素配不出合法下标对。`
        )
      } else {
        lastIndex[value] = i
        push(
          'update',
          i,
          { prev, dist },
          `观察：读到 nums[${i}] = ${value}，表中 lastIndex[${value}] = ${prev}，上次出现还没出窗口。判断：下标差 ${i} − ${prev} = ${dist} > k = ${K}，这一对超出距离限制。动作：不返回，把 ${value} 的最近位置更新为 ${i}。为什么：对后面的元素来说 ${i} 才是更近的一次出现，旧下标 ${prev} 已无价值，必须覆盖。`
        )
      }
      continue
    }

    lastIndex[value] = i
    push(
      'miss',
      i,
      {},
      `观察：读到 nums[${i}] = ${value}，lastIndex 里没有 ${value} 这条记录。判断：此前从未出现过 ${value}，不可能和任何更早的元素构成合法下标对。动作：直接写入 lastIndex[${value}] = ${i}。为什么要记下来：它本身可能是后面某个相同数值的合法搭档。`
    )
  }

  const found = steps[steps.length - 1].answer
  push(
    'done',
    NUMS.length,
    { answer: found },
    found
      ? `扫描在第 ${found[1]} 个下标处提前结束，返回 true：nums[${found[0]}] = nums[${found[1]}] = ${NUMS[found[1]]}，下标差 ${found[1] - found[0]} ≤ k = ${K}。若继续扫完，后面也不会改变结论。复杂度：每个下标只做常数次哈希查找与写入，时间 O(n)；表里每个数值只留最新一条记录，最坏情况下存下所有不同数值，空间 O(n)。`
      : `扫描结束，整个数组中没有下标差 ≤ k = ${K} 的相等元素对，返回 false。复杂度：一趟遍历、每次常数次哈希操作，时间 O(n)；空间 O(n)（每个不同数值至多一条记录）。`
  )
  return steps
}

/* ---------------- 舞台渲染 ---------------- */

/** 左对齐状态标与网格共用同一套列宽，靠 flex-1 + min-w-0 对齐 */
const GUTTER = 'px-[3px]'

function nextAction(step: Step): string {
  if (step.phase === 'init') return `i 移到 0，读入 ${NUMS[0]}，查表无记录后写入`
  if (step.phase === 'hit') return `返回 true：合法下标对 [${step.answer?.join(', ')}]`
  if (step.i + 1 < NUMS.length) {
    const nv = NUMS[step.i + 1]
    const np = step.lastIndex[nv]
    if (np === undefined) return `i 移到 ${step.i + 1}，读入 ${nv}，查表无记录后写入`
    if (step.i + 1 - np <= K) return `i 移到 ${step.i + 1}，读入 ${nv}，与上次位置 ${np} 比较`
    return `i 移到 ${step.i + 1}，读入 ${nv}，发现上次位置 ${np} 已出窗口才逐出`
  }
  return 'i 越界，返回 false'
}

function Stage(step: Step) {
  const n = NUMS.length
  const done = step.phase === 'done'
  const started = step.phase !== 'init'
  const winTo = done ? -1 : step.i
  const hasWindow = !done && step.winFrom >= 0 && winTo >= step.winFrom
  const inWindow = (j: number) => hasWindow && j >= step.winFrom && j <= winTo
  /** 答案的两个下标（done 步把它们标绿） */
  const pair = step.answer
  const hint = nextAction(step)

  const stateOf = (j: number): CellState => {
    if (done) return pair && (j === pair[0] || j === pair[1]) ? 'ok' : 'dim'
    if (j === step.i) return step.phase === 'hit' ? 'ok' : 'active'
    if (step.phase === 'hit' && j === step.prev) return 'ok'
    if (inWindow(j)) return 'new'
    return 'dim'
  }

  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col items-center gap-4">
      {/* 数组：指针旗标在格上、窗口区间块整体包住 [i − k, i] */}
      <div className="w-full">
        <div className="flex w-full">
          <div className="w-16 shrink-0" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            {/* 逐出标：颜色之外再给文字，让「旧下标离开窗口」不只靠颜色表达 */}
            <div className="flex h-5 w-full">
              <div className="w-16 shrink-0" aria-hidden="true" />
              <div className="relative min-w-0 flex-1">
                {step.evicted >= 0 && (
                  <span
                    className="fade-up absolute top-0 -translate-x-1/2 whitespace-nowrap font-code text-[10px] font-bold text-[hsl(var(--medium))]"
                    style={{ left: `${((step.evicted + 0.5) / n) * 100}%` }}
                  >
                    逐出旧下标 {step.evicted}
                  </span>
                )}
              </div>
            </div>

            {/* 指针旗标：当前 i 与上一次出现同格时上下并排 */}
            <div className="flex h-12 w-full">
              {NUMS.map((_, j) => (
                <div key={j} className={cn('flex min-w-0 flex-1 flex-col items-center justify-end', GUTTER)}>
                  {!done && j === step.prev && step.prev >= 0 && <Flag label={`上次 ${step.prev}`} tone="teal" />}
                  {!done && j === step.i && <Flag label={`i = ${step.i}`} tone={step.phase === 'hit' ? 'easy' : 'amber'} />}
                </div>
              ))}
            </div>

            <div className="relative flex w-full">
              {hasWindow && (
                <div
                  className="demo-bar pointer-events-none absolute -inset-y-1 rounded-lg border-[1.5px] bg-[hsl(var(--teal))]/10 transition-all duration-300"
                  style={{
                    left: `${(step.winFrom / n) * 100}%`,
                    width: `${((winTo - step.winFrom + 1) / n) * 100}%`,
                  }}
                />
              )}
              {NUMS.map((v, j) => (
                <div key={j} className={cn('flex min-w-0 flex-1 justify-center', GUTTER)}>
                  <Cell state={stateOf(j)} className="w-full min-w-0 sm:min-w-0">
                    {v}
                  </Cell>
                </div>
              ))}
            </div>

            {/* 状态标 + 下标：颜色之外再给文字标签，不靠颜色区分状态 */}
            <div className="mt-0.5 flex h-4 w-full">
              {NUMS.map((_, j) => (
                <div key={j} className={cn('flex min-w-0 flex-1 justify-center', GUTTER)}>
                  {!done && j === step.i && step.phase !== 'hit' && (
                    <span className="whitespace-nowrap font-code text-[10px] font-bold text-[hsl(var(--amber))]">当前</span>
                  )}
                  {!done && (j === step.i || j === step.prev) && step.phase === 'hit' && (
                    <span className="whitespace-nowrap font-code text-[10px] font-bold text-[hsl(var(--easy))]">命中</span>
                  )}
                  {!done && step.phase !== 'hit' && inWindow(j) && j !== step.i && (
                    <span className="whitespace-nowrap font-code text-[10px] font-bold text-[hsl(var(--teal))]">窗口内</span>
                  )}
                  {done && pair && (j === pair[0] || j === pair[1]) && (
                    <span className="whitespace-nowrap font-code text-[10px] font-bold text-[hsl(var(--easy))]">已确认</span>
                  )}
                </div>
              ))}
            </div>
            <div className="flex w-full">
              {NUMS.map((_, j) => (
                <span key={j} className={cn('min-w-0 flex-1 text-center font-code text-[11px] text-ink-soft', GUTTER)}>
                  {j}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* lastIndex：数值 → 最近一次出现的下标 */}
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <span className="text-[11px] text-ink-soft">lastIndex 数值 → 最近下标</span>
        {KEYS.map((key) => {
          const pos = step.lastIndex[key]
          const isMatch = !!pair && pos !== undefined && (pos === pair[0] || pos === pair[1])
          const removing = step.evicted >= 0 && step.i >= 0 && NUMS[step.i] === key
          const current = started && !done && step.i >= 0 && NUMS[step.i] === key
          return (
            <span
              key={key}
              className={cn(
                'rounded-md border px-2 py-0.5 font-code text-[11px] font-semibold',
                isMatch
                  ? 'border-[hsl(var(--easy))]/40 bg-[hsl(var(--easy-soft))] text-[hsl(var(--easy))]'
                  : removing
                    ? 'border-dashed border-[hsl(var(--medium))]/60 bg-card text-ink-soft'
                    : current
                      ? 'border-[hsl(var(--amber))]/50 bg-[hsl(var(--amber-soft))] text-[hsl(var(--amber))]'
                      : 'border-border bg-card text-ink-soft'
              )}
            >
              {key} →{' '}
              {removing ? (
                <>
                  <span className="line-through">{step.evicted}</span> → {pos === undefined ? '—' : pos}
                </>
              ) : pos === undefined ? (
                '—'
              ) : (
                pos
              )}
            </span>
          )
        })}
      </div>

      <Badges className="justify-center">
        <Stat
          label="滑动窗口"
          value={step.winFrom < 0 ? '—' : `[${step.winFrom}, ${winTo}]`}
          tone="teal"
        />
        <Stat label="下标差上限 k" value={K} tone="ink" />
        <Stat label="当前下标差" value={step.dist === null ? '—' : step.dist} tone="amber" />
        {!done && <Hint tone={step.phase === 'miss' ? 'teal' : 'amber'}>{hint}</Hint>}
        {done && pair && (
          <Answer>
            true：nums[{pair[0]}] = nums[{pair[1]}] = {NUMS[pair[1]]}，下标差 {pair[1] - pair[0]} ≤ k = {K}
          </Answer>
        )}
        {done && !pair && <Answer>false：全数组没有下标差 ≤ k = {K} 的相等元素对</Answer>}
      </Badges>
    </div>
  )
}

export default function ContainsDuplicateIiDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="滑窗 + 哈希表判定距离 ≤ k 的重复"
      info={`nums = [${NUMS.join(', ')}]，k = ${K}（示例 2，答案 true）。示例 2 是「有代表性且规模最小」的用例：它同时包含查表未命中的首次出现、同一数值再次出现且旧记录已出窗口时把它逐出并更新、以及距离恰为 k 的命中，因此只演示到命中就提前结束、不再扫完整个数组。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '当前扫描的元素 i（格下「当前」）' },
        { color: TONE.teal, label: '滑动窗口 [max(0, i−k), i] 区间块（格下「窗口内」）' },
        { color: TONE.easy, label: '命中：下标差 ≤ k 的下标对（格下「命中」/「已确认」）' },
        { color: TONE.medium, label: '逐出：离开窗口、从 lastIndex 删除的旧下标（格上「逐出旧下标 N」）' },
        { color: TONE.muted, label: '窗口外、尚未处理 / 已排除' },
      ]}
    />
  )
}
