import { Fragment, useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badges, Hint, Link, Node, Stat, TONE } from './stage'

/* ------------------------------------------------------------------ */
/* 75. 二叉树展开为链表 —— 模式 E：SVG 树 + 原地把 right 改写成先序右链    */
/* ------------------------------------------------------------------ */

/** 题解示例 1 的层序数组（null 为空节点），先序序列为 1 → 2 → 3 → 4 → 5 → 6 */
const LEVELS: (number | null)[] = [1, 2, 5, 3, 4, null, 6]
const INPUT_TEXT = `[${LEVELS.map((v) => (v === null ? 'null' : v)).join(',')}]`

interface TreeNode {
  id: string
  val: number
  left: TreeNode | null
  right: TreeNode | null
}

function buildTree(level: (number | null)[], i: number): TreeNode | null {
  if (i >= level.length) return null
  const val = level[i]
  if (val === null) return null
  return {
    id: `i${i}`,
    val,
    left: buildTree(level, 2 * i + 1),
    right: buildTree(level, 2 * i + 2),
  }
}

const ROOT = buildTree(LEVELS, 0) as TreeNode
const ROOT_ID = ROOT.id

/** 静态布局数据：中序槽位决定 x、层深决定 y，整场演示位置固定不再变化 */
const NODES: Record<string, TreeNode> = {}
const VAL: Record<string, number> = {}
const SLOT: Record<string, number> = {}
const DEPTH: Record<string, number> = {}
const INORDER: string[] = []
const PRE: string[] = []

function walkIn(node: TreeNode | null, depth: number) {
  if (!node) return
  NODES[node.id] = node
  VAL[node.id] = node.val
  DEPTH[node.id] = depth
  walkIn(node.left, depth + 1)
  SLOT[node.id] = INORDER.length
  INORDER.push(node.id)
  walkIn(node.right, depth + 1)
}
walkIn(ROOT, 0)

function walkPre(node: TreeNode | null) {
  if (!node) return
  PRE.push(node.id)
  walkPre(node.left)
  walkPre(node.right)
}
walkPre(ROOT)

/** 先序后继：本题里就是「定稿后的右链」上的下一个节点 */
const NEXT: Record<string, string | null> = {}
PRE.forEach((id, k) => {
  NEXT[id] = k + 1 < PRE.length ? PRE[k + 1] : null
})
const N = PRE.length
const PRE_TEXT = PRE.map((id) => VAL[id]).join(' → ')

const valOf = (id: string | null): string => (id === null ? '—' : String(VAL[id]))

/** 从 start 沿 right 读出的链（快照 map 传入，避免读到渲染期的可变状态） */
function chainFrom(start: string | null, right: Record<string, string | null>): string[] {
  const out: string[] = []
  let id = start
  for (let k = 0; id !== null && k <= N; k++) {
    out.push(id)
    id = right[id]
  }
  return out
}
const chainOf = (right: Record<string, string | null>) => chainFrom(ROOT_ID, right)
const chainText = (ids: string[]) => ids.map((id) => VAL[id]).join(' → ')

/** 某棵子树的先序序列（原树，用于说明「左子树先序的末节点」） */
function subtreePre(id: string): string {
  const out: number[] = []
  const dfs = (node: TreeNode | null) => {
    if (!node) return
    out.push(node.val)
    dfs(node.left)
    dfs(node.right)
  }
  dfs(NODES[id])
  return out.join(' → ')
}

type Phase = 'init' | 'find' | 'attach' | 'rotate' | 'skip' | 'done'

interface Step {
  phase: Phase
  /** 当前节点；done 步为 null */
  cur: string | null
  /** 左子树最右节点（前驱）；无左子树或 done 步为 null */
  pred: string | null
  /** 当前 left / right 指针快照（不可变） */
  left: Record<string, string | null>
  right: Record<string, string | null>
  /** 已定稿的节点（先序前缀，含本步刚处理完的 cur） */
  fixed: string[]
  /** right 指针被算法改写过的节点 */
  rewired: string[]
  /** 本步刚被改写的 right 边起点 */
  just: string[]
  /** rotate 步：cur.right 被改写成谁 */
  toRight: string | null
  /** attach 步：挂到前驱 right 上的原右子树根（null = 空子树） */
  toPred: string | null
  note: string
  /** 下一步动作（由后一个快照回填，供 Hint 使用） */
  next: string
}

