import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badge, Badges, Cell, Hint, Stat, TONE, type CellState } from './stage'

/* ------------------------------------------------------------------ */
/* 53. 简化路径 —— 模式 G：栈                                            */
/* 上方是输入按 "/" 切分出的片段序列，下方栈容器自底向上存已确定的目录。    */
/* 普通目录名入栈（amber）、".." 弹栈（hard）、"." 与空串忽略（dim）。      */
/* ------------------------------------------------------------------ */

/** 固定示例输入（题解「示例 4」：path = "/a/./b/../../c/"，输出 "/c"） */
const INPUT = '/a/./b/../../c/'

/** 按 "/" 切出的片段；空串来自开头的 "/"、结尾的 "/" 与连续的 "//" */
const PARTS = INPUT.split('/')

/** 空片段在画面里显示成 ∅，避免看起来像「什么都没画」 */
function partText(part: string): string {
  return part === '' ? '∅' : part
}

function partDesc(part: string): string {
  return part === '' ? '空串' : `"${part}"`
}

interface Step {
  phase: 'init' | 'push' | 'pop' | 'ignore' | 'done'
  /** 本步正在处理的片段下标；init 为 -1，done 为 PARTS.length */
  k: number
  /** 本步的片段内容；init / done 为 null */
  part: string | null
  /** 本步处理完之后栈的内容（下标 0 = 栈底） */
  stack: string[]
  /** 本步刚压入的目录名（即 stack 的末尾） */
  pushed: string | null
  /** 本步弹掉的目录名 */
  popped: string | null
  /** 本步动作标签 */
  action: string
  note: string
  /** 下一步动作（由后一个快照统一回填，供 Hint 使用） */
  next: string
}

