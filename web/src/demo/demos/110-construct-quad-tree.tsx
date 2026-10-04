import { Fragment, useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badge, Badges, Cell, Hint, Stat, TONE, type CellState } from './stage'

/* ------------------------------------------------------------------ */
/* 110. 建立四叉树 —— 模式 C：网格递归四分（网格 + 同步生成的树）          */
/* ------------------------------------------------------------------ */

/** 示例输入：题解示例 2 的左上 2×2 子块与右下 2×2 子块各取一半，凑成 4×4 看清两层递归 */
const INPUT = [
  [1, 0, 0, 0],
  [0, 0, 1, 1],
  [1, 1, 0, 0],
  [1, 1, 0, 1],
]

const N = INPUT.length
/** 四叉树节点最多 4^0+4^1+…+4^LOG 个，用来定槽位数量 */
const MAX_DEPTH = Math.log2(N)
const ROWS = INPUT.map((_, r) => r)
const COLS = INPUT[0].map((_, c) => c)
/** 网格 gap（px），覆盖层用 calc 对齐到单元格的跨距上 */
const GAP = 5

/** 一个方形区域：左上角 (r, c) + 边长 size */
interface Region {
  r: number
  c: number
  size: number
}

interface QNode {
  id: string
  region: Region
  depth: number
  /** 叶子存该区域的同值；内部节点无 val */
  leaf: boolean
  val: number | null
  /** 在父节点槽位里的四进制位置，仅用于布局 */
  slot: number
}

interface Step {
  phase: 'init' | 'split' | 'leaf' | 'done'
  /** 本步正在检查的区域；init / done 为 null */
  region: Region | null
  /** 本步新建的树节点 */
  newNode: QNode | null
  /** 已经确认同值的叶子区域（含本步新建的） */
  leaves: Region[]
  /** 已经四分过的区域 */
  splits: Region[]
  /** 已生成的树节点（含本步新建的） */
  nodes: QNode[]
  /** 已生成的边：父节点 id → 子节点 id */
  edges: { from: string; to: string }[]
  /** 扫描时第一个与基准 grid[r][c] 不同的格子 */
  mismatch: { r: number; c: number; base: number; v: number } | null
  /** 递归调用栈（自顶向下），栈顶为当前区域 */
  stack: Region[]
  /** 步骤计数 */
  stepNo: number | null
  /** 下一步动作，由后一个快照统一回填 */
  next: string
  note: string
}

