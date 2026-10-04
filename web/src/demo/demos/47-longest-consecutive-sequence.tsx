import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badges, Cell, Flag, Hint, Stat, TONE, type CellState, type Tone } from './stage'

/* ------------------------------------------------------------------ */
/* 47. 最长连续序列 —— 模式 A：数组行 + 哈希集合行（参照 03 / 31）        */
/* 只从「没有前驱」的数开始向右延伸，链长用徽章显示并刷新 longest          */
/* ------------------------------------------------------------------ */

/** 题解示例 1：nums = [100, 4, 200, 1, 3, 2]，输出 4，最长序列 [1, 2, 3, 4] */
const NUMS = [100, 4, 200, 1, 3, 2]

/** 每个值首次出现的下标：数组行用它标出当前 num 的来源 */
const FIRST = new Map<number, number>()
NUMS.forEach((v, i) => {
  if (!FIRST.has(v)) FIRST.set(v, i)
})

/** 集合行的显示顺序：按值升序，只为看清连续性，不参与算法 */
const SET_ROW = Array.from(new Set(NUMS)).sort((a, b) => a - b)

/** 遍历顺序：不同值按首次出现的先后（Go 的 map 遍历顺序未定义，这里固定下来便于逐步观察） */
const ORDER = NUMS.filter((v, i) => FIRST.get(v) === i)

interface Step {
  /** 原数组快照（只读） */
  nums: number[]
  /** 当前 num 在数组中首次出现的下标；init / done 为 −1 */
  arrIdx: number
  /** 当前处理的 num；init / done 为 null */
  cur: number | null
  /** 正在查询的值；init / done 为 null */
  probe: number | null
  /** 该查询是「num − 1」（判起点）还是「num + 1」（向右延伸） */
  probeKind: 'prev' | 'next' | null
  /** 该查询是否命中集合 */
  probeIn: boolean
  /** 当前正在延伸的链（done 时是最长链） */
  run: number[]
  /** 当前链长 */
  len: number
  /** 历史最长 */
  longest: number
  /** 本步是否刷新了 longest */
  improved: boolean
  /** 已处理完的不同值 */
  visited: number[]
  /** 下一个待处理的不同值，没有则为 null */
  nextNum: number | null
  phase: 'init' | 'skip' | 'start' | 'extend' | 'close' | 'done'
  note: string
}

function buildSteps(): Step[] {
  const steps: Step[] = []
  const set = new Set(NUMS)
  const visited = new Set<number>()
  let longest = 0
  let bestRun: number[] = []

  const push = (s: Omit<Step, 'nums'>) => {
    steps.push({ nums: NUMS.slice(), ...s })
  }

  push({
    arrIdx: -1, cur: null, probe: null, probeKind: null, probeIn: false,
    run: [], len: 0, longest, improved: false, visited: [],
    nextNum: ORDER[0], phase: 'init',
    note: `观察：nums = [${NUMS.join(', ')}] 放进哈希集合后是 {${SET_ROW.join(', ')}}，共 ${SET_ROW.length} 个不同值，判断「某个数在不在」只要 O(1)。判断：只有 num − 1 不在集合里的 num 才是某段连续序列的起点。动作：longest 置 0，按不同值逐个取 num，先查 num − 1。为什么：只从起点向右延伸，每个数最多被展开一次，总工作量 O(m) ≤ O(n)。`,
  })

  ORDER.forEach((num, k) => {
    visited.add(num)
    const arrIdx = FIRST.get(num) ?? 0
    const nextNum = k + 1 < ORDER.length ? ORDER[k + 1] : null

    if (set.has(num - 1)) {
      push({
        arrIdx, cur: num, probe: num - 1, probeKind: 'prev', probeIn: true,
        run: [], len: 0, longest, improved: false, visited: Array.from(visited),
        nextNum, phase: 'skip',
        note: `观察：num = ${num}，查询 num − 1 = ${num - 1}，它就在集合里。判断：${num} 不是所在连续段的起点，从 ${num - 1} 开始延伸只会得到更长的链。动作：跳过 ${num}，本轮不延伸，longest 保持 ${longest}。为什么：只有起点会启动延伸，每个数值才只被展开一次，这正是 O(n) 的关键。`,
      })
      return
    }

    const run = [num]
    let len = 1
    push({
      arrIdx, cur: num, probe: num - 1, probeKind: 'prev', probeIn: false,
      run: run.slice(), len, longest, improved: false, visited: Array.from(visited),
      nextNum, phase: 'start',
      note: `观察：num = ${num}，查询 num − 1 = ${num - 1}，它不在集合里。判断：${num} 是一段连续序列的起点。动作：把 ${num} 作为链的第一个元素，链长记 1，接着查 num + 1 = ${num + 1}。为什么：从起点一路向右走，遇到的数都属于同一段，既不会漏也不会串段。`,
    })

    let tail = num
    while (set.has(tail + 1)) {
      tail += 1
      len += 1
      run.push(tail)
      push({
        arrIdx, cur: num, probe: tail, probeKind: 'next', probeIn: true,
        run: run.slice(), len, longest, improved: false, visited: Array.from(visited),
        nextNum, phase: 'extend',
        note: `观察：查询 ${tail - 1} + 1 = ${tail}，命中集合。判断：${tail} 紧接在链尾 ${tail - 1} 之后，属于同一段。动作：把 ${tail} 接到链尾，链变成 [${run.join(', ')}]，链长 ${len}，继续查 ${tail + 1}。为什么：一直延伸到第一个不在集合里的数，数出来的就是这一段的最大长度。`,
      })
    }

    const prevLongest = longest
    const improved = len > prevLongest
    if (improved) {
      longest = len
      bestRun = run.slice()
    }
    const verdict = improved
      ? `${len} 大于历史最长 ${prevLongest}，更新 longest = ${len}`
      : len === prevLongest
        ? `${len} 与历史最长 ${prevLongest} 相等，longest 不变`
        : `${len} 小于历史最长 ${prevLongest}，longest 保持 ${prevLongest}`

    push({
      arrIdx, cur: num, probe: tail + 1, probeKind: 'next', probeIn: false,
      run: run.slice(), len, longest, improved, visited: Array.from(visited),
      nextNum, phase: 'close',
      note: `观察：查询 ${tail} + 1 = ${tail + 1}，它不在集合里。判断：链 [${run.join(', ')}] 到此断开，长度 ${len}。动作：与历史最长比较，${verdict}。为什么：每段只被它的起点完整数一次，各段长度的最大值就是答案。`,
    })
  })

  push({
    arrIdx: -1, cur: null, probe: null, probeKind: null, probeIn: false,
    run: bestRun.slice(), len: bestRun.length, longest, improved: false,
    visited: Array.from(visited), nextNum: null, phase: 'done',
    note: `观察：集合里 ${SET_ROW.length} 个不同值都处理完了，longest 停在 ${longest}，对应链 [${bestRun.join(', ')}]。判断：这 ${longest} 个数在原数组里并不相邻，连续性只看「值相差 1」。动作：返回 ${longest}。为什么：只有段起点会启动延伸且各段互不相交，所有延伸访问的数值合计不超过不同值个数，时间 O(n)、空间 O(n)。`,
  })

  return steps
}

