import { useMemo, type ReactNode } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badges, Cell, Flag, Hint, Stat, TONE, type CellState } from './stage'

/* ------------------------------------------------------------------ */
/* 26. 判断子序列 —— 模式 A：数组 + 指针（s / t 两行对齐 + 匹配细线）      */
/* ------------------------------------------------------------------ */

/** 题解示例 1：s = "abc"、t = "ahbgdc" → true，是规模最小的官方用例。 */
const S = 'abc'
const T = 'ahbgdc'
const S_CHARS = S.split('')
const T_CHARS = T.split('')
const S_LEN = S_CHARS.length
const T_LEN = T_CHARS.length

/** 两行共用同一套列：列数取较长者，列中心 x 一律按 (k + 0.5) / COLS 线性换算 */
const COLS = Math.max(S_LEN, T_LEN)
/** 匹配细线的画布（viewBox 单位，靠 w-full 等比缩放到行宽，不写死像素） */
const W = 700
const BAND_H = 64

/** 第 k 列的中心 x：两行、旗标、下标与细线共用同一套换算 */
const xOf = (k: number) => ((k + 0.5) / COLS) * W

/** 每个 t 下标的状态：未扫描 / 已跳过 / 已匹配 */
type TState = 'idle' | 'skip' | 'match'

interface Pair {
  /** s 中的下标 */
  si: number
  /** 与它匹配的 t 下标 */
  tj: number
}

interface Step {
  tState: TState[]
  /** 已经确定的匹配对，用于画对应细线 */
  pairs: Pair[]
  /** i：s 中下一个待匹配的下标，也等于已匹配的字符数 */
  i: number
  /** j：本步比较的 t 下标；done 步为 null */
  j: number | null
  /** 已经扫描过的 t 位置数 */
  scanned: number
  phase: 'init' | 'compare' | 'done'
  note: string
}

