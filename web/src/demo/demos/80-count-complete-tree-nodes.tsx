import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badges, Hint, Stat, TONE } from './stage'

/* ------------------------------------------------------------------ */
/* 80. 完全二叉树的节点个数 —— 模式 E：完全二叉树 + 满子树整块计数        */
/* ------------------------------------------------------------------ */

/** 题解示例 1：root = [1,2,3,4,5,6]（层序表示，null 为空节点），输出 6 */
const LEVELS: (number | null)[] = [1, 2, 3, 4, 5, 6]
const INPUT_TEXT = `[${LEVELS.map((v) => (v === null ? 'null' : v)).join(', ')}]`

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

const NODE_COUNT = ORDER.length

/** 一棵子树的全部节点 id（用于标出「整块计入」覆盖了哪些节点） */
function subtreeIds(node: TreeNode): string[] {
  return [
    node.id,
    ...(node.left ? subtreeIds(node.left) : []),
    ...(node.right ? subtreeIds(node.right) : []),
  ]
}

/** 一次公式命中：满的那一侧子树 + 当前根，合计 2^h 个节点 */
interface Block {
  side: 'left' | 'right'
  h: number
  count: number
}

interface Step {
  phase: 'init' | 'enter' | 'measure-left' | 'measure-right' | 'block' | 'return' | 'done'
  /** 本步正在处理的子树根 id（done 为 null） */
  cur: string | null
  /** 左子树最左路径长度（节点数）；未测量为 null */
  leftH: number | null
  /** 右子树最左路径长度（节点数）；未测量为 null */
  rightH: number | null
  lhPath: string[]
  rhPath: string[]
  /** 已整块计入的节点 id（不可变快照） */
  counted: string[]
  block: Block | null
  /** return 步：另一侧递归返回的节点数 */
  rest: number | null
  /** return / done 步：本子树（或整棵树）的节点数 */
  result: number | null
  /** 已确定的节点数累计 */
  total: number
  note: string
  /** 下一步动作（由后一个快照统一回填，供 Hint 使用） */
  next: string
}

