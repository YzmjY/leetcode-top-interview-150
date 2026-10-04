import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badges, Cell, Flag, Hint, Stat, TONE, type CellState } from './stage'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/* 73. 从中序与后序遍历序列构造二叉树 —— 模式 E：树 + 中序区间切分        */
/*     后序是「左 | 右 | 根」，所以根在末尾：postIdx 从后往前扫，          */
/*     并且必须先递归右子树、再递归左子树，postIdx 才会落在正确的根上。    */
/* ------------------------------------------------------------------ */

/** 题解「示例 1」：inorder = [9,3,15,20,7]、postorder = [9,15,7,20,3]，输出 [3,9,20,null,null,15,7] */
const IN = [9, 3, 15, 20, 7]
const POST = [9, 15, 7, 20, 3]
const N = IN.length

/** 值 → 中序下标（题目保证值互不相同，映射唯一） */
const IDX: Record<number, number> = {}
IN.forEach((v, i) => {
  IDX[v] = i
})

interface Layout {
  /** 该值在 inorder 中的下标，决定横坐标 */
  inIdx: number
  /** 该值在树中的深度，决定纵坐标 */
  depth: number
  parent: number | null
  side: 'L' | 'R' | null
}

/** 舞台布局只依赖树结构：按题解算法把完整输入跑一遍，先把每个节点的位置固定下来，节点才不会跳动 */
const LAYOUT: Record<number, Layout> = {}

function layoutOf(
  inL: number,
  inR: number,
  depth: number,
  parent: number | null,
  side: 'L' | 'R' | null,
  cursor: { i: number }
): number {
  if (inL > inR) return -1
  const rootVal = POST[cursor.i]
  cursor.i -= 1
  const rootIdx = IDX[rootVal]
  LAYOUT[rootVal] = { inIdx: rootIdx, depth, parent, side }
  const right = layoutOf(rootIdx + 1, inR, depth + 1, rootVal, 'R', cursor)
  const left = layoutOf(inL, rootIdx - 1, depth + 1, rootVal, 'L', cursor)
  return Math.max(depth, right, left)
}

const MAX_DEPTH = layoutOf(0, N - 1, 0, null, null, { i: N - 1 })
const ROOT_VAL = IN.filter((v) => LAYOUT[v].parent === null)[0]

/** 由上面的结构还原孩子指针，答案（层序 / 中序）直接从构造结果读出，不照抄题解文字 */
const CHILD: Record<number, { L: number | null; R: number | null }> = {}
IN.forEach((v) => {
  CHILD[v] = { L: null, R: null }
})
Object.keys(LAYOUT).forEach((key) => {
  const v = Number(key)
  const { parent, side } = LAYOUT[v]
  if (parent !== null && side) CHILD[parent][side] = v
})

const LEVEL_ORDER: (number | null)[] = [ROOT_VAL]
for (let head = 0; head < LEVEL_ORDER.length; head++) {
  const v = LEVEL_ORDER[head]
  if (v !== null) LEVEL_ORDER.push(CHILD[v].L, CHILD[v].R)
}
while (LEVEL_ORDER.length > 0 && LEVEL_ORDER[LEVEL_ORDER.length - 1] === null) LEVEL_ORDER.pop()

const IN_WALK: number[] = []
{
  const walk = (v: number) => {
    const { L, R } = CHILD[v]
    if (L !== null) walk(L)
    IN_WALK.push(v)
    if (R !== null) walk(R)
  }
  walk(ROOT_VAL)
}

const LEVEL_TEXT = `[${LEVEL_ORDER.map((v) => (v === null ? 'null' : v)).join(', ')}]`

/* ---------------- 步骤数据 ---------------- */

interface Frame {
  /** 该次调用取到的根；null 表示空区间调用（立即返回 null） */
  val: number | null
  inL: number
  inR: number
}

interface Step {
  phase: 'init' | 'pick' | 'split' | 'null' | 'done'
  /** 已创建的节点值，按创建顺序（不可变快照） */
  nodes: number[]
  /** 本步确定 / 新建的根 */
  cur: number | null
  inL: number | null
  inR: number | null
  postL: number | null
  postR: number | null
  /** 后序中下一个待取根的下标，取完为 -1 */
  postIdx: number
  /** 根在中序中的位置 */
  rootIdx: number | null
  /** 递归调用栈快照，栈顶在末尾 */
  stack: Frame[]
  note: string
  /** 下一步动作，由后一个快照统一回填，保证与步骤数据一致 */
  next: string
}

