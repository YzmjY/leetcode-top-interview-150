import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badges, Cell, Flag, Hint, Stat, TONE, type CellState } from './stage'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/* 32. 串联所有单词的子串 —— 模式 A：数组 + 指针                        */
/* 按单词长度分组的定长滑窗：只枚举 wordLen 条对齐轨道，窗口按整词扩展、  */
/* 最多容纳 wordCount 个整词（matched == 种类数时恰好是 words 的一个排列）， */
/* 并用「词 → 次数」行对照 windowCount 与 targetCount                       */
/* ------------------------------------------------------------------ */

/** 题解示例 1：s = "barfoothefoobarman"，words = ["foo","bar"]，答案 [0, 9] */
const S = 'barfoothefoobarman'
const WORDS = ['foo', 'bar']
const CHARS = S.split('')
/** 所有单词长度相同：wordLen = 3，串联子串长度 totalLen = 3 × 2 = 6 */
const WORD_LEN = WORDS[0].length
const TOTAL_LEN = WORD_LEN * WORDS.length
/** targetCount：每个单词需要出现几次；KINDS 是不同单词的种类数 */
const TARGET: Record<string, number> = {}
for (const w of WORDS) TARGET[w] = (TARGET[w] ?? 0) + 1
const TARGET_KEYS = Object.keys(TARGET)
const KINDS = TARGET_KEYS.length

/** 第 offset 条轨道上所有能按整词切分的位置，如 offset = 0 时 [0, 3, 6, 9, 12, 15] */
function trackOf(offset: number): number[] {
  const idx: number[] = []
  for (let i = offset; i + WORD_LEN <= S.length; i += WORD_LEN) idx.push(i)
  return idx
}

interface Step {
  phase: 'init' | 'offset' | 'probe' | 'done'
  /** 本轮枚举的偏移轨道；init / done 为 −1 */
  offset: number
  /** 这条轨道上的可切词位置 */
  track: number[]
  /** 窗口左端（已按需收缩过） */
  left: number
  /** 本步读入的整词起始下标；init / done 为 −1 */
  right: number
  /** 本步读入的整词；init / offset / done 为空串 */
  word: string
  inTarget: boolean
  windowCount: Record<string, number>
  /** 窗口内词频已达标的单词种类数 */
  matched: number
  /** 本步因窗口超长被移出的整词起始下标；−1 表示没有 */
  removedAt: number
  results: number[]
  /** 本步是否记录了新起点 */
  recorded: boolean
  note: string
}