function buildSteps(): Step[] {
  const steps: Step[] = []
  const left: Record<string, string | null> = {}
  const right: Record<string, string | null> = {}
  INORDER.forEach((id) => {
    const node = NODES[id]
    left[id] = node.left === null ? null : node.left.id
    right[id] = node.right === null ? null : node.right.id
  })
  const fixed: string[] = []
  const rewired: string[] = []

  const snap = (
    phase: Phase,
    cur: string | null,
    pred: string | null,
    note: string,
    extra: Partial<Step> = {}
  ): Step => ({
    phase,
    cur,
    pred,
    left: { ...left },
    right: { ...right },
    fixed: fixed.slice(),
    rewired: rewired.slice(),
    just: [],
    toRight: null,
    toPred: null,
    note,
    next: '',
    ...extra,
  })

  steps.push(
    snap(
      'init',
      ROOT_ID,
      null,
      `观察：root = ${INPUT_TEXT}，先序序列应该是 ${PRE_TEXT}；此刻沿 right 从根读出的是 ${chainText(chainOf(right))}，还不是先序。判断：原地展开只需 cur 和 predecessor 两个指针，遇到非空左子树就先把左子树的最右节点找出来当前驱。动作：cur 指向根 ${VAL[ROOT_ID]}，所有 left / right 都还是原样。为什么：必须先让原右子树挂到前驱之后，再改写 cur.right，顺序反了就永久丢失原右子树。`
    )
  )

  let cur: string | null = ROOT_ID
  while (cur !== null) {
    const id: string = cur
    const leftChild: string | null = left[id]
    if (leftChild !== null) {
      // 1. 找左子树最右节点（先序前驱）
      let pred = leftChild
      let probe = right[pred]
      while (probe !== null) {
        pred = probe
        probe = right[pred]
      }
      const oldRight = right[id]
      const oldRightChain = oldRight === null ? '空' : chainText(chainFrom(oldRight, right))

      steps.push(
        snap(
          'find',
          id,
          pred,
          `观察：cur = ${VAL[id]} 的左孩子是 ${VAL[leftChild]}，right 此刻还指向 ${valOf(oldRight)}。判断：改写后 ${VAL[id]} 的 right 要指向先序后继 ${VAL[leftChild]}，而原右子树得先接到左子树先序的末节点后面。动作：从 ${VAL[leftChild]} 出发沿 right 一路走到底，停在最右节点 ${VAL[pred]}，它就是前驱 predecessor。为什么：左子树的先序是 ${subtreePre(leftChild)}，${VAL[pred]} 正是其中最后一个节点。`
        )
      )

      // 2. 原右子树整串挂到前驱的 right 上
      right[pred] = oldRight
      rewired.push(pred)
      steps.push(
        snap(
          'attach',
          id,
          pred,
          `观察：前驱 ${VAL[pred]} 的 right 本来是空，cur = ${VAL[id]} 的原右子树是 ${oldRightChain}。判断：先序里原右子树整体排在整棵左子树之后，所以它要接在左子树末节点 ${VAL[pred]} 后面。动作：predecessor.right = cur.right，即 ${VAL[pred]}.right ← ${valOf(oldRight)}。为什么：这一步必须先于 cur.right = cur.left，否则 cur.right 被覆盖，原右子树就找不回来了。`,
          { just: [pred], toPred: oldRight }
        )
      )

      // 3. 左子树搬到右边，并清空左指针
      right[id] = leftChild
      left[id] = null
      rewired.push(id)
      fixed.push(id)
      steps.push(
        snap(
          'rotate',
          id,
          pred,
          `观察：原右子树已经挂在 ${VAL[pred]} 之后，cur = ${VAL[id]} 的 right 还指向 ${valOf(oldRight)}、left 指向 ${VAL[leftChild]}。判断：把左子树整体搬到右边，${VAL[id]} 的新 right 就是先序后继 ${VAL[leftChild]}。动作：cur.right = cur.left、cur.left = null，得到 ${VAL[id]}.right ← ${VAL[leftChild]} 且 ${VAL[id]}.left ← null，此刻沿 right 从根读出 ${chainText(chainOf(right))}。为什么：题目要求最终所有 left 都是 null，搬家和清空必须在同一步做完。`,
          { just: [id], toRight: leftChild }
        )
      )
    } else {
      const r = right[id]
      fixed.push(id)
      steps.push(
        snap(
          'skip',
          id,
          null,
          r === null
            ? `观察：cur 沿 right 前进到 ${VAL[id]}，它的 left 是 null，right 也是 null——它是这条链的尾节点。判断：没有左子树，也没有后继需要改写。动作：${VAL[id]} 定稿，cur = cur.right = null，循环结束。为什么：循环的终止条件正是 cur 变成 null，此时 ${N} 个节点全部处理完毕。`
            : `观察：cur 沿 right 前进到 ${VAL[id]}，它的 left 是 null、right 指向 ${VAL[r]}。判断：${VAL[id]} 已满足「左指针为空」${rewired.includes(id) ? '，它的 right 是前面改写挂上来的' : ''}，而 right 指向的正是先序后继 ${VAL[r]}。动作：不改写任何指针，${VAL[id]} 定稿，cur 继续沿 right 前进。为什么：没有左子树就没有要搬的部分，右指针的顺序本来就是对的。`
        )
      )
    }
    cur = right[id]
  }

  steps.push(
    snap(
      'done',
      null,
      null,
      `观察：cur 已经是 null，展开结束，沿 right 从根读出 ${chainText(chainOf(right))}。判断：它与先序序列 ${PRE_TEXT} 完全一致，并且每个节点的 left 都是 null。动作：答案就是这条右链，函数原地修改、不返回新根。为什么：每个节点只被处理一次，找前驱时走过的右指针边总共也只被走过一次，时间 O(n)；全程只用了 cur 和 predecessor 两个指针，额外空间 O(1)。`
    )
  )

  // 「下一步动作」由后一个快照回填，保证与步骤数据完全一致
  steps.forEach((s, i) => {
    const n = steps[i + 1]
    if (!n) return
    if (n.phase === 'done') {
      s.next = '所有节点的 left 都已清空、右链就是先序序列，输出结论'
      return
    }
    const nid = n.cur
    if (nid === null) return
    if (n.phase === 'find') {
      const fromChild = n.left[nid]
      s.next =
        s.cur === nid
          ? `从 ${VAL[nid]} 的左孩子 ${valOf(fromChild)} 出发，沿 right 一路向右找前驱`
          : `cur 沿 right 前进到 ${VAL[nid]}，再从它的左孩子 ${valOf(fromChild)} 出发找前驱`
    } else if (n.phase === 'attach') {
      s.next = `把 ${VAL[nid]} 的原右子树（${n.toPred === null ? '空' : `根 ${VAL[n.toPred]}`}）挂到前驱 ${valOf(n.pred)} 的 right 上`
    } else if (n.phase === 'rotate') {
      s.next = `${VAL[nid]}：cur.right = 左子树根 ${valOf(n.toRight)}，并把 cur.left 置空`
    } else if (n.phase === 'skip') {
      s.next = `cur = ${VAL[nid]} 没有左子树，直接沿 right 前进`
    }
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

const W = 680
const H = 272
const PAD_X = 66
const SLOT_W = (W - PAD_X * 2) / N
const TOP = 54
const LEVEL_GAP = 78
const R = 22

const X = (id: string) => PAD_X + SLOT_W * (SLOT[id] + 0.5)
const Y = (id: string) => TOP + DEPTH[id] * LEVEL_GAP

const BORDER = 'hsl(var(--border))'
const PAPER = 'hsl(var(--paper))'
const TEAL_SOFT = 'hsl(var(--teal-soft))'
const EASY_SOFT = 'hsl(var(--easy-soft))'
const INK_SOFT = 'hsl(var(--ink-soft))'

type NodeState = 'cur' | 'pred' | 'fixed' | 'idle'

const NODE_FILL: Record<NodeState, string> = {
  cur: PAPER,
  pred: TEAL_SOFT,
  fixed: EASY_SOFT,
  idle: TONE.muted,
}
const NODE_STROKE: Record<NodeState, string> = {
  cur: TONE.amber,
  pred: TONE.teal,
  fixed: TONE.easy,
  idle: BORDER,
}
const NODE_WIDTH: Record<NodeState, number> = { cur: 3, pred: 3, fixed: 2.5, idle: 2 }
const NODE_TEXT: Record<NodeState, string> = {
  cur: TONE.amber,
  pred: TONE.teal,
  fixed: TONE.easy,
  idle: INK_SOFT,
}

/** 边：灰 = 尚未改写的原始指针；琥珀 = 本步或之前改写、还没定稿；绿 = 已定稿的右链边 */
type EdgeTone = 'border' | 'amber' | 'easy'
const EDGE_COLOR: Record<EdgeTone, string> = { border: BORDER, amber: TONE.amber, easy: TONE.easy }
const EDGE_WIDTH: Record<EdgeTone, number> = { border: 2, amber: 3, easy: 3 }
const EDGE_TONES: EdgeTone[] = ['border', 'amber', 'easy']

function Stage(step: Step) {
  const done = step.phase === 'done'
  const pointerId = step.phase === 'attach' ? step.pred : step.cur
  const pointerValue = pointerId === null ? null : step.right[pointerId]

  const stateOf = (id: string): NodeState => {
    if (step.cur === id) return 'cur'
    if (step.pred === id) return 'pred'
    if (step.fixed.includes(id)) return 'fixed'
    return 'idle'
  }

  const isFinalEdge = (u: string) => step.fixed.includes(u) && NEXT[u] !== null && NEXT[u] === step.right[u]
  const toneOf = (u: string, side: 'L' | 'R'): EdgeTone => {
    if (side === 'L') return 'border'
    if (step.just.includes(u)) return 'amber'
    if (isFinalEdge(u)) return 'easy'
    if (step.rewired.includes(u)) return 'amber'
    return 'border'
  }

  const chain = chainOf(step.right)

  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full select-none">
        <defs>
          {EDGE_TONES.map((t) => (
            <marker
              key={t}
              id={`t75-arrow-${t}`}
              markerUnits="userSpaceOnUse"
              markerWidth="9"
              markerHeight="9"
              refX="8.5"
              refY="4.5"
              orient="auto"
            >
              <path d="M 0 0.5 L 8.5 4.5 L 0 8.5 z" fill={EDGE_COLOR[t]} />
            </marker>
          ))}
        </defs>

        {/* 1. 边：按当前 left / right 指针实时重画，箭头指向孩子，边上标出指针名 L / R */}
        {INORDER.map((u) => {
          const outs: { v: string; side: 'L' | 'R' }[] = []
          const l = step.left[u]
          const r = step.right[u]
          if (l !== null) outs.push({ v: l, side: 'L' })
          if (r !== null) outs.push({ v: r, side: 'R' })
          return outs.map(({ v, side }) => {
            const tone = toneOf(u, side)
            const dx = X(v) - X(u)
            const dy = Y(v) - Y(u)
            const len = Math.sqrt(dx * dx + dy * dy) || 1
            const ux = dx / len
            const uy = dy / len
            return (
              <g key={`${u}${side}`}>
                <line
                  x1={X(u) + ux * (R + 1)}
                  y1={Y(u) + uy * (R + 1)}
                  x2={X(v) - ux * (R + 9)}
                  y2={Y(v) - uy * (R + 9)}
                  stroke={EDGE_COLOR[tone]}
                  strokeWidth={EDGE_WIDTH[tone]}
                  markerEnd={`url(#t75-arrow-${tone})`}
                />
                <text
                  x={(X(u) + X(v)) / 2 + uy * 9}
                  y={(Y(u) + Y(v)) / 2 - ux * 9 + 3.5}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="700"
                  className="font-code"
                  fill={EDGE_COLOR[tone]}
                >
                  {side}
                </text>
              </g>
            )
          })
        })}

        {/* 2. 节点圆 */}
        {INORDER.map((id) => {
          const st = stateOf(id)
          return (
            <g key={id} className="demo-water">
              <circle
                cx={X(id)}
                cy={Y(id)}
                r={R}
                fill={NODE_FILL[st]}
                stroke={NODE_STROKE[st]}
                strokeWidth={NODE_WIDTH[st]}
              />
              <text
                x={X(id)}
                y={Y(id) + 6}
                textAnchor="middle"
                fontSize="17"
                fontWeight="700"
                className="font-code"
                fill={NODE_TEXT[st]}
              >
                {VAL[id]}
              </text>
            </g>
          )
        })}

        {/* 3. 文字标签：不靠颜色区分状态 */}
        {INORDER.map((id) => {
          const st = stateOf(id)
          return (
            <g key={`label-${id}`}>
              {st === 'fixed' && (
                <text
                  x={X(id)}
                  y={Y(id) + R + 14}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="700"
                  className="font-code"
                  fill={TONE.easy}
                >
                  #{PRE.indexOf(id) + 1}
                </text>
              )}
              {(st === 'cur' || st === 'pred') && (
                <text
                  x={X(id) + R + 7}
                  y={Y(id) + 4}
                  textAnchor="start"
                  fontSize="11"
                  fontWeight="700"
                  className="font-code"
                  fill={NODE_STROKE[st]}
                >
                  {st === 'cur' ? 'cur' : 'pred'}
                </text>
              )}
            </g>
          )
        })}

        <text
          x={W / 2}
          y={H - 8}
          textAnchor="middle"
          fontSize="11"
          className="font-code"
          fill={INK_SOFT}
        >
          节点位置固定在中序槽位；边按当前 left / right 实时重画，#k 是已定稿节点在右链中的位置
        </text>
      </svg>

      {/* 沿 right 从根读出的当前右链（与树上绿/琥珀的边一致） */}
      <div className="flex w-full flex-col items-center gap-2">
        <span className="text-[11px] text-ink-soft">
          当前右链（从根 <b className="font-code">{VAL[ROOT_ID]}</b> 沿 right 读出）
        </span>
        <div className="flex flex-wrap items-center justify-center gap-y-1">
          {chain.map((id, k) => {
            const prev = k > 0 ? chain[k - 1] : null
            const st = stateOf(id)
            return (
              <Fragment key={id}>
                {prev !== null && (
                  <Link
                    active={
                      step.just.includes(prev) ||
                      (step.rewired.includes(prev) && !isFinalEdge(prev))
                    }
                  />
                )}
                <span className="flex items-center gap-1">
                  <Node
                    state={
                      st === 'cur' ? 'active' : st === 'pred' ? 'teal' : st === 'fixed' ? 'ok' : 'dim'
                    }
                  >
                    {VAL[id]}
                  </Node>
                  {st === 'cur' && (
                    <span className="font-code text-[10px] font-bold text-[hsl(var(--amber))]">
                      cur
                    </span>
                  )}
                </span>
              </Fragment>
            )
          })}
        </div>
      </div>

      <Badges className="justify-center">
        {done ? (
          <>
            <Stat label="已定稿" value={`${N} / ${N}`} tone="easy" />
            <Stat label="右链长度" value={N} tone="easy" />
            <Answer>
              <b className="font-code">{PRE_TEXT}</b>
            </Answer>
          </>
        ) : (
          <>
            <Stat label="cur" value={valOf(step.cur)} tone="amber" />
            <Stat
              label={step.phase === 'attach' ? 'pred.right' : 'cur.right'}
              value={valOf(pointerValue)}
              tone={step.phase === 'attach' || step.phase === 'rotate' ? 'amber' : 'ink'}
            />
            <Stat label="已定稿" value={`${step.fixed.length} / ${N}`} tone="easy" />
            {step.next !== '' && <Hint>{step.next}</Hint>}
          </>
        )}
      </Badges>
    </div>
  )
}

export default function FlattenBinaryTreeToLinkedListDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="原地展开：最右前驱 + 左子树搬到右边"
      info={`root = ${INPUT_TEXT}（题解示例 1 的层序表示，null 为空节点），先序序列是 ${PRE_TEXT}。全程只用这一个示例的 ${N} 个节点，按方法二逐步演示「找前驱 → 挂原右子树 → 左搬右」，共 ${steps.length} 步。`}
      steps={steps}
      autoMs={1500}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '当前 cur / 本步或之前改写的 right 边' },
        { color: TONE.teal, label: '前驱 pred（左子树最右节点）' },
        { color: TONE.easy, label: '已定稿的右链节点与边（#k 为链上位置）' },
        { color: TONE.muted, label: '尚未处理（灰底，cur 还没走到）' },
      ]}
    />
  )
}
