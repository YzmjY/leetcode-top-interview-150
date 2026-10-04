import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badges, Cell, Flag, Hint, Stat, TONE, type CellState } from './stage'

/* ------------------------------------------------------------------ */
/* 17. 罗马数字转整数 —— 模式 A：字符单元格行 + 相邻比较                 */
/* 逐字符查表，当前值小于右邻就减、否则就加；减法位用 hard 红标出。      */
/* ------------------------------------------------------------------ */

/** 固定的示例输入（取自题解示例 5：MCMXCIV = 1994） */
const S = 'MCMXCIV'
const CHARS = S.split('')
const VALUES: Record<string, number> = {
  I: 1,
  V: 5,
  X: 10,
  L: 50,
  C: 100,
  D: 500,
  M: 1000,
}
/** 每个字符查表得到的数值，位置与 CHARS 一一对应 */
const VALS = CHARS.map((c) => VALUES[c])

/** 每位字符最终承担的运算符号；'' 表示还没处理到 */
type Sign = '+' | '-' | ''

interface Step {
  chars: string[]
  values: number[]
  signs: Sign[]
  /** 当前处理的下标：init 为 −1，done 为 n */
  i: number
  /** 累计总和 result */
  result: number
  /** 本步这一位是否走减法分支 */
  isSub: boolean
  phase: 'init' | 'step' | 'done'
  note: string
}

function buildSteps(): Step[] {
  const n = CHARS.length
  const steps: Step[] = []
  const signs: Sign[] = Array<Sign>(n).fill('')
  let result = 0

  steps.push({
    chars: CHARS.slice(),
    values: VALS.slice(),
    signs: signs.slice(),
    i: -1,
    result: 0,
    isSub: false,
    phase: 'init',
    note: `初始化：s = "${S}" 共 ${n} 个字符，查表得 M = 1000、C = 100、X = 10、I = 1、V = 5，result 从 0 开始累计。判断：每个字符只需要和它紧邻的右边一个字符比一次数值，小就减、否则就加。动作：从 i = 0 的 'M' 开始逐位处理。`,
  })

  for (let i = 0; i < n; i++) {
    const curVal = VALS[i]
    const hasNext = i + 1 < n
    const nextVal = hasNext ? VALS[i + 1] : 0
    const nextChar = hasNext ? CHARS[i + 1] : ''
    const isSub = curVal < nextVal
    result += isSub ? -curVal : curVal
    signs[i] = isSub ? '-' : '+'

    let note: string
    if (!hasNext) {
      note = `观察：s[${i}] = '${CHARS[i]}'（${curVal}）已是最后一个字符，没有右邻。判断：条件 i < n − 1 不成立，短路走「加」的分支，不会越界读取 s[${i + 1}]。动作：result += ${curVal}，result 变成 ${result}。`
    } else if (isSub) {
      note = `观察：s[${i}] = '${CHARS[i]}'（${curVal}），右邻 s[${i + 1}] = '${nextChar}'（${nextVal}）。判断：${curVal} < ${nextVal}，命中「小值在左」的减法组合，这一位要减。动作：result -= ${curVal}，result 变成 ${result}。为什么：这一段本身表示的数值就是 ${nextVal} − ${curVal}，按加法记会多算 ${curVal * 2}。`
    } else {
      note = `观察：s[${i}] = '${CHARS[i]}'（${curVal}），右邻 s[${i + 1}] = '${nextChar}'（${nextVal}）。判断：${curVal} ≥ ${nextVal}，不是减法组合。动作：result += ${curVal}，result 变成 ${result}。为什么：减法只出现在 IV、IX、XL、XC、CD、CM 这六种紧邻组合里。`
    }

    steps.push({
      chars: CHARS.slice(),
      values: VALS.slice(),
      signs: signs.slice(),
      i,
      result,
      isSub,
      phase: 'step',
      note,
    })
  }

  steps.push({
    chars: CHARS.slice(),
    values: VALS.slice(),
    signs: signs.slice(),
    i: n,
    result,
    isSub: false,
    phase: 'done',
    note: `扫描结束：每一位的加减方式都已确定，逐位累计得到 result = ${result}，与题解示例 5 的输出一致。读法：1000 − 100 + 1000 − 10 + 100 − 1 + 5 = ${result}。复杂度：只从左到右扫一遍，时间 O(n)；字符表固定 7 项，与 n 无关，空间 O(1)。`,
  })
  return steps
}

