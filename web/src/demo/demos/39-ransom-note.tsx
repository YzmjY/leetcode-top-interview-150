import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badges, Cell, Flag, Hint, Stat, TONE, type CellState } from './stage'

/* ------------------------------------------------------------------ */
/* 39. 赎金信 —— 模式 A：两行字符 + 「字符 → 剩余次数」计数组件          */
/* ------------------------------------------------------------------ */

/** 题解示例 2：ransomNote = "aa"，magazine = "ab"（输出 false） */
const RANSOM = 'aa'
const MAGAZINE = 'ab'
const RANSOM_CHARS = RANSOM.split('')
const MAGAZINE_CHARS = MAGAZINE.split('')
/** cnt 里要展示的字符：两串出现过的字母去重后按字母序，本例即 a / b */
const LETTERS = Array.from(new Set([...MAGAZINE_CHARS, ...RANSOM_CHARS])).sort()

/** 字母 → 计数数组下标（cnt[c − 'a']） */
const IDX = (ch: string) => ch.charCodeAt(0) - 'a'.charCodeAt(0)

interface Step {
  /** cnt[26] 的快照 */
  cnt: number[]
  /** 第一遍正在统计的 magazine 下标；−1 表示不在第一遍 */
  magIdx: number
  /** 第二遍正在取用的 ransomNote 下标；−1 表示还没开始第二遍 */
  ranIdx: number
  /** 本步被改动的 cnt 下标；−1 表示没有改动 */
  changed: number
  /** 第一遍已统计的 magazine 字符数 */
  counted: number
  /** 第二遍已成功取用的 ransomNote 字符数 */
  spent: number
  /** 减出负数的字符下标，未出现为 −1（done 步仍保留） */
  failIdx: number
  phase: 'init' | 'count' | 'spend' | 'fail' | 'done'
  note: string
}

