import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badges, Hint, Stat, TONE } from './stage'

/* ------------------------------------------------------------------ */
/* 68. 二叉树的最大深度 —— 模式 E：树 + 后序递归（自底向上汇总）           */
/* ------------------------------------------------------------------ */

/** 官方示例 1 的层序数组，null 表示该位置没有节点（最大深度 3） */
const LEVELS: (number | null)[] = [3, 9, 20, null, null, 15, 7]
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

/** 最深路径（左右等高时取左子树），用于 done 步陈述答案 */
function longestPath(node: TreeNode | null): number[] {
  if (!node) return []
  const l = longestPath(node.left)
  const r = longestPath(node.right)
  return [node.val, ...(l.length >= r.length ? l : r)]
}
const PATH = longestPath(ROOT)

interface Step {
  phase: 'init' | 'enter' | 'return' | 'done'
  /** 本步正在进入 / 正在返回的节点 id */
  cur: string | null
  /** 已求出深度的节点（不可变快照） */
  depths: Record<string, number>
  /** 递归调用栈快照，栈顶在末尾 */
  stack: string[]
  /** 目前已求出的最大深度 */
  maxKnown: number
  note: string
}

function buildSteps(): Step[] {
  const steps: Step[] = []
  const depths: Record<string, number> = {}
  const stack: string[] = []

  const snap = (phase: Step['phase'], cur: string | null, note: string): Step => ({
    phase,
    cur,
    depths: { ...depths },
    stack: stack.slice(),
    maxKnown: Math.max(0, ...Object.values(depths)),
    note,
  })

  steps.push(
    snap(
      'init',
      null,
      `初始化：自底向上（后序）递归——空节点深度为 0，非空节点 depth = max(左子树, 右子树) + 1。示例 ${INPUT_TEXT} 中 9 是叶子，20 带着 15 和 7。整棵树的深度只由两棵子树决定，所以先递归到最深处，再逐层把深度往上汇总。`
    )
  )

  function dfs(id: string): number {
    const { val, left, right } = NODES[id]
    const leaf = !left && !right
    stack.push(id)

    const kids =
      left && right
        ? `左孩子是 ${left.val}、右孩子是 ${right.val}`
        : left
          ? `左孩子是 ${left.val}，右孩子为空`
          : right
            ? `左孩子为空，右孩子是 ${right.val}`
            : '左右孩子都是空节点'

    steps.push(
      snap(
        'enter',
        id,
        `观察：进入 dfs(${val})，它的${kids}。` +
          (left && right
            ? `判断：${val} 的深度 = max(左子树深度, 右子树深度) + 1，此刻两棵子树都还没有结果。`
            : leaf
              ? `判断：${val} 没有孩子，两个子调用都会先撞上递归出口返回 0，所以它的深度必然是 1。`
              : `判断：${val} 只有一个孩子，另一个子调用会先撞上递归出口返回 0，深度由这个孩子决定。`) +
          (left
            ? `动作：按后序先递归左子树 dfs(${left.val})，等它返回后再处理右子树。`
            : right
              ? `动作：左子树为空，先递归右子树 dfs(${right.val})，再回到 ${val} 汇总。`
              : `动作：两棵子树都是空节点，直接汇总自己的深度并返回。`)
      )
    )

    const l = left ? dfs(left.id) : 0
    const r = right ? dfs(right.id) : 0
    const d = Math.max(l, r) + 1
    depths[id] = d
    stack.pop()

    const got =
      left && right
        ? `depth(${left.val}) = ${l}、depth(${right.val}) = ${r}`
        : left
          ? `depth(${left.val}) = ${l}，右子树为空返回 0`
          : right
            ? `depth(${right.val}) = ${r}，左子树为空返回 0`
            : '两个递归出口各返回 0'
    const back =
      id === ROOT_ID
        ? `动作：这是 dfs(root) 的返回值，整棵树的最大深度确定为 ${d}。`
        : `动作：把 ${d} 返回给父节点 ${VAL_OF[id.slice(0, -1)]}，depth(${val}) = ${d}。`

    steps.push(
      snap(
        'return',
        id,
        left && right
          ? `观察：${val} 拿到左右子树的结果 ${got}。判断：max(${l}, ${r}) + 1 = ${d}。${back}`
          : leaf
            ? `观察：${val} 的左右孩子都是空节点，两个递归调用都命中出口返回 0。判断：max(${l}, ${r}) + 1 = ${d}，${val} 是叶子。${back}`
            : `观察：${val} 只有一个孩子，${got}。判断：max(${l}, ${r}) + 1 = ${d}。${back}`
      )
    )
    return d
  }

  const answer = dfs(ROOT_ID)

  steps.push(
    snap(
      'done',
      null,
      `dfs(root) 返回 ${answer}，即二叉树的最大深度。最长路径 ${PATH.join(' → ')} 共 ${PATH.length} 个节点；深度按节点数计，空树返回 0。每个节点只被访问一次，时间 O(n)；递归栈最深等于树高 h，空间 O(h)。`
    )
  )
  return steps
}

