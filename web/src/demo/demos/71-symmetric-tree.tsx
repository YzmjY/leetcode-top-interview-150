import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badge, Badges, Hint, Stat, TONE } from './stage'

/* ------------------------------------------------------------------ */
/* 71. 对称二叉树 —— 模式 E：树 + 队列成对比较（左的左 vs 右的右）        */
/* ------------------------------------------------------------------ */

/** 题解「示例 2」的层序数组，null 表示空节点（输出 false） */
const LEVELS: (number | null)[] = [1, 2, 2, null, 3, null, 3]
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

const ROOT = buildTree(LEVELS, 0, ROOT_ID)!

const NODES: Record<string, TreeNode> = {}
const VAL_OF: Record<string, number> = {}
const DEPTH_OF: Record<string, number> = {}
/** 每个节点的两个孩子槽位 id（孩子不存在时槽位仍然保留） */
const KIDS_OF: Record<string, (string | null)[]> = {}

function collect(node: TreeNode | null, depth: number) {
  if (!node) return
  NODES[node.id] = node
  VAL_OF[node.id] = node.val
  DEPTH_OF[node.id] = depth
  KIDS_OF[node.id] = [
    node.left ? node.left.id : null,
    node.right ? node.right.id : null,
  ]
  collect(node.left, depth + 1)
  collect(node.right, depth + 1)
}
collect(ROOT, 0)

/** 节点 id → 它在线序数组里的下标（'R' → 0，'RL' → 1 …），用于判断空位是否真的写在数组里 */
function indexOf(id: string): number {
  let i = 0
  for (const ch of id.slice(1)) i = ch === 'L' ? 2 * i + 1 : 2 * i + 2
  return i
}

/** 空的槽位：key 是「父 id + 侧别」，用来在树上画出「这个镜像位置没有节点」 */
interface NullSlot {
  key: string
  parentId: string
  side: 'L' | 'R'
  depth: number
}
const NULL_SLOTS: NullSlot[] = []
/** 槽位 key → 用于定位的虚拟 id（中序展开时和真节点一样占一个位置） */
const SLOT_OF: Record<string, string> = {}

for (const id of Object.keys(NODES)) {
  for (const side of ['L', 'R'] as const) {
    if (`${id}${side}` in NODES) continue
    // 只画出层序数组里显式写出来的空位；数组末尾之外的位置不画，否则叶子下面会凭空多出空圆
    if (2 * indexOf(id) + (side === 'L' ? 1 : 2) >= LEVELS.length) continue
    const slotId = `${id}${side}`
    NULL_SLOTS.push({ key: slotId, parentId: id, side, depth: DEPTH_OF[id] + 1 })
    SLOT_OF[slotId] = slotId
  }
}

/** 中序展开：同一层的 x 槽位按中序顺序分配，空槽位同样占位，左右才严格镜像 */
const ORDER: string[] = []
function buildOrder(node: TreeNode | null) {
  if (!node) return
  buildOrder(node.left)
  if (`${node.id}L` in SLOT_OF) ORDER.push(SLOT_OF[`${node.id}L`])
  ORDER.push(node.id)
  if (`${node.id}R` in SLOT_OF) ORDER.push(SLOT_OF[`${node.id}R`])
  buildOrder(node.right)
}
buildOrder(ROOT)

const DEPTH_ANY: Record<string, number> = { ...DEPTH_OF }
for (const s of NULL_SLOTS) DEPTH_ANY[SLOT_OF[s.key]] = s.depth

const MAX_DEPTH = Math.max(...Object.values(DEPTH_ANY))
const SLOT_COUNT = ORDER.length

interface Pair {
  l: string | null
  r: string | null
}

