import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badge, Badges, Cell, Flag, Hint, Stat, TONE, type CellState } from './stage'

/* ------------------------------------------------------------------ */
/* 56. 基本计算器 —— 模式 G：状态栈，每层一对「外层 result / 外层 sign」  */
/* 遇 '(' 把当前 result 与 sign 压栈并清空进入新层；遇 ')' 结算括号内的   */
/* 值，先弹 sign 相乘、再弹 result 相加，把子表达式并回外层。             */
/* ------------------------------------------------------------------ */

/** 题解「示例 3」：唯一含括号的官方示例，也是最小的含括号输入 */
const S = '(1+(4+5+2)-3)+(6+8)'
const CHARS = S.split('')

const fmtSign = (v: number) => (v > 0 ? '+1' : '-1')

type Phase = 'init' | 'digit' | 'sign' | 'open' | 'close' | 'done'

/** 栈里的一层：进入这层括号之前保存的外层 result 与外层 sign */
interface Layer {
  result: number
  sign: number
}

interface Step {
  phase: Phase
  /** 当前扫描的字符下标：init 为 -1，done 为 S.length */
  index: number
  ch: string | null
  result: number
  num: number
  sign: number
  /** 本步操作完成后的栈内容（下标 0 = 栈底），每层一对 */
  stack: Layer[]
  /** 本步压入的一对（open 步） */
  pushed: Layer | null
  /** 本步弹出的一对（close 步） */
  popped: Layer | null
  /** close 步：括号内结算出来的值 */
  inner: number | null
  note: string
  /** 下一步动作，由后一个快照回填，供 Hint 使用 */
  next: string
}

