import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badges, Cell, Flag, Hint, Stat, TONE, type CellState } from './stage'

/* ------------------------------------------------------------------ */
/* 27. 两数之和 II - 输入有序数组 —— 模式 A：有序数组左右对撞双指针      */
/* sum 偏小则 left++、偏大则 right--，被丢掉的端点永久出局              */
/* ------------------------------------------------------------------ */

/** 固定示例：题解「示例 1」。示例 2、3 规模更小，但只会走 3 步，看不清逼近过程。 */
const NUMS = [2, 7, 11, 15]
const TARGET = 9

type Cmp = 'lt' | 'eq' | 'gt'

interface Step {
  /** 0-based，与题解代码的 left / right 一致；展示时统一换算成题面的 1-based 下标 */
  left: number
  right: number
  /** numbers[left] / numbers[right] / 两者之和 */
  a: number | null
  b: number | null
  sum: number | null
  cmp: Cmp | null
  /** 已被排除的 0-based 下标（划线展示） */
  excluded: number[]
  /** 本步刚被排除的 0-based 下标 */
  justExcluded: number | null
  /** 到本步为止的比较次数 */
  probes: number
  phase: 'init' | 'probe' | 'move' | 'hit' | 'done'
  note: string
}

/** 0-based 下标 → 题面要求的 1-based 下标 */
const P = (i: number) => i + 1