/* ---------------- 舞台渲染 ---------------- */

/** 下一步动作（Hint 文案） */
function nextAction(step: Step): string | null {
  if (step.phase === 'done') return null
  if (step.phase === 'init') {
    return `处理 i = 0 的 '${CHARS[0]}'（${VALS[0]}），与右邻 '${CHARS[1]}'（${VALS[1]}）比较`
  }
  const j = step.i + 1
  if (j >= CHARS.length) return `扫描到末尾，输出 result = ${step.result}`
  if (j + 1 >= CHARS.length) {
    return `处理 i = ${j} 的 '${CHARS[j]}'（${VALS[j]}）：它是末尾字符，无右邻，直接加上`
  }
  return `处理 i = ${j} 的 '${CHARS[j]}'（${VALS[j]}），与右邻 '${CHARS[j + 1]}'（${VALS[j + 1]}）比较`
}

function Stage(step: Step) {
  const n = step.chars.length
  const done = step.phase === 'done'
  const cur = step.i
  const curVal = cur >= 0 && cur < n ? step.values[cur] : 0
  const hasNext = step.phase === 'step' && cur + 1 < n
  const nextChar = hasNext ? step.chars[cur + 1] : ''
  const nextVal = hasNext ? step.values[cur + 1] : 0
  const hint = nextAction(step)

  /** 单元格底色：已确定（绿=加 / 红=减）、当前、右邻对照、未处理 */
  const stateOf = (i: number): CellState => {
    if (done) return step.signs[i] === '-' ? 'bad' : 'ok'
    if (step.phase === 'init') return 'idle'
    if (i === cur) return step.isSub ? 'bad' : 'active'
    if (i === cur + 1) return 'new'
    if (i < cur) return step.signs[i] === '-' ? 'bad' : 'ok'
    return 'dim'
  }

  /** 格下数值：已处理的带上该位的符号，未处理的只显示查表值 */
  const valueLabel = (i: number) => {
    const sign = step.signs[i]
    const processed = done || i <= cur
    if (!processed || sign === '') return `${step.values[i]}`
    return `${sign === '-' ? '−' : '+'}${step.values[i]}`
  }

  /** undefined = 还没处理到，回退到 text-ink-soft */
  const valueColor = (i: number): string | undefined => {
    if (step.phase === 'init') return undefined
    if (done) return step.signs[i] === '-' ? TONE.hard : TONE.easy
    if (i === cur) return step.isSub ? TONE.hard : TONE.amber
    if (i === cur + 1) return TONE.teal
    if (i < cur) return step.signs[i] === '-' ? TONE.hard : TONE.easy
    return undefined
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 本步判定 */}
      <div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-xs text-ink-soft">
        {done ? (
          <>
            {step.chars.map((_, i) => (
              <span
                key={i}
                className="font-code text-sm font-semibold"
                style={{ color: step.signs[i] === '-' ? TONE.hard : TONE.easy }}
              >
                {i === 0 ? '' : step.signs[i] === '-' ? '−' : '+'}
                {step.values[i]}
              </span>
            ))}
            <span>=</span>
            <span className="font-code text-sm font-bold" style={{ color: TONE.easy }}>
              {step.result}
            </span>
          </>
        ) : step.phase === 'init' ? (
          <>
            <span>尚未开始比较：result =</span>
            <span className="font-code font-bold text-ink">0</span>
            <span>，还没有任何一位的加减方式被确定。</span>
          </>
        ) : (
          <>
            <span>判定</span>
            <span className="font-code font-semibold text-ink">
              s[{cur}] = '{step.chars[cur]}'（{curVal}）
            </span>
            {hasNext ? (
              <>
                <span className="font-code font-bold" style={{ color: step.isSub ? TONE.hard : TONE.ink }}>
                  {step.isSub ? '<' : '≥'}
                </span>
                <span className="font-code font-semibold text-ink">
                  s[{cur + 1}] = '{nextChar}'（{nextVal}）
                </span>
              </>
            ) : (
              <span>没有右邻</span>
            )}
            <span>→ 这一位{step.isSub ? '减去' : '加上'}</span>
            <span
              className="font-code font-semibold"
              style={{ color: step.isSub ? TONE.hard : TONE.easy }}
            >
              {curVal}
            </span>
            <span>，result =</span>
            <span className="font-code text-sm font-bold text-ink">{step.result}</span>
          </>
        )}
      </div>

      {/* 字符行：旗标在格上，字符在格内，格下是字符值与下标 */}
      <div className="w-full max-w-[560px]">
        <div className="flex w-full">
          {step.chars.map((_, i) => {
            const label =
              step.phase === 'step' && i === cur
                ? 'i'
                : step.phase === 'step' && i === cur + 1
                  ? 'i+1'
                  : undefined
            const tone = step.phase === 'step' && i === cur ? (step.isSub ? 'hard' : 'amber') : 'teal'
            return (
              <div key={i} className="flex min-w-0 flex-1 justify-center">
                <Flag label={label} tone={tone} />
              </div>
            )
          })}
        </div>

        <div className="flex w-full">
          {step.chars.map((ch, i) => (
            <div key={i} className="flex min-w-0 flex-1 justify-center px-[3px]">
              <Cell state={stateOf(i)} className="w-full min-w-0 sm:min-w-0">
                {ch}
              </Cell>
            </div>
          ))}
        </div>

        <div className="mt-1 flex w-full">
          {step.chars.map((_, i) => (
            <span
              key={i}
              className="min-w-0 flex-1 text-center font-code text-[11px] font-semibold text-ink-soft"
              style={valueColor(i) ? { color: valueColor(i) } : undefined}
            >
              {valueLabel(i)}
            </span>
          ))}
        </div>

        <div className="flex w-full">
          {step.chars.map((_, i) => (
            <span key={i} className="min-w-0 flex-1 text-center font-code text-[10px] text-ink-soft">
              {i}
            </span>
          ))}
        </div>
      </div>

      <Badges className="justify-center">
        <Stat
          label="当前下标 i"
          value={step.phase === 'init' ? '—' : done ? 'n = ' + n : cur}
          tone="amber"
        />
        <Stat label="累计总和 result" value={step.result} tone="easy" />
        {step.phase === 'step' && (
          <Stat
            label="这一位"
            value={`${step.isSub ? '−' : '+'}${curVal}`}
            tone={step.isSub ? 'hard' : 'easy'}
          />
        )}
        {hint && <Hint tone={step.phase === 'step' && step.isSub ? 'hard' : 'teal'}>{hint}</Hint>}
        {done && <Answer>result = {step.result}</Answer>}
      </Badges>
    </div>
  )
}

export default function RomanToIntegerDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="罗马数字逐位加减"
      info={`s = "${S}"（题解示例 5，答案 1994）。逐字符查表后与紧邻的右邻比较：当前值小于右邻就减去它，否则加上。示例 2/3 的 IV、IX 仅 2 个字符、总共 4 步且只含减法分支，看不出加法位；这里取示例 5：7 个字符 9 步，能同时呈现 CM / XC / IV 三种减法组合与普通加法位。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: 'i：当前处理的字符' },
        { color: TONE.teal, label: 'i + 1：右邻比较对象' },
        { color: TONE.easy, label: '已确定：加法位 +值' },
        { color: TONE.hard, label: '已确定：减法位 −值' },
        { color: TONE.muted, label: '尚未处理' },
      ]}
    />
  )
}
