import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badges, Hint, Stat, TONE } from './stage'

/* ------------------------------------------------------------------ */
/* 70. 翻转二叉树 —— 模式 E：树 + 前序递归（先交换左右孩子，再递归子树）  */
/* ------------------------------------------------------------------ */

/** 题解示例 1 的层序数组，null 表示该位置没有节点（输出 [4,7,2,9,6,3,1]） */
const LEVELS: (number | null)[] = [4, 2, 7, 1, 3, 6, 9]
const INPUT_TEXT = `[${LEVELS.map((v) => (v === null ? 'null' : v)).join(', ')}]`
const ANSWER_TEXT = '[4,7,2,9,6,3,1]'
const NODE_COUNT = LEVELS.filter((v) => v !== null).length

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
/** 每个节点的固定 x 槽位：按原树中序展开编号，交换后位置不跳动 */
const COL_OF: Record<string, number> = {}
const DEPTH_OF: Record<string, number> = {}
const ORDER: string[] = []

function collect(node: TreeNode | null, depth: number, counter: { c: number }) {
  if (!node) return
  NODES[node.id] = node
  DEPTH_OF[node.id] = depth
  collect(node.left, depth + 1, counter)
  COL_OF[node.id] = counter.c
  ORDER.push(node.id)
  counter.c += 1
  collect(node.right, depth + 1, counter)
}
collect(ROOT, 0, { c: 0 })

/** 每个节点在原始树中的父节点 id（用于 return 步说明把结果返回给谁） */
const PARENT_OF: Record<string, string> = {}
function markParents(node: TreeNode | null) {
  if (!node) return
  if (node.left) {
    PARENT_OF[node.left.id] = node.id
    markParents(node.left)
  }
  if (node.right) {
    PARENT_OF[node.right.id] = node.id
    markParents(node.right)
  }
}
markParents(ROOT)

/** 层序遍历（输出即题目要求返回的数组形态，null 只用于占位） */
function levelOrder(node: TreeNode | null): number[] {
  const out: number[] = []
  const queue: (TreeNode | null)[] = [node]
  while (queue.length) {
    const cur = queue.shift()
    if (cur === undefined) break
    if (cur === null) continue
    out.push(cur.val)
    queue.push(cur.left, cur.right)
  }
  return out
}

interface Swap {
  /** 被交换左右孩子的节点 id */
  id: string
  /** 该节点交换前的左孩子值 / 右孩子值（可能为空节点） */
  fromLeft: number | null
  fromRight: number | null
}

interface Step {
  phase: 'init' | 'swap' | 'leaf' | 'return' | 'done'
  /** 当前处理的节点 id；init / done 为 null */
  cur: string | null
  /** 各节点当前的左右孩子值，用于画边与 L/R 标签 */
  shape: Record<string, { left: number | null; right: number | null }>
  /** 本步当前这棵树的层序快照（输出形态，空节点直接略过） */
  order: number[]
  /** 已记录完成的交换（不可变快照） */
  swaps: Swap[]
  /** 子树已完全翻转的节点 id */
  done: string[]
  note: string
  /** 下一步动作（由后一个快照统一回填，供 Hint 使用） */
  next: string
}

