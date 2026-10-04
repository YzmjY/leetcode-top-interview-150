import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badges, Cell, Hint, Stat, TONE, type CellState } from './stage'

/* ------------------------------------------------------------------ */
/* 85. 二叉树的锯齿形层序遍历 —— 模式 E：树的层序 BFS + 按方向落位        */
/*     （偶数层左→右写入 level[i]，奇数层右→左写入 level[levelSize-1-i]） */
/* ------------------------------------------------------------------ */

/** 官方示例 1 的层序数组，null 表示该位置没有节点（输出 [[3],[20,9],[15,7]]） */
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

const MAX_DEPTH = Math.max(...ORDER.map((id) => DEPTH_OF[id]))

/** 'ltr' = 本层左→右；'rtl' = 本层右→左（第 0 层为 ltr，逐层交替） */
type Direction = 'ltr' | 'rtl'

const dirLabel = (d: Direction) => (d === 'ltr' ? '本层：左→右' : '本层：右→左')
const dirArrow = (d: Direction) => (d === 'ltr' ? '→' : '←')

interface Step {
  phase: 'init' | 'level' | 'dequeue' | 'done'
  /** 刚出队（正在处理）的节点；init / level / done 为 null */
  cur: string | null
  /** 当前层方向；done 步保留最后一层翻转后的值，画面不再显示方向条 */
  dir: Direction
  /** 当前层的层号 */
  levelIndex: number
  /** 当前层的节点个数 levelSize */
  levelSize: number
  /** 本层已出队的节点数 i（= 下一个待写下标） */
  processed: number
  /** 本层已写入值的位置，null 表示还是空位 */
  level: (number | null)[]
  /** 本步刚写入的下标，-1 表示没有新写入 */
  slot: number
  /** BFS 队列快照，队首在左；队首即下一个出队节点 */
  queue: string[]
  /** 已完成的层（按输出方向排好的值） */
  result: number[][]
  /** 当前层全部节点按从左到右的顺序（用于方向对照） */
  levelNodes: string[]
  /** 已收集完的层数 */
  doneLevels: number
  note: string
  /** 真正的下一步动作，供 Hint 使用；done 步为 null */
  hint: string | null
}

/** 从队首起连续取 size 个节点 → 本层节点（BFS 出队顺序恒为左→右） */
function levelOf(queue: string[], size: number): string[] {
  const out: string[] = []
  for (let k = 0; k < size; k++) out.push(queue[k])
  return out
}

