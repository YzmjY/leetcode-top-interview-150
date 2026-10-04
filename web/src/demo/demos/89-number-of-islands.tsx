import { Fragment, useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badge, Badges, Cell, Flag, Hint, Stat, TONE, type CellState } from './stage'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/* 89. 岛屿数量 —— 模式 C：二维网格 + BFS 扩散染色（逐岛淹没）           */
/* ------------------------------------------------------------------ */

/** 题解「示例 2」：4×5、输出 3；是能真正演示「数出多座岛」的最小官方例子（题解 main 也用它） */
const GRID = [
  ['1', '1', '0', '0', '0'],
  ['1', '1', '0', '0', '0'],
  ['0', '0', '1', '0', '0'],
  ['0', '0', '0', '1', '1'],
]

const M = GRID.length
const N = GRID[0].length
const ROWS = GRID.map((_, r) => r)
const COLS = GRID[0].map((_, c) => c)
/** 陆地格总数，用于「已并入陆地」计数 */
const LAND_TOTAL = GRID.flat().filter((v) => v === '1').length

/** 题解 BFS 版的 dirs 顺序：下、上、右、左（只算四连通，对角不算相邻） */
const DIRS: [number, number][] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
]
const DIR_NAMES = ['下', '上', '右', '左']

interface Pos {
  r: number
  c: number
}

interface Step {
  /** init 起始讲解 · discover 发现新岛 · pop 队首出队 · enqueue 并入邻居 · seal 一岛收尾 · done 汇总 */
  phase: 'init' | 'discover' | 'pop' | 'enqueue' | 'seal' | 'done'
  /** 本步正在处理的格子（discover = 新岛起点，pop / enqueue = 刚出队的格子）；init / seal / done 为 null */
  current: Pos | null
  /** 本步刚被并入岛屿的格子（仅 enqueue 步） */
  added: Pos | null
  /** islands[r][c]：0 = 尚未并入任何岛屿（含水），k = 已并入第 k 座岛 */
  islands: number[][]
  /** 本步正在扩散的岛屿编号；init 为 0 */
  island: number
  /** BFS 队列快照（队首在前） */
  queue: Pos[]
  /** 已并入岛屿的陆地格数 */
  absorbed: number
  /** 当前的岛屿计数 */
  count: number
  note: string
  /** 下一步动作（由后一个快照回填，供 Hint 使用） */
  next: string
}