/** 跑一遍真实算法，每个片段留一个不可变快照 */
function buildSteps(): Step[] {
  const stack: string[] = []
  const steps: Step[] = []

  const snap = (
    phase: Step['phase'],
    k: number,
    patch: { pushed?: string; popped?: string; action?: string },
    note: string
  ) => {
    const part = k >= 0 && k < PARTS.length ? PARTS[k] : null
    steps.push({
      phase,
      k,
      part,
      stack: stack.slice(),
      pushed: patch.pushed ?? null,
      popped: patch.popped ?? null,
      action:
        patch.action ?? (phase === 'init' ? '分割路径' : phase === 'done' ? '拼接结果' : '忽略该段'),
      note,
      next: '',
    })
  }

  // 第一步：init
  snap(
    'init',
    -1,
    {},
    `观察：path = "${INPUT}"，按 "/" 切成 ${PARTS.length} 段：${PARTS.map(partText).join(' / ')}。判断：空串（∅）是多余的斜杠，"." 是当前目录，两者都不改变路径指向，".." 才要回退一级，其余是普通目录名。动作：准备一个空栈，从 k = 0 开始逐段处理。为什么：回退一级消掉的总是「最近入栈的目录」，后进先出，所以用栈。`
  )

  for (let k = 0; k < PARTS.length; k++) {
    const part = PARTS[k]
    if (part === '' || part === '.') {
      snap(
        'ignore',
        k,
        {},
        `观察：第 ${k} 段是${partDesc(part)}（${part === '' ? '来自开头的斜杠或连续斜杠，多个连续斜杠折叠成一个' : '表示当前目录本身'}）。判断：它不指向任何新目录，也不该出现在规范路径里。动作：忽略，栈保持 [${stack.join(', ')}]。为什么：空串与 "." 都不改变路径指向，处理前后的目录序列不变。`
      )
    } else if (part === '..') {
      if (stack.length > 0) {
        const popped = stack.pop() as string
        const after = stack.length > 0 ? stack[stack.length - 1] : null
        snap(
          'pop',
          k,
          { popped, action: '弹出栈顶' },
          `观察：第 ${k} 段是 ".."，表示退到上一级目录，此时栈里有 [${stack.concat(popped).join(', ')}]。判断：栈非空，".." 抵消掉最近压入的 "${popped}"。动作：弹出栈顶 "${popped}"，现在位于 ${after === null ? '根目录 "/"' : `目录 "${after}"`}。为什么：这正是「最近出现的最先被消掉」，与栈的后进先出一致。`
        )
      } else {
        snap(
          'pop',
          k,
          { action: '已在根目录，忽略' },
          `观察：第 ${k} 段是 ".."，但栈已经空了。判断：当前就在根目录 "/"，它是能到达的最高一层，没有父目录可回退。动作：什么都不做，栈仍为空。为什么：若这里硬弹栈就会越界，示例 2 的 "/../" 正是这种情况，答案是 "/"。`
        )
      }
    } else {
      stack.push(part)
      snap(
        'push',
        k,
        { pushed: part, action: '压入栈' },
        `观察：第 ${k} 段是 "${part}"，它不是 "" 也不是 "." / ".."，是一个真实目录名。判断：进入该目录后，它就成为路径上的最后一级。动作：把 "${part}" 压入栈顶，栈变成 [${stack.join(', ')}]。为什么：规范路径的目录序列正是从根出发沿途进入的目录，进一级就多一级。`
      )
    }
  }

  // 最后一步：done（唯一的总结步）
  snap(
    'done',
    PARTS.length,
    {},
    `观察：${PARTS.length} 段全部处理完，栈是 [${stack.join(', ')}]。判断：遍历中所有 "." 与 ".." 都已消解，栈里从底到顶就是最终路径上的目录序列。动作：用 "/" 连接栈内目录、前面补根斜杠，得到 "${'/' + stack.join('/')}"（栈为空时结果就是 "/"）。为什么：切分与遍历各扫一遍，时间 O(n)；片段与栈与路径同阶，空间 O(n)。`
  )

  // Hint 统一由「后一个快照」回填，保证描述的是下一步而不是本步已完成的动作
  steps.forEach((s, i) => {
    const b = steps[i + 1]
    if (!b) return
    const raw = b.part ?? ''
    if (b.phase === 'push') s.next = `把片段 ${b.k} "${raw}" 压入栈顶`
    else if (b.phase === 'pop')
      s.next =
        b.stack.length > 0
          ? `片段 ${b.k} 是 ".."，弹出栈顶 "${b.stack[b.stack.length - 1]}"`
          : `片段 ${b.k} 是 ".." 但栈为空，忽略、不弹`
    else if (b.phase === 'ignore')
      s.next = `片段 ${b.k} 是 ${partDesc(raw)}，跳过、栈不变`
    else if (b.phase === 'done') s.next = '片段已处理完，拼接栈内容得到规范路径'
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

type LayerState = 'idle' | 'active' | 'ok'

const LAYER_STATE: Record<LayerState, CellState> = {
  idle: 'idle',
  active: 'active',
  ok: 'ok',
}

/** 容器里的每一行：出栈行用 hard 红标出被弹掉的目录 */
interface Layer {
  name: string
  state: LayerState
  tone: 'ink' | 'amber' | 'easy' | 'hard'
  dim: boolean
  leave: boolean
  label: string
}

const CHIP_TONE = {
  push: 'amber',
  pop: 'hard',
} as const

function Stage(step: Step) {
  const done = step.phase === 'done'
  const stackTopLabel = done ? '栈顶目录' : '栈顶 · 当前目录'

  const layers: Layer[] = step.stack.map((name, i) => {
    const isTop = i === step.stack.length - 1
    if (isTop) {
      if (step.phase === 'push')
        return { name, state: 'active', tone: 'amber', dim: false, leave: false, label: '本步压入' }
      return { name, state: 'ok', tone: 'easy', dim: false, leave: false, label: stackTopLabel }
    }
    return { name, state: 'idle', tone: 'ink', dim: false, leave: false, label: '' }
  })

  const showPopped = step.phase === 'pop' && step.popped !== null
  if (showPopped) {
    layers.push({
      name: step.popped as string,
      state: 'idle',
      tone: 'hard',
      dim: true,
      leave: true,
      label: '本步弹出',
    })
  }

  const chip =
    step.phase === 'push'
      ? `↓ 压入 "${step.pushed}"`
      : showPopped
        ? `↑ 弹出 "${step.popped}"`
        : null

  const currentPath = '/' + step.stack.join('/')

  return (
    <div className="flex w-full flex-col items-center gap-4">
      {/* 上方：输入按 "/" 切分出的片段序列 */}
      <div className="flex w-full flex-col items-center gap-1.5">
        <span className="text-[11px] text-ink-soft">
          输入 path = <b className="font-code text-ink">{INPUT}</b>，按 “/” 切分得到{' '}
          <b className="font-code">{PARTS.length}</b> 个片段（∅ = 空片段）
        </span>
        <div
          className="grid w-full gap-1 sm:gap-1.5"
          style={{ gridTemplateColumns: `repeat(${PARTS.length}, minmax(0, 1fr))` }}
        >
          {PARTS.map((part, k) => {
            const active = !done && k === step.k
            const handled = done || k < step.k
            const cellState: CellState = active
              ? step.phase === 'pop'
                ? 'bad'
                : 'active'
              : handled
                ? 'dim'
                : 'idle'
            return (
              <div key={k} className="flex min-w-0 flex-col items-center gap-1">
                <Cell
                  state={cellState}
                  size="sm"
                  className="h-9 w-full min-w-0 px-0.5 text-[12px] sm:text-[13px]"
                >
                  {partText(part)}
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
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 text-[10px] text-ink-soft">
          <span>
            本步片段 <b className="font-code text-ink">{step.part === null ? '—' : partText(step.part)}</b>
          </span>
          <span>
            动作 <b className="font-code text-ink">{step.action}</b>
          </span>
          <span>
            已处理 <b className="font-code text-ink">{Math.min(step.k < 0 ? 0 : step.k, PARTS.length)}</b> /{' '}
            <b className="font-code">{PARTS.length}</b> 段
          </span>
        </div>
      </div>

      {/* 下方：目录栈容器（栈顶在上、栈底在下）+ 答案读数 */}
      <div className="flex w-full flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-center sm:gap-8">
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[11px] text-ink-soft">
            目录栈：栈底 <b className="font-code">/</b> 在最下，栈顶在上
          </span>

          {/* 落入 / 弹出的通道：高度固定，切换步骤时不跳动 */}
          <div className="flex h-7 items-center justify-center">
            {chip !== null && <Badge tone={CHIP_TONE[step.phase === 'push' ? 'push' : 'pop']}>{chip}</Badge>}
          </div>

          {/* 顶部开口：虚线表示栈从这里进出 */}
          <div className="w-[172px] border-t-2 border-dashed border-border sm:w-[220px]" />

          <div className="flex min-h-[126px] w-[172px] flex-col-reverse justify-start gap-1.5 rounded-b-lg border-x-2 border-b-[3px] border-border bg-card px-2 pb-2 pt-2 sm:w-[220px]">
            {layers.length === 0 ? (
              <div className="flex flex-1 items-center justify-center text-[11px] text-ink-soft">
                （空栈 = 根目录 “/”）
              </div>
            ) : (
              layers.map((l, i) => (
                <div
                  key={`${i}-${l.name}`}
                  className={l.leave ? 'fade-up flex items-center gap-1.5' : 'flex items-center gap-1.5'}
                  style={l.dim ? { opacity: 0.4 } : undefined}
                >
                  <Cell
                    state={LAYER_STATE[l.state]}
                    size="sm"
                    className="h-8 w-16 shrink-0 px-1 text-[13px] sm:w-20"
                  >
                    <span style={{ color: TONE[l.tone] }}>{l.name}</span>
                  </Cell>
                  <span className="min-w-0 flex-1 truncate text-[10px] leading-tight text-ink-soft">
                    {l.label}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex flex-col items-center gap-1 sm:items-start">
          <span className="text-[11px] text-ink-soft">当前已确定的路径</span>
          <div className="rounded-lg border border-border bg-secondary px-3 py-2">
            <span
              className={
                done
                  ? 'font-code text-base font-semibold'
                  : 'font-code text-sm font-semibold text-ink-soft'
              }
              style={done ? { color: TONE.easy } : undefined}
            >
              {currentPath}
            </span>
          </div>
          <span className="text-[10px] text-ink-soft">
            栈大小 <b className="font-code text-ink">{step.stack.length}</b>
          </span>
        </div>
      </div>

      <Badges className="justify-center">
        <Stat label="栈大小" value={step.stack.length} tone={step.phase === 'pop' ? 'hard' : 'amber'} />
        <Badge tone={step.phase === 'push' ? 'amber' : showPopped ? 'hard' : 'plain'}>
          本步动作 <b className="font-code">{step.action}</b>
          {step.part !== null ? (
            <>
              {' '}
              <b className="font-code">{partText(step.part)}</b>
            </>
          ) : null}
        </Badge>
        {done ? (
          <Answer>
            规范路径 <b className="font-code">"{currentPath}"</b>
          </Answer>
        ) : (
          step.next !== '' && <Hint tone={step.phase === 'pop' ? 'hard' : 'teal'}>{step.next}</Hint>
        )}
      </Badges>
    </div>
  )
}

export default function SimplifyPathDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="用栈模拟目录进出"
      info={`输入：path = "${INPUT}"（题解示例 4，预期输出 "/c"）。按 "/" 切分得到 ${PARTS.length} 个片段（含开头、末尾的空片段），逐段下推：空串与 "." 忽略、".." 弹栈（栈空则不弹）、其余目录名压栈，共 ${steps.length} 步、无省略。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '本步处理的片段 / 刚压入的栈顶' },
        { color: TONE.hard, label: '".." 弹栈：被弹出的目录 / 当前片段' },
        { color: TONE.easy, label: '当前栈顶目录 / 最终规范路径' },
        { color: TONE.muted, label: '已处理片段 / 空栈占位' },
      ]}
    />
  )
}
