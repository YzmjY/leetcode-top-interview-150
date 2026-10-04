import { Fragment, useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badge, Badges, Cell, Flag, Hint, Stat, TONE, type CellState } from './stage'

/* ------------------------------------------------------------------ */
/* 113. 环形子数组的最大和 —— 模式 H：一维 DP（行 = 三条滚动量 + 依赖箭头）*/
/* ------------------------------------------------------------------ */

/** 固定示例输入：题解示例 2（nums = [5,-3,5]，输出 10，答案来自跨界情形②） */
const NUMS = [5, -3, 5]
const N = NUMS.length
const IDXS = Array.from({ length: N }, (_, i) => i)

interface Step {
  phase: 'init' | 'step' | 'check' | 'done'
  /** 本步读入的元素下标；init 步为 0 */
  idx: number
  /** 前缀和 total[i] = nums[0] + … + nums[i] */
  sum: number[]
  /** 最大 Kadane：接上一格还是从当前元素重开 */
  maxJoined: boolean
  maxEnd: number[]
  maxBest: number[]
  /** 最小 Kadane：同一条流水线，比较方向相反 */
  minJoined: boolean
  minEnd: number[]
  minBest: number[]
  /** 情况①的最优窗口 */
  maxWindow: [number, number]
  /** 情况②中被挖掉的最小窗口 */
  minWindow: [number, number]
  /** total == minSoFar，情形②退化成空子数组 */
  degenerate: boolean
  /** 最终答案窗口（环形下标序列，按环上的先后顺序） */
  winIdx: number[]
  answer: number | null
  note: string
  /** 下一步动作：由后一个快照统一回填，供 Hint 使用 */
  next: string
}

