import { useMemo, type ReactNode } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badges, Cell, Hint, Stat, TONE, type CellState } from './stage'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/* 72. 从前序与中序遍历序列构造二叉树 —— 模式 E：树                        */
/* 前序定根（pre[preL]），中序分左右区间（leftSize = rootIdx - inL）      */
/* ------------------------------------------------------------------ */

/** 固定示例输入（题解「示例 1」，输出层序 [3,9,20,null,null,15,7]） */
const PRE: number[] = [3, 9, 20, 15, 7]
const IN: number[] = [9, 3, 15, 20, 7]
const N = PRE.length
const POS = Array.from({ length: N }, (_, i) => i)
/** 哈希表：值 → 中序下标（题解第 1 步） */
const IDX_MAP: Record<number, number> = {}
IN.forEach((v, i) => {
  IDX_MAP[v] = i
})

const ANSWER_LEVELS: (number | null)[] = [3, 9, 20, null, null, 15, 7]
const LEVEL_TEXT = `[${ANSWER_LEVELS.map((v) => (v === null ? 'null' : v)).join(',')}]`

/* ---------------- 构造结果（算法事实的唯一来源） ---------------- */

interface TNode {
  val: number
  id: string
  depth: number
  inIdx: number
  left: string | null
  right: string | null
  /** 创建顺序，决定本步哪些节点已存在 */
  order: number
}

/** 由中序下标 → 节点 id（用于「x 按中序展开」的坐标换算） */
const SLOT: (string | null)[] = Array.from({ length: N }, () => null)
const NODES: Record<string, TNode> = {}
const TREE = (() => {
  let seq = 0
  function build(preL: number, preR: number, inL: number, inR: number): string | null {
    if (preL > preR) return null
    const val = PRE[preL]
    const rootIdx = IDX_MAP[val]
    const leftSize = rootIdx - inL
    const id = `n${val}`
    NODES[id] = {
      val,
      id,
      depth: 0,
      inIdx: rootIdx,
      left: null,
      right: null,
      order: seq++,
    }
    SLOT[rootIdx] = id
    NODES[id].left = build(preL + 1, preL + leftSize, inL, rootIdx - 1)
    NODES[id].right = build(preL + leftSize + 1, preR, rootIdx + 1, inR)
    return id
  }
  const root = build(0, N - 1, 0, N - 1)
  const assign = (id: string | null, depth: number) => {
    if (!id) return
    NODES[id].depth = depth
    assign(NODES[id].left, depth + 1)
    assign(NODES[id].right, depth + 1)
  }
  assign(root, 0)
  return { root, levels: levelOrder(root) }
})()

function levelOrder(root: string | null): (number | null)[] {
  const out: (number | null)[] = []
  let level: (string | null)[] = [root]
  while (level.length) {
    const next: (string | null)[] = []
    level.forEach((id) => {
      out.push(id ? NODES[id].val : null)
      if (id) next.push(NODES[id].left, NODES[id].right)
    })
    level = next
  }
  while (out.length && out[out.length - 1] === null) out.pop()
  return out
}

/* ---------------- 步骤数据 ---------------- */

/** 当前处理的一段子树区间（闭区间），以及该段的根 */
interface Span {
  preL: number
  preR: number
  inL: number
  inR: number
  root: string
  rootIdx: number
  leftSize: number
  /** 这段子树挂在父节点的哪一侧（整棵树的根也写作 'L'） */
  side: 'L' | 'R'
}

interface Step {
  phase: 'init' | 'extractRoot' | 'split' | 'null' | 'done'
  /** 已完成构造的节点 id（不可变快照） */
  built: string[]
  /** 递归调用栈上的节点 id，栈顶在末尾 */
  stack: string[]
  /** 当前处理的子树区间；init / done 为 null */
  cur: Span | null
  /** null 步：这个空孩子挂在哪个节点下（parentVal 为 null 表示没有父节点） */
  nullAt: { parent: string | null; side: 'L' | 'R' } | null
  note: string
  /** 下一步动作（由后一个快照回填，供 Hint 使用） */
  next: string
}

