import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badges, Cell, Flag, Hint, Stat, TONE, type CellState } from './stage'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/* 41. 单词规律 —— 模式 A：模式字符行 / 单词行上下对齐，                   */
/* 配两张「键 → 值」映射行（p2w、w2p），映射冲突用 hard 红                  */
/* ------------------------------------------------------------------ */

/** 固定的示例输入（题解示例 2：pattern = "abba"、s = "dog cat cat fish"，输出 false） */
const PATTERN = 'abba'
const S = 'dog cat cat fish'

const CHARS = PATTERN.split('')
const WORDS = S.split(' ')

/** p2w 的键：pattern 中字母按首次出现顺序固定列出 */
const P_KEYS = Array.from(new Set(CHARS))
/** w2p 的键：s 中单词按首次出现顺序固定列出 */
const W_KEYS = Array.from(new Set(WORDS))

/** 聚焦键在某张表里的状态：absent=还没记录、fresh=本步刚写入、same=已有且一致、clash=与已有记录冲突 */
type Focus = 'none' | 'absent' | 'fresh' | 'same' | 'clash'

interface Step {
  phase: 'init' | 'check-p2w' | 'check-w2p' | 'fail' | 'done'
  /** 当前组下标（0 起算），-1 表示还没开始，done 且失败时停在冲突组 */
  i: number
  /** p2w 快照：pattern 字母 → 单词 */
  p2w: Partial<Record<string, string>>
  /** w2p 快照：单词 → pattern 字母 */
  w2p: Partial<Record<string, string>>
  /** 本步聚焦的 p2w 键（正在查这张表），null 表示本步不查它 */
  focusP: string | null
  /** 本步聚焦的 w2p 键，null 表示本步不查它 */
  focusW: string | null
  pFocus: Focus
  wFocus: Focus
  /** 真正的下一步动作，done 步为 null */
  hint: string | null
  /** 只在 done 步出现 */
  answer: string | null
  note: string
}