function buildSteps(): Step[] {
  const nums = NUMS
  const steps: Step[] = []

  const sum: number[] = [nums[0]]
  const maxEnd: number[] = [nums[0]]
  const maxBest: number[] = [nums[0]]
  const minEnd: number[] = [nums[0]]
  const minBest: number[] = [nums[0]]
  const round = (v: number) => Math.round(v * 1e6) / 1e6

  let totalSum = nums[0]
  let maxHere = nums[0]
  let maxSoFar = nums[0]
  let maxStart = 0
  let minHere = nums[0]
  let minSoFar = nums[0]
  let minStart = 0

  const snap = (
    phase: Step['phase'],
    idx: number,
    extra: Partial<Step> & { note: string }
  ) => {
    steps.push({
      phase,
      idx,
      sum: sum.slice(),
      maxJoined: true,
      maxEnd: maxEnd.slice(),
      maxBest: maxBest.slice(),
      minJoined: true,
      minEnd: minEnd.slice(),
      minBest: minBest.slice(),
      maxWindow: [maxStart, idx],
      minWindow: [minStart, idx],
      degenerate: false,
      winIdx: IDXS.slice(),
      answer: null,
      next: '',
      ...extra,
    })
  }

  snap('init', 0, {
    note: `观察：nums = [${nums.join(', ')}] 首尾相接，环形子数组只有两种形态——不越过边界，或者首尾相连绕过一次边界。判断：前者就是普通的最大子数组和 maxSoFar，后者等价于「total 减去中间被挖掉的那一段」，所以要同时维护最大与最小两条 Kadane。动作：total、maxEndingHere、maxSoFar、minEndingHere、minSoFar 全部以 nums[0] = ${nums[0]} 起头，要求非空所以最小值也不能用 0 初始化。为什么：一次遍历就能把两条线一起推进，时间 O(n)、额外空间 O(1)。`,
  })

  for (let i = 1; i < N; i++) {
    const x = nums[i]
    totalSum = round(totalSum + x)

    const maxExtend = round(maxHere + x)
    const maxDecided = maxExtend > x
    if (maxDecided) maxHere = maxExtend
    else {
      maxHere = x
      maxStart = i
    }
    if (maxHere > maxSoFar) maxSoFar = maxHere

    const minExtend = round(minHere + x)
    const minDecided = minExtend < x
    if (minDecided) minHere = minExtend
    else {
      minHere = x
      minStart = i
    }
    if (minHere < minSoFar) minSoFar = minHere

    sum.push(totalSum)
    maxEnd.push(maxHere)
    maxBest.push(maxSoFar)
    minEnd.push(minHere)
    minBest.push(minSoFar)

    snap('step', i, {
      maxJoined: maxDecided,
      minJoined: minDecided,
      note: `观察：读入 nums[${i}] = ${x}，前缀和 total 累加到 ${totalSum}。判断：最大 Kadane 在「接续上一格 ${maxExtend}」与「从当前元素重开 ${x}」之间取大，最小 Kadane 把方向反过来，在接续 ${minExtend} 与重开 ${x} 之间取小。动作：maxEndingHere = ${maxHere}、minEndingHere = ${minHere}，并各自刷新历史最优 maxSoFar = ${maxSoFar}、minSoFar = ${minSoFar}。为什么：最大线回答「不跨界」的情形①，最小线是情形②「total 减去被挖掉的一段」的依据。`,
    })
  }

  const degenerate = totalSum === minSoFar
  const circ = round(totalSum - minSoFar)
  const answer = degenerate ? maxSoFar : Math.max(maxSoFar, circ)
  const maxWin = ARR(maxStart, maxHere)
  const minWin = ARR(minStart, minHere)
  /** 情形②的环形窗口：挖掉最小窗口后剩下的首尾两段（按环上的先后顺序） */
  const circWin = [...IDXS.filter((i) => i > minHere), ...IDXS.filter((i) => i < minStart)]
  const winIdx = degenerate ? maxWin : maxSoFar >= circ ? maxWin : circWin

  snap('check', N - 1, {
    minWindow: [minStart, minHere],
    maxWindow: [maxStart, maxHere],
    degenerate,
    note: `观察：扫描结束，total = ${totalSum}，minSoFar = ${minSoFar}，两者${degenerate ? '相等' : '不等'}。判断：情形②的候选是 total − minSoFar = ${circ}，它成立的前提是「被挖掉的中间一段非空」；只有 total == minSoFar（整段数组本身就是最小子数组）时它才退化成空子数组而不合法。动作：${degenerate ? `判定退化，情形②作废，答案直接取 maxSoFar = ${answer}` : `判定候选合法，接着比较 maxSoFar = ${maxSoFar} 与 ${circ}`}。为什么：判断依据是 total == minSoFar，不能只按「数组全为负数」来理解——[-3,1,-3] 这类整段和最小的数组同样会触发。`,
  })

  const caseMax = maxSoFar >= circ
  snap('done', N - 1, {
    minWindow: [minStart, minHere],
    maxWindow: [maxStart, maxHere],
    degenerate,
    winIdx,
    answer,
    note: degenerate
      ? `观察：total = minSoFar = ${totalSum}，整段数组就是最小子数组，情形②算出的 ${circ} 只对应空子数组。判断：它不合法，而任何真子数组的和都大于整段的和。动作：答案 = maxSoFar = ${answer}，例如全负数 [-3,-2,-3] 得到 -2。为什么：一次遍历同时维护两条 Kadane，时间 O(n)、空间 O(1)。`
      : `观察：情况①不跨界 = maxSoFar = ${maxSoFar}（窗口 nums[${maxWin[0]}..${maxWin[1]}]），情况②跨界 = total − minSoFar = ${totalSum} − (${minSoFar}) = ${circ}。判断：${caseMax ? `① 不小于 ②，取中间那段` : `② 大于 ①（${circ} > ${maxSoFar}），取首尾拼接`}。动作：答案 = max(${maxSoFar}, ${circ}) = ${answer}${caseMax ? '' : `，它由 nums[${circWin.join('}] + nums[')}] 首尾绕环拼成，绕环时跳过被挖掉的最小窗口 nums[${minWin[0]}..${minWin[1]}]`}。为什么：两类形态互斥且完备，合并取优不漏解；一次遍历维护两条 Kadane，时间 O(n)、空间 O(1)。`,
  })

  // 「下一步动作」由后一个快照统一回填，保证 Hint 描述的是真正的下一步
  steps.forEach((s, k) => {
    const b = steps[k + 1]
    if (!b) return
    if (b.phase === 'step') s.next = `i 右移到 ${b.idx}，同一轮推进最大与最小两条 Kadane`
    else if (b.phase === 'check') s.next = '检查 total == minSoFar 的退化分支，再汇总两个候选值'
    else s.next = '取两者较大值作为答案'
  })

  return steps
}

