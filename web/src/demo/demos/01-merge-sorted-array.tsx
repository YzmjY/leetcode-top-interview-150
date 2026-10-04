import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badges, Cell, Flag, Hint, Stat, TONE, type CellState } from './stage'

/* ------------------------------------------------------------------ */
/* 1. 合并两个有序数组 —— 模式 A：两个有序数组 + 三指针从后往前归并        */
/* ------------------------------------------------------------------ */

/** 题解示例 1：nums1 = [1,2,3,0,0,0], m = 3, nums2 = [2,5,6], n = 3 */
const NUMS1 = [1, 2, 3, 0, 0, 0]
const M = 3
const NUMS2 = [2, 5, 6]
const N = 3
const TOTAL = M + N

interface Step {
  /** nums1 当前内容（长度固定 m+n，尾部 0 是占位） */
  nums1: number[]
  nums2: number[]
  p1: number
  p2: number
  tail: number
  /** 本步刚写入的位置，null 表示本步没有写入 */
  write: number | null
  phase: 'init' | 'place' | 'copy' | 'done'
  note: string
}

function buildSteps(): Step[] {
  const nums1 = NUMS1.slice()
  const nums2 = NUMS2.slice()
  let p1 = M - 1
  let p2 = N - 1
  let tail = M + N - 1
  const steps: Step[] = []

  const base = () => ({ nums1: nums1.slice(), nums2: nums2.slice(), p1, p2, tail })

  steps.push({
    ...base(),
    write: null,
    phase: 'init',
    note: `初始化三个指针：p1 = m-1 = ${p1} 指向 nums1 有效部分的末尾，p2 = n-1 = ${p2} 指向 nums2 末尾，tail = m+n-1 = ${tail} 指向合并结果的末尾。注意 nums1 里下标 ${M}~${M + N - 1} 的 0 只是占位，它的实际有效长度是 m = ${M}。每一轮都把两个未处理前缀的末尾值中较大的那个写到 nums1[tail]；从后往前填的好处是已写好的位置不会再被读，因此不会覆盖 nums1 里还没比较的元素。`,
  })

  while (p1 >= 0 && p2 >= 0) {
    const v1 = nums1[p1]
    const v2 = nums2[p2]

    if (v1 > v2) {
      nums1[tail] = v1
      steps.push({
        ...base(),
        write: tail,
        phase: 'place',
        note: `观察：nums1[p1 = ${p1}] = ${v1}，nums2[p2 = ${p2}] = ${v2}，两者都还没处理。判断：两个前缀各自有序，最大值就在各自末尾，而 ${v1} > ${v2}，所以 ${v1} 是全部未处理元素中的最大值。动作：把 ${v1} 写到 nums1[${tail}]，p1 和 tail 一起左移，p1 变成 ${p1 - 1}。为什么不覆盖：tail 始终停在 p1 右侧，写入的一定是已腾空的位置。`,
      })
      p1--
    } else {
      nums1[tail] = v2
      const equal = v1 === v2
      steps.push({
        ...base(),
        write: tail,
        phase: 'place',
        note: equal
          ? `观察：nums1[p1 = ${p1}] = ${v1}，nums2[p2 = ${p2}] = ${v2}，两个待比较的值相等。判断：${v1} 同时是两个前缀的末尾值，是当前未处理的最大值，取哪一边都不破坏结果的有序性，这里取 nums2 的。动作：把 ${v1} 写到 nums1[${tail}]，p2 左移变成 ${p2 - 1}，tail 左移变成 ${tail - 1}。`
          : `观察：nums1[p1 = ${p1}] = ${v1}，nums2[p2 = ${p2}] = ${v2}。判断：${v2} ≥ ${v1}，所以 ${v2} 是全部未处理元素中的最大值，它该排在当前最靠后的空位。动作：把 ${v2} 写到 nums1[${tail}]，p2 左移变成 ${p2 - 1}，tail 左移变成 ${tail - 1}。`,
      })
      p2--
    }
    tail--
  }

  while (p2 >= 0) {
    const value = nums2[p2]
    nums1[tail] = value
    steps.push({
      ...base(),
      write: tail,
      phase: 'copy',
      note: `观察：p1 = ${p1} 已经小于 0，nums1 的有效部分全部用完了，而 nums2 里还剩 ${p2 + 1} 个元素没处理。判断：这些剩下的元素都不大于已经写好的部分，直接按原顺序前移即可。动作：把 nums2[${p2}] = ${value} 复制到 nums1[${tail}]，p2 和 tail 一起左移。`,
    })
    p2--
    tail--
  }

  steps.push({
    ...base(),
    write: null,
    phase: 'done',
    note: `p2 也小于 0，循环结束：取空一个数组就意味着所有元素都已定位。nums1 里剩下的下标 0~${tail} 若有元素，它们本来就在正确位置上，不需要搬动。最终 nums1 = [${nums1.join(', ')}]，每个元素只被写入一次，时间 O(m+n)，只有三个下标变量，空间 O(1)。`,
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

function Stage(step: Step) {
  const placing = step.phase === 'place' || step.phase === 'copy'
  const done = step.phase === 'done'

  /** 单元格状态：已就位 / 本步写入 / 两个候选 / 未处理，形态与颜色都给线索 */
  const stateOf = (i: number): CellState => {
    if (done) return i <= step.tail ? 'ok' : 'dim'
    if (placing && step.tail === i) return 'new'
    if (placing && i === step.p1 && i !== step.tail) return 'warn'
    return i <= step.tail ? 'idle' : 'dim'
  }

  /** 格上旗标：位置语义写在字母里，不靠颜色单独区分 */
  const flagsOf = (i: number): { label: string; tone: 'amber' | 'teal' | 'medium' }[] => {
    const flags: { label: string; tone: 'amber' | 'teal' | 'medium' }[] = []
    if (i === step.p1) flags.push({ label: 'p1', tone: 'amber' })
    if (i === step.p2) flags.push({ label: 'p2', tone: 'teal' })
    if (placing && step.tail === i) flags.push({ label: 'tail', tone: 'medium' })
    else if (done && step.tail === i) flags.push({ label: 'tail', tone: 'teal' })
    return flags
  }

  return (
    <div className="flex flex-col gap-4">
      {/* nums1：占位 0 全画出来，有效长度 m 由说明交代 */}
      <div className="flex flex-col gap-1">
        <span className="font-code text-[11px] font-bold text-ink-soft">
          nums1（m = {M} 个有效元素，尾部 {N} 个 0 是占位）
        </span>
        <div className="flex flex-wrap justify-center gap-1.5 pt-10">
          {step.nums1.map((v, i) => (
            <div key={i} className="flex flex-col items-center">
              {flagsOf(i).map((f) => (
                <Flag key={f.label} label={f.label} tone={f.tone} />
              ))}
              <Cell state={stateOf(i)} className="w-full min-w-0">
                {v}
              </Cell>
              <span className="mt-1 font-code text-[11px] text-ink-soft">{i}</span>
            </div>
          ))}
        </div>
      </div>

      {/* nums2：p2 越界后整行变灰，表示已取空 */}
      <div className="flex flex-col gap-1">
        <span className="font-code text-[11px] font-bold text-ink-soft">
          nums2（n = {N}，全部待归并）
        </span>
        <div className="flex flex-wrap justify-center gap-1.5 pt-4">
          {step.nums2.map((v, i) => (
            <div key={i} className="flex flex-col items-center">
              {i === step.p2 && <Flag label="p2" tone="teal" />}
              <Cell state={i <= step.p2 ? 'idle' : 'dim'} className="w-full min-w-0">
                {v}
              </Cell>
              <span className="mt-1 font-code text-[11px] text-ink-soft">{i}</span>
            </div>
          ))}
        </div>
      </div>

      <Badges className="justify-center">
        {step.phase === 'init' && (
          <>
            <Stat label="p1" value={step.p1} tone="amber" />
            <Stat label="p2" value={step.p2} tone="teal" />
            <Stat label="tail" value={step.tail} tone="medium" />
            <Hint>
              比较 nums1[{step.p1}] = {step.nums1[step.p1]} 与 nums2[{step.p2}] ={' '}
              {step.nums2[step.p2]}，大者写入 nums1[{step.tail}]
            </Hint>
          </>
        )}
        {step.phase === 'place' && (
          <>
            <Stat label="刚写入 nums1" value={step.write} tone="medium" />
            <Stat label="值" value={step.nums1[step.write!]} tone="easy" />
            {step.p1 >= 0 && step.p2 >= 0 ? (
              <Hint>
                下一个最大值写入 nums1[{step.tail}]：先比 nums1[{step.p1}] 与 nums2[{step.p2}]
              </Hint>
            ) : (
              <Hint tone="medium">
                比较轮结束，把 nums2 剩下的 {step.p2 + 1} 个元素依次搬进 nums1
              </Hint>
            )}
          </>
        )}
        {step.phase === 'copy' && (
          <>
            <Stat label="补齐自 nums2" value={`剩余 ${step.p2 + 1} 个`} tone="teal" />
            <Stat label="写入位置 tail" value={step.tail} tone="medium" />
            <Hint>把 nums2[{step.p2}] 搬到 nums1[{step.tail}]，两个指针一起左移</Hint>
          </>
        )}
        {step.phase === 'done' && (
          <>
            <Stat label="m + n" value={TOTAL} tone="easy" />
            <Answer>nums1 = [{step.nums1.join(', ')}]</Answer>
            <Hint tone="easy">已结束：时间 O(m+n) · 空间 O(1)</Hint>
          </>
        )}
      </Badges>
    </div>
  )
}

export default function MergeSortedArrayDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="逆向三指针归并两个有序数组"
      info={`输入取题解示例 1：nums1 = [${NUMS1.join(', ')}]，m = ${M}，nums2 = [${NUMS2.join(', ')}]，n = ${N}。nums1 尾部的 ${N} 个 0 是占位，实际有效元素只有前 m = ${M} 个；这里正好出现一次两值相等的情形（3 与 5 归位后 nums1[p1] = nums2[p2] = 2），示例 2 / 3 只有 1~2 步看不清归并过程，所以未采用。`}
      steps={steps}
      autoMs={1500}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: 'p1（及本步的主候选值）' },
        { color: TONE.teal, label: 'p2：nums2 侧候选' },
        { color: TONE.medium, label: 'tail：本步写入位置' },
        { color: TONE.easy, label: '已就位元素' },
        { color: TONE.muted, label: '未处理 / 占位' },
      ]}
    />
  )
}