function buildSteps(): Step[] {
  const steps: Step[] = []
  const nodes: QNode[] = []
  const leaves: Region[] = []
  const splits: Region[] = []
  const edges: { from: string; to: string }[] = []
  const stack: Region[] = []
  let seq = 0
  let stepNo = 0

  const snap = (
    phase: Step['phase'],
    region: Region | null,
    newNode: QNode | null,
    mismatch: Step['mismatch'],
    note: string
  ): Step => {
    stepNo += 1
    const s: Step = {
      phase,
      region: region ? { ...region } : null,
      newNode,
      leaves: leaves.map((x) => ({ ...x })),
      splits: splits.map((x) => ({ ...x })),
      nodes: nodes.map((n) => ({ ...n, region: { ...n.region } })),
      edges: edges.map((e) => ({ ...e })),
      mismatch: mismatch ? { ...mismatch } : null,
      stack: stack.map((x) => ({ ...x })),
      stepNo,
      next: '',
      note,
    }
    steps.push(s)
    return s
  }

  snap(
    'init',
    null,
    null,
    null,
    `观察：输入是 ${N}×${N} 的 0/1 矩阵 grid，递归只用 (r, c, size) 描述一块方形区域，初始调用是 (0, 0, ${N})，调用栈只压了一层。判断：能否一刀作答取决于这块区域是否同值，所以每进入一层就先以 grid[r][c] 为基准把区域扫一遍。动作：同值就建叶子节点并返回，出现不同就以 half = size / 2 拆成左上 / 右上 / 左下 / 右下四个等大子区域继续递归。为什么：子区域两两不重叠且并集恰好是父区域，所以只需要位置和边长，不必复制子矩阵。`
  )

  const build = (r: number, c: number, size: number, depth: number, slot: number): QNode => {
    const region: Region = { r, c, size }
    stack.push(region)

    // 终止条件：以区域左上角 grid[r][c] 为基准逐格比较，与题解 isUniform 一致
    const base = INPUT[r][c]
    let uniform = true
    for (let i = r; i < r + size && uniform; i++) {
      for (let j = c; j < c + size; j++) {
        if (INPUT[i][j] !== base) {
          uniform = false
          break
        }
      }
    }

    if (uniform) {
      const node: QNode = { id: `q${seq++}`, region, depth, leaf: true, val: base, slot }
      nodes.push(node)
      leaves.push(region)
      stack.pop()
      snap(
        'leaf',
        region,
        node,
        null,
        `观察：区域 (${r}, ${c}) 边长 ${size}，从 grid[${r}][${c}] = ${base} 起逐格扫描，${size * size} 个格子全部等于 ${base}。判断：这是纯色区域，按规则 1 直接成为叶子，isLeaf = true，val = ${base === 1 ? 'true' : 'false'}，四个子节点全为空，不再往下分。动作：叶子节点入树，本层返回，调用栈弹出一层。`
      )
      return node
    }

    // 判定不同值后再扫一遍，记下第一个与基准不同的格子，步骤里据此标红
    const findMismatch = (): { r: number; c: number; base: number; v: number } => {
      for (let i = r; i < r + size; i++) {
        for (let j = c; j < c + size; j++) {
          if (INPUT[i][j] !== base) return { r: i, c: j, base, v: INPUT[i][j] }
        }
      }
      return { r, c, base, v: base }
    }
    const mismatch = findMismatch()

    const half = size / 2
    const node: QNode = { id: `q${seq++}`, region, depth, leaf: false, val: null, slot }
    nodes.push(node)
    splits.push(region)
    snap(
      'split',
      region,
      node,
      mismatch,
      `观察：当前区域 (${r}, ${c}) 边长 ${size}，以 grid[${r}][${c}] = ${base} 为基准逐格扫描，在 grid[${mismatch.r}][${mismatch.c}] = ${INPUT[mismatch.r][mismatch.c]} 处第一次发现不同。判断：区域不是同值，按规则 2 必须继续四分，isLeaf = false（val 取 true，与题解代码一致）。动作：half = ${size} / 2 = ${half}，把区域切成左上 (${r}, ${c})、右上 (${r}, ${c + half})、左下 (${r + half}, ${c})、右下 (${r + half}, ${c + half}) 四个 ${half}×${half} 子区域，按这个顺序压栈递归。`
    )

    // 四个子区域：左上 → 右上 → 左下 → 右下，槽位按四进制展开
    for (let k = 0; k < 4; k++) {
      const dr = k < 2 ? 0 : half
      const dc = k % 2 === 0 ? 0 : half
      const child = build(r + dr, c + dc, half, depth + 1, slot * 4 + k)
      edges.push({ from: node.id, to: child.id })
    }

    stack.pop()
    return node
  }

  build(0, 0, N, 0, 0)

  snap(
    'done',
    null,
    null,
    null,
    `观察：递归结束，四叉树共 ${nodes.length} 个节点，其中 ${splits.length} 个内部节点、${leaves.length} 个叶子，叶子落在 (${leaves
      .map((l) => `${l.r},${l.c}`)
      .join(') (')})。判断：每个叶子的格子值都相同，每个内部节点的四个孩子不重叠地铺满父区域，所以根节点正确表示了整块矩阵。动作：返回根节点，isLeaf = false（val 任意，题解统一取 true）。为什么：每层所有区域加起来要扫一遍矩阵，递归深度 log₂${N} = ${MAX_DEPTH}，因此最坏时间 O(n²log n)，递归栈 O(log n)。`
  )

  // 「下一步动作」由后一个快照推导，保证与 buildSteps 的真实步骤完全一致
  steps.forEach((s, i) => {
    const b = steps[i + 1]
    if (!b) return
    if (b.phase === 'done') {
      s.next = '递归已回到根，给出四叉树'
    } else if (b.phase === 'split') {
      const reg = b.region as Region
      s.next =
        s.phase === 'leaf'
          ? `回到上层，继续处理区域 (${reg.r}, ${reg.c}) 边长 ${reg.size}`
          : `检查下一个区域 (${reg.r}, ${reg.c}) 边长 ${reg.size}，扫描它是否同值`
    } else if (b.phase === 'leaf') {
      const reg = b.region as Region
      s.next =
        s.phase === 'split'
          ? `按左上 → 右上 → 左下 → 右下递归，先处理 (${reg.r}, ${reg.c}) 边长 ${reg.size}`
          : `扫描区域 (${reg.r}, ${reg.c}) 边长 ${reg.size} 是否同值`
    }
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

const PAD = 26
/** 根槽位占 4^MAX_DEPTH 个叶子槽，节点落在自己槽位的中心 */
const SLOTS = Math.pow(4, MAX_DEPTH)
const SLOT_W = 1 / SLOTS
const W = 100 * (1 + SLOT_W)
const LEVEL_H = 74
const H = 40 + MAX_DEPTH * LEVEL_H + 34

/** 槽位 → 画布横坐标（与 SVG 的 viewBox 单位一致） */
const xOf = (slot: number) => (PAD + (slot + 0.5) * SLOT_W * (W - 2 * PAD)) | 0
/** 深度 → 画布纵坐标 */
const yOf = (depth: number) => 40 + depth * LEVEL_H

const sameRegion = (a: Region | null, b: Region) =>
  a !== null && a.r === b.r && a.c === b.c && a.size === b.size

/** 找某个区域当前所属的树节点，用于在树上标出「当前」 */
const nodeOfRegion = (nodes: QNode[], region: Region | null): QNode | null => {
  if (!region) return null
  for (const n of nodes) if (sameRegion(n.region, region)) return n
  return null
}

/** 「当前区域」高亮层的边框 / 底色：叶子用绿、待四分用琥珀 */
const activeTint = (phase: Step['phase']) =>
  phase === 'leaf'
    ? { border: '2px solid hsl(var(--easy))', background: 'hsl(var(--easy) / 0.3)' }
    : { border: '2px solid hsl(var(--amber))', background: 'hsl(var(--amber) / 0.3)' }

/** 覆盖层：把网格里的区域换算成绝对定位的百分比 + gap 偏移 */
const overlayBox = (reg: Region) => ({
  left: `calc(${(reg.c * 100) / N}% + ${reg.c * GAP}px)`,
  top: `calc(${(reg.r * 100) / N}% + ${reg.r * GAP}px)`,
  width: `calc(${(reg.size * 100) / N}% + ${(reg.size - 1) * GAP}px)`,
  height: `calc(${(reg.size * 100) / N}% + ${(reg.size - 1) * GAP}px)`,
})

function Stage(step: Step) {
  const done = step.phase === 'done'
  const reg = step.region
  const leafCount = step.leaves.length
  const curNode = nodeOfRegion(step.nodes, reg)

  /** 格内数字一律保留原值，区域信息只由覆盖层的框与底色表达：红 = 首个不同格，其余为 idle */
  const stateOf = (r: number, c: number): CellState => {
    if (step.mismatch && step.mismatch.r === r && step.mismatch.c === c) return 'bad'
    return 'idle'
  }

  /** 已四分过的区域：青色实线框 */
  const splitFrames = step.splits
  /** 已确认的叶子区域：绿色实线框 */
  const leafFrames = step.leaves

  const frameStyle = (color: string) => ({
    border: `2px solid hsl(var(${color}))`,
    borderRadius: '6px',
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        {/* 左：网格 + 区域覆盖层（单元格 → 区域框 → 当前区域高亮，逐层叠放） */}
        <div className="flex w-full flex-col gap-3 lg:max-w-[360px]">
          <div
            className="relative grid w-full gap-[5px]"
            style={{ gridTemplateColumns: `repeat(${N}, minmax(0, 1fr))` }}
          >
            {ROWS.map((r) =>
              COLS.map((c) => {
                const v = INPUT[r][c]
                return (
                  <Cell
                    key={`cell-${r}-${c}`}
                    state={stateOf(r, c)}
                    size="sm"
                    className="h-auto w-full min-w-0 sm:min-w-0 aspect-square"
                  >
                    {v}
                  </Cell>
                )
              })
            )}

            {splitFrames.map((f) => (
              <div
                key={`sp-${f.r}-${f.c}-${f.size}`}
                aria-hidden
                className="pointer-events-none absolute"
                style={{ ...overlayBox(f), ...frameStyle('--teal') }}
              />
            ))}
            {leafFrames.map((f) => (
              <div
                key={`lf-${f.r}-${f.c}-${f.size}`}
                aria-hidden
                className="pointer-events-none absolute"
                style={{ ...overlayBox(f), ...frameStyle('--easy') }}
              />
            ))}
            {!done && reg && (
              <div
                aria-hidden
                className="pointer-events-none absolute"
                style={{ ...overlayBox(reg), ...activeTint(step.phase) }}
              />
            )}
          </div>

          {/* 递归调用栈：自顶向下，栈顶加粗 */}
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-ink-soft">
            <span className="shrink-0">调用栈</span>
            {step.stack.length === 0 ? (
              <span className="font-code">（空）</span>
            ) : (
              step.stack.map((f, k) => (
                <span key={`stk-${k}`} className="flex items-center gap-1.5">
                  {k > 0 && <span aria-hidden>›</span>}
                  <span
                    className={
                      k === step.stack.length - 1
                        ? 'rounded-md bg-[hsl(var(--amber-soft))] px-1.5 py-0.5 font-code font-bold text-[hsl(var(--amber))]'
                        : 'rounded-md border border-border px-1.5 py-0.5 font-code'
                    }
                  >
                    ({f.r},{f.c}) {f.size}×{f.size}
                  </span>
                </span>
              ))
            )}
          </div>
        </div>

        {/* 右：同步生成的树；节点圆里是叶子的值 / 内部节点的边长 */}
        <div className="flex w-full flex-col gap-1.5 lg:flex-1">
          <span className="font-code text-[10px] text-ink-soft">
            已生成 {step.nodes.length} 个节点 · 半径 18
          </span>
          <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto w-full max-w-[560px] select-none">
            {/* 先画边，再画节点，保证节点压在线上方 */}
            {step.edges.map((e) => {
              const a = step.nodes.find((n) => n.id === e.from)
              const b = step.nodes.find((n) => n.id === e.to)
              if (!a || !b) return null
              const onPath = curNode !== null && (e.from === curNode.id || e.to === curNode.id)
              return (
                <line
                  key={`e-${e.from}-${e.to}`}
                  x1={xOf(a.slot)}
                  y1={yOf(a.depth) + 18}
                  x2={xOf(b.slot)}
                  y2={yOf(b.depth) - 18}
                  stroke="hsl(var(--teal))"
                  strokeWidth={onPath ? 2.5 : 1.5}
                  strokeOpacity={onPath ? 1 : 0.45}
                />
              )
            })}

            {step.nodes.map((n) => {
              const isCur = curNode !== null && curNode.id === n.id
              const x = xOf(n.slot)
              const y = yOf(n.depth)
              const stroke = n.leaf ? 'hsl(var(--easy))' : 'hsl(var(--teal))'
              const fill = n.leaf ? 'hsl(var(--easy-soft))' : 'hsl(var(--teal-soft))'
              return (
                <Fragment key={n.id}>
                  <circle
                    cx={x}
                    cy={y}
                    r={18}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={isCur ? 3 : 1.5}
                  />
                  <text
                    x={x}
                    y={y + 5}
                    textAnchor="middle"
                    fontSize="14"
                    fontWeight="700"
                    className="font-code"
                    fill={stroke}
                  >
                    {n.leaf ? n.val : n.region.size}
                  </text>
                  <text
                    x={x}
                    y={y + 31}
                    textAnchor="middle"
                    fontSize="10"
                    className="font-code"
                    fill="hsl(var(--ink-soft))"
                  >
                    {n.leaf
                      ? `叶 (${n.region.r},${n.region.c})`
                      : `非叶 ${n.region.size}×${n.region.size}`}
                  </text>
                  {isCur && (
                    <text
                      x={x}
                      y={y - 26}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="700"
                      className="font-code"
                      fill={
                        step.phase === 'leaf' ? 'hsl(var(--easy))' : 'hsl(var(--amber))'
                      }
                    >
                      当前
                    </text>
                  )}
                </Fragment>
              )
            })}
          </svg>
        </div>
      </div>

      <Badges className="justify-center">
        <Stat label="已确认叶子" value={leafCount} tone="easy" />
        {!done && reg && (
          <Stat
            label={`区域 (${reg.r},${reg.c})`}
            value={`${reg.size}×${reg.size}`}
            tone={step.phase === 'leaf' ? 'easy' : 'amber'}
          />
        )}
        {!done && step.mismatch && (
          <Badge tone="hard">
            首个不同 <b className="font-code text-xs">grid[{step.mismatch.r}][{step.mismatch.c}] = {step.mismatch.v}</b>{' '}
            ≠ 基准 {step.mismatch.base}
          </Badge>
        )}
        {!done && step.next && <Hint>{step.next}</Hint>}
        {done && (
          <>
            <Stat label="树节点" value={step.nodes.length} />
            <Answer>
              根节点 <b className="font-code">isLeaf = false</b>，{leafCount} 个叶子各覆盖一块纯色区域
            </Answer>
          </>
        )}
      </Badges>
    </div>
  )
}

export default function ConstructQuadTreeDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="区域同值即收口，否则四分递归"
      info={`输入：grid = [[1,1,1,1],[1,1,1,1],[1,1,0,0],[1,1,0,1]]（题解示例 2 的左上 4×4 子块，并把 (3,3) 改成 1）。题解示例 1 的 2×2 只会分成四个单格叶子、看不到内部节点，示例 2 的 8×8 又太密，这里取 4×4：既有 2×2 的纯色叶子，又有要走满三层的 1×1 叶子。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '当前正在检查的区域（实线框）' },
        { color: TONE.easy, label: '已确认的叶子区域' },
        { color: TONE.teal, label: '已四分的区域 / 树中的内部节点' },
        { color: TONE.hard, label: '首个与基准不同的格子' },
      ]}
    />
  )
}