function buildSteps(): Step[] {
  const steps: Step[] = []
  const counted: string[] = []
  const blocks: Block[] = []
  let total = 0

  const push = (
    phase: Step['phase'],
    cur: string | null,
    note: string,
    extra: Partial<Step> = {}
  ) => {
    const step: Step = {
      phase,
      cur,
      leftH: null,
      rightH: null,
      lhPath: [],
      rhPath: [],
      counted: counted.slice(),
      block: null,
      rest: null,
      result: null,
      total,
      note,
      next: '',
      ...extra,
    }
    steps.push(step)
  }

  push(
    'init',
    null,
    `观察：完全二叉树 root = ${INPUT_TEXT}（层序表示，null 为空节点）共 ${NODE_COUNT} 个节点：根 1 的孩子是 2 和 3，2 的孩子是 4 和 5，3 只有左孩子 6。判断：满二叉树的节点数是 2^h - 1，而完全二叉树的左右子树中至少有一棵是满的，满的那棵可以一次算出，只有不满的一侧才需要继续递归。动作：从根 1 开始，每进入一个子树先量左子树最左路径长度 leftH 与右子树最左路径长度 rightH，再按两者是否相等选分支。为什么：节点从左往右填，完全二叉树里 rightH 只能是 leftH 或 leftH - 1，这两个数就足以判断哪一侧是满的。`
  )

  function count(id: string | null): number {
    if (id === null) return 0
    const node = NODES[id]
    const val = node.val
    const lChild = node.left
    const rChild = node.right

    const kids =
      lChild && rChild
        ? `左孩子是 ${lChild.val}、右孩子是 ${rChild.val}`
        : lChild
          ? `左孩子是 ${lChild.val}，右孩子为空节点`
          : rChild
            ? `左孩子为空节点，右孩子是 ${rChild.val}`
            : '左右孩子都是空节点'

    push(
      'enter',
      id,
      `观察：递归进入以 ${val} 为根的子树，它的${kids}。判断：两个高度都还没量，无法判断哪一侧是满二叉树，不能直接用公式。动作：先量 leftH——从${lChild ? `左孩子 ${lChild.val} 出发` : '空的左孩子出发（长度为 0）'}，沿左链一路向左走到底数节点。为什么：这条最左路径的长度就等于左子树的高度，两次测量都只沿左链，口径一致才能比较。`
    )

    const lhPath: string[] = []
    for (let n: TreeNode | null = lChild; n; n = n.left) lhPath.push(n.id)
    const lh = lhPath.length
    const lhText =
      lh === 0 ? '左孩子为空节点，这条路径是空的' : `路径是 ${lhPath.map((x) => VAL_OF[x]).join(' → ')}`

    push(
      'measure-left',
      id,
      `观察：${lhText}，所以 leftH = ${lh}，它就是左子树的高度。判断：右子树的高度还没量，此刻还不知道哪一侧是满的。动作：接着从${rChild ? `右孩子 ${rChild.val} 出发` : '空的右孩子出发'}，用同样的口径量 rightH。为什么：只有 leftH 与 rightH 都到手，才能判断出满的那一侧。`,
      { leftH: lh, lhPath }
    )

    const rhPath: string[] = []
    for (let n: TreeNode | null = rChild; n; n = n.left) rhPath.push(n.id)
    const rh = rhPath.length
    const equal = lh === rh
    const rhText =
      rh === 0 ? '右孩子为空节点，这条路径是空的' : `路径是 ${rhPath.map((x) => VAL_OF[x]).join(' → ')}`

    push(
      'measure-right',
      id,
      `观察：${rhText}，所以 rightH = ${rh}，与 leftH = ${lh} 相比${equal ? '两者相等' : `相差 ${lh - rh}`}。判断：${equal ? `相等说明左子树是高度 ${lh} 的满二叉树` : `rightH 比 leftH 小 1，说明右子树是高度 ${rh} 的满二叉树`}。动作：对满的那一侧套公式 2^h - 1 整块计数，另一侧继续递归。为什么：完全二叉树里 rightH 只能是 leftH 或 leftH - 1，没有第三种情况。`,
      { leftH: lh, rightH: rh, lhPath, rhPath }
    )

    const leftFull = equal
    const h = leftFull ? lh : rh
    const blockCount = 1 << h
    const fullChild = leftFull ? lChild : rChild
    for (const x of [id, ...(fullChild ? subtreeIds(fullChild) : [])]) {
      if (!counted.includes(x)) counted.push(x)
    }
    const block: Block = { side: leftFull ? 'left' : 'right', h, count: blockCount }
    blocks.push(block)
    total += blockCount

    push(
      'block',
      id,
      `观察：leftH = ${lh}、rightH = ${rh}，${equal ? '两者相等' : `rightH 比 leftH 小 1`}。判断：${leftFull ? '左' : '右'}子树是高度 ${h} 的满二叉树，可以整块算。动作：它的 2^${h} - 1 = ${blockCount - 1} 个节点加上根 ${val}，共 2^${h} = ${blockCount} 个节点一次性计入，累计已确定 ${total} 个；接下来只对${leftFull ? '右' : '左'}子树继续递归。为什么：这是本题快于 O(n) 遍历的关键——满的那一侧不再逐个访问。`,
      { leftH: lh, rightH: rh, block }
    )

    const recLeft = !leftFull
    const recChild = recLeft ? lChild : rChild
    const rest = count(recChild ? recChild.id : null)
    const res = blockCount + rest
    const parentId = id === ROOT_ID ? null : id.slice(0, -1)

    push(
      'return',
      id,
      `观察：${recChild ? `${recLeft ? '左' : '右'}子树递归返回 ${rest}` : `${recLeft ? '左' : '右'}子树是空节点，递归出口返回 0`}，整块部分已计入 ${blockCount}。判断：以 ${val} 为根的子树节点数 = ${blockCount} + ${rest} = ${res}。动作：${parentId ? `把 ${res} 返回给父节点 ${VAL_OF[parentId]}` : `这是根节点的返回值，整棵树共 ${res} 个节点`}。为什么：整块覆盖的节点与递归的那棵子树互不重叠，合起来正好是整个子树。`,
      { leftH: lh, rightH: rh, block, rest, result: res }
    )
    return res
  }

  const answer = count(ROOT_ID)

  push(
    'done',
    null,
    `观察：递归结束，${blocks.length} 次整块计数分别是 ${blocks.map((b) => b.count).join(' + ')}，合计 ${answer}，与题解示例 1 的输出一致。判断：每次只递归一侧、另一侧用 2^h - 1 一次算出，所有节点被不重不漏地覆盖。动作：答案就是这些整块之和，本例 = ${answer}。为什么：求高度只沿左链走、代价 O(log n)，递归深度 O(log n)，时间 O((log n)^2)、空间 O(log n)，都远好于逐个遍历的 O(n)。`,
    { result: answer }
  )

  // 「下一步动作」由后一个快照推导，保证与步骤数据完全一致
  steps.forEach((s, i) => {
    const b = steps[i + 1]
    if (!b) return
    if (b.phase === 'enter' && b.cur) {
      s.next = `递归进入以 ${VAL_OF[b.cur]} 为根的子树，先量 leftH`
    } else if (b.phase === 'measure-left' && b.cur) {
      s.next = `量 leftH：从 ${VAL_OF[b.cur]} 的左孩子沿左链走到底`
    } else if (b.phase === 'measure-right' && b.cur) {
      s.next = `量 rightH：从 ${VAL_OF[b.cur]} 的右孩子沿左链走到底，再与 leftH 比较`
    } else if (b.phase === 'block' && b.block) {
      const side = b.block.side === 'left' ? '左' : '右'
      s.next = `leftH ${b.leftH === b.rightH ? '==' : '≠'} rightH → ${side}子树满，整块 2^${b.block.h} = ${b.block.count} 个节点计入`
    } else if (b.phase === 'return' && b.result !== null && b.cur) {
      const parentId = b.cur === ROOT_ID ? null : b.cur.slice(0, -1)
      s.next = parentId
        ? `返回 ${b.result} 给父节点 ${VAL_OF[parentId]}`
        : `返回 ${b.result}，这是根节点的返回值`
    } else if (b.phase === 'done') {
      s.next = '统计结束，输出总节点数'
    }
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

const W = 680
const H = 252
const PAD_L = 66
const PAD_R = 66
const NODE_R = 22
const TOP = 50
const LEVEL_GAP = 78
const SLOT = (W - PAD_L - PAD_R) / NODE_COUNT

/** 节点底色只有三种：未处理 / 正在测量 / 已整块计入；当前子树根用琥珀圆环单独标注 */
type NodeState = 'path' | 'counted' | 'idle'

const FILL: Record<NodeState, string> = {
  path: 'hsl(var(--teal-soft))',
  counted: 'hsl(var(--easy-soft))',
  idle: TONE.muted,
}

const STROKE: Record<NodeState, string> = {
  path: 'hsl(var(--teal))',
  counted: 'hsl(var(--easy))',
  idle: 'hsl(var(--border))',
}

const STROKE_W: Record<NodeState, number> = { path: 2.5, counted: 2.5, idle: 2 }

const VAL_FILL: Record<NodeState, string> = {
  path: 'hsl(var(--teal))',
  counted: 'hsl(var(--easy))',
  idle: 'hsl(var(--ink-soft))',
}

function Stage(step: Step) {
  const x = (id: string) => PAD_L + SLOT * (ORDER.indexOf(id) + 0.5)
  const y = (id: string) => TOP + DEPTH_OF[id] * LEVEL_GAP

  /** 节点底色只表达「已计入 / 测量中 / 未处理」；当前子树根另有琥珀圆环 + 文字 */
  const fillState = (id: string): NodeState => {
    if (step.counted.includes(id)) return 'counted'
    if (step.lhPath.includes(id) || step.rhPath.includes(id)) return 'path'
    return 'idle'
  }

  const edgeOf = (id: string): string =>
    step.cur === id ? TONE.amber : STROKE[fillState(id)]

  const curId = step.cur
  const curVal = curId ? VAL_OF[curId] : null
  const equal = step.leftH !== null && step.rightH !== null && step.leftH === step.rightH
  const code = (v: string | number) => <b className="font-code font-semibold">{v}</b>

  const caption = (() => {
    switch (step.phase) {
      case 'init':
        return <>判定依据：满二叉树节点数 = {code('2^h - 1')}，完全二叉树的两棵子树中必有一棵是满的</>
      case 'enter':
        return <>进入子树 {code(curVal ?? '')}：先量 leftH，再量 rightH</>
      case 'measure-left':
        return (
          <>
            leftH = {code(step.leftH ?? 0)}（从 {code(curVal ?? '')} 的左孩子沿左链走到底）
          </>
        )
      case 'measure-right':
        return (
          <>
            rightH = {code(step.rightH ?? 0)}，与 leftH = {code(step.leftH ?? 0)}{' '}
            {equal ? '相等' : '不等'}
          </>
        )
      case 'block':
        return step.block ? (
          <>
            {equal ? (
              <>leftH == rightH</>
            ) : (
              <>
                leftH {code(step.leftH ?? 0)} ≠ rightH {code(step.rightH ?? 0)}
              </>
            )}{' '}
            → {step.block.side === 'left' ? '左' : '右'}子树满：整块 {code(`2^${step.block.h}`)} ={' '}
            {code(step.block.count)} 个节点计入
          </>
        ) : null
      case 'return':
        return (
          <>
            子树 {code(curVal ?? '')} 返回 {code(step.result ?? 0)}（整块{' '}
            {code(step.block ? step.block.count : 0)} + 递归 {code(step.rest ?? 0)}）
          </>
        )
      case 'done':
        return <>全部整块相加 = {code(step.result ?? 0)} 个节点</>
    }
  })()

  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full select-none">
        {/* 1. 边：直线连接父子，后画的节点圆盖住端点 */}
        {ORDER.map((id) =>
          [NODES[id].left, NODES[id].right]
            .filter((c): c is TreeNode => c !== null)
            .map((child) => {
              const isCur = step.cur === child.id
              return (
                <line
                  key={`${id}-${child.id}`}
                  x1={x(id)}
                  y1={y(id)}
                  x2={x(child.id)}
                  y2={y(child.id)}
                  stroke={edgeOf(child.id)}
                  strokeWidth={isCur ? 2.5 : 2}
                />
              )
            })
        )}

        {/* 2. 节点圆；当前子树根额外套一圈琥珀圆环 */}
        {ORDER.map((id) => {
          const st = fillState(id)
          const isCur = step.cur === id
          return (
            <g key={id}>
              {isCur && (
                <circle
                  cx={x(id)}
                  cy={y(id)}
                  r={NODE_R + 6}
                  fill="none"
                  stroke={TONE.amber}
                  strokeWidth={2.5}
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
                fill={VAL_FILL[st]}
              >
                {VAL_OF[id]}
              </text>
            </g>
          )
        })}

        {/* 3. 文字标注：状态的字母/文字标签，不靠颜色区分 */}
        {ORDER.map((id) => {
          const st = fillState(id)
          const isCur = step.cur === id
          return (
            <g key={`label-${id}`}>
              {st === 'path' && (
                <text
                  x={x(id)}
                  y={y(id) - NODE_R - 9}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="700"
                  className="font-code"
                  fill={TONE.teal}
                >
                  {step.lhPath.includes(id) ? 'leftH' : 'rightH'}
                </text>
              )}
              {st === 'counted' && (
                <text
                  x={x(id)}
                  y={y(id) + NODE_R + 14}
                  textAnchor="middle"
                  fontSize="10.5"
                  fontWeight="700"
                  className="font-code"
                  fill={TONE.easy}
                >
                  已计入
                </text>
              )}
              {isCur && (
                <text
                  x={x(id) + NODE_R + 12}
                  y={y(id) + 4}
                  textAnchor="start"
                  fontSize="11"
                  fontWeight="700"
                  className="font-code"
                  fill={TONE.amber}
                >
                  当前
                </text>
              )}
            </g>
          )
        })}
      </svg>

      {/* 本步判定读出的两个高度与命中的分支 */}
      <p className="max-w-full text-center text-[11px] leading-relaxed text-ink-soft">{caption}</p>

      <Badges className="justify-center">
        <Stat label="leftH" value={step.leftH === null ? '—' : step.leftH} tone="teal" />
        <Stat label="rightH" value={step.rightH === null ? '—' : step.rightH} tone="teal" />
        <Stat label="已确定节点数" value={step.total} tone="easy" />
        {step.phase === 'done' ? (
          <Answer>
            节点总数 = <b className="font-code">{step.result}</b>
          </Answer>
        ) : (
          step.next && <Hint tone="amber">{step.next}</Hint>
        )}
      </Badges>
    </div>
  )
}

export default function CountCompleteTreeNodesDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="完全二叉树：满子树整块计数"
      info={`root = ${INPUT_TEXT}（题解示例 1，层序表示，null 为空节点，输出 6）。下面走完整的 O((log n)^2) 方法：每进入一个子树先量 leftH 与 rightH，相等则左子树是满二叉树、用 2^h - 1 整块算，否则右子树满，另一侧继续递归；共 ${steps.length} 步。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '当前子树根（琥珀圆环 +「当前」标注）' },
        { color: TONE.teal, label: '正在测量的最左路径（标注 leftH / rightH）' },
        { color: TONE.easy, label: '命中公式、已整块计入的节点（标注「已计入」）' },
        { color: TONE.muted, label: '尚未处理的节点' },
      ]}
    />
  )
}
