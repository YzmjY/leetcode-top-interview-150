import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badge, Badges, Cell, Hint, Stat, TONE } from './stage'

/* ------------------------------------------------------------------ */
/* 79. 二叉搜索树迭代器 —— 模式 E：树 + 模式 G 的竖向栈                  */
/* 用栈显式保存递归中序的调用栈：一路压左孩子，next() 弹出栈顶后         */
/* 再把右子树的最左链压栈，栈顶永远是中序的下一个节点。                  */
/* ------------------------------------------------------------------ */

/** 题解「示例 1」的层序数组：规模最小且 5 个节点正好覆盖两层右子树，null 为空节点 */
const LEVELS: (number | null)[] = [7, 3, 15, null, null, 9, 20]
const INPUT_TEXT = `[${LEVELS.map((v) => (v === null ? 'null' : v)).join(', ')}]`

/** 题解示例 1 的完整调用序列 */
const COMMANDS = ['next', 'next', 'hasNext', 'next', 'hasNext', 'next', 'hasNext', 'next', 'hasNext'] as const

interface TreeNode {
  id: string
  val: number
  left: TreeNode | null
  right: TreeNode | null
}

const ROOT_ID = 'R'

function buildTree(level: (number | null)[], i: number, id: string): TreeNode | null {
  if (i >= level.length) return null
  const val = level[i]
  if (val === null) return null
  return {
    id,
    val,
    left: buildTree(level, 2 * i + 1, `${id}L`),
    right: buildTree(level, 2 * i + 2, `${id}R`),
  }
}

const ROOT = buildTree(LEVELS, 0, ROOT_ID)

const NODES: Record<string, TreeNode> = {}
const VAL_OF: Record<string, number> = {}
const DEPTH_OF: Record<string, number> = {}
/** 中序展开：同一层节点的 x 槽位按中序顺序分配 */
const ORDER: string[] = []

function collect(node: TreeNode | null, depth: number) {
  if (!node) return
  NODES[node.id] = node
  VAL_OF[node.id] = node.val
  DEPTH_OF[node.id] = depth
  collect(node.left, depth + 1)
  ORDER.push(node.id)
  collect(node.right, depth + 1)
}
collect(ROOT, 0)

function cmdLabel(ci: number): string {
  return COMMANDS[ci] === 'next' ? 'next()' : 'hasNext()'
}

/* ---------------- 步骤数据 ---------------- */

type Phase = 'init' | 'push' | 'pop' | 'hasnext' | 'done'

interface Step {
  phase: Phase
  /** 本步压入 / 弹出的节点 id；其余步骤为 null */
  cur: string | null
  /** 本步属于哪一次调用（COMMANDS 下标）；构造阶段 -1，done 为 COMMANDS.length */
  cmd: number
  /** 已输出的节点 id，按中序顺序（不可变快照） */
  out: string[]
  /** 栈内容快照，下标 0 是栈底 */
  stack: string[]
  /** next() 的返回值 */
  nextRet: number | null
  /** hasNext() 的返回值 */
  hasRet: boolean | null
  note: string
  /** 下一步动作，由后一个快照统一回填，供 Hint 使用 */
  hint: string
}

