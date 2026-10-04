import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badges, Cell, Flag, Hint, Stat, TONE, type CellState, type Tone } from './stage'

/* ------------------------------------------------------------------ */
/* 44. 两数之和 —— 模式 A：数组行 + 「数值 → 下标」映射行（哈希表一次遍历） */
/* ------------------------------------------------------------------ */

/** 题解示例 2：nums = [3, 2, 4], target = 6 → 输出 [1, 2] */
const NUMS = [3, 2, 4]
const TARGET = 6
/** 本例三个数值互不相同，映射行可以按数值一一列出 */
const UNIQUE = Array.from(new Set(NUMS))

/** 哈希表：数值 → 下标 */
type NumIdx = Partial<Record<number, number>>

interface Step {
  nums: number[]
  /** 哈希表快照：数值 → 下标 */
  numIdx: NumIdx
  /** 已经入表的下标，用于把数组格标成「已入表」 */
  inserted: number[]
  /** 当前扫描到的下标；init 为 −1 */
  i: number
  /** complement = target − nums[i]；init / done 为 null */
  complement: number | null
  /** 命中的搭档下标；未命中为 −1 */
  hitIdx: number
  phase: 'init' | 'probe' | 'insert' | 'found' | 'done'
  answer: [number, number] | null
  note: string
}

