import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badges, Hint, Stat, TONE } from './stage'

/* ------------------------------------------------------------------ */
/* 74. 填充每个节点的下一个右侧节点指针 II —— 模式 E：树 + 逐层串 next    */
/*     dummy + tail 借用上一层已连好的 next，把下一层串成链表，O(1) 空间  */
/* ------------------------------------------------------------------ */

/** 题解示例 1 的层序数组，null 表示该位置没有节点（3 层，共 6 个节点） */
const LEVELS: (number | null)[] = [1, 2, 3, 4, 5, null, 7]
const INPUT_TEXT = `[${LEVELS.map((v) => (v === null ? 'null' : v)).join(', ')}]`
/** 题解示例 1 的输出：'#' 表示每层末尾的 NULL */
const OUTPUT_TEXT = '[1,#,2,3,#,4,5,7,#]'

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

const ROOT = buildTree(LEVELS, 0, 'R')
const ROOT_VAL = ROOT ? ROOT.val : 0

const NODES: Record<string, TreeNode> = {}
const VAL_OF: Record<string, number> = {}
const DEPTH_OF: Record<string, number> = {}
const PARENT_OF: Record<string, string> = {}
/** 中序展开：x 槽位按中序分配，同一层的节点自然是从左到右 */
const ORDER: string[] = []

function collect(node: TreeNode | null, depth: number, parentId: string | null) {
  if (!node) return
  NODES[node.id] = node
  VAL_OF[node.id] = node.val
  DEPTH_OF[node.id] = depth
  if (parentId) PARENT_OF[node.id] = parentId
  collect(node.left, depth + 1, node.id)
  ORDER.push(node.id)
  collect(node.right, depth + 1, node.id)
}
collect(ROOT, 0, null)

/** 每层的节点 id（层内从左到右），BY_LEVEL[d] 就是第 d 层的层序 */
const BY_LEVEL: string[][] = []
ORDER.forEach((id) => {
  const d = DEPTH_OF[id]
  if (!BY_LEVEL[d]) BY_LEVEL[d] = []
  BY_LEVEL[d].push(id)
})

/** 同层相邻节点之间的 next 箭头（算法要建立的就是这些连接） */
const ARROWS: { from: string; to: string }[] = []
BY_LEVEL.forEach((lv) => {
  lv.slice(0, -1).forEach((from, k) => ARROWS.push({ from, to: lv[k + 1] }))
})

interface Step {
  phase: 'init' | 'visit' | 'level' | 'done'
  /** cur：当前层的入口（最左）节点；done 为 null */
  cur: string | null
  /** 正在遍历的层号；done 为 null，表示所有层都已处理完 */
  level: number | null
  /** 本步内层正在看的节点 node */
  node: string | null
  /** 本步刚接到 tail 后面的孩子，按先左后右 */
  appended: string[]
  /** 下一层链表（已挂入的节点 id，按挂入顺序） */
  nextChain: string[]
  /** tail 指向的节点；null 表示 tail 仍指向 dummy */
  tail: string | null
  /** 已连好的 next：from id → to id（不可变快照） */
  nextOf: Record<string, string>
  note: string
  /** 下一步动作，由后一个快照统一回填（Hint 前缀「下一步：」是硬的） */
  next: string
}

