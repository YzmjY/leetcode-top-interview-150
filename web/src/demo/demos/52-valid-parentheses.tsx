import { useMemo, type ReactNode } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badge, Badges, Cell, Flag, Hint, Stat, TONE, type CellState, type Tone } from './stage'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/* 52. 有效的括号 —— 模式 G：字符行 + 竖向栈容器                         */
/* 左括号入栈；右括号查映射表后与栈顶比较：相同则弹出（绿），             */
/* 类型不符或栈空立即返回 false（红）。                                  */
/* ------------------------------------------------------------------ */

/**
 * 固定示例输入：题解示例 4 是 "([])"（true），这里把最后一个字符换成 '}'，
 * 换用示例输入是为了在 6 步内同时看到「入栈 / 配对成功 / 类型不匹配」三种情形。
 */
const S = '([]}'
const N = S.length
const IDX = Array.from({ length: N }, (_, i) => i)
/** 题解步骤 1 的映射 pairs：右括号 → 它需要的左括号 */
const PAIRS: Record<string, string | undefined> = { ')': '(', ']': '[', '}': '{' }

interface StackItem {
  ch: string
  /** 该左括号在字符串中的下标，用于与字符行对齐 */
  idx: number
}

interface Step {
  phase: 'init' | 'push' | 'pop' | 'fail' | 'done'
  /** 当前处理的下标；init 为 -1，done 为 N */
  i: number
  ch: string | null
  /** 当前右括号需要的左括号；其余步为 null */
  need: string | null
  /** 本步结束后栈的内容（下标 0 = 栈底） */
  stack: StackItem[]
  /** 已配对成功的字符下标（左、右两端都在内） */
  matched: number[]
  /** 本步渲染为红色的字符下标 */
  conflict: number[]
  /** 当前栈顶下标；空栈为 -1 */
  topIdx: number
  result: boolean | null
  note: string
  /** 下一步动作，由后一个快照回填，供 Hint 使用 */
  next: string
}

