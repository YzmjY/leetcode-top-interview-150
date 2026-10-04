import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badges, Cell, Flag, Hint, Stat, TONE, type CellState } from './stage'

/* ------------------------------------------------------------------ */
/* 21. 反转字符串中的单词 —— 模式 A：字符行 + 区间色块                   */
/* 先用 Fields 语义扫描切词（区间色块 = 正在读取的单词），               */
/* 再用双指针反转单词数组，最后用单个空格连接。                          */
/* ------------------------------------------------------------------ */

/** 固定的示例输入（取自题解示例 3："a good   example" → "example good a"） */
const S = 'a good   example'
const CHARS = S.split('')

interface Range {
  start: number
  end: number
}

interface Step {
  chars: string[]
  /** 扫描指针：init 为 −1 */
  i: number
  /** 当前单词起点；不在单词中为 −1 */
  start: number
  /** 已切分出的单词（及生成它们的下标区间），均是不可变快照副本 */
  words: string[]
  ranges: Range[]
  /** 正在反转的单词数组下标 */
  swapL: number
  swapR: number
  /** 本步刚切出的单词("")；本步被跳过的空格下标(−1) */
  word: string
  skipped: number
  phase: 'init' | 'letter' | 'split' | 'skip' | 'swap' | 'done'
  note: string
  /** 下一步动作（由后一个快照推导，供 Hint 使用）；done 步为空串 */
  hint: string
}

/**
 * 下一步动作文案：只读「后一个快照」的 phase / i / start，保证 Hint 描述的是
 * 真正会发生的那一步（而不是当前下标本身那一格）。
 */
function nextMove(prev: Step, next: Pick<Step, 'phase' | 'i' | 'start' | 'swapL' | 'words'>): string {
  const n = CHARS.length
  if (next.phase === 'skip') return `跳过 s[${next.i}] 的多余空格`
  if (next.phase === 'split') {
    // 下一步是切分：切分点 = 从当前下标起的第一个空格（越界即 n），单词区间 = prev.start..切分点 − 1
    let cut = prev.i + 1
    while (cut < n && CHARS[cut] !== ' ') cut++
    const word = CHARS.slice(prev.start, cut).join('')
    return cut < n
      ? `在 s[${cut}] 的空格处切出 s[${prev.start}..${cut - 1}] = "${word}" 收入 words`
      : `扫描结束（i = ${n}），把末尾 s[${prev.start}..${n - 1}] = "${word}" 收进 words`
  }
  if (next.phase === 'swap') {
    const m = next.words.length
    const l = next.swapL
    if (l * 2 >= m) return '双指针相遇，用单个空格连接 words'
    return `交换 words[${l}] 与 words[${m - 1 - l}]`
  }
  if (next.phase === 'done') return '单词已反转，用单个空格连接 words'
  // next.phase === 'letter'：下一步真正读入的就是 s[next.i]
  const nextCh = CHARS[next.i]
  const wasInWord = prev.start >= 0
  if (!wasInWord) return `i 右移到 ${next.i}，读入 s[${next.i}] = '${nextCh}'，它开启新单词（start 记为 ${next.start}）`
  return next.start === prev.start
    ? `i 右移到 ${next.i}，读入 s[${next.i}] = '${nextCh}'，单词 s[${prev.start}..] 仍在继续`
    : `i 右移到 ${next.i}，读入 s[${next.i}] = '${nextCh}'，start 记为 ${next.start}`
}

