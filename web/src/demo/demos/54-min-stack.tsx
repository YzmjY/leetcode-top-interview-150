import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badge, Badges, Cell, Hint, Stat, TONE } from './stage'

/* ------------------------------------------------------------------ */
/* 54. 最小栈 —— 模式 G：栈 + 辅助栈双视图                              */
/* 主栈照常存全部元素；辅助栈第 k 层 = 主栈前 k 个元素中的最小值。      */
/* ------------------------------------------------------------------ */

type Op =
  | { name: 'push'; val: number }
  | { name: 'pop' }
  | { name: 'top' }
  | { name: 'getMin' }

/** 题解「示例 1」：规模最小，且覆盖 push / pop / top / getMin 四种操作 */
const INPUT: Op[] = [
  { name: 'push', val: -2 },
  { name: 'push', val: 0 },
  { name: 'push', val: -3 },
  { name: 'getMin' },
  { name: 'pop' },
  { name: 'top' },
  { name: 'getMin' },
]

function opLabel(op: Op): string {
  return op.name === 'push' ? `push(${op.val})` : `${op.name}()`
}

interface Step {
  /** 本操作完成后主栈的内容（下标 0 = 栈底） */
  stack: number[]
  /** 本操作完成后辅助栈的内容，与主栈等高 */
  minStack: number[]
  /** 到本步为止 getMin / top 的返回序列 */
  returns: number[]
  phase: 'init' | 'push' | 'pop' | 'getmin' | 'top' | 'done'
  /** 本步刚执行的操作在输入中的下标（init 为 -1，done 为输入长度） */
  opIndex: number
  op: string | null
  pushed: number | null
  pushedMin: number | null
  popped: number | null
  poppedMin: number | null
  ret: number | null
  note: string
}