/** 闭区间下标序列（升序） */
function ARR(l: number, r: number): number[] {
  const out: number[] = []
  for (let i = l; i <= r; i++) out.push(i)
  return out
}

/* ---------------- 舞台渲染 ---------------- */

function Stage(step: Step) {
  const active = step.idx
  const inWin = (i: number) => step.phase === 'done' && step.winIdx.indexOf(i) >= 0

  const maxEndHere = step.maxEnd[active]
  const minEndHere = step.minEnd[active]
  const maxBestHere = step.maxBest[active]
  const minBestHere = step.minBest[active]
  const circ =
    step.phase === 'check' || step.phase === 'done' ? Math.round((step.sum[active] - minBestHere) * 1e6) / 1e6 : null
  const winText = step.winIdx.map((i) => NUMS[i]).join(' + ')

  /** 格下文字：状态不只靠颜色区分（接续/重开、最优、未处理、答案窗口） */
  const tagOf = (row: number, i: number): { text: string; color: string } => {
    if (step.phase === 'init')
      return i === 0
        ? { text: `${NUMS[0]} 起手`, color: row === 2 ? TONE.medium : TONE.amber }
        : { text: '未处理', color: TONE.muted }
    if (step.phase === 'done')
      return inWin(i) ? { text: '答案窗口', color: TONE.easy } : { text: '已排除', color: TONE.muted }
    if (i === active) {
      const joined = row === 1 ? step.maxJoined : step.minJoined
      const v = row === 1 ? step.maxEnd[i] : step.minEnd[i]
      return {
        text: `${joined ? '接续' : '重开'} ${v}`,
        color: joined ? (row === 1 ? TONE.amber : TONE.medium) : TONE.teal,
      }
    }
    if (i > active) return { text: '未处理', color: TONE.muted }
    if (row === 0) return { text: `total ${step.sum[i]}`, color: TONE.water }
    if (row === 1) return { text: `最优 ${step.maxBest[i]}`, color: TONE.easy }
    return { text: `最优 ${step.minBest[i]}`, color: TONE.medium }
  }

  const rowMeta = [
    { label: 'total[i] 前缀和', sub: '第 i 项为止的总和', tone: TONE.water },
    { label: '① 最大 Kadane', sub: 'maxEndingHere 取大 → maxSoFar', tone: TONE.amber },
    { label: '② 最小 Kadane', sub: 'minEndingHere 取小 → minSoFar', tone: TONE.medium },
  ]

  return (
    <div className="flex flex-col items-center gap-3">
      {/* 一个网格承载指针行、下标行与三条滚动量：列宽一致，指针正好落在对应格上方 */}
      <div
        className="grid w-full gap-x-2 gap-y-1"
        style={{ gridTemplateColumns: `15% repeat(${N}, minmax(0, 1fr))` }}
      >
        {/* 指针行：i 是已读入的当前元素，next 是下一个待读入的元素 */}
        <span aria-hidden />
        {IDXS.map((i) => (
          <div key={`ptr-${i}`} className="flex h-7 flex-col items-center justify-end">
            {step.phase !== 'done' && i === active && (
              <Flag label="i" tone="amber" />
            )}
            {step.phase !== 'done' && i === active + 1 && (
              <Flag label="next" tone="teal" />
            )}
          </div>
        ))}

        {/* 下标行：状态不靠颜色区分，格下同时有文字说明 */}
        <span className="flex items-end justify-end pr-1 font-code text-[10px] text-ink-soft">nums</span>
        {IDXS.map((i) => (
          <div key={`idx-${i}`} className="flex h-4 items-center justify-center">
            <span
              className={
                step.phase !== 'done' && i === active
                  ? 'font-code text-[11px] font-bold text-[hsl(var(--amber))]'
                  : 'font-code text-[11px] text-ink-soft'
              }
            >
              {i}
            </span>
          </div>
        ))}

        {/* 三条滚动量各一行：行名在左，格内是当前值，格下是状态文字 */}
        {rowMeta.map((meta, row) => (
          <Fragment key={meta.label}>
            <span className="flex flex-col justify-center pr-1 text-right leading-tight">
              <span className="font-code text-[10px] font-bold sm:text-[11px]" style={{ color: meta.tone }}>
                {meta.label}
              </span>
              <span className="text-[9px] text-ink-soft">{meta.sub}</span>
            </span>
            {(row === 0 ? step.sum : row === 1 ? step.maxEnd : step.minEnd).map((v, i) => {
              const state: CellState =
                step.phase === 'init'
                  ? i === 0
                    ? 'active'
                    : 'dim'
                  : inWin(i)
                    ? 'ok'
                    : step.phase === 'done'
                      ? 'dim'
                      : i === active
                        ? 'active'
                        : i > active
                          ? 'dim'
                          : row === 2
                            ? step.minEnd[i] === step.minBest[i]
                              ? 'warn'
                              : 'idle'
                            : row === 1
                              ? step.maxEnd[i] === step.maxBest[i]
                                ? 'ok'
                                : 'idle'
                              : 'idle'
              const tag = tagOf(row, i)
              return (
                <div key={i} className="flex min-w-0 flex-col items-center gap-0.5">
                  <Cell size="sm" state={state} className="w-full min-w-0 sm:min-w-0">
                    {v}
                  </Cell>
                  <span
                    className="whitespace-nowrap font-code text-[9px] font-semibold sm:text-[10px]"
                    style={{ color: tag.color }}
                  >
                    {tag.text}
                  </span>
                </div>
              )
            })}
          </Fragment>
        ))}
      </div>

      {/* 状态徽章：当前值 / 候选值 / 下一步动作 / 答案 */}
      <Badges className="justify-center">
        {step.phase === 'init' ? (
          <>
            <Stat label="totalSum" value={step.sum[0]} tone="water" />
            <Stat label="maxSoFar ①" value={step.maxBest[0]} tone="easy" />
            <Stat label="minSoFar" value={step.minBest[0]} tone="medium" />
          </>
        ) : (
          <>
            <Stat label="totalSum" value={step.sum[active]} tone="water" />
            <Stat label="maxSoFar ①" value={maxBestHere} tone="easy" />
            <Stat label="minSoFar" value={minBestHere} tone="medium" />
            {circ !== null && <Stat label="total − minSoFar ②" value={circ} tone="teal" />}
            <Stat label={`maxEndingHere i=${active}`} value={maxEndHere} tone="amber" />
            <Stat label={`minEndingHere i=${active}`} value={minEndHere} tone="medium" />
          </>
        )}
        {step.phase === 'check' && (
          <Badge tone={step.degenerate ? 'hard' : 'easy'}>
            total {step.degenerate ? '==' : '≠'} minSoFar：情形②{step.degenerate ? '退化为空子数组，作废' : '合法，可参与比较'}
          </Badge>
        )}
        {step.phase === 'done' && (
          <>
            <Answer>
              <b className="font-code">{step.answer}</b>
              {step.degenerate ? (
                <>（total == minSoFar，情形②作废，取 maxSoFar）</>
              ) : (
                <> = max({maxBestHere}, {circ})</>
              )}
            </Answer>
            <Badge>窗口 nums[{step.winIdx.join(', ')}] = {winText}</Badge>
            <Badge>一次遍历 · 时间 O(n) · 空间 O(1)</Badge>
          </>
        )}
        {step.phase !== 'done' && <Hint>{step.next}</Hint>}
      </Badges>
    </div>
  )
}

export default function MaximumSumCircularSubarrayDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="环形数组：最大 Kadane 与最小 Kadane 同步推进"
      info={`输入：nums = [${NUMS.join(', ')}]（题解示例 2，输出 10）。环形子数组只有两种形态：不跨越边界的情形① = maxSoFar，跨越边界的情形② = total − minSoFar，答案取两者较大值。若 total == minSoFar（整段数组本身就是最小子数组，例如全负数 [-3,-2,-3]），情形②只对应空子数组，必须改取 maxSoFar。共 ${steps.length} 步：原地不动 1 步 + 逐元素推进 ${steps.length - 3} 步 + 退化检查 1 步 + 结论 1 步。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '当前读入的元素 i / 最大 Kadane 正在追踪' },
        { color: TONE.teal, label: '当前格重开窗口 / 情形②候选值' },
        { color: TONE.easy, label: '已确定的最优值（maxSoFar、答案窗口，偏绿）' },
        { color: TONE.medium, label: '最小 Kadane 与它挖掉的那一段（情形②被排除）' },
        { color: TONE.muted, label: '尚未读入 / 最终落选' },
      ]}
    />
  )
}