/* ---------------- 下一步动作（Hint 必须是真正的下一步） ---------------- */

function nextAction(step: Step): { text: string; tone: Tone } | null {
  if (step.phase === 'done') return null
  if (step.phase === 'init') {
    return { text: `取第一个不同的数 ${ORDER[0]}，先查 num − 1 = ${ORDER[0] - 1}`, tone: 'amber' }
  }
  if (step.phase === 'skip') {
    return step.nextNum === null
      ? { text: '集合已遍历完，输出 longest', tone: 'easy' }
      : { text: `跳过 ${step.cur}，取下一个不同的数 ${step.nextNum}`, tone: 'teal' }
  }
  if (step.phase === 'start') {
    return { text: `查 num + 1 = ${step.run[0] + 1} 是否在集合中`, tone: 'teal' }
  }
  if (step.phase === 'extend') {
    const tail = step.run[step.run.length - 1]
    return { text: `继续查链尾 ${tail} + 1 = ${tail + 1} 是否在集合中`, tone: 'teal' }
  }
  return step.nextNum === null
    ? { text: '集合已遍历完，输出 longest', tone: 'easy' }
    : { text: `取下一个不同的数 ${step.nextNum}，先查 num − 1 = ${step.nextNum - 1}`, tone: 'amber' }
}

/* ---------------- 舞台渲染 ---------------- */

