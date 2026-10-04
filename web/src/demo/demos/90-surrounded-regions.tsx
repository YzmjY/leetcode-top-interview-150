import { Fragment, useMemo, type ReactNode } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badge, Badges, Cell, Hint, Stat, TONE, type CellState } from './stage'

/* ------------------------------------------------------------------ */
/* 90. 被围绕的区域 —— 模式 C：二维网格 + 边界 DFS 染色 / 整盘统一改写    */
/* ------------------------------------------------------------------ */

/** 题解「示例 1」：4×4 棋盘共 4 个 O，其中只有 (3,1) 落在边界上 */
const INPUT = [
  ['X', 'X', 'X', 'X'],
  ['X', 'O', 'O', 'X'],
  ['X', 'X', 'O', 'X'],
  ['X', 'O', 'X', 'X'],
]

const M = INPUT.length
const N = INPUT[0].length
const ROWS = INPUT.map((_, r) => r)
const COLS = INPUT[0].map((_, c) => c)
const TOTAL_O = INPUT.reduce((sum, row) => sum + row.filter((ch) => ch === 'O').length, 0)

type Edge = 'left' | 'right' | 'top' | 'bottom'
type Dir = 'down' | 'up' | 'right' | 'left'

const EDGE_LABEL: Record<Edge, string> = {
  left: '左列 j = 0',
  right: `右列 j = ${N - 1}`,
  top: '上边 i = 0',
  bottom: `下边 i = ${M - 1}`,
}

/** 四条边各自检查的格子：左右两列按 for i、上下两行按 for j（与题解一致） */
const EDGE_CELLS: Record<Edge, [number, number][]> = {
  left: ROWS.map((r): [number, number] => [r, 0]),
  right: ROWS.map((r): [number, number] => [r, N - 1]),
  top: COLS.map((c): [number, number] => [0, c]),
  bottom: COLS.map((c): [number, number] => [M - 1, c]),
}

/** 各条「查不到 O」的边界为什么也必须扫：四条边给出不同的理由，不写套话 */
const EDGE_WHY: Record<Edge, string> = {
  left: `DFS 只能从边界上的 O 出发，而本题唯一的边界 O 在下边，只扫左右两列就会漏掉整个免死区域`,
  right: `左右两列都已扫完却一无所获，说明免死区域的入口只可能在上下两行`,
  top: `上边查不到不等于没有：漏掉任何一条边都可能错过免死区域`,
  bottom: ``,
}

/** 角点在列扫描与行扫描里会重复检查（题解：标记后已不是 O，重复无害） */
const EDGE_TAIL: Record<Edge, string> = {
  left: '',
  right: '',
  top: `（两个角点 (0,0)、(0,${N - 1}) 在列扫描里已经看过）`,
  bottom: '',
}

/** 落在边界上的 O：题解的边界循环正是从这些格子启动 DFS */
const BOUNDARY_O: [number, number][] = (() => {
  const seen = new Set<string>()
  const out: [number, number][] = []
  for (const e of ['left', 'right', 'top', 'bottom'] as Edge[]) {
    for (const [r, c] of EDGE_CELLS[e]) {
      const key = `${r},${c}`
      if (INPUT[r][c] === 'O' && !seen.has(key)) {
        seen.add(key)
        out.push([r, c])
      }
    }
  }
  return out
})()

/** 题解 dfs 的四邻顺序：下、上、右、左 */
const DIRS: { dr: number; dc: number; dir: Dir; name: string }[] = [
  { dr: 1, dc: 0, dir: 'down', name: '下' },
  { dr: -1, dc: 0, dir: 'up', name: '上' },
  { dr: 0, dc: 1, dir: 'right', name: '右' },
  { dr: 0, dc: -1, dir: 'left', name: '左' },
]

/** 每个方向为什么停下来的理由都不一样 */
const PROBE_WHY: Record<Dir, string> = {
  down: `越界保护必须写在取字符之前，否则会访问不存在的行；它同时保证 DFS 走不出棋盘`,
  up: `X 是墙，把免死区域和外界隔开，遇到非 O 就说明这条路不通`,
  right: `只有上下左右四个方向上仍是 O 的格子才会被标记并入栈，X 一律不会入栈`,
  left: `四个方向都检查完，栈里没有新格子，这次扩散到此结束`,
}