function buildSteps(): Step[] {
  const n = NUMS.length
  let left = 0
  let right = n - 1
  let probes = 0
  const excluded: number[] = []
  const steps: Step[] = []

  steps.push({
    left,
    right,
    a: null,
    b: null,
    sum: null,
    cmp: null,
    excluded: [],
    justExcluded: null,
    probes,
    phase: 'init',
    note: `初始化：numbers = [${NUMS.join(', ')}] 非递减，target = ${TARGET}。left 指向最小端 ${NUMS[0]}（下标 1），right 指向最大端 ${NUMS[n - 1]}（下标 ${n}）；题面下标从 1 开始，返回答案时也用 1-based。不变量：答案的两个下标始终落在区间 [left, right] 内。`,
  })

  while (left < right) {
    const a = NUMS[left]
    const b = NUMS[right]
    const sum = a + b
    const cmp: Cmp = sum === TARGET ? 'eq' : sum < TARGET ? 'lt' : 'gt'
    probes++

    steps.push({
      left,
      right,
      a,
      b,
      sum,
      cmp,
      excluded: excluded.slice(),
      justExcluded: null,
      probes,
      phase: cmp === 'eq' ? 'hit' : 'probe',
      note:
        cmp === 'eq'
          ? `观察：numbers[${P(left)}] + numbers[${P(right)}] = ${a} + ${b} = ${sum}。判断：和正好等于 target = ${TARGET}，命中唯一解。动作：两个指针都不再移动。为什么：题目保证答案唯一，找到即可换成 1-based 下标返回 [${P(left)}, ${P(right)}]。`
          : cmp === 'gt'
            ? `观察：numbers[${P(left)}] + numbers[${P(right)}] = ${a} + ${b} = ${sum}，比 target = ${TARGET} 大 ${sum - TARGET}。判断：和偏大，需要更小的和。动作：right 从 ${P(right)} 左移到 ${P(right) - 1}，最大端 ${b} 即将出局。为什么：数组非递减，只有把较大的那一端左移，和才会变小。`
            : `观察：numbers[${P(left)}] + numbers[${P(right)}] = ${a} + ${b} = ${sum}，比 target = ${TARGET} 小 ${TARGET - sum}。判断：和偏小，需要更大的和。动作：left 从 ${P(left)} 右移到 ${P(left) + 1}，最小端 ${a} 即将出局。为什么：数组非递减，只有把较小的那一端右移，和才会变大。`,
    })

    if (cmp === 'eq') break

    if (cmp === 'gt') {
      const dropped = right
      excluded.push(dropped)
      right--
      steps.push({
        left,
        right,
        a,
        b,
        sum,
        cmp,
        excluded: excluded.slice(),
        justExcluded: dropped,
        probes,
        phase: 'move',
        note: `观察：${b} 已从区间右端移出，搜索区间收缩为 [${P(left)}, ${P(right)}]。判断：被丢掉的 ${b} 不可能出现在任何可行组合里。动作：right 停在 ${P(right)}，下一轮用 ${a} + ${NUMS[right]} 重新求和。为什么：数组非递减，任何下标 k > ${P(left)} 都满足 numbers[k] ≥ numbers[${P(left)}] = ${a}，于是 numbers[k] + ${b} ≥ ${a} + ${b} = ${sum} > ${TARGET}，带上 ${b} 的组合一律偏大。`,
      })
    } else {
      const dropped = left
      excluded.push(dropped)
      left++
      steps.push({
        left,
        right,
        a,
        b,
        sum,
        cmp,
        excluded: excluded.slice(),
        justExcluded: dropped,
        probes,
        phase: 'move',
        note: `观察：${a} 已从区间左端移出，搜索区间收缩为 [${P(left)}, ${P(right)}]。判断：被丢掉的 ${a} 不可能出现在任何可行组合里。动作：left 停在 ${P(left)}，下一轮用 ${NUMS[left]} + ${b} 重新求和。为什么：数组非递减，任何下标 k < ${P(right)} 都满足 numbers[k] ≤ numbers[${P(right)}] = ${b}，于是 numbers[k] + ${a} ≤ ${a} + ${b} = ${sum} < ${TARGET}，带上 ${a} 的组合一律偏小。`,
      })
    }
  }

  steps.push({
    left,
    right,
    a: NUMS[left],
    b: NUMS[right],
    sum: NUMS[left] + NUMS[right],
    cmp: 'eq',
    excluded: excluded.slice(),
    justExcluded: null,
    probes,
    phase: 'done',
    note: `指针停在 [${P(left)}, ${P(right)}] 处命中：numbers[${P(left)}] + numbers[${P(right)}] = ${NUMS[left]} + ${NUMS[right]} = ${TARGET}，返回 1-based 下标 [${P(left)}, ${P(right)}]。全程只比较了 ${probes} 次；每轮至少移动一个指针，两指针合计移动不超过 n 次，所以时间 O(n)、额外空间 O(1)。`,
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

function Stage(step: Step) {
  const { left, right, phase } = step

  const stateOf = (i: number): CellState => {
    if (phase === 'hit' || phase === 'done') return i === left || i === right ? 'ok' : 'dim'
    if (i === left) return 'active'
    if (i === right) return 'new'
    if (step.excluded.includes(i)) return 'dim'
    return 'idle'
  }

  const sumText =
    step.sum === null || step.a === null || step.b === null
      ? '—'
      : `${step.a} + ${step.b} = ${step.sum}`

  const cmpText =
    step.cmp === null || step.sum === null
      ? '—'
      : step.cmp === 'eq'
        ? `相等 ${step.sum} = ${TARGET}`
        : step.cmp === 'gt'
          ? `偏大 ${step.sum} > ${TARGET}`
          : `偏小 ${step.sum} < ${TARGET}`

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 单元格行：旗标在格上、1-based 下标在格下 */}
      <div className="flex flex-wrap justify-center gap-1.5">
        {NUMS.map((v, i) => (
          <div key={i} className="flex flex-col items-center">
            <Flag
              label={i === left ? 'L' : i === right ? 'R' : undefined}
              tone={i === left ? 'amber' : 'teal'}
            />
            <Cell state={stateOf(i)}>
              {step.excluded.includes(i) ? <span className="line-through">{v}</span> : v}
            </Cell>
            <span className="mt-1 font-code text-[11px] text-ink-soft">{P(i)}</span>
          </div>
        ))}
      </div>

      <Badges className="justify-center">
        {phase === 'init' && (
          <>
            <Stat label="区间 [L, R]" value={`[${P(left)}, ${P(right)}]`} tone="teal" />
            <Stat label="target" value={TARGET} />
            <Hint>
              计算两端之和 numbers[{P(left)}] + numbers[{P(right)}] = {NUMS[left]} + {NUMS[right]}
            </Hint>
          </>
        )}

        {phase === 'probe' && (
          <>
            <Stat
              label="当前和"
              value={sumText}
              tone={step.cmp === 'gt' ? 'medium' : 'amber'}
            />
            <Stat
              label="比较 target"
              value={cmpText}
              tone={step.cmp === 'gt' ? 'medium' : 'amber'}
            />
            {step.cmp === 'gt' ? (
              <Hint tone="medium">
                right 左移到第 {right} 个元素（{NUMS[right - 1]}），用更小的数重新求和
              </Hint>
            ) : (
              <Hint tone="medium">
                left 右移到第 {P(left + 1)} 个元素（{NUMS[left + 1]}），用更大的数重新求和
              </Hint>
            )}
          </>
        )}

        {phase === 'move' && (
          <>
            {step.justExcluded !== null && (
              <Stat
                label="已排除"
                value={`numbers[${P(step.justExcluded)}] = ${NUMS[step.justExcluded]}`}
                tone="muted"
              />
            )}
            <Stat label="区间 [L, R]" value={`[${P(left)}, ${P(right)}]`} tone="teal" />
            <Hint>
              重算两端之和 numbers[{P(left)}] + numbers[{P(right)}] = {NUMS[left]} + {NUMS[right]}
            </Hint>
          </>
        )}

        {phase === 'hit' && (
          <>
            <Stat label="当前和" value={sumText} tone="easy" />
            <Stat label="比较 target" value={cmpText} tone="easy" />
            <Hint tone="easy">
              结束循环，按 1-based 返回 [{P(left)}, {P(right)}]
            </Hint>
          </>
        )}

        {phase === 'done' && (
          <>
            <Stat label="比较次数" value={step.probes} />
            <Stat label="区间 [L, R]" value={`[${P(left)}, ${P(right)}]`} tone="easy" />
            <Answer>
              <span className="font-code">
                numbers[{P(left)}] + numbers[{P(right)}]
              </span>
              {' = '}
              <span className="font-code">
                {NUMS[left]} + {NUMS[right]} = {TARGET}
              </span>
              {`，返回 `}
              <span className="font-code">
                [{P(left)}, {P(right)}]
              </span>
            </Answer>
          </>
        )}
      </Badges>
    </div>
  )
}

export default function TwoSumIiInputArrayIsSortedDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="有序数组左右对撞双指针"
      info={`numbers = [${NUMS.join(', ')}]（非递减），target = ${TARGET} —— 取自题解示例 1；示例 2、3 只会走 3 步，看不清逼近过程。格下数字为题面的 1-based 下标（代码里 left / right 从 0 与 n-1 出发，返回时各 +1）。灰色划线格子表示已被排除的元素。`}
      steps={steps}
      autoMs={1500}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: 'L：left 指针（较小端）' },
        { color: TONE.teal, label: 'R：right 指针（较大端）' },
        { color: TONE.easy, label: '命中 target 的两个数' },
        { color: TONE.muted, label: '已排除的元素（划线）' },
      ]}
    />
  )
}
