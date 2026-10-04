import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badges, Cell, Flag, Hint, Stat, TONE, type CellState } from './stage'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/* 31. 无重复字符的最长子串 —— 模式 A：数组 + 指针（滑动窗口区间块变体） */
/* ------------------------------------------------------------------ */

const S = 'abcabcbb'
const CHARS = S.split('')
/** charIndex 里出现过的字符（本例即 a / b / c），用于展示哈希表内容 */
const DISTINCT = Array.from(new Set(CHARS))

type CharIndex = Partial<Record<string, number>>

interface Step {
  chars: string[]
  charIndex: CharIndex
  left: number
  right: number
  /** 与窗口内字符重复时，该字符上一次出现的下标；无重复为 −1 */
  dupAt: number
  /** 当前合法窗口 s[left..right] 的长度 */
  windowLen: number
  maxLen: number
  bestL: number
  phase: 'init' | 'extend' | 'shrink' | 'done'
  note: string
}

function buildSteps(): Step[] {
  const n = CHARS.length
  const steps: Step[] = []
  const charIndex: CharIndex = {}
  let left = 0
  let maxLen = 0
  let bestL = 0

  const push = (
    phase: Step['phase'],
    right: number,
    dupAt: number,
    windowLen: number,
    note: string
  ) => {
    steps.push({
      chars: CHARS.slice(),
      charIndex: { ...charIndex },
      left,
      right,
      dupAt,
      windowLen,
      maxLen,
      bestL,
      phase,
      note,
    })
  }

  push(
    'init',
    -1,
    -1,
    0,
    `初始化：窗口为空（right = −1 表示还没读入任何字符），left = 0，charIndex 为空表，maxLen = 0。每轮的流程是：right 前进读入一个字符，若它与窗口内字符重复，就把 left 跳到那个旧字符的下一位，再更新 charIndex 与 maxLen。全程要维持的不变量是「窗口 s[left..right] 内没有重复字符」。`
  )

  for (let right = 0; right < n; right++) {
    const ch = CHARS[right]
    const seen = charIndex[ch] ?? -1
    const inWindow = seen >= left

    if (!inWindow) {
      charIndex[ch] = right
      const curLen = right - left + 1
      const improved = curLen > maxLen
      if (improved) {
        maxLen = curLen
        bestL = left
      }
      const before = right > left ? `s[${left}..${right - 1}]` : '空窗口'
      push(
        'extend',
        right,
        -1,
        curLen,
        `观察：right 右移到 ${right}，读入字符 "${ch}"，此前窗口是 ${before}。判断：${
          seen < 0
            ? `charIndex 里没有 "${ch}" 的记录，它是首次出现`
            : `charIndex["${ch}"] = ${seen} 已经落在 left = ${left} 的左侧（窗口外）`
        }，并入后窗口仍然无重复。动作：charIndex["${ch}"] = ${right}，窗口变成 s[${left}..${right}]，长度 ${curLen}${
          improved ? `，刷新 maxLen = ${curLen}` : `，未超过 maxLen = ${maxLen}`
        }。`
      )
      continue
    }

    push(
      'extend',
      right,
      seen,
      right - left + 1,
      `观察：right 右移到 ${right}，读入字符 "${ch}"；charIndex["${ch}"] = ${seen} 且 ${seen} ≥ left = ${left}，说明它此刻还在窗口 s[${left}..${right - 1}] 里。判断：窗口因重复而非法，以 ${right} 结尾的合法窗口，左端点必须大于 ${seen}，取最小的 ${seen + 1} 才最长。动作：left 从 ${left} 跳到 ${seen + 1}。`
    )

    left = seen + 1
    charIndex[ch] = right
    const curLen = right - left + 1
    const prevMax = maxLen
    const improved = curLen > maxLen
    if (improved) {
      maxLen = curLen
      bestL = left
    }
    push(
      'shrink',
      right,
      seen,
      curLen,
      `动作：把上一次出现的 "${ch}"（下标 ${seen}）移出窗口，窗口变成 s[${left}..${right}] = "${CHARS.slice(
        left,
        right + 1
      ).join('')}"，长度 ${curLen}；charIndex["${ch}"] 更新为 ${right}。为什么能一步跳到 ${
        seen + 1
      }：原窗口内本就没有重复，只需去掉旧的那个 "${ch}" 便重新合法。结果比较：${
        improved ? `${curLen} > ${prevMax}，刷新 maxLen = ${curLen}` : `${curLen} ≤ maxLen = ${maxLen}，答案不变`
      }。`
    )
  }

  const answer = CHARS.slice(bestL, bestL + maxLen).join('')
  push(
    'done',
    -1,
    -1,
    maxLen,
    `扫描结束：right 越过末尾，maxLen = ${maxLen} 保持最大，对应子串 s[${bestL}..${bestL + maxLen - 1}] = "${answer}"。正确性：每轮结束时窗口都无重复，且是以该 right 结尾的最长合法窗口，遍历所有右端点即得全局最长。复杂度：right 走 n 步、left 只增不减，时间 O(n)；charIndex 最多存字符集大小，空间 O(min(n, 字符集大小))。`
  )
  return steps
}

/* ---------------- 舞台渲染 ---------------- */

function nextAction(step: Step): string | null {
  if (step.phase === 'done') return null
  if (step.phase === 'init') return `right 右移到 0，读入 "${CHARS[0]}"`
  if (step.phase === 'extend' && step.dupAt >= 0) return `left 从 ${step.left} 跳到 ${step.dupAt + 1}`
  if (step.right + 1 < CHARS.length) {
    return `right 右移到 ${step.right + 1}，读入 "${CHARS[step.right + 1]}"`
  }
  return 'right 越界，输出 maxLen'
}