function buildSteps(): Step[] {
  const n = CHARS.length
  const steps: Step[] = []
  const p2w: Record<string, string> = {}
  const w2p: Record<string, string> = {}

  const push = (s: Omit<Step, 'p2w' | 'w2p'>) => {
    // 快照必须不可变：两张表都浅拷贝一份
    steps.push({ ...s, p2w: { ...p2w }, w2p: { ...w2p } })
  }

  /** 上一组查完后进入下一组的提示；已经没有下一组时就是收敛提示 */
  const nextPairHint = (i: number): string => {
    const next = i + 1
    if (next >= n) return '配对全部检查完，返回 true'
    return `i 右移到 ${next}，检查 pattern[${next}] = "${CHARS[next]}" 在 p2w 中的记录`
  }

  push({
    phase: 'init',
    i: -1,
    focusP: null,
    focusW: null,
    pFocus: 'none',
    wFocus: 'none',
    hint: `检查 pattern[0] = "${CHARS[0]}" 在 p2w 中的记录`,
    answer: null,
    note: `观察：s 按单个空格切成 [${WORDS.join(', ')}] 共 ${WORDS.length} 个单词，pattern "${PATTERN}" 有 ${n} 个字母。判断：两者数量相等，才有一一对应的可能，可以继续往下查。动作：建立两张空表 p2w（字母 → 单词）与 w2p（单词 → 字母），从 i = 0 起同步逐组检查。为什么：长度相等只是必要条件，答案取决于两张映射表是否全程自洽。`,
  })

  let failed = false
  let failI = -1
  let failKind: 'p2w' | 'w2p' = 'p2w'
  let failHave = ''
  let failWant = ''

  for (let i = 0; i < n; i++) {
    const pch = CHARS[i]
    const word = WORDS[i]
    const hasP = Object.prototype.hasOwnProperty.call(p2w, pch)
    const hasW = Object.prototype.hasOwnProperty.call(w2p, word)

    /* ---- 方向一：pattern 字母 → 单词 ---- */
    if (hasP && p2w[pch] !== word) {
      failed = true
      failI = i
      failKind = 'p2w'
      failHave = p2w[pch]
      failWant = word
      push({
        phase: 'fail',
        i,
        focusP: pch,
        focusW: null,
        pFocus: 'clash',
        wFocus: 'none',
        hint: '返回 false，终止遍历',
        answer: null,
        note: `观察：pattern[${i}] = "${pch}"，words[${i}] = "${word}"；但 p2w["${pch}"] 早已记着 "${p2w[pch]}"。判断：同一个模式字母现在被要求对应 "${word}"，这个方向出现矛盾。动作：立即返回 false，连 w2p 都不必再查。为什么：双向映射要求 "${pch}" 始终指向同一个单词，"${p2w[pch]}" 与 "${word}" 不同，双射不存在。`,
      })
      break
    }

    if (hasP) {
      push({
        phase: 'check-p2w',
        i,
        focusP: pch,
        focusW: null,
        pFocus: 'same',
        wFocus: 'none',
        hint: `检查 words[${i}] = "${word}" 在 w2p 中的记录`,
        answer: null,
        note: `观察：pattern[${i}] = "${pch}"，words[${i}] = "${word}"；p2w["${pch}"] = "${p2w[pch]}" 已经存在。判断：已有映射与当前这组完全相同，这个方向一致。动作：不改动 p2w，接着查反方向 w2p["${word}"]。为什么：字母 "${pch}" 重复出现时必须落在同一个单词上，只看一个方向会漏判。`,
      })
    } else {
      const known = Object.keys(p2w)
      const table = known.length === 0 ? '还是空表' : `里只有 ${known.map((k) => `"${k}" → "${p2w[k]}"`).join('、')}`
      push({
        phase: 'check-p2w',
        i,
        focusP: pch,
        focusW: null,
        pFocus: 'absent',
        wFocus: 'none',
        hint: `检查 words[${i}] = "${word}" 在 w2p 中的记录`,
        answer: null,
        note: `观察：pattern[${i}] = "${pch}"，words[${i}] = "${word}"；p2w ${table}，没有 "${pch}" 的记录。判断：这个方向不存在冲突，可以新建映射。动作：记下候选 p2w["${pch}"] = "${word}"，再查 w2p 里有没有 "${word}"。为什么：不同字母必须对应不同单词，这一关只能靠反方向的表来把守。`,
      })
    }

    /* ---- 方向二：单词 → pattern 字母 ---- */
    if (hasW && w2p[word] !== pch) {
      failed = true
      failI = i
      failKind = 'w2p'
      failHave = w2p[word]
      failWant = pch
      push({
        phase: 'fail',
        i,
        focusP: null,
        focusW: word,
        pFocus: 'none',
        wFocus: 'clash',
        hint: '返回 false，终止遍历',
        answer: null,
        note: `观察：pattern[${i}] = "${pch}"，words[${i}] = "${word}"；但 w2p["${word}"] 早已记着 "${w2p[word]}"。判断：同一个单词现在被要求对应两个不同字母，这个方向出现矛盾。动作：立即返回 false，本组不写入任何映射。为什么：w2p 保证每个单词只对应一个字母，否则 "${w2p[word]}" 与 "${pch}" 会同时绑到 "${word}" 上。`,
      })
      break
    }

    const fresh = !hasP && !hasW
    p2w[pch] = word
    w2p[word] = pch
    push({
      phase: 'check-w2p',
      i,
      focusP: null,
      focusW: word,
      pFocus: 'none',
      wFocus: fresh ? 'fresh' : 'same',
      hint: nextPairHint(i),
      answer: null,
      note: fresh
        ? `观察：w2p 里没有 "${word}" 的记录，反方向也没有冲突。判断：两个方向都放行，这组配对成立。动作：写入 p2w["${pch}"] = "${word}" 与 w2p["${word}"] = "${pch}"，两张表现在各有 ${Object.keys(p2w).length} 条记录。为什么：两个方向同时登记，字母与单词才能互相唯一。`
        : `观察：w2p["${word}"] = "${pch}" 也已经存在，两个方向都指向同一组 "${pch}" ⇄ "${word}"。判断：重复的配对只是重复确认，没有矛盾。动作：两张表都保持不变，继续检查下一组。为什么：只有「键对应的值不一致」才算冲突，单纯重复不会破坏映射。`,
    })
  }

  const pairs = Object.keys(p2w).length
  push({
    phase: 'done',
    i: failed ? failI : n,
    focusP: failed && failKind === 'p2w' ? CHARS[failI] : null,
    focusW: failed && failKind === 'w2p' ? WORDS[failI] : null,
    pFocus: failed && failKind === 'p2w' ? 'clash' : 'none',
    wFocus: failed && failKind === 'w2p' ? 'clash' : 'none',
    hint: null,
    answer: failed
      ? failKind === 'p2w'
        ? `false：p2w["${CHARS[failI]}"] = "${failHave}"，第 ${failI} 组却要求 "${failWant}"`
        : `false：w2p["${WORDS[failI]}"] = "${failHave}"，第 ${failI} 组却要求 "${failWant}"`
      : `true：${pairs} 组配对的双向映射全程自洽`,
    note: failed
      ? `观察：冲突在第 ${failI} 组被检出 —— ${
          failKind === 'p2w'
            ? `p2w["${CHARS[failI]}"] 已经是 "${failHave}"，这组却要求它对应 "${failWant}"`
            : `w2p["${WORDS[failI]}"] 已经是 "${failHave}"，这组却要求它对应 "${failWant}"`
        }，同一侧出现了两个不同的对应值。判断：只要有一组映射矛盾，双向一一对应就不存在，后面还没查的配对无需再查。动作：返回 false，与题解示例 2 的输出一致。复杂度：时间 O(n + m)、空间 O(n + m)，n 为 pattern 长度、m 为 s 长度。`
      : `观察：${n} 组配对全部检查完，p2w 与 w2p 两张表始终自洽。判断：已建立的双向映射能覆盖整个输入，s 完全遵循 pattern 的规律。动作：返回 true。复杂度：时间 O(n + m)、空间 O(n + m)，n 为 pattern 长度、m 为 s 长度。`,
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

const CHIP =
  'rounded-md border px-2 py-0.5 font-code text-[11px] font-semibold transition-colors duration-200'

const CHIP_TONE = {
  focus: 'border-[hsl(var(--amber))]/50 bg-[hsl(var(--amber-soft))] text-[hsl(var(--amber))]',
  easy: 'border-[hsl(var(--easy))]/40 bg-[hsl(var(--easy-soft))] text-[hsl(var(--easy))]',
  clash: 'border-[hsl(var(--hard))]/40 bg-[hsl(var(--hard-soft))] text-[hsl(var(--hard))]',
  blank: 'border-border bg-[hsl(var(--ink)/0.18)] text-ink-soft',
} as const

/** 映射表里的一条「键 → 值」，status 是文字标签，保证不靠颜色也能读出状态 */
function Chip({
  from,
  to,
  status,
  tone,
}: {
  from: string
  to: string
  status?: string
  tone: keyof typeof CHIP_TONE
}) {
  return (
    <span className={cn(CHIP, CHIP_TONE[tone])}>
      {from} → {to}
      {status && <span className="ml-1 font-normal opacity-80">{status}</span>}
    </span>
  )
}

function Stage(step: Step) {
  const n = CHARS.length
  const pairs = Object.keys(step.p2w).length
  const stuck = step.phase === 'fail' || step.phase === 'done'

  const cellState = (i: number): CellState => {
    if (step.phase === 'init') return 'idle'
    if (i === step.i) return stuck ? 'bad' : 'active'
    if (i < step.i) return 'ok'
    return 'dim'
  }

  const mapRow = (
    title: string,
    keys: string[],
    map: Partial<Record<string, string>>,
    focusKey: string | null,
    focusState: Focus
  ) => (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 sm:items-start">
      <span className="text-[11px] text-ink-soft">{title}</span>
      <div className="flex flex-wrap justify-center gap-1.5 sm:justify-start">
        {keys.map((k) => {
          const v = map[k]
          if (k === focusKey && focusState === 'clash') {
            return <Chip key={k} from={k} to={v ?? '—'} status="冲突" tone="clash" />
          }
          if (k === focusKey && focusState === 'absent') {
            return <Chip key={k} from={k} to="待写入" status="无记录" tone="focus" />
          }
          if (k === focusKey && focusState === 'fresh') {
            return <Chip key={k} from={k} to={v ?? '—'} status="新写入" tone="focus" />
          }
          if (k === focusKey) {
            return <Chip key={k} from={k} to={v ?? '—'} status="一致" tone="focus" />
          }
          if (v === undefined) return <Chip key={k} from={k} to="—" tone="blank" />
          return <Chip key={k} from={k} to={v} tone="easy" />
        })}
      </div>
    </div>
  )

  return (
    <div className="flex flex-col items-center gap-3">
      {/* 上下对齐的主行：旗标 → 模式字符 → ↔ → 单词 → 组号 */}
      <div className="w-full max-w-[560px]">
        <div className="flex h-6 w-full">
          {CHARS.map((_, i) => (
            <div key={i} className="flex min-w-0 flex-1 items-end justify-center">
              {i === step.i && <Flag label={`i=${i}`} tone={stuck ? 'hard' : 'amber'} />}
            </div>
          ))}
        </div>

        <div className="flex w-full">
          {CHARS.map((ch, i) => (
            <div key={i} className="flex min-w-0 flex-1 justify-center px-[3px]">
              <Cell state={cellState(i)} className="w-full min-w-0 sm:min-w-0">
                {ch}
              </Cell>
            </div>
          ))}
        </div>

        <div className="flex w-full">
          {CHARS.map((_, i) => (
            <div
              key={i}
              className="flex min-w-0 flex-1 items-center justify-center font-code text-[11px] leading-5 text-ink-soft"
            >
              ↔
            </div>
          ))}
        </div>

        <div className="flex w-full">
          {WORDS.map((w, i) => (
            <div key={i} className="flex min-w-0 flex-1 justify-center px-[3px]">
              <Cell state={cellState(i)} className="w-full min-w-0 sm:min-w-0">
                {w}
              </Cell>
            </div>
          ))}
        </div>

        <div className="mt-1 flex w-full">
          {CHARS.map((_, i) => (
            <span key={i} className="min-w-0 flex-1 text-center font-code text-[11px] text-ink-soft">
              {i}
            </span>
          ))}
        </div>
      </div>

      {/* 两张映射表：窄屏上下排、宽屏左右排 */}
      <div className="flex w-full flex-col gap-2 sm:flex-row sm:gap-4">
        {mapRow('p2w：模式字母 → 单词', P_KEYS, step.p2w, step.focusP, step.pFocus)}
        {mapRow('w2p：单词 → 模式字母', W_KEYS, step.w2p, step.focusW, step.wFocus)}
      </div>

      <Badges className="justify-center">
        <Stat label="已建立映射" value={`${pairs} 对`} tone="easy" />
        <Stat
          label="当前组"
          value={step.i >= 0 && step.i < n ? `i = ${step.i}` : '—'}
          tone="amber"
        />
        {step.hint && <Hint>{step.hint}</Hint>}
        {step.phase === 'done' && step.answer && <Answer>{step.answer}</Answer>}
      </Badges>
    </div>
  )
}

export default function WordPatternDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="单词规律：模式字符 ↔ 单词双向映射"
      info={`pattern = "${PATTERN}"、s = "${S}"（题解示例 2，输出 false，共 ${steps.length} 步）。取示例 2 而不是示例 1：两者规模相同（4 组配对），但示例 1 全程自洽、看不到 hard 红的映射矛盾路径；两张表的键按它们在输入中首次出现的顺序固定列出，值显示 — 表示尚未登记。`}
      steps={steps}
      autoMs={1500}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '本步聚焦：当前组的一对 / 正在查的那张表的键' },
        { color: TONE.easy, label: '已确认一致：已通过的组与已建立的映射' },
        { color: TONE.hard, label: '冲突：该键已对应别的值，返回 false' },
        { color: TONE.muted, label: '尚未处理：未检查的组 / 值为 — 的键' },
      ]}
    />
  )
}