function buildSteps(): Step[] {
  const stack: StackItem[] = []
  const matched: number[] = []
  const steps: Step[] = []

  const snap = (o: {
    phase: Step['phase']
    i: number
    ch: string | null
    need?: string | null
    conflict?: number[]
    result?: boolean | null
    note: string
  }) => {
    steps.push({
      phase: o.phase,
      i: o.i,
      ch: o.ch,
      need: o.need ?? null,
      stack: stack.map((it) => ({ ...it })),
      matched: matched.slice(),
      conflict: o.conflict ? o.conflict.slice() : [],
      topIdx: stack.length > 0 ? stack[stack.length - 1].idx : -1,
      result: o.result ?? null,
      note: o.note,
      next: '',
    })
  }

  snap({
    phase: 'init',
    i: -1,
    ch: null,
    note: `观察：输入 s = "${S}"，共 ${N} 个字符；映射表 pairs 预先登记 )→( 、]→[ 、}→{，栈为空，i = 0 还没处理任何字符。判断：合法括号序列的嵌套是后进先出——最近出现的左括号最先需要右括号来配，所以用栈保存「已出现但尚未匹配」的左括号。动作：从 i = 0 开始逐个扫描字符。为什么：栈顶永远是最近一个未匹配的左括号，遇到右括号时只要和栈顶比一次就能判断是否合法。`,
  })

  let failIdx = -1
  let failCh: string | null = null
  let failNeed: string | null = null
  let failTop: string | null = null

  for (let i = 0; i < N; i++) {
    const ch = S[i]
    const need = PAIRS[ch]

    if (need === undefined) {
      stack.push({ ch, idx: i })
      snap({
        phase: 'push',
        i,
        ch,
        note: `观察：s[${i}] = '${ch}' 不在映射表里，是左括号。判断：它还没有匹配的右括号，需要先记下来。动作：压入栈，栈自下而上变成 [${stack.map((it) => it.ch).join(', ')}]，栈顶是 '${ch}'。为什么：循环不变量要求栈中从底到顶恰好是按出现顺序排列的未匹配左括号，左括号直接入栈即可保持它。`,
      })
      continue
    }

    const top = stack[stack.length - 1]
    if (top === undefined || top.ch !== need) {
      failIdx = i
      failCh = ch
      failNeed = need
      failTop = top ? top.ch : null
      snap({
        phase: 'fail',
        i,
        ch,
        need,
        conflict: top ? [i, top.idx] : [i],
        result: false,
        note: top
          ? `观察：s[${i}] = '${ch}' 在映射表里查得它需要的左括号是 '${need}'，而当前栈顶是 '${top.ch}'。判断：类型不同，'${ch}' 无法与最近的未匹配左括号配对，正是题解列出的失败情形②（栈顶类型不匹配，如 "(]"）。动作：立即返回 false，不再看后面的字符。为什么：栈顶检查能识破「左右括号数量相等但类型交叉」的写法，继续扫描也不存在别的配对方式。`
          : `观察：s[${i}] = '${ch}' 在映射表里查得它需要的左括号是 '${need}'，但栈是空的。判断：没有任何未闭合的左括号能配对它，这是题解列出的失败情形①（右括号到来时栈为空，如 ")"、"()]"）。动作：立即返回 false，不再看后面的字符。为什么：每个右括号都必须有同类型的左括号与之对应，栈空说明前面没有多余的左括号留给它。`,
      })
      break
    }

    const popped = stack.pop()!
    matched.push(popped.idx, i)
    snap({
      phase: 'pop',
      i,
      ch,
      need,
      note: `观察：s[${i}] = '${ch}' 在映射表里查得它需要 '${need}'，而栈顶恰好是 '${need}'。判断：类型相同，下标 ${popped.idx} 的 '${need}' 与下标 ${i} 的 '${ch}' 配对成功。动作：弹出栈顶，栈回到 [${stack.map((it) => it.ch).join(', ') || '空'}]，字符行里这一对标记为已配对。为什么：'${ch}' 只能与最近一个未匹配的左括号配对，栈顶正是它，弹出后不变量继续成立。`,
    })
  }

  const leftover = stack.map((it) => `'${it.ch}'`).join('、')
  if (failIdx >= 0) {
    const failDesc =
      failTop === null
        ? `'${failCh}' 是右括号但栈是空的，属于失败情形①`
        : `'${failCh}' 需要的 '${failNeed}' 与栈顶 '${failTop}' 类型不符，属于失败情形②`
    snap({
      phase: 'done',
      i: N,
      ch: null,
      conflict: [...(failIdx >= 0 ? [failIdx] : []), ...stack.map((it) => it.idx)],
      result: false,
      note: `观察：扫描在 i = ${failIdx} 处中断，栈里还剩 ${stack.length} 个未闭合的左括号${stack.length > 0 ? `（${leftover}）` : ''}。判断：${failDesc}。动作：答案 = false，读法就是「配对一旦失败就立即返回 false」。为什么：每个字符最多进出栈各一次，时间 O(n)；最坏情况栈里存下全部字符，空间 O(n)。`,
    })
  } else if (stack.length === 0) {
    snap({
      phase: 'done',
      i: N,
      ch: null,
      result: true,
      note: `观察：${N} 个字符扫描完毕，栈是空的。判断：每个左括号都按后进先出的顺序被同类型右括号闭合了。动作：答案 = true。为什么：遍历结束时栈空才是全部匹配的充要条件，时间 O(n)、空间 O(n)。`,
    })
  } else {
    snap({
      phase: 'done',
      i: N,
      ch: null,
      conflict: stack.map((it) => it.idx),
      result: false,
      note: `观察：${N} 个字符扫描完毕，栈里还剩 ${stack.length} 个左括号（${leftover}）。判断：还有左括号没被闭合，属于题解列出的失败情形③。动作：答案 = false。为什么：遍历结束时栈空才说明全部匹配，时间 O(n)、空间 O(n)。`,
    })
  }

  // 「下一步动作」由后一个快照推导，保证 Hint 描述的是真正还没做的动作
  steps.forEach((s, k) => {
    const b = steps[k + 1]
    if (!b) return
    if (b.phase === 'done') {
      s.next = '结果已定，查看结论'
    } else if (b.phase === 'push') {
      s.next = `读 s[${b.i}] = '${b.ch}'：左括号，压入栈顶`
    } else {
      s.next = `读 s[${b.i}] = '${b.ch}'：映射表查得它需要 '${b.need}'，再与栈顶比较`
    }
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

const LABEL_W = 40
const CELL_W = 60
const GAP = 6
const ROW_MAX = LABEL_W + N * CELL_W + (N - 1) * GAP

/** 照抄题 54 的栈容器几何：两侧竖边 + 底部加粗封口 + 顶部虚线开口 */
const BOX =
  'flex flex-col-reverse justify-start gap-1.5 rounded-b-lg border-x-2 border-b-[3px] border-border bg-card px-2 pb-2 pt-2'

type LayerState = 'idle' | 'new' | 'bad'

const LABEL_TONE: Record<LayerState, string> = {
  idle: 'text-ink-soft',
  new: 'text-[hsl(var(--teal))]',
  bad: 'text-[hsl(var(--hard))]',
}

interface Layer {
  ch: string
  idx: number
  state: LayerState
  /** 每层都带文字标签，状态不靠颜色单独区分 */
  label: string
  /** 本步刚落入栈顶的元素：一次性入场动效 */
  entering: boolean
}

function StackColumn({
  chip,
  layers,
}: {
  chip: ReactNode
  layers: Layer[]
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex h-10 flex-col items-center justify-center gap-0.5">
        <span className="text-[11px] font-medium text-ink">栈 stack</span>
        <span className="text-[10px] text-ink-soft">自下而上，栈顶在上</span>
      </div>

      {/* 元素落入 / 弹出的通道：高度固定，步骤切换时不跳动 */}
      <div className="flex h-8 items-center justify-center">{chip}</div>

      {/* 顶部开口：虚线阈值线 */}
      <div className="w-[132px] border-t-2 border-dashed border-border sm:w-[152px]" />

      {/* flex-col-reverse ⇒ 下标 0 沉在底部，新元素从上方落入栈顶 */}
      <div className={`${BOX} min-h-[150px] w-[132px] sm:min-h-[166px] sm:w-[152px]`}>
        {layers.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-[11px] text-ink-soft">
            （空）
          </div>
        ) : (
          layers.map((l) => (
            <div
              key={l.idx}
              className={l.entering ? 'fade-up flex items-center gap-1.5' : 'flex items-center gap-1.5'}
            >
              <Cell
                state={l.state}
                size="sm"
                className="h-8 w-12 shrink-0 text-[13px] sm:h-9 sm:w-14 sm:text-sm"
              >
                {l.ch}
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
  const done = step.phase === 'done'
  const isPush = step.phase === 'push'
  const isPop = step.phase === 'pop'
  const isFail = step.phase === 'fail'
  const curTone: Tone = isFail ? 'hard' : isPop ? 'easy' : 'amber'
  const topLayer = step.stack.length > 0 ? step.stack[step.stack.length - 1] : null

  const cellState = (k: number): CellState => {
    if (done) {
      if (step.conflict.includes(k)) return 'bad'
      return step.matched.includes(k) ? 'ok' : 'dim'
    }
    if (k === step.i) return isPush ? 'active' : isPop ? 'ok' : 'bad'
    if (step.matched.includes(k)) return 'ok'
    if (isFail && k === step.topIdx) return 'bad'
    if (k < step.i) return 'new'
    return 'dim'
  }

  const layers: Layer[] = step.stack.map((it, k) => {
    const top = k === step.stack.length - 1
    const bad = (isFail && top) || (done && step.conflict.includes(it.idx))
    const label = bad
      ? done
        ? `未闭合 s[${it.idx}]`
        : `栈顶 s[${it.idx}] 不匹配`
      : top
        ? `栈顶 s[${it.idx}]`
        : `s[${it.idx}]`
    return { ch: it.ch, idx: it.idx, state: bad ? 'bad' : 'new', label, entering: isPush && top }
  })

  let chip: ReactNode = null
  if (isPush) {
    chip = (
      <>
        ↓ 入栈 <b className="font-code">'{step.ch}'</b>
      </>
    )
  } else if (isPop) {
    chip = (
      <>
        ↑ 弹出 <b className="font-code">'{step.ch}'</b>（配{' '}
        <b className="font-code">'{step.need}'</b>）
      </>
    )
  } else if (isFail) {
    chip = topLayer ? (
      <>
        ✗ <b className="font-code">'{step.ch}'</b> ≠ 栈顶{' '}
        <b className="font-code">'{topLayer.ch}'</b>
      </>
    ) : (
      <>
        ✗ 栈空，<b className="font-code">'{step.ch}'</b> 无处可配
      </>
    )
  }

  const actionText =
    step.phase === 'init'
      ? '初始化'
      : isPush
        ? `入栈 '${step.ch}'`
        : isPop
          ? `配对成功，弹出 '${step.ch}'`
          : isFail
            ? '返回 false'
            : '扫描结束'
  const actionTone: Tone | 'plain' =
    step.phase === 'init' || done ? 'plain' : curTone

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 字符行：旗标在格上、下标在格下，当前字符按本步动作着色 */}
      <div
        className="grid w-full gap-1.5"
        style={{
          gridTemplateColumns: `${LABEL_W / 16}rem repeat(${N}, minmax(0, 1fr))`,
          maxWidth: ROW_MAX,
        }}
      >
        <span aria-hidden />
        {IDX.map((k) => (
          <div key={`flag-${k}`} className="flex h-6 items-end justify-center">
            {k === step.i && <Flag label="i" tone={curTone} />}
          </div>
        ))}

        <span className="flex items-center justify-end pr-1 font-code text-[10px] text-ink-soft">
          s
        </span>
        {IDX.map((k) => (
          <Cell
            key={`char-${k}`}
            state={cellState(k)}
            size="md"
            className="h-11 w-full min-w-0 text-[15px] sm:h-12"
          >
            {S[k]}
          </Cell>
        ))}

        <span className="flex items-center justify-end pr-1 font-code text-[10px] text-ink-soft">
          下标
        </span>
        {IDX.map((k) => (
          <div key={`idx-${k}`} className="flex h-5 items-center justify-center">
            <span
              className={cn('font-code text-[11px]', k === step.i ? 'font-bold' : 'text-ink-soft')}
              style={k === step.i ? { color: TONE[curTone] } : undefined}
            >
              {k}
            </span>
          </div>
        ))}
      </div>

      <StackColumn chip={chip} layers={layers} />

      <Badges className="justify-center">
        <Stat
          label="当前字符"
          value={step.ch === null ? '—' : `s[${step.i}] = '${step.ch}'`}
          tone={curTone}
        />
        <Stat label="栈大小" value={step.stack.length} tone="teal" />
        <Badge tone={actionTone}>{actionText}</Badge>
        {done ? (
          <Answer>
            s = "<b className="font-code">{S}</b>" →{' '}
            <b className="font-code">{String(step.result)}</b>
          </Answer>
        ) : (
          <Hint>{step.next}</Hint>
        )}
      </Badges>
    </div>
  )
}

export default function ValidParenthesesDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="字符行 + 栈：右括号与栈顶配对"
      info={`输入：s = "${S}"（题解示例 4 是 "([])" → true，这里把最后一个字符换成 '}'，属换用示例输入：为在 6 步内同时看到「左括号入栈」「'[' 与 ']' 配对成功」「'}' 与栈顶 '(' 类型不匹配返回 false」三种情形）。期望输出 false。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '当前字符：左括号，本步入栈' },
        { color: TONE.teal, label: '已入栈、等待配对' },
        { color: TONE.easy, label: '配对成功的一对括号' },
        { color: TONE.hard, label: '类型不匹配 / 结束后未闭合，返回 false' },
        { color: TONE.muted, label: '尚未处理' },
      ]}
    />
  )
}
