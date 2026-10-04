import { Fragment, useMemo, type ReactNode } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badges, Cell, Flag, Hint, Stat, TONE, type CellState } from './stage'

/* ------------------------------------------------------------------ */
/* 45. 快乐数 —— 模式 A：横向链式单元格 + 哈希集合 seen 判环            */
/* ------------------------------------------------------------------ */

/** 题解示例 1：n = 19（输出 true），平方和序列 19 → 82 → 68 → 100 → 1 */
const N = 19

/** 当前 n（含当前格）与辅助行的等宽数值样式 */
const NUM = 'font-code text-[13px] font-semibold text-ink'

interface Step {
  /** 本步正在处理的数：record 步是刚入集合的数，compute 步是刚算出的新数 */
  n: number
  /** 已记入 seen 的数（不可变快照） */
  seen: number[]
  /** 平方和序列快照（含起点），最后一项即当前 n */
  chain: number[]
  /** 本步拆开的各位数字，只有 compute 步非空 */
  digits: number[]
  /** 各位数字的平方，与 digits 一一对应 */
  parts: number[]
  phase: 'init' | 'record' | 'compute' | 'done'
  note: string
}

/** 各位数字的平方和；digits / parts 按高位到低位排列 */
function squareSum(n: number): { digits: number[]; parts: number[]; sum: number } {
  const digits: number[] = []
  const parts: number[] = []
  let x = n
  while (x > 0) {
    const d = x % 10
    digits.unshift(d)
    parts.unshift(d * d)
    x = Math.floor(x / 10)
  }
  return { digits, parts, sum: parts.reduce((a, b) => a + b, 0) }
}

function buildSteps(): Step[] {
  const steps: Step[] = []
  const chain: number[] = [N]
  const seen: number[] = []
  let n = N

  const push = (phase: Step['phase'], snapshotN: number, note: string, s = squareSum(snapshotN)) => {
    steps.push({
      n: snapshotN,
      seen: seen.slice(),
      chain: chain.slice(),
      digits: phase === 'compute' ? s.digits : [],
      parts: phase === 'compute' ? s.parts : [],
      phase,
      note,
    })
  }

  push(
    'init',
    n,
    `观察：输入 n = ${N}，seen 集合为空，平方和序列里只有起点 ${N}。判断：循环的不变量是「当前 n 之前出现过的数都已存进 seen」，一旦某个数再次出现，后续计算必然原样重复，就再也到不了 1。动作：进入循环，先检查 ${N} 是否已在 seen 中，再决定是记入集合还是立刻返回 false。`
  )

  while (n !== 1) {
    if (seen.includes(n)) {
      // 判环分支：本题示例 1 一路到 1，不会走到这里（示例 2 的 n = 2 会命中）
      push(
        'done',
        n,
        `观察：当前 n = ${n} 已经出现在 seen 中。判断：后继函数是确定性的，同一个数第二次出现意味着之后的路径会原样重演，永远到不了 1。动作：返回 false。边界：状态空间有限，重复一定在有限步内出现，所以判环不会无限跑下去。`
      )
      return steps
    }

    seen.push(n)
    push(
      'record',
      n,
      `观察：当前 n = ${n}，seen 里已有 ${seen.length - 1} 个数。判断：${n} 不在集合里，检测必须在记入之前做，此刻说明序列尚未出现重复。动作：把 ${n} 记入 seen，集合变成 {${seen.join(', ')}}，这样它以后再出现时就能被立刻认出来。`
    )

    const s = squareSum(n)
    n = s.sum
    chain.push(n)
    push(
      'compute',
      n,
      `观察：${chain[chain.length - 2]} 的各位数字是 ${s.digits.join('、')}。判断：按定义把每位数字平方后相加，${s.parts.join(' + ')} = ${s.sum}。动作：n 更新为 ${s.sum}，序列接上 ${s.sum} 并回到循环开头。${
        s.sum === 1
          ? '此时循环条件 n ≠ 1 不再成立，下一步退出循环返回 true。'
          : `${s.sum} ≠ 1，循环继续。`
      }`
    )
  }

  push(
    'done',
    n,
    `观察：平方和序列 ${chain.join(' → ')} 共走了 ${chain.length - 1} 次平方和到达 1，途中没有任何数重复出现。判断：按定义「结果为 1」即为快乐数，所以 ${N} 是快乐数。动作：返回 true。复杂度：每次拆分 n 的数位需要 O(log n)，seen 最多存下沿途出现的不同数，空间同样 O(log n)。`
  )
  return steps
}

/* ---------------- 舞台渲染 ---------------- */

function nextAction(step: Step): string | null {
  if (step.phase === 'done') return null
  if (step.phase === 'init') return `检查 ${step.n} 是否已在 seen 中，不在就把它记入集合`
  if (step.phase === 'record') return `计算 ${step.n} 的各位数字平方和，得到下一个 n`
  if (step.n === 1) return 'n = 1，循环条件 n ≠ 1 不成立，退出循环并返回 true'
  return `回到循环开头，检查 ${step.n} 是否已在 seen 中`
}

