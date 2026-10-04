import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badges, Cell, Flag, Hint, Stat, TONE, type CellState } from './stage'

/* ------------------------------------------------------------------ */
/* 2. 移除元素 —— 模式 A：数组 + 快慢指针（slow 是写指针，fast 扫描）    */
/* ------------------------------------------------------------------ */

/** 固定的示例输入：题解示例 1（规模最小，且同时含「要移除」与「要保留」的元素） */
const NUMS = [3, 2, 2, 3]
const VAL = 3

interface Step {
  /** 本步数组快照（原地写入之后的状态） */
  nums: number[]
  /** 已保留元素个数，同时是下一个可写入的位置 */
  slow: number
  /** 本步扫描的下标；done 为 null */
  fast: number | null
  /** 本步真正写入的位置；跳过与结束时为 null */
  write: number | null
  /** 当前仍留在数组里、值等于 val 的位置（被跳过 / 被移除） */
  skipped: number[]
  phase: 'init' | 'keep' | 'skip' | 'done'
  note: string
}

function buildSteps(): Step[] {
  const nums = NUMS.slice()
  const n = nums.length
  const steps: Step[] = []
  const skipped = new Set<number>()
  let slow = 0

  steps.push({
    nums: nums.slice(), slow: 0, fast: 0, write: null, skipped: [],
    phase: 'init',
    note: `观察：nums = [${NUMS.join(', ')}]，val = ${VAL}，要原地删掉所有 ${VAL}。判断：slow = 0 指向下一个保留元素应当写入的位置，fast = 0 从左到右逐个扫描。不变量：扫描过的元素里保留下来的都按原相对顺序放在 nums[0..slow-1]，个数恰好是 slow，所以写入永远不会碰到还没扫描的数据。`,
  })

  for (let fast = 0; fast < n; fast++) {
    const cur = nums[fast]
    if (cur === VAL) {
      skipped.add(fast)
      steps.push({
        nums: nums.slice(), slow, fast, write: null,
        skipped: [...skipped].sort((a, b) => a - b),
        phase: 'skip',
        note: `观察：nums[${fast}] = ${cur}，与 val = ${VAL} 相等。判断：这个元素必须移除，不能进入有效前缀。动作：slow 停在 ${slow} 不动，fast 右移。为什么：位置 ${slow} 空出来，留给后面第一个需要保留的元素覆盖。`,
      })
    } else {
      const w = slow
      nums[slow] = cur
      slow++
      skipped.delete(w)
      steps.push({
        nums: nums.slice(), slow, fast, write: w,
        skipped: [...skipped].sort((a, b) => a - b),
        phase: 'keep',
        note: `观察：nums[${fast}] = ${cur}，与 val = ${VAL} 不相等。判断：它是要保留的元素，应当写进有效前缀的下一个空位。动作：nums[${w}] = ${cur}，slow 右移到 ${slow}。为什么：${
          w < fast
            ? `位置 ${w} 是已经扫描过的，覆盖它不会丢掉还没检查的数据。`
            : `此时 ${w} 就是 fast 本身，属于自赋值，数组内容不变。`
        }`,
      })
    }
  }

  const kept = nums.slice(0, slow)
  steps.push({
    nums: nums.slice(), slow, fast: null, write: null,
    skipped: [...skipped].sort((a, b) => a - b),
    phase: 'done',
    note: `观察：fast 越界，扫描结束。判断：slow 恰好是保留下来的元素个数 k = ${slow}，nums 前 ${slow} 位 [${kept.join(', ')}] 全部不等于 ${VAL}。动作：返回 k = ${slow}；下标 ≥ ${slow} 的内容属于废弃区，不计入结果。为什么：fast 只把数组走了一遍，时间 O(n)；全程只用 slow、fast 两个下标，空间 O(1)。`,
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

function Stage(step: Step) {
  const n = step.nums.length
  const f = step.fast
  const isDone = step.phase === 'done'
  const atLast = f !== null && f === n - 1
  const prefix = step.slow > 0 ? `[${step.nums.slice(0, step.slow).join(', ')}]` : '（空）'

  const stateOf = (i: number): CellState => {
    if (step.phase === 'init') return 'idle'
    if (step.skipped.includes(i)) return 'bad'
    if (isDone) return i < step.slow ? 'ok' : 'dim'
    if (i === f) return 'active'
    if (step.phase === 'keep' && i === step.write) return 'new'
    if (i < step.slow) return 'ok'
    return 'dim'
  }

  const hint = (() => {
    if (step.phase === 'init') return `从 nums[0] = ${step.nums[0]} 开始与 val = ${VAL} 比较`
    if (f === null) return null
    if (step.phase === 'skip') {
      return atLast
        ? `跳过 nums[${f}] = ${VAL}，fast 越界，结束扫描`
        : `fast 右移到 ${f + 1}，继续与 val = ${VAL} 比较`
    }
    return atLast
      ? `fast 越界，结束扫描并返回 k = ${step.slow}`
      : `fast 右移到 ${f + 1}，slow 停在 ${step.slow}`
  })()

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 单元格行：指针旗标在格上、下标在格下 */}
      <div className="flex flex-wrap justify-center gap-1.5">
        {step.nums.map((v, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="flex h-6 items-end justify-center gap-1">
              {i === f && <Flag label="fast" tone={step.phase === 'skip' ? 'hard' : 'amber'} />}
              {i === step.slow && <Flag label="slow" tone="easy" />}
            </div>
            <Cell state={stateOf(i)}>{v}</Cell>
            <span className="mt-1 font-code text-[11px] text-ink-soft">{i}</span>
          </div>
        ))}
      </div>

      <Badges className="justify-center">
        <Stat label="保留个数 k" value={step.slow} tone="easy" />
        <Stat label="有效前缀" value={prefix} tone="easy" />
        {hint && <Hint tone={step.phase === 'skip' ? 'hard' : 'teal'}>{hint}</Hint>}
        {isDone && (
          <Answer>
            k = {step.slow}，nums 前 {step.slow} 位 = {prefix}
          </Answer>
        )}
      </Badges>
    </div>
  )
}

export default function RemoveElementDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="快慢指针原地移除元素"
      info={`nums = [${NUMS.join(', ')}]，val = ${VAL}（题解示例 1：规模最小，且同时包含等于 val 与不等于 val 的元素）。原地移除所有 ${VAL} 并返回新长度 k。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: 'fast：当前扫描的元素' },
        { color: TONE.teal, label: '本步写入的位置' },
        { color: TONE.easy, label: '已保留的有效前缀（slow 左侧）' },
        { color: TONE.hard, label: '等于 val：跳过移除' },
        { color: TONE.muted, label: '未扫描 / 下标 ≥ k 的废弃区' },
      ]}
    />
  )
}
