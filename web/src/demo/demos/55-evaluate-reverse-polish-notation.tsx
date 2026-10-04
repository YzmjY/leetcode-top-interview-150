import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badge, Badges, Cell, Flag, Hint, Stat, TONE, type CellState } from './stage'

/* ------------------------------------------------------------------ */
/* 55. 逆波兰表达式求值 —— 模式 G：tokens 扫描行 + 操作数栈              */
/* 数字直接入栈；运算符先弹出栈顶（后入栈的）作右操作数 b，             */
/* 再弹出次顶（先入栈的）作左操作数 a，算出 a op b 后把结果压回栈顶。    */
/* ------------------------------------------------------------------ */

/** 固定示例输入（题解「示例 2」：tokens = ["4","13","5","/","+"]，输出 6） */
const TOKENS = ['4', '13', '5', '/', '+']
/** 与示例 2 等价的中缀写法，只用于说明 */
const INFIX = '(4 + (13 / 5))'
/** 四个合法运算符；题解用 switch 整串精确匹配，所以 "-11" 这类负数不会被误判 */
const OPERATORS = ['+', '-', '*', '/']

/** 题解的整数除法：向零截断（Go 的 "/" 就是向零截断，不能换成 Math.floor） */
function applyOp(op: string, a: number, b: number): number {
  if (op === '+') return a + b
  if (op === '-') return a - b
  if (op === '*') return a * b
  return Math.trunc(a / b)
}

function isNumber(token: string): boolean {
  return !OPERATORS.includes(token)
}

/** 栈内容的文字写法，空栈写成「空」 */
function fmtStack(xs: number[]): string {
  return xs.length === 0 ? '空' : `[${xs.join(', ')}]`
}

interface Step {
  phase: 'init' | 'push' | 'pop' | 'calc' | 'done'
  /** 本步正在处理的 token 下标；init 为 -1，done 为 TOKENS.length */
  k: number
  /** 本步的 token；init / done 为 null */
  token: string | null
  /** 本步画面上的栈内容（下标 0 = 栈底，自下而上） */
  stack: number[]
  /** 左操作数：较先入栈、后弹出；只有 pop / calc 步有值 */
  a: number | null
  /** 右操作数：后入栈、先弹出；只有 pop / calc 步有值 */
  b: number | null
  /** 本步算出的结果（calc 步已压回栈顶）；只有 calc 步有值 */
  result: number | null
  note: string
  /** 下一步动作（由后一个快照统一回填，供 Hint 使用） */
  next: string
}