function buildSteps(): Step[] {
  const steps: Step[] = []
  const stack: string[] = []
  const out: string[] = []

  const snap = (
    phase: Phase,
    cur: string | null,
    cmd: number,
    nextRet: number | null,
    hasRet: boolean | null,
    note: string
  ): Step => ({
    phase,
    cur,
    cmd,
    out: out.slice(),
    stack: stack.slice(),
    nextRet,
    hasRet,
    note,
    hint: '',
  })

  /** pushLeft：从 node 出发沿左指针一路压栈，每压一个节点产出一个快照 */
  const pushLeft = (start: TreeNode | null, cmd: number) => {
    let node = start
    while (node) {
      const { id, val, left } = node
      stack.push(id)
      steps.push(
        snap(
          'push',
          id,
          cmd,
          null,
          null,
          left
            ? `观察：当前节点是 ${val}，它的左孩子是 ${left.val}。判断：中序先访问左子树，${val} 必须排在 ${left.val} 之后。动作：把 ${val} 压栈，再沿左指针下降到 ${left.val}。为什么：栈里保存的正是「还没访问完的左祖先链」，左子树走完要靠它回到 ${val}。`
            : `观察：当前节点是 ${val}，它的左孩子为空。判断：${val} 没有左子树，中序里下一个要输出的就是它自己。动作：把 ${val} 压栈，这条左链到底了。为什么：此刻栈顶 ${val} 就是所有未输出节点中最小的那个。`
        )
      )
      node = left
    }
  }

  steps.push(
    snap(
      'init',
      null,
      -1,
      null,
      null,
      `观察：BST 用层序数组 ${INPUT_TEXT} 给出：根 7，左孩子 3，右孩子 15；15 又带 9 和 20。判断：迭代器不预先算出整个中序序列，而是显式保存递归中序的调用栈，初始状态就是「从根沿左指针压到底」的左祖先链。动作：stack 置空，指针视为指向最小值之前，执行 Constructor 里的 pushLeft(root)。为什么：这条左链压完后栈顶就是 BST 的最小元素，正是 next() 第一次要返回的值。`
    )
  )

  pushLeft(ROOT, -1)

  COMMANDS.forEach((cmd, ci) => {
    if (cmd === 'next') {
      const id = stack.pop()!
      const val = VAL_OF[id]
      const right = NODES[id].right
      out.push(id)
      steps.push(
        snap(
          'pop',
          id,
          ci,
          val,
          null,
          right
            ? `观察：调用序列第 ${ci + 1} 项 next()，栈顶是 ${val}，它的左子树已经全部输出。判断：栈顶就是中序的下一个节点，本次返回 ${val}，输出序列变成 [${out.join(', ')}]。动作：弹出 ${val}，并对右孩子 ${right.val} 调用 pushLeft，把右子树的最左链压栈。为什么：中序里右子树整体排在 ${val} 之后，压栈后新的栈顶就是 ${val} 的后继。`
            : `观察：调用序列第 ${ci + 1} 项 next()，栈顶是 ${val}，它的左子树已经全部输出。判断：栈顶就是中序的下一个节点，本次返回 ${val}，输出序列变成 [${out.join(', ')}]。动作：弹出 ${val}；它没有右子树，不压入任何新节点。为什么：弹出后露出的新栈顶正好是中序后继，「根 → 右」这一半自然接上。`
        )
      )
      if (right) pushLeft(right, ci)
    } else {
      const ok = stack.length > 0
      steps.push(
        snap(
          'hasnext',
          null,
          ci,
          null,
          ok,
          ok
            ? `观察：hasNext() 只读栈，不改变任何节点。判断：栈里还有 ${stack.length} 个节点 [${stack
                .map((id) => VAL_OF[id])
                .join(', ')}]，栈顶是 ${VAL_OF[stack[stack.length - 1]]}，非空就说明还有未输出节点。动作：返回 true。为什么：不变量保证栈中节点就是「尚未输出节点按中序排列」的前缀，判空等价于判有没有下一个。`
            : `观察：hasNext() 只读栈，不改变任何节点。判断：栈已经空了，${ORDER.length} 个节点全部输出完毕。动作：返回 false，迭代到此结束。为什么：栈空意味着中序序列已经走完，再调用 next() 就无效了。`
        )
      )
    }
  })

  steps.push(
    snap(
      'done',
      null,
      COMMANDS.length,
      null,
      null,
      `观察：${COMMANDS.length} 次调用执行完毕，输出序列是 [${out.join(', ')}]，正好是这棵 BST 的中序（升序）序列。判断：每个节点一生只入栈一次、出栈一次，n 次 next() 的压栈总数不超过 n。动作：结论 —— next() 与 hasNext() 均摊时间 O(1)（单次最坏 O(h)），栈的最大深度等于树高，空间 O(h)。`
    )
  )

  // 「下一步动作」由后一个快照推导，保证与步骤数据完全一致
  steps.forEach((s, i) => {
    const b = steps[i + 1]
    if (!b) return
    if (b.phase === 'done') {
      s.hint = '调用序列结束，读出这条中序升序序列'
    } else if (b.phase === 'pop' && b.cur) {
      s.hint = `${cmdLabel(b.cmd)}：弹出栈顶 ${VAL_OF[b.cur]} 并返回`
    } else if (b.phase === 'push' && b.cur) {
      const from = s.phase === 'pop' && s.cur ? NODES[s.cur].right : null
      s.hint = from
        ? `对右孩子 ${from.val} 调用 pushLeft：把 ${VAL_OF[b.cur]} 压入栈`
        : b.cmd < 0
          ? `构造阶段：沿左指针把 ${VAL_OF[b.cur]} 压入栈`
          : `继续沿左指针把 ${VAL_OF[b.cur]} 压入栈`
    } else if (b.phase === 'hasnext') {
      s.hint = '调用 hasNext()：判断栈是否为空'
    }
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

const W = 560
const H = 256
const PAD_L = 56
const PAD_R = 56
const NODE_R = 22
const TOP = 48
const LEVEL_GAP = 76

type NodeState = 'current' | 'out' | 'stack' | 'idle'

const FILL: Record<NodeState, string> = {
  current: 'hsl(var(--amber-soft))',
  out: 'hsl(var(--easy-soft))',
  stack: 'hsl(var(--medium-soft))',
  idle: 'hsl(var(--ink) / 0.18)',
}

const STROKE: Record<NodeState, string> = {
  current: 'hsl(var(--amber))',
  out: 'hsl(var(--easy))',
  stack: 'hsl(var(--medium))',
  idle: 'hsl(var(--border))',
}

const STROKE_W: Record<NodeState, number> = { current: 3, out: 2.5, stack: 2.5, idle: 2 }

const VALUE_FILL: Record<NodeState, string> = {
  current: 'hsl(var(--amber))',
  out: 'hsl(var(--easy))',
  stack: 'hsl(var(--medium))',
  idle: 'hsl(var(--ink-soft))',
}

const LABEL_FILL: Record<NodeState, string> = {
  current: 'hsl(var(--amber))',
  out: 'hsl(var(--easy))',
  stack: 'hsl(var(--medium))',
  idle: 'hsl(var(--ink-soft))',
}

/** 竖向栈容器（照抄题 54）：顶部虚线开口、底部加粗封口，下标 0 沉在底部 */
const STACK_BOX =
  'flex flex-col-reverse justify-start gap-1.5 rounded-b-lg border-x-2 border-b-[3px] border-border bg-card px-2 pb-2 pt-2'

interface StackLayer {
  id: string
  val: number
  state: 'active' | 'idle'
  label: string
  /** 本步刚落入栈顶的元素：挂一次性入场动效 */
  entering: boolean
}

function StackColumn({
  layers,
  chip,
  chipTone,
}: {
  layers: StackLayer[]
  chip: string | null
  chipTone: 'amber' | 'easy' | 'plain'
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex h-10 flex-col items-center justify-center gap-0.5">
        <span className="text-[11px] font-medium text-ink">栈 stack</span>
        <span className="text-[10px] text-ink-soft">顶部为栈顶，待输出的左祖先链</span>
      </div>

      {/* 元素落入 / 弹出的通道：高度固定，切换步骤时不跳动 */}
      <div className="flex h-8 items-center justify-center">
        {chip && <Badge tone={chipTone}>{chip}</Badge>}
      </div>

      <div className="w-[132px] border-t-2 border-dashed border-border sm:w-[152px]" />

      <div className={`${STACK_BOX} min-h-[132px] w-[132px] sm:min-h-[150px] sm:w-[152px]`}>
        {layers.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-[11px] text-ink-soft">（空）</div>
        ) : (
          layers.map((l) => (
            <div
              key={l.id}
              className={l.entering ? 'fade-up flex items-center gap-1.5' : 'flex items-center gap-1.5'}
            >
              <Cell
                state={l.state}
                size="sm"
                className="h-8 w-12 shrink-0 text-[13px] sm:h-9 sm:w-14 sm:text-sm"
              >
                {l.val}
              </Cell>
              <span
                className={`min-w-0 flex-1 truncate text-[10px] leading-tight ${
                  l.state === 'active' ? 'text-[hsl(var(--amber))]' : 'text-ink-soft'
                }`}
              >
                {l.label}
              </span>
            </div>
          ))
        )}
      </div>

      <span className="text-[10px] text-ink-soft">栈顶 = 中序下一个要访问的节点</span>
    </div>
  )
}

type TagState = 'past' | 'cur' | 'todo'

const TAG: Record<TagState, string> = {
  past: 'rounded-md border border-[hsl(var(--easy))]/40 bg-[hsl(var(--easy-soft))] px-1.5 py-0.5 font-code text-[10px] text-[hsl(var(--easy))]',
  cur: 'rounded-md border border-[hsl(var(--amber))]/50 bg-[hsl(var(--amber-soft))] px-1.5 py-0.5 font-code text-[10px] font-semibold text-[hsl(var(--amber))]',
  todo: 'rounded-md border border-border bg-card px-1.5 py-0.5 font-code text-[10px] text-ink-soft',
}

function Stage(step: Step) {
  const slot = (W - PAD_L - PAD_R) / ORDER.length
  const x = (id: string) => PAD_L + slot * (ORDER.indexOf(id) + 0.5)
  const y = (id: string) => TOP + DEPTH_OF[id] * LEVEL_GAP

  const stateOf = (id: string): NodeState => {
    if (step.cur === id) return 'current'
    if (step.out.includes(id)) return 'out'
    if (step.stack.includes(id)) return 'stack'
    return 'idle'
  }

  const cur = step.cur
  const topIdx = step.stack.length - 1
  const layers: StackLayer[] = step.stack.map((id, i) => {
    const top = i === topIdx
    if (top && step.phase === 'push' && step.cur === id) {
      return { id, val: VAL_OF[id], state: 'active', label: '本步压入', entering: true }
    }
    return { id, val: VAL_OF[id], state: 'idle', label: top ? '栈顶' : '', entering: false }
  })

  const chip =
    step.phase === 'push' && cur
      ? `↓ 落入 ${VAL_OF[cur]}`
      : step.phase === 'pop' && cur
        ? `↑ 弹出 ${VAL_OF[cur]}`
        : step.phase === 'hasnext'
          ? step.hasRet
            ? '栈非空 → true'
            : '栈空 → false'
          : null

  const chipTone: 'amber' | 'easy' | 'plain' =
    step.phase === 'pop' ? 'easy' : step.phase === 'push' ? 'amber' : 'plain'

  const opText =
    step.phase === 'init'
      ? 'Constructor(root)'
      : step.phase === 'push' && cur
        ? `pushLeft → 压入 ${VAL_OF[cur]}`
        : step.phase === 'pop'
          ? `next() → ${step.nextRet}`
          : step.phase === 'hasnext'
            ? `hasNext() → ${step.hasRet ? 'true' : 'false'}`
            : '全部调用结束'

  return (
    <div className="flex flex-col items-center gap-4">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full select-none">
        {/* 1. 边：直线连接父子，后画的节点圆盖住端点 */}
        {ORDER.map((id) =>
          [NODES[id].left, NODES[id].right]
            .filter((c): c is TreeNode => c !== null)
            .map((child) => {
              const st = stateOf(child.id)
              return (
                <line
                  key={`${id}-${child.id}`}
                  x1={x(id)}
                  y1={y(id)}
                  x2={x(child.id)}
                  y2={y(child.id)}
                  stroke={st === 'current' ? 'hsl(var(--amber))' : st === 'out' ? 'hsl(var(--easy))' : 'hsl(var(--border))'}
                  strokeWidth={st === 'current' ? 2.5 : 2}
                />
              )
            })
        )}

        {/* 2. 节点圆 */}
        {ORDER.map((id) => {
          const st = stateOf(id)
          return (
            <g key={id} className="demo-water">
              <circle
                cx={x(id)}
                cy={y(id)}
                r={NODE_R}
                fill={FILL[st]}
                stroke={STROKE[st]}
                strokeWidth={STROKE_W[st]}
                strokeDasharray={st === 'stack' ? '5 4' : undefined}
              />
              <text
                x={x(id)}
                y={y(id) + 6}
                textAnchor="middle"
                fontSize="17"
                fontWeight="700"
                className="font-code"
                fill={VALUE_FILL[st]}
              >
                {VAL_OF[id]}
              </text>
            </g>
          )
        })}

        {/* 3. 文字标签：状态不靠颜色区分 */}
        {ORDER.map((id) => {
          const st = stateOf(id)
          const outIdx = step.out.indexOf(id)
          return (
            <g key={`label-${id}`}>
              {st === 'current' && (
                <text
                  x={x(id) + NODE_R + 7}
                  y={y(id) + 4}
                  textAnchor="start"
                  fontSize="11"
                  fontWeight="700"
                  className="font-code"
                  fill={LABEL_FILL.current}
                >
                  {step.phase === 'pop' ? '本步弹出' : '本步压入'}
                </text>
              )}
              {st === 'stack' && (
                <text
                  x={x(id) + NODE_R + 7}
                  y={y(id) + 4}
                  textAnchor="start"
                  fontSize="11"
                  fontWeight="600"
                  className="font-code"
                  fill={LABEL_FILL.stack}
                >
                  栈中
                </text>
              )}
              {st === 'out' && outIdx >= 0 && (
                <text
                  x={x(id)}
                  y={y(id) + NODE_R + 15}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="700"
                  className="font-code"
                  fill={LABEL_FILL.out}
                >
                  第 {outIdx + 1} 个
                </text>
              )}
            </g>
          )
        })}
      </svg>

      <div className="flex w-full flex-col items-center gap-3 sm:flex-row sm:items-start sm:justify-center sm:gap-6">
        <StackColumn layers={layers} chip={chip} chipTone={chipTone} />

        <div className="w-full min-w-0 flex-1 sm:max-w-[380px]">
          <p className="text-[11px] font-medium text-ink">调用序列（题解示例 1）</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {COMMANDS.map((c, k) => {
              const state: TagState =
                step.phase === 'done' || k < step.cmd ? 'past' : k === step.cmd ? 'cur' : 'todo'
              return (
                <span key={c + k} className={TAG[state]}>
                  {k + 1}. {c}()
                </span>
              )
            })}
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-ink-soft">
            绿 = 已执行完的调用，琥珀 = 本步正在执行的调用。节点下方小字是它在中序结果里的次序。
          </p>
        </div>
      </div>

      <Badges className="justify-center">
        <Stat label="当前调用" value={opText} tone="amber" />
        <Stat label="输出序列" value={`[${step.out.map((id) => VAL_OF[id]).join(', ')}]`} tone="easy" />
        {step.phase === 'done' ? (
          <Answer>
            中序（升序）序列 <b className="font-code">[{step.out.map((id) => VAL_OF[id]).join(', ')}]</b>
            ，均摊 O(1) / 空间 O(h)
          </Answer>
        ) : (
          <Hint>{step.hint}</Hint>
        )}
      </Badges>
    </div>
  )
}

export default function BinarySearchTreeIteratorDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="用栈模拟中序遍历：栈顶就是下一个最小值"
      info={`输入：root = ${INPUT_TEXT}（题解示例 1 的层序数组，null 为空节点），调用序列 next, next, hasNext, next, hasNext, next, hasNext, next, hasNext。完整跑完这个示例共 ${steps.length} 步；左侧竖条是栈，下标 0 在底部，顶部为栈顶。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '本步压入 / 弹出的节点' },
        { color: TONE.easy, label: '已输出（下方小字为输出次序）' },
        { color: TONE.medium, label: '在栈中，待输出' },
        { color: TONE.muted, label: '尚未入栈访问' },
      ]}
    />
  )
}