const seg = (l: number, r: number) => `[${l}..${r}]`

function buildSteps(): Step[] {
  const steps: Step[] = []
  const nodes: number[] = []
  const stack: Frame[] = []
  let postIdx = N - 1

  const snap = (phase: Step['phase'], note: string, extra: Partial<Step> = {}) => {
    const step: Step = {
      phase,
      note,
      next: '',
      nodes: nodes.slice(),
      cur: null,
      inL: null,
      inR: null,
      postL: null,
      postR: null,
      postIdx,
      rootIdx: null,
      stack: stack.map((f) => ({ ...f })),
      ...extra,
    }
    steps.push(step)
  }

  snap(
    'init',
    `观察：inorder = [${IN.join(', ')}]，postorder = [${POST.join(', ')}]，后序的结构是「左子树 | 右子树 | 根」，所以根排在末尾。` +
      `判断：整棵树的根必然是 postorder[${N - 1}] = ${POST[N - 1]}，于是 postIdx 从 ${N - 1} 开始倒着扫，并先用哈希表记下每个值在中序里的下标。` +
      `动作：调用 build(0, ${N - 1})，把整段中序和整段后序交给递归。` +
      `为什么：中序里根的位置把序列切成左右两段，这个切分与后序中同一棵子树一一对应，值互不相同才让「值 → 下标」映射唯一。`
  )

  function build(inL: number, inR: number) {
    if (inL > inR) {
      stack.push({ val: null, inL, inR })
      snap(
        'null',
        `观察：进入 build(${inL}, ${inR})，这里 inL = ${inL} 已经大于 inR = ${inR}，这段中序区间一个元素都没有。` +
          `判断：这样的子树不存在，直接返回 null，postIdx 仍停在 ${postIdx} 不动。` +
          `动作：把 null 交回上一层调用，由它继续处理另一侧或向上返回。` +
          `为什么：空子树在后序里同样不占位置，只有真正取走一个根时 postIdx 才左移。`,
        { inL, inR }
      )
      stack.pop()
      return
    }

    const rootVal = POST[postIdx]
    const rootIdx = IDX[rootVal]
    const size = inR - inL + 1
    const leftSize = rootIdx - inL
    const rightSize = size - leftSize - 1
    const postL = postIdx - size + 1
    const postR = postIdx
    postIdx -= 1

    nodes.push(rootVal)
    stack.push({ val: rootVal, inL, inR })

    snap(
      'pick',
      `观察：当前调用的中序区间是 inorder${seg(inL, inR)}、后序区间是 postorder${seg(postL, postR)}，末尾的 ${rootVal} 还没有归属。` +
        `判断：后序是「左子树后序 | 右子树后序 | 根」，所以 postorder[${postR}] = ${rootVal} 就是这棵子树的根。` +
        `动作：新建节点 ${rootVal}，由哈希表查到它在中序中的位置 rootIdx = ${rootIdx}，postIdx 左移到 ${postIdx}。` +
        `为什么：去掉根之后，后序剩下的部分恰好是「左子树后序 | 右子树后序」，末尾继续对应下一棵子树的根。`,
      { inL, inR, postL, postR, rootIdx, cur: rootVal }
    )

    const tail =
      leftSize > 0 && rightSize > 0
        ? `判断：后序去掉根之后，紧挨末尾的正是右子树的根，postIdx = ${postIdx} 此刻就指着它。` +
          `动作：先递归右子树 build(${rootIdx + 1}, ${inR})，再递归左子树 build(${inL}, ${rootIdx - 1})。` +
          `为什么：右子树先取走它那 ${rightSize} 个根，postIdx 才会正好落到左子树的根上，顺序反了取到的根就错位。`
        : leftSize === 0 && rightSize === 0
          ? `判断：两段都是空区间，${rootVal} 没有孩子，是叶子节点，postIdx = ${postIdx} 留给上一层尚未处理的部分。` +
            `动作：依次递归 build(${rootIdx + 1}, ${inR}) 与 build(${inL}, ${rootIdx - 1})，两次都会命中空区间立刻返回 null。` +
            `为什么：空子树在后序里不占位置，这两次调用都不会移动 postIdx。`
          : rightSize === 0
            ? `判断：右子树为空，后序去掉根后的末尾就是左子树的根，postIdx = ${postIdx} 指着它。` +
              `动作：先递归 build(${rootIdx + 1}, ${inR})（空区间立即返回 null），再递归左子树 build(${inL}, ${rootIdx - 1})。` +
              `为什么：先右后左保证 postIdx 始终落在正确的根上，右子树为空时这一点同样成立。`
            : `判断：左子树为空，postIdx = ${postIdx} 正指着右子树的根。` +
              `动作：先递归右子树 build(${rootIdx + 1}, ${inR})，再递归 build(${inL}, ${rootIdx - 1})（空区间立即返回 null）。` +
              `为什么：后序是「左 | 右 | 根」，去掉根后右子树的根就在末尾，先右后左才能让 postIdx 对上。`

    snap(
      'split',
      `观察：根 ${rootVal} 把中序区间 ${seg(inL, inR)} 切成左段 ${seg(inL, rootIdx - 1)}（${leftSize} 个节点）和右段 ${seg(rootIdx + 1, inR)}（${rightSize} 个节点）。` +
        tail,
      { inL, inR, postL, postR, rootIdx, cur: rootVal }
    )

    build(rootIdx + 1, inR)
    build(inL, rootIdx - 1)

    stack.pop()
  }

  build(0, N - 1)

  snap(
    'done',
    `观察：postIdx 已从 ${N - 1} 取到 -1，${N} 个节点全部新建完成，构造出的树层序是 ${LEVEL_TEXT}。` +
      `判断：按中序还原得到 [${IN_WALK.join(', ')}]，与输入的 inorder 完全一致，说明每个根都挂在了正确的位置。` +
      `动作：返回根节点 ${ROOT_VAL}，递归结束。` +
      `为什么：每个节点只新建一次、哈希查找 O(1)，时间 O(n)；哈希表与递归栈共 O(n) 空间，另外取根必须从末尾开始且右子树先于左子树，否则 postIdx 会错位。`
  )

  // Hint 文案由后一个快照推导，保证描述的是真正的下一步动作
  steps.forEach((s, i) => {
    const b = steps[i + 1]
    if (!b) return
    const bInL = b.inL ?? 0
    const bInR = b.inR ?? 0
    const bRoot = b.rootIdx ?? 0
    if (b.phase === 'done') {
      s.next = '所有区间处理完毕，回溯得到整棵树'
    } else if (b.phase === 'split') {
      s.next = `按 inorder[${bRoot}] = ${b.cur} 把区间 ${seg(bInL, bInR)} 切成左 ${seg(bInL, bRoot - 1)}、右 ${seg(bRoot + 1, bInR)}，先递归右子树`
    } else if (b.phase === 'pick') {
      s.next = `取 postorder[${b.postR}] = ${b.cur} 作为根，再查 IDX[${b.cur}] = ${bRoot}（中序区间 ${seg(bInL, bInR)}）`
    } else if (b.phase === 'null') {
      s.next = `调用 build(${bInL}, ${bInR})，区间为空直接返回 null，postIdx 停在 ${b.postIdx}`
    }
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

const W = 680
const PAD = 56
const NODE_R = 22
const TOP = 48
const LEVEL_GAP = 78
const H = TOP + MAX_DEPTH * LEVEL_GAP + 52
const SLOT = (W - 2 * PAD) / N

/** 横坐标由该值在 inorder 中的下标决定，纵坐标由深度决定 */
const nodeX = (v: number) => PAD + SLOT * (LAYOUT[v].inIdx + 0.5)
const nodeY = (v: number) => TOP + LAYOUT[v].depth * LEVEL_GAP

const VALUES = IN.map((_, i) => i)

type FlagSpec = { label: string; tone: 'amber' | 'teal' | 'ink' } | null

function ArrayRow({
  title,
  windowText,
  values,
  stateOf,
  flagOf,
  activeIndex,
}: {
  title: string
  windowText: string
  values: number[]
  stateOf: (i: number) => CellState
  flagOf: (i: number) => FlagSpec
  activeIndex: number | null
}) {
  return (
    <div className="w-full">
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 text-[11px]">
        <span className="font-medium text-ink">{title}</span>
        <span className="font-code text-ink-soft">{windowText}</span>
      </div>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${N}, minmax(0, 1fr))` }}>
        {VALUES.map((i) => {
          const f = flagOf(i)
          return <Flag key={`flag-${i}`} label={f?.label} tone={f?.tone} />
        })}
        {VALUES.map((i) => (
          <Cell key={`cell-${i}`} state={stateOf(i)} className="w-full min-w-0">
            {values[i]}
          </Cell>
        ))}
        {VALUES.map((i) => (
          <span
            key={`idx-${i}`}
            className={cn(
              'pt-0.5 text-center font-code text-[11px]',
              i === activeIndex ? 'font-bold text-[hsl(var(--amber))]' : 'text-ink-soft'
            )}
          >
            {i}
          </span>
        ))}
      </div>
    </div>
  )
}

function Stage(step: Step) {
  const done = step.phase === 'done'
  const { inL: iL, inR: iR, postL: pL, postR: pR, rootIdx, postIdx } = step

  const inRange = (i: number) => iL !== null && iR !== null && i >= iL && i <= iR
  /** init 步还没有取根，postIdx 指向的就是第一个要取的根 */
  const postActive = step.phase === 'init' ? postIdx : pR

  const inState = (i: number): CellState => {
    if (done) return 'ok'
    if (rootIdx !== null && i === rootIdx) return 'active'
    if (inRange(i)) return 'new'
    return 'dim'
  }

  const postState = (i: number): CellState => {
    if (done) return 'ok'
    if (step.phase === 'init') return i === postIdx ? 'active' : 'idle'
    if (pR !== null && i === pR) return 'active'
    if (i > postIdx) return 'dim'
    if (pL !== null && i >= pL && i <= postIdx) return 'new'
    return 'idle'
  }

  const inFlag = (i: number): FlagSpec => {
    if (done) return null
    if (rootIdx !== null && i === rootIdx) return { label: 'root', tone: 'amber' }
    if (iL !== null && i === iL) return { label: 'inL', tone: 'teal' }
    if (iR !== null && i === iR) return { label: 'inR', tone: 'teal' }
    return null
  }

  const postFlag = (i: number): FlagSpec => {
    if (done) return null
    if (step.phase === 'init') return i === postIdx ? { label: 'postIdx', tone: 'amber' } : null
    if (pR !== null && i === pR) return { label: 'postR', tone: 'amber' }
    if (i === postIdx) return { label: 'postIdx', tone: 'ink' }
    return null
  }

  const rangeText = (l: number | null, r: number | null) => (l === null || r === null ? '—' : `${l}..${r}`)

  const caption =
    step.phase === 'null'
      ? `build(${iL}, ${iR})：inL > inR 是空区间 → 返回 null，postIdx 停在 ${postIdx} 不动`
      : done
        ? '整棵树构造完成：中序、后序都能还原回输入'
        : '横坐标 = 该值在 inorder 中的下标，纵坐标 = 它在树中的深度'

  return (
    <div className="flex flex-col items-center gap-3">
      {/* 两个序列：上后序、下中序，列宽一致便于上下对照 */}
      <ArrayRow
        title="后序 postorder（左 | 右 | 根）"
        windowText={`post[${rangeText(pL, pR)}]`}
        values={POST}
        stateOf={postState}
        flagOf={postFlag}
        activeIndex={postActive}
      />
      <ArrayRow
        title="中序 inorder（左 | 根 | 右）"
        windowText={`in[${rangeText(iL, iR)}]${step.phase === 'null' ? ' 空' : ''}`}
        values={IN}
        stateOf={inState}
        flagOf={inFlag}
        activeIndex={done ? null : rootIdx}
      />

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full select-none">
        {/* 1. 边：先画线，节点圆后画盖住端点 */}
        {step.nodes.map((v) => {
          const p = LAYOUT[v].parent
          if (p === null) return null
          const fresh = v === step.cur
          return (
            <g key={`edge-${v}`}>
              <line
                x1={nodeX(p)}
                y1={nodeY(p) + NODE_R}
                x2={nodeX(v)}
                y2={nodeY(v) - NODE_R}
                stroke={fresh ? 'hsl(var(--amber))' : 'hsl(var(--easy))'}
                strokeWidth={fresh ? 3 : 2}
              />
              <text
                x={(nodeX(p) + nodeX(v)) / 2 + (LAYOUT[v].side === 'L' ? -10 : 10)}
                y={(nodeY(p) + nodeY(v)) / 2}
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                className="font-code"
                fill="hsl(var(--ink-soft))"
              >
                {LAYOUT[v].side}
              </text>
            </g>
          )
        })}

        {/* 2. 节点圆：琥珀 = 本步新建的根，绿 = 已构造好 */}
        {step.nodes.map((v) => {
          const fresh = v === step.cur
          return (
            <g key={`node-${v}`}>
              <circle
                cx={nodeX(v)}
                cy={nodeY(v)}
                r={NODE_R}
                fill={fresh ? 'hsl(var(--paper))' : 'hsl(var(--easy))'}
                stroke={fresh ? 'hsl(var(--amber))' : 'hsl(var(--easy))'}
                strokeWidth={fresh ? 3.5 : 2}
              />
              <text
                x={nodeX(v)}
                y={nodeY(v) + 6}
                textAnchor="middle"
                fontSize="17"
                fontWeight="700"
                className="font-code"
                fill={fresh ? 'hsl(var(--amber))' : 'hsl(var(--card))'}
              >
                {v}
              </text>
              {fresh && (
                <text
                  x={nodeX(v) + NODE_R + 8}
                  y={nodeY(v) + 4}
                  textAnchor="start"
                  fontSize="11"
                  fontWeight="700"
                  className="font-code"
                  fill="hsl(var(--amber))"
                >
                  新建
                </text>
              )}
            </g>
          )
        })}

        {step.nodes.length === 0 && (
          <text
            x={W / 2}
            y={TOP + LEVEL_GAP / 2}
            textAnchor="middle"
            fontSize="13"
            className="font-code"
            fill="hsl(var(--ink-soft))"
          >
            还没有创建任何节点
          </text>
        )}

        {/* 3. 底部说明 */}
        <text
          x={W / 2}
          y={H - 10}
          textAnchor="middle"
          fontSize="11"
          className="font-code"
          fill="hsl(var(--ink-soft))"
        >
          {caption}
        </text>
      </svg>

      {/* 递归调用栈：栈顶就是当前 build 调用，空区间调用标注 → null */}
      <div className="flex w-full flex-wrap items-center justify-center gap-1.5 text-[11px]">
        <span className="text-ink-soft">递归调用栈</span>
        {step.stack.length === 0 ? (
          <span className="font-code text-ink-soft">（空）</span>
        ) : (
          step.stack.map((f, k) => {
            const top = k === step.stack.length - 1
            const empty = f.val === null
            return (
              <span key={`${f.inL}-${f.inR}-${k}`} className="flex items-center gap-1.5">
                {k > 0 && <span className="text-ink-soft">→</span>}
                <span
                  className={cn(
                    'rounded-md border px-2 py-0.5 font-code',
                    top && !empty
                      ? 'border-[hsl(var(--amber))]/50 bg-[hsl(var(--amber-soft))] font-semibold text-[hsl(var(--amber))]'
                      : 'border-border bg-card text-ink-soft'
                  )}
                >
                  build({f.inL}, {f.inR}){empty ? ' → null' : ` → ${f.val}`}
                </span>
                {top && <span className="text-[10px] text-ink-soft">栈顶</span>}
              </span>
            )
          })
        )}
      </div>

      <Badges className="justify-center">
        <Stat label="postIdx（下一个根）" value={step.postIdx} tone="ink" />
        <Stat label="本步的根" value={step.cur ?? '—'} tone="amber" />
        <Stat label="已构造节点" value={`${step.nodes.length} / ${N}`} tone="easy" />
        {!done && step.next && <Hint>{step.next}</Hint>}
        {done && (
          <Answer>
            层序输出 <b className="font-code">{LEVEL_TEXT}</b>（共 <b className="font-code">{N}</b> 个节点）
          </Answer>
        )}
      </Badges>
    </div>
  )
}

export default function ConstructBinaryTreeFromInorderAndPostorderTraversalDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="后序末尾定根，中序分左右区间"
      info={`示例 1（题解最小且有代表性的多节点示例）：inorder = [${IN.join(', ')}]、postorder = [${POST.join(', ')}]，输出 ${LEVEL_TEXT}。示例 2 只有单节点 [-1]，看不出分区间与「先右后左」的过程，故改用示例 1；演示共 ${steps.length} 步，完整覆盖 5 次取根、5 次切分与 6 次空区间返回。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '本步的根 / postIdx 取根位置 / 栈顶调用' },
        { color: TONE.teal, label: '当前子树在两个序列中的区间' },
        { color: TONE.easy, label: '已构造好的节点 / 已处理的元素' },
        { color: TONE.muted, label: '已取走的后序元素 / 区间之外' },
      ]}
    />
  )
}
