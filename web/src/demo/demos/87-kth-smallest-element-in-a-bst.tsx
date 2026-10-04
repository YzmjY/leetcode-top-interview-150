import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badges, Cell, Hint, Stat, TONE, type CellState } from './stage'

/* ------------------------------------------------------------------ */
/* 87. 二叉搜索树中第 K 小的元素 —— 模式 E：BST + 迭代中序，数到第 k 个  */
/* 用显式栈模拟中序：一路压左链，弹出即访问并计数，k 减到 0 就返回。     */
/* ------------------------------------------------------------------ */

/** 题解「示例 2」的层序数组（null 为空节点）：k = 3，答案 3 */
const LEVELS: (number | null)[] = [5, 3, 6, 2, 4, null, null, 1]
const K = 3
const INPUT_TEXT = `[${LEVELS.map((v) => (v === null ? 'null' : v)).join(', ')}]`

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
/** 中序展开：x 槽位按中序顺序分配，槽位序号正好等于升序次序 */
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

/** 中序（升序）值序列与第 k 小的答案 */
const INORDER = ORDER.map((id) => VAL_OF[id])
const ANSWER = INORDER[K - 1]

/* ---------------- 步骤数据 ---------------- */

type Phase = 'init' | 'push' | 'pop' | 'done'

interface Step {
  phase: Phase
  /** 本步压入 / 弹出的节点 id；init 与 done 为 null */
  cur: string | null
  /** 已按中序弹出计数的节点 id，按访问顺序（不可变快照） */
  visited: string[]
  /** 栈快照，下标 0 为栈底 */
  stack: string[]
  /** 已弹出个数 = 当前中序序号 */
  count: number
  /** 剩余 k：还差几个才到第 K 小 */
  remain: number
  /** 第 K 小的节点 id（命中步与 done 步非空） */
  answer: string | null
  note: string
  /** 下一步动作，由后一个快照统一回填，供 Hint 使用 */
  hint: string
}