function buildSteps(): Step[] {
  const islands = GRID.map((row) => row.map(() => 0))
  const queue: Pos[] = []
  const steps: Step[] = []
  let count = 0
  let island = 0
  let absorbed = 0

  const snap = (
    phase: Step['phase'],
    current: Pos | null,
    added: Pos | null,
    note: string
  ): Step => ({
    phase,
    current: current ? { ...current } : null,
    added: added ? { ...added } : null,
    islands: islands.map((row) => row.slice()),
    island,
    queue: queue.map((p) => ({ ...p })),
    absorbed,
    count,
    note,
    next: '',
  })

  steps.push(
    snap(
      'init',
      null,
      null,
      `观察：输入是 ${M} 行 ${N} 列的网格，'1' 是陆地、'0' 是水；岛屿数 count = 0，BFS 队列为空，还没有任何陆地被并入岛屿。判断：每座岛屿恰好是一个四连通的 '1' 分量，所以按行优先扫描，遇到「尚未并入任何岛屿的 '1'」就说明发现了新岛。动作：采用题解的 BFS 版本（与 DFS 等价），以该格为起点入队，并在入队这一刻就把它标成已访问——题解的做法是原地把 '1' 改成 '0'（淹没），省掉 visited 数组。为什么：只沿上下左右扩散、且入队即标记，每个格子最多入队一次，时间 O(m×n)、空间 O(m×n)。`
    )
  )

  for (let i = 0; i < M; i++) {
    for (let j = 0; j < N; j++) {
      if (GRID[i][j] !== '1' || islands[i][j] !== 0) continue

      /* ---- 发现新岛：计数 +1，起点入队 ---- */
      count += 1
      island = count
      islands[i][j] = count
      absorbed += 1
      queue.push({ r: i, c: j })
      steps.push(
        snap(
          'discover',
          { r: i, c: j },
          null,
          `观察：行优先扫描到 (${i},${j})，它仍是 '1'，此前没有任何一座岛把它并入。判断：这是一座从未访问过的新岛屿，count 由 ${count - 1} 变为 ${count}。动作：立刻把它标记为岛屿 ${count}（题解就是原地把 '1' 改成 '0'，充当 visited），并作为 BFS 起点入队，队列长度回到 1。为什么：计数器只在这一处自增，而紧随其后的 BFS 会淹没整座岛，所以 count 恰好等于四连通分量的个数。`
        )
      )

      /* ---- BFS：反复取队首，把四邻接的未访问陆地并入当前岛屿 ---- */
      while (queue.length > 0) {
        const cur = queue.shift()
        if (!cur) break

        const fresh = DIRS.filter(([dr, dc]) => {
          const nr = cur.r + dr
          const nc = cur.c + dc
          return (
            nr >= 0 && nr < M && nc >= 0 && nc < N && GRID[nr][nc] === '1' && islands[nr][nc] === 0
          )
        }).length

        steps.push(
          snap(
            'pop',
            cur,
            null,
            `观察：从队首弹出 (${cur.r},${cur.c})，它在入队那一刻就已经被标记为岛屿 ${island}（题解 BFS 里的 grid[i][j] = '0'）。判断：它必定在网格内，只需看上下左右四个邻居、越界的一律跳过，这一刻其中还有 ${fresh} 个是未并入的 '1'。动作：按题解的 dirs 顺序「${DIR_NAMES.join('、')}」逐个检查这些邻居。为什么：入队即标记能保证同一个格子不会被两个邻居重复发现，扩散既不重叠也不会死循环。`
          )
        )

        for (const [dr, dc] of DIRS) {
          const nr = cur.r + dr
          const nc = cur.c + dc
          if (nr < 0 || nr >= M || nc < 0 || nc >= N) continue
          if (GRID[nr][nc] !== '1' || islands[nr][nc] !== 0) continue

          islands[nr][nc] = count
          absorbed += 1
          queue.push({ r: nr, c: nc })
          steps.push(
            snap(
              'enqueue',
              cur,
              { r: nr, c: nc },
              `观察：检查邻居 (${nr},${nc})：在网格内、值为 '1'，而且还没有被并入任何岛屿。判断：它与 (${cur.r},${cur.c}) 四连通，属于同一座岛屿 ${count}。动作：立刻把它标记为岛屿 ${count} 并压入队尾，队列长度变为 ${queue.length}。为什么：入队就标记（题解里是 grid[ni][nj] = '0'）让它不会被别的邻居再次发现，这正是每格最多入队一次的保证。`
            )
          )
        }
      }

      /* ---- 一岛收尾 ---- */
      let size = 0
      for (const row of islands) for (const v of row) if (v === count) size += 1
      steps.push(
        snap(
          'seal',
          null,
          null,
          `观察：队列已空，与起点 (${i},${j}) 连通的 ${size} 个陆地格已经全部标记为岛屿 ${count}。判断：这座岛被整片「淹没」了，外层扫描再遇到它们只会读到 '0' 而跳过。动作：回到双重循环，从 (${i},${j}) 起继续按行优先向右、向下扫描。为什么：已计数的分量整片变成了 '0'，不可能被第二次计数，这是答案不会偏大的原因。`
        )
      )
    }
  }

  steps.push(
    snap(
      'done',
      null,
      null,
      `观察：外层双重循环走完 ${M} × ${N} = ${M * N} 个格子，再没有出现未被并入的 '1'，count 停在 ${count}。判断：count 就是只算上下左右（不含对角）的四连通分量个数，也就是岛屿数量。动作：返回 ${count}，与题解示例 2 的输出一致。为什么：每个格子最多入队一次，时间 O(m×n)；最坏情况整片陆地连成一座岛，队列（DFS 版则是递归栈）为 O(m×n)。`
    )
  )

  /* 「下一步动作」由后一个快照回填，保证 Hint 与步骤数据完全一致 */
  const at = (p: Pos | null) => (p ? `(${p.r},${p.c})` : '')
  steps.forEach((s, i) => {
    const b = steps[i + 1]
    if (!b) return
    if (b.phase === 'discover') {
      s.next = `扫描到未并入的陆地 ${at(b.current)}：count +1，把它标成岛屿 ${b.count} 并入队`
    } else if (b.phase === 'pop') {
      s.next = `从队首弹出 ${at(b.current)}，检查它上下左右四个邻居`
    } else if (b.phase === 'enqueue') {
      s.next = `把邻居 ${at(b.added)} 并入岛屿 ${b.island} 并压入队尾`
    } else if (b.phase === 'seal') {
      s.next = `队列已空，岛屿 ${b.island} 淹没完毕，回到外层扫描找下一座岛`
    } else if (b.phase === 'done') {
      s.next = '所有格子扫描完毕，输出岛屿总数'
    }
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

const GAP = 6
const LABEL_W = 30
const CELL_W = 44
const GRID_MAX = LABEL_W + GAP + N * CELL_W + (N - 1) * GAP

/** 未访问陆地 → 白（idle）· 当前格 → 琥珀（active）· 已并入岛屿 → 青绿（new）· 水 → 灰（dim） */
function stateOf(step: Step, r: number, c: number): CellState {
  if (step.current && step.current.r === r && step.current.c === c) return 'active'
  if (step.islands[r][c] > 0) return 'new'
  return GRID[r][c] === '0' ? 'dim' : 'idle'
}

/** 格内文字：已并入的陆地显示岛屿编号 #k，其余显示原始字符 */
function cellText(step: Step, r: number, c: number): string {
  return step.islands[r][c] > 0 ? `#${step.islands[r][c]}` : GRID[r][c]
}

function Stage(step: Step) {
  const done = step.phase === 'done'
  const cur = step.current

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 正方形单元格网格；行列数 ≤ 10，因此在左侧与上方标出行列号，并用旗标指出当前格 */}
      <div
        className="grid w-full gap-1.5"
        style={{
          gridTemplateColumns: `1.875rem repeat(${N}, minmax(0, 1fr))`,
          maxWidth: GRID_MAX,
        }}
      >
        {/* 旗标行：当前格所在列 */}
        <span aria-hidden />
        {COLS.map((c) => (
          <div key={`flag-${c}`} className="flex h-6 items-end justify-center">
            {cur && cur.c === c && <Flag label="当前" tone="amber" />}
          </div>
        ))}

        {/* 列号行 */}
        <span className="flex items-center justify-end pr-1 font-code text-[10px] text-ink-soft">
          列
        </span>
        {COLS.map((c) => (
          <div key={`col-${c}`} className="flex h-5 items-center justify-center">
            <span
              className={cn(
                'font-code text-[11px]',
                cur && cur.c === c ? 'font-bold text-[hsl(var(--amber))]' : 'text-ink-soft'
              )}
            >
              {c}
            </span>
          </div>
        ))}

        {ROWS.map((r) => (
          <Fragment key={`row-${r}`}>
            <div className="flex items-center justify-center gap-0.5 pr-1 leading-none">
              <span
                className={cn(
                  'font-code text-[11px]',
                  cur && cur.r === r ? 'font-bold text-[hsl(var(--amber))]' : 'text-ink-soft'
                )}
              >
                {r}
              </span>
              {cur && cur.r === r && (
                <span className="font-code text-[10px] font-bold text-[hsl(var(--amber))]">◀</span>
              )}
            </div>
            {COLS.map((c) => (
              <Cell
                key={`cell-${r}-${c}`}
                state={stateOf(step, r, c)}
                size="sm"
                className="h-auto w-full min-w-0 aspect-square sm:min-w-0 sm:text-[15px]"
              >
                <span aria-label={`grid[${r}][${c}] = ${GRID[r][c]}`}>{cellText(step, r, c)}</span>
              </Cell>
            ))}
          </Fragment>
        ))}
      </div>

      <Badges className="justify-center">
        <Stat label="岛屿数" value={step.count} tone="easy" />
        <Stat label="已并入陆地" value={`${step.absorbed} / ${LAND_TOTAL}`} tone="teal" />
        <Badge tone={step.queue.length > 0 ? 'teal' : 'plain'}>
          队列{' '}
          <b className="font-code text-xs">
            {step.queue.length === 0
              ? '空'
              : `[${step.queue.map((p) => `(${p.r},${p.c})`).join(' ')}]`}
          </b>
        </Badge>
        {!done && step.next && <Hint>{step.next}</Hint>}
        {done && (
          <Answer>
            <b className="font-code">{step.count}</b> 座岛屿
          </Answer>
        )}
      </Badges>
    </div>
  )
}

export default function NumberOfIslandsDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="BFS 逐岛淹没，数四连通分量"
      info={`输入：grid = 题解「示例 2」的 ${M}×${N} 网格（左上 2×2 一座、中间 (2,2) 一座、右下 (3,3)-(3,4) 一座，输出 3）；示例 1 只能数出 1 座岛，为演示「发现新岛 → 扩散 → 收尾」的完整流程故选示例 2，它也是题解 main() 用的例子。演示采用题解的 BFS 版本（与 DFS 等价），完整走完发现新岛、队首出队、并入邻居、逐岛收尾与最终汇总，共 ${steps.length} 步。`}
      steps={steps}
      autoMs={1200}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '当前处理的格子（新岛屿的起点）' },
        { color: TONE.teal, label: '已并入岛屿的陆地，格内 #n = 岛屿编号' },
        { color: TONE.muted, label: "水 '0'，扩散时一律跳过" },
      ]}
    />
  )
}
