import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badges, Cell, Flag, Hint, Stat, TONE, type CellState } from './stage'

/* ------------------------------------------------------------------ */
/* 42. 有效的字母异位词 —— 模式 A：两行字符 + 字符→计数差行              */
/* ------------------------------------------------------------------ */

/** 示例 1：s = "anagram"，t = "nagaram"（题解示例中最小且能走到 true 的一组） */
const S = 'anagram'
const T = 'nagaram'
const CHARS_S = S.split('')
const CHARS_T = T.split('')
/** 两串字母去重后按字母序排列，本例即 a / g / m / n / r */
const LETTERS = Array.from(new Set((S + T).split(''))).sort()

/** 字母 → 计数数组下标（cnt[s[i] - 'a']） */
const IDX = (ch: string) => ch.charCodeAt(0) - 'a'.charCodeAt(0)

type Diff = Record<string, number>

interface Step {
  /** 本步参与加减的字母：s 里读入的、t 里读入的；verify / done 步为空 */
  plus: string
  minus: string
  /** 已处理的对数 */
  doneCount: number
  /** 当前处理的下标；init 为 −1 */
  i: number
  diff: Diff
  phase: 'init' | 'pair' | 'verify' | 'done'
  note: string
}

function buildSteps(): Step[] {
  const steps: Step[] = []
  const cnt = new Array<number>(26).fill(0)
  const snapshot = (): Diff => {
    const copy: Diff = {}
    LETTERS.forEach((ch) => {
      copy[ch] = cnt[IDX(ch)]
    })
    return copy
  }

  const n = S.length
  const nonzero = () => LETTERS.filter((ch) => cnt[IDX(ch)] !== 0)

  steps.push({
    i: -1,
    plus: '',
    minus: '',
    doneCount: 0,
    diff: snapshot(),
    phase: 'init',
    note: `观察：len(s) = ${n}，len(t) = ${T.length}，长度相等，不会触发「长度不等直接返回 false」这条提前退出。判断：长度相同才有必要继续比对字符频次，且各字母的加减差值之和必为 0。动作：建立长度 26 的计数数组 cnt，s 的字符 +1、t 的字符 −1，随后逐位配对处理。`,
  })

  for (let i = 0; i < n; i++) {
    const plus = CHARS_S[i]
    const minus = CHARS_T[i]
    cnt[IDX(plus)] += 1
    cnt[IDX(minus)] -= 1
    const same = plus === minus
    steps.push({
      i,
      plus,
      minus,
      doneCount: i + 1,
      diff: snapshot(),
      phase: 'pair',
      note: `观察：s[${i}] = "${plus}"，t[${i}] = "${minus}"。判断：cnt['${plus}'] 加 1、cnt['${minus}'] 减 1，${
        same ? '两个字母相同，这一对加一减一互相抵消，差值不变' : `字母不同，"${plus}" 与 "${minus}" 的差值各自朝相反方向移动`
      }。动作：第 ${i} 对处理完毕，差值数组变为 ${LETTERS.map((ch) => `${ch}:${cnt[IDX(ch)]}`).join('，')}。`,
    })
  }

  const rest = nonzero()
  steps.push({
    i: n,
    plus: '',
    minus: '',
    doneCount: n,
    diff: snapshot(),
    phase: 'verify',
    note: `观察：两串各 ${n} 个字符已逐位配对处理完，差值数组为 ${LETTERS.map((ch) => `${ch}:${cnt[IDX(ch)]}`).join('，')}。判断：${
      rest.length === 0
        ? '每个字母的 +1 与 −1 次数完全相等，所有桶都回到 0'
        : `仍有 ${rest.length} 个字母未被抵消（${rest.map((ch) => `${ch}=${cnt[IDX(ch)]}`).join('，')}）`
    }。动作：进入收尾循环，逐位检查 26 个桶是否全为 0（画面上只画出两串出现过的 5 个字母，其余 21 个桶从未被加减、必然为 0）。`,
  })

  steps.push({
    i: n,
    plus: '',
    minus: '',
    doneCount: n,
    diff: snapshot(),
    phase: 'done',
    note: `观察：差值行全为 0，即对每个字母都有 count_s(c) = count_t(c)。判断：这正是字母异位词的定义，所以 t 是 s 的字母异位词。动作：返回 true。复杂度：两串各遍历一次、再扫 26 个桶一次，时间 O(n)，计数数组固定 26 位，空间 O(1)。`,
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

function nextAction(step: Step): string | null {
  if (step.phase === 'done') return null
  if (step.phase === 'init') {
    return `读取第 0 对：s[0] = "${CHARS_S[0]}" 计 +1，t[0] = "${CHARS_T[0]}" 计 −1`
  }
  if (step.phase === 'verify') return '全部为 0 → 返回 true，给出结论'
  if (step.i + 1 < CHARS_S.length) {
    return `读取第 ${step.i + 1} 对：s[${step.i + 1}] = "${CHARS_S[step.i + 1]}"，t[${step.i + 1}] = "${
      CHARS_T[step.i + 1]
    }"`
  }
  return '两串处理完毕，转入收尾检查'
}

function Stage(step: Step) {
  const done = step.phase === 'done'
  const cur = step.phase === 'pair' ? step.i : -1
  const processed = step.doneCount
  const remaining = LETTERS.filter((ch) => step.diff[ch] !== 0)
  const hint = nextAction(step)

  /** 当前格：s 行用琥珀（主指针），t 行用青绿（对照），与 legend 的 amber / teal 一致 */
  const cellState = (i: number, row: 's' | 't'): CellState => {
    if (done) return 'ok'
    if (i === cur) return row === 's' ? 'active' : 'new'
    if (i < processed) return 'ok'
    return 'dim'
  }

  /** 一行字符：旗标在格上、字符在格内、下标在格下 */
  const charRow = (name: 's' | 't', chars: string[], tone: 'amber' | 'teal') => (
    <div className="flex w-full flex-col items-center gap-1">
      <span className="font-code text-[11px] text-ink-soft">
        {name} = &quot;{chars.join('')}&quot;
      </span>
      {/* 指针旗标 */}
      <div className="flex w-full">
        {chars.map((_, i) => (
          <div key={i} className="flex min-w-0 flex-1 justify-center">
            <Flag label={i === cur ? `${name}[${i}]` : undefined} tone={tone} />
          </div>
        ))}
      </div>
      {/* 字符行 */}
      <div className="flex w-full">
        {chars.map((ch, i) => (
          <div key={i} className="flex min-w-0 flex-1 justify-center px-[3px]">
            <Cell state={cellState(i, name)} className="w-full min-w-0">
              {ch}
            </Cell>
          </div>
        ))}
      </div>
      {/* 下标 */}
      <div className="flex w-full">
        {chars.map((_, i) => (
          <span key={i} className="min-w-0 flex-1 text-center font-code text-[11px] text-ink-soft">
            {i}
          </span>
        ))}
      </div>
    </div>
  )

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex w-full max-w-[560px] flex-col gap-2">
        {charRow('s', CHARS_S, 'amber')}
        {charRow('t', CHARS_T, 'teal')}
      </div>

      {/* 字符 → 计数差行：非 0 用 medium 橙标出 */}
      <div className="flex w-full max-w-[640px] flex-col items-center gap-1.5">
        <span className="text-[11px] text-ink-soft">
          字符 → 计数差（各字母 count_s(c) − count_t(c)；只列出两串出现过的 5 个字母，其余 21 个桶恒为 0）
        </span>
        <div className="flex w-full flex-wrap items-stretch justify-center gap-1.5">
          {LETTERS.map((ch) => {
            const v = step.diff[ch]
            const active = step.phase === 'pair' && (ch === step.plus || ch === step.minus)
            const tone = v !== 0 ? TONE.medium : active ? TONE.amber : undefined
            return (
              <div
                key={ch}
                className="flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg border px-1.5 py-1 sm:max-w-[104px]"
                style={{
                  borderColor: tone ? tone : 'hsl(var(--border))',
                  backgroundColor: v !== 0 ? 'hsl(var(--medium-soft))' : 'transparent',
                }}
              >
                <span className="font-code text-[13px] font-semibold text-ink">{ch}</span>
                <span
                  className="font-code text-[13px] font-bold"
                  style={{ color: tone ?? 'hsl(var(--ink-soft))' }}
                >
                  {v > 0 ? `+${v}` : v}
                </span>
                <span className="whitespace-nowrap text-[10px] text-ink-soft">
                  {v === 0 ? '已抵消' : v > 0 ? 's 多' : 't 多'}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <Badges className="justify-center">
        <Stat label="len(s) / len(t)" value={`${S.length} / ${T.length}`} tone="ink" />
        <Stat
          label="当前下标 i"
          value={step.phase === 'pair' ? step.i : '—'}
          tone={step.phase === 'pair' ? 'amber' : 'muted'}
        />
        <Stat
          label="差值非 0 的字母数"
          value={remaining.length}
          tone={done ? 'easy' : remaining.length > 0 ? 'medium' : 'ink'}
        />
        {hint && <Hint>{hint}</Hint>}
        {done && <Answer>{`全部差值为 0，返回 true：t = "${T}" 是 s = "${S}" 的字母异位词`}</Answer>}
      </Badges>
    </div>
  )
}

export default function ValidAnagramDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="计数数组一边加一边减"
      info={`s = "${S}"，t = "${T}"（题解示例 1，输出 true，共 ${S.length} 对字符）。s 的字符让桶 +1、t 的字符让桶 −1，收尾检查差值是否全为 0。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: 's 当前读入的字母（+1）/ 指针对 s' },
        { color: TONE.teal, label: 't 当前读入的字母（−1）/ 指针对 t' },
        { color: TONE.easy, label: '该位置已处理' },
        { color: TONE.medium, label: '差值非 0，尚未抵消' },
        { color: TONE.muted, label: '未处理' },
      ]}
    />
  )
}
