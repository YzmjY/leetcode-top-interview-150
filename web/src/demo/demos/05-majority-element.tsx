import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badges, Cell, Flag, Hint, Stat, TONE, type CellState } from './stage'

/* ------------------------------------------------------------------ */
/* 5. 多数元素 —— 模式 A：数组 + 指针（Boyer-Moore 摩尔投票）             */
/* ------------------------------------------------------------------ */

/**
 * 示例输入取自题解示例 2：nums = [2, 2, 1, 1, 1, 2, 2]，多数元素 2 出现 4 次 > 7/2。
 * 不用示例 1（[3, 2, 3]）：它只有 3 个元素，看不到「count 归零后重新推举候选人」这一关键分支。
 */
const INPUT = [2, 2, 1, 1, 1, 2, 2]

/** 单个元素的投票结果：赞成 / 反对 / count 归零时重选候选人 */
type Mark = 'match' | 'mismatch' | 'reset'

interface Step {
  /** 本步正在处理的下标；init 与 done 为 null */
  i: number | null
  /** 当前候选人；init 步还没有真正的人选，为 null */
  cand: number | null
  /** 净胜票数 */
  count: number
  /** 长度与 INPUT 相同，null = 尚未处理；用来把历史票型留在格子上 */
  marks: (Mark | null)[]
  phase: 'init' | Mark | 'done'
  /** 下一步动作（done 步没有） */
  hint?: string
  note: string
}