function buildSteps(): Step[] {
  const steps: Step[] = []
  /** 算法真实写入的 next：from id → to id */
  const nextOf: Record<string, string> = {}

  const snap = (extra: Omit<Step, 'nextOf' | 'next'>): Step => ({
    ...extra,
    appended: extra.appended.slice(),
    nextChain: extra.nextChain.slice(),
    nextOf: { ...nextOf },
    next: '',
  })

  steps.push(
    snap({
      phase: 'init',
      cur: ROOT ? ROOT.id : null,
      level: 0,
      node: null,
      appended: [],
      nextChain: [],
      tail: null,
      note: `观察：root = ${INPUT_TEXT}，此时所有 next 都是 NULL，画面上还没有一条琥珀色的横向箭头。判断：第 0 层只有根节点 ${ROOT_VAL}，它既是这一层最左边的节点，也直接充当入口 cur，而 ${ROOT_VAL} 的 next 本来就该是 NULL。动作：cur = ${ROOT_VAL}，新建虚拟头 dummy 并让 tail = dummy，准备把这一层的孩子依序挂成下一层的链表。为什么：上一层连好的 next 本身就是一条从左到右的链表，顺着它走就能按左右顺序收集下一层，不需要队列。`,
    })
  )

  let curId: string | null = ROOT ? ROOT.id : null
  let level = 0

  while (curId) {
    // 1) 沿 next 把当前层整层收集出来（这就是「不用队列」的关键）
    const currentChain: string[] = []
    let walk: string | null = curId
    while (walk !== null) {
      currentChain.push(walk)
      walk = nextOf[walk] ?? null
    }

    // 2) 逐节点把它的孩子挂到 dummy + tail 上，顺便把下一层的 next 连好
    const nextChain: string[] = []
    for (const id of currentChain) {
      const node = NODES[id]
      const appended: string[] = []
      if (node.left) appended.push(node.left.id)
      if (node.right) appended.push(node.right.id)

      const prevTail = nextChain.length ? nextChain[nextChain.length - 1] : null
      if (prevTail && appended.length > 0) nextOf[prevTail] = appended[0]
      if (appended.length === 2) nextOf[appended[0]] = appended[1]
      nextChain.push(...appended)

      const tailNow = nextChain.length ? nextChain[nextChain.length - 1] : null
      const tailBefore = prevTail ? String(VAL_OF[prevTail]) : 'dummy'
      const chainStr = nextChain.map((nid) => VAL_OF[nid]).join(' → ')
      const nextInChain = currentChain[currentChain.indexOf(id) + 1] ?? null
      const kidsText =
        node.left && node.right
          ? `左孩子 ${node.left.val}、右孩子 ${node.right.val} 都非空`
          : node.left
            ? `只有左孩子 ${node.left.val}，右孩子为空`
            : node.right
              ? `只有右孩子 ${node.right.val}，左孩子为空`
              : '左右孩子都为空，是叶子'

      if (appended.length === 2) {
        steps.push(
          snap({
            phase: 'visit',
            cur: curId,
            level,
            node: id,
            appended,
            nextChain,
            tail: tailNow,
            note: `观察：本步看 node = ${node.val}，${kidsText}。判断：按先左后右把它们依次接到 tail 后面，tail 从 ${tailBefore} 前移到 ${VAL_OF[appended[1]]}，下一层链表成为 ${chainStr}，其中 ${VAL_OF[appended[0]]} 的 next 已经指向 ${VAL_OF[appended[1]]}。动作：${
              nextInChain
                ? `沿 next 从 ${node.val} 走到本层下一个节点 ${VAL_OF[nextInChain]}。`
                : `${node.val} 的 next 是 NULL，外层沿 next 只走了它一个节点，第 ${level} 层遍历结束。`
            }为什么：孩子被挂上 tail 的先后顺序恰好就是下一层从左到右的顺序，所以这一步顺便把 ${VAL_OF[appended[0]]} → ${VAL_OF[appended[1]]} 这条 next 建好了。`,
          })
        )
      } else if (appended.length === 1) {
        const cross = prevTail ? PARENT_OF[prevTail] !== PARENT_OF[appended[0]] : false
        steps.push(
          snap({
            phase: 'visit',
            cur: curId,
            level,
            node: id,
            appended,
            nextChain,
            tail: tailNow,
            note: `观察：本步看 node = ${node.val}，${kidsText}。判断：空的一侧什么都不挂，只把 ${VAL_OF[appended[0]]} 接到 tail（此时 tail = ${tailBefore}）后面，下一层链表补齐为 ${chainStr}。动作：${
              nextInChain
                ? `沿 next 从 ${node.val} 走到本层下一个节点 ${VAL_OF[nextInChain]}。`
                : `${node.val} 的 next 是 NULL，本层最后一个节点处理完，内层循环结束。`
            }为什么：跳过空孩子不会打乱顺序，反倒是 ${tailBefore} → ${VAL_OF[appended[0]]} 这条${cross ? '跨子树' : ''}连接，把第 ${level + 1} 层真正串成了一条链。`,
          })
        )
      } else {
        const leafWhy = nextInChain
          ? PARENT_OF[id] !== PARENT_OF[nextInChain]
            ? `${node.val} 与 ${VAL_OF[nextInChain]} 分属不同父节点，各自的左右孩子永远走不到对方，只有 next 能把同一层的节点串起来。`
            : `${node.val} 与 ${VAL_OF[nextInChain]} 是同一个父节点的两个孩子，这条 next 在上一层处理时就已经连好了。`
          : '叶子不贡献任何节点，dummy.next 是否为空才决定还有没有下一层。'
        steps.push(
          snap({
            phase: 'visit',
            cur: curId,
            level,
            node: id,
            appended,
            nextChain,
            tail: tailNow,
            note: `观察：本步看 node = ${node.val}，${kidsText}。判断：它没有任何节点可以挂，tail ${tailBefore === 'dummy' ? '仍然停在 dummy 上' : `仍然停在 ${tailBefore}`}，下一层链表${nextChain.length ? `已经挂入 ${chainStr}` : '还是空的'}。动作：${
              nextInChain
                ? `沿 next 走到本层下一个节点 ${VAL_OF[nextInChain]}。`
                : `${node.val} 的 next 是 NULL，它是本层最后一个节点，内层循环结束。`
            }为什么：${leafWhy}`,
          })
        )
      }
    }

    // 3) cur = dummy.next：本层处理完就下沉到下一层，dummy 每层重建
    const newHead: string | null = nextChain.length ? nextChain[0] : null
    if (newHead) {
      const builtStr = nextChain.map((nid) => VAL_OF[nid]).join(' → ')
      level += 1
      steps.push(
        snap({
          phase: 'level',
          cur: newHead,
          level,
          node: null,
          appended: [],
          nextChain: [],
          tail: null,
          note: `观察：第 ${level - 1} 层处理完，dummy.next = ${VAL_OF[newHead]}，构造出的第 ${level} 层 next 已是 ${builtStr}，末尾 ${VAL_OF[nextChain[nextChain.length - 1]]} 的 next 保持 NULL。判断：${VAL_OF[newHead]} 就是第 ${level} 层的入口，于是 cur = dummy.next = ${VAL_OF[newHead]}。动作：重新建立 dummy、tail 指回 dummy，开始沿 next 遍历第 ${level} 层。为什么：dummy 必须每层重建，复用同一个会让 dummy.next 一直停在 ${VAL_OF[newHead]}；cur 也只能靠 dummy.next 推进，写成 cur = cur.left 会在左孩子缺失时走丢。`,
        })
      )
    }
    curId = newHead
  }

  steps.push(
    snap({
      phase: 'done',
      cur: null,
      level: null,
      node: null,
      appended: [],
      nextChain: [],
      tail: null,
      note: `观察：最后 cur = dummy.next 取到 NULL，外层循环结束，全树的 next 都已确定：2 → 3、4 → 5、5 → 7，其余节点（1、3、7）的 next 保持 NULL。判断：顺着 next 按层序读出，每层末尾用 # 表示 NULL，就是 ${OUTPUT_TEXT}，与示例 1 的输出一致。动作：返回 root，答案就是这棵接好 next 的树。为什么：全树 6 个节点各被访问两次（一次作为当前层节点、一次作为孩子被挂入），时间 O(n)；全程只有 cur、dummy、tail、node 四个指针，额外空间 O(1)。`,
    })
  )

  // 「下一步动作」由后一个快照统一回填，保证与算法真实顺序一致
  steps.forEach((s, i) => {
    const b = steps[i + 1]
    if (!b) return
    if (b.phase === 'done') {
      s.next = 'cur = dummy.next = NULL，外层循环结束，读出答案'
    } else if (b.phase === 'level' && b.cur) {
      s.next = `cur = dummy.next = ${VAL_OF[b.cur]}，进入第 ${b.level} 层`
    } else if (b.phase === 'visit' && b.node) {
      const kid = NODES[b.node]
      const vals = b.appended.map((nid) => VAL_OF[nid])
      if (vals.length === 2) {
        s.next = `把 node = ${VAL_OF[b.node]} 的左孩子 ${vals[0]}、右孩子 ${vals[1]} 依次接到 tail 后面`
      } else if (vals.length === 1) {
        s.next = `把 node = ${VAL_OF[b.node]} 的${kid.left ? '左' : '右'}孩子 ${vals[0]} 接到 tail 后面`
      } else {
        s.next = `沿 next 看 node = ${VAL_OF[b.node]}，它是叶子，没有孩子可挂`
      }
    }
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

const W = 680
const PAD_L = 66
const PAD_R = 66
const NODE_R = 22
const TOP = 52
const LEVEL_GAP = 78
const SLOT = (W - PAD_L - PAD_R) / ORDER.length
const MAX_DEPTH = Math.max(...Object.values(DEPTH_OF))
const H = TOP + MAX_DEPTH * LEVEL_GAP + NODE_R + 62

const xOf = (id: string) => PAD_L + SLOT * (ORDER.indexOf(id) + 0.5)
const yOf = (id: string) => TOP + DEPTH_OF[id] * LEVEL_GAP

type NodeState = 'active' | 'hung' | 'chained' | 'settled' | 'idle'

/** 圆 = 节点，颜色只表示当前状态；琥珀虚线圈 = cur，节点上方文字给出指针名 */
const SKIN: Record<NodeState, { fill: string; stroke: string; text: string; width: number; dash?: string }> = {
  active: { fill: 'hsl(var(--amber-soft))', stroke: TONE.amber, text: TONE.amber, width: 3 },
  hung: { fill: 'hsl(var(--teal-soft))', stroke: TONE.teal, text: TONE.teal, width: 3 },
  chained: { fill: 'hsl(var(--card))', stroke: TONE.teal, text: TONE.teal, width: 2.5 },
  settled: { fill: 'hsl(var(--easy-soft))', stroke: TONE.easy, text: TONE.easy, width: 2.5 },
  idle: { fill: 'hsl(var(--card))', stroke: TONE.muted, text: 'hsl(var(--ink-soft))', width: 2, dash: '4 3' },
}

const CHIP: Record<'ok' | 'now' | 'todo', string> = {
  ok: 'border-[hsl(var(--easy))]/40 bg-[hsl(var(--easy-soft))] text-[hsl(var(--easy))]',
  now: 'border-[hsl(var(--amber))]/40 bg-[hsl(var(--amber-soft))] text-[hsl(var(--amber))]',
  todo: 'border-border bg-card text-ink-soft',
}

function Stage(step: Step) {
  const done = step.phase === 'done'
  const curVal = step.cur ? VAL_OF[step.cur] : null
  const nodeVal = step.node ? VAL_OF[step.node] : null
  const linkedCount = Object.keys(step.nextOf).length

  const stateOf = (id: string): NodeState => {
    if (id === step.node) return 'active'
    if (step.appended.includes(id)) return 'hung'
    if (step.nextChain.includes(id)) return 'chained'
    if (step.level === null || DEPTH_OF[id] <= step.level) return 'settled'
    return 'idle'
  }

  const pointerLabel = (id: string) => {
    const parts: string[] = []
    if (id === step.cur) parts.push('cur')
    if (id === step.node) parts.push('node')
    if (step.appended.includes(id)) parts.push('挂入')
    return parts.join(' · ')
  }

  const levelStatus = (d: number): { label: string; tone: 'ok' | 'now' | 'todo' } => {
    if (step.level === null || d < step.level) return { label: 'next 已连好', tone: 'ok' }
    if (d === step.level) return { label: '正在遍历', tone: 'now' }
    return { label: '未处理', tone: 'todo' }
  }

  // 当前层的琥珀色块（包住这一层的节点、标签与它们之间的 next 箭头）
  const bandNodes = step.level === null ? [] : BY_LEVEL[step.level]
  const bandY = bandNodes.length ? yOf(bandNodes[0]) : 0
  const bandX1 = bandNodes.length ? Math.min(...bandNodes.map(xOf)) - NODE_R - 14 : 0
  const bandX2 = bandNodes.length ? Math.max(...bandNodes.map(xOf)) + NODE_R + 14 : 0

  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full select-none">
        <defs>
          {[
            { id: 't74-arrow-linked', color: TONE.amber },
            { id: 't74-arrow-idle', color: TONE.muted },
          ].map((m) => (
            <marker
              key={m.id}
              id={m.id}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M0,1 L10,5 L0,9 z" fill={m.color} />
            </marker>
          ))}
        </defs>

        {/* 1. 当前层的色块，画在最底层 */}
        {bandNodes.length > 0 && (
          <rect
            x={bandX1}
            y={bandY - NODE_R - 26}
            width={bandX2 - bandX1}
            height={2 * NODE_R + 48}
            rx={14}
            fill="hsl(var(--amber) / 0.1)"
            stroke="hsl(var(--amber) / 0.4)"
            strokeWidth={1.5}
            strokeDasharray="6 4"
          />
        )}

        {/* 2. 树边：父子直线，后画的圆盖住端点 */}
        {ORDER.map((id) =>
          [NODES[id].left, NODES[id].right]
            .filter((c): c is TreeNode => c !== null)
            .map((child) => (
              <line
                key={`${id}-${child.id}`}
                x1={xOf(id)}
                y1={yOf(id)}
                x2={xOf(child.id)}
                y2={yOf(child.id)}
                stroke="hsl(var(--border))"
                strokeWidth={2}
              />
            ))
        )}

        {/* 3. next 横向箭头：同层相邻节点之间，琥珀实线 = 已连好，灰虚线 = 还没连 */}
        {ARROWS.map(({ from, to }) => {
          const linked = step.nextOf[from] === to
          const y = yOf(from)
          return (
            <line
              key={`next-${from}-${to}`}
              x1={xOf(from) + NODE_R + 3}
              y1={y}
              x2={xOf(to) - NODE_R - 8}
              y2={y}
              stroke={linked ? TONE.amber : TONE.muted}
              strokeWidth={linked ? 3 : 2}
              strokeDasharray={linked ? undefined : '5 4'}
              markerEnd={linked ? 'url(#t74-arrow-linked)' : 'url(#t74-arrow-idle)'}
            />
          )
        })}

        {/* 4. 每层末尾的 next = NULL（输出里的 # 就落在这里） */}
        {BY_LEVEL.map((lv, d) => {
          const last = lv[lv.length - 1]
          const y = yOf(last)
          const linked = step.level === null || d <= step.level
          const x0 = xOf(last) + NODE_R + 10
          return (
            <g key={`null-${last}`}>
              <line
                x1={x0}
                y1={y}
                x2={x0 + 14}
                y2={y}
                stroke={linked ? TONE.amber : TONE.muted}
                strokeWidth={linked ? 2.5 : 2}
                strokeDasharray={linked ? undefined : '5 4'}
                markerEnd={linked ? 'url(#t74-arrow-linked)' : 'url(#t74-arrow-idle)'}
              />
              <text
                x={x0 + 20}
                y={y + 4}
                fontSize="10"
                fontWeight="600"
                className="font-code"
                fill={linked ? TONE.amber : 'hsl(var(--ink-soft))'}
              >
                NULL
              </text>
            </g>
          )
        })}

        {/* 5. cur 的琥珀虚线圈：不靠颜色也能从节点上方的 cur 文字读出 */}
        {step.cur && (
          <circle
            cx={xOf(step.cur)}
            cy={yOf(step.cur)}
            r={NODE_R + 7}
            fill="none"
            stroke={TONE.amber}
            strokeWidth={2.5}
            strokeDasharray="5 4"
          />
        )}

        {/* 6. 节点圆 + 值 + 指针/状态文字 */}
        {ORDER.map((id) => {
          const st = stateOf(id)
          const skin = SKIN[st]
          const label = pointerLabel(id)
          return (
            <g key={id} className="demo-water">
              <circle
                cx={xOf(id)}
                cy={yOf(id)}
                r={NODE_R}
                fill={skin.fill}
                stroke={skin.stroke}
                strokeWidth={skin.width}
                strokeDasharray={skin.dash}
              />
              <text
                x={xOf(id)}
                y={yOf(id) + 6}
                textAnchor="middle"
                fontSize="17"
                fontWeight="700"
                className="font-code"
                fill={skin.text}
              >
                {VAL_OF[id]}
              </text>
              {label && (
                <text
                  x={xOf(id)}
                  y={yOf(id) - NODE_R - 10}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="700"
                  className="font-code"
                  fill={st === 'hung' ? TONE.teal : TONE.amber}
                >
                  {label}
                </text>
              )}
              {step.tail === id && (
                <text
                  x={xOf(id)}
                  y={yOf(id) + NODE_R + 18}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="700"
                  className="font-code"
                  fill={TONE.teal}
                >
                  tail
                </text>
              )}
            </g>
          )
        })}

        {/* 7. 底部说明 */}
        <text x={W / 2} y={H - 10} textAnchor="middle" fontSize="11" fill="hsl(var(--ink-soft))">
          横向箭头 = next 指针：琥珀实线已连好，灰色虚线还没连；每层末尾指向 NULL
        </text>
      </svg>

      {/* 每层 next 的文字状态：与图例同色，不靠颜色也能读 */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px]">
        {BY_LEVEL.map((_, d) => {
          const s = levelStatus(d)
          return (
            <span key={d} className={`rounded-md border px-2 py-0.5 ${CHIP[s.tone]}`}>
              第 <b className="font-code">{d}</b> 层 · {s.label}
            </span>
          )
        })}
      </div>

      {/* 下一层链表：dummy + tail 正在构造的对象 */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px]">
        <span className="shrink-0 text-ink-soft">下一层链表</span>
        <span className="rounded-md border border-dashed border-border px-2 py-0.5 font-code text-ink-soft">
          dummy
        </span>
        {step.nextChain.map((id) => (
          <span key={id} className="flex items-center gap-1.5">
            <span className="text-ink-soft">→</span>
            <span
              className={
                step.tail === id
                  ? 'rounded-md border border-[hsl(var(--teal))] bg-[hsl(var(--teal-soft))] px-2 py-0.5 font-code font-bold text-[hsl(var(--teal))]'
                  : 'rounded-md border border-[hsl(var(--teal))]/40 bg-card px-2 py-0.5 font-code text-[hsl(var(--teal))]'
              }
            >
              {VAL_OF[id]}
            </span>
            {step.tail === id && (
              <span className="text-[10px] font-semibold text-[hsl(var(--teal))]">tail</span>
            )}
          </span>
        ))}
        <span className="text-ink-soft">→</span>
        <span className="rounded-md border border-border px-2 py-0.5 font-code text-ink-soft">NULL</span>
      </div>

      <Badges className="justify-center">
        <Stat label="cur 当前层入口" value={curVal ?? 'NULL'} tone="amber" />
        <Stat label="node 正在处理" value={nodeVal ?? '—'} tone="teal" />
        <Stat label="已连好的 next" value={`${linkedCount} 条`} tone="easy" />
        {!done && <Hint>{step.next}</Hint>}
        {done && (
          <Answer>
            输出 <b className="font-code">{OUTPUT_TEXT}</b>（# = 每层末尾 NULL）
          </Answer>
        )}
      </Badges>
    </div>
  )
}

export default function PopulatingNextRightPointersInEachNodeIiDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="用上一层的 next 串出下一层链表"
      info={`示例取自题解示例 1：root = ${INPUT_TEXT}（层序表示，null 为空节点），输出 ${OUTPUT_TEXT}，共 ${steps.length} 步。题解的边界：空树直接返回 NULL，单节点树的 next 保持 NULL；这里用的是 3 层 6 节点的非空树，5 与 7 分属不同父节点，正好看清 dummy + tail 怎么顺着上一层的 next 把下一层串成一条链。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '正在处理的 node（琥珀圆）；琥珀虚线圈 = cur；琥珀实线箭头 = 已连好的 next' },
        { color: TONE.teal, label: '已挂进下一层链表，tail 指向最后挂入的那个' },
        { color: TONE.easy, label: '该层的 next 已全部连好' },
        { color: TONE.muted, label: '尚未处理 / next 还没连（灰色虚线圆与虚线箭头）' },
      ]}
    />
  )
}