function buildSteps(): Step[] {
  const n = NUMS.length
  const steps: Step[] = []
  const numIdx: NumIdx = {}
  const inserted: number[] = []
  let answer: [number, number] | null = null
  let cursor = -1

  const push = (
    phase: Step['phase'],
    i: number,
    complement: number | null,
    hitIdx: number,
    note: string
  ) => {
    steps.push({
      nums: NUMS.slice(),
      numIdx: { ...numIdx },
      inserted: inserted.slice(),
      i,
      complement,
      hitIdx,
      phase,
      answer,
      note,
    })
  }

  push(
    'init',
    -1,
    null,
    -1,
    `观察：nums = [${NUMS.join(', ')}]，target = ${TARGET}，numIdx 是空表。判断：对每个 nums[i] 只要能 O(1) 判断 target − nums[i] 是否出现过，一次遍历就够。动作：i 从 0 开始边扫边查，每轮先查表再插入，保证同一个元素不会被用两次。`
  )

  for (let i = 0; i < n; i++) {
    cursor = i
    const value = NUMS[i]
    const complement = TARGET - value
    const hitIdx = numIdx[complement] ?? -1

    if (hitIdx >= 0) {
      push(
        'probe',
        i,
        complement,
        hitIdx,
        `观察：扫描到 i = ${i}，nums[${i}] = ${value}，需要的搭档 complement = ${TARGET} − ${value} = ${complement}。判断：numIdx 里已有 ${complement} → ${hitIdx}，且 ${hitIdx} < ${i}，说明它来自已经扫过的元素，${complement} + ${value} = ${TARGET}。动作：命中，本步不再插入，准备返回 [${hitIdx}, ${i}]。`
      )
      answer = [hitIdx, i]
      push(
        'found',
        i,
        complement,
        hitIdx,
        `动作：返回 [${hitIdx}, ${i}]，nums[${hitIdx}] = ${complement} 与 nums[${i}] = ${value} 之和正是 target = ${TARGET}，两个下标同色高亮表示配对成功。正确性：表中保存的恰好是 nums[0..i−1] 中出现过的值，命中就意味着存在 j < i 与 i 配对，两个下标必然不同。`
      )
      break
    }

    push(
      'probe',
      i,
      complement,
      -1,
      `观察：扫描到 i = ${i}，nums[${i}] = ${value}，需要的搭档 complement = ${TARGET} − ${value} = ${complement}。判断：numIdx 里没有 ${complement}，说明能和 ${value} 凑成 ${TARGET} 的数还没有出现过。动作：本轮不返回，转入插入。为什么先查后插：此刻 ${value} 还没进表，即使 target 恰好是 2 × nums[i] 也不会命中自己。`
    )

    numIdx[value] = i
    inserted.push(i)
    push(
      'insert',
      i,
      complement,
      -1,
      `动作：把 numIdx[${value}] = ${i} 存入表中，记录数值 ${value} 出现在下标 ${i}。为什么键存数值、值存下标：查找时给出的是 complement 这个数，只有按数值作键才能 O(1) 取到它的下标。`
    )
  }

  push(
    'done',
    cursor,
    null,
    -1,
    `观察：下标 ${cursor} 处就命中，后面没有更多元素了。判断：题目保证恰有一个答案，所以 [${answer ? answer.join(', ') : '—'}] 就是唯一解，不需要比较哪一组更好。动作：结束。复杂度：数组只遍历一次，哈希查找与插入均摊 O(1)，时间 O(n)；表最多存 n 项，空间 O(n)。`
  )

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

function nextAction(step: Step): string | null {
  if (step.phase === 'done') return null
  if (step.phase === 'init') {
    return `i 移到 0，算 complement = ${TARGET} − ${NUMS[0]} = ${TARGET - NUMS[0]} 并查表`
  }
  if (step.phase === 'probe') {
    if (step.hitIdx >= 0) return `返回下标 [${step.hitIdx}, ${step.i}]`
    return `把 numIdx[${NUMS[step.i]}] = ${step.i} 存入表中，i 移到 ${step.i + 1}`
  }
  if (step.phase === 'found') return '返回答案后结束扫描（收尾：给出结论）'
  const next = step.i + 1
  if (next >= NUMS.length) return 'i 越过末尾，循环结束'
  return `i 移到 ${next}，算 complement = ${TARGET} − ${NUMS[next]} = ${TARGET - NUMS[next]} 并查表`
}

function chipClass(tone?: Tone): string {
  if (tone === 'amber') {
    return 'border-[hsl(var(--amber))]/50 bg-[hsl(var(--amber-soft))] text-[hsl(var(--amber))]'
  }
  if (tone === 'teal') {
    return 'border-[hsl(var(--teal))]/40 bg-[hsl(var(--teal-soft))] text-[hsl(var(--teal))]'
  }
  if (tone === 'easy') {
    return 'border-[hsl(var(--easy))]/40 bg-[hsl(var(--easy-soft))] text-[hsl(var(--easy))]'
  }
  return 'border-border bg-card text-ink-soft'
}

function Stage(step: Step) {
  const n = NUMS.length
  const done = step.phase === 'done'
  /** 本步命中了搭档（探测命中 / 返回答案两步） */
  const hit = !done && step.hitIdx >= 0 && (step.phase === 'probe' || step.phase === 'found')
  const shownValue = step.i >= 0 && step.i < n ? NUMS[step.i] : null
  const hint = nextAction(step)
  const pairL = done && step.answer ? Math.min(...step.answer) : -1
  const pairR = done && step.answer ? Math.max(...step.answer) : -1

  const stateOf = (j: number): CellState => {
    if (done) return step.answer?.includes(j) ? 'ok' : 'dim'
    if (hit && (j === step.i || j === step.hitIdx)) return 'ok'
    if (j === step.i) return 'active'
    if (step.inserted.includes(j)) return 'new'
    return 'dim'
  }

  const flagAt = (j: number): { label?: string; tone: Tone } => {
    if (done) {
      return step.answer?.includes(j) ? { label: '答案', tone: 'easy' } : { tone: 'muted' }
    }
    if (hit && j === step.i) return { label: 'i', tone: 'easy' }
    if (hit && j === step.hitIdx) return { label: '搭档', tone: 'easy' }
    if (j === step.i) return { label: 'i', tone: 'amber' }
    return { tone: 'muted' }
  }

  const chipTone = (v: number): Tone | undefined => {
    const idx = step.numIdx[v]
    if (done) {
      if (idx !== undefined && step.answer?.includes(idx)) return 'easy'
      return idx === undefined ? undefined : 'teal'
    }
    if (step.complement !== null && v === step.complement && (step.phase === 'probe' || step.phase === 'found')) {
      return hit ? 'easy' : 'amber'
    }
    if (step.phase === 'insert' && shownValue === v) return 'amber'
    return idx === undefined ? undefined : 'teal'
  }

  const chipStatus = (v: number, tone?: Tone): string => {
    if (tone === 'easy') return '命中搭档'
    if (tone === 'amber') return step.phase === 'insert' ? '本步入表' : '正在查表'
    return step.numIdx[v] === undefined ? '未入表' : '已在表中'
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex w-full max-w-[560px] flex-col items-center gap-1">
        <span className="font-code text-[11px] text-ink-soft">nums（target = {TARGET}）</span>

        {/* 指针旗标：当前下标 i / 命中搭档 / 答案，均带文字标签 */}
        <div className="flex h-6 w-full">
          {step.nums.map((_, j) => (
            <div key={j} className="flex min-w-0 flex-1 justify-center">
              <Flag label={flagAt(j).label} tone={flagAt(j).tone} />
            </div>
          ))}
        </div>

        {/* 数组行：命中时两个下标同色高亮 */}
        <div className="relative flex w-full">
          {done && pairL >= 0 && (
            <div
              className="demo-pulse pointer-events-none absolute -inset-y-1 rounded-lg border-[1.5px] border-[hsl(var(--easy))]/60 bg-[hsl(var(--easy))]/15"
              style={{
                left: `${(pairL / n) * 100}%`,
                width: `${((pairR - pairL + 1) / n) * 100}%`,
              }}
            />
          )}
          {step.nums.map((v, j) => (
            <div key={j} className="flex min-w-0 flex-1 justify-center px-[3px]">
              <Cell state={stateOf(j)} className="w-full min-w-0">
                {v}
              </Cell>
            </div>
          ))}
        </div>

        {/* 下标 */}
        <div className="flex w-full">
          {step.nums.map((_, j) => (
            <span key={j} className="min-w-0 flex-1 text-center font-code text-[11px] text-ink-soft">
              {j}
            </span>
          ))}
        </div>
      </div>

      {/* 本步的补数算式 */}
      <div className="flex min-h-[26px] w-full items-center justify-center gap-1.5">
        {step.complement === null || shownValue === null ? (
          <span className="text-[11px] text-ink-soft">
            {done ? '已命中，不再计算 complement' : '尚未开始扫描，complement 待定'}
          </span>
        ) : (
          <>
            <span className="text-[11px] text-ink-soft">complement =</span>
            <span className="font-code text-[13px] font-semibold text-ink">{TARGET}</span>
            <span className="text-[11px] text-ink-soft">−</span>
            <span className="font-code text-[13px] font-semibold" style={{ color: TONE.amber }}>
              {shownValue}
            </span>
            <span className="text-[11px] text-ink-soft">=</span>
            <span
              className="font-code text-[13px] font-bold"
              style={{ color: hit ? TONE.easy : TONE.amber }}
            >
              {step.complement}
            </span>
          </>
        )}
      </div>

      {/* numIdx：数值 → 下标 */}
      <div className="flex w-full max-w-[640px] flex-col items-center gap-1.5">
        <span className="text-[11px] text-ink-soft">numIdx：数值 → 下标（只收录已扫描过的数）</span>
        <div className="flex w-full flex-wrap items-stretch justify-center gap-1.5">
          {UNIQUE.map((v) => {
            const idx = step.numIdx[v]
            const tone = chipTone(v)
            return (
              <div
                key={v}
                className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg border px-2 py-1 ${chipClass(tone)} sm:max-w-[120px]`}
              >
                <span className="whitespace-nowrap font-code text-[13px] font-bold">
                  {v} → {idx === undefined ? '—' : idx}
                </span>
                <span className="whitespace-nowrap text-[10px] text-ink-soft">{chipStatus(v, tone)}</span>
              </div>
            )
          })}
        </div>
      </div>

      <Badges className="justify-center">
        <Stat
          label="当前下标 i"
          value={step.i >= 0 && step.i < n ? step.i : '—'}
          tone={step.phase === 'init' || done ? 'muted' : 'amber'}
        />
        <Stat
          label="complement"
          value={step.complement === null ? '—' : step.complement}
          tone={hit ? 'easy' : 'amber'}
        />
        <Stat label="numIdx 已存" value={step.inserted.length} tone="ink" />
        {hint && <Hint>{hint}</Hint>}
        {done && step.answer && (
          <Answer>
            返回 [{step.answer.join(', ')}]：nums[{step.answer[0]}] + nums[{step.answer[1]}] ={' '}
            {NUMS[step.answer[0]]} + {NUMS[step.answer[1]]} = {TARGET}
          </Answer>
        )}
      </Badges>
    </div>
  )
}

export default function TwoSumDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="哈希表一次遍历：边扫边查 complement"
      info={`nums = [${NUMS.join(', ')}]，target = ${TARGET}（题解示例 2，答案 [1, 2]）。i 从左往右只扫一遍：每步先算 complement = target − nums[i] 并查表，命中就返回两个下标，未命中才把 nums[i] → i 存入 numIdx。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '当前扫描的 nums[i] / 正在查表的 complement' },
        { color: TONE.teal, label: '已存入哈希表（已入表 / 已在表中）' },
        { color: TONE.easy, label: '命中的两个下标（配对成功）' },
        { color: TONE.muted, label: '尚未扫描' },
      ]}
    />
  )
}
