import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badges, Cell, Hint, Stat, TONE, type CellState } from './stage'

/* ------------------------------------------------------------------ */
/* 24. 文本左右对齐 —— 模式 A：横向单元格行 + 贪心分组 + 组内空格分配      */
/* ------------------------------------------------------------------ */

/**
 * 示例输入：题解示例 3（18 个单词，maxWidth = 20，官方示例中唯一同时出现
 * 「间隙空格不能均分」的例子：第 1、4 行的待分配空格除不尽（余数 extra = 2），
 * 余下的空格要从最左往右各加一个；第 2、3、5 行都能整除，不需要加最左）。
 * 示例 2 规模更小，但它的所有间隙都正好均分，看不出「左侧多一个空格」的规则。
 * 另外 maxWidth = 20 比 16 更窄，窄屏下每行字符格也更好排。
 */
const WORDS = [
  'Science', 'is', 'what', 'we', 'understand', 'well', 'enough', 'to', 'explain',
  'to', 'a', 'computer.', 'Art', 'is', 'everything', 'else', 'we', 'do',
]
const MAX_WIDTH = 20

/** 一行排版完成后的快照 */
interface LineSnap {
  /** 渲染出的整行内容（含用于撑满宽度的尾部空格） */
  text: string
  /** 该行的单词，用于统计已排版单词数 */
  words: string[]
  /** 该行每个间隙分到的空格数；左对齐行为空数组 */
  gapShares: number[]
  /** 该行是否为左对齐（最后一行或单单词行） */
  leftAligned: boolean
}

interface Step {
  /** 已排版完成的行（不可变快照） */
  lines: LineSnap[]
  /** 当前行已纳入的单词下标 */
  lineIdx: number[]
  /** 正在观察的单词下标 */
  i: number
  /** 当前行「单词间只放 1 个空格」时的长度 */
  lineLength: number
  /** 若把 words[i] 也放进当前行，行宽会变成多少 */
  wouldBe: number
  phase: 'init' | 'accept' | 'reject' | 'single' | 'justify' | 'done'
  note: string
}

/** 一行里哪些间隙多分到了 1 个空格：基本量是各间隙的最小值，多出的那批就在最左侧 */
function extraOf(gapShares: number[]): number[] {
  if (gapShares.length === 0) return []
  const base = Math.min(...gapShares)
  return gapShares.map((s) => (s > base ? 1 : 0))
}