/** 非 compute 步在「各位数字平方和」区显示的一行说明 */
function lede(step: Step): ReactNode {
  if (step.phase === 'init') {
    return (
      <>
        seen 集合为空，序列从起点 <b className={NUM}>{step.n}</b> 出发
      </>
    )
  }
  if (step.phase === 'record') {
    return (
      <>
        <b className={NUM}>{step.n}</b> 不在 seen 中 → 记入集合（现 <b className={NUM}>{step.seen.length}</b> 个）
      </>
    )
  }
  if (step.n === 1) {
    return (
      <>
        序列 <b className={NUM}>{step.chain.join(' → ')}</b>，共 <b className={NUM}>{step.chain.length - 1}</b> 次平方和到达 1
      </>
    )
  }
  return (
    <>
      <b className={NUM}>{step.n}</b> 重复出现，序列在这里成环
    </>
  )
}

function Stage(step: Step) {
  const curIdx = step.chain.length - 1
  const happy = step.phase === 'done' && step.n === 1
  const failed = step.phase === 'done' && step.n !== 1
  const hint = nextAction(step)

  return (
    <div className="flex flex-col items-center gap-3">
      {/* 链式序列：值在格内、序号与状态在格下、当前指针旗标在格上 */}
      <div className="flex w-full max-w-[560px] flex-col items-center gap-1">
        <span className="text-[11px] text-ink-soft">平方和序列：每步算出的新数接在右边</span>
        <div className="flex w-full flex-wrap items-center justify-center gap-y-2">
          {step.chain.map((v, i) => {
            const isCur = i === curIdx
            const cellState: CellState = isCur ? (failed ? 'bad' : 'active') : 'ok'
            const word = isCur
              ? happy
                ? '到达 1'
                : failed
                  ? '重复，成环'
                  : step.phase === 'init'
                    ? '起点，当前 n'
                    : '当前 n'
              : '已记入 seen'
            const tone = isCur ? (failed ? TONE.hard : TONE.amber) : TONE.easy
            return (
              <Fragment key={i}>
                {i > 0 && <span className="mx-1 font-code text-[13px] text-ink-soft">→</span>}
                <div className="flex flex-col items-center">
                  <Flag label={isCur ? 'n' : undefined} tone={failed ? 'hard' : 'amber'} />
                  <Cell state={cellState} size="sm">
                    {v}
                  </Cell>
                  <span className="mt-0.5 font-code text-[10px] text-ink-soft">{i}</span>
                  <span className="whitespace-nowrap text-[10px] font-medium" style={{ color: tone }}>
                    {word}
                  </span>
                </div>
              </Fragment>
            )
          })}
        </div>
      </div>

      {/* 本步在做：各位数字平方后相加 */}
      <div className="flex w-full max-w-[560px] flex-col items-center gap-1">
        <span className="text-[11px] text-ink-soft">本步：各位数字平方后相加</span>
        <div className="flex min-h-[56px] w-full flex-wrap items-center justify-center gap-1.5">
          {step.phase === 'compute' ? (
            <>
              {step.digits.map((d, k) => (
                <div key={k} className="flex flex-col items-center gap-0.5">
                  <Cell state="new" size="sm">
                    {d}
                  </Cell>
                  <span className="font-code text-[10px] text-ink-soft">
                    {d}² = {d * d}
                  </span>
                </div>
              ))}
              <span className="mx-0.5 font-code text-[13px] text-ink-soft">=</span>
              <span className="font-code text-[13px] font-semibold text-ink">{step.parts.join(' + ')}</span>
              <span className="mx-0.5 font-code text-[13px] text-ink-soft">=</span>
              <Cell state="active" size="sm">
                {step.n}
              </Cell>
            </>
          ) : (
            <span className="px-2 text-center text-xs leading-relaxed text-ink-soft">{lede(step)}</span>
          )}
        </div>
      </div>

      {/* 哈希集合 seen：记入过的中间结果 */}
      <div className="flex w-full max-w-[560px] flex-col items-center gap-1">
        <span className="text-[11px] text-ink-soft">哈希集合 seen：记入过的数，再次出现即判定成环</span>
        <div className="flex min-h-[36px] flex-wrap items-center justify-center gap-1.5">
          {step.seen.length === 0 ? (
            <span className="text-xs text-ink-soft">（空）</span>
          ) : (
            step.seen.map((v) => (
              <Cell key={v} state="ok" size="sm">
                {v}
              </Cell>
            ))
          )}
        </div>
      </div>

      <Badges className="justify-center">
        <Stat label="当前 n" value={step.n} tone={failed ? 'hard' : 'amber'} />
        <Stat label="seen 大小" value={step.seen.length} tone="easy" />
        {hint && <Hint tone={failed ? 'hard' : 'teal'}>{hint}</Hint>}
        {step.phase === 'done' && (
          <Answer>
            {happy
              ? `${N} 是快乐数：${step.chain.join(' → ')}，返回 true`
              : `${N} 不是快乐数：${step.n} 重复出现，返回 false`}
          </Answer>
        )}
      </Badges>
    </div>
  )
}

export default function HappyNumberDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="平方和序列 + 哈希集合判环"
      info={`n = ${N}（题解示例 1，输出 true）：每轮先查 seen 里是否已有当前数，再把它记入 seen，最后算各位数字平方和；序列 ${N} → 82 → 68 → 100 → 1，4 次平方和到 1。题解示例 2（n = 2）要 9 次平方和才回到 4、链长 10 格，为把整条链放在一屏内，这里只演示示例 1 的 true 分支（判环分支见题解的快慢指针写法）。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '当前 n：本步正在处理的数（走到 1 即判定为快乐数）' },
        { color: TONE.easy, label: '已记入 seen 的数（序列里已走过）' },
        { color: TONE.teal, label: '本步拆开的各位数字' },
      ]}
    />
  )
}
