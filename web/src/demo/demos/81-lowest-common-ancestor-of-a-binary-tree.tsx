import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badges, Hint, Stat, TONE } from './stage'

/* ------------------------------------------------------------------ */
/* 81. 二叉树的最近公共祖先 —— 模式 E：树 + 后序递归回传「子树找到了谁」   */
/* ------------------------------------------------------------------ */

/** 题解示例 1 的层序数组（null 表示该位置没有节点）：p = 5、q = 1，答案 3 */
const LEVELS: (number | null)[] = [3, 5, 1, 6, 2, 0, 8, null, null, 7, 4]
const INPUT_TEXT = `[${LEVELS.map((v) => (v === null ? 'null' : v)).join(',')}]`
const P = 5
const Q = 1
const ROOT_ID = 'R'

interface TreeNode {
  id: string
  val: number
  left: TreeNode | null
  right: TreeNode | null
}

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
const SIDE_OF: Record<string, 'left' | 'right' | 'root'> = {}
/** 中序展开：同一层节点的 x 槽位按中序顺序分配 */
const ORDER: string[] = []

function collect(node: TreeNode | null, depth: number, side: 'left' | 'right' | 'root') {
  if (!node) return
  NODES[node.id] = node
  VAL_OF[node.id] = node.val
  DEPTH_OF[node.id] = depth
  SIDE_OF[node.id] = side
  collect(node.left, depth + 1, 'left')
  ORDER.push(node.id)
  collect(node.right, depth + 1, 'right')
}
collect(ROOT, 0, 'root')

function idOfVal(val: number): string {
  return ORDER.find((id) => VAL_OF[id] === val) ?? ROOT_ID
}
const P_ID = idOfVal(P)
const Q_ID = idOfVal(Q)

type Phase = 'init' | 'enter' | 'hit' | 'left' | 'merge' | 'pass' | 'done'

interface Step {
  phase: Phase
  /** 本步正在处理的节点 id；init / done 为 null */
  cur: string | null
  /** 递归调用栈快照，栈顶在末尾 */
  stack: string[]
  /** 本节点这一帧收到的左 / 右子树返回值，null = 还没有结果 */
  leftRet: number | null
  rightRet: number | null
  /** 已判定的最近公共祖先节点 id */
  answer: string | null
  note: string
  /** 下一步动作（由后一个快照推导，供 Hint 使用） */
  next: string
}