/* ---------------- 舞台渲染 ---------------- */

const W = 680
const H = 272
const PAD_L = 66
const PAD_R = 66
const NODE_R = 22
const TOP = 52
const LEVEL_GAP = 78

type NodeState = 'current' | 'back' | 'computed' | 'stack' | 'idle'

const FILL: Record<NodeState, string> = {
  current: 'hsl(var(--paper))',
  back: 'hsl(var(--teal))',
  computed: 'hsl(var(--teal))',
  stack: 'hsl(var(--paper))',
  idle: 'hsl(var(--paper))',
}

const STROKE: Record<NodeState, string> = {
  current: 'hsl(var(--amber))',
  back: 'hsl(var(--amber))',
  computed: 'hsl(var(--teal))',
  stack: 'hsl(var(--medium))',
  idle: 'hsl(var(--border))',
}

const STROKE_W: Record<NodeState, number> = {
  current: 3,
  back: 3,
  computed: 2,
  stack: 2.5,
  idle: 2,
}

const VALUE_FILL: Record<NodeState, string> = {
  current: 'hsl(var(--amber))',
  back: 'hsl(var(--card))',
  computed: 'hsl(var(--card))',
  stack: 'hsl(var(--ink))',
  idle: 'hsl(var(--ink))',
}

function Stage(step: Step) {
  const slot = (W - PAD_L - PAD_R) / ORDER.length
  const x = (id: string) => PAD_L + slot * (ORDER.indexOf(id) + 0.5)
  const y = (id: string) => TOP + DEPTH_OF[id] * LEVEL_GAP

  const stateOf = (id: string): NodeState => {
    if (step.cur === id) return step.phase === 'return' ? 'back' : 'current'
    if (id in step.depths) return 'computed'
    if (step.stack.includes(id)) return 'stack'
    return 'idle'
  }

  const curId = step.cur
  const curVal = curId ? VAL_OF[curId] : null
  const curDepth = curId !== null && curId in step.depths ? step.depths[curId] : null
  const curLeft = curId ? NODES[curId].left : null

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
                stroke={
                  step.cur === child.id
                    ? 'hsl(var(--amber))'
                    : child.id in step.depths
                      ? 'hsl(var(--teal))'
                      : 'hsl(var(--border))'
                }
                strokeWidth={step.cur === child.id ? 2.5 : 2}
              />
            ))
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

        {/* 3. 文字标签：深度小字 + 状态文字（不靠颜色区分状态） */}
        {ORDER.map((id) => {
          const st = stateOf(id)
          const known = id in step.depths
          return (
            <g key={`label-${id}`}>
              {known && (
                <text
                  x={x(id)}
                  y={y(id) - NODE_R - 10}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="700"
                  className="font-code"
                  fill={st === 'back' ? 'hsl(var(--amber))' : 'hsl(var(--teal))'}
                >
                  h={step.depths[id]}
                </text>
              )}
              {st === 'current' && (
                <text
                  x={x(id) + NODE_R + 8}
                  y={y(id) + 4}
                  textAnchor="start"
                  fontSize="11"
                  fontWeight="700"
                  className="font-code"
                  fill="hsl(var(--amber))"
                >
                  进入
                </text>
              )}
              {st === 'back' && (
                <text
                  x={x(id) + NODE_R + 8}
                  y={y(id) + 4}
                  textAnchor="start"
                  fontSize="11"
                  fontWeight="700"
                  className="font-code"
                  fill="hsl(var(--amber))"
                >
                  回溯
                </text>
              )}
              {st === 'stack' && (
                <text
                  x={x(id) + NODE_R + 8}
                  y={y(id) + 4}
                  textAnchor="start"
                  fontSize="11"
                  fontWeight="600"
                  className="font-code"
                  fill="hsl(var(--medium))"
                >
                  栈中
                </text>
              )}
            </g>
          )
        })}

        {/* 4. 说明：空节点不占舞台位置 */}
        <text
          x={W / 2}
          y={H - 8}
          textAnchor="middle"
          fontSize="11"
          className="font-code"
          fill="hsl(var(--ink-soft))"
        >
          空节点不画在舞台上，递归出口一律返回 0
        </text>
      </svg>

      {/* 递归调用栈（栈顶在右侧，另有文字标注） */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px]">
        <span className="text-ink-soft">递归调用栈</span>
        {step.stack.length === 0 ? (
          <span className="font-code text-ink-soft">
            {step.phase === 'done' ? '（已全部返回）' : '（空）'}
          </span>
        ) : (
          step.stack.map((id, k) => (
            <span key={id} className="flex items-center gap-1.5">
              {k > 0 && <span className="text-ink-soft">→</span>}
              <span
                className={
                  k === step.stack.length - 1
                    ? 'rounded-md border border-[hsl(var(--amber))]/50 bg-[hsl(var(--amber-soft))] px-2 py-0.5 font-code font-semibold text-[hsl(var(--amber))]'
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
        <Stat label="当前节点" value={curVal ?? '—'} tone="amber" />
        <Stat label="该节点返回深度" value={curId === null ? '—' : (curDepth ?? '待算')} tone="teal" />
        <Stat label="已算出的最大深度" value={step.maxKnown} tone="easy" />
        {step.phase === 'init' && <Hint>从根节点 dfs({VAL_OF[ROOT_ID]}) 开始后序遍历</Hint>}
        {step.phase === 'enter' && curId && (
          <Hint>
            {curLeft ? `递归左子树 dfs(${curLeft.val})` : '命中空节点出口，返回 0'}
          </Hint>
        )}
        {step.phase === 'return' && curId && (
          <Hint tone="easy">
            {curId === ROOT_ID
              ? '整棵树深度已确定'
              : `把 ${step.depths[curId]} 返回给父节点 ${VAL_OF[curId.slice(0, -1)]}`}
          </Hint>
        )}
        {step.phase === 'done' && (
          <Answer>
            最大深度 = {step.maxKnown}（路径 {PATH.join(' → ')}）
          </Answer>
        )}
      </Badges>
    </div>
  )
}

export default function MaximumDepthOfBinaryTreeDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="后序递归汇总子树深度"
      info={`root = ${INPUT_TEXT}（层序表示，null 为空节点），后序递归求整棵树的最大深度。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '当前节点（进入 / 回溯）' },
        { color: TONE.medium, label: '递归栈中，子树未算完' },
        { color: TONE.teal, label: '已算出深度 h（节点旁小字）' },
        { color: TONE.muted, label: '尚未访问' },
      ]}
    />
  )
}