function buildSteps(): Step[] {
  const steps: Step[] = []
  const root = buildTree(LEVELS, 0, ROOT_ID)
  const swaps: Swap[] = []
  const done: string[] = []

  const shapeOf = (node: TreeNode | null): Record<string, { left: number | null; right: number | null }> => {
    const out: Record<string, { left: number | null; right: number | null }> = {}
    const walk = (n: TreeNode | null) => {
      if (!n) return
      out[n.id] = { left: n.left ? n.left.val : null, right: n.right ? n.right.val : null }
      walk(n.left)
      walk(n.right)
    }
    walk(node)
    return out
  }

  const snap = (extra: Partial<Step> & Pick<Step, 'phase' | 'cur' | 'note'>): Step => ({
    shape: shapeOf(root),
    order: levelOrder(root),
    swaps: swaps.slice(),
    done: done.slice(),
    next: '',
    ...extra,
  })

  steps.push(
    snap({
      phase: 'init',
      cur: null,
      note: `观察：root = ${INPUT_TEXT}，4 是根，2、7 是它的左右孩子，1、3、6、9 都是叶子。判断：翻转 = 每个节点都交换自己的左右孩子，所以先交换当前这一层，再递归翻转两棵子树。动作：按前序从根 4 进入 invert(4)，空节点直接返回 null。为什么：交换只作用于当前一层，递归只作用于下一层，两者互不干扰，前序/后序结果相同。`,
    })
  )

  function invert(node: TreeNode | null) {
    if (!node) return
    const before = { left: node.left ? node.left.val : null, right: node.right ? node.right.val : null }

    if (!node.left && !node.right) {
      if (done.indexOf(node.id) < 0) done.push(node.id)
      steps.push(
        snap({
          phase: 'leaf',
          cur: node.id,
          note: `观察：invert(${node.val}) 中 ${node.val} 的左右孩子都是空节点。判断：交换两个空节点等于没有交换，${node.val} 这一层本来就已经满足要求。动作：叶子上的交换是空操作，紧接着的两个 invert(null) 调用命中递归出口直接返回 null。为什么：终止条件是节点为 nil 就返回 nil，叶子不需要做任何修改，也不需要新建节点。`,
        })
      )
      return
    }

    const tmp = node.left
    node.left = node.right
    node.right = tmp
    swaps.push({ id: node.id, fromLeft: before.left, fromRight: before.right })
    const swapIndex = swaps.length
    if (done.indexOf(node.id) < 0) done.push(node.id)

    const nowLeft = node.left ? node.left.val : null
    const nowRight = node.right ? node.right.val : null

    steps.push(
      snap({
        phase: 'swap',
        cur: node.id,
        note: `观察：轮到节点 ${node.val}，它的左孩子是 ${before.left ?? '空'}、右孩子是 ${before.right ?? '空'}。判断：翻转要求 ${node.val} 这一层的左右位置互换，必须用一次赋值同时交换两个引用。动作：交换后左孩子变成 ${nowLeft ?? '空'}、右孩子变成 ${nowRight ?? '空'}，接着递归翻转这两棵子树。为什么：拆成两次单向赋值会让两侧都变成原来的右子树，所以必须一次完成交换。`,
      })
    )

    const retainedLeft = node.left ? node.left.val : null
    const retainedRight = node.right ? node.right.val : null

    invert(node.left)
    invert(node.right)

    const back = PARENT_OF[node.id]
    steps.push(
      snap({
        phase: 'return',
        cur: node.id,
        note: `观察：${retainedLeft ?? '空'} 与 ${retainedRight ?? '空'} 两棵子树都已递归翻转完毕，回到节点 ${node.val}。判断：${node.val} 自己的左右孩子在第 ${swapIndex} 次交换时就换好了，子树内部也已全部翻转，以 ${node.val} 为根的子树翻转结束。动作：${
          back ? `向上返回给父节点 ${NODES[back].val}` : 'invert(4) 返回根节点 4，整棵树处理完毕'
        }。为什么：交换发生在父节点这一层、递归发生在子节点这一层，两层都处理完才代表整棵子树翻转完成。`,
      })
    )
  }

  invert(root)

  steps.push(
    snap({
      phase: 'done',
      cur: null,
      note: `观察：所有节点都处理完，共做了 ${swaps.length} 次交换（4、2、7 各一次，三个叶子不交换）。判断：最终的层序输出 ${ANSWER_TEXT} 正好是原序列每一层的左右互换。动作：答案 = invert(root) 返回的根节点，读出来就是 ${ANSWER_TEXT}。为什么：每个节点只被访问一次，时间 O(n)；递归栈深度等于树高 h，空间 O(h)（最坏 O(n)）。`,
    })
  )

  // 「下一步动作」由后一个快照统一回填，保证 Hint 与步骤数据完全一致
  steps.forEach((s, i) => {
    const b = steps[i + 1]
    if (!b) return
    const node = b.cur !== null ? NODES[b.cur] : null
    if (b.phase === 'done') s.next = `输出答案 ${ANSWER_TEXT}`
    else if (b.phase === 'swap' && node) {
      const l = node.left ? node.left.val : null
      const r = node.right ? node.right.val : null
      s.next =
        l === null && r === null
          ? `交换节点 ${node.val} 的两个空节点（等于不交换）`
          : `交换节点 ${node.val} 的左右孩子：${l ?? '空'} ↔ ${r ?? '空'}`
    } else if (b.phase === 'leaf' && node) s.next = `进入叶子 ${node.val}，命中递归出口后返回`
    else if (b.phase === 'return' && node) {
      const parent = PARENT_OF[node.id]
      s.next = parent
        ? `子树 ${node.val} 翻转完成，返回父节点 ${NODES[parent].val}`
        : `子树 ${node.val} 翻转完成，返回整棵树的根`
    }
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

const W = 680
const H = 264
const PAD_L = 66
const PAD_R = 66
const NODE_R = 22
const TOP = 54
const LEVEL_GAP = 78

function Stage(step: Step) {
  const slot = (W - PAD_L - PAD_R) / NODE_COUNT
  const x = (id: string) => PAD_L + slot * (COL_OF[id] + 0.5)
  const y = (id: string) => TOP + DEPTH_OF[id] * LEVEL_GAP

  const isDone = (id: string) => step.done.indexOf(id) >= 0
  const curId = step.cur
  const cur = curId !== null ? NODES[curId] : null
  const doneCount = step.done.length
  const prefix = step.order

  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full select-none">
        <defs>
          <marker
            id="t70-swap-a"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M0,1 L10,5 L0,9 z" fill={TONE.medium} />
          </marker>
          <marker
            id="t70-swap-b"
            viewBox="0 0 10 10"
            refX="1"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M10,1 L0,5 L10,9 z" fill={TONE.medium} />
          </marker>
        </defs>

        {/* 1. 边：直线连接父子（节点圆后画，盖住端点） */}
        {ORDER.map((id) => (
          <g key={`edges-${id}`}>
            {(['left', 'right'] as const).map((side) => {
              const childId = side === 'left' ? `${id}L` : `${id}R`
              const childVal = step.shape[id][side]
              if (childVal === null) return null
              const stroke =
                curId === id || curId === childId
                  ? TONE.amber
                  : isDone(id) && isDone(childId)
                    ? TONE.easy
                    : 'hsl(var(--border))'
              const active = curId === id || curId === childId
              const px = x(id)
              const py = y(id)
              const cx = x(childId)
              const cy = y(childId)
              // L / R 贴着连线标注（父圆下缘之外 32% 处），避开中部的交换弧线
              const anchorX = px + (cx - px) * 0.32
              const anchorY = py + (cy - py) * 0.32
              return (
                <g key={`${id}-${side}`}>
                  <line
                    x1={px}
                    y1={py}
                    x2={cx}
                    y2={cy}
                    stroke={stroke}
                    strokeWidth={active ? 3 : 2}
                  />
                  <text
                    x={anchorX}
                    y={anchorY + 4}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="700"
                    className="font-code"
                    fill={active ? TONE.amber : isDone(id) && isDone(childId) ? TONE.easy : 'hsl(var(--ink-soft))'}
                  >
                    {side === 'left' ? 'L' : 'R'}
                  </text>
                </g>
              )
            })}
          </g>
        ))}

        {/* 2. 本次交换：两个被交换的子树之间画虚线双向箭头 */}
        {step.phase === 'swap' && cur && cur.left && cur.right && (
          <g>
            <path
              d={`M ${x(cur.left.id) + NODE_R} ${y(cur.left.id) - 8} Q ${(x(cur.left.id) + x(cur.right.id)) / 2} ${
                y(cur.left.id) - 34
              } ${x(cur.right.id) - NODE_R} ${y(cur.right.id) - 8}`}
              fill="none"
              stroke={TONE.medium}
              strokeWidth={2.5}
              strokeDasharray="6 4"
              markerEnd="url(#t70-swap-a)"
              markerStart="url(#t70-swap-b)"
            />
            <text
              x={(x(cur.left.id) + x(cur.right.id)) / 2}
              y={y(cur.left.id) - 46}
              textAnchor="middle"
              fontSize="12"
              fontWeight="700"
              className="font-code"
              fill={TONE.medium}
            >
              交换
            </text>
          </g>
        )}

        {/* 3. 节点圆：当前节点琥珀、已完成交换的节点 easy 绿、未处理灰 */}
        {ORDER.map((id) => {
          const doneNode = isDone(id)
          const active = curId === id
          const fill = active
            ? 'hsl(var(--amber-soft))'
            : doneNode
              ? 'hsl(var(--easy-soft))'
              : TONE.muted
          const stroke = active ? TONE.amber : doneNode ? TONE.easy : 'hsl(var(--border))'
          const valueFill = active ? TONE.amber : doneNode ? TONE.easy : 'hsl(var(--ink-soft))'
          return (
            <g key={`node-${id}`}>
              <circle
                cx={x(id)}
                cy={y(id)}
                r={NODE_R}
                fill={fill}
                stroke={stroke}
                strokeWidth={active ? 3 : 2.5}
              />
              <text
                x={x(id)}
                y={y(id) + 6}
                textAnchor="middle"
                fontSize="17"
                fontWeight="700"
                className="font-code"
                fill={valueFill}
              >
                {NODES[id].val}
              </text>
              {active && (
                <text
                  x={x(id) - NODE_R - 6}
                  y={y(id) + 4}
                  textAnchor="end"
                  fontSize="11"
                  fontWeight="700"
                  className="font-code"
                  fill={TONE.amber}
                >
                  当前
                </text>
              )}
              {doneNode && !active && (
                <text
                  x={x(id) + NODE_R + 6}
                  y={y(id) + 4}
                  textAnchor="start"
                  fontSize="11"
                  fontWeight="600"
                  className="font-code"
                  fill={TONE.easy}
                >
                  已交换
                </text>
              )}
            </g>
          )
        })}

        {/* 4. 输出行：当前树的层序（按队列顺序输出，null 不占舞台位置） */}
        <text
          x={W / 2}
          y={H - 10}
          textAnchor="middle"
          fontSize="12"
          fontWeight="600"
          className="font-code"
          fill={step.phase === 'done' ? TONE.easy : 'hsl(var(--ink-soft))'}
        >
          {`层序结果 [${prefix.join(', ')}]`}
        </text>
      </svg>

      {/* 交换记录：文字标签，不靠颜色也能读出每步做了什么 */}
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[11px]">
        <span className="text-ink-soft">交换记录</span>
        {step.swaps.length === 0 ? (
          <span className="font-code text-ink-soft">（还没有交换）</span>
        ) : (
          step.swaps.map((s, k) => {
            const isLast = k === step.swaps.length - 1
            const active = step.phase === 'swap' && isLast
            return (
              <span
                key={s.id}
                className={
                  active
                    ? 'rounded-md border border-[hsl(var(--medium))]/40 bg-[hsl(var(--medium-soft))] px-2 py-0.5 font-code font-semibold text-[hsl(var(--medium))]'
                    : 'rounded-md border border-[hsl(var(--easy))]/40 bg-[hsl(var(--easy-soft))] px-2 py-0.5 font-code text-[hsl(var(--easy))]'
                }
              >
                {NODES[s.id].val}: {s.fromLeft ?? '空'} ↔ {s.fromRight ?? '空'}
                {active && ' 本次'}
              </span>
            )
          })
        )}
      </div>

      <Badges className="justify-center">
        <Stat label="当前节点" value={cur ? cur.val : '—'} tone="amber" />
        <Stat label="已完成交换的节点" value={`${doneCount} / ${NODE_COUNT}`} tone="easy" />
        {step.phase === 'done' && <Answer>翻转结果 = {ANSWER_TEXT}</Answer>}
        {step.next && <Hint>{step.next}</Hint>}
      </Badges>
    </div>
  )
}

export default function InvertBinaryTreeDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="前序递归：交换左右孩子再翻转两棵子树"
      info={`示例取自题解示例 1：root = ${INPUT_TEXT}（层序数组，null 为空节点），输出 ${ANSWER_TEXT}，共 ${steps.length} 步；示例 2/3（[2,1,3]、空树）规模更小，不再演示。图上 L / R 表示该孩子当前位于父节点的左侧还是右侧，交换后这两个标签随之互换。`}
      steps={steps}
      autoMs={1500}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '当前处理节点（旁边标「当前」）' },
        { color: TONE.medium, label: '本步交换的左右孩子（虚线双向箭头）' },
        { color: TONE.easy, label: '左右孩子已交换好的节点与连线' },
        { color: TONE.muted, label: '尚未处理' },
      ]}
    />
  )
}
