import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badges, Cell, Hint, Stat, TONE } from './stage'

/* ------------------------------------------------------------------ */
/* 82. 二叉树的右视图 —— 模式 E：树 + BFS 层序遍历，每层取最右节点        */
/* ------------------------------------------------------------------ */

/** 题解示例 1 的层序数组（null 为空节点），右视图为 [1, 3, 4] */
const LEVELS: (number | null)[] = [1, 2, 3, null, 5, null, 4]
const INPUT_TEXT = `[${LEVELS.map((v) => (v === null ? 'null' : v)).join(', ')}]`

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

const ROOT_ID = 'R'
const ROOT = buildTree(LEVELS, 0, ROOT_ID)

const NODES: Record<string, TreeNode> = {}
const VAL_OF: Record<string, number> = {}
const DEPTH_OF: Record<string, number> = {}
/** 中序展开：同一层节点的 x 槽位按中序顺序分配 */
const ORDER: string[] = []
let MAX_DEPTH = 0

function collect(node: TreeNode | null, depth: number) {
  if (!node) return
  NODES[node.id] = node
  VAL_OF[node.id] = node.val
  DEPTH_OF[node.id] = depth
  MAX_DEPTH = Math.max(MAX_DEPTH, depth)
  collect(node.left, depth + 1)
  ORDER.push(node.id)
  collect(node.right, depth + 1)
}
collect(ROOT, 0)

interface Step {
  phase: 'init' | 'level' | 'dequeue' | 'done'
  /** 本步出队的节点 id（队首）；init / level / done 为 null */
  cur: string | null
  /** 当前层的深度（根为第 0 层）；init / done 为 -1 */
  level: number
  /** 本层节点数快照 levelSize */
  levelSize: number
  /** 本层已出队的个数 */
  doneInLevel: number
  /** 队列快照，队首在左，存节点 id */
  queue: string[]
  /** 已确定为本层最右、记入答案的节点 */
  rightIds: string[]
  /** 已出队但不是本层最右的节点 */
  passedIds: string[]
  /** 右视图结果快照 */
  result: number[]
  note: string
  /** 下一步动作（由后一个快照回填，保证与步骤数据一致） */
  next: string
}