interface Step {
  phase: 'init' | 'compare' | 'match' | 'enqueue' | 'both-null' | 'value-diff' | 'mismatch' | 'done'
  /** 本步正在比较的一对节点（可以是空槽位），init / done 为 [null, null] */
  l: string | null
  r: string | null
  /** 队列快照：待比较的节点对，按入队顺序（队首在左） */
  queue: Pair[]
  /** 已经取出比较过的节点 id，用于渲染「已走过」 */
  seen: string[]
  /** 成对比较的判定结果，顺序即比较顺序 */
  pairResults: { l: string | null; r: string | null; ok: boolean }[]
  /** 本步是否命中了结构/值的不匹配 */
  hit: boolean
  note: string
  /** 下一步动作（由后一个快照推导，供 Hint 使用） */
  next: string
}

function label(id: string | null): string {
  return id === null || !(id in NODES) ? '空' : String(VAL_OF[id])
}

function buildSteps(): Step[] {
  const steps: Step[] = []
  let queue: Pair[] = []
  const seen: string[] = []
  const pairResults: { l: string | null; r: string | null; ok: boolean }[] = []

  const snap = (phase: Step['phase'], l: string | null, r: string | null, note: string, hit = false): Step => ({
    phase,
    l,
    r,
    queue: queue.map((p) => ({ l: p.l, r: p.r })),
    seen: seen.slice(),
    pairResults: pairResults.map((p) => ({ ...p })),
    hit,
    note,
    next: '',
  })

  steps.push(
    snap(
      'init',
      null,
      null,
      `观察：root = ${INPUT_TEXT}，根节点自己落在对称轴上，所以只需判断根的左子树与右子树是否互为镜像。判断：用队列成对比较——先把 (root.Left, root.Right) = (2, 2) 入队，此后每次取出队首的一对做判断。动作：两值相等时把「左的左 vs 右的右」与「左的右 vs 右的左」两对入队；任一对结构不同或值不同就返回 false。为什么：轴对称要求左边对着右边，而不是两棵子树长得一样。`
    )
  )

  queue = [{ l: ROOT.left ? ROOT.left.id : null, r: ROOT.right ? ROOT.right.id : null }]

  steps.push(
    snap(
      'compare',
      queue[0].l,
      queue[0].r,
      `观察：从队首取出 (${label(queue[0].l)}, ${label(queue[0].r)})，队列随即变空。判断：两边都不为空，先比结构再比值——它们都是 2，这一对通过。动作：把 2 的两个孩子按镜像配成外侧 (左的左, 右的右) 与内侧 (左的右, 右的左)，依次入队。为什么：根值相等只是必要条件，真正的镜像关系要由下一层的孩子继续验证。`
    )
  )

  // 队列里存放的是「待比较的成对节点」，取出队首一对做三项判断
  while (queue.length > 0) {
    const pair = queue.shift()!
    const lId = pair.l
    const rId = pair.r
    const L = lId === null ? null : NODES[lId] ?? null
    const R = rId === null ? null : NODES[rId] ?? null

    if (lId !== null) seen.push(lId)
    if (rId !== null) seen.push(rId)

    if (!L && !R) {
      pairResults.push({ l: lId, r: rId, ok: true })
      steps.push(
        snap(
          'both-null',
          lId,
          rId,
          `观察：这一对的两个位置都取到空节点，两侧同时为空。判断：镜像位置都为空，结构一致，这一对视为镜像。动作：不返回结果，直接 continue 去处理队列里剩下的配对。为什么：空位置也算一次成立的判定；如果在这里 return true，后面还没检查的节点对就被漏掉了。`,
          false
        )
      )
      continue
    }

    if (!L || !R) {
      pairResults.push({ l: lId, r: rId, ok: false })
      steps.push(
        snap(
          'mismatch',
          lId,
          rId,
          `观察：${label(lId)} 与 ${label(rId)} 配成一对，一边是节点、一边是空位置。判断：结构不同，镜像关系被破坏。动作：立即返回 false，队列里剩下的配对全部作废。为什么：镜像要求两个位置同为节点或同为空，一边空一边不空永远不可能对称。`,
          true
        )
      )
      break
    }

    if (L.val !== R.val) {
      pairResults.push({ l: lId, r: rId, ok: false })
      steps.push(
        snap(
          'value-diff',
          lId,
          rId,
          `观察：这一对节点值不相等，${L.val} ≠ ${R.val}。判断：两个镜像位置连根值都不同，不满足镜像的第一条。动作：立即返回 false，不再展开它们的孩子。为什么：值不同时，深层怎么配都不可能补回来。`,
          true
        )
      )
      break
    }

    pairResults.push({ l: lId, r: rId, ok: true })
    const outerL = L.left ? L.left.id : null
    const outerR = R.right ? R.right.id : null
    const innerL = L.right ? L.right.id : null
    const innerR = R.left ? R.left.id : null

    steps.push(
      snap(
        'enqueue',
        lId,
        rId,
        `观察：${L.val} 与 ${R.val} 值相等，这一对通过。判断：下一层要交叉验证——外侧是「左的左 vs 右的右」= (${label(outerL)}, ${label(outerR)})，内侧是「左的右 vs 右的左」= (${label(innerL)}, ${label(innerR)})。动作：把这两对依次入队，队里从 ${queue.length} 项变成 ${queue.length + 2} 项。为什么：两个节点值相同还不够，两棵子树是否互为镜像必须由这两对来回答。`
      )
    )

    queue.push({ l: outerL, r: outerR }, { l: innerL, r: innerR })

    steps.push(
      snap(
        'match',
        lId,
        rId,
        `观察：队列里现在有 ${queue.length} 项待比较，队首是 (${label(queue[0].l)}, ${label(queue[0].r)})。判断：已检查过的配对里没有出现过矛盾。动作：把这一对 (${L.val}, ${R.val}) 记为「镜像」，回到循环开头取下一对。为什么：队列里还有成对的节点没取完，继续往下比才能定论；取到一对里一边为空时，那里就会返回 false。`
      )
    )
  }

  const last = steps[steps.length - 1]
  const restQueue = last.queue.map((p) => `${label(p.l)}, ${label(p.r)}`).join(') (')
  const doneNote = last.hit
    ? `观察：那一对 (${label(last.l)}, ${label(last.r)}) 一边是节点、一边为空，比较就此中断，队列里还剩 (${restQueue}) 没看。判断：false 沿调用关系传回根——这对位置不镜像，节点 2 与节点 2 的配对就不成立，根的两棵子树也就不是镜像。动作：isSymmetric(root) = false，这棵树不轴对称。为什么：每个节点最多入队一次，时间 O(n)；队列最多同时存放最宽一层约 n/2 个节点，空间 O(n)。`
    : `观察：队列已经取空，${last.pairResults.length} 对位置全部比较完，没有出现过一次矛盾。判断：每一对镜像位置要么同为节点且值相等，要么同为空，根的两棵子树互为镜像。动作：isSymmetric(root) = true。为什么：每个节点最多入队一次，时间 O(n)；迭代版把递归的调用栈换成队列，空间 O(n)。`
  steps.push(snap('done', null, null, doneNote))

  // 「下一步动作」由后一个快照推导，保证与步骤数据一致
  steps.forEach((s, i) => {
    const b = steps[i + 1]
    if (!b) return
    switch (b.phase) {
      case 'compare':
      case 'init':
        s.next = `先比 ${label(b.l)} 与 ${label(b.r)} 的值，相等再展开它们的孩子`
        break
      case 'enqueue':
        s.next = '把外侧「左的左 vs 右的右」和内侧「左的右 vs 右的左」两对依次入队'
        break
      case 'match':
        s.next = `下一对是 (${label(b.queue[0].l)}, ${label(b.queue[0].r)})，先判断两边是否都为空`
        break
      case 'both-null':
        s.next = '这一对两边都空，continue 看队列里的下一对'
        break
      case 'value-diff':
        s.next = `发现 ${label(b.l)} ≠ ${label(b.r)}，立即返回 false`
        break
      case 'mismatch':
        s.next = `发现 (${label(b.l)}, ${label(b.r)}) 一边空一边不空，立即返回 false`
        break
      case 'done':
        s.next = '输出答案：isSymmetric(root) = false'
        break
    }
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

const W = 640
const PAD = 70
const NODE_R = 20
const TOP = 78
const LEVEL_GAP = 88
const H = TOP + MAX_DEPTH * LEVEL_GAP + 106

const SLOT_W = (W - 2 * PAD) / SLOT_COUNT
/** 虚拟槽位（空节点）的 x 画在对称轴的镜像位置，空槽位永远左右成对出现 */
const X_OF: Record<string, number> = {}
ORDER.forEach((id, i) => {
  X_OF[id] = PAD + SLOT_W * (i + 0.5)
})
const yOf = (id: string) => TOP + DEPTH_ANY[id] * LEVEL_GAP

type NodeState = 'current' | 'match' | 'mismatch' | 'queued' | 'idle'

const FILL: Record<NodeState, string> = {
  current: TONE.amber,
  match: TONE.easy,
  mismatch: TONE.hard,
  queued: 'hsl(var(--card))',
  idle: 'hsl(var(--paper))',
}

const STROKE: Record<NodeState, string> = {
  current: TONE.amber,
  match: TONE.easy,
  mismatch: TONE.hard,
  queued: TONE.medium,
  idle: 'hsl(var(--border))',
}

const VALUE_FILL: Record<NodeState, string> = {
  current: 'hsl(var(--card))',
  match: 'hsl(var(--card))',
  mismatch: 'hsl(var(--card))',
  queued: 'hsl(var(--ink))',
  idle: 'hsl(var(--ink))',
}

const STATE_TEXT: Record<NodeState, string | null> = {
  current: '比较中',
  match: '已镜像',
  mismatch: '不匹配',
  queued: '待比较',
  idle: null,
}

function Stage(step: Step) {
  const inPair = (id: string | null) => id !== null && (step.l === id || step.r === id)
  const pairActive = step.l !== null || step.r !== null
  const lMissing = pairActive && label(step.l) !== '空' && label(step.r) === '空'

  const stateOf = (id: string): NodeState => {
    if (inPair(id)) return step.hit ? 'mismatch' : step.phase === 'enqueue' ? 'match' : 'current'
    if (id !== ROOT_ID && step.seen.includes(id)) return 'queued'
    return 'idle'
  }

  const mirrored = step.pairResults.filter((p) => p.ok).length
  const mismatched = step.pairResults.filter((p) => !p.ok).length
  const queueText = (p: Pair) => `${label(p.l)} ↔ ${label(p.r)}`

  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full select-none">
        {/* 1. 对称轴 */}
        <line
          x1={W / 2}
          y1={26}
          x2={W / 2}
          y2={H - 26}
          stroke="hsl(var(--border))"
          strokeWidth="1.5"
          strokeDasharray="6 5"
        />
        <text x={W / 2} y={20} textAnchor="middle" fontSize="12" fontWeight="700" className="font-code" fill="hsl(var(--ink-soft))">
          对称轴
        </text>
        <text x={130} y={20} textAnchor="middle" fontSize="12" fontWeight="700" className="font-code" fill={TONE.amber}>
          左子树
        </text>
        <text x={W - 130} y={20} textAnchor="middle" fontSize="12" fontWeight="700" className="font-code" fill={TONE.teal}>
          右子树
        </text>

        {/* 2. 实线边：先画边再画节点圆，端点被圆盖住 */}
        {Object.keys(NODES).map((id) =>
          KIDS_OF[id].map((childId, k) => {
            if (childId === null) return null
            const st = stateOf(childId)
            const stroke = st === 'match' ? TONE.easy : st === 'queued' ? TONE.medium : 'hsl(var(--border))'
            return (
              <line
                key={`${id}-${childId}-${k}`}
                x1={X_OF[id]}
                y1={yOf(id)}
                x2={X_OF[childId]}
                y2={yOf(childId)}
                stroke={stroke}
                strokeWidth={st === 'match' ? 2.5 : 2}
              />
            )
          })
        )}

        {/* 3. 连到空槽位的虚线边：不画边的话，空圆会像是旁边节点的孩子 */}
        {NULL_SLOTS.map((s) => {
          const sid = SLOT_OF[s.key]
          const x1 = X_OF[s.parentId]
          const y1 = yOf(s.parentId)
          const x2 = X_OF[sid]
          const y2 = yOf(sid)
          const st: NodeState = inPair(sid) ? (step.hit ? 'mismatch' : 'current') : 'idle'
          return (
            <line
              key={`edge-${s.key}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={inPair(sid) ? STROKE[st] : 'hsl(var(--border))'}
              strokeWidth={inPair(sid) ? 2.5 : 1.5}
              strokeDasharray="3 4"
              opacity={inPair(sid) ? 1 : 0.7}
            />
          )
        })}

        {/* 4. 空槽位：虚线小圆，标出「这个镜像位置上没有节点」 */}
        {NULL_SLOTS.map((s) => {
          const sid = SLOT_OF[s.key]
          const active = inPair(sid)
          const st: NodeState = active ? (step.hit ? 'mismatch' : step.phase === 'enqueue' ? 'match' : 'current') : 'idle'
          const color = active ? STROKE[st] : TONE.muted
          return (
            <g key={s.key}>
              <circle
                cx={X_OF[sid]}
                cy={yOf(sid)}
                r={13}
                fill="none"
                stroke={color}
                strokeWidth={active ? 2.5 : 1.5}
                strokeDasharray="4 3"
              />
              <text x={X_OF[sid]} y={yOf(sid) + 4} textAnchor="middle" fontSize="11" className="font-code" fill={color}>
                空
              </text>
              <text x={X_OF[sid] + 17} y={yOf(sid) + 10} textAnchor="start" fontSize="9" className="font-code" fill={color}>
                null
              </text>
            </g>
          )
        })}

        {/* 5. 虚线弧：把「正在比较的一对」连起来；一对里可能是真节点，也可能是空槽位 */}
        {step.l !== null && step.r !== null && (
          (() => {
            const yL = yOf(step.l)
            const yR = yOf(step.r)
            const top = Math.min(yL, yR)
            const topId = yL <= yR ? step.l : step.r
            const color = step.hit ? TONE.hard : step.phase === 'enqueue' ? TONE.easy : TONE.amber
            const caption = step.hit ? '✗ 不匹配' : step.phase === 'enqueue' ? '✓ 镜像' : lMissing ? '结构不同' : '比较中'
            // 两端的弧线都在高处的上方；一端是空槽位时两处位置分别在两侧、高度一致
            const edgeY = (id: string) => (id in NODES ? yOf(id) - NODE_R : yOf(id))
            return (
              <g>
                <path
                  d={`M ${X_OF[step.l]} ${edgeY(step.l)} Q ${W / 2} ${top - NODE_R - 24} ${X_OF[step.r]} ${edgeY(step.r)}`}
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                  strokeDasharray="6 4"
                />
                <text
                  x={W / 2}
                  y={Math.max(30, Math.min(top - NODE_R - 22, yOf(topId) - NODE_R - 14))}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="700"
                  className="font-code"
                  fill={color}
                >
                  {caption}
                </text>
              </g>
            )
          })()
        )}

        {/* 6. 两侧同时为空：在父节点正下方注明结构一致 */}
        {step.l === null && step.r === null && step.phase === 'both-null' && (
          <text
            x={X_OF[seenParent(step)]}
            y={yOf(seenParent(step)) + 46}
            textAnchor="middle"
            fontSize="11"
            fontWeight="700"
            className="font-code"
            fill={TONE.easy}
          >
            两侧同时为空 → 结构一致
          </text>
        )}

        {/* 7. 节点圆 + 值 + 状态文字（状态不靠颜色区分） */}
        {ORDER.map((id) => {
          if (!(id in NODES)) return null
          const isRoot = id === ROOT_ID
          const st = stateOf(id)
          const text = isRoot ? '根（在对称轴上）' : STATE_TEXT[st]
          return (
            <g key={id} className="demo-water">
              <circle
                cx={X_OF[id]}
                cy={yOf(id)}
                r={NODE_R}
                fill={FILL[st]}
                stroke={STROKE[st]}
                strokeWidth={st === 'idle' ? 2 : 3}
                strokeDasharray={st === 'queued' ? '5 4' : undefined}
              />
              <text
                x={X_OF[id]}
                y={yOf(id) + 6}
                textAnchor="middle"
                fontSize="17"
                fontWeight="700"
                className="font-code"
                fill={VALUE_FILL[st]}
              >
                {VAL_OF[id]}
              </text>
              {text && (
                <text
                  x={X_OF[id]}
                  y={yOf(id) - NODE_R - 8}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="700"
                  className="font-code"
                  fill={st === 'idle' ? 'hsl(var(--ink-soft))' : STROKE[st]}
                >
                  {text}
                </text>
              )}
            </g>
          )
        })}
      </svg>

      {/* 待比较队列：成对比较，队首高亮并带文字标注 */}
      <div className="flex w-full flex-wrap items-center justify-center gap-1.5 text-[11px]">
        <span className="text-ink-soft">待比较队列</span>
        {step.queue.length === 0 ? (
          <span className="font-code text-ink-soft">
            {step.phase === 'done' ? '（已空，比较中断）' : '（空）'}
          </span>
        ) : (
          step.queue.map((p, k) => (
            <span
              key={`${p.l}-${p.r}-${k}`}
              className={
                k === 0
                  ? 'rounded-md border border-[hsl(var(--amber))]/50 bg-[hsl(var(--amber-soft))] px-2 py-0.5 font-code font-semibold text-[hsl(var(--amber))]'
                  : 'rounded-md border border-border bg-card px-2 py-0.5 font-code text-ink-soft'
              }
            >
              ({queueText(p)}){k === 0 && <span className="ml-1 font-sans text-[10px]">队首</span>}
            </span>
          ))
        )}
      </div>

      <Badges className="justify-center">
        <Stat
          label="当前比较对"
          value={pairActive ? `(${label(step.l)}, ${label(step.r)})` : '—'}
          tone="amber"
        />
        <Stat label="已确认镜像" value={mirrored} tone="easy" />
        <Stat label="不镜像的配对" value={mismatched} tone="hard" />
        {step.phase === 'value-diff' && (
          <Badge tone="hard">
            <b className="font-code text-xs">
              {label(step.l)} ≠ {label(step.r)}
            </b>
          </Badge>
        )}
        {step.phase === 'mismatch' && <Badge tone="hard">一边空一边不空</Badge>}
        {step.phase === 'both-null' && <Badge tone="easy">两侧同时为空 → 结构一致</Badge>}
        {step.next && <Hint tone={step.hit ? 'hard' : 'teal'}>{step.next}</Hint>}
        {step.phase === 'done' && <Answer>根的两棵子树不是镜像 → false</Answer>}
      </Badges>
    </div>
  )
}

/** both-null 步中这一对的父节点：从槽位 id 反查它属于哪个节点 */
function seenParent(step: Step): string {
  const ids = [step.l, step.r].filter((id): id is string => id !== null)
  for (const s of NULL_SLOTS) {
    if (ids.includes(SLOT_OF[s.key])) return s.parentId
  }
  for (const id of ids) {
    if (id.slice(0, -1) in NODES) return id.slice(0, -1)
  }
  return ROOT_ID
}

export default function SymmetricTreeDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="成对入队，判断两棵子树是否互为镜像"
      info={`输入：root = ${INPUT_TEXT}（题解示例 2，层序表示，null 为空节点，输出 false）。示例 1 的树左右完全对称，会一路比较到队列取空都返回 true，看不出「两边不对应」的问题；示例 2 在外侧那一对 (空, 3) 上出现「一边空一边不空」而中断，正好展示必须交叉比较左的左与右的右。全流程 ${steps.length} 步，覆盖「值相等后展开孩子」与「结构不同立即返回 false」两种判定。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '正在比较的一对' },
        { color: TONE.easy, label: '已确认镜像 / 两侧同时为空' },
        { color: TONE.hard, label: '不匹配：结构不同或值不同' },
        { color: TONE.medium, label: '在队列中待比较' },
        { color: TONE.muted, label: '未访问 / 空槽位（虚线小圆，标「空」）' },
      ]}
    />
  )
}