interface Probe {
  dir: Dir
  name: string
  r: number
  c: number
  inBounds: boolean
  value: string | null
}

type Kind = 'init' | 'edge' | 'start' | 'probe' | 'markdone' | 'flip' | 'restore' | 'done'

interface Step {
  kind: Kind
  /** 标记阶段（扫边界 + 染色）/ 改写阶段（统一扫描） */
  phase: 'mark' | 'flip'
  edge: Edge | null
  active: [number, number] | null
  probe: Probe | null
  /** 与边界连通、不会被捕获的格子 */
  safe: boolean[][]
  /** 当前棋盘字符：X / O / #（# 是标记阶段留下的临时记号） */
  board: string[][]
  safeCount: number
  flipped: number
  note: string
  /** 下一步动作：由后一个快照统一回填，保证 Hint 说的是真的下一步 */
  next: string
}

const pos = (p: [number, number] | null): string => (p ? `(${p[0]},${p[1]})` : '—')
const fmtBoard = (b: string[][]): string => `[${b.map((row) => `[${row.join(',')}]`).join(',')}]`

function buildSteps(): Step[] {
  const board = INPUT.map((row) => row.slice())
  const safe = INPUT.map((row) => row.map(() => false))
  const steps: Step[] = []
  let safeCount = 0
  let flipped = 0

  const snap = (
    kind: Kind,
    state: { edge?: Edge; active?: [number, number]; probe?: Probe },
    note: string
  ): void => {
    steps.push({
      kind,
      phase: kind === 'flip' || kind === 'restore' || kind === 'done' ? 'flip' : 'mark',
      edge: state.edge ?? null,
      active: state.active ?? null,
      probe: state.probe ?? null,
      safe: safe.map((row) => row.slice()),
      board: board.map((row) => row.slice()),
      safeCount,
      flipped,
      note,
      next: '',
    })
  }

  /** 四个方向的观察句：第一个方向带上 dfs 的顺序，后续接在同一个栈顶后面 */
  const probeHead = (cur: [number, number], p: Probe, k: number): string =>
    k === 0
      ? `观察：弹出栈顶 ${pos(cur)}，按题解 dfs 的方向顺序（下 → 上 → 右 → 左）先看它的${p.name}方邻居 (${p.r},${p.c})。`
      : `观察：接着看 ${pos(cur)} 的${p.name}方邻居 (${p.r},${p.c})。`

  /** 邻居不是 O 时的说明：越界与撞墙分别陈述 */
  const stopNote = (cur: [number, number], p: Probe, k: number): string => {
    const head = probeHead(cur, p, k)
    const judge = !p.inBounds
      ? p.r < 0 || p.r >= M
        ? `判断：行下标 ${p.r} 越出了 0..${M - 1}，这一格根本不在棋盘上。`
        : `判断：列下标 ${p.c} 越出了 0..${N - 1}，这一格根本不在棋盘上。`
      : `判断：board[${p.r}][${p.c}] = '${p.value}'，它不是可以继续扩散的 O。`
    const act = p.inBounds
      ? `动作：跳过这个方向，既不标记也不入栈。`
      : `动作：这个方向直接返回，连字符都不取。`
    return `${head}${judge}${act}为什么：${PROBE_WHY[p.dir]}。`
  }

  /** 题解的 dfs：从边界 O 出发把整个连通区域染成 '#'；递归展开成显式栈，逐步展示扩散 */
  const markFrom = (sr: number, sc: number, edge: Edge, index: number): void => {
    const stack: [number, number][] = [[sr, sc]]
    board[sr][sc] = '#'
    safe[sr][sc] = true
    safeCount += 1

    const uniq =
      BOUNDARY_O.length === 1
        ? `这是整个棋盘唯一落在边界上的 O`
        : `它是 ${BOUNDARY_O.length} 个边界 O 起点中的第 ${index + 1} 个`
    snap(
      'start',
      { edge, active: [sr, sc] },
      `观察：扫描${EDGE_LABEL[edge]}，在 board[${sr}][${sc}] 处遇到 'O'——${uniq}。判断：它落在边界上，所在区域必然没有被 X 完全包围，必须保留。动作：从它出发做 DFS——先把它临时标记为 '#'（安全格 +1）并压入搜索栈，再沿上下左右四个方向扩散（题解的 dfs 是递归，这里展开成显式栈，访问到的格子集合相同）。为什么：'#' 与 'O' 互不混淆，改写阶段的统一扫描才能把免死区域和待捕获的 O 分开。`
    )

    while (stack.length > 0) {
      const cur = stack.pop()
      if (!cur) break
      DIRS.forEach((d, k) => {
        const nr = cur[0] + d.dr
        const nc = cur[1] + d.dc
        const inBounds = nr >= 0 && nr < M && nc >= 0 && nc < N
        const value = inBounds ? board[nr][nc] : null
        const probe: Probe = { dir: d.dir, name: d.name, r: nr, c: nc, inBounds, value }
        if (inBounds && value === 'O') {
          board[nr][nc] = '#'
          safe[nr][nc] = true
          safeCount += 1
          stack.push([nr, nc])
          snap(
            'probe',
            { active: cur, probe },
            `${probeHead(cur, probe, k)}判断：board[${nr}][${nc}] 仍是 'O'，说明它和边界连通。动作：标记为 '#'（安全格 +1）并压入搜索栈，稍后从它继续扩散。为什么：DFS 沿连通关系传播，同一个区域会被一次性全部标记完。`
          )
        } else {
          snap('probe', { active: cur, probe }, stopNote(cur, probe, k))
        }
      })
    }
  }

  /** 扫一条边界：没有 O 就记一步说明，有 O 就依次启动 DFS */
  const scanEdge = (edge: Edge): void => {
    const cells = EDGE_CELLS[edge]
    const hits = cells.filter(([r, c]) => board[r][c] === 'O')
    if (hits.length === 0) {
      const list = cells.map(([r, c]) => pos([r, c])).join('、')
      snap(
        'edge',
        { edge },
        `观察：${EDGE_LABEL[edge]} 上的 ${cells.length} 个格子 ${list} 全是 X${EDGE_TAIL[edge]}。判断：这条边没有 O，产生不了搜索起点。动作：整条边跳过，接着扫下一条边。为什么：${EDGE_WHY[edge]}。`
      )
      return
    }
    hits.forEach(([r, c], k) => markFrom(r, c, edge, k))
  }

  /** 未被标记的 O 的连通区域（题解里的「区域」），用于说明整片一起被捕获 */
  const unmarkedRegions = (): { groups: [number, number][][]; id: number[][] } => {
    const id = board.map((row) => row.map(() => -1))
    const groups: [number, number][][] = []
    for (let i = 0; i < M; i++) {
      for (let j = 0; j < N; j++) {
        if (safe[i][j] || board[i][j] !== 'O' || id[i][j] >= 0) continue
        const cells: [number, number][] = [[i, j]]
        id[i][j] = groups.length
        for (let k = 0; k < cells.length; k++) {
          const cur = cells[k]
          for (const d of DIRS) {
            const nr = cur[0] + d.dr
            const nc = cur[1] + d.dc
            if (nr < 0 || nr >= M || nc < 0 || nc >= N) continue
            if (safe[nr][nc] || board[nr][nc] !== 'O' || id[nr][nc] >= 0) continue
            id[nr][nc] = groups.length
            cells.push([nr, nc])
          }
        }
        groups.push(cells)
      }
    }
    return { groups, id }
  }

  /* ---------------- ① 标记阶段 ---------------- */

  const boundaryList = BOUNDARY_O.map((p) => pos(p)).join('、')
  snap(
    'init',
    {},
    `观察：输入是题解「示例 1」的 ${M}×${N} 棋盘，一共 ${TOTAL_O} 个 O，落在四条边界上的只有 ${boundaryList}。判断：直接判断某个 O 是否被 X 完全包围很费劲，但「区域只要碰到边界就一定不被围绕」是显然的，所以反过来先保住边界连通的 O。动作：分两段执行——① 标记阶段：扫四条边，凡是 O 就从它出发 DFS，把整个与边界连通的区域临时记作 '#'；② 改写阶段：全盘扫描，'#' 还原为 'O'，其余仍是 'O' 的格子改成 'X'。为什么：会被捕获的 O = 全部 O 减去与边界连通的 O，每个格子因此只需常数次访问。`
  )

  scanEdge('left')
  scanEdge('right')
  scanEdge('top')
  scanEdge('bottom')

  const restCells: string[] = []
  for (let i = 0; i < M; i++) {
    for (let j = 0; j < N; j++) {
      if (!safe[i][j] && board[i][j] === 'O') restCells.push(pos([i, j]))
    }
  }
  const restList = restCells.length > 0 ? restCells.join('、') : '（没有）'
  snap(
    'markdone',
    {},
    `观察：四条边全部扫完，与边界连通的 O 共 ${safeCount} 个，现在都记作 '#'。判断：棋盘上剩下的 O —— ${restList} —— 从未被标记过，它们所在的区域没有触到边界。动作：进入改写阶段，按行优先统一扫描全盘：遇到 '#' 先还原为 'O'，否则若是 'O' 就改成 'X'。为什么：${
      restCells.length > 0
        ? `从 ${restCells[0]} 出发无法走出矩阵，它所在的整个区域都被 X 包围，按规定必须捕获`
        : `棋盘上已没有被标记外的 O，这一阶段只会把 '#' 还原回 'O'`
    }。`
  )

  /* ---------------- ② 改写阶段 ---------------- */

  const { groups, id } = unmarkedRegions()

  for (let i = 0; i < M; i++) {
    for (let j = 0; j < N; j++) {
      if (board[i][j] === '#') {
        board[i][j] = 'O'
        snap(
          'restore',
          { active: [i, j] },
          `观察：扫描到 ${pos([i, j])}，它是标记阶段留下的 '#'。判断：'#' 代表与边界连通，属于免死区域，必须原样保留。动作：把 '#' 还原成 'O'，安全格仍是 ${safeCount} 个。为什么：还原要写成独立分支——先判 '#' 再判 'O'，否则 '#' 会被卷进「O → X」里一起改掉。`
        )
      } else if (board[i][j] === 'O') {
        const prev = flipped
        const group = groups[id[i][j]]
        const regionList = group.map(([r, c]) => pos([r, c])).join('、')
        board[i][j] = 'X'
        flipped += 1
        snap(
          'flip',
          { active: [i, j] },
          `观察：按行优先扫描到 ${pos([i, j])}，它仍是 'O' 而不是 '#'。判断：它没有被边界 DFS 标记过，所在的连通区域是 {${regionList}}（共 ${group.length} 格），整个区域都没有触到边界。动作：board[${i}][${j}] 改成 'X'，已改写数从 ${prev} 变成 ${flipped}。为什么：区域里每个 O 都要各自改写，捕获的判定只看它有没有被边界标记过，与区域大小无关。`
        )
      }
    }
  }

  const safeCells: string[] = []
  for (let i = 0; i < M; i++) {
    for (let j = 0; j < N; j++) {
      if (safe[i][j]) safeCells.push(pos([i, j]))
    }
  }
  const capturedDesc = groups.map((g) => `{${g.map(([r, c]) => pos([r, c])).join('、')}}`).join('、')
  snap(
    'done',
    {},
    `观察：全盘扫描结束，最终棋盘为 ${fmtBoard(board)}。判断：被捕获的正是 ${capturedDesc} 这个不与边界连通的区域，而 ${safeCells.join('、')} 因为与边界连通被保留。动作：矩阵已原地修改完毕，函数不返回任何值。为什么：每个格子被边界循环检查常数次、被 DFS 访问至多一次（标记后立刻不再是 'O'），时间 O(m×n)；额外空间是搜索栈，最坏 O(m×n)。`
  )

  // 「下一步动作」一律由后一个快照推导，保证 Hint 与步骤数据完全一致
  steps.forEach((s, i) => {
    const b = steps[i + 1]
    if (!b) return
    const p = b.probe
    if (b.kind === 'edge' && b.edge) {
      s.next = `扫描${EDGE_LABEL[b.edge]} 上的每个格子，找 'O'`
    } else if (b.kind === 'start') {
      s.next = `从 ${pos(b.active)} 出发：标记为 '#' 并压入搜索栈`
    } else if (b.kind === 'probe' && p) {
      s.next = p.inBounds
        ? `检查 ${pos(b.active)} 的${p.name}方邻居 ${pos([p.r, p.c])}：它是不是 'O'`
        : `检查 ${pos(b.active)} 的${p.name}方邻居 ${pos([p.r, p.c])}：越界，直接返回`
    } else if (b.kind === 'markdone') {
      s.next = `四条边扫完（安全格 ${b.safeCount} 个），进入改写阶段`
    } else if (b.kind === 'flip') {
      s.next = `把 ${pos(b.active)} 的 'O' 改写成 'X'`
    } else if (b.kind === 'restore') {
      s.next = `把 ${pos(b.active)} 的临时标记 '#' 还原成 'O'`
    } else if (b.kind === 'done') {
      s.next = '扫描结束，输出最终棋盘'
    }
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

const GAP = 6
const LABEL_W = 30
const CELL_W = 52
const GRID_MAX = LABEL_W + GAP + N * CELL_W + (N - 1) * GAP

function PhasePill({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <span
      className={`rounded-lg border px-2.5 py-1 text-[11px] leading-none ${
        active
          ? 'border-[hsl(var(--amber))] bg-[hsl(var(--amber-soft))] font-medium text-[hsl(var(--amber))]'
          : 'border-border bg-card text-ink-soft'
      }`}
    >
      {children}
    </span>
  )
}

/** 阶段 / 当前动作徽章：标记阶段说明在看哪条边、检查哪个邻居；改写阶段说明在改哪一格 */
function MidBadge({ step }: { step: Step }) {
  const edge = step.edge
  const probe = step.probe
  const active = step.active

  if (step.kind === 'init') {
    return <Badge tone="teal">先扫四条边界，找边界上的 O</Badge>
  }
  if (step.kind === 'edge' && edge) {
    return (
      <Badge tone="teal">
        标记阶段 · 扫描<b className="font-code text-xs">{EDGE_LABEL[edge]}</b>
      </Badge>
    )
  }
  if (step.kind === 'start') {
    return (
      <Badge tone="teal">
        标记阶段 · 起点 <b className="font-code text-xs">{pos(active)}</b> 标记为 #
      </Badge>
    )
  }
  if (step.kind === 'probe' && probe) {
    return (
      <Badge tone={probe.inBounds ? 'medium' : 'hard'}>
        检查 <b className="font-code text-xs">{pos(active)}</b> 的{probe.name}方邻居{' '}
        <b className="font-code text-xs">{pos([probe.r, probe.c])}</b>
        {probe.inBounds ? ` = '${probe.value}'` : ' 越界'}
      </Badge>
    )
  }
  if (step.kind === 'markdone') {
    return (
      <Badge tone="teal">
        标记阶段结束 · 安全格 <b className="font-code text-xs">{step.safeCount}</b> 个
      </Badge>
    )
  }
  if (step.kind === 'flip') {
    return (
      <Badge tone="amber">
        改写阶段 · <b className="font-code text-xs">{pos(active)}</b>：'O' → 'X'
      </Badge>
    )
  }
  if (step.kind === 'restore') {
    return (
      <Badge tone="amber">
        改写阶段 · <b className="font-code text-xs">{pos(active)}</b>：'#' → 'O'
      </Badge>
    )
  }
  return <Badge tone="teal">改写阶段结束 · 全盘扫描完毕</Badge>
}

function Stage(step: Step) {
  const done = step.kind === 'done'
  const isMark = step.phase === 'mark'

  const isCur = (r: number, c: number): boolean => {
    const a = step.active
    return a !== null && a[0] === r && a[1] === c
  }

  const probeHit = (r: number, c: number): Probe | null => {
    const p = step.probe
    if (!p || !p.inBounds) return null
    return p.r === r && p.c === c ? p : null
  }

  const onEdge = (r: number, c: number): boolean => {
    const e = step.edge
    if (!e) return false
    if (e === 'left') return c === 0
    if (e === 'right') return c === N - 1
    if (e === 'top') return r === 0
    return r === M - 1
  }

  const stateOf = (r: number, c: number): CellState => {
    if (step.safe[r][c]) return 'ok'
    if (isCur(r, c)) return 'active'
    if (step.board[r][c] === 'O') return 'bad'
    return 'dim'
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 两段式：标记阶段（琥珀高亮）→ 改写阶段 */}
      <div className="flex w-full flex-wrap items-center justify-center gap-2">
        <PhasePill active={isMark}>
          <b className="font-code">1</b> 标记阶段：边界连通的 O 出发 DFS，临时记作 #
        </PhasePill>
        <PhasePill active={!isMark}>
          <b className="font-code">2</b> 改写阶段：# 还原为 O，其余 O 改成 X
        </PhasePill>
      </div>

      {/* 正方形单元格网格；行列数 ≤ 10，因此在左侧与上方标出行列号 i / j */}
      <div
        className="grid w-full gap-1.5"
        style={{
          gridTemplateColumns: `1.875rem repeat(${N}, minmax(0, 1fr))`,
          maxWidth: GRID_MAX,
        }}
      >
        <span className="flex items-end justify-end pr-1 font-code text-[9px] text-ink-soft">
          i\j
        </span>
        {COLS.map((c) => (
          <div key={`col-${c}`} className="flex h-4 items-center justify-center leading-none">
            <span className="font-code text-[11px] text-ink-soft">{c}</span>
          </div>
        ))}
        {ROWS.map((r) => (
          <Fragment key={`row-${r}`}>
            <div className="flex flex-col items-center justify-center leading-none">
              <span className="font-code text-[11px] text-ink-soft">{r}</span>
            </div>
            {COLS.map((c) => {
              const hit = probeHit(r, c)
              // 琥珀描边 = 正在处理的格子 / 正在扫描的那条边；格内「下/上/右/左」= 正在检查的邻居
              const ring = isCur(r, c) || onEdge(r, c) ? 'ring-2 ring-[hsl(var(--amber))]' : ''
              return (
                <Cell
                  key={`cell-${r}-${c}`}
                  state={stateOf(r, c)}
                  size="sm"
                  className={`h-auto w-full min-w-0 flex-col gap-0.5 aspect-square sm:min-w-0 sm:text-[15px] ${ring}`}
                >
                  <span className="font-code">{step.board[r][c]}</span>
                  {hit && (
                    <span className="rounded-sm bg-[hsl(var(--amber-soft))] px-1 text-[9px] font-bold leading-none text-[hsl(var(--amber))]">
                      {hit.name}
                    </span>
                  )}
                </Cell>
              )
            })}
          </Fragment>
        ))}
      </div>

      <Badges className="justify-center">
        <Stat label="安全格（保留）" value={step.safeCount} tone="easy" />
        <Stat label="已改写为 X" value={step.flipped} tone="hard" />
        <MidBadge step={step} />
        {!done && step.next && <Hint>{step.next}</Hint>}
        {done && (
          <Answer>
            最终棋盘 <b className="font-code">{fmtBoard(step.board)}</b>
          </Answer>
        )}
      </Badges>
    </div>
  )
}

export default function SurroundedRegionsDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="从边界反向染色，再统一改写"
      info={`输入取自题解「示例 1」：board = [[X,X,X,X],[X,O,O,X],[X,X,O,X],[X,O,X,X]]，4×4 共 ${TOTAL_O} 个 O，落在四条边界上的只有 ${BOUNDARY_O.map((p) => pos(p)).join('、')}。演示按「① 标记阶段：扫四条边 + 从边界 O 出发 DFS 染成 # → ② 改写阶段：# 还原为 O、其余 O 改成 X」两段展开，共 ${steps.length} 步；矩阵原地修改，最终为 [[X,X,X,X],[X,X,X,X],[X,X,X,X],[X,O,X,X]]（题解示例 1 的输出）。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '当前处理：扫描的边界 / 处理的格子（描边），邻居格内 下/上/右/左 是正在检查的方向' },
        { color: TONE.easy, label: '与边界连通的 O（标记阶段记作 #，最后还原为 O 保留）' },
        { color: TONE.hard, label: '被围绕的 O，将被改写成 X' },
        { color: TONE.muted, label: 'X 墙（不可通行）' },
      ]}
    />
  )
}
