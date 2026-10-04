import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badges, Cell, Flag, Hint, Stat, TONE, type CellState } from './stage'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/* 33. 最小覆盖子串 —— 模式 A：数组 + 指针（滑窗变体 + need/have 计数行） */
/* ------------------------------------------------------------------ */

/** 固定的示例输入：题解官方示例 1（s = "ADOBECODEBANC"，t = "ABC"），答案 "BANC"。 */
const S = 'ADOBECODEBANC'
const T = 'ABC'
const CHARS = S.split('')

/** need：t 中每个字符需要的数量，needCount 是不同字符的种类数 */
const NEED: Partial<Record<string, number>> = {}
for (const c of T) NEED[c] = (NEED[c] ?? 0) + 1
const NEED_COUNT = Object.keys(NEED).length
/** 计数行：只展示 t 中出现的字符（need 种类），每行的「需要 / 已有」都跟着走 */
const NEED_ROWS = Object.keys(NEED).sort()
/** s 中出现过的不同字符，用于下标旁的字母标注 */
const DISTINCT = Array.from(new Set(CHARS)).sort()
/** need 表的一行文字描述，如 "A × 1，B × 1，C × 1" */
const NEED_TEXT = NEED_ROWS.map((c) => `${c} × ${NEED[c]}`).join('，')

/** 哨兵：还没找到任何可行窗口时 minLen = m + 1（题解写法） */
const SENTINEL = S.length + 1
/** init（1）+ 13 次右扩 + 10 次命中 + 10 次收缩 + done（1）= 35 步 */
const TOTAL = 35

interface HaveRow {
  ch: string
  need: number
  have: number
  /** 当前字符已达标 / 超出 / 还缺 */
  state: 'met' | 'extra' | 'short'
}

interface Step {
  left: number
  right: number
  /** 按 need 字符种类给出的 have 快照 */
  have: HaveRow[]
  /** 已达标（have >= need）的字符种类数 */
  matched: number
  minLen: number
  minStart: number
  /** 本步窗口是否覆盖 t（决定是否有窗口色块） */
  covered: boolean
  /** 本步正在处理的字符（右扩读入 / 收缩移出），收缩后已不在窗口内 */
  activeCh: string
  /** 本步被移出窗口的下标；无则为 −1 */
  removedAt: number
  /** 结束后的答案串，'' 表示无解 */
  answer: string
  phase: 'init' | 'expand' | 'found' | 'shrink' | 'done'
  note: string
}