function buildSteps(): Step[] {
  const steps: Step[] = []
  const stack: string[] = []
  const visited: string[] = []
  let answer: string | null = null

  const snap = (phase: Phase, cur: string | null, note: string): Step => ({
    phase,
    cur,
    visited: visited.slice(),
    stack: stack.slice(),
    count: visited.length,
    remain: K - visited.length,
    answer,
    note,
    hint: '',
  })

  steps.push(
    snap(
      'init',
      null,
      `观察：BST 用层序数组 ${INPUT_TEXT} 给出，k = ${K}；此刻栈为空、已访问序列为空，剩余 k = ${K}。` +
        `判断：BST 的中序序列严格升序，所以「中序遍历时第 ${K} 个被访问的节点」就是第 ${K} 小的元素，不必真的建出中序数组。` +
        `动作：cur 从根 ${VAL_OF[ROOT_ID]} 出发，沿左指针一路压栈，栈里保存的是还没访问完的左祖先链。` +
        `为什么：最小值一定在最左端，左链压到底后栈顶才会是中序的第 1 个节点。`
    )
  )

  let cur: TreeNode | null = ROOT

  while (cur !== null || stack.length > 0) {
    while (cur !== null) {
      const pushed: TreeNode = cur
      stack.push(pushed.id)
      cur = pushed.left
      const leftVal = pushed.left ? VAL_OF[pushed.left.id] : null
      steps.push(
        snap(
          'push',
          pushed.id,
          leftVal === null
            ? `观察：cur 指向 ${pushed.val}，它的左孩子为空。` +
              `判断：${pushed.val} 没有左子树，中序里紧接着要访问的就是它自己，它也是当前还没访问的节点中最小的那个。` +
              `动作：把 ${pushed.val} 压入栈，左链到底，cur 置空、转入弹栈。` +
              `为什么：只有左链压完，栈顶才是中序的下一个节点，弹出它才开始计数。`
            : `观察：cur 指向 ${pushed.val}，它的左孩子是 ${leftVal}。` +
              `判断：中序访问顺序是「左 → 根 → 右」，${pushed.val} 要等左子树全部访问完才轮到。` +
              `动作：把 ${pushed.val} 压入栈，cur 沿左指针下降到 ${leftVal}。` +
              `为什么：栈里这条链就是「还没访问完的左祖先」，访问完左子树后要靠它回到 ${pushed.val}。`
        )
      )
    }

    const poppedId = stack.pop() as string
    const popped = NODES[poppedId]
    visited.push(poppedId)
    const ordinal = visited.length

    if (ordinal === K) {
      answer = poppedId
      steps.push(
        snap(
          'pop',
          poppedId,
          `观察：弹出栈顶 ${popped.val}，它的左子树已经全部访问完，中序序号正好推进到第 ${K} 个。` +
            `判断：剩余 k 从 1 减到 0，${popped.val} 就是第 ${K} 小的元素。` +
            `动作：立即返回 ${popped.val}，不再把右子树的节点压栈。` +
            `为什么：中序序列严格升序，第 ${K} 个被访问的节点必然是第 ${K} 小；提前返回只跳过更靠后的节点，答案不变。`
        )
      )
      break
    }

    cur = popped.right
    steps.push(
      snap(
        'pop',
        poppedId,
        `观察：弹出栈顶 ${popped.val}，它的左子树已经全部访问完，中序序号推进到第 ${ordinal} 个。` +
          `判断：还要再数 ${K - ordinal} 个才到第 ${K} 小，本次计数没命中。` +
          (cur
            ? `动作：cur 转向 ${popped.val} 的右孩子 ${cur.val}，先把右子树的最左链压栈。`
            : `动作：${popped.val} 没有右孩子，cur 置空，下一轮直接从栈里继续弹出。`) +
          `为什么：中序里右子树整体排在 ${popped.val} 之后，压栈与弹栈交替就能保证访问顺序严格升序。`
      )
    )
  }

  const answerVal = VAL_OF[answer ?? ORDER[K - 1]]
  const rest = INORDER.slice(K)
  const leftInStack = stack.map((id) => VAL_OF[id])
  steps.push(
    snap(
      'done',
      null,
      `观察：第 ${K} 次弹出计数落在节点 ${answerVal} 上，已访问序列 [${visited.join(', ')}] 正是升序序列的前 ${K} 项。` +
        `判断：第 ${K} 小的元素 = ${answerVal}，读法就是「中序第 ${K} 个弹出的节点」。` +
        `动作：k 减到 0 时立刻 return，剩下的 ${rest.join('、')} 这 ${rest.length} 个节点不再遍历，栈里还压着 ${leftInStack.join('、')}。` +
        `为什么：先沿左链走到最小值要 O(h)，之后每计数一个节点均摊 O(1)，总时间 O(h + k)；栈的最大深度等于树高，空间 O(h)。`
    )
  )

  // 「下一步动作」由后一个快照推导，保证 Hint 说的就是真正要发生的事
  steps.forEach((s, i) => {
    const b = steps[i + 1]
    if (!b) return
    if (b.phase === 'done') {
      s.hint = `计数命中，输出答案：中序第 ${K} 个弹出的节点`
    } else if (b.phase === 'push' && b.cur) {
      const from = s.phase === 'pop' && s.cur ? NODES[s.cur].right : null
      s.hint =
        from && from.id === b.cur
          ? `转向右子树：把 ${VAL_OF[b.cur]} 压入栈`
          : `沿左指针把 ${VAL_OF[b.cur]} 压入栈`
    } else if (b.phase === 'pop' && b.cur) {
      s.hint = `弹出栈顶 ${VAL_OF[b.cur]}，中序序号推进到第 ${b.count} 个`
    }
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

const W = 620
const PAD_L = 52
const PAD_R = 52
const NODE_R = 22
const TOP = 52
const LEVEL_GAP = 76
const MAX_DEPTH = Math.max(...ORDER.map((id) => DEPTH_OF[id]))
const H = TOP + MAX_DEPTH * LEVEL_GAP + 76

type NodeState = 'current' | 'answer' | 'visited' | 'stack' | 'idle'

const FILL: Record<NodeState, string> = {
  current: 'hsl(var(--amber-soft))',
  answer: 'hsl(var(--amber-soft))',
  visited: 'hsl(var(--easy-soft))',
  stack: 'hsl(var(--medium-soft))',
  idle: 'hsl(var(--ink) / 0.18)',
}

const STROKE: Record<NodeState, string> = {
  current: 'hsl(var(--amber))',
  answer: 'hsl(var(--amber))',
  visited: 'hsl(var(--easy))',
  stack: 'hsl(var(--medium))',
  idle: 'hsl(var(--border))',
}

const STROKE_W: Record<NodeState, number> = {
  current: 3,
  answer: 3.5,
  visited: 2.5,
  stack: 2.5,
  idle: 2,
}

const VALUE_FILL: Record<NodeState, string> = {
  current: 'hsl(var(--amber))',
  answer: 'hsl(var(--amber))',
  visited: 'hsl(var(--easy))',
  stack: 'hsl(var(--medium))',
  idle: 'hsl(var(--ink-soft))',
}

const LABEL_FILL: Record<NodeState, string> = {
  current: 'hsl(var(--amber))',
  answer: 'hsl(var(--amber))',
  visited: 'hsl(var(--easy))',
  stack: 'hsl(var(--medium))',
  idle: 'hsl(var(--ink-soft))',
}

/** 中序序列条：第 k 个槽位始终是琥珀目标位，已访问槽位为绿，其余为灰 */
function slotState(idx: number, count: number): CellState {
  if (idx === K - 1) return 'active'
  if (idx < count) return 'ok'
  return 'dim'
}

const CHIP = 'rounded-md border border-[hsl(var(--medium))]/40 bg-[hsl(var(--medium-soft))] px-1.5 py-0.5 font-code text-[10px] text-[hsl(var(--medium))]'
const CHIP_ACTIVE =
  'rounded-md border border-[hsl(var(--amber))]/50 bg-[hsl(var(--amber-soft))] px-1.5 py-0.5 font-code text-[10px] font-semibold text-[hsl(var(--amber))]'

function Stage(step: Step) {
  const slot = (W - PAD_L - PAD_R) / ORDER.length
  const x = (id: string) => PAD_L + slot * (ORDER.indexOf(id) + 0.5)
  const y = (id: string) => TOP + DEPTH_OF[id] * LEVEL_GAP

  const stateOf = (id: string): NodeState => {
    if (step.answer === id) return 'answer'
    if (step.cur === id) return 'current'
    if (step.visited.includes(id)) return 'visited'
    if (step.stack.includes(id)) return 'stack'
    return 'idle'
  }

  const isDone = step.phase === 'done'
  const answerId = step.answer
  const answerVal = answerId === null ? null : VAL_OF[answerId]
  const topId = step.stack.length > 0 ? step.stack[step.stack.length - 1] : null

  return (
    <div className="flex flex-col items-center gap-3">
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
                  stroke={
                    st === 'current' || st === 'answer'
                      ? 'hsl(var(--amber))'
                      : st === 'visited'
                        ? 'hsl(var(--easy))'
                        : 'hsl(var(--border))'
                  }
                  strokeWidth={st === 'current' || st === 'answer' ? 2.5 : 2}
                />
              )
            })
        )}

        {/* 2. 第 k 小的节点：琥珀光晕（整屏仅此一处呼吸动效） */}
        {ORDER.filter((id) => step.answer === id).map((id) => (
          <circle
            key={`halo-${id}`}
            className="demo-pulse"
            cx={x(id)}
            cy={y(id)}
            r={NODE_R + 7}
            fill="none"
            stroke="hsl(var(--amber))"
            strokeWidth={3}
            opacity={0.45}
          />
        ))}

        {/* 3. 节点圆 */}
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

        {/* 4. 文字标签：状态不靠颜色区分 */}
        {ORDER.map((id) => {
          const st = stateOf(id)
          const ord = step.visited.indexOf(id)
          return (
            <g key={`label-${id}`}>
              {step.cur === id && (
                <text
                  x={x(id)}
                  y={y(id) - NODE_R - 10}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="700"
                  className="font-code"
                  fill={LABEL_FILL.current}
                >
                  {step.phase === 'push' ? '本步压入' : '本步弹出'}
                </text>
              )}
              {st === 'answer' && (
                <text
                  x={x(id)}
                  y={y(id) + NODE_R + 16}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="700"
                  className="font-code"
                  fill={LABEL_FILL.answer}
                >
                  第 {K} 小
                </text>
              )}
              {st === 'visited' && ord >= 0 && (
                <text
                  x={x(id)}
                  y={y(id) + NODE_R + 16}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="700"
                  className="font-code"
                  fill={LABEL_FILL.visited}
                >
                  第 {ord + 1} 个
                </text>
              )}
              {st === 'stack' && (
                <text
                  x={x(id)}
                  y={y(id) + NODE_R + 16}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="600"
                  className="font-code"
                  fill={LABEL_FILL.stack}
                >
                  栈中
                </text>
              )}
            </g>
          )
        })}

        <text
          x={W / 2}
          y={H - 12}
          textAnchor="middle"
          fontSize="11"
          className="font-code"
          fill="hsl(var(--ink-soft))"
        >
          圆内是节点值；圆下小字：绿色 = 中序第几个被访问，琥珀 = 第 {K} 小
        </text>
      </svg>

      {/* 中序访问序列：槽位序号就是中序（升序）次序 */}
      <div className="flex w-full max-w-[560px] flex-col gap-1.5">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px]">
          <span className="text-ink-soft">中序访问序列（BST 中序严格升序，序号从 1 计数）</span>
          <span className="font-code text-[hsl(var(--amber))]">
            目标：第 {K} 个（已数 {step.count} 个）
          </span>
        </div>
        <div className="flex w-full gap-1.5">
          {ORDER.map((id, idx) => (
            <div key={`slot-${id}`} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <Cell
                state={slotState(idx, step.count)}
                size="sm"
                className="h-9 w-full min-w-0 sm:min-w-0"
              >
                {idx < step.count ? VAL_OF[id] : idx === K - 1 ? '?' : '·'}
              </Cell>
              <span
                className={
                  idx === K - 1
                    ? 'font-code text-[10px] font-bold text-[hsl(var(--amber))]'
                    : idx < step.count
                      ? 'font-code text-[10px] font-bold text-[hsl(var(--easy))]'
                      : 'font-code text-[10px] text-ink-soft'
                }
              >
                第 {idx + 1}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 中序栈：栈底在左，栈顶在右 */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px]">
        <span className="text-ink-soft">中序栈（栈底 → 栈顶）</span>
        {step.stack.length === 0 ? (
          <span className="font-code text-ink-soft">（空）</span>
        ) : (
          step.stack.map((id, i) => (
            <span
              key={`stack-${id}`}
              className={i === step.stack.length - 1 && step.phase === 'push' ? CHIP_ACTIVE : CHIP}
            >
              {VAL_OF[id]}
              {i === step.stack.length - 1 ? ' 栈顶' : ''}
            </span>
          ))
        )}
        {topId !== null && !isDone && (
          <span className="text-[10px] text-ink-soft">栈顶 = 中序下一个要访问的节点</span>
        )}
      </div>

      <Badges className="justify-center">
        <Stat label="当前中序序号" value={step.count} tone="easy" />
        <Stat label="剩余 k" value={step.remain} tone="amber" />
        {isDone ? (
          <Answer>
            第 <b className="font-code">{K}</b> 小的元素 = <b className="font-code">{answerVal}</b>
          </Answer>
        ) : (
          <Hint>{step.hint}</Hint>
        )}
      </Badges>
    </div>
  )
}

export default function KthSmallestElementInABstDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="迭代中序遍历：数到第 k 个就是答案"
      info={`输入：root = ${INPUT_TEXT}（题解示例 2 的层序数组，null 为空节点），k = ${K}，期望输出 ${ANSWER}；中序序列是 [${INORDER.join(', ')}]，第 ${K} 个即 ${ANSWER}。示例 1 的 k = 1 弹出第一个节点就结束，看不出计数过程，所以这里只跑示例 2 这一组，全程共 ${steps.length} 步。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '本步压入 / 弹出；第 k 小（带光晕）' },
        { color: TONE.medium, label: '栈中待访问的左祖先链' },
        { color: TONE.easy, label: '已按中序访问（小字为序号）' },
        { color: TONE.muted, label: '尚未访问 / 未处理' },
      ]}
    />
  )
}