function buildSteps(): Step[] {
  const steps: Step[] = []
  const queue: string[] = []
  const level: (number | null)[] = []
  const result: number[][] = []
  let dir: Direction = 'ltr'
  let levelIndex = 0
  let levelSize = 0
  let processed = 0
  let slot = -1
  let cur: string | null = null
  let doneLevels = 0
  let levelNodes: string[] = []

  const snap = (phase: Step['phase'], note: string, hint: string | null): Step => ({
    phase,
    cur,
    dir,
    levelIndex,
    levelSize,
    processed,
    level: level.slice(),
    slot,
    queue: queue.slice(),
    result: result.map((row) => row.slice()),
    levelNodes: levelNodes.slice(),
    doneLevels,
    note,
    hint,
  })

  // 1. 初始状态：根节点入队，方向标志初值 true（第 0 层左→右）
  queue.push(ROOT_ID)
  steps.push(
    snap(
      'init',
      `观察：输入层序数组 ${INPUT_TEXT}，null 是不存在的节点位置，树共 3 层。判断：BFS 的出队顺序恒为从左到右，锯齿形只体现在「把值写进 level 的哪个下标」，方向标志初值 leftToRight = true。动作：根节点 3 入队。为什么：每一层只翻转一次方向，先入队根节点才能开始第 0 层。`,
      `出队队首 ${VAL_OF[queue[0]]} 并开启第 0 层（左→右）`
    )
  )

  // 2. BFS 主循环：每层先固定 levelSize，再逐节点出队、按方向落位并入队孩子
  while (queue.length > 0) {
    levelSize = queue.length
    levelNodes = levelOf(queue, levelSize)
    level.length = 0
    for (let k = 0; k < levelSize; k++) level.push(null)
    processed = 0
    slot = -1
    cur = null

    steps.push(
      snap(
        'level',
        `观察：队列里正好是本层 ${levelSize} 个节点 ${levelNodes.map((id) => VAL_OF[id]).join('、')}，都按左→右的顺序排列。判断：levelSize = ${levelSize}，所以先造一个长度固定为 ${levelSize} 的 level 切片（内容全是空位）；本层方向 ${dirArrow(dir)} ${dir === 'ltr' ? '左→右' : '右→左'}，下标要按这个方向分配。动作：从队首开始逐个出队。为什么：先定下长度，反向层才能把第 i 个值写到 level[levelSize-1-i] 而不越界。`,
        `出队队首 ${VAL_OF[queue[0]]}，按${dir === 'ltr' ? '左→右' : '右→左'}写下标`
      )
    )

    for (let i = 0; i < levelSize; i++) {
      const id = queue.shift() as string
      const node = NODES[id]
      cur = id
      processed = i + 1
      slot = dir === 'ltr' ? i : levelSize - 1 - i
      level[slot] = node.val

      const kids: string[] = []
      if (node.left) {
        queue.push(node.left.id)
        kids.push(String(node.left.val))
      }
      if (node.right) {
        queue.push(node.right.id)
        kids.push(String(node.right.val))
      }

      const tail =
        queue.length === 0
          ? '队列已空，这一层之后遍历结束。'
          : `判断：本层还剩 ${levelSize - processed} 个节点未出队，${kids.length ? `孩子 ${kids.join('、')} 已按左→右入队（队尾）` : '它没有孩子，队列不新增节点'}。动作：${levelSize - processed > 0 ? `继续出队本层下一个节点 ${VAL_OF[queue[0]]}` : '本层收尾，把方向翻转一次，再开始下一层'}。`

      steps.push(
        snap(
          'dequeue',
          `观察：出队本层第 ${i} 个节点 ${node.val}${kids.length ? `，它有孩子 ${kids.join('、')}（按左→右入队，不受本层方向影响）` : '，它是叶子，没有孩子入队'}。判断：本层是第 ${levelIndex} 层、方向${dir === 'ltr' ? '左→右' : '右→左'}，所以这个值落在下标 ${slot}（${dir === 'ltr' ? `${i}，正着数` : `${levelSize} - 1 - ${i} = ${slot}，倒着数`}）。动作：写入 level[${slot}]，得到 [${level.map((v) => (v === null ? '空' : v)).join(', ')}]。${tail}`,
          queue.length === 0
            ? '队列已空，本层收尾后结束遍历'
            : levelSize - processed > 0
              ? `出队本层第 ${i + 1} 个节点 ${VAL_OF[queue[levelSize - processed - 1]]}，写入下标 ${dir === 'ltr' ? i + 1 : levelSize - 2 - i}`
              : `本层 ${levelSize} 个值已填满，把它加入结果并翻转方向`
        )
      )
    }

    // 本层已填满（level 中不再有空位），按下标顺序存进结果
    result.push(level.map((v) => v ?? 0))
    doneLevels = result.length
    cur = null
    slot = -1
    const flipped: Direction = dir === 'ltr' ? 'rtl' : 'ltr'

    if (queue.length === 0) {
      steps.push(
        snap(
          'dequeue',
          `观察：第 ${levelIndex} 层的 ${levelSize} 个下标全部填满，level = [${level.join(', ')}]，队列随之变空。判断：这已经是最后一层，把 level 追加到结果后（第 ${levelIndex} 层方向 ${dirArrow(dir)}），方向取反成 ${dirArrow(flipped)} 已经没有下一层可用。动作：追加本层并结束循环。为什么：levelSize 由队列长度决定，最后一层即使不满也天然正确。`,
          '队列已空，输出锯齿形结果'
        )
      )
    } else {
      const nextSize = queue.length
      steps.push(
        snap(
          'dequeue',
          `观察：第 ${levelIndex} 层的 ${levelSize} 个下标全部填满，level = [${level.join(', ')}]。判断：本层方向 ${dirArrow(dir)} 已经用完，结果追加这一层；下一层方向取反为 ${dirArrow(flipped)}。动作：翻转方向标志，第 ${levelIndex + 1} 层按${flipped === 'ltr' ? '左→右' : '右→左'}落位，队列里已有 ${nextSize} 个节点。为什么：方向必须在整层处理完之后才翻转，先翻转会整体错位。`,
          `开始第 ${levelIndex + 1} 层（${flipped === 'ltr' ? '左→右' : '右→左'}），已入队 ${nextSize} 个节点`
        )
      )
    }

    dir = flipped
    levelIndex += 1
  }

  // 3. 结论
  cur = null
  steps.push(
    snap(
      'done',
      `观察：队列为空，所有 ${ORDER.length} 个节点都出队并写入过一次。判断：每层方向交替，得到 [[${result.map((row) => row.join(',')).join('], [')}]]。动作：按层顺序读出答案即可，空树返回空结果、单节点返回 [[1]]。为什么：每个节点入队出队各一次、写入 level 一次，时间 O(n)；队列最多存一层宽度 w，加上每层一个临时切片，额外空间 O(w)。`,
      null
    )
  )

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

const W = 680
const PAD_X = 64
const NODE_R = 18
const TOP = 54
const LEVEL_GAP = 68
const BAND_H = 62
const H = TOP + MAX_DEPTH * LEVEL_GAP + 94

type NodeState = 'cur' | 'queue' | 'out' | 'idle'

const FILL: Record<NodeState, string> = {
  cur: 'hsl(var(--amber-soft))',
  queue: 'hsl(var(--teal-soft))',
  out: 'hsl(var(--easy-soft))',
  idle: 'hsl(var(--paper))',
}

const STROKE: Record<NodeState, string> = {
  cur: 'hsl(var(--amber))',
  queue: 'hsl(var(--teal))',
  out: 'hsl(var(--easy))',
  idle: 'hsl(var(--border))',
}

const STROKE_W: Record<NodeState, number> = { cur: 3, queue: 2.5, out: 2.5, idle: 2 }

const VALUE_FILL: Record<NodeState, string> = {
  cur: 'hsl(var(--amber))',
  queue: 'hsl(var(--teal))',
  out: 'hsl(var(--easy))',
  idle: 'hsl(var(--ink-soft))',
}

function Stage(step: Step) {
  const slotWidth = (W - PAD_X * 2) / ORDER.length
  const x = (id: string) => PAD_X + slotWidth * (ORDER.indexOf(id) + 0.5)
  const y = (id: string) => TOP + DEPTH_OF[id] * LEVEL_GAP

  const stateOf = (id: string): NodeState => {
    if (step.cur === id) return 'cur'
    const pos = step.queue.indexOf(id)
    if (pos >= 0) return pos === 0 ? 'cur' : 'queue'
    if (step.levelNodes.includes(id)) return 'out'
    return 'idle'
  }

  const stateText: Record<NodeState, string> = {
    cur: '出队',
    queue: '队列中',
    out: '已收集',
    idle: '未访问',
  }

  const shownLevel = step.levelNodes.map((id) => VAL_OF[id])
  const filled = step.level.filter((v): v is number => v !== null)
  const orderedLevel = step.dir === 'ltr' ? filled : [...filled].reverse()

  const levelCellState = (k: number): CellState => {
    if (step.phase === 'init') return 'dim'
    if (k === step.slot) return 'active'
    return step.level[k] === null ? 'dim' : 'ok'
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full select-none">
        {/* 1. 当前层色块：铺在节点圆下面，先画 */}
        {step.phase !== 'init' && step.phase !== 'done' && (
          <g>
            <rect
              x={8}
              y={y(step.levelNodes[0]) - BAND_H / 2 - 8}
              width={W - 16}
              height={BAND_H}
              rx={10}
              fill={TONE.amber}
              fillOpacity={0.12}
            />
            <text
              x={20}
              y={y(step.levelNodes[0]) - BAND_H / 2 + 4}
              textAnchor="start"
              fontSize="12"
              fontWeight="700"
              className="font-code"
              fill="hsl(var(--amber))"
            >
              {`第 ${step.levelIndex} 层 · ${dirLabel(step.dir)} ${dirArrow(step.dir)}`}
            </text>
          </g>
        )}

        {/* 2. 边：直线连接父子，后画的节点圆盖住端点 */}
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
                  step.cur === child.id || step.queue[0] === child.id
                    ? 'hsl(var(--amber))'
                    : 'hsl(var(--border))'
                }
                strokeWidth={step.cur === child.id || step.queue[0] === child.id ? 2.5 : 2}
              />
            ))
        )}

        {/* 3. 节点圆：状态靠文字标注区分，不只看颜色 */}
        {ORDER.map((id) => {
          const st = stateOf(id)
          return (
            <g key={id}>
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
                fontSize="16"
                fontWeight="700"
                className="font-code"
                fill={VALUE_FILL[st]}
              >
                {VAL_OF[id]}
              </text>
            </g>
          )
        })}

        {/* 4. 状态文字：左孩子贴在圆右侧、右孩子贴在圆左侧，避免同层文字互相压住 */}
        {ORDER.map((id) => {
          const st = stateOf(id)
          const isRightChild = id.length > 1 && id.endsWith('R')
          return (
            <text
              key={`tag-${id}`}
              x={isRightChild ? x(id) - NODE_R - 5 : x(id) + NODE_R + 5}
              y={y(id) + 4}
              textAnchor={isRightChild ? 'end' : 'start'}
              fontSize="10.5"
              fontWeight="600"
              className="font-code"
              fill={
                st === 'cur'
                  ? 'hsl(var(--amber))'
                  : st === 'queue'
                    ? 'hsl(var(--teal))'
                    : st === 'out'
                      ? 'hsl(var(--easy))'
                      : 'hsl(var(--ink-soft))'
              }
            >
              {stateText[st]}
            </text>
          )
        })}

        {/* 5. 舞台说明：空节点不画 */}
        <text
          x={W / 2}
          y={H - 10}
          textAnchor="middle"
          fontSize="11"
          className="font-code"
          fill="hsl(var(--ink-soft))"
        >
          层序数组里的 null 不画在舞台上；出队顺序始终是左→右，方向只决定写入下标
        </text>
      </svg>

      <div className="grid w-full gap-4 sm:grid-cols-2">
        {/* 左边：正在填充的 level（下标固定，值按方向落位） */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold text-ink-soft">
            正在填充的 level（下标固定）
          </span>
          <div className="flex flex-wrap items-end gap-1.5">
            {step.level.length === 0 ? (
              <span className="font-code text-[11px] text-ink-soft">（还没有开始填本层）</span>
            ) : (
              step.level.map((v, k) => (
                <div key={`slot-${k}`} className="flex flex-col items-center gap-0.5">
                  <Cell
                    state={levelCellState(k)}
                    size="sm"
                    className="w-full min-w-0 px-2 text-[12px]"
                  >
                    {v === null ? '·' : v}
                  </Cell>
                  <span
                    className={
                      k === step.slot
                        ? 'font-code text-[10px] font-bold text-[hsl(var(--amber))]'
                        : 'font-code text-[10px] text-ink-soft'
                    }
                  >
                    {`[${k}]`}
                  </span>
                </div>
              ))
            )}
          </div>
          <span className="text-[11px] leading-relaxed text-ink-soft">
            本层出队顺序（左→右）：{' '}
            <b className="font-code">
              {step.levelNodes.length === 0
                ? '—'
                : shownLevel.join('、')}
            </b>
            {step.phase !== 'init' && step.phase !== 'done' && (
              <>
                {' '}
                · 按方向排好：
                <b className="font-code">
                  {orderedLevel.length === 0 ? '—' : orderedLevel.join('、')}
                </b>
              </>
            )}
          </span>
        </div>

        {/* 右边：队列 */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold text-ink-soft">
            队列（BFS 出队顺序：左→右）
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {step.queue.length === 0 ? (
              <span className="font-code text-[11px] text-ink-soft">（空）</span>
            ) : (
              step.queue.map((id, k) => (
                <div key={`${id}-${k}`} className="flex flex-col items-center gap-0.5">
                  <Cell
                    state={k === 0 ? 'active' : 'new'}
                    size="sm"
                    className="w-full min-w-0 px-2 text-[12px]"
                  >
                    {VAL_OF[id]}
                  </Cell>
                  <span className="font-code text-[10px] text-ink-soft">
                    {k === 0 ? '队首' : `第${k}`}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 输出列表：按层分组，每组标出方向 */}
      <div className="flex w-full flex-col gap-1">
        <span className="text-[11px] font-semibold text-ink-soft">输出（按层分组）</span>
        {step.result.length === 0 ? (
          <span className="font-code text-[11px] text-ink-soft">[]（还没有完整的层）</span>
        ) : (
          step.result.map((row, k) => (
            <div key={`res-${k}`} className="flex flex-wrap items-center gap-1.5">
              <span className="w-24 shrink-0 font-code text-[11px] text-ink-soft">
                {`第 ${k} 层`}
              </span>
              <span
                className="w-20 shrink-0 font-code text-[11px] font-bold"
                style={{ color: TONE.amber }}
              >
                {k % 2 === 0 ? '左→右' : '右→左'}
              </span>
              {row.map((v, j) => (
                <Cell key={`res-${k}-${j}`} state="ok" size="sm" className="w-full min-w-0 px-2 text-[12px]">
                  {v}
                </Cell>
              ))}
            </div>
          ))
        )}
      </div>

      <Badges className="justify-center">
        {step.phase === 'done' ? (
          <Answer>
            {`[[${step.result.map((row) => row.join(',')).join('], [')}]]`}
          </Answer>
        ) : (
          <>
            <Stat label="当前层" value={`第 ${step.levelIndex} 层`} tone="amber" />
            <Stat
              label="本层方向"
              value={step.dir === 'ltr' ? '左→右' : '右→左'}
              tone="medium"
            />
            <Stat
              label="本层进度"
              value={`${step.processed}/${step.levelSize}`}
              tone="teal"
            />
            <Stat label="已完成层数" value={step.doneLevels} tone="easy" />
            {step.hint && <Hint>{step.hint}</Hint>}
          </>
        )}
      </Badges>
    </div>
  )
}

export default function BinaryTreeZigzagLevelOrderTraversalDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="层序 BFS + 按方向落位"
      info={`root = ${INPUT_TEXT}（题解示例 1 的层序表示，null 为空节点），输出 [[3],[20,9],[15,7]]。只演示这一棵树，恰好覆盖「左→右」和「右→左」两种方向；出队顺序始终是左→右，方向只决定值写进 level 的哪个下标。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '当前层色块 · 本步出队的节点（另标注方向）' },
        { color: TONE.teal, label: '队列中待处理' },
        { color: TONE.easy, label: '本层已出队、值已落位' },
        { color: TONE.muted, label: '尚未访问 / level 空位' },
      ]}
    />
  )
}
