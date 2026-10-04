import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import {
  Answer,
  Badge,
  Badges,
  Cell,
  Flag,
  Hint,
  Stat,
  TONE,
  type CellState,
  type Tone,
} from './stage'

/* ------------------------------------------------------------------ */
/* 4. 删除有序数组中的重复项 II —— 模式 A：数组 + 快慢指针（每个值至多两次） */
/* ------------------------------------------------------------------ */

/**
 * 题解示例 2：[0,0,1,1,1,1,2,3,3] → 7。
 * 其中 1 连续出现 4 次，会连续触发两次「第 3 次及以后」的丢弃，
 * 且下标 6 之后基准取自刚写入的结果前缀，最能看清 slow-2 的含义。
 */
const NUMS = [0, 0, 1, 1, 1, 1, 2, 3, 3]
const N = NUMS.length
/** 每个值最多保留的次数 */
const LIMIT = 2

interface Step {
  /** 原地修改后的数组快照（前 slow 位是结果） */
  nums: number[]
  /** 已保留前缀长度，同时是下一个可写入的位置 */
  slow: number
  /** 本步扫描到的下标（done 为 null） */
  fast: number | null
  /** 本步比较基准的下标 slow-2（done 为 null） */
  ref: number | null
  phase: 'init' | 'keep' | 'drop' | 'done'
  note: string
}