function Stage(step: Step) {
  const n = CHARS.length
  const done = step.phase === 'done'
  /** 本步右端读入的字符与窗口内字符重复（窗口尚未收缩） */
  const dupExtend = step.phase === 'extend' && step.dupAt >= 0
  const winL = done ? step.bestL : step.left
  const winR = done ? step.bestL + step.maxLen - 1 : dupExtend ? step.right - 1 : step.right
  const hasWindow = step.phase !== 'init' && winR >= winL && winR >= 0
  const answer = CHARS.slice(step.bestL, step.bestL + step.maxLen).join('')
  const hint = nextAction(step)

  const stateOf = (i: number): CellState => {
    if (done) return i >= winL && i <= winR ? 'ok' : 'dim'
    if (i === step.right) return 'active'
    if (i === step.dupAt) return 'bad'
    if (hasWindow && i >= winL && i <= winR) return 'ok'
    return 'dim'
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-full max-w-[520px]">
        {/* 状态标：重复 / 已移出 / 最长子串 */}
        <div className="flex h-4 w-full">
          {step.chars.map((_, i) => (
            <div key={i} className="flex min-w-0 flex-1 items-end justify-center">
              {i === step.dupAt && (
                <span className="whitespace-nowrap font-code text-[10px] font-bold text-[hsl(var(--hard))]">
                  {step.phase === 'extend' ? '重复' : '已移出'}
                </span>
              )}
              {done && i === step.bestL && (
                <span className="whitespace-nowrap font-code text-[10px] font-bold text-[hsl(var(--easy))]">
                  最长子串
                </span>
              )}
            </div>
          ))}
        </div>

        {/* 指针旗标：left 在上、right 在下；两个指针同格时上下并列 */}
        <div className="flex h-12 w-full">
          {step.chars.map((_, i) => (
            <div key={i} className="flex min-w-0 flex-1 flex-col items-center justify-end">
              {!done && i === step.left && <Flag label="left" tone="amber" />}
              {!done && i === step.right && <Flag label="right" tone="teal" />}
            </div>
          ))}
        </div>

        {/* 字符行：窗口区间用半透明琥珀底色块整体包裹 */}
        <div className="relative flex w-full">
          {hasWindow && (
            <div
              className={cn(
                'pointer-events-none absolute -inset-y-1 rounded-lg border-[1.5px] transition-all duration-300',
                done
                  ? 'demo-pulse border-[hsl(var(--easy))]/60 bg-[hsl(var(--easy))]/15'
                  : 'border-[hsl(var(--amber))]/50 bg-[hsl(var(--amber))]/15'
              )}
              style={{
                left: `${(winL / n) * 100}%`,
                width: `${((winR - winL + 1) / n) * 100}%`,
              }}
            />
          )}
          {step.chars.map((ch, i) => (
            <div key={i} className="flex min-w-0 flex-1 justify-center px-[3px]">
              <Cell state={stateOf(i)} className="w-full min-w-0 sm:min-w-0">
                {ch}
              </Cell>
            </div>
          ))}
        </div>

        {/* 下标 */}
        <div className="mt-1 flex w-full">
          {step.chars.map((_, i) => (
            <span key={i} className="min-w-0 flex-1 text-center font-code text-[11px] text-ink-soft">
              {i}
            </span>
          ))}
        </div>
      </div>

      {/* charIndex：字符 → 最后出现位置 */}
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <span className="text-[11px] text-ink-soft">charIndex 字符 → 最后出现位置</span>
        {DISTINCT.map((ch) => {
          const pos = step.charIndex[ch]
          const inWindow = pos !== undefined && hasWindow && pos >= winL && pos <= winR
          const current = !done && step.phase !== 'init' && step.chars[step.right] === ch
          return (
            <span
              key={ch}
              className={cn(
                'rounded-md border px-2 py-0.5 font-code text-[11px] font-semibold',
                current
                  ? 'border-[hsl(var(--amber))]/50 bg-[hsl(var(--amber-soft))] text-[hsl(var(--amber))]'
                  : inWindow
                    ? 'border-[hsl(var(--easy))]/40 bg-[hsl(var(--easy-soft))] text-[hsl(var(--easy))]'
                    : 'border-border bg-card text-ink-soft'
              )}
            >
              {ch} → {pos === undefined ? '—' : pos}
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
        <Stat label="窗口长度" value={step.windowLen} tone="easy" />
        <Stat label="历史最长" value={step.maxLen} tone="water" />
        {hint && <Hint>{hint}</Hint>}
        {done && (
          <Answer>
            maxLen = {step.maxLen}，最长子串 "{answer}"
          </Answer>
        )}
      </Badges>
    </div>
  )
}

export default function LongestSubstringWithoutRepeatingCharactersDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="滑动窗口找最长无重复子串"
      info={`s = "${S}"（示例 1，答案 3），求不含重复字符的最长子串长度；窗口 s[left..right] 始终保持无重复，charIndex 记录每个字符最后出现的位置。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '窗口底色块 / right 刚读入的字符' },
        { color: TONE.easy, label: '窗口内无重复的字符' },
        { color: TONE.hard, label: '与窗口内字符重复，被移出' },
        { color: TONE.muted, label: '窗口外未处理' },
      ]}
    />
  )
}