function buildSteps(): Step[] {
  const steps: Step[] = []
  const tState: TState[] = T_CHARS.map(() => 'idle')
  const pairs: Pair[] = []
  let i = 0
  let scanned = 0

  const snap = (j: number | null, phase: Step['phase'], note: string) => {
    steps.push({
      tState: tState.slice(),
      pairs: pairs.map((p) => ({ ...p })),
      i,
      j,
      scanned,
      phase,
      note,
    })
  }

  snap(
    0,
    'init',
    `初始化：s = "${S}"（长度 ${S_LEN}）是待检验的子序列，t = "${T}"（长度 ${T_LEN}）是目标串；i = 0 指向 s 的首字符，j = 0 指向 t 的首字符。不变量：t[0..j-1] 中被贪心选中的位置恰好按顺序匹配了 s[0..i-1]，所以 j 每轮都前进，i 只在 s[i] == t[j] 时前进。`
  )

  for (let j = 0; j < T_LEN && i < S_LEN; j++) {
    const need = S_CHARS[i]
    const ch = T_CHARS[j]
    if (ch === need) {
      const si = i
      tState[j] = 'match'
      pairs.push({ si, tj: j })
      i++
      scanned = j + 1
      snap(
        j,
        'compare',
        `观察：比较 s[${si}] = "${need}" 与 t[${j}] = "${ch}"，两者相等。判断：这正是 s 当前需要的字符，可以在 t[${j}] 匹配它。动作：i 从 ${si} 前进到 ${si + 1}，j 从 ${j} 前进到 ${j + 1}，t[${j}] 记为已匹配并连出对应细线。为什么：用最靠前的 t[${j}] 匹配 s[${si}] 会给后续字符留下最多的可用字符，不会比往后拖更差。`
      )
    } else {
      scanned = j + 1
      tState[j] = 'skip'
      snap(
        j,
        'compare',
        `观察：比较 s[${i}] = "${need}" 与 t[${j}] = "${ch}"，两者不相等。判断：t[${j}] 不是 s 当前需要的字符，无法参与匹配。动作：只有 j 从 ${j} 前进到 ${j + 1}，i 停在 ${i} 不动。为什么：不匹配的字符只能被丢弃，继续到 t 的后面找 s[${i}]。`
      )
    }
  }

  snap(
    null,
    'done',
    i === S_LEN
      ? `循环结束：j 已扫过 t 的末尾，i = ${i} 等于 len(s) = ${S_LEN}，说明 s 的每个字符都在 t 中按原顺序找到了位置。结论：s 是 t 的子序列，返回 true。为什么：贪心每步都用最靠前的位置匹配 s[i]，不会把可行解逼到不可行。复杂度：j 单向前进扫过 t，时间 O(len(t))，空间 O(1)。`
      : `循环结束：j 已到 t 的末尾（j = ${scanned}），i = ${i} 小于 len(s) = ${S_LEN}，说明 s[${i}] 在 t 的剩余部分里没有出现过。结论：s 不是 t 的子序列，返回 false。为什么：s[${i}] 在 t 中再也找不到，任何方案都不可能走完 s。复杂度：时间 O(len(t))，空间 O(1)。`
  )

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

/** 下一步真正要做的动作（Hint 的「下一步：」前缀由组件硬编码） */
function nextHint(step: Step): ReactNode {
  if (step.phase === 'done') return null
  if (step.i >= S_LEN) {
    return (
      <>
        <span className="font-code">{`i = ${S_LEN}`}</span>
        {step.scanned >= T_LEN
          ? ` 已匹配完 s 且 j 已到 t 末尾，循环结束，返回 `
          : ` 已匹配完 s，循环提前结束，返回 `}
        <span className="font-code">true</span>
      </>
    )
  }
  if (step.scanned >= T_LEN) {
    return (
      <>
        <span className="font-code">{`j = ${T_LEN}`}</span>
        {` 已扫过 t 末尾，循环结束，判断 `}
        <span className="font-code">i == len(s)</span>
      </>
    )
  }
  return (
    <>
      {`比较 `}
      <span className="font-code">{`s[${step.i}] = "${S_CHARS[step.i]}"`}</span>
      {` 与 `}
      <span className="font-code">{`t[${step.scanned}] = "${T_CHARS[step.scanned]}"`}</span>
    </>
  )
}

function Stage(step: Step) {
  const done = step.phase === 'done'
  const cols = { gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }
  const hint = nextHint(step)

  const sStateOf = (k: number): CellState => {
    if (k < step.i) return 'ok'
    if (k === step.i && !done) return 'active'
    return 'idle'
  }

  const tStateOf = (k: number): CellState => {
    if (step.phase === 'compare' && k === step.j && step.tState[k] === 'skip') return 'new'
    if (step.tState[k] === 'match') return 'ok'
    if (step.tState[k] === 'skip') return 'dim'
    return 'idle'
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex w-full max-w-md flex-col">
        {/* ---- s 行：i 旗标在格上、下标在格下 ---- */}
        <div className="w-full font-code text-[11px] text-ink-soft">{`s（子序列，长度 ${S_LEN}）= "${S}"`}</div>
        <div className="grid h-6 w-full items-end" style={cols}>
          {Array.from({ length: COLS }, (_, k) => (
            <div key={k} className="flex justify-center">
              {!done && step.i < S_LEN && k === step.i && <Flag label="i" tone="amber" />}
            </div>
          ))}
        </div>
        <div className="grid w-full" style={cols}>
          {S_CHARS.map((ch, k) => (
            <div key={k} className="px-[3px]">
              <Cell state={sStateOf(k)} className="w-full min-w-0">
                {ch}
              </Cell>
            </div>
          ))}
        </div>
        <div className="mt-1 grid w-full" style={cols}>
          {S_CHARS.map((_, k) => (
            <span key={k} className="text-center font-code text-[11px] text-ink-soft">
              {k}
            </span>
          ))}
        </div>

        {/* ---- 匹配细线：从 s 的列中心连到 t 的列中心 ---- */}
        <svg viewBox={`0 0 ${W} ${BAND_H}`} className="w-full">
          {step.pairs.map((p) => (
            <g
              key={`${p.si}-${p.tj}`}
              stroke={TONE.easy}
              strokeWidth="2"
              strokeLinecap="round"
              fill={TONE.easy}
            >
              <line x1={xOf(p.si)} y1={2} x2={xOf(p.tj)} y2={BAND_H - 2} />
              <circle cx={xOf(p.si)} cy={2} r="3" />
              <circle cx={xOf(p.tj)} cy={BAND_H - 2} r="3" />
            </g>
          ))}
        </svg>

        {/* ---- t 行：j 旗标在格上、下标在格下 ---- */}
        <div className="mt-1 w-full font-code text-[11px] text-ink-soft">{`t（目标串，长度 ${T_LEN}）= "${T}"`}</div>
        <div className="grid h-6 w-full items-end" style={cols}>
          {Array.from({ length: COLS }, (_, k) => (
            <div key={k} className="flex justify-center">
              {!done && k === step.j && <Flag label="j" tone="teal" />}
            </div>
          ))}
        </div>
        <div className="grid w-full" style={cols}>
          {T_CHARS.map((ch, k) => (
            <div key={k} className="px-[3px]">
              <Cell state={tStateOf(k)} className="w-full min-w-0">
                {ch}
              </Cell>
            </div>
          ))}
        </div>
        <div className="mt-1 grid w-full" style={cols}>
          {T_CHARS.map((_, k) => (
            <span key={k} className="text-center font-code text-[11px] text-ink-soft">
              {k}
            </span>
          ))}
        </div>
      </div>

      <Badges className="justify-center">
        <Stat label="已匹配 i" value={`${step.i} / ${S_LEN}`} tone="easy" />
        <Stat label="t 已扫描" value={`${step.scanned} / ${T_LEN}`} tone="teal" />
        {hint && <Hint>{hint}</Hint>}
        {done &&
          (step.i === S_LEN ? (
            <Answer>
              <span className="font-code">{`i = ${step.i} = len(s)`}</span>
              {`，s 是 t 的子序列，返回 `}
              <span className="font-code">true</span>
            </Answer>
          ) : (
            <Answer>
              <span className="font-code">{`i = ${step.i} < len(s) = ${S_LEN}`}</span>
              {`，s 还有字符没匹配到，s 不是 t 的子序列，返回 `}
              <span className="font-code">false</span>
            </Answer>
          ))}
      </Badges>
    </div>
  )
}

export default function IsSubsequenceDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="同向双指针扫描 t 判断子序列"
      info={`s = "${S}"，t = "${T}"（题解示例 1，答案 true）：i 只在字符相等时前进，j 每轮都前进；两行字符按列对齐，绿色细线连出每一对已匹配的字符。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: 'i 指针：s 中待匹配的字符' },
        { color: TONE.teal, label: 'j 指针：本步比较的 t 字符' },
        { color: TONE.easy, label: '已匹配的字符与对应细线' },
        { color: TONE.muted, label: 't 中已跳过的字符' },
      ]}
    />
  )
}