function buildSteps(): Step[] {
  const steps: Step[] = []
  const results: number[] = []

  steps.push({
    phase: 'init',
    offset: -1,
    track: [],
    left: -1,
    right: -1,
    word: '',
    inTarget: false,
    windowCount: {},
    matched: 0,
    removedAt: -1,
    results: [],
    recorded: false,
    note: `初始化：s = "${S}"，words = [${WORDS.map((w) => `"${w}"`).join(', ')}]，所有单词长度都是 wordLen = ${WORD_LEN}，共 ${WORDS.length} 个，所以任何串联子串的长度都固定为 totalLen = ${WORD_LEN} × ${WORDS.length} = ${TOTAL_LEN}。targetCount = { ${TARGET_KEYS.map((w) => `${w} × ${TARGET[w]}`).join('，')} }，matched 记录「窗口词频恰好等于目标」的单词种类数，只有 matched == ${KINDS} 才说明窗口正好由 words 的一个排列拼成。起点 i 必然落在 offset = i mod ${WORD_LEN} 这条轨道上，所以外层只需枚举 offset = 0、1、2 三条轨道，每条轨道只在 s[offset]、s[offset + ${WORD_LEN}]、… 处按整词切分。`,
  })

  for (let offset = 0; offset < WORD_LEN; offset++) {
    const track = trackOf(offset)
    let left = offset
    let windowCount: Record<string, number> = {}
    let matched = 0

    steps.push({
      phase: 'offset',
      offset,
      track,
      left,
      right: offset - WORD_LEN,
      word: '',
      inTarget: false,
      windowCount: {},
      matched: 0,
      removedAt: -1,
      results: results.slice(),
      recorded: false,
      note: `观察：进入 offset = ${offset} 这条轨道，只在 ${track.map((i) => `s[${i}]`).join('、')} 处按步长 ${WORD_LEN} 切词，窗口内不允许出现别的位置切出来的词。判断：任意起点 i 都满足 offset = i mod ${WORD_LEN}，枚举全部 ${WORD_LEN} 条轨道即可覆盖所有可能的起点，不会漏解。动作：left 放到 ${offset}，windowCount 清空，matched = 0。`,
    })

    for (let right = offset; right + WORD_LEN <= S.length; right += WORD_LEN) {
      const word = S.slice(right, right + WORD_LEN)
      const need = TARGET[word] ?? 0
      const windowEnd = right + WORD_LEN

      if (need === 0) {
        const nextLeft = windowEnd
        left = nextLeft
        windowCount = {}
        matched = 0
        steps.push({
          phase: 'probe',
          offset,
          track,
          left,
          right,
          word,
          inTarget: false,
          windowCount: {},
          matched: 0,
          removedAt: -1,
          results: results.slice(),
          recorded: false,
          note: `观察：right 推进到 ${right}，取词 s[${right}..${windowEnd - 1}] = "${word}"，它不在 words 中。判断：任何包含 "${word}" 的窗口都不可能由 words 的排列拼成，留着窗口里的旧计数只会干扰后续判断。动作：windowCount 清空、matched 归零，left 直接跳到 ${nextLeft}（整词越过 "${word}"）。为什么不会漏解：起点早于 ${nextLeft} 的窗口都会跨过这个非法词，跳过它们之后从下一个整词位置重新开始即可。`,
        })
        continue
      }

      const before = windowCount[word] ?? 0
      const next = before + 1
      windowCount = { ...windowCount, [word]: next }
      const justMatched = next === need
      const matchedBefore = matched
      if (justMatched) matched++

      let removedAt = -1
      let removedWord = ''
      let removedDetail = ''
      if (windowEnd - left > TOTAL_LEN) {
        removedAt = left
        removedWord = S.slice(left, left + WORD_LEN)
        const needOut = TARGET[removedWord] ?? 0
        const cntBefore = windowCount[removedWord] ?? 0
        const wasMatched = needOut > 0 && cntBefore === needOut
        if (wasMatched) matched--
        if (needOut > 0) windowCount = { ...windowCount, [removedWord]: cntBefore - 1 }
        left += WORD_LEN
        removedDetail =
          needOut > 0
            ? `它移出前在窗口里有 ${cntBefore} 个（目标 ${needOut}）${wasMatched ? `，这一种不再达标，matched 减到 ${matched}` : '，本来就没达标，matched 不变'}`
            : `它不在 targetCount 里，窗口计数不受影响`
      }

      let recorded = false
      if (matched === KINDS) {
        results.push(left)
        recorded = true
      }

      const obs = `观察：right 推进到 ${right}，取词 s[${right}..${windowEnd - 1}] = "${word}"，它在 words 中。`
      const judge = `判断：windowCount["${word}"] 从 ${before} 变成 ${next}，${
        justMatched
          ? `刚好等于目标 ${need}，这一种凑齐，matched 从 ${matchedBefore} 增到 ${matched}`
          : `还没到目标 ${need}，matched 保持 ${matchedBefore}`
      }。`
      const act =
        removedAt >= 0
          ? `动作：窗口 [${removedAt}, ${windowEnd}) 的宽度 ${windowEnd - removedAt} 已超过 totalLen = ${TOTAL_LEN}，先把最左的 "${removedWord}" 移出（${removedDetail}），left 右移到 ${left}。为什么收缩一个词就够：right 每次只多读一个整词，窗口最多超出一个词。`
          : recorded
            ? `动作：窗口 [${left}, ${windowEnd}) 的宽度 ${windowEnd - left} 正好等于 totalLen，matched = ${KINDS} 说明每种词的窗口词频都与目标一致，把起点 ${left} 记入答案，s[${left}..${windowEnd - 1}] = "${S.slice(left, windowEnd)}" 正是 words 的一个排列。`
            : `动作：窗口扩到 [${left}, ${windowEnd})，宽度 ${windowEnd - left} ≤ totalLen = ${TOTAL_LEN}，不需要收缩，等下一个整词。`

      steps.push({
        phase: 'probe',
        offset,
        track,
        left,
        right,
        word,
        inTarget: true,
        windowCount: { ...windowCount },
        matched,
        removedAt,
        results: results.slice(),
        recorded,
        note: `${obs}${judge}${act}`,
      })
    }
  }

  steps.push({
    phase: 'done',
    offset: -1,
    track: [],
    left: -1,
    right: -1,
    word: '',
    inTarget: false,
    windowCount: { ...TARGET },
    matched: KINDS,
    removedAt: -1,
    results: results.slice(),
    recorded: false,
    note: `观察：offset = 0、1、2 三条轨道都扫完了，只有 offset = 0 这条轨道上出现过 matched = ${KINDS} 的窗口。判断：matched = ${KINDS} 时 foo、bar 的窗口词频都恰好等于目标，窗口里不可能混入其他词，宽度又正好是 totalLen = ${TOTAL_LEN}，所以窗口内容一定是 words 的一个排列。动作：答案为 [${results.join(', ')}]，对应子串 ${results.map((r) => `"${S.slice(r, r + TOTAL_LEN)}"`).join('、')}。复杂度：每条轨道的 left、right 都只前进不回退，取一个词 O(wordLen)，共 ${WORD_LEN} 条轨道，总时间 O(n × wordLen)；额外空间是两个词频哈希表，O(m × wordLen)。`,
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

/** 下一步动作提示，必须是真正的下一个动作 */
function nextAction(step: Step): string {
  if (step.phase === 'init') return `进入 offset = 0 轨道，left = 0，取词 s[0..${WORD_LEN - 1}]`
  const nextRight = step.phase === 'offset' ? step.offset : step.right + WORD_LEN
  if (nextRight + WORD_LEN <= S.length) {
    return `right = ${nextRight}，取词 s[${nextRight}..${nextRight + WORD_LEN - 1}] = "${S.slice(nextRight, nextRight + WORD_LEN)}"`
  }
  if (step.offset + 1 < WORD_LEN) return `offset = ${step.offset} 轨道扫完，换 offset = ${step.offset + 1} 重开窗口`
  return '三条轨道全部扫完，输出答案'
}

function Stage(step: Step) {
  const n = CHARS.length
  const done = step.phase === 'done'
  const probing = step.phase === 'probe'
  const onTrack = probing || step.phase === 'offset'
  const winL = probing ? step.left : -1
  const winR = probing ? step.right + WORD_LEN - 1 : -1
  const hasWindow = probing && winR >= winL
  const matchedAll = probing && step.matched === KINDS
  const answers = step.results.map((r) => [r, r + TOTAL_LEN - 1] as const)
  const inAnswer = (i: number) => answers.some(([a, b]) => i >= a && i <= b)
  const hint = done ? null : nextAction(step)

  const stateOf = (i: number): CellState => {
    if (done) return inAnswer(i) ? 'ok' : 'dim'
    if (step.phase === 'init') return 'dim'
    if (probing && i >= step.right && i < step.right + WORD_LEN) return step.inTarget ? 'active' : 'bad'
    if (probing && step.removedAt >= 0 && i >= step.removedAt && i < step.removedAt + WORD_LEN) return 'warn'
    if (hasWindow && i >= winL && i <= winR) return 'new'
    return 'dim'
  }

  /** 单元格上方的文字标签：状态不能只靠颜色区分 */
  const tagOf = (i: number): { text: string; color: string } | null => {
    if (probing && i === step.right) return { text: `"${step.word}"`, color: step.inTarget ? TONE.amber : TONE.hard }
    if (probing && step.removedAt === i) return { text: '移出', color: TONE.medium }
    if (probing && step.recorded && i === step.left) return { text: '命中', color: TONE.easy }
    if (done && step.results.includes(i)) return { text: '答案', color: TONE.easy }
    return null
  }

  const caption = done
    ? `${WORD_LEN} 条轨道扫描完毕，绿色区间就是答案`
    : step.phase === 'init'
      ? '还没开始扫描'
      : step.phase === 'offset'
        ? `本轮 offset = ${step.offset}，只在 ${step.track.map((i) => `s[${i}]`).join('、')} 处切整词`
        : `offset = ${step.offset} 轨道，本步取词 s[${step.right}..${step.right + WORD_LEN - 1}]`

  const countLabel = done
    ? '命中窗口的词频 = 目标词频'
    : step.phase === 'init'
      ? 'windowCount：还没开始计数'
      : step.phase === 'offset'
        ? 'windowCount：本轮已清空'
        : 'windowCount（词 → 窗口 / 目标）'

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex w-full max-w-[720px] flex-col gap-1">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5">
          <span className="font-code text-[11px] text-ink-soft">{caption}</span>
          <span className="font-code text-[11px] text-ink-soft">
            wordLen = {WORD_LEN} ｜ totalLen = {TOTAL_LEN}
          </span>
        </div>

        {/* 词标签：本步读入的整词 / 被移出的词 / 答案起点 */}
        <div className="flex h-4 w-full">
          {CHARS.map((_, i) => {
            const tag = tagOf(i)
            return (
              <div key={i} className="flex min-w-0 flex-1 items-end justify-center">
                {tag && (
                  <span
                    className="whitespace-nowrap font-code text-[10px] font-bold"
                    style={{ color: tag.color }}
                  >
                    {tag.text}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {/* 指针旗标：left 在上、right 在下；同格时上下并列 */}
        <div className="flex h-12 w-full">
          {CHARS.map((_, i) => (
            <div key={i} className="flex min-w-0 flex-1 flex-col items-center justify-end">
              {onTrack && i === step.left && <Flag label="left" tone="amber" />}
              {probing && i === step.right && <Flag label="right" tone="teal" />}
            </div>
          ))}
        </div>

        {/* 字符行：窗口区间用半透明色块整体包裹，词频全对时转绿 */}
        <div className="relative flex w-full">
          {hasWindow && (
            <div
              className={cn(
                'pointer-events-none absolute -inset-y-1 rounded-lg border-[1.5px] transition-all duration-300',
                matchedAll
                  ? 'border-[hsl(var(--easy))]/60 bg-[hsl(var(--easy))]/15'
                  : 'border-[hsl(var(--amber))]/50 bg-[hsl(var(--amber))]/15'
              )}
              style={{
                left: `${(winL / n) * 100}%`,
                width: `${((winR - winL + 1) / n) * 100}%`,
              }}
            />
          )}
          {done &&
            answers.map(([a, b]) => (
              <div
                key={a}
                className="pointer-events-none absolute -inset-y-1 rounded-lg border-[1.5px] border-[hsl(var(--easy))]/60 bg-[hsl(var(--easy))]/15 transition-all duration-300"
                style={{ left: `${(a / n) * 100}%`, width: `${((b - a + 1) / n) * 100}%` }}
              />
            ))}
          {CHARS.map((ch, i) => (
            <div key={i} className="flex min-w-0 flex-1 justify-center px-px">
              <Cell state={stateOf(i)} size="sm" className="w-full min-w-0 px-0 sm:min-w-0">
                {ch}
              </Cell>
            </div>
          ))}
        </div>

        {/* 下标：当前轨道上的位置加粗，便于看出「按 wordLen 分组」 */}
        <div className="mt-1 flex w-full">
          {CHARS.map((_, i) => (
            <span
              key={i}
              className={cn(
                'min-w-0 flex-1 text-center font-code text-[10px]',
                onTrack && (i - step.offset) % WORD_LEN === 0 ? 'font-semibold text-ink' : 'text-ink-soft'
              )}
            >
              {i}
            </span>
          ))}
        </div>
      </div>

      {/* 词 → 次数 行：windowCount 与 targetCount 对照 */}
      <div className="flex w-full max-w-[720px] flex-wrap items-center justify-center gap-1.5">
        <span className="text-[11px] text-ink-soft">{countLabel}</span>
        {TARGET_KEYS.map((w) => {
          const got = step.windowCount[w] ?? 0
          const need = TARGET[w]
          const current = probing && step.word === w
          return (
            <span
              key={w}
              className={cn(
                'rounded-md border px-2 py-0.5 font-code text-[11px] font-semibold',
                current
                  ? 'border-[hsl(var(--amber))]/40 bg-[hsl(var(--amber-soft))] text-[hsl(var(--amber))]'
                  : got === need
                    ? 'border-[hsl(var(--easy))]/40 bg-[hsl(var(--easy-soft))] text-[hsl(var(--easy))]'
                    : 'border-border bg-card text-ink-soft'
              )}
            >
              {w} → {got} / {need}
            </span>
          )
        })}
      </div>

      <Badges className="justify-center">
        <Stat label="offset" value={onTrack ? step.offset : '—'} tone="amber" />
        <Stat
          label="matched / 种类"
          value={`${step.matched} / ${KINDS}`}
          tone={step.matched === KINDS ? 'easy' : 'teal'}
        />
        <Stat label="已找到起点" value={`[${step.results.join(', ')}]`} tone="easy" />
        {hint && (
          <Hint>
            <span className="font-code">{hint}</span>
          </Hint>
        )}
        {done && (
          <Answer>
            {`起点 `}
            <span className="font-code">{`[${step.results.join(', ')}]`}</span>
            {` — `}
            <span className="font-code">
              {step.results.map((r) => `"${S.slice(r, r + TOTAL_LEN)}"`).join('、')}
            </span>
          </Answer>
        )}
      </Badges>
    </div>
  )
}

export default function SubstringWithConcatenationOfAllWordsDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="按单词步长分组的定长滑窗找串联子串"
      info={`输入：s = "${S}"，words = [${WORDS.map((w) => `"${w}"`).join(', ')}]（题解示例 1，答案 [0, 9]）。所有单词长度相同 wordLen = ${WORD_LEN}，串联子串长度固定为 totalLen = ${TOTAL_LEN}，起点按 i mod ${WORD_LEN} 归入 3 条对齐轨道；演示把 offset = 0、1、2 三条轨道全部走完，共 ${steps.length} 步。其中 offset = 1、2 两条轨道上切出的词（arf / oot / hef / oba / arm、rfo / oth / efo / oba / rma）都不在 words 中，只会触发窗口清空，命中全部来自 offset = 0。`}
      steps={steps}
      autoMs={1500}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '窗口区间 [left, right + wordLen) / 本步读入的整词' },
        { color: TONE.teal, label: 'right 指针 / 窗口内已计入 windowCount 的词' },
        { color: TONE.easy, label: '词频与目标完全一致（记录起点）/ 最终答案区间' },
        { color: TONE.hard, label: '不在 words 中的词：窗口清空并跳过' },
        { color: TONE.muted, label: '窗口外未处理' },
      ]}
    />
  )
}