function buildSteps(): Step[] {
  const cnt = new Array<number>(26).fill(0)
  const steps: Step[] = []
  let counted = 0
  let spent = 0
  let failIdx = -1

  const push = (
    phase: Step['phase'],
    magIdx: number,
    ranIdx: number,
    changed: number,
    note: string
  ) => {
    steps.push({
      cnt: cnt.slice(),
      magIdx,
      ranIdx,
      changed,
      counted,
      spent,
      failIdx,
      phase,
      note,
    })
  }

  push(
    'init',
    -1,
    -1,
    -1,
    `初始化：cnt[26] 全部为 0，cnt[k] 表示 magazine 里还剩几个可用的字母 k。第一遍完整扫描 magazine = "${MAGAZINE}" 把库存记进 cnt，第二遍再用 ransomNote = "${RANSOM}" 逐个取用。不变量：取用完 ransomNote 的前 i 个字符后，cnt[k] 恰好等于「magazine 中 k 的个数 − 前 i 个字符中 k 的个数」。`
  )

  for (let j = 0; j < MAGAZINE_CHARS.length; j++) {
    const ch = MAGAZINE_CHARS[j]
    const k = IDX(ch)
    const before = cnt[k]
    cnt[k] += 1
    counted = j + 1
    push(
      'count',
      j,
      -1,
      k,
      `观察：magazine[${j}] = "${ch}"，'${ch}' − 'a' = ${k}，落在 cnt 的第 ${k} 格。动作：cnt[${k}] 由 ${before} 加 1 变成 ${cnt[k]}，库存里记下 ${cnt[k]} 个 "${ch}"。为什么用数组：小写字母只有 26 个，下标 c − 'a' 必落在 0–25，数组定位是 O(1) 且没有哈希碰撞开销。`
    )
  }

  for (let i = 0; i < RANSOM_CHARS.length; i++) {
    const ch = RANSOM_CHARS[i]
    const k = IDX(ch)
    const before = cnt[k]
    cnt[k] -= 1
    if (cnt[k] < 0) {
      failIdx = i
      push(
        'fail',
        MAGAZINE_CHARS.length,
        i,
        k,
        `观察：ransomNote[${i}] = "${ch}"，而此刻 cnt[${k}] = ${before}。判断：减 1 后 cnt[${k}] = ${cnt[k]} < 0，magazine 里唯一的那个 "${ch}" 已被上一个字符用掉，而每个字符只能用一次。动作：立即返回 false，后面的字符不再检查。`
      )
      break
    }
    spent = i + 1
    push(
      'spend',
      MAGAZINE_CHARS.length,
      i,
      k,
      `观察：ransomNote[${i}] = "${ch}"，查表得 cnt[${k}] = ${before}。判断：减 1 后 cnt[${k}] = ${cnt[k]}，并不小于 0，说明这个 "${ch}" 刚好够用一次 —— 判据是 < 0 而不是 == 0，等于 0 不算失败。动作：取走这个 "${ch}"，转向下一个字符。`
    )
  }

  if (failIdx < 0) {
    push(
      'done',
      MAGAZINE_CHARS.length,
      RANSOM_CHARS.length,
      -1,
      `ransomNote 的 ${RANSOM_CHARS.length} 个字符全部取用完毕，中途没有任何计数变成负数，返回 true。复杂度：两串各遍历一次 O(n + m)，计数数组固定 26 位，空间 O(1)。`
    )
  } else {
    push(
      'done',
      MAGAZINE_CHARS.length,
      failIdx,
      -1,
      `ransomNote[${failIdx}] 处 cnt['${RANSOM_CHARS[failIdx]}'] 被减成 −1：magazine = "${MAGAZINE}" 里只有 1 个 "${RANSOM_CHARS[failIdx]}"，凑不出 ransomNote = "${RANSOM}"，返回 false。注意 ransomNote[0] 把 cnt['${RANSOM_CHARS[0]}'] 正好减到 0 时并没有失败，判据严格是 < 0。复杂度：两串各遍历一次 O(n + m)，计数数组固定 26 位，空间 O(1)。`
    )
  }

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

function nextAction(step: Step): string | null {
  if (step.phase === 'done') return null
  if (step.phase === 'init') {
    return `统计 magazine[0] = "${MAGAZINE_CHARS[0]}"，cnt[${IDX(MAGAZINE_CHARS[0])}] 加 1`
  }
  if (step.phase === 'count') {
    const j = step.magIdx + 1
    if (j < MAGAZINE_CHARS.length) {
      return `统计 magazine[${j}] = "${MAGAZINE_CHARS[j]}"，cnt[${IDX(MAGAZINE_CHARS[j])}] 加 1`
    }
    return `magazine 统计完毕，取用 ransomNote[0] = "${RANSOM_CHARS[0]}"，cnt[${IDX(RANSOM_CHARS[0])}] 减 1`
  }
  if (step.phase === 'fail') return '返回 false，不再检查剩余的 ransomNote 字符'
  const i = step.ranIdx + 1
  if (i < RANSOM_CHARS.length) {
    return `取用 ransomNote[${i}] = "${RANSOM_CHARS[i]}"，cnt[${IDX(RANSOM_CHARS[i])}] 减 1`
  }
  return 'ransomNote 取用完毕，全部计数非负，返回 true'
}

function Stage(step: Step) {
  const done = step.phase === 'done'
  const ok = step.failIdx < 0
  const hint = nextAction(step)

  const magState = (i: number): CellState => {
    if (step.phase === 'init') return 'dim'
    if (step.phase === 'count') {
      if (i === step.magIdx) return 'active'
      return i < step.magIdx ? 'ok' : 'dim'
    }
    return 'ok'
  }

  const ranState = (i: number): CellState => {
    if (step.phase === 'init' || step.phase === 'count') return 'dim'
    if (done) {
      if (ok) return 'ok'
      return i < step.failIdx ? 'ok' : i === step.failIdx ? 'bad' : 'dim'
    }
    if (i < step.ranIdx) return 'ok'
    if (i === step.ranIdx) return step.phase === 'fail' ? 'bad' : 'active'
    return 'dim'
  }

  /** 计数组件：这一格的剩余次数 */
  const chipState = (k: number): CellState => {
    const v = step.cnt[k]
    if (v < 0) return 'bad'
    if (step.changed === k) return 'active'
    if (v > 0) return 'ok'
    return 'dim'
  }

  /** 计数组件上的文字标注（保证不只靠颜色区分状态） */
  const chipWord = (k: number, v: number): string => {
    if (v < 0) return '不足'
    if (step.changed === k) {
      if (step.phase === 'count') return '本步 +1'
      return v === 0 ? '刚好用完' : '本步 −1'
    }
    return v > 0 ? '还剩' : '用尽'
  }

  const chipWordColor = (k: number, v: number): string | undefined => {
    if (v < 0) return TONE.hard
    if (step.changed === k) return TONE.amber
    return undefined
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex w-full flex-col items-center gap-2.5">
        {/* 第一遍：magazine 字符行 */}
        <div className="flex w-full flex-col items-center gap-1">
          <span className="font-code text-[11px] text-ink-soft">
            magazine = &quot;{MAGAZINE}&quot;（第一遍：统计库存）
          </span>
          <div className="flex w-full flex-wrap justify-center gap-1.5">
            {MAGAZINE_CHARS.map((ch, i) => (
              <div key={i} className="flex w-11 flex-col items-center sm:w-14">
                <Flag
                  label={step.phase === 'count' && i === step.magIdx ? '统计' : undefined}
                  tone="amber"
                />
                <Cell state={magState(i)} className="w-full min-w-0">
                  {ch}
                </Cell>
                <span className="mt-1 font-code text-[11px] text-ink-soft">{i}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 第二遍：ransomNote 字符行 */}
        <div className="flex w-full flex-col items-center gap-1">
          <span className="font-code text-[11px] text-ink-soft">
            ransomNote = &quot;{RANSOM}&quot;（第二遍：逐个取用）
          </span>
          <div className="flex w-full flex-wrap justify-center gap-1.5">
            {RANSOM_CHARS.map((ch, i) => (
              <div key={i} className="flex w-11 flex-col items-center sm:w-14">
                <Flag
                  label={
                    !done && i === step.ranIdx
                      ? step.phase === 'fail'
                        ? '拿不到'
                        : '取用'
                      : undefined
                  }
                  tone={step.phase === 'fail' ? 'hard' : 'amber'}
                />
                <Cell state={ranState(i)} className="w-full min-w-0">
                  {ch}
                </Cell>
                <span className="mt-1 font-code text-[11px] text-ink-soft">{i}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 字符 → 剩余可用次数 */}
      <div className="flex w-full flex-col items-center gap-1.5">
        <span className="text-[11px] text-ink-soft">
          字符 → 剩余次数 <span className="font-code">cnt[c − &apos;a&apos;]</span>
        </span>
        <div className="flex w-full flex-wrap justify-center gap-1.5">
          {LETTERS.map((ch) => {
            const k = IDX(ch)
            const v = step.cnt[k]
            const wordColor = chipWordColor(k, v)
            return (
              <div key={ch} className="flex w-14 flex-col items-center sm:w-16">
                <span
                  className="flex h-4 items-end whitespace-nowrap text-[10px] font-bold"
                  style={wordColor ? { color: wordColor } : undefined}
                >
                  {chipWord(k, v)}
                </span>
                <Cell size="sm" state={chipState(k)} className="w-full min-w-0">
                  {v}
                </Cell>
                <span className="mt-1 font-code text-[11px] text-ink-soft">{ch}</span>
              </div>
            )
          })}
        </div>
      </div>

      <Badges className="justify-center">
        <Stat
          label="magazine 已统计"
          value={`${step.counted} / ${MAGAZINE_CHARS.length}`}
          tone="amber"
        />
        <Stat
          label="ransomNote 已取用"
          value={`${step.spent} / ${RANSOM_CHARS.length}`}
          tone="teal"
        />
        {hint && <Hint tone={step.phase === 'fail' ? 'hard' : 'teal'}>{hint}</Hint>}
        {done && (
          <Answer>
            canConstruct(&quot;{RANSOM}&quot;, &quot;{MAGAZINE}&quot;) = false —— magazine 只有 1 个
            &quot;a&quot;，第 2 个 &quot;a&quot; 取不到
          </Answer>
        )}
      </Badges>
    </div>
  )
}

export default function RansomNoteDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="26 格计数数组当字符库存"
      info={`输入：ransomNote = "${RANSOM}"，magazine = "${MAGAZINE}"（题解示例 2，输出 false）。先用 magazine 每个字符给 cnt[c − 'a'] 加 1 记账，再用 ransomNote 逐个减 1 取用；选这条官方示例是因为它规模最小，又能同时看到「刚好用完（减到 0 仍通过）」与「减成负数（返回 false）」两种情形。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '本步正在统计/取用的字符，或刚被改动的计数' },
        { color: TONE.easy, label: '已统计入库 / 剩余次数为正' },
        { color: TONE.hard, label: '剩余次数被减成负数，该字符拿不到' },
        { color: TONE.muted, label: '尚未处理 / 剩余次数为 0' },
      ]}
    />
  )
}