function buildSteps(): Step[] {
  const n = INPUT.length
  const marks = new Array<Mark | null>(n).fill(null)
  const steps: Step[] = []
  let cand: number | null = null
  let count = 0

  steps.push({
    i: null,
    cand,
    count,
    marks: marks.slice(),
    phase: 'init',
    note: `初始化：count = 0，candidate 取占位值 0（还没选出真正的人选，第一次比较之前就会被覆盖）。观察：count 记的不是候选人出现次数，而是净胜票数——赞成票 +1、反对票 −1。判断：只有 count > 0 时，当前候选人手里还有没被抵消的票。动作：从 nums[0] 开始逐个处理，每轮先看 count 是否为 0，再拿元素和 candidate 比较。`,
  })

  for (let i = 0; i < n; i++) {
    const v = INPUT[i]
    let phase: Mark
    let note: string

    if (count === 0) {
      cand = v
      count = 1
      phase = 'reset'
      note =
        i === 0
          ? `观察：nums[0] = ${v}，而 count = 0，此前没有任何票残留。判断：没有候选人可以比较，必须先把人选出来。动作：candidate = ${v}、count = 1，这是它最初的净胜票。`
          : `观察：nums[${i}] = ${v}，但 count 已经归零。判断：count == 0 必须在比较之前判断，否则会先执行 count-- 变成 −1；归零说明之前的票已经两两抵消殆尽。动作：重新推举 candidate = ${v}、count = 1——前缀抵消完之后，结果只由剩下的元素决定。`
    } else if (v === cand) {
      count += 1
      phase = 'match'
      note = `观察：nums[${i}] = ${v}，与 candidate = ${cand} 相同。判断：这是给候选人的一张赞成票，净胜票增加。动作：count = ${count - 1} + 1 = ${count}。`
    } else {
      const prev = count
      count -= 1
      phase = 'mismatch'
      note =
        count === 0
          ? `观察：nums[${i}] = ${v}，与 candidate = ${cand} 不同。判断：这张反对票抵消掉最后一张未抵消的支持票，前缀 [${INPUT.slice(0, i + 1).join(', ')}] 已经能两两抵消殆尽。动作：count = ${prev} − 1 = 0，候选人 ${cand} 随之失效。`
          : `观察：nums[${i}] = ${v}，与 candidate = ${cand} 不同。判断：这是给候选人的一张反对票，一个 ${v} 与一个 ${cand} 配对消去。动作：count = ${prev} − 1 = ${count}。`
    }

    marks[i] = phase
    steps.push({ i, cand, count, marks: marks.slice(), phase, note })
  }

  const total = INPUT.filter((x) => x === cand).length
  steps.push({
    i: null,
    cand,
    count,
    marks: marks.slice(),
    phase: 'done',
    note: `遍历结束，candidate = ${cand}，它手里还剩 ${count} 张净胜票。为什么正确：多数元素出现次数严格大于 n/2，其余元素全部拿来和它配对也消不完它，最后剩下的一定是它，所以题目保证存在时不需要第二遍校验。答案：${cand}——它在 nums 中出现 ${total} 次，${total} > ${n} / 2 = ${n / 2}。时间 O(n)、空间 O(1)。`,
  })

  /* 每步的「下一步」由紧随其后的那一步真实数据生成，保证提示就是下一步动作 */
  for (let k = 0; k < steps.length - 1; k++) {
    const next = steps[k + 1]
    if (next.phase === 'done') {
      steps[k].hint = `遍历到数组末尾，输出 candidate = ${next.cand} 作为答案`
    } else if (next.i !== null) {
      const j = next.i
      const v = INPUT[j]
      steps[k].hint =
        next.phase === 'reset'
          ? `处理 nums[${j}] = ${v}：count = 0，重新推举候选人为 ${v}`
          : `处理 nums[${j}] = ${v}：与 candidate = ${next.cand} 相比${next.phase === 'match' ? '相同，count + 1' : '不同，count − 1'}`
    }
  }

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

const MARK: Record<Mark, { state: CellState; text: string; color: string }> = {
  match: { state: 'ok', text: '+1', color: TONE.easy },
  mismatch: { state: 'bad', text: '−1', color: TONE.hard },
  reset: { state: 'warn', text: '重选', color: TONE.medium },
}

function Stage(step: Step) {
  const stateOf = (j: number): CellState => {
    if (j === step.i) return 'active'
    const m = step.marks[j]
    return m ? MARK[m].state : 'dim'
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 单元格行：旗标在格上、下标与票型在格下 */}
      <div className="flex flex-wrap justify-center gap-1.5">
        {INPUT.map((v, j) => {
          const m = step.marks[j]
          return (
            <div key={j} className="flex flex-col items-center">
              <Flag label={j === step.i ? 'i' : undefined} tone="amber" />
              <Cell state={stateOf(j)}>{v}</Cell>
              <span className="mt-1 font-code text-[11px] text-ink-soft">{j}</span>
              <span
                className="mt-1 h-4 font-code text-[10px] font-bold"
                style={m ? { color: MARK[m].color } : undefined}
              >
                {m ? MARK[m].text : ''}
              </span>
            </div>
          )
        })}
      </div>

      <Badges className="justify-center">
        <Stat label="candidate" value={step.cand === null ? '—' : step.cand} tone="medium" />
        <Stat
          label="count（净胜票数）"
          value={step.count}
          tone={step.count === 0 ? 'ink' : 'easy'}
        />
        {step.phase === 'done' ? (
          <Answer>多数元素 = {step.cand}</Answer>
        ) : step.hint ? (
          <Hint>{step.hint}</Hint>
        ) : null}
      </Badges>
    </div>
  )
}

export default function MajorityElementDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="摩尔投票：候选人 + 净胜票数"
      info={`输入：nums = [${INPUT.join(', ')}]，n = ${INPUT.length}（题解示例 2；示例 1 规模更小，但看不到 count 归零后重选候选人这一关键分支）。Boyer-Moore 投票只用 candidate 和 count 两个变量：与候选人相同则 count + 1，不同则 count − 1，count 归零就换候选人。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '当前处理的 nums[i]（旗标 i）' },
        { color: TONE.easy, label: '投赞成票：count + 1' },
        { color: TONE.hard, label: '投反对票：count − 1' },
        { color: TONE.medium, label: 'count 归零：重选候选人' },
        { color: TONE.muted, label: '尚未处理' },
      ]}
    />
  )
}
