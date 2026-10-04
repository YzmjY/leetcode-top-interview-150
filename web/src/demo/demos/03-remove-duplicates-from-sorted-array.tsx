import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badges, Cell, Flag, Hint, Stat, TONE, type CellState } from './stage'

/* ------------------------------------------------------------------ */
/* 3. 删除有序数组中的重复项 —— 模式 A：数组 + 快慢指针                  */
/* ------------------------------------------------------------------ */

const NUMS = [0, 0, 1, 1, 1, 2, 2, 3, 3, 4]

interface Step {
  nums: number[]
  slow: number
  fast: number | null
  phase: 'init' | 'unique' | 'dup' | 'done'
  note: string
}

function buildSteps(): Step[] {
  const nums = NUMS.slice()
  const n = nums.length
  const steps: Step[] = []
  let slow = 0

  steps.push({
    nums: nums.slice(), slow, fast: 1, phase: 'init',
    note: `初始化：slow = 0 指向已保留前缀的末尾（当前唯一值 nums[0] = ${nums[0]}），fast 从下标 1 开始向后扫描。数组非严格递增，所以相同的值必然相邻，只要和「已保留的最后一个值」比较就能判定重复。`,
  })

  for (let fast = 1; fast < n; fast++) {
    const cur = nums[fast]
    const last = nums[slow]
    if (cur !== last) {
      slow++
      nums[slow] = cur
      steps.push({
        nums: nums.slice(), slow, fast, phase: 'unique',
        note: `观察：nums[${fast}] = ${cur} 与已保留的最后一个值 ${last} 不相等。判断：前缀中的值都不大于 ${last}，而 ${cur} 比 ${last} 大，所以它是从未出现过的新值。动作：slow 右移到 ${slow}，把 ${cur} 写入 nums[${slow}]，此时 nums[0..${slow}] 就是目前的全部唯一值。`,
      })
    } else {
      steps.push({
        nums: nums.slice(), slow, fast, phase: 'dup',
        note: `观察：nums[${fast}] = ${cur} 与 nums[slow = ${slow}] = ${last} 相等。判断：${cur} 与已保留的最后一个唯一值相同，说明这个值已经出现在前缀里，是重复项。动作：跳过，slow 不动。`,
      })
    }
  }

  const k = slow + 1
  steps.push({
    nums: nums.slice(), slow, fast: null, phase: 'done',
    note: `fast 越界，扫描结束。slow 始终停在最后一个唯一值上，所以唯一元素个数 k = slow + 1 = ${k}，即 nums 的前 ${k} 位 [${nums.slice(0, k).join(', ')}]。下标 ≥ ${k} 属于废弃区，内容与结果无关。时间 O(n)，只用了两个下标，空间 O(1)。`,
  })
  return steps
}

/* ---------------- 舞台渲染 ---------------- */

function Stage(step: Step) {
  const k = step.slow + 1
  const prefix = `[${step.nums.slice(0, k).join(', ')}]`

  const stateOf = (i: number): CellState => {
    if (step.phase === 'done') return i <= step.slow ? 'ok' : 'dim'
    if (i === step.fast) return step.phase === 'dup' ? 'bad' : 'active'
    if (step.phase === 'unique' && i === step.slow) return 'new'
    if (i <= step.slow) return 'ok'
    return 'dim'
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 单元格行：旗标在格上、下标在格下 */}
      <div className="flex flex-wrap justify-center gap-1.5">
        {step.nums.map((v, i) => (
          <div key={i} className="flex flex-col items-center">
            <Flag
              label={i === step.slow ? 'slow' : i === step.fast ? 'fast' : undefined}
              tone={i === step.slow ? 'easy' : step.phase === 'dup' ? 'hard' : 'amber'}
            />
            <Cell state={stateOf(i)}>{v}</Cell>
            <span className="mt-1 font-code text-[11px] text-ink-soft">{i}</span>
          </div>
        ))}
      </div>

      <Badges className="justify-center">
        <Stat label="唯一元素数 k" value={k} tone="easy" />
        <Stat label="结果前缀" value={prefix} tone="easy" />
        {step.phase === 'unique' && (
          <Hint>fast 右移，继续与 nums[slow] = {step.nums[step.slow]} 比较</Hint>
        )}
        {step.phase === 'dup' && <Hint tone="hard">重复项，fast 右移，slow 不动</Hint>}
        {step.phase === 'done' && (
          <Answer>
            k = {k}，nums 前 {k} 位 = {prefix}
          </Answer>
        )}
      </Badges>
    </div>
  )
}

export default function RemoveDuplicatesFromSortedArrayDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="快慢指针原地去重"
      info={`nums = [${NUMS.join(', ')}]（非严格递增），原地删除重复项并返回唯一元素个数 k。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: 'fast：当前扫描' },
        { color: TONE.teal, label: '刚写入的唯一值' },
        { color: TONE.easy, label: '已确定的唯一区（含 slow）' },
        { color: TONE.muted, label: '未处理 / 废弃区' },
      ]}
    />
  )
}