function buildSteps(): Step[] {
  const nums = NUMS.slice()
  const steps: Step[] = []
  let slow = LIMIT

  steps.push({
    nums: nums.slice(), slow, fast: LIMIT, ref: slow - LIMIT, phase: 'init',
    note: `初始化：每个值最多保留 ${LIMIT} 个，所以前两位 [${nums.slice(0, LIMIT).join(', ')}] 无条件保留，slow = ${slow} 既是已保留长度、也是下一个可写入的位置，fast 从下标 ${LIMIT} 开始扫描。比较基准取结果前缀的倒数第二个元素 nums[slow-2]，初始为 nums[0] = ${nums[0]}：数组有序、同一值必然连续，前缀末尾只可能是一串相同的值，若 nums[fast] 与它相等，就说明这个值在前缀里已经占了两格，当前这份是第 3 次。这就是本题要和 nums[slow-2] 比、而不是和 nums[slow-1] 比的原因——前缀本身已经做到「每个值至多两次」，只有往前数第二格才能分辨「第 2 次」和「第 3 次」。`,
  })

  for (let fast = LIMIT; fast < N; fast++) {
    const cur = nums[fast]
    const refIdx = slow - LIMIT
    const ref = nums[refIdx]
    if (cur !== ref) {
      nums[slow] = cur
      slow++
      steps.push({
        nums: nums.slice(), slow, fast, ref: refIdx, phase: 'keep',
        note: `观察：nums[${fast}] = ${cur} 与基准 nums[slow-2] = nums[${refIdx}] = ${ref} 不相等。判断：前缀倒数第二格是 ${ref}，说明结果前缀里 ${cur} 最多只出现过一次，再收一份也不会超过两次。动作：写入 nums[${slow - 1}] = ${cur}，slow 右移到 ${slow}。`,
      })
    } else {
      steps.push({
        nums: nums.slice(), slow, fast, ref: refIdx, phase: 'drop',
        note: `观察：nums[${fast}] = ${cur} 与基准 nums[slow-2] = nums[${refIdx}] = ${ref} 相等。判断：前缀末尾的 nums[${refIdx}]、nums[${slow - 1}] 都是 ${cur}，该值在结果里已经占了两格，再收这一份就会超过两次。动作：丢弃 nums[${fast}]，slow 停在 ${slow}，fast 继续右移。`,
      })
    }
  }

  const k = slow
  steps.push({
    nums: nums.slice(), slow, fast: null, ref: null, phase: 'done',
    note: `fast 扫过下标 ${N - 1} 后越界，循环结束，slow 不再变化。返回长度 k = slow = ${k}，nums 的前 ${k} 位 [${nums.slice(0, k).join(', ')}] 就是结果，下标 ${k} 起的 [${nums.slice(k).join(', ')}] 属于可忽略的废弃区。fast 只遍历一遍数组、只用 slow 与 fast 两个下标，所以时间 O(n)、空间 O(1)。`,
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

/** 下一步动作（Hint 前缀「下一步：」由组件补上） */
function hintFor(step: Step, k: number): string {
  const baseIdx = k - LIMIT
  const baseVal = step.nums[baseIdx]

  if (step.phase === 'init') {
    return `比较 nums[${LIMIT}] = ${step.nums[LIMIT]} 与基准 nums[slow-2] = nums[${baseIdx}] = ${baseVal}`
  }
  if (step.fast === null || step.fast >= N - 1) {
    return `扫描到下标 ${N - 1} 结束，返回 k = slow = ${k}`
  }
  const next = step.fast + 1
  return step.phase === 'drop'
    ? `fast 右移到 ${next}，基准仍是 nums[slow-2] = nums[${baseIdx}] = ${baseVal}（slow 停在 ${k}）`
    : `fast 右移到 ${next}，比较 nums[${next}] = ${step.nums[next]} 与基准 nums[slow-2] = nums[${baseIdx}] = ${baseVal}`
}

function Stage(step: Step) {
  const k = step.slow
  const prefix = `[${step.nums.slice(0, k).join(', ')}]`
  const ignored = step.nums.slice(k)

  /** 单元格状态：本步刚写入 / 本步扫描 / 比较基准 / 已保留 / 待确定 */
  const stateOf = (i: number): CellState => {
    if (step.phase === 'done') return i < k ? 'ok' : 'dim'
    if (step.phase === 'keep' && i === k - 1) return 'new'
    if (i === step.fast) return step.phase === 'drop' ? 'bad' : 'active'
    if (i === step.ref) return 'warn'
    return i < k ? 'ok' : 'dim'
  }

  /**
   * 格上旗标：指针身份写在文字里，不靠颜色单独区分。
   * 每格最多标一个最短形式的指针（优先级与 stateOf 一致），
   * 避免 slow-2 / slow / fast 拼接成远超格宽的标签而压到相邻列；
   * 同格重叠的另一个指针位置由旁白与统计（slow 停在 k）说明。
   */
  const labelOf = (i: number): string | undefined => {
    if (i === step.fast) return 'fast'
    if (i === k) return 'slow'
    if (i === step.ref) return 'slow-2'
    return undefined
  }

  const toneOf = (i: number): Tone => {
    if (i === step.fast) return step.phase === 'drop' ? 'hard' : 'amber'
    if (i === k) return 'easy'
    if (i === step.ref) return 'medium'
    return 'ink'
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 单元格行：值在格内、下标在格下、指针旗标在格上 */}
      <div className="flex flex-wrap justify-center gap-1.5">
        {step.nums.map((v, i) => (
          <div key={i} className="flex flex-col items-center">
            <Flag label={labelOf(i)} tone={toneOf(i)} />
            <Cell state={stateOf(i)}>{v}</Cell>
            <span className="mt-1 font-code text-[11px] text-ink-soft">{i}</span>
          </div>
        ))}
      </div>

      <Badges className="justify-center">
        <Stat label="已保留 k = slow" value={k} tone="easy" />
        {step.phase === 'done' ? (
          <Stat label="忽略区" value={ignored.length > 0 ? `[${ignored.join(', ')}]` : '（空）'} />
        ) : (
          <Stat label="结果前缀" value={prefix} />
        )}
        {step.phase === 'done' ? (
          <>
            <Badge tone="ink">时间 O(n) · 空间 O(1)</Badge>
            <Answer>
              k = {k}，nums 前 {k} 位 = {prefix}
            </Answer>
          </>
        ) : (
          <Hint tone={step.phase === 'drop' ? 'hard' : 'teal'}>{hintFor(step, k)}</Hint>
        )}
      </Badges>
    </div>
  )
}

export default function RemoveDuplicatesFromSortedArrayIIDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="至多保留两次：与 nums[slow-2] 比较"
      info={`nums = [${NUMS.join(', ')}]（有序，题解示例 2），每个值最多保留 ${LIMIT} 个，返回新长度 k。示例 2 里 1 连续出现 4 次，会连续丢弃两次并能看到基准取自刚写入的结果前缀；示例 1 [1, 1, 1, 2, 2, 3] 只有一次丢弃、篇幅过短，故未采用。`}
      steps={steps}
      autoMs={1600}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: 'fast：本步扫描的元素' },
        { color: TONE.medium, label: 'slow-2：本步的比较基准' },
        { color: TONE.easy, label: 'slow / 已保留前缀' },
        { color: TONE.teal, label: '本步刚写入的格（teal 描边）' },
        { color: TONE.hard, label: '等于基准：第 3 次及以后，丢弃' },
      ]}
    />
  )
}