function Stage(step: Step) {
  const done = step.phase === 'done'
  const inRun = (v: number) => step.run.indexOf(v) >= 0
  const visited = (v: number) => step.visited.indexOf(v) >= 0
  const hint = nextAction(step)

  /** 集合行格子：当前 num = amber，链上 = easy，已处理 = dim */
  const setState = (v: number): CellState => {
    if (done) return inRun(v) ? 'ok' : 'dim'
    if (v === step.cur) return 'active'
    if (inRun(v)) return 'ok'
    if (visited(v)) return 'dim'
    return 'idle'
  }

  /** 集合行格下的文字状态：不靠颜色也能区分 */
  const setLabel = (v: number): { text: string; tone: Tone | null } | null => {
    if (done) return inRun(v) ? { text: '链上', tone: 'easy' } : { text: '已处理', tone: null }
    if (v === step.cur) return { text: step.phase === 'skip' ? '非起点' : '起点', tone: 'amber' }
    if (inRun(v)) return { text: '链上', tone: 'easy' }
    if (visited(v)) return { text: '已处理', tone: null }
    return null
  }

  /** 数组行格子：当前 num 的来源 = amber，链上 = easy，已取过的值 = dim */
  const arrState = (v: number, i: number): CellState => {
    if (done) return inRun(v) ? 'ok' : 'dim'
    if (i === step.arrIdx) return 'active'
    if (inRun(v)) return 'ok'
    if ((FIRST.get(v) ?? i) < step.arrIdx) return 'dim'
    return 'idle'
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* 数组行：原顺序 + 下标，标出当前 num 的来源 */}
      <div className="w-full">
        <p className="mb-1 text-center text-[11px] text-ink-soft">
          输入数组 nums（原顺序；遍历时每个不同值只取首次出现）
        </p>
        <div className="flex flex-wrap justify-center gap-1.5">
          {step.nums.map((v, i) => (
            <div key={i} className="flex flex-col items-center">
              <Flag label={!done && i === step.arrIdx ? '来源' : undefined} />
              <Cell state={arrState(v, i)}>{v}</Cell>
              <span className="mt-1 font-code text-[11px] text-ink-soft">{i}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 集合行：哈希集合，算法的遍历对象 */}
      <div className="w-full">
        <p className="mb-1 text-center text-[11px] text-ink-soft">
          哈希集合 numSet（升序显示，方便观察连续性）
        </p>
        <div className="flex flex-wrap justify-center gap-1.5">
          {SET_ROW.map((v) => {
            const label = setLabel(v)
            return (
              <div key={v} className="flex flex-col items-center">
                <Flag label={!done && v === step.cur ? 'num' : undefined} />
                <Cell state={setState(v)}>{v}</Cell>
                <span
                  className="mt-1 h-3 text-[10px] leading-3 text-ink-soft"
                  style={label && label.tone ? { color: TONE[label.tone] } : undefined}
                >
                  {label ? label.text : ''}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* 查询行：这一次查找命中了没有 */}
      <div className="flex flex-wrap items-center justify-center gap-2 text-[11px]">
        <span className="text-ink-soft">当前查询</span>
        {step.probe === null || step.probeKind === null ? (
          <span className="text-ink-soft">{done ? '集合遍历完毕，不再查询' : '等待开始'}</span>
        ) : (
          <>
            <span className="font-code text-ink-soft">
              {step.probeKind === 'prev' ? 'num − 1 =' : 'num + 1 ='}
            </span>
            <Cell size="sm" state={step.probeIn ? 'new' : 'bad'}>
              {step.probe}
            </Cell>
            <span className="font-medium" style={{ color: TONE[step.probeIn ? 'teal' : 'hard'] }}>
              {step.probeIn ? '在集合中' : '不在集合中'}
            </span>
          </>
        )}
      </div>

      {/* 当前延伸链 */}
      <div className="w-full">
        <p className="mb-1 text-center text-[11px] text-ink-soft">当前正在延伸的连续链</p>
        <div className="flex min-h-[36px] flex-wrap items-center justify-center gap-1.5">
          {step.run.length === 0 ? (
            <span className="text-[11px] text-ink-soft">
              {done ? '—' : step.phase === 'skip' ? 'num 不是起点，本轮不延伸' : '链为空'}
            </span>
          ) : (
            step.run.map((v, idx) => (
              <span key={v} className="flex items-center gap-1.5">
                {idx > 0 && <span className="font-code text-[11px] text-ink-soft">→</span>}
                <Cell
                  size="sm"
                  state={done || step.phase === 'close' ? 'ok' : idx === step.run.length - 1 ? 'active' : 'ok'}
                >
                  {v}
                </Cell>
              </span>
            ))
          )}
        </div>
        <p className="mt-1 text-center font-code text-[11px] text-ink-soft">
          {step.run.length === 0
            ? `链长 ${step.len}`
            : `链 = [${step.run.join(', ')}]，链长 ${step.len}`}
        </p>
      </div>

      <Badges className="justify-center">
        <Stat label="当前 num" value={step.cur ?? '—'} tone="amber" />
        <Stat label="当前链长" value={step.len} tone="easy" />
        <Stat
          label="longest"
          value={step.longest}
          tone={step.phase === 'close' && step.improved ? 'easy' : 'water'}
        />
        {hint && <Hint tone={hint.tone}>{hint.text}</Hint>}
        {done && (
          <Answer>
            longest = {step.longest}，最长连续序列 [{step.run.join(', ')}]
          </Answer>
        )}
      </Badges>
    </div>
  )
}

export default function LongestConsecutiveSequenceDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="哈希集合 + 只从段起点向右延伸"
      info={`nums = [${NUMS.join(', ')}]（题解示例 1，答案 4，最长序列 [1, 2, 3, 4]）：先建哈希集合，再让每个连续段只被它的起点统计一次。集合行按值升序显示、遍历顺序取各值首次出现的先后（Go 的 map 遍历顺序未定义），都只为看清楚每一步。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '当前处理的 num / 正在延伸的链尾' },
        { color: TONE.teal, label: '查询命中：该数在集合中' },
        { color: TONE.easy, label: '已接入的连续链 / 最终最长链' },
        { color: TONE.muted, label: '已处理完的集合元素' },
      ]}
    />
  )
}