function buildSteps(): Step[] {
  const steps: Step[] = []
  const rightIds: string[] = []
  const passedIds: string[] = []
  const result: number[] = []
  let maxWidth = 0

  steps.push({
    phase: 'init',
    cur: null,
    level: -1,
    levelSize: 0,
    doneInLevel: 0,
    queue: [ROOT_ID],
    rightIds: [],
    passedIds: [],
    result: [],
    next: '',
    note: `观察：输入 root = ${INPUT_TEXT}（层序表示，null 为空节点），共 ${ORDER.length} 个节点、${MAX_DEPTH + 1} 层。判断：右视图就是每一层最右边那个节点，所以按层遍历、每层只留最后一个。动作：根节点 ${VAL_OF[ROOT_ID]} 先入队。为什么：BFS 保证外层循环开始时队列里正好是第 d 层的全部节点，且按从左到右排列，最后一个出队的必然是最右节点。`,
  })

  // frontier = 当前队列（队首在左）；每一轮外层循环处理完整的一层
  let frontier: string[] = [ROOT_ID]

  while (frontier.length > 0) {
    const levelIds = frontier
    const levelSize = levelIds.length
    const depth = DEPTH_OF[levelIds[0]]
    const nextLevel: string[] = []
    maxWidth = Math.max(maxWidth, levelSize)

    steps.push({
      phase: 'level',
      cur: null,
      level: depth,
      levelSize,
      doneInLevel: 0,
      queue: levelIds.slice(),
      rightIds: rightIds.slice(),
      passedIds: passedIds.slice(),
      result: result.slice(),
      next: '',
      note: `观察：队列 = [${levelIds.map((id) => VAL_OF[id]).join(', ')}]，正好是第 ${depth} 层的全部 ${levelSize} 个节点。判断：先按此刻的队列取出快照 levelSize = ${levelSize}，这一轮只处理这 ${levelSize} 个。动作：从队首 ${VAL_OF[levelIds[0]]} 开始依次出队，本层新入队的子节点留给下一层。为什么：levelSize 必须在处理本层之前取快照，否则边出队边入队会让队列变长，两层就串在一起了。`,
    })

    for (let i = 0; i < levelSize; i++) {
      const id = levelIds[i]
      const node = NODES[id]
      const kids: string[] = []
      if (node.left) kids.push(node.left.id)
      if (node.right) kids.push(node.right.id)
      nextLevel.push(...kids)

      const isLast = i === levelSize - 1
      if (isLast) {
        rightIds.push(id)
        result.push(node.val)
      } else {
        passedIds.push(id)
      }

      const kidText = kids.length
        ? `把子节点 ${kids.map((k) => VAL_OF[k]).join('、')} 按先左后右入队，它们是第 ${depth + 1} 层的节点`
        : '它没有子节点，队列不新增元素'

      steps.push({
        phase: 'dequeue',
        cur: id,
        level: depth,
        levelSize,
        doneInLevel: i + 1,
        queue: [...levelIds.slice(i + 1), ...nextLevel],
        rightIds: rightIds.slice(),
        passedIds: passedIds.slice(),
        result: result.slice(),
        next: '',
        note: isLast
          ? `观察：队首 ${node.val} 出队，它是第 ${depth} 层的第 ${levelSize}/${levelSize} 个，也就是最后一个。判断：本层没有比它更靠右的节点，站在右侧能直接看到它。动作：把 ${node.val} 记入结果，result = [${result.join(', ')}]${kids.length ? `，同时${kidText}` : '；它没有子节点，队列不新增元素'}。为什么：队列按从左到右保存本层节点，最后一个出队的必然是该层最右节点。`
          : `观察：队首 ${node.val} 出队，它是第 ${depth} 层的第 ${i + 1}/${levelSize} 个。判断：本层它右边还有 ${levelSize - i - 1} 个节点挡着，从右侧看不到它，不记录。动作：${kidText}，result 保持 [${result.join(', ')}]。为什么：每一层只有最后一个出队的节点才暴露在右侧。`,
      })
    }

    frontier = nextLevel
  }

  steps.push({
    phase: 'done',
    cur: null,
    level: -1,
    levelSize: 0,
    doneInLevel: 0,
    queue: [],
    rightIds: rightIds.slice(),
    passedIds: passedIds.slice(),
    result: result.slice(),
    next: '',
    note: `观察：队列已空，第 0 层到第 ${MAX_DEPTH} 层各留下了一个最右节点，共 ${result.length} 个。判断：result 从上到下就是右视图。动作：答案 = [${result.join(', ')}]，读法就是每层最右节点的值。为什么：每个节点恰好入队、出队各一次，时间 O(n)；队列最多同时存放一整层节点，空间 O(w)，本题最大宽度 w = ${maxWidth}。`,
  })

  // 「下一步动作」一律由后一个快照推导，Hint 不会描述本步已完成的动作
  steps.forEach((s, i) => {
    const b = steps[i + 1]
    if (!b) return
    if (b.phase === 'level') {
      s.next = `进入第 ${b.level} 层，先记下 levelSize = ${b.levelSize}`
    } else if (b.phase === 'dequeue' && b.cur !== null) {
      const v = VAL_OF[b.cur]
      s.next =
        b.doneInLevel === b.levelSize
          ? `出队本层第 ${b.doneInLevel}/${b.levelSize} 个节点 ${v}，它是本层最右，记入结果`
          : `出队本层第 ${b.doneInLevel}/${b.levelSize} 个节点 ${v}，不是最右，不记录`
    } else if (b.phase === 'done') {
      s.next = '队列已空，输出右视图答案'
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
const BAND_H = 68
const H = TOP + MAX_DEPTH * LEVEL_GAP + 64

type NodeState = 'current' | 'right' | 'queued' | 'passed' | 'idle'

const NODE_FILL: Record<NodeState, string> = {
  current: 'hsl(var(--amber-soft))',
  right: 'hsl(var(--easy-soft))',
  queued: 'hsl(var(--teal-soft))',
  passed: 'hsl(var(--hard-soft))',
  idle: 'hsl(var(--ink))',
}

const NODE_FILL_OPACITY: Record<NodeState, number> = {
  current: 1,
  right: 1,
  queued: 1,
  passed: 1,
  /** 与 TONE.muted（hsl(var(--ink) / 0.18)）一致 */
  idle: 0.18,
}

const NODE_STROKE: Record<NodeState, string> = {
  current: 'hsl(var(--amber))',
  right: 'hsl(var(--easy))',
  queued: 'hsl(var(--teal))',
  passed: 'hsl(var(--hard))',
  idle: 'hsl(var(--border))',
}

const NODE_TEXT_FILL: Record<NodeState, string> = {
  current: 'hsl(var(--amber))',
  right: 'hsl(var(--easy))',
  queued: 'hsl(var(--teal))',
  passed: 'hsl(var(--hard))',
  idle: 'hsl(var(--ink-soft))',
}

const NODE_STROKE_W: Record<NodeState, number> = {
  current: 3,
  right: 2.5,
  queued: 2,
  passed: 2,
  idle: 2,
}

/** 状态文字：不靠颜色也能读出节点状态 */
const NODE_LABEL: Record<NodeState, string> = {
  current: '出队',
  right: '记入',
  queued: '队列中',
  passed: '挡住',
  idle: '未入队',
}

function Stage(step: Step) {
  const slot = (W - PAD_L - PAD_R) / ORDER.length
  const x = (id: string) => PAD_L + slot * (ORDER.indexOf(id) + 0.5)
  const y = (id: string) => TOP + DEPTH_OF[id] * LEVEL_GAP

  const stateOf = (id: string): NodeState => {
    if (step.cur === id) return 'current'
    if (step.rightIds.includes(id)) return 'right'
    if (step.queue.includes(id)) return 'queued'
    if (step.passedIds.includes(id)) return 'passed'
    return 'idle'
  }

  const bandTop = TOP + step.level * LEVEL_GAP - BAND_H / 2
  const shown = `[${step.result.join(', ')}]`

  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full select-none">
        {/* 0. 当前处理的层：半透明色块包住整层，先画以压在边与节点下方 */}
        {step.level >= 0 && (
          <g>
            <rect
              x={10}
              y={bandTop}
              width={W - 20}
              height={BAND_H}
              rx={12}
              fill="hsl(var(--amber))"
              fillOpacity={0.15}
            />
            <text
              x={14}
              y={bandTop - 8}
              textAnchor="start"
              fontSize="12"
              fontWeight="700"
              className="font-code"
              fill="hsl(var(--amber))"
            >
              {`第 ${step.level} 层 · levelSize = ${step.levelSize}`}
            </text>
          </g>
        )}

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

        {/* 2. 节点圆 */}
        {ORDER.map((id) => {
          const st = stateOf(id)
          return (
            <g key={id}>
              <circle
                cx={x(id)}
                cy={y(id)}
                r={NODE_R}
                fill={NODE_FILL[st]}
                fillOpacity={NODE_FILL_OPACITY[st]}
                stroke={NODE_STROKE[st]}
                strokeWidth={NODE_STROKE_W[st]}
              />
              <text
                x={x(id)}
                y={y(id) + 6}
                textAnchor="middle"
                fontSize="17"
                fontWeight="700"
                className="font-code"
                fill={NODE_TEXT_FILL[st]}
              >
                {VAL_OF[id]}
              </text>
            </g>
          )
        })}

        {/* 3. 状态文字标签，保证不靠颜色区分状态 */}
        {ORDER.map((id) => {
          const st = stateOf(id)
          return (
            <text
              key={`label-${id}`}
              x={x(id) + NODE_R + 8}
              y={y(id) + 4}
              textAnchor="start"
              fontSize="11"
              fontWeight="700"
              className="font-code"
              fill={NODE_TEXT_FILL[st]}
            >
              {NODE_LABEL[st]}
            </text>
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
          null 位置没有节点，不画在舞台上；队列里只放真实节点
        </text>
      </svg>

      {/* 队列快照：队首在左，另有文字标注 */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px]">
        <span className="text-ink-soft">
          队列（队首在左，共 <b className="font-code text-sm">{step.queue.length}</b> 个）
        </span>
        {step.queue.length === 0 ? (
          <span className="font-code text-ink-soft">（空）</span>
        ) : (
          <>
            <span className="font-code text-[10px] font-bold text-[hsl(var(--amber))]">队首→</span>
            {step.queue.map((id, k) => (
              <Cell key={`${id}-${k}`} size="sm" state={k === 0 ? 'active' : 'new'}>
                {VAL_OF[id]}
              </Cell>
            ))}
          </>
        )}
      </div>

      <Badges className="justify-center">
        <Stat label="当前层" value={step.level < 0 ? '—' : step.level} tone="amber" />
        <Stat
          label="本层已出队"
          value={step.levelSize === 0 ? '—' : `${step.doneInLevel}/${step.levelSize}`}
          tone="teal"
        />
        <Stat label="右视图" value={shown} tone="easy" />
        {step.phase !== 'done' && <Hint>{step.next}</Hint>}
        {step.phase === 'done' && (
          <Answer>
            右视图 = <b className="font-code">{shown}</b>（每层取最右，共{' '}
            <b className="font-code">{step.result.length}</b> 个）
          </Answer>
        )}
      </Badges>
    </div>
  )
}

export default function BinaryTreeRightSideViewDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="BFS 层序遍历，每层取最右节点"
      info={`输入取自题解示例 1：root = ${INPUT_TEXT}（层序表示，null 为空节点），右视图为 [1, 3, 4]，共 ${steps.length} 步。BFS 让队列里始终是从左到右的同一层节点，每层最后一个出队的节点就是站在右侧能看到的节点。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '本步出队（队列队首）' },
        { color: TONE.teal, label: '队列中，待出队' },
        { color: TONE.easy, label: '本层最右 → 记入右视图' },
        { color: TONE.hard, label: '同层已出队，被右侧挡住' },
        { color: TONE.muted, label: '尚未入队' },
      ]}
    />
  )
}