function buildSteps(): Step[] {
  const steps: Step[] = []
  const built: string[] = []
  const stack: string[] = []

  const snap = (
    phase: Step['phase'],
    note: string,
    extra?: {
      cur?: Span | null
      nullAt?: { parent: string | null; side: 'L' | 'R' } | null
    }
  ) => {
    steps.push({
      phase,
      built: built.slice(),
      stack: stack.slice(),
      cur: extra?.cur ?? null,
      nullAt: extra?.nullAt ?? null,
      note,
      next: '',
    })
  }

  snap(
    'init',
    `观察：preorder = [3,9,20,15,7]、inorder = [9,3,15,20,7]，两段长度都是 ${N}，元素互不重复。判断：前序的排布是「根 | 左子树 | 右子树」，中序是「左子树 | 根 | 右子树」，所以 preorder[0] = 3 一定是整棵树的根，而 3 在中序里的位置把剩下 ${N - 1} 个节点切成左右两批。动作：先扫一遍 inorder 建出「值 → 中序下标」的哈希表，再从整段区间 build(0, 4, 0, 4) 开始递归。为什么：有哈希表后每层定位根只要 O(1)，每个节点恰好被构造一次。`
  )

  /**
   * 与题解 Go 代码同构：闭区间 build(preL, preR, inL, inR)。
   * 每次调用产出两条步骤：先取 pre[preL] 当根（extractRoot），再按 leftSize 切分区间（split）；
   * 区间为空时产出递归出口步骤（null）。parent 为 null 表示这是整棵树的根。
   */
  function build(
    preL: number,
    preR: number,
    inL: number,
    inR: number,
    side: 'L' | 'R',
    parent: string | null
  ): string | null {
    const emptyRange = `[${preL}..${preR}]`
    if (preL > preR) {
      const parentVal = parent === null ? 0 : NODES[parent].val
      const pn = parent === null ? null : NODES[parent]
      const sibling = side === 'L' ? pn?.right : pn?.left
      snap(
        'null',
        `观察：这次调用的前序区间是 ${emptyRange}（preL = ${preL} > preR = ${preR}），区间里一个元素都没有。判断：空区间对应一棵不存在的子树，这正是递归出口——闭区间口径必须写成 preL > preR，写成 preL >= preR 会把单节点子树也误判成空。动作：${
          parent === null
            ? '直接返回 null。'
            : `让 ${parentVal} 的${side === 'L' ? '左' : '右'}孩子保持 null，回到父节点这一层继续。`
        }为什么：${
          sibling === null
            ? `${parentVal} 的另一侧也即将是空区间，说明它在两序列中都位于叶子位置，左右孩子都为 null。`
            : `${parentVal} 只有 ${side === 'L' ? '右' : '左'}侧有孩子，这一侧在中序里没有元素可供切分，前序侧也就没有对应元素。`
        }`,
        { nullAt: { parent, side } }
      )
      return null
    }

    const rootVal = PRE[preL]
    const rootIdx = IDX_MAP[rootVal]
    const leftSize = rootIdx - inL
    const id = NODES[`n${rootVal}`].id
    built.push(id)
    stack.push(id)

    snap(
      'extractRoot',
      `观察：当前子树的前序区间是 [${preL}..${preR}]，第一个元素 preorder[${preL}] = ${rootVal}；哈希表查到它在中序里位于 inorder[${rootIdx}]。判断：左子树节点数 leftSize = rootIdx - inL = ${rootIdx} - ${inL} = ${leftSize}，中序被它切成 [${
        leftSize > 0 ? `${inL}..${rootIdx - 1}` : '空'
      }] 和 [${leftSize < inR - rootIdx ? `${rootIdx + 1}..${inR}` : '空'}] 两段。动作：把 ${rootVal} 挂成${
        parent === null ? '整棵树的根' : `${NODES[parent].val} 的${side === 'L' ? '左' : '右'}孩子`
      }。为什么：中序里根左侧的元素只能是左子树、右侧只能是右子树，这是中序遍历的定义。`,
      { cur: { preL, preR, inL, inR, root: id, rootIdx, leftSize, side } }
    )

    snap(
      'split',
      `观察：leftSize = ${leftSize} 表示中序根 ${rootVal} 左侧有 ${leftSize} 个元素。判断：左子树是前序 [${preL + 1}..${preL + leftSize}]、中序 [${inL}..${rootIdx - 1}]，右子树是前序 [${preL + leftSize + 1}..${preR}]、中序 [${rootIdx + 1}..${inR}]，两段的前序长度都等于各自的中序长度。动作：先递归构造左子区间，再构造右子区间。为什么：前序跟在根之后的连续 ${leftSize} 个元素正好对应中序根左侧那批节点，所以右子树的前序必须从 preL + leftSize + 1 开始。`,
      { cur: { preL, preR, inL, inR, root: id, rootIdx, leftSize, side } }
    )

    build(preL + 1, preL + leftSize, inL, rootIdx - 1, 'L', id)
    build(preL + leftSize + 1, preR, rootIdx + 1, inR, 'R', id)
    stack.pop()
    return id
  }

  build(0, N - 1, 0, N - 1, 'L', null)

  snap(
    'done',
    `观察：所有递归分支都已返回，调用栈清空，${N} 个节点全部构造完成。判断：前序第一个元素 3 是根，9 是它的左孩子，20 是右孩子且带着 15 和 7，与题解示例 1 的输出一致。动作：读答案——层序展开为 ${LEVEL_TEXT}（null 表示该位置没有节点）。为什么：每个节点只创建一次、定位根一次 O(1) 哈希查找，时间 O(n)；哈希表 n 项、递归栈最深 O(h)，空间 O(n)。`
  )

  // 「下一步动作」由后一个快照回填，保证与步骤数据完全一致
  steps.forEach((s, i) => {
    const b = steps[i + 1]
    if (!b) return
    if (b.phase === 'done') {
      s.next = '所有区间处理完毕，输出构造结果'
    } else if (b.phase === 'extractRoot' && b.cur) {
      s.next = `取 preorder[${b.cur.preL}] = ${PRE[b.cur.preL]}，到哈希表查它在 inorder 里的位置`
    } else if (b.phase === 'split' && b.cur) {
      s.next = `按 leftSize = ${b.cur.leftSize} 切出左右区间，先递归构造左子树`
    } else if (b.phase === 'null') {
      const at = b.nullAt
      if (!at || at.parent === null) {
        s.next = '继续处理剩下的区间'
      } else {
        s.next =
          at.side === 'L'
            ? `回到 ${NODES[at.parent].val}，接着构造它的右子树`
            : `回到 ${NODES[at.parent].val}，左边已经处理完，这一层可以收尾了`
      }
    }
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

const LABEL_W = 62
const ROW_MAX = 436
const NODE_R = 20
const TOP = 46
const LEVEL_GAP = 74

const NODE_STYLE: Record<
  'fresh' | 'ok' | 'stack',
  { fill: string; stroke: string; text: string; w: number }
> = {
  fresh: {
    fill: 'hsl(var(--amber))',
    stroke: 'hsl(var(--amber))',
    text: 'hsl(var(--card))',
    w: 3,
  },
  ok: { fill: 'hsl(var(--card))', stroke: 'hsl(var(--easy))', text: 'hsl(var(--easy))', w: 2.5 },
  stack: { fill: 'hsl(var(--card))', stroke: 'hsl(var(--teal))', text: 'hsl(var(--teal))', w: 2 },
}

type TreeState = keyof typeof NODE_STYLE

/* ---------------- 上方两行序列 ---------------- */

interface RowMark {
  /** 单元格底色状态 */
  state: CellState
  /** 半透明区间底色（左 / 右子区间） */
  block: 'L' | 'R' | null
  /** 该位置上的指针文字（preL / preR / inL / inR），无指针时显示「·」 */
  flags: string[]
}

interface RowSpec {
  label: string
  caption: string
  values: number[]
  marks: RowMark[]
}

function SequenceRow({ label, caption, values, marks }: RowSpec) {
  return (
    <div className="flex w-full flex-col gap-1">
      <div className="flex items-baseline gap-2">
        <span className="font-code text-[11px] font-bold text-ink">{label}</span>
        <span className="text-[10px] text-ink-soft">{caption}</span>
      </div>
      <div
        className="grid w-full gap-x-1"
        style={{ gridTemplateColumns: `${LABEL_W / 16}rem repeat(${N}, minmax(0, 1fr))`, maxWidth: ROW_MAX }}
      >
        <span aria-hidden />
        {POS.map((i) => (
          <div key={`flag-${i}`} className="flex h-8 flex-col items-center justify-end leading-none">
            {marks[i].flags.length > 0 ? (
              marks[i].flags.map((f) => (
                <span
                  key={f}
                  className="font-code text-[9px] font-bold sm:text-[10px]"
                  style={{
                    color:
                      f === 'preL' || f === 'inL'
                        ? TONE.amber
                        : f.startsWith('pre')
                          ? TONE.teal
                          : TONE.medium,
                  }}
                >
                  {f}
                </span>
              ))
            ) : (
              <span className="font-code text-[9px] text-ink-soft">·</span>
            )}
            <span className="mt-0.5 text-[7px]" style={{ color: TONE.muted }}>
              ▼
            </span>
          </div>
        ))}

        <span className="flex items-center justify-end pr-1 text-[10px] text-ink-soft">值</span>
        {POS.map((i) => (
          <Cell
            key={`cell-${i}`}
            state={marks[i].state}
            size="sm"
            className={cn(
              'w-full min-w-0',
              marks[i].block === 'L' &&
                '-ml-px rounded-none border-[hsl(var(--teal))] bg-[hsl(var(--teal)/0.16)]',
              marks[i].block === 'R' &&
                '-ml-px rounded-none border-[hsl(var(--medium))] bg-[hsl(var(--medium)/0.16)]'
            )}
          >
            {values[i]}
          </Cell>
        ))}

        <span aria-hidden />
        {POS.map((i) => (
          <span key={`idx-${i}`} className="text-center font-code text-[10px] text-ink-soft">
            {i}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ---------------- 树（x 按中序展开、y 按层） ---------------- */

function TreeView({ step }: { step: Step }) {
  const builtSet = new Set(step.built)
  const stackSet = new Set(step.stack)
  const cur = step.cur
  const maxDepth = step.built.length
    ? Math.max(...step.built.map((id) => NODES[id].depth))
    : 0
  const W = N * 140
  const H = TOP + maxDepth * LEVEL_GAP + 46

  const x = (i: number) => 70 + 140 * i
  const y = (d: number) => TOP + LEVEL_GAP * d

  const edges = step.built.flatMap((id) => {
    const n = NODES[id]
    const kids: [string, 'L' | 'R'][] = []
    if (n.left && builtSet.has(n.left)) kids.push([n.left, 'L'])
    if (n.right && builtSet.has(n.right)) kids.push([n.right, 'R'])
    return kids.map(([childId]) => {
      const active = cur?.root === childId
      return (
        <line
          key={`e-${id}-${childId}`}
          x1={x(n.inIdx)}
          y1={y(n.depth)}
          x2={x(NODES[childId].inIdx)}
          y2={y(NODES[childId].depth)}
          stroke={active ? TONE.amber : TONE.easy}
          strokeWidth={active ? 3 : 2}
        />
      )
    })
  })

  const circles = step.built.map((id) => {
    const n = NODES[id]
    const st: TreeState = cur?.root === id ? 'fresh' : stackSet.has(id) ? 'stack' : 'ok'
    const t = NODE_STYLE[st]
    return (
      <g key={`c-${id}`}>
        {cur?.root === id && (
          <circle
            cx={x(n.inIdx)}
            cy={y(n.depth)}
            r={NODE_R + 6}
            fill="none"
            stroke={TONE.amber}
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />
        )}
        <circle cx={x(n.inIdx)} cy={y(n.depth)} r={NODE_R} fill={t.fill} stroke={t.stroke} strokeWidth={t.w} />
        <text
          x={x(n.inIdx)}
          y={y(n.depth) + 6}
          textAnchor="middle"
          fontSize="16"
          fontWeight="700"
          className="font-code"
          fill={t.text}
        >
          {n.val}
        </text>
      </g>
    )
  })

  const labels = step.built.map((id) => {
    const n = NODES[id]
    const isRoot = cur?.root === id
    const onStack = stackSet.has(id)
    return (
      <g key={`l-${id}`}>
        {isRoot && (
          <text
            x={x(n.inIdx)}
            y={y(n.depth) - NODE_R - 8}
            textAnchor="middle"
            fontSize="11"
            fontWeight="700"
            className="font-code"
            fill={TONE.amber}
          >
            本步的根
          </text>
        )}
        {isRoot && <text x={x(n.inIdx) - NODE_R - 8} y={y(n.depth) + 4} textAnchor="end" fontSize="11" fill={TONE.amber}>
          根
        </text>}
        {!isRoot && onStack && (
          <text
            x={x(n.inIdx) + NODE_R + 7}
            y={y(n.depth) + 4}
            textAnchor="start"
            fontSize="10"
            fill={TONE.teal}
          >
            待构造
          </text>
        )}
      </g>
    )
  })

  /** 当前区间的切分提示：左子树 leftSize 个节点、右子树剩余节点（null 步改由「左空 / 右空」标注） */
  const splitLabels: ReactNode[] = []
  if (cur && step.phase !== 'null') {
    const n = NODES[cur.root]
    const leftN = cur.leftSize
    const rightN = cur.preR - cur.preL - leftN
    splitLabels.push(
      <text
        key="span-L"
        x={x(n.inIdx) - 42}
        y={y(n.depth + 1) + 4}
        textAnchor="middle"
        fontSize="11"
        fontWeight="700"
        className="font-code"
        fill={leftN > 0 ? TONE.teal : TONE.muted}
      >
        {leftN > 0 ? `左 ${leftN} 个` : '左空'}
      </text>
    )
    splitLabels.push(
      <text
        key="span-R"
        x={x(n.inIdx) + 42}
        y={y(n.depth + 1) + 4}
        textAnchor="middle"
        fontSize="11"
        fontWeight="700"
        className="font-code"
        fill={rightN > 0 ? TONE.medium : TONE.muted}
      >
        {rightN > 0 ? `右 ${rightN} 个` : '右空'}
      </text>
    )
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full select-none">
      {/* 1. 边：只在父子都已构造后出现 */}
      {edges}
      {/* 2. 节点圆：后画，盖住边的端点 */}
      {circles}
      {/* 3. 文字标签：状态不靠颜色单独区分 */}
      {labels}
      {/* 4. 当前区间的切分提示 */}
      {splitLabels}
      {/* 5. 底轴：说明横坐标来自中序下标 */}
      {POS.map((i) => (
        <text key={`ax-${i}`} x={x(i)} y={H - 8} textAnchor="middle" fontSize="10" className="font-code" fill={TONE.muted}>
          {`inorder[${i}]`}
        </text>
      ))}
    </svg>
  )
}

function Stage(step: Step) {
  const cur = step.cur
  const done = step.phase === 'done'
  const currentVal = cur ? NODES[cur.root].val : null
  const created = step.built.length

  const orderAt = (i: number) => (SLOT[i] ? NODES[SLOT[i] as string].order : -1)
  /** 位置 i 是否落在当前区间的「左 / 右子区间」里（根自身不算） */
  const blockOf = (i: number): RowMark['block'] => {
    if (!cur) return null
    if (i >= cur.inL && i < cur.rootIdx) return 'L'
    if (i > cur.rootIdx && i <= cur.inR) return 'R'
    return null
  }
  const cellState = (i: number): CellState => {
    if (done) return 'ok'
    if (cur?.rootIdx === i) return 'active'
    if (orderAt(i) >= 0 && orderAt(i) < created) return 'ok'
    if (blockOf(i) === 'L') return 'new'
    if (blockOf(i) === 'R') return 'warn'
    return 'dim'
  }

  const preMarks: RowMark[] = POS.map((i) => {
    const flags: string[] = []
    if (cur) {
      if (cur.preL === i) flags.push('preL')
      if (cur.preR === i && cur.preR !== cur.preL) flags.push('preR')
    }
    return { state: cellState(i), block: blockOf(i), flags }
  })
  const inMarks: RowMark[] = POS.map((i) => {
    const flags: string[] = []
    if (cur) {
      if (cur.inL === i) flags.push('inL')
      if (cur.inR === i && cur.inR !== cur.inL) flags.push('inR')
    }
    return { state: cellState(i), block: blockOf(i), flags }
  })

  const preRow: RowSpec = {
    label: 'preorder',
    caption: '根 | 左子树 | 右子树',
    values: PRE,
    marks: preMarks,
  }
  const inRow: RowSpec = {
    label: 'inorder',
    caption: '左子树 | 根 | 右子树',
    values: IN,
    marks: inMarks,
  }

  const rangeText =
    cur === null
      ? done
        ? '所有区间已处理完'
        : '（尚未开始切分）'
      : `前序 [${cur.preL}..${cur.preR}] / 中序 [${cur.inL}..${cur.inR}]`

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex w-full flex-col items-center gap-2">
        <SequenceRow {...preRow} />
        <SequenceRow {...inRow} />
      </div>

      <div className="w-full">
        {step.built.length === 0 ? (
          <p className="py-10 text-center text-xs text-ink-soft">
            （还没有创建任何节点：先取前序区间的第一个元素当根，再递归切分）
          </p>
        ) : (
          <TreeView step={step} />
        )}
      </div>

      <div className="text-center text-[11px] text-ink-soft">
        <span className="font-code">{rangeText}</span>
        {step.phase === 'null' && step.nullAt?.parent && (
          <span>
            {' · '}
            <span className="font-code">
              {NODES[step.nullAt.parent].val} 的{step.nullAt.side === 'L' ? '左' : '右'}子树为空
            </span>
          </span>
        )}
      </div>

      <Badges className="justify-center">
        <Stat label="当前子树的根" value={currentVal ?? '—'} tone="amber" />
        <Stat label="左子树节点数 leftSize" value={cur?.leftSize ?? '—'} tone="teal" />
        <Stat label="已创建节点" value={created} tone="easy" />
        {step.next && <Hint>{step.next}</Hint>}
        {done && (
          <Answer>
            层序 <b className="font-code">{LEVEL_TEXT}</b>（{TREE.levels.filter((v) => v !== null).length} 个节点）
          </Answer>
        )}
      </Badges>
    </div>
  )
}

export default function ConstructBinaryTreeFromPreorderAndInorderTraversalDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="前序定根，中序切分左右区间"
      info={`示例输入取自题解示例 1：preorder = [3,9,20,15,7]，inorder = [9,3,15,20,7]，输出层序 ${LEVEL_TEXT}。为看清取根与切分，这里只演示这个 ${N} 个节点的最小规模示例：每次递归「取根」和「切分区间」各记一步，每个空区间出口也各记一步，共 ${steps.length} 步。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '当前子树的根（preorder[preL]）' },
        { color: TONE.easy, label: '已挂好的节点与边' },
        { color: TONE.teal, label: '中序里的左子区间 / 左子树节点数' },
        { color: TONE.medium, label: '中序里的右子区间' },
        { color: TONE.muted, label: '未处理的位置' },
      ]}
    />
  )
}
