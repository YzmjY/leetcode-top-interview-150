import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badge, Badges, Cell, Flag, Hint, Stat, TONE, type CellState } from './stage'

/* ------------------------------------------------------------------ */
/* 48. 汇总区间 —— 模式 A：数组 + 指针，连续段用半透明色块整体包住        */
/* ------------------------------------------------------------------ */

/** 固定示例输入（题解「示例 1」：nums = [0,1,2,4,5,7] → ["0->2","4->5","7"]） */
const NUMS = [0, 1, 2, 4, 5, 7]
const N = NUMS.length

type Phase = 'init' | 'start' | 'extend' | 'close' | 'done'

interface Step {
  phase: Phase
  /** 内层扫描下标 i：init 为 0，done 为 n */
  i: number
  /** 当前区间的起点下标；尚未开启区间时为 null */
  startIdx: number | null
  /** 当前区间的终点下标；尚未开启区间时为 null */
  endIdx: number | null
  /** 已经输出的区间字符串 */
  result: string[]
  note: string
  /** 下一步动作：由后一个快照统一回填，保证 Hint 说的确实是下一步 */
  next: string
}

function buildSteps(): Step[] {
  const steps: Step[] = []
  const result: string[] = []
  let i = 0

  const push = (phase: Phase, startIdx: number | null, endIdx: number | null, note: string) => {
    steps.push({ phase, i, startIdx, endIdx, result: result.slice(), note, next: '' })
  }

  push(
    'init',
    null,
    null,
    `观察：nums = [${NUMS.join(', ')}] 无重复且升序，i = 0，结果列表为空，还没有开启任何区间。判断：数组有序且无重复时，所有连续整数必然占据一段连续下标，所以不需要哈希表，只看相邻两元素是否相差 1 就够了。动作：外层循环用 i 指向区间起点，内层循环在 nums[i] == nums[i-1] + 1 时不断把 i 向后推。为什么：这样一趟线性扫描就能给出唯一且最小的区间划分。`
  )

  while (i < N) {
    const startIdx = i
    const start = NUMS[i]

    push(
      'start',
      startIdx,
      startIdx,
      `观察：外层循环开始，i = ${i} 指向 nums[${i}] = ${start}。判断：它是当前区间的起点，记 start = ${start}，区间暂时是 [${start}, ${start}]。动作：i 前移到 ${i + 1}，去和下一个元素比较。为什么：起点位置上的元素必然属于本区间，先把它纳入再向后比对。`
    )

    i += 1
    while (i < N && NUMS[i] === NUMS[i - 1] + 1) {
      push(
        'extend',
        startIdx,
        i,
        `观察：nums[${i}] = ${NUMS[i]} 与 nums[${i - 1}] + 1 = ${NUMS[i - 1] + 1} 相等。判断：这两个数在数轴上紧挨着，nums[${i}] 仍属于起点为 ${start} 的连续段。动作：右端点扩展为 ${NUMS[i]}，区间变成 [${start}, ${NUMS[i]}]，i 前移到 ${i + 1}。为什么：只有相邻两元素恰好相差 1，才能保证区间里的每个整数都真的在 nums 中。`
      )
      i += 1
    }

    const endIdx = i - 1
    const end = NUMS[endIdx]
    const text = start === end ? String(start) : `${start}->${end}`
    result.push(text)

    const observe =
      i >= N
        ? `观察：i = ${i} 已越过数组末尾（n = ${N}），没有下一个元素可以比较。`
        : `观察：nums[${i}] = ${NUMS[i]} 与 nums[${i - 1}] + 1 = ${NUMS[i - 1] + 1} 不相等。`
    const judge = `判断：连续性到此结束，本段的下标范围是 ${startIdx}..${endIdx}，终点 end = nums[${endIdx}] = ${end}。`
    const act =
      start === end
        ? `动作：start = end = ${start}，按单元素格式输出 "${text}"（不写箭头）并加入结果列表。`
        : `动作：start = ${start}、end = ${end}，两者不相等，按 "a->b" 格式输出 "${text}" 并加入结果列表。`
    const reason =
      i >= N
        ? `为什么：段尾必须取 nums[i − 1]，此刻 i 指向的是越界位置而不是元素。`
        : `为什么：区间端点只能取自 nums，${end + 1} 不在数组中，再往右扩就会覆盖不属于 nums 的数字。`

    push('close', startIdx, endIdx, `${observe}${judge}${act}${reason}`)
  }

  const list = `[${result.map((r) => `"${r}"`).join(', ')}]`
  push(
    'done',
    null,
    null,
    `观察：i 越过了数组末尾，外层循环结束，共得到 ${result.length} 个区间 ${list}。判断：它们恰好覆盖数组的全部 ${N} 个元素，并且每个区间内都不含不属于 nums 的数字。动作：答案就是 ${list}，按数组顺序读出即可。为什么：i 单调前进、每个元素只被内层循环检查一次，时间 O(n)；除结果本身外只用几个下标变量，额外空间 O(1)。`
  )

  // 「下一步动作」按后一个快照统一回填，保证 Hint 描述的是还没做的动作
  steps.forEach((s, k) => {
    const b = steps[k + 1]
    if (!b) return
    if (b.phase === 'start') {
      s.next = `外层循环开新区间：start = nums[${b.i}] = ${NUMS[b.i]}`
    } else if (b.phase === 'extend') {
      s.next = `比较 nums[${b.i}] = ${NUMS[b.i]} 与 nums[${b.i - 1}] + 1 = ${NUMS[b.i - 1] + 1}`
    } else if (b.phase === 'close') {
      s.next =
        b.i >= N
          ? `i = ${b.i} 已越过末尾，收尾当前区间`
          : `nums[${b.i}] = ${NUMS[b.i]} 与 nums[${b.i - 1}] + 1 = ${NUMS[b.i - 1] + 1} 不等，收尾并输出当前区间`
    } else {
      s.next = '没有剩余元素，按顺序读出结果列表'
    }
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

function Stage(step: Step) {
  const done = step.phase === 'done'
  /** 当前连续段的下标范围；未开启区间时为 −1 */
  const segL = done ? -1 : (step.startIdx ?? -1)
  const segR = done ? -1 : (step.endIdx ?? -1)
  const hasSeg = segL >= 0 && segR >= segL
  const start = step.startIdx === null ? null : NUMS[step.startIdx]
  const end = step.endIdx === null ? null : NUMS[step.endIdx]
  /** 本步因「相差不为 1」被挡在段外的那个元素；i 越界时为 null */
  const breakIdx = step.phase === 'close' && step.i < N ? step.i : null

  const stateOf = (k: number): CellState => {
    if (done) return 'ok'
    if (hasSeg && k >= segL && k <= segR) return k === step.i ? 'active' : 'ok'
    return 'dim'
  }

  return (
    <div className="mx-auto flex w-full max-w-[520px] flex-col items-center gap-3">
      <div className="w-full">
        {/* 指针旗标：start 与 i 同格时上下并排，i 靠在下面贴近单元格 */}
        <div className="flex h-12 w-full">
          {NUMS.map((_, k) => (
            <div key={k} className="flex min-w-0 flex-1 flex-col items-center justify-end px-[3px]">
              {!done && k === step.startIdx && <Flag label="start" tone="easy" />}
              {!done && k === step.i && <Flag label="i" tone="amber" />}
            </div>
          ))}
        </div>

        {/* 单元格行：当前连续段用半透明琥珀色块整体包住 */}
        <div className="relative flex w-full">
          {hasSeg && (
            <div
              className="demo-bar pointer-events-none absolute -inset-y-1 rounded-lg border-[1.5px] border-[hsl(var(--amber))]/50 bg-[hsl(var(--amber))]/15 transition-all duration-300"
              style={{
                left: `${(segL / N) * 100}%`,
                width: `${((segR - segL + 1) / N) * 100}%`,
              }}
            />
          )}
          {NUMS.map((v, k) => (
            <div key={k} className="flex min-w-0 flex-1 justify-center px-[3px]">
              <Cell state={stateOf(k)} className="w-full min-w-0 sm:min-w-0">
                {v}
              </Cell>
            </div>
          ))}
        </div>

        {/* 断点标：颜色之外再给文字，说明连续性为什么在此结束 */}
        <div className="mt-0.5 flex h-4 w-full">
          {NUMS.map((_, k) => (
            <div key={k} className="flex min-w-0 flex-1 justify-center px-[3px]">
              {k === breakIdx && (
                <span className="whitespace-nowrap font-code text-[10px] font-bold text-[hsl(var(--hard))]">
                  断开
                </span>
              )}
            </div>
          ))}
        </div>

        {/* 下标 */}
        <div className="mt-0.5 flex w-full">
          {NUMS.map((_, k) => (
            <span
              key={k}
              className="min-w-0 flex-1 px-[3px] text-center font-code text-[11px] text-ink-soft"
            >
              {k}
            </span>
          ))}
        </div>
      </div>

      {/* 输出：一行区间徽章 */}
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <span className="text-[11px] text-ink-soft">区间列表</span>
        {step.result.length === 0 ? (
          <span className="font-code text-[11px] text-ink-soft">（空）</span>
        ) : (
          step.result.map((r, k) => (
            <Badge key={k} tone="easy">
              <span className="font-code">"{r}"</span>
            </Badge>
          ))
        )}
      </div>

      <Badges className="justify-center">
        <Stat
          label="当前区间"
          value={start === null || end === null ? '—' : `[${start}, ${end}]`}
          tone="amber"
        />
        <Stat label="已输出区间" value={`${step.result.length} 个`} tone="easy" />
        {!done && step.next && <Hint>{step.next}</Hint>}
        {done && (
          <Answer>
            共 {step.result.length} 个区间：
            <span className="font-code">
              [{step.result.map((r) => `"${r}"`).join(', ')}]
            </span>
          </Answer>
        )}
      </Badges>
    </div>
  )
}

export default function SummaryRangesDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="一次遍历，把有序数组切成最小有序区间"
      info={`输入：nums = [${NUMS.join(', ')}]（题解示例 1，输出 ["0->2", "4->5", "7"]）。示例 1 是两道示例里规模较小、且同时含多元素区间与单元素区间的一个，因此直接用全部 ${N} 个元素完整演示，不做删减。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '主指针 i / 当前连续段的半透明色块' },
        { color: TONE.easy, label: 'start 旗标与已确认连续的单元格 / 已输出的区间' },
        { color: TONE.hard, label: '「断开」标：与段尾不相邻，是下一个区间的起点' },
        { color: TONE.muted, label: '本段之外：已划分完或尚未处理（灰底）' },
      ]}
    />
  )
}