function buildSteps(): Step[] {
  const stack: number[] = []
  const minStack: number[] = []
  const returns: number[] = []
  const steps: Step[] = []

  const snap = (
    phase: Step['phase'],
    opIndex: number,
    patch: {
      pushed?: number
      pushedMin?: number
      popped?: number
      poppedMin?: number
      ret?: number
    },
    note: string
  ) => {
    steps.push({
      stack: stack.slice(),
      minStack: minStack.slice(),
      returns: returns.slice(),
      phase,
      opIndex,
      op: opIndex >= 0 && opIndex < INPUT.length ? opLabel(INPUT[opIndex]) : null,
      pushed: patch.pushed ?? null,
      pushedMin: patch.pushedMin ?? null,
      popped: patch.popped ?? null,
      poppedMin: patch.poppedMin ?? null,
      ret: patch.ret ?? null,
      note,
    })
  }

  snap(
    'init',
    -1,
    {},
    '初始化：主栈 stack 与辅助栈 minStack 都为空。辅助栈的第 k 层记录主栈前 k 个元素中的最小值，所以 getMin 只要读它的栈顶就是 O(1)。不变量：两栈始终等高，且 minStack 栈顶恒等于主栈全部元素的最小值。'
  )

  INPUT.forEach((op, k) => {
    if (op.name === 'push') {
      const val = op.val
      const oldMin = minStack.length > 0 ? minStack[minStack.length - 1] : null
      const newMin = oldMin === null || val < oldMin ? val : oldMin
      stack.push(val)
      minStack.push(newMin)
      const note =
        oldMin === null
          ? `观察：push(${val}) 时两个栈都还是空的。判断：没有历史最小值可比较，${val} 自己就是当前最小值。动作：${val} 压入主栈，同一层也压入辅助栈。为什么：minStack 栈顶从此恒等于主栈全部元素的最小值。`
          : val < oldMin
            ? `观察：主栈新元素是 ${val}，辅助栈顶是 ${oldMin}。判断：${val} < ${oldMin}，最小值被刷新。动作：主栈压入 ${val}，辅助栈同步压入 ${val}。为什么：这一层记录的正是「加上 ${val} 之后」的最小值，两栈依然等高。`
            : `观察：主栈新元素是 ${val}，辅助栈顶是 ${oldMin}。判断：${val} ≥ ${oldMin}，最小值不会被刷新。动作：主栈压入 ${val}，辅助栈把当前最小值 ${oldMin} 再压一层。为什么：两栈保持等高，pop 时同步回退一层，最小值才能回到上一个状态。`
      snap('push', k, { pushed: val, pushedMin: newMin }, note)
    } else if (op.name === 'pop') {
      const removed = stack.pop()!
      const removedMin = minStack.pop()!
      const restMin = minStack.length > 0 ? minStack[minStack.length - 1] : null
      snap(
        'pop',
        k,
        { popped: removed, poppedMin: removedMin },
        `观察：pop() 要删掉主栈栈顶 ${removed}，而它恰好也是辅助栈顶记录的最小值。判断：只弹主栈会让 getMin 返回过期的最小值，两个栈必须同步弹出。动作：两栈一起弹出栈顶，主栈剩 [${stack.join(', ')}]，最小值回退到 ${restMin ?? '—'}。为什么：弹出后露出的那一层记录的正是「加上 ${removed} 之前」的最小值，所以 getMin 自动回退，不需要重新扫描全栈。`
      )
    } else if (op.name === 'top') {
      const ret = stack[stack.length - 1]
      returns.push(ret)
      snap(
        'top',
        k,
        { ret },
        `观察：top() 只读不写，两个栈的内容都不变。判断：栈顶是最后压入的 ${ret}，位于主栈最上方。动作：返回主栈栈顶 ${ret}，两栈仍是 ${stack.length} 层。为什么：top 不影响不变量，当前最小值仍是 ${minStack[minStack.length - 1]}。`
      )
    } else {
      const ret = minStack[minStack.length - 1]
      returns.push(ret)
      snap(
        'getmin',
        k,
        { ret },
        `观察：getMin() 被调用时主栈是 [${stack.join(', ')}]，辅助栈栈顶是 ${ret}。判断：不变量保证这个栈顶就是主栈里的最小值。动作：直接返回 ${ret}，不扫描主栈。为什么：辅助栈每层都记录了对应深度的最小值，读取是 O(1)。`
      )
    }
  })

  snap(
    'done',
    INPUT.length,
    {},
    `观察：${INPUT.length} 个操作执行完毕，getMin / top 的返回序列是 ${returns.join('、')}。判断：push、pop、top、getMin 都只做常数次读写，时间全部 O(1)。代价：多维护一个与主栈等高的辅助栈，空间 O(n)。`
  )

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

type LayerState = 'idle' | 'active' | 'ok'

interface Layer {
  value: number
  state: LayerState
  /** 每层都留出标签位，保证两栈的行几何完全一致 */
  label: string
  /** 本步刚落入该层的元素：挂上一次性入场动效 .fade-up */
  entering: boolean
}

const LABEL_TONE: Record<LayerState, string> = {
  idle: 'text-ink-soft',
  active: 'text-[hsl(var(--amber))]',
  ok: 'text-[hsl(var(--easy))]',
}

const BOX =
  'flex flex-col-reverse justify-start gap-1.5 rounded-b-lg border-x-2 border-b-[3px] border-border bg-card px-2 pb-2 pt-2'

/** 一根竖向栈：头部说明 + 落入位 + 顶部虚线开口 + 底部加粗封口 */
function StackColumn({
  title,
  caption,
  chip,
  chipTone,
  layers,
}: {
  title: string
  caption: string
  chip: string | null
  chipTone: 'amber' | 'hard' | 'easy'
  layers: Layer[]
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex h-10 flex-col items-center justify-center gap-0.5">
        <span className="text-[11px] font-medium text-ink">{title}</span>
        <span className="text-[10px] text-ink-soft">{caption}</span>
      </div>

      {/* 元素落入 / 弹出的通道：高度固定，步骤切换时不跳动 */}
      <div className="flex h-8 items-center justify-center">
        {chip && <Badge tone={chipTone}>{chip}</Badge>}
      </div>

      {/* 顶部开口：虚线阈值线 */}
      <div className="w-[132px] border-t-2 border-dashed border-border sm:w-[152px]" />

      {/* flex-col-reverse ⇒ 下标 0 沉在底部，新元素从上方落入栈顶 */}
      <div className={`${BOX} min-h-[150px] w-[132px] sm:min-h-[166px] sm:w-[152px]`}>
        {layers.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-[11px] text-ink-soft">
            （空）
          </div>
        ) : (
          layers.map((l, i) => (
            <div
              key={i}
              className={l.entering ? 'fade-up flex items-center gap-1.5' : 'flex items-center gap-1.5'}
            >
              <Cell
                state={l.state}
                size="sm"
                className="h-8 w-12 shrink-0 text-[13px] sm:h-9 sm:w-14 sm:text-sm"
              >
                {l.value}
              </Cell>
              <span
                className={`min-w-0 flex-1 truncate text-[10px] leading-tight ${LABEL_TONE[l.state]}`}
              >
                {l.label}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function Stage(step: Step) {
  const mainTop = step.stack.length - 1
  const minTop = step.minStack.length - 1
  const isPush = step.phase === 'push'
  const isPop = step.phase === 'pop'
  const isTop = step.phase === 'top'
  const isGetMin = step.phase === 'getmin'

  const mainLayers: Layer[] = step.stack.map((v, i) => {
    const top = i === mainTop
    if (top && isPush) return { value: v, state: 'active', label: '本步压入', entering: true }
    if (top && isTop) return { value: v, state: 'active', label: `返回 ${v}`, entering: false }
    return { value: v, state: 'idle', label: top ? '栈顶' : '', entering: false }
  })

  const minLayers: Layer[] = step.minStack.map((v, i) => {
    const top = i === minTop
    if (!top) return { value: v, state: 'idle', label: '', entering: false }
    if (isGetMin) return { value: v, state: 'ok', label: `返回 ${v}`, entering: false }
    return { value: v, state: 'ok', label: '当前最小值', entering: isPush }
  })

  const mainChip = isPush
    ? `↓ 落入 ${step.pushed}`
    : isPop
      ? `↑ 已弹出 ${step.popped}`
      : isTop
        ? `读栈顶 ${step.ret}`
        : null

  const minChip = isPush
    ? `↓ 记入 ${step.pushedMin}`
    : isPop
      ? `↑ 已弹出 ${step.poppedMin}`
      : isGetMin
        ? `读栈顶 ${step.ret}`
        : null

  const opText =
    step.phase === 'init'
      ? '初始化'
      : step.phase === 'done'
        ? '操作序列结束'
        : `${step.op}${step.ret === null ? '' : ` → ${step.ret}`}`

  const nextOp =
    step.opIndex + 1 < INPUT.length ? opLabel(INPUT[step.opIndex + 1]) : '操作序列结束，查看结论'

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-start justify-center gap-3 sm:gap-10">
        <StackColumn
          title="主栈 stack"
          caption="存所有元素，栈顶在上"
          chip={mainChip}
          chipTone={isPop ? 'hard' : 'amber'}
          layers={mainLayers}
        />
        <StackColumn
          title="辅助栈 minStack"
          caption="每层 = 该深度的最小值"
          chip={minChip}
          chipTone={isPop ? 'hard' : isGetMin ? 'easy' : 'amber'}
          layers={minLayers}
        />
      </div>

      <p className="text-[10px] text-ink-soft">
        两栈始终等高：压入一层就同步压一层，pop 时同步弹出
      </p>

      <Badges className="justify-center">
        <Badge tone={step.phase === 'init' || step.phase === 'done' ? 'plain' : 'amber'}>
          当前操作 <b className="font-code">{opText}</b>
        </Badge>
        <Stat
          label="当前最小值"
          value={minTop >= 0 ? step.minStack[minTop] : '—'}
          tone="easy"
        />
        <Stat label="主栈大小" value={step.stack.length} tone="amber" />
        {step.phase === 'done' ? (
          <Answer>getMin / top 依次返回 {step.returns.join(' → ')}</Answer>
        ) : (
          <Hint>{nextOp}</Hint>
        )}
      </Badges>
    </div>
  )
}

export default function MinStackDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="主栈 + 同步辅助栈"
      info={`输入（题解示例 1）：${INPUT.map(opLabel).join('、')}；期望返回值依次为 -3、0、-2。`}
      steps={steps}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      autoMs={1400}
      legend={[
        { color: TONE.amber, label: '本步压入 / 读取的栈顶' },
        { color: TONE.easy, label: '当前最小值（辅助栈栈顶）' },
        { color: TONE.hard, label: '本步弹出的元素' },
        { color: TONE.muted, label: '普通栈层' },
      ]}
    />
  )
}