function buildSteps(): Step[] {
  const n = CHARS.length
  const steps: Step[] = []
  const words: string[] = []
  const ranges: Range[] = []

  const push = (
    phase: Step['phase'],
    i: number,
    start: number,
    note: string,
    extra: Partial<Pick<Step, 'swapL' | 'swapR' | 'word' | 'skipped'>> = {}
  ) => {
    steps.push({
      chars: CHARS.slice(),
      i,
      start,
      words: words.slice(),
      ranges: ranges.map((r) => ({ start: r.start, end: r.end })),
      swapL: -1,
      swapR: -1,
      word: '',
      skipped: -1,
      phase,
      note,
      hint: '',
      ...extra,
    })
  }

  push(
    'init',
    -1,
    -1,
    `初始化：s = "${S}"，共 ${n} 个字符；words = [] 用于收集切分出的单词，i 从 0 开始扫描，start 记录当前单词的起点（不在单词中时为 −1）。不变量：start ≥ 0 当且仅当 i 之前还有一个尚未收下的非空格字符。`
  )

  let start = -1
  for (let i = 0; i < n; i++) {
    if (CHARS[i] !== ' ') {
      if (start === -1) start = i
      if (start === i) {
        push(
          'letter',
          i,
          start,
          `观察：s[${i}] = '${CHARS[i]}' 不是空格，且此刻 start = −1，说明它是新单词的第一个字符。动作：start 记为 ${start}，i 右移继续读。为什么：只有遇到空格才能确定单词已经结束，此时切分会把中间都是空格的片段算成空单词。`
        )
      } else {
        push(
          'letter',
          i,
          start,
          `观察：s[${i}] = '${CHARS[i]}' 不是空格，start 仍停在 ${start}。判断：从下标 ${start} 起的单词还没结束。动作：i 右移，继续读下一个字符。`
        )
      }
    } else if (start !== -1) {
      const word = S.slice(start, i)
      const from = start
      words.push(word)
      ranges.push({ start: from, end: i })
      start = -1
      push(
        'split',
        i,
        -1,
        `观察：s[${i}] = ' '，而 start = ${from} 说明下标 ${from} 起还有一个正在读取的单词。动作：把 s[${from}..${i - 1}] 切出来得到 "${word}" 收进数组，words 变为 [${words.map((w) => `"${w}"`).join(', ')}]。`
      )
    } else {
      push(
        'skip',
        i,
        -1,
        `观察：s[${i}] = ' '，但 start = −1，当前没有正在读取的单词。判断：这是单词之间的多余空格。动作：跳过、不切分，所以 words 不会添进空字符串。`,
        { skipped: i }
      )
    }
  }

  if (start !== -1) {
    const from = start
    const word = S.slice(from, n)
    words.push(word)
    ranges.push({ start: from, end: n })
    push(
      'split',
      n,
      -1,
      `观察：扫描到末尾 i = n = ${n}，start 仍停在 ${from}。动作：把末尾这段 s[${from}..${n - 1}] 收成 "${word}"，切分完成，words = [${words
        .map((w) => `"${w}"`)
        .join(', ')}]。`
    )
  }

  const m = words.length
  for (let i = 0; i < Math.floor(m / 2); i++) {
    const j = m - 1 - i
    const a = words[i]
    const b = words[j]
    words[i] = b
    words[j] = a
    push(
      'swap',
      n,
      -1,
      `双指针反转单词数组：交换 words[${i}] = "${a}" 与 words[${j}] = "${b}"。i 走到 ⌊n/2⌋ = ${Math.floor(
        m / 2
      )} 就停，中间那个单词不用动。结果 words = [${words.map((w) => `"${w}"`).join(', ')}]。`,
      { swapL: i, swapR: j }
    )
  }

  const result = words.join(' ')
  push(
    'done',
    n,
    -1,
    `单词顺序已反转，最后用单个空格把 words 连接起来，前导、尾随和连续空格都不会出现：结果 = "${result}"。复杂度：切分、反转、连接各走一遍，时间 O(n)；words 与结果字符串各占 O(n) 空间。`
  )

  // 「下一步动作」由后一个快照推导，保证 Hint 与步骤数据完全一致（见题 20 的同款写法）
  steps.forEach((s, idx) => {
    const next = steps[idx + 1]
    if (next) s.hint = nextMove(s, next)
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

function Stage(step: Step) {
  const n = step.chars.length
  const m = step.words.length
  const done = step.phase === 'done'
  const scanned = done || step.i >= n

  /** 正在读取的单词区间 */
  const readL = step.start >= 0 ? step.start : -1
  const readR = step.start >= 0 ? (step.i < n ? step.i : n - 1) : -1
  const hasReading = readL >= 0 && readR >= readL

  /** 这一位属于已切分的单词，还是被丢掉的多余空格 */
  const inSplitWord = (idx: number) =>
    step.ranges.some((r) => idx >= r.start && idx < r.end)

  const charState = (idx: number): CellState => {
    if (hasReading && idx >= readL && idx <= readR) return 'active'
    if (!scanned) return 'dim'
    if (idx === step.skipped) return 'bad'
    if (inSplitWord(idx)) return 'ok'
    return 'dim'
  }

  const charTone = (idx: number): string | undefined => {
    if (hasReading && idx >= readL && idx <= readR) return TONE.amber
    if (!scanned) return undefined
    if (idx === step.skipped) return TONE.hard
    if (inSplitWord(idx)) return TONE.easy
    return TONE.ink
  }

  const wordState = (idx: number): CellState => {
    if (step.phase === 'swap') {
      if (idx === step.swapL || idx === step.swapR) return 'active'
      return 'ok'
    }
    if (done) return 'ok'
    return 'new'
  }

  const hint = step.phase === 'done' ? null : step.hint

  return (
    <div className="flex flex-col items-center gap-3">
      {/* 原字符串：区间色块 = 正在读取的单词 */}
      <div className="w-full max-w-[560px]">
        <div className="mb-1 text-center text-[11px] text-ink-soft">
          原字符串 s：start 标记单词起点，i 逐个字符扫描
        </div>

        <div className="flex w-full">
          {step.chars.map((_, idx) => {
            const label =
              step.start >= 0 && idx === step.start
                ? 'start'
                : step.i === idx && step.i < n
                  ? 'i'
                  : undefined
            const tone = idx === step.i && step.i < n ? 'amber' : 'teal'
            return (
              <div key={idx} className="flex min-w-0 flex-1 justify-center">
                <Flag label={label} tone={tone} />
              </div>
            )
          })}
        </div>

        <div className="relative flex w-full">
          {hasReading && (
            <div
              className="pointer-events-none absolute -inset-y-1 rounded-lg border-[1.5px] border-[hsl(var(--amber))]/50 bg-[hsl(var(--amber))]/15 transition-all duration-300"
              style={{
                left: `${(readL / n) * 100}%`,
                width: `${((readR - readL + 1) / n) * 100}%`,
              }}
            />
          )}
          {step.chars.map((ch, idx) => (
            <div key={idx} className="flex min-w-0 flex-1 justify-center px-[3px]">
              <Cell state={charState(idx)} className="w-full min-w-0 sm:min-w-0">
                {ch === ' ' ? '␣' : ch}
              </Cell>
            </div>
          ))}
        </div>

        <div className="mt-1 flex w-full">
          {step.chars.map((_, idx) => (
            <span
              key={idx}
              className="min-w-0 flex-1 text-center font-code text-[10px] font-semibold"
              style={{ color: charTone(idx) }}
            >
              {idx}
            </span>
          ))}
        </div>
      </div>

      {/* 单词数组：双指针反转 */}
      <div className="w-full max-w-[560px]">
        <div className="mb-1 text-center text-[11px] text-ink-soft">
          words（已切分出的单词，共 {m} 个）
        </div>

        <div className="flex w-full flex-wrap items-end justify-center gap-1.5">
          {step.words.map((w, idx) => {
            const label =
              step.phase === 'swap' && idx === step.swapL
                ? 'left'
                : step.phase === 'swap' && idx === step.swapR
                  ? 'right'
                  : undefined
            return (
              <div key={idx} className="flex min-w-0 flex-col items-center">
                <Flag label={label} tone={idx === step.swapR ? 'teal' : 'amber'} />
                <Cell state={wordState(idx)} className="px-2.5">
                  {w}
                </Cell>
                <span className="mt-1 font-code text-[10px] text-ink-soft">{idx}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* 结果：只在最后一步出现 */}
      {done && (
        <div className="fade-up flex flex-col items-center gap-1">
          <span className="text-[11px] text-ink-soft">单词间用单个空格连接后的结果</span>
          <span className="font-code text-sm font-semibold" style={{ color: TONE.easy }}>
            &quot;{step.words.join(' ')}&quot;
          </span>
        </div>
      )}

      <Badges className="justify-center">
        <Stat label="已切分单词数" value={m} tone="easy" />
        <Stat label="当前下标 i" value={scanned ? `n = ${n}` : step.i < 0 ? '—' : step.i} tone="amber" />
        {step.start >= 0 && <Stat label="单词起点 start" value={step.start} tone="teal" />}
        {hint && <Hint>{hint}</Hint>}
        {done && (
          <Answer>
            &quot;{step.words.join(' ')}&quot;
          </Answer>
        )}
      </Badges>
    </div>
  )
}

export default function ReverseWordsInAStringDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="按空白切词，再反转单词数组"
      info={`s = "${S}"（题解示例 3），预期输出 "example good a"。这里取示例 3 而不是示例 1，是因为只有它同时含连续空格：words 切分时 3 个连续空格只作分隔、不产生空单词，最后用单个空格连接。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '正在读取的单词区间' },
        { color: TONE.teal, label: '已切分出的单词（切分阶段为青色，反转阶段变绿）' },
        { color: TONE.hard, label: '被忽略的多余空格' },
        { color: TONE.muted, label: '尚未扫描的字符 / 下标' },
      ]}
    />
  )
}