/** 跑一遍真实算法，每个 token 留不可变快照：数字 1 步、运算符 2 步（弹出 / 压回） */
function buildSteps(): Step[] {
  const stack: number[] = []
  const steps: Step[] = []

  const snap = (
    phase: Step['phase'],
    k: number,
    patch: { a?: number; b?: number; result?: number },
    note: string
  ) => {
    steps.push({
      phase,
      k,
      token: k >= 0 && k < TOKENS.length ? TOKENS[k] : null,
      stack: stack.slice(),
      a: patch.a ?? null,
      b: patch.b ?? null,
      result: patch.result ?? null,
      note,
      next: '',
    })
  }

  snap(
    'init',
    -1,
    {},
    `观察：输入 tokens = ${JSON.stringify(TOKENS)} 共 ${TOKENS.length} 个 token，对应中缀式 ${INFIX}。判断：后缀表达式里运算符紧跟在它的两个操作数之后，所以遇到运算符时，它的左右操作数一定就是栈顶的两个数。动作：准备一个空栈，用下标 0 起从左到右扫描 tokens。为什么：不变量是「处理完前 k 个 token 后，栈中自底向顶恰好是这 k 个 token 化简后剩下的操作数序列」。`
  )

  for (let k = 0; k < TOKENS.length; k++) {
    const token = TOKENS[k]

    if (isNumber(token)) {
      const value = parseInt(token, 10)
      stack.push(value)
      const followToken = TOKENS[k + 1]
      const follow =
        followToken !== undefined && !isNumber(followToken)
          ? `；下一个 token 就是运算符 "${followToken}"，它要取的两个操作数正是栈顶这些数`
          : ''
      snap(
        'push',
        k,
        {},
        `观察：tokens[${k}] = "${token}" 不是四个运算符之一，是一个整数。判断：数字本身就是一个不含运算符的子表达式，直接入栈即可，不需要弹栈${follow}。动作：把 "${token}" 解析为 ${value} 并压入栈顶，栈自底向顶变成 ${fmtStack(stack)}。为什么：栈里保存的是还没被运算符消费掉的操作数，自底向顶保持它们在表达式中出现的顺序，所以运算符出现时栈顶两个数就是它的左右操作数。`
      )
      continue
    }

    const a = stack[stack.length - 2]
    const b = stack[stack.length - 1]
    const before = fmtStack(stack)
    const flip =
      token === '-' || token === '/'
        ? `，写成 b ${token} a 会得到 ${applyOp(token, b, a)}，与正确答案不同`
        : ''
    const why =
      token === '-' || token === '/'
        ? `为什么：后缀式 a b ${token} 的语义就是 a ${token} b —— a 先入栈、b 后入栈，次序颠倒减法和除法会得到完全不同的值。`
        : `为什么：后缀式 a b ${token} 的语义是 a ${token} b；${token} 交换后结果虽然相同，但 a、b 的取法必须与减号、除号保持一致，不能按 token 改顺序。`

    stack.length -= 2
    const rest = fmtStack(stack)

    snap(
      'pop',
      k,
      { a, b },
      `观察：tokens[${k}] = "${token}" 是运算符，弹出前栈自底向顶是 ${before}。判断：栈顶的 ${b} 后入栈、最先弹出，它是右操作数 b；紧随其下的 ${a} 是左操作数 a，本题要算 a ${token} b = ${a} ${token} ${b}${flip}。动作：先弹出 ${b} 记作 b，再弹出 ${a} 记作 a，两个操作数都拿到后再做运算。${why}`
    )

    const result = applyOp(token, a, b)
    stack.push(result)

    snap(
      'calc',
      k,
      { a, b, result },
      `观察：两个操作数已经弹出，栈里剩下 ${rest}。判断：手里是 a = ${a}、b = ${b}${token === '/' ? '，题目要求两个整数相除向零截断' : ''}。动作：算得 ${a} ${token} ${b} = ${result}，把 ${result} 压回栈顶，栈变成 ${fmtStack(stack)}。为什么：这一对操作数已经被替换成它们的值，不变量要求栈里始终保存「已处理前缀化简后的操作数序列」。`
    )
  }

  const answer = stack[0]
  snap(
    'done',
    TOKENS.length,
    {},
    `观察：${TOKENS.length} 个 token 全部处理完，栈里只剩 ${fmtStack(stack)}，与中缀式 ${INFIX} 的结果吻合。判断：表达式合法时整个式子已经化简成一个操作数，它就是表达式的值，所以取 stack[0]。动作：答案 = ${answer}。为什么：每个 token 只被读一次、最多入栈出栈各一次，时间 O(n)；栈最坏存下所有操作数，空间 O(n)。`
  )

  // Hint 统一由「后一个快照」回填，保证说的是下一步而不是本步已完成的动作
  steps.forEach((s, i) => {
    const n = steps[i + 1]
    if (!n) return
    if (n.phase === 'push') s.next = `读取 tokens[${n.k}] = "${n.token}"，它是数字，压入栈顶`
    else if (n.phase === 'pop')
      s.next = `读取 tokens[${n.k}] = "${n.token}" 是运算符，先弹出 b = ${n.b}，再弹出 a = ${n.a}`
    else if (n.phase === 'calc')
      s.next = `计算 a ${n.token} b = ${n.a} ${n.token} ${n.b} = ${n.result}，把结果压回栈`
    else if (n.phase === 'done') s.next = '扫描结束，读出栈中唯一的元素作为答案'
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

type LayerState = 'idle' | 'active' | 'new' | 'warn' | 'ok'

const LABEL_CLASS: Record<LayerState, string> = {
  idle: 'text-ink-soft',
  active: 'text-[hsl(var(--amber))]',
  new: 'text-[hsl(var(--teal))]',
  warn: 'text-[hsl(var(--medium))]',
  ok: 'text-[hsl(var(--easy))]',
}

interface Layer {
  value: number
  state: LayerState
  label: string
  /** 本步刚落入栈顶的元素：挂一次性入场动效 */
  entering: boolean
}

/** 本步动作标签（徽章用） */
function actionLabel(step: Step): string {
  switch (step.phase) {
    case 'init':
      return '准备空栈'
    case 'push':
      return `数字 ${step.token} 入栈`
    case 'pop':
      return `弹出 b = ${step.b}、a = ${step.a}`
    case 'calc':
      return `压回结果 ${step.result}`
    default:
      return '读出答案'
  }
}

/** 运算面板里 a / b / 结果 的配色：teal=左操作数 · medium=右操作数 · easy=结果 */
const STATE_TONE = { new: 'teal', warn: 'medium', ok: 'easy' } as const

/** 一个操作数（或结果）单元：上方字母标签、中间等宽数值、下方先后说明 */
function Operand({
  tag,
  order,
  value,
  state,
}: {
  tag: string
  order: string
  value: number
  state: 'new' | 'warn' | 'ok'
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="font-code text-[10px] font-bold" style={{ color: TONE[STATE_TONE[state]] }}>
        {tag}
      </span>
      <Cell state={state} size="sm" className="h-9 w-12 shrink-0">
        {value}
      </Cell>
      <span className="text-[9px] leading-none text-ink-soft">{order}</span>
    </div>
  )
}

/** 右侧「本步运算」面板：写清 a 与 b 各自是谁、谁先弹出 */
function OpPanel({ step }: { step: Step }) {
  const isOp = (step.phase === 'pop' || step.phase === 'calc') && step.a !== null && step.b !== null
  const a = step.a as number
  const b = step.b as number
  const op = step.token as string
  const orderMatters = op === '-' || op === '/'

  return (
    <div className="flex w-full min-w-0 flex-col items-stretch gap-2 rounded-lg border border-border bg-card px-3 py-3 sm:w-[248px]">
      <span className="text-center text-[11px] font-medium text-ink">本步运算（左操作数写在运算符左边）</span>

      {step.phase === 'push' && (
        <p className="text-[11px] leading-relaxed text-ink-soft">
          tokens[{step.k}] = <b className="font-code text-ink">{step.token}</b> 是数字，直接压入栈顶。
        </p>
      )}

      {isOp && (
        <>
          <div className="flex items-end justify-center gap-2">
            <Operand tag="a" order="后弹出" value={a} state="new" />
            <span className="pb-6 font-code text-sm font-bold text-ink">{op}</span>
            <Operand tag="b" order="先弹出" value={b} state="warn" />
            <span className="pb-6 font-code text-sm font-bold text-ink">=</span>
            {step.result === null ? (
              <div className="flex flex-col items-center gap-0.5">
                <span className="font-code text-[10px] font-bold text-ink-soft">结果</span>
                <Cell state="warn" size="sm" className="h-9 w-12 shrink-0">
                  ?
                </Cell>
                <span className="text-[9px] leading-none text-ink-soft">待计算</span>
              </div>
            ) : (
              <Operand tag="结果" order="压回栈" value={step.result} state="ok" />
            )}
          </div>
          <p className="text-[10px] leading-relaxed text-ink-soft">
            先弹出的是栈顶 <b className="font-code">b = {b}</b>（右操作数），再弹出 <b className="font-code">a = {a}</b>
            （左操作数）；
            {orderMatters ? (
              <>
                {' '}
                写成 <b className="font-code">b {op} a = {applyOp(op, b, a)}</b> 与正确答案不同，顺序不能反。
              </>
            ) : (
              <> {op} 交换后结果虽然相同，但 a、b 的取法必须与减号、除号保持一致。</>
            )}
          </p>
        </>
      )}

      {step.phase === 'init' && (
        <p className="text-[11px] leading-relaxed text-ink-soft">栈为空，还没有可以参与运算的操作数。</p>
      )}

      {step.phase === 'done' && (
        <p className="text-[11px] leading-relaxed text-ink-soft">
          全部 {TOKENS.length} 个 token 都已处理，栈里只剩一个数，它就是 <b className="font-code">{INFIX}</b> 的值。
        </p>
      )}
    </div>
  )
}

function Stage(step: Step) {
  const done = step.phase === 'done'
  const top = step.stack.length - 1

  const layers: Layer[] = step.stack.map((value, i) => {
    if (i !== top) return { value, state: 'idle', label: '', entering: false }
    if (step.phase === 'push') return { value, state: 'active', label: '本步压入（栈顶）', entering: true }
    if (step.phase === 'calc') return { value, state: 'ok', label: '本步结果（栈顶）', entering: true }
    if (done) return { value, state: 'ok', label: '唯一元素 = 答案', entering: false }
    return { value, state: 'idle', label: '栈顶', entering: false }
  })

  const chip =
    step.phase === 'push'
      ? `↓ 压入 ${step.token}`
      : step.phase === 'pop'
        ? `↑ 先弹出 b = ${step.b}，再弹出 a = ${step.a}`
        : step.phase === 'calc'
          ? `↓ 压回结果 ${step.result}`
          : null

  const chipTone = step.phase === 'pop' ? 'medium' : step.phase === 'calc' ? 'easy' : 'amber'

  return (
    <div className="flex w-full flex-col items-center gap-4">
      {/* 上方：tokens 扫描行，下标 k 自左向右递增 */}
      <div className="flex w-full flex-col items-center gap-1.5">
        <span className="text-[11px] text-ink-soft">
          输入 tokens（逆波兰表达式），从左到右扫描，<b className="font-code text-ink">i</b> = 当前 token
        </span>
        <div
          className="grid w-full gap-1 sm:gap-1.5"
          style={{ gridTemplateColumns: `repeat(${TOKENS.length}, minmax(0, 1fr))` }}
        >
          {TOKENS.map((token, k) => {
            const active = !done && k === step.k
            const handled = done || k < step.k
            const state: CellState = active ? 'active' : handled ? 'dim' : 'idle'
            return (
              <div key={k} className="flex min-w-0 flex-col items-center gap-0.5">
                <Flag label={active ? 'i' : undefined} tone="amber" />
                <Cell
                  state={state}
                  size="sm"
                  className="h-9 w-full min-w-0 px-0.5 text-[12px] sm:text-[13px]"
                >
                  {token}
                </Cell>
                <span
                  className={
                    active
                      ? 'font-code text-[11px] font-bold text-[hsl(var(--amber))]'
                      : 'font-code text-[11px] text-ink-soft'
                  }
                >
                  {k}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* 下方：操作数栈容器 + 本步运算面板 */}
      <div className="flex w-full flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-center sm:gap-8">
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[11px] text-ink-soft">
            操作数栈：自下而上，<b className="font-code">栈顶</b> 在上
          </span>

          {/* 落入 / 弹出的通道：高度固定，切换步骤时不跳动 */}
          <div className="flex h-7 flex-wrap items-center justify-center gap-1">
            {chip !== null && <Badge tone={chipTone}>{chip}</Badge>}
          </div>

          {/* 顶部开口：虚线表示元素从这里进出 */}
          <div className="w-[172px] border-t-2 border-dashed border-border sm:w-[200px]" />

          <div className="flex min-h-[132px] w-[172px] flex-col-reverse justify-start gap-1.5 rounded-b-lg border-x-2 border-b-[3px] border-border bg-card px-2 pb-2 pt-2 sm:w-[200px]">
            {layers.length === 0 ? (
              <div className="flex flex-1 items-center justify-center text-[11px] text-ink-soft">
                （空栈）
              </div>
            ) : (
              layers.map((l, i) => (
                <div
                  key={`${i}-${l.value}`}
                  className={l.entering ? 'fade-up flex items-center gap-1.5' : 'flex items-center gap-1.5'}
                >
                  <Cell state={l.state} size="sm" className="h-8 w-14 shrink-0 text-[13px] sm:w-16">
                    {l.value}
                  </Cell>
                  <span
                    className={`min-w-0 flex-1 truncate text-[10px] leading-tight ${LABEL_CLASS[l.state]}`}
                  >
                    {l.label}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <OpPanel step={step} />
      </div>

      <Badges className="justify-center">
        <Stat label="当前 token" value={step.token ?? '—'} tone="amber" />
        <Stat label="栈大小" value={step.stack.length} tone={step.phase === 'pop' ? 'medium' : 'ink'} />
        <Badge tone={step.phase === 'calc' ? 'easy' : step.phase === 'push' ? 'amber' : 'plain'}>
          本步动作 <b className="font-code">{actionLabel(step)}</b>
        </Badge>
        {done ? (
          <Answer>
            表达式求值结果 = <b className="font-code">{step.stack[0]}</b>
          </Answer>
        ) : (
          step.next !== '' && <Hint>{step.next}</Hint>
        )}
      </Badges>
    </div>
  )
}

export default function EvaluateReversePolishNotationDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="tokens 一次扫描 + 操作数栈"
      info={`输入：tokens = ${JSON.stringify(TOKENS)}（题解示例 2，预期输出 6，对应中缀式 ${INFIX}），全程 ${steps.length} 步、无省略。这里取示例 2 而不是更短的示例 1（["2","1","+","3","*"]），是因为示例 1 只有 + 和 *，左右操作数颠倒也看不出差别；示例 2 的 13 / 5 = 2（向零截断）能暴露「先弹出的是右操作数 b」这个最容易错的点。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '本步处理的 token / 刚压入的栈顶' },
        { color: TONE.teal, label: '左操作数 a（较先入栈、后弹出）' },
        { color: TONE.medium, label: '右操作数 b（后入栈、先弹出）' },
        { color: TONE.easy, label: '算出的结果（压回栈顶 / 最终答案）' },
        { color: TONE.muted, label: '已扫描过的 token' },
      ]}
    />
  )
}