function buildSteps(): Step[] {
  const steps: Step[] = []
  const stack: string[] = []
  let answer: string | null = null

  const snap = (
    phase: Phase,
    cur: string | null,
    leftRet: number | null,
    rightRet: number | null,
    note: string
  ): Step => ({
    phase,
    cur,
    stack: stack.slice(),
    leftRet,
    rightRet,
    answer,
    note,
    next: '',
  })

  steps.push(
    snap(
      'init',
      null,
      null,
      null,
      `观察：输入 root = ${INPUT_TEXT}（层序表示，null 为空节点），p = ${P}，q = ${Q}，树上两个目标节点分别标成琥珀色的 p 与青色的 q，递归调用栈此时为空。判断：递归函数 dfs(u) 的返回值定义为「u 的子树里 p、q 的最近公共祖先；只出现其中一个就返回那一个；都没有则返回 null」，所以答案只能由左右子树的结果自底向上拼出。动作：从根节点 dfs(${VAL_OF[ROOT_ID]}) 开始后序遍历，先左后右。为什么：能把 p、q 分到两侧的那个节点，才是深度最大的公共祖先。`
    )
  )

  function dfs(id: string): string | null {
    const node = NODES[id]
    const val = node.val
    stack.push(id)

    if (val === P || val === Q) {
      const which = val === P ? 'p' : 'q'
      const other = val === P ? Q : P
      steps.push(
        snap(
          'hit',
          id,
          null,
          null,
          `观察：节点 ${val} 就是 ${which} 本身，命中递归出口。判断：不再往下递归，它的子节点一个都不会被访问。动作：把 ${val} 直接作为这一侧子树的结果返回给父节点。为什么：一个节点可以是自己的祖先——若 ${other} 落在 ${val} 的子树里，${val} 就是答案；否则它只代表这一侧找到的唯一目标。`
        )
      )
      stack.pop()
      return id
    }

    steps.push(
      snap(
        'enter',
        id,
        null,
        null,
        `观察：进入节点 ${val}，它既不是 p = ${P} 也不是 q = ${Q}。判断：${val} 自己下不了结论，必须先知道左右两棵子树各自找到了谁。动作：按后序先递归左子树${
          node.left ? ` dfs(${node.left.val})` : '（为空，直接得 null）'
        }，再递归右子树${node.right ? ` dfs(${node.right.val})` : '（为空，直接得 null）'}。为什么：只有两侧的返回值都到手，才能判断 p、q 是否在 ${val} 这里分叉。`
      )
    )

    const left = node.left ? dfs(node.left.id) : null
    const leftVal = left === null ? null : VAL_OF[left]

    if (node.left) {
      steps.push(
        snap(
          'left',
          id,
          leftVal,
          null,
          `观察：dfs(${node.left.val}) 返回 ${left === null ? 'null' : leftVal}，节点 ${val} 的左半边${
            left === null ? '没有任何目标' : `找到了 ${leftVal}`
          }。判断：右子树的结果还没到，此刻还判定不了 ${val} 是不是分叉点。动作：转入右子树，递归${
            node.right ? ` dfs(${node.right.val})` : '（右子树为空，直接得 null）'
          }。为什么：判定条件是 left != null && right != null，缺任何一侧都可能让 ${val} 被误判成共同祖先。`
        )
      )
    }

    const right = node.right ? dfs(node.right.id) : null
    const rightVal = right === null ? null : VAL_OF[right]

    if (left !== null && right !== null) {
      answer = id
      steps.push(
        snap(
          'merge',
          id,
          leftVal,
          rightVal,
          `观察：节点 ${val} 同时拿到左子树返回 ${leftVal}、右子树返回 ${rightVal}，两侧都非 null。判断：p、q 正好分居 ${val} 的左右两侧，任何比 ${val} 更深的节点都只能看见其中一个，所以 ${val} 就是把两者分开的最深节点。动作：命中 left != null && right != null 分支，返回 ${val}，它会被上层原样传递。为什么：这正是「左右都命中的第一个节点即最近公共祖先」的判定。`
        )
      )
    } else {
      const res = left ?? right
      const resVal = res === null ? null : VAL_OF[res]
      steps.push(
        snap(
          'pass',
          id,
          leftVal,
          rightVal,
          res === null
            ? `观察：节点 ${val} 的左右子树都返回 null，整棵子树里没有 p 也没有 q。判断：${val} 不可能是公共祖先。动作：向父节点返回 null。为什么：空结果必须原样上报，否则上层会把「没找到」误当成「找到了」。`
            : `观察：节点 ${val} 只从一侧拿到结果 ${resVal}，另一侧是 null。判断：p、q 都在这同一侧（或这一侧只找到了一个目标），${val} 只是路径上的普通节点。动作：把 ${resVal} 原样向上传递。为什么：只有一侧非空时若返回当前节点，就会把答案抬得太高。`
        )
      )
    }

    const result = left !== null && right !== null ? id : (left ?? right)
    stack.pop()
    return result
  }

  const res = dfs(ROOT_ID) ?? ROOT_ID
  const rootFrame = steps.find((s) => s.phase === 'merge' || s.phase === 'pass')

  steps.push(
    snap(
      'done',
      null,
      rootFrame?.leftRet ?? null,
      rootFrame?.rightRet ?? null,
      `观察：dfs(${VAL_OF[ROOT_ID]}) 返回节点 ${VAL_OF[res]}，与 p = ${P}、q = ${Q} 的最近公共祖先一致：${P} 在 ${VAL_OF[res]} 的左子树，${Q} 在 ${VAL_OF[res]} 的右子树。判断：${VAL_OF[res]} 是左右子树都命中的第一个节点，答案就是它本身，而不是 ${P} 或 ${Q}。动作：读取返回节点的值 ${VAL_OF[res]} 作为输出。为什么：每个被访问的节点只处理一次，时间 O(n)；递归栈最深等于树高 h，空间 O(h)。`
    )
  )

  // 「下一步动作」由后一个快照推导，保证与步骤数据完全一致
  steps.forEach((s, i) => {
    const b = steps[i + 1]
    if (!b) return
    const bVal = b.cur === null ? null : VAL_OF[b.cur]
    const side = b.cur === null ? 'root' : SIDE_OF[b.cur]
    if (b.phase === 'enter') {
      s.next =
        s.phase === 'init' ? `从根节点开始后序递归 dfs(${bVal})` : `递归进入节点 ${bVal}，继续往下找`
    } else if (b.phase === 'hit') {
      s.next = `递归进入${side === 'right' ? '右' : '左'}子树 dfs(${bVal})，看它是不是 p 或 q`
    } else if (b.phase === 'left') {
      s.next = `回到节点 ${bVal}，接收左子树的返回值`
    } else if (b.phase === 'merge') {
      s.next = `回到节点 ${bVal}，接收右子树的返回值并做左右判定`
    } else if (b.phase === 'pass') {
      s.next = `把 dfs(${bVal}) 的子树结果原样上报`
    } else if (b.phase === 'done') {
      s.next = '输出最近公共祖先并收尾'
    }
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

const W = 680
const H = 352
const PAD_L = 52
const PAD_R = 52
const NODE_R = 21
const TOP = 58
const LEVEL_GAP = 76

type NodeState = 'answer' | 'p' | 'q' | 'stack' | 'unvisited'

const FILL: Record<NodeState, string> = {
  answer: 'hsl(var(--easy-soft))',
  p: 'hsl(var(--amber-soft))',
  q: 'hsl(var(--teal-soft))',
  stack: 'hsl(var(--card))',
  /** 与 TONE.muted 同值：未访问 */
  unvisited: 'hsl(var(--ink) / 0.18)',
}

const STROKE: Record<NodeState, string> = {
  answer: 'hsl(var(--easy))',
  p: 'hsl(var(--amber))',
  q: 'hsl(var(--teal))',
  stack: 'hsl(var(--border))',
  unvisited: 'hsl(var(--border))',
}

const STROKE_W: Record<NodeState, number> = {
  answer: 3,
  p: 2.5,
  q: 2.5,
  stack: 2,
  unvisited: 2,
}

const VALUE_FILL: Record<NodeState, string> = {
  answer: 'hsl(var(--easy))',
  p: 'hsl(var(--amber))',
  q: 'hsl(var(--teal))',
  stack: 'hsl(var(--ink))',
  unvisited: 'hsl(var(--ink-soft))',
}

/** 节点下方的身份文字：保证状态不只靠颜色区分 */
const LABEL: Record<NodeState, string> = {
  answer: '答案',
  p: 'p',
  q: 'q',
  stack: '',
  unvisited: '未访问',
}

const LABEL_FILL: Record<NodeState, string> = {
  answer: 'hsl(var(--easy))',
  p: 'hsl(var(--amber))',
  q: 'hsl(var(--teal))',
  stack: 'hsl(var(--ink-soft))',
  unvisited: 'hsl(var(--ink-soft))',
}

function Stage(step: Step) {
  const done = step.phase === 'done'
  const slot = (W - PAD_L - PAD_R) / ORDER.length
  const x = (id: string) => PAD_L + slot * (ORDER.indexOf(id) + 0.5)
  const y = (id: string) => TOP + DEPTH_OF[id] * LEVEL_GAP

  const stateOf = (id: string): NodeState => {
    if (step.answer === id) return 'answer'
    if (id === P_ID) return 'p'
    if (id === Q_ID) return 'q'
    if (step.stack.includes(id)) return 'stack'
    return 'unvisited'
  }

  const curVal = step.cur === null ? null : VAL_OF[step.cur]
  /** 命中 p / q 的节点直接返回，两个子调用根本不会发生 */
  const pending = step.phase === 'hit' ? '未递归' : '待返回'
  const leftTxt = step.leftRet === null ? pending : step.leftRet
  const rightTxt = step.rightRet === null ? pending : step.rightRet
  const answerVal = step.answer === null ? '—' : VAL_OF[step.answer]

  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full select-none">
        {/* 1. 边：直线连接父子，后画的节点圆盖住端点 */}
        {ORDER.map((id) =>
          [NODES[id].left, NODES[id].right]
            .filter((c): c is TreeNode => c !== null)
            .map((child) => (
              <line
                key={`${id}-${child.id}`}
                x1={x(id)}
                y1={y(id)}
                x2={x(child.id)}
                y2={y(child.id)}
                stroke="hsl(var(--border))"
                strokeWidth={2}
              />
            ))
        )}

        {/* 2. 节点：答案光晕 → 栈中虚线环 → 圆 → 数值 */}
        {ORDER.map((id) => {
          const st = stateOf(id)
          const onStack = step.stack.includes(id)
          return (
            <g key={id} className="demo-water">
              {st === 'answer' && (
                <g className="demo-pulse">
                  <circle
                    cx={x(id)}
                    cy={y(id)}
                    r={NODE_R + 10}
                    fill="none"
                    stroke="hsl(var(--easy) / 0.15)"
                    strokeWidth={7}
                  />
                  <circle
                    cx={x(id)}
                    cy={y(id)}
                    r={NODE_R + 10}
                    fill="none"
                    stroke="hsl(var(--easy) / 0.5)"
                    strokeWidth={2}
                  />
                </g>
              )}
              {onStack && (
                <circle
                  cx={x(id)}
                  cy={y(id)}
                  r={NODE_R + 4}
                  fill="none"
                  stroke="hsl(var(--ink))"
                  strokeWidth={2}
                  strokeDasharray="5 4"
                />
              )}
              <circle
                cx={x(id)}
                cy={y(id)}
                r={NODE_R}
                fill={FILL[st]}
                stroke={STROKE[st]}
                strokeWidth={STROKE_W[st]}
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

        {/* 3. 文字标签：下方身份（p / q / 答案 / 未访问），上方栈状态（当前 / 栈中） */}
        {ORDER.map((id) => {
          const st = stateOf(id)
          const onStack = step.stack.includes(id)
          const isCur = step.cur === id
          return (
            <g key={`label-${id}`}>
              {LABEL[st] !== '' && (
                <text
                  x={x(id)}
                  y={y(id) + NODE_R + 15}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="700"
                  className="font-code"
                  fill={LABEL_FILL[st]}
                >
                  {LABEL[st]}
                </text>
              )}
              {onStack && (
                <text
                  x={x(id)}
                  y={y(id) - NODE_R - 20}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight={isCur ? 700 : 600}
                  className="font-code"
                  fill={isCur ? 'hsl(var(--ink))' : 'hsl(var(--ink-soft))'}
                >
                  {isCur ? '当前' : '栈中'}
                </text>
              )}
            </g>
          )
        })}

        {/* 4. 说明：空节点不占舞台位置 */}
        <text
          x={W / 2}
          y={H - 10}
          textAnchor="middle"
          fontSize="11"
          fill="hsl(var(--ink-soft))"
        >
          空节点不画在舞台上；命中 p 或 q 后立即返回，灰色子树不会被进入
        </text>
      </svg>

      {/* 递归调用栈（栈顶在右侧，另有文字标注） */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px]">
        <span className="text-ink-soft">递归调用栈</span>
        {step.stack.length === 0 ? (
          <span className="font-code text-ink-soft">
            {done ? '（已全部返回）' : '（空）'}
          </span>
        ) : (
          step.stack.map((id, k) => (
            <span key={id} className="flex items-center gap-1.5">
              {k > 0 && <span className="text-ink-soft">→</span>}
              <span
                className={
                  k === step.stack.length - 1
                    ? 'rounded-md border border-[hsl(var(--ink))]/40 bg-secondary px-2 py-0.5 font-code font-semibold text-ink'
                    : 'rounded-md border border-border bg-card px-2 py-0.5 font-code text-ink-soft'
                }
              >
                dfs({VAL_OF[id]})
              </span>
              {k === step.stack.length - 1 && (
                <span className="text-[10px] text-ink-soft">栈顶</span>
              )}
            </span>
          ))
        )}
      </div>

      <Badges className="justify-center">
        {step.phase === 'init' && (
          <>
            <Stat label="目标 p / q" value={`${P} / ${Q}`} tone="amber" />
            <Stat label="递归入口" value={`dfs(${VAL_OF[ROOT_ID]})`} />
          </>
        )}
        {!done && step.phase !== 'init' && curVal !== null && (
          <>
            <Stat label={`dfs(${curVal}) 左子树返回`} value={leftTxt} />
            <Stat label={`dfs(${curVal}) 右子树返回`} value={rightTxt} />
          </>
        )}
        {done && (
          <>
            <Stat label={`dfs(${VAL_OF[ROOT_ID]}) 左子树返回`} value={leftTxt} />
            <Stat label={`dfs(${VAL_OF[ROOT_ID]}) 右子树返回`} value={rightTxt} />
          </>
        )}
        {!done && <Hint>{step.next}</Hint>}
        {done && (
          <Answer>
            最近公共祖先 = <b className="font-code">{answerVal}</b>
          </Answer>
        )}
      </Badges>
    </div>
  )
}

export default function LowestCommonAncestorOfABinaryTreeDemo() {
  const steps = useMemo(buildSteps, [])
  const answerId = steps.find((s) => s.answer !== null)?.answer ?? null
  const answerVal = answerId === null ? '—' : VAL_OF[answerId]
  return (
    <DemoShell
      title="后序递归回传「子树里找到了谁」"
      info={`输入取自题解示例 1：root = ${INPUT_TEXT}（层序表示，null 为空节点），p = ${P}，q = ${Q}，答案为 ${answerVal}。演示共 ${steps.length} 步；因为 ${P}、${Q} 恰好是 ${answerVal} 的左右孩子，dfs(${P}) 与 dfs(${Q}) 一命中 p/q 就提前返回，节点 6、2、7、4、0、8 始终不会被访问。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: `目标 p = ${P}（节点下方标 p）` },
        { color: TONE.teal, label: `目标 q = ${Q}（节点下方标 q）` },
        { color: TONE.easy, label: '左右子树都命中的节点 = 最近公共祖先（绿 + 光晕）' },
        { color: TONE.ink, label: '递归栈中的节点（深色虚线环，标 当前 / 栈中）' },
        { color: TONE.muted, label: '未访问：命中 p/q 后提前返回，这些子树不会被进入' },
      ]}
    />
  )
}