function buildSteps(): Step[] {
  const steps: Step[] = []
  const lines: LineSnap[] = []
  let i = 0

  const push = (
    phase: Step['phase'],
    p: { lineIdx: number[]; i: number; lineLength: number; wouldBe: number; note: string }
  ) => {
    steps.push({
      lines: lines.slice(),
      lineIdx: p.lineIdx.slice(),
      i: p.i,
      lineLength: p.lineLength,
      wouldBe: p.wouldBe,
      phase,
      note: p.note,
    })
  }

  push('init', {
    lineIdx: [],
    i: 0,
    lineLength: 0,
    wouldBe: WORDS[0].length,
    note: `初始化：words 共 ${WORDS.length} 个单词，maxWidth = ${MAX_WIDTH}。贪心分组时 lineLength 只按「单词间至少 1 个空格」累加，不变量是：当前行按单空格拼接后的长度永远不超过 maxWidth。`,
  })

  while (i < WORDS.length) {
    const start = i
    const lineIdx: number[] = [start]
    let lineLength = WORDS[start].length

    push('accept', {
      lineIdx,
      i: start,
      lineLength,
      wouldBe: lineLength,
      note: `观察：新开一行，放入行首单词 words[${start}] = "${WORDS[start]}"（长 ${lineLength}）。判断：置 lineLength = ${lineLength}，还不到 maxWidth = ${MAX_WIDTH}，当前行仍有空间可试。动作：i 右移到 ${start + 1}，${
        start + 1 < WORDS.length
          ? '继续尝试并入后面的单词。'
          : '后面已没有单词可并入，本行将按末行左对齐处理。'
      }`,
    })
    i++

    while (i < WORDS.length) {
      const wlen = WORDS[i].length
      const wouldBe = lineLength + 1 + wlen
      if (wouldBe <= MAX_WIDTH) {
        const before = lineLength
        lineLength = wouldBe
        lineIdx.push(i)
        push('accept', {
          lineIdx,
          i,
          lineLength,
          wouldBe,
          note: `观察：试放 words[${i}] = "${WORDS[i]}"（长 ${wlen}）。判断：${before} + 1 个空格 + ${wlen} = ${wouldBe} ≤ ${MAX_WIDTH}，放得下。动作：并入本行，lineLength 更新为 ${lineLength}，i 右移到 ${i + 1}；能塞就塞，这是行数最少的贪心性质。`,
        })
        i++
      } else {
        push('reject', {
          lineIdx,
          i,
          lineLength,
          wouldBe,
          note: `观察：试放 words[${i}] = "${WORDS[i]}"（长 ${wlen}）。判断：${lineLength} + 1 + ${wlen} = ${wouldBe} > ${MAX_WIDTH}，这个单词无论如何放不进当前行，本行的单词集合已是唯一可能的最大集合。动作：分组到此为止，本行锁定为已放入的 ${lineIdx.length} 个单词，"${WORDS[i]}" 留给下一行。`,
        })
        break
      }
    }

    const isLast = i >= WORDS.length
    const lineWords = lineIdx.map((k) => WORDS[k])
    const wordCount = lineWords.length
    const gaps = wordCount - 1
    const charSum = lineWords.reduce((acc, w) => acc + w.length, 0)
    const totalSpaces = MAX_WIDTH - charSum

    if (isLast || wordCount === 1) {
      const joined = lineWords.join(' ')
      const pad = MAX_WIDTH - joined.length
      lines.push({ text: joined + ' '.repeat(pad), words: lineWords.slice(), gapShares: [], leftAligned: true })
      push('single', {
        lineIdx,
        i,
        lineLength,
        wouldBe: lineLength,
        note:
          (isLast
            ? `观察：i = ${i} 已越界，本行是最后一行。判断：题目规定最后一行左对齐、单词之间不插入额外空格，不能套用间隙分配。`
            : `观察：本行只有 words[${start}] = "${WORDS[start]}" 一个单词。判断：间隙数 gaps = ${wordCount} − 1 = 0，没有间隙可分配（两端对齐分支还会除以 0），必须先判 wordCount == 1。`) +
          `动作：单词间只留 1 个空格，末尾补 ${pad} 个空格凑满 ${MAX_WIDTH} 字符。`,
      })
    } else {
      const spacePerGap = Math.floor(totalSpaces / gaps)
      const extra = totalSpaces % gaps
      const gapShares: number[] = []
      let text = ''
      for (let j = 0; j < wordCount; j++) {
        text += lineWords[j]
        if (j === wordCount - 1) break
        const count = spacePerGap + (j < extra ? 1 : 0)
        gapShares.push(count)
        text += ' '.repeat(count)
      }
      lines.push({ text, words: lineWords.slice(), gapShares, leftAligned: false })
      push('justify', {
        lineIdx,
        i,
        lineLength,
        wouldBe: lineLength,
        note: `观察：本行有 ${wordCount} 个单词、字符总长 ${charSum}，必须撑满 ${MAX_WIDTH}。判断：待分配空格 = ${MAX_WIDTH} − ${charSum} = ${totalSpaces}，间隙数 gaps = ${wordCount} − 1 = ${gaps}，写成带余除法 ${totalSpaces} = ${gaps} × ${spacePerGap} + ${extra}。动作：每个间隙先分 ${spacePerGap} 个，余下的 ${extra} 个从最左往右各加一个 → 间隙空格 [${gapShares.join(', ')}]，任意两间隙相差至多 1 且左侧不少于右侧。`,
      })
    }
  }

  const answer = lines.map((l) => `"${l.text}"`).join(' / ')
  const justifyCount = lines.filter((l) => !l.leftAligned).length
  push('done', {
    lineIdx: [],
    i: WORDS.length,
    lineLength: 0,
    wouldBe: 0,
    note: `所有单词排完，共 ${lines.length} 行，每行长度恰好 ${MAX_WIDTH}。输出 [${answer}]：前 ${justifyCount} 行是两端对齐（余数空格加在最左侧间隙），最后一行按规则左对齐、只在单词间留 1 个空格再补尾部空格。每个单词只被并入一行一次，时间 O(n · maxWidth)，result 自身占 O(L · maxWidth)。`,
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

/** 一行字符格：字母格用 state，空格画成 dim 格里的「·」；extraGap 的间隙标 +1 */
function LineRow({
  text,
  state,
  gapShares,
  extraGaps,
  label,
  labelTone,
  pulse,
}: {
  text: string
  state: CellState
  gapShares?: number[]
  extraGaps?: number[]
  label: string
  labelTone: string
  pulse?: boolean
}) {
  let gapIndex = -1
  const cells = text.split('').map((ch, idx) => {
    const isSpace = ch === ' '
    const startsGap = isSpace && idx > 0 && text[idx - 1] !== ' '
    if (startsGap) gapIndex++
    const extraMark = isSpace && extraGaps ? extraGaps[gapIndex] === 1 : false
    return (
      <div key={idx} className="flex flex-col items-center">
        <Cell size="sm" state={isSpace ? 'dim' : state} className="w-full min-w-0 px-0.5">
          {isSpace ? '·' : ch}
        </Cell>
        <span className="mt-0.5 h-3 font-code text-[10px] leading-3 text-[hsl(var(--medium))]">
          {extraMark ? '+1' : ''}
        </span>
      </div>
    )
  })

  return (
    <div className="w-full">
      <div className="mb-0.5 flex flex-wrap items-center gap-2">
        <span className="font-code text-[11px] font-bold" style={{ color: labelTone }}>
          {label}
        </span>
        {gapShares && gapShares.length > 0 && (
          <span className="font-code text-[10px] text-ink-soft">
            间隙空格 [{gapShares.join(', ')}]
          </span>
        )}
      </div>
      <div
        className={`grid w-full gap-[3px] ${pulse ? 'demo-pulse' : ''}`}
        style={{ gridTemplateColumns: `repeat(${MAX_WIDTH}, minmax(0, 1fr))` }}
      >
        {cells}
      </div>
    </div>
  )
}

/** 舞台下方状态徽章：2–4 个，Hint 必须是真正的下一步动作 */
function StatusBadges({ step, currentLine }: { step: Step; currentLine: LineSnap | null }) {
  const cur = step.i
  const atEnd = cur >= WORDS.length
  const wordCount = step.lineIdx.length
  const charSum = step.lineIdx.reduce((acc, k) => acc + WORDS[k].length, 0)
  const gaps = wordCount - 1
  const totalSpaces = MAX_WIDTH - charSum
  const spacePerGap = gaps > 0 ? Math.floor(totalSpaces / gaps) : 0
  const extra = gaps > 0 ? totalSpaces % gaps : 0
  const nextWord = atEnd ? null : WORDS[cur]

  const hint: string | null =
    step.phase === 'init'
      ? `试放 words[0] = "${WORDS[0]}"：${WORDS[0].length} ≤ ${MAX_WIDTH}，并入当前行`
      : step.phase === 'accept'
        ? atEnd
          ? `本行是最后一行：左对齐，末尾补 ${MAX_WIDTH - charSum} 个空格`
          : step.lineIdx.length === 1 && step.lineIdx[0] === cur
            ? cur + 1 < WORDS.length
              ? `words[${cur}] 已作为行首就位，试放 words[${cur + 1}] = "${WORDS[cur + 1]}"`
              : `words[${cur}] 已作为行首就位，后面没有单词了：本行按末行左对齐，单词间只留 1 个空格、末尾补 ${MAX_WIDTH - charSum} 个空格`
            : step.wouldBe >= MAX_WIDTH
              ? `行宽已到 ${step.lineLength}，先排版当前行`
              : `试放 words[${cur}] = "${nextWord}"：${step.lineLength} + 1 + ${WORDS[cur].length} = ${step.lineLength + 1 + WORDS[cur].length}`
        : step.phase === 'reject'
          ? `开新行，从 words[${cur}] = "${nextWord}" 重新装`
          : step.phase === 'single'
            ? atEnd
              ? '没有更多单词，给出排版结果'
              : `开新行，放入 words[${cur}] = "${nextWord}"`
            : step.phase === 'justify'
              ? extra > 0
                ? `间隙空格定为 [${currentLine?.gapShares.join(', ')}]，继续排版下一行`
                : `每个间隙正好 ${spacePerGap} 个空格，无需额外分配，继续排版下一行`
              : null

  return (
    <Badges className="justify-center">
      {step.phase === 'done' ? (
        <Stat label="总单词数" value={WORDS.length} tone="teal" />
      ) : (
        <>
          <Stat label="当前行宽 lineLength" value={step.lineLength} tone="amber" />
          <Stat label="当前行单词数" value={wordCount} tone="teal" />
        </>
      )}
      {step.phase === 'justify' && <Stat label="待分配空格" value={totalSpaces} tone="medium" />}
      {step.phase === 'done' && <Stat label="总行数" value={step.lines.length} tone="easy" />}
      {hint && <Hint>{hint}</Hint>}
      {step.phase === 'done' && (
        <Answer>
          共 {step.lines.length} 行，每行恰好 {MAX_WIDTH} 字符
        </Answer>
      )}
    </Badges>
  )
}

function Stage(step: Step) {
  const cur = step.i
  const done = step.phase === 'done'
  /** 本行的排版快照已经写进 lines（single / justify / done 三个相位） */
  const closed = step.phase === 'single' || step.phase === 'justify' || done
  const shown = step.lines.length
  const currentLine = shown > 0 ? step.lines[shown - 1] : null
  /** 已完成行覆盖的单词数，用来区分「已排版」与「未处理」 */
  const doneCount = step.lines.reduce((acc, l) => acc + l.words.length, 0)
  /** 当前行已在搭建中（accept/reject 相位） */
  const building = (step.phase === 'accept' || step.phase === 'reject') && step.lineIdx.length > 0
  const used = new Set(step.lineIdx)
  const curText = step.lineIdx.map((k) => WORDS[k]).join(' ')

  return (
    <div className="flex flex-col items-center gap-3">
      {/* 单词数组：状态不靠颜色单独区分，格子下方另有文字标签 */}
      <div className="flex flex-wrap justify-center gap-1.5">
        {WORDS.map((w, idx) => {
          const inLine = used.has(idx)
          const isCur = (step.phase === 'accept' || step.phase === 'reject') && idx === cur
          const laid = done || idx < doneCount
          const state: CellState = done
            ? 'ok'
            : isCur
              ? step.phase === 'reject'
                ? 'bad'
                : 'active'
              : laid
                ? 'ok'
                : inLine
                  ? 'new'
                  : 'dim'
          const label = done
            ? '已排版'
            : isCur
              ? step.phase === 'reject'
                ? '放不下'
                : '试放中'
              : laid
                ? '已排版'
                : inLine
                  ? '本行'
                  : '待处理'
          return (
            <div key={idx} className="flex min-w-16 flex-col items-center gap-0.5 sm:min-w-20">
              <Cell size="sm" state={state} className="w-full min-w-0 px-1">
                <span className="whitespace-nowrap">{w}</span>
              </Cell>
              <span className="font-code text-[10px] text-ink-soft">{label}</span>
            </div>
          )
        })}
      </div>

      {/* 输出行：每行一格一字符，空格是 dim 格；当前行用 active 格 */}
      <div className="flex w-full max-w-[580px] flex-col gap-2">
        {step.lines.map((l, li) => {
          const isLastLine = li === step.lines.length - 1
          return (
            <LineRow
              key={`line-${li}`}
              text={l.text}
              state="ok"
              gapShares={l.leftAligned ? undefined : l.gapShares}
              extraGaps={l.leftAligned ? undefined : extraOf(l.gapShares)}
              label={`第 ${li + 1} 行 · ${l.leftAligned ? '左对齐（末行 / 单单词）' : '两端对齐'} · ${l.text.length} 字符`}
              labelTone={l.leftAligned ? TONE.medium : TONE.easy}
              pulse={done && isLastLine}
            />
          )
        })}

        {building && (
          <LineRow
            text={curText}
            state={step.phase === 'reject' ? 'warn' : 'active'}
            label={`当前行 · 已纳入 ${step.lineIdx.length} 个单词 · 单空格拼接共 ${curText.length} 字符`}
            labelTone={TONE.amber}
          />
        )}
      </div>

      <StatusBadges step={step} currentLine={closed ? currentLine : null} />
    </div>
  )
}

export default function TextJustificationDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="贪心装行 + 组内均匀分配空格"
      info={`words = [${WORDS.map((w) => `"${w}"`).join(', ')}]，maxWidth = ${MAX_WIDTH}。取题解示例 3（合计 ${steps.length} 步）：它的多处间隙空格无法均分，余数要加在最左侧间隙上，正好能看到「左侧不少于右侧」这条规则。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '正在试放的单词 / 当前行' },
        { color: TONE.teal, label: '本行已纳入的单词' },
        { color: TONE.easy, label: '已排版完成的行' },
        { color: TONE.medium, label: '多分到 1 个空格的间隙（+1）' },
        { color: TONE.muted, label: '空格格 / 待处理的单词' },
      ]}    />
  )
}