function buildSteps(): Step[] {
  /** 平铺的栈：result, sign, result, sign, … 每两个数构成一层 */
  const flat: number[] = []
  const steps: Step[] = []
  let result = 0
  let num = 0
  let sign = 1

  const layers = (): Layer[] => {
    const out: Layer[] = []
    for (let k = 0; k + 1 < flat.length; k += 2) out.push({ result: flat[k], sign: flat[k + 1] })
    return out
  }

  const snap = (o: {
    phase: Phase
    index: number
    ch: string | null
    pushed?: Layer
    popped?: Layer
    inner?: number
    note: string
  }) => {
    steps.push({
      phase: o.phase,
      index: o.index,
      ch: o.ch,
      result,
      num,
      sign,
      stack: layers(),
      pushed: o.pushed ?? null,
      popped: o.popped ?? null,
      inner: o.inner ?? null,
      note: o.note,
      next: '',
    })
  }

  snap({
    phase: 'init',
    index: -1,
    ch: null,
    note: `观察：输入取题解示例 3 的 s = "${S}"（唯一含括号的官方示例），此刻 result = 0、num = 0、sign = +1，栈为空。判断：表达式里只有 + 和 -，没有乘除，所以不存在运算符优先级问题，难点只剩括号与一元负号。动作：从左到右逐字符扫描 s —— 数字用来拼 num，+ / - 只改写 sign，result 累计当前括号层里已结算的部分。为什么：把「加一个操作数」统一写成 result += sign × num，括号子表达式算完后再乘上栈里保存的 sign 并回外层，一套机制就能覆盖全部情形。`,
  })

  for (let i = 0; i < S.length; i++) {
    const ch = S[i]

    if (ch >= '0' && ch <= '9') {
      const prevNum = num
      num = num * 10 + (ch.charCodeAt(0) - 48)
      snap({
        phase: 'digit',
        index: i,
        ch,
        note: `观察：s[${i}] = '${ch}' 是数字，此刻 result = ${result}、sign = ${fmtSign(sign)}。判断：数字按 num = ${prevNum} × 10 + ${ch} 逐位累积，本示例每个数都只有 1 位。动作：num 变成 ${num}，result 与 sign 都保持不动。为什么：符号只作用于完整的操作数，必须等读到 +、-、) 或表达式结束才能结算 num。`,
      })
    } else if (ch === '+' || ch === '-') {
      const prevNum = num
      const prevSign = sign
      const prevResult = result
      result += sign * num
      num = 0
      sign = ch === '+' ? 1 : -1
      snap({
        phase: 'sign',
        index: i,
        ch,
        note: `观察：s[${i}] = '${ch}' 前面挂着一个读完的数字 ${prevNum}，它要先用当前的 sign = ${fmtSign(prevSign)} 结算。判断：结算之后 num 清零，sign 换成 ${fmtSign(sign)}，也就是下一个操作数取${sign > 0 ? '正' : '负'}。动作：result = ${prevResult} + (${fmtSign(prevSign)}) × ${prevNum} = ${result}，num = 0，sign = ${fmtSign(sign)}。为什么：减号只翻转 sign、不立刻做减法，一元负号（如 "-1"、"-(2+3)"）与二元减号因此共用同一条路径。`,
      })
    } else if (ch === '(') {
      const pair: Layer = { result, sign }
      flat.push(result, sign)
      result = 0
      sign = 1
      snap({
        phase: 'open',
        index: i,
        ch,
        pushed: pair,
        note: `观察：s[${i}] = '(' 后面是一段完整的子表达式，它要以「一个操作数」的身份参与外层运算。判断：进入新层会覆盖 result 和 sign，所以外层这对状态必须先存进栈里。动作：先把 result = ${pair.result} 压栈、再压 sign = ${fmtSign(pair.sign)}（于是栈顶是 sign），然后 result = 0、sign = 1。为什么：')' 结算完括号内的值后要乘上这里保存的 sign、再加回这里保存的 result，压栈顺序决定了弹栈时要先取符号。`,
      })
    } else {
      const prevNum = num
      result += sign * num
      const inner = result
      num = 0
      const outerSign = flat.pop()!
      result *= outerSign
      const outerResult = flat.pop()!
      result += outerResult
      snap({
        phase: 'close',
        index: i,
        ch,
        popped: { result: outerResult, sign: outerSign },
        inner,
        note: `观察：s[${i}] = ')' 之前的字符恰好构成一个完整子表达式，但括号内最后一个数字 ${prevNum} 还挂着没结算。判断：先结算它得到括号内的值 ${inner}，再按「先弹 sign、后弹 result」的顺序把括号内的值并回外层。动作：result = ${inner} × (${fmtSign(outerSign)}) = ${inner * outerSign}，再加弹栈得到的外层结果 ${outerResult}，result = ${result}，num 清零。为什么：括号子表达式只是带符号参与外层运算的一个操作数，弹栈顺序写反就会算错。`,
      })
    }
  }

  result += sign * num
  snap({
    phase: 'done',
    index: S.length,
    ch: null,
    note: `观察：s 的 ${S.length} 个字符已全部扫描完，result = ${result}，栈已经空了。判断：循环结束后还要补一次 result += sign × num，用来处理「表达式以数字收尾」的情况，这次 num = ${num}，所以数值不变。动作：返回 ${result}，与题解示例 3 的输出一致。为什么：每个字符只处理一次、每层括号只压弹各一次，时间 O(n)；栈深等于括号嵌套层数，最坏空间 O(n)。`,
  })

  // 「下一步动作」由后一个快照回填，保证 Hint 与步骤数据完全一致
  steps.forEach((s, i) => {
    const b = steps[i + 1]
    if (!b) return
    switch (b.phase) {
      case 'digit':
        s.next = `扫描 s[${b.index}] = '${b.ch}'：数字，num 累积成 ${b.num}`
        break
      case 'sign':
        s.next = `扫描 s[${b.index}] = '${b.ch}'：先结算 result += (${fmtSign(s.sign)}) × ${s.num} = ${b.result}，再把 sign 置为 ${fmtSign(b.sign)}`
        break
      case 'open': {
        const p = b.pushed
        if (p) {
          s.next = `扫描 s[${b.index}] = '('：把外层 result = ${p.result} 与 sign = ${fmtSign(p.sign)} 压栈，然后 result 清 0 进入新层`
        }
        break
      }
      case 'close':
        s.next = `扫描 s[${b.index}] = ')'：先结算括号内最后的数字得到 ${b.inner}，再弹栈把括号内的值并回外层`
        break
      case 'done':
        s.next = '字符扫描结束，补一次末尾结算后读出答案'
        break
      default:
        break
    }
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

/** 表达式单元格：当前字符琥珀、已扫描灰、未扫描白 */
function exprState(step: Step, i: number): CellState {
  if (step.phase === 'done') return 'dim'
  if (step.index < 0) return 'idle'
  if (i < step.index) return 'dim'
  if (i === step.index) return 'active'
  return 'idle'
}

function Stage(step: Step) {
  const done = step.phase === 'done'
  const cur = done ? -1 : step.index
  const pushed = step.pushed
  const popped = step.popped
  const top = step.stack.length - 1

  const caption = pushed ? (
    <>
      遇到 '('：先压 result = <b className="font-code">{pushed.result}</b>、再压 sign ={' '}
      <b className="font-code">{fmtSign(pushed.sign)}</b>，弹栈时先取栈顶的 sign。
    </>
  ) : popped ? (
    <>
      遇到 ')'：括号内值 <b className="font-code">{step.inner}</b> × 弹栈 sign{' '}
      <b className="font-code">{fmtSign(popped.sign)}</b> + 弹栈 result{' '}
      <b className="font-code">{popped.result}</b> = <b className="font-code">{step.result}</b>。
    </>
  ) : (
    <>遇到 ( 压入一对、遇到 ) 弹出并合并；栈深 = 括号嵌套层数。</>
  )

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full flex-wrap items-start justify-center gap-5 sm:gap-8">
        {/* 表达式：逐字符扫描 */}
        <div className="flex min-w-0 grow basis-80 flex-col gap-1.5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <span className="text-[11px] font-medium text-ink">表达式 s（逐字符扫描）</span>
            <span className="font-code text-[11px] text-ink-soft">
              {done || step.ch === null ? '扫描结束' : `当前字符 '${step.ch}'  i = ${step.index}`}
            </span>
          </div>
          <div className="grid w-full grid-cols-10 gap-1.5" style={{ maxWidth: 440 }}>
            {CHARS.map((c, i) => (
              <div key={i} className="flex min-w-0 flex-col items-center">
                <Flag label={i === cur ? 'i' : undefined} tone="amber" />
                <Cell state={exprState(step, i)} size="sm" className="w-full min-w-0">
                  {c}
                </Cell>
                <span className="mt-0.5 font-code text-[10px] text-ink-soft">{i}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 状态栈：每层两栏文字标签（结果 / 符号），栈底在下、新层从上方落入 */}
        <div className="flex shrink-0 flex-col items-center gap-1.5">
          <span className="text-[11px] font-medium text-ink">状态栈 stack</span>
          <span className="text-[10px] text-ink-soft">每层一对：外层 result / 外层 sign</span>

          {/* 落入 / 弹出的通道：高度固定，步骤切换时不跳动 */}
          <div className="flex h-8 items-center justify-center">
            {pushed ? (
              <Badge tone="amber">
                ↓ 压入 (result <b className="font-code">{pushed.result}</b>, sign{' '}
                <b className="font-code">{fmtSign(pushed.sign)}</b>)
              </Badge>
            ) : popped ? (
              <Badge tone="easy">
                ↑ 弹出 (result <b className="font-code">{popped.result}</b>, sign{' '}
                <b className="font-code">{fmtSign(popped.sign)}</b>)
              </Badge>
            ) : null}
          </div>

          {/* 两栏列标题，与层内两栏一一对齐 */}
          <div className="flex items-end gap-1.5">
            <span className="w-8 shrink-0" />
            <span className="flex w-12 shrink-0 flex-col items-center text-[10px] leading-tight text-ink sm:w-14">
              结果<span className="text-ink-soft">result</span>
            </span>
            <span className="flex w-11 shrink-0 flex-col items-center text-[10px] leading-tight text-ink sm:w-12">
              符号<span className="text-ink-soft">sign</span>
            </span>
            <span className="w-8 shrink-0" />
          </div>

          {/* 顶部开口：虚线阈值线 */}
          <div className="w-[196px] border-t-2 border-dashed border-border sm:w-[216px]" />

          {/* flex-col-reverse ⇒ 下标 0 沉在底部，新压入的一对从上方落入 */}
          <div className="flex min-h-[104px] w-[196px] flex-col-reverse justify-start gap-1.5 rounded-b-lg border-x-2 border-b-[3px] border-border bg-card px-2 pb-2 pt-2 sm:w-[216px]">
            {step.stack.length === 0 ? (
              <div className="flex flex-1 items-center justify-center text-[11px] text-ink-soft">
                （空）
              </div>
            ) : (
              step.stack.map((l, k) => {
                const isTop = k === top
                const st: CellState = step.phase === 'open' && isTop ? 'active' : isTop ? 'idle' : 'new'
                return (
                  <div
                    key={k}
                    className={
                      step.phase === 'open' && isTop
                        ? 'fade-up flex items-center gap-1.5'
                        : 'flex items-center gap-1.5'
                    }
                  >
                    <span className="w-8 shrink-0 text-right font-code text-[10px] text-ink-soft">
                      层{k + 1}
                    </span>
                    <Cell
                      state={st}
                      size="sm"
                      className="h-8 w-12 shrink-0 text-[12px] sm:h-9 sm:w-14 sm:text-[13px]"
                    >
                      {l.result}
                    </Cell>
                    <Cell
                      state={st}
                      size="sm"
                      className="h-8 w-11 shrink-0 text-[12px] sm:h-9 sm:w-12 sm:text-[13px]"
                    >
                      {fmtSign(l.sign)}
                    </Cell>
                    <span className="w-8 shrink-0 text-[10px] text-ink-soft">
                      {isTop ? '栈顶' : ''}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      <p className="text-center text-[10px] leading-relaxed text-ink-soft">{caption}</p>

      <Badges className="justify-center">
        <Stat label="result" value={step.result} tone={step.phase === 'close' ? 'easy' : 'ink'} />
        <Stat label="num" value={step.num} tone="ink" />
        <Stat label="sign" value={fmtSign(step.sign)} tone="ink" />
        {done ? (
          <Answer>
            s 的值 = <b className="font-code">{step.result}</b>
          </Answer>
        ) : (
          <Hint>{step.next}</Hint>
        )}
      </Badges>
    </div>
  )
}

export default function BasicCalculatorDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="遇到 '(' 压栈，遇到 ')' 弹栈合并"
      info={`输入（题解示例 3）：s = "${S}"，期望输出 23。示例 1、2 不含括号，演示不了压栈/弹栈，所以这里用唯一含括号的官方示例，并完整走完它的 ${S.length} 个字符，共 ${steps.length} 步。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '当前扫描的字符 / 本步压入的栈层（栈顶）' },
        { color: TONE.teal, label: '栈中更早保存的层（不是栈顶）' },
        { color: TONE.easy, label: '本步弹出的一对，括号内值已并回外层' },
        { color: TONE.muted, label: '已扫描过的字符' },
      ]}
    />
  )
}