function buildSteps(): Step[] {
  const steps: Step[] = []
  const have: Record<string, number> = {}
  let left = 0
  let matched = 0
  let minStart = 0
  let minLen = SENTINEL

  const snap = (
    phase: Step['phase'],
    right: number,
    covered: boolean,
    activeCh: string,
    removedAt: number,
    note: string
  ) => {
    steps.push({
      left,
      right,
      have: NEED_ROWS.map((ch) => {
        const need = NEED[ch]!
        const got = have[ch] ?? 0
        return { ch, need, have: got, state: got > need ? 'extra' : got === need ? 'met' : 'short' }
      }),
      matched,
      minLen,
      minStart,
      covered,
      activeCh,
      removedAt,
      answer: minLen === SENTINEL ? '' : S.slice(minStart, minStart + minLen),
      phase,
      note,
    })
  }

  snap(
    'init',
    -1,
    false,
    '',
    -1,
    `初始化：need 表统计 t = "${T}" 中各字符的需求，need = { ${NEED_TEXT} }，共 ${NEED_COUNT} 种字符；have 只统计窗口内这些字符的数量，不在 t 中的字符一律不计。matched 记录「已达标（have ≥ need）的字符种类数」，现在 left = 0、right = −1、窗口为空，matched = 0。minLen 记作哨兵值 ${SENTINEL} = m + 1，minLen 没被改小过就说明无解。`
  )

  for (let right = 0; right < S.length; right++) {
    const ch = S[right]
    const need = NEED[ch] ?? 0
    let justMet = false
    if (need > 0) {
      have[ch] = (have[ch] ?? 0) + 1
      justMet = have[ch] === need
      if (justMet) matched++
    }
    const len = right - left + 1
    const note =
      need > 0
        ? `观察：right 右扩到 ${right}，读入 "${ch}"，它是 t 需要的字符，have["${ch}"] 从 ${have[ch]! - 1} 增到 ${have[ch]!}（need = ${need}）。判断：${justMet ? `这一种恰好凑够，matched 增到 ${matched} / ${NEED_COUNT}` : `数量已超过需求，matched 不变，仍为 ${matched} / ${NEED_COUNT}`}。动作：把 ${ch} 计入窗口，窗口变成 s[${left}..${right}]，长度 ${len}。`
        : `观察：right 右扩到 ${right}，读入 "${ch}"，它不在 t 中（need = 0）。判断：它既不计入 have、也不影响 matched，仍为 ${matched} / ${NEED_COUNT}。动作：照常纳入窗口，窗口变成 s[${left}..${right}]，长度 ${len}，但对覆盖没有贡献。`
    snap('expand', right, matched === NEED_COUNT, ch, -1, note)

    while (matched === NEED_COUNT) {
      const curLen = right - left + 1
      const firstCover = minLen === SENTINEL
      const improved = curLen < minLen
      const waited = minLen
      if (improved) {
        minLen = curLen
        minStart = left
      }
      snap(
        'found',
        right,
        true,
        '',
        -1,
        `观察：窗口 s[${left}..${right}] = "${S.slice(left, right + 1)}" 已覆盖 t 的全部字符，matched = ${matched} / ${NEED_COUNT}，当前长度 ${curLen}。判断：${firstCover ? `minLen 仍是哨兵值 ${SENTINEL}（还没有可行窗口），首次记下 minLen = ${curLen}、minStart = ${left}` : improved ? `${curLen} < minLen = ${waited}，更短，刷新 minLen = ${curLen}、minStart = ${left}` : `${curLen} ≥ minLen = ${minLen}，不是更优解，minLen 与 minStart 都不变`}。动作：执行收缩——把最左边的 s[${left}] = "${S[left]}" 移出窗口，left 右移一位，看窗口是否还能覆盖 t。`
      )

      const out = S[left]
      const needOut = NEED[out] ?? 0
      if (needOut > 0) {
        if (have[out] === needOut) matched--
        have[out]--
      }
      const removedAt = left
      left++
      const stillCovered = matched === NEED_COUNT
      const lenAfter = right - left + 1
      snap(
        'shrink',
        right,
        stillCovered,
        out,
        removedAt,
        `观察：移出的是 s[${removedAt}] = "${out}"，${needOut > 0 ? `它是 t 需要的字符，have["${out}"] 从 ${have[out]! + 1} 降到 ${have[out]!}` : '它不在 t 中，have 不变'}。判断：${
          needOut > 0
            ? stillCovered
              ? `have["${out}"] = ${have[out]!} ≥ need = ${needOut} 仍达标，matched 保持 ${matched} / ${NEED_COUNT}，窗口依旧覆盖 t`
              : `have["${out}"] = ${have[out]!} 已低于 need = ${needOut}，这一种不再达标，matched 降到 ${matched} / ${NEED_COUNT}，窗口不再覆盖 t`
            : `该字符不参与计数，matched 保持 ${matched} / ${NEED_COUNT}，窗口是否覆盖 t 由其余字符决定`
        }。动作：left 从 ${removedAt} 右移到 ${left}，窗口变成 s[${left}..${right}]${lenAfter > 0 ? `，长度 ${lenAfter}` : '，已为空'}。`
      )
    }
  }

  const answer = minLen === SENTINEL ? '' : S.slice(minStart, minStart + minLen)
  steps.push({
    left,
    right: S.length - 1,
    have: answer
      ? NEED_ROWS.map((ch) => {
          let got = 0
          for (const c of answer) if (c === ch) got++
          const need = NEED[ch]!
          return { ch, need, have: got, state: got > need ? 'extra' : got === need ? 'met' : 'short' }
        })
      : NEED_ROWS.map((ch) => ({ ch, need: NEED[ch]!, have: 0, state: 'short' })),
    matched: answer ? NEED_COUNT : 0,
    minLen,
    minStart,
    covered: minLen !== SENTINEL,
    activeCh: '',
    removedAt: -1,
    answer,
    phase: 'done',
    note: `扫描结束：right 已越界，minLen 停在 ${minLen}，返回 s[${minStart}..${minStart + minLen - 1}] = "${answer}"。正确性：每个 right 都会把 left 收缩到「刚好不再覆盖 t」为止，因此记录下来的最后一个窗口就是以该 right 结尾的最短覆盖子串，枚举所有右端点即得全局最短（题目保证答案唯一）。复杂度：right 走 m 步、left 只增不减也最多走 m 步，时间 O(m + n)；need / have 各存不同字符数，空间 O(字符集大小)。`
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

function stateOf(i: number, step: Step): CellState {
  if (step.phase === 'init') return 'dim'
  if (step.phase === 'done') return i >= step.minStart && i < step.minStart + step.minLen ? 'ok' : 'dim'
  if (step.phase === 'expand') {
    if (i === step.right) return 'active'
    if (i < step.left || i > step.right) return 'dim'
    return NEED[CHARS[i]] ? 'ok' : 'new'
  }
  if (step.phase === 'shrink') {
    if (i === step.removedAt) return 'warn'
    if (i >= step.left && i <= step.right) return NEED[CHARS[i]] ? 'ok' : 'new'
    return 'dim'
  }
  /* found：窗口内同样按「是否属于 t」着色，否则会与格子标签的青色互相打架 */
  return i >= step.left && i <= step.right ? (NEED[CHARS[i]] ? 'ok' : 'new') : 'dim'
}

function cellTagOf(i: number, step: Step): { text: string; color: string } | null {
  const ch = CHARS[i]
  if (step.phase === 'init') return i === 0 ? { text: 's[0]', color: TONE.muted } : null
  if (step.phase === 'expand' && i === step.right) return { text: '刚读入', color: TONE.amber }
  if (step.phase === 'shrink' && i === step.removedAt) return { text: '移出', color: TONE.medium }
  if (step.phase === 'done') {
    const inAnswer = i >= step.minStart && i < step.minStart + step.minLen
    return inAnswer && i === step.minStart ? { text: '最短子串', color: TONE.easy } : null
  }
  if (i >= step.left && i <= step.right) {
    if (NEED[ch]) return { text: '达标', color: TONE.easy }
    return { text: '非t', color: TONE.teal }
  }
  return null
}

/** 下一步：收缩 / 右扩 / 输出，必须是真正的下一个动作 */
function shrinkHint(step: Step): string {
  const out = step.left
  return `left 右移到 ${out + 1}，移出 s[${out}] = "${CHARS[out]}"，看窗口是否仍覆盖 t`
}

function expandHint(step: Step): string {
  if (step.right + 1 < CHARS.length) {
    return `right 右扩到 ${step.right + 1}，读入 "${CHARS[step.right + 1]}"`
  }
  return 'right 越界，输出 minLen'
}

function hintOf(step: Step): string {
  if (step.phase === 'init') return `right 右扩到 0，读入 "${CHARS[0]}"`
  if (step.phase === 'expand') return step.covered ? shrinkHint(step) : expandHint(step)
  if (step.phase === 'found') return shrinkHint(step)
  if (step.matched === NEED_COUNT) return shrinkHint(step)
  return expandHint(step)
}

function Stage(step: Step) {
  const n = CHARS.length
  const done = step.phase === 'done'
  const winL = done ? step.minStart : step.left
  const winR = done ? step.minStart + step.minLen - 1 : step.right
  const hasWindow = step.covered && winR >= winL
  const pulse = step.phase === 'found' || done
  const hint = hintOf(step)

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-full max-w-[560px]">
        {/* 状态标：状态不能只靠颜色区分，每格上方有文字 */}
        <div className="flex h-4 w-full">
          {CHARS.map((_, i) => {
            const tag = cellTagOf(i, step)
            return (
              <div key={i} className="flex min-w-0 flex-1 items-end justify-center">
                {tag && (
                  <span
                    className="truncate font-code text-[10px] font-bold"
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
        <div className="flex h-[52px] w-full">
          {CHARS.map((_, i) => (
            <div key={i} className="flex min-w-0 flex-1 flex-col items-center justify-end">
              {!done && i === step.left && <Flag label={`L${i}`} tone="amber" />}
              {!done && i === step.right && <Flag label={`R${i}`} tone="teal" />}
            </div>
          ))}
        </div>

        {/* 字符行：窗口区间用半透明色块整体包裹（覆盖时转绿） */}
        <div className="relative flex w-full">
          {hasWindow && (
            <div
              className={cn(
                'pointer-events-none absolute -inset-y-1 rounded-lg border-[1.5px] transition-all duration-300',
                pulse
                  ? 'demo-pulse border-[hsl(var(--easy))]/60 bg-[hsl(var(--easy))]/15'
                  : 'border-[hsl(var(--amber))]/50 bg-[hsl(var(--amber))]/15'
              )}
              style={{
                left: `${(winL / n) * 100}%`,
                width: `${((winR - winL + 1) / n) * 100}%`,
              }}
            />
          )}
          {CHARS.map((ch, i) => (
            <div key={i} className="flex min-w-0 flex-1 justify-center px-[2px]">
              <Cell state={stateOf(i, step)} className="w-full min-w-0 sm:min-w-0">
                {ch}
              </Cell>
            </div>
          ))}
        </div>

        {/* 下标（3 位数字时换用字母标注，避免窄屏溢出） */}
        <div className="mt-1 flex w-full">
          {CHARS.map((_, i) => (
            <span key={i} className="min-w-0 flex-1 truncate text-center font-code text-[11px] text-ink-soft">
              {i < 10 ? i : DISTINCT[Math.floor(i / 10) - 1] ?? ''}
            </span>
          ))}
        </div>
      </div>

      {/* need / have 计数行：需要 / 已有 逐字符对齐 */}
      <div className="flex w-full flex-wrap items-center justify-center gap-1.5">
        <span className="text-[11px] text-ink-soft">need / have 计数（t = "{T}"）</span>
        {step.have.map((row) => {
          const current = !done && step.activeCh === row.ch
          return (
            <span
              key={row.ch}
              className={cn(
                'rounded-md border px-2 py-0.5 font-code text-[11px] font-semibold',
                row.state === 'met'
                  ? 'border-[hsl(var(--easy))]/40 bg-[hsl(var(--easy-soft))] text-[hsl(var(--easy))]'
                  : row.state === 'extra'
                    ? 'border-[hsl(var(--medium))]/40 bg-[hsl(var(--medium-soft))] text-[hsl(var(--medium))]'
                    : 'border-[hsl(var(--amber))]/40 bg-[hsl(var(--amber-soft))] text-[hsl(var(--amber))]',
                current && 'ring-1 ring-[hsl(var(--ink))]/30'
              )}
            >
              {row.ch} 需要 {row.need} 已有 {row.have}{' '}
              {row.state === 'met' ? '满足' : row.state === 'extra' ? `多余 ${row.have - row.need}` : `还缺 ${row.need - row.have}`}
            </span>
          )
        })}
      </div>

      <Badges className="justify-center">
        <Stat
          label="窗口 [left, right]"
          value={`[${done ? '—' : step.left}, ${done || step.right < 0 ? '—' : step.right}]`}
          tone="amber"
        />
        <Stat label="matched / 种类" value={`${step.matched} / ${NEED_COUNT}`} tone="easy" />
        <Stat
          label="窗口长度 / minLen"
          value={`${done || step.right < step.left ? 0 : step.right - step.left + 1} / ${
            step.minLen === SENTINEL ? `哨兵 ${SENTINEL}` : step.minLen
          }`}
          tone="water"
        />
        {done ? (
          <Answer>
            {step.answer ? (
              <>
                {`"${step.answer}"（长度 `}
                <span className="font-code">{step.minLen}</span>
                {'）'}
              </>
            ) : (
              '无覆盖 t 的子串，返回 ""'
            )}
          </Answer>
        ) : (
          <Hint>{hint}</Hint>
        )}
      </Badges>
    </div>
  )
}

export default function MinimumWindowSubstringDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="滑动窗口 + need/have 计数找最小覆盖子串"
      info={`输入：s = "${S}"（m = ${S.length}），t = "${T}"（n = ${T.length}），取自题解官方示例 1，答案 "BANC"。right 右扩到窗口覆盖 t，随后收缩 left 找以该 right 结尾的最短覆盖窗口；need / have 计数行按题解口径只统计 t 中的字符。为看清每一次「仍覆盖 → 继续收缩」的过程，这里把 13 次右扩、10 次命中与 10 次收缩全部展开，共 ${TOTAL} 步（在契约要求的 5–40 步上限内）。`}
      steps={steps}
      autoMs={1500}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '覆盖 t 时的窗口区间 [left, right] / right 刚读入的字符' },
        { color: TONE.teal, label: 'right 指针 / 窗口中不属于 t 的字符' },
        { color: TONE.easy, label: '窗口内属于 t 的字符 / 命中的最短子串' },
        { color: TONE.medium, label: '多余计数的 t 字符 / 刚被移出窗口的字符' },
        { color: TONE.muted, label: '窗口外未处理' },
      ]}
    />
  )
}
