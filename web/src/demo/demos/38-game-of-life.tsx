import { Fragment, useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badge, Badges, Cell, Hint, Stat, TONE } from './stage'

/* ------------------------------------------------------------------ */
/* 38. 生命游戏 —— 模式 C：二维网格 + 逐代演进（状态编码实现同时更新）    */
/* ------------------------------------------------------------------ */

type Pos = [number, number]

/** 某一格的翻转记录：r/c 是坐标，n 是「原本活着」的邻居数 */
interface Flip {
  r: number
  c: number
  n: number
}

/** 题解「示例 1」的面板：4 行 3 列、5 个活细胞 */
const INPUT = [
  [0, 1, 0],
  [0, 0, 1],
  [1, 1, 1],
  [0, 0, 0],
]

const M = INPUT.length
const N = INPUT[0].length
const ROWS = INPUT.map((_, r) => r)
const COLS = INPUT[0].map((_, c) => c)

/** 八个方向：上下左右 + 四条对角线（题解的 directions） */
const DIRS: Pos[] = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1], [0, 1],
  [1, -1], [1, 0], [1, 1],
]

/** 演示的代数：第 5 代起凝固为 2×2 静物，之后再跑一代确认它不再变化 */
const GENERATIONS = 5

interface Generation {
  grid: number[][]
  born: Flip[]
  died: Flip[]
  live: number
}

interface Step {
  phase: 'init' | 'step' | 'done'
  gen: number
  grid: number[][]
  live: number
  /** 本代新生（死→活） */
  born: Flip[]
  /** 本代死亡（活→死） */
  died: Flip[]
  /** 下一代将翻转的格子：死→活（琥珀圈 + 「翻」） */
  nextBorn: Flip[]
  /** 下一代将翻转的格子：活→死（琥珀圈 + 「翻」） */
  nextDied: Flip[]
  /** 整盘已不再变化：静物 */
  stable: boolean
  note: string
  next: string
}

function countLive(grid: number[][]): number {
  return grid.reduce((sum, row) => sum + row.reduce((a, v) => a + v, 0), 0)
}

/**
 * 题解的原地算法跑一代：
 * 第一遍统计 8 邻居中「原本活着」的个数并写成 0/1/2/3 编码，第二遍全部 % 2 解码。
 */
function evolve(grid: number[][]): Generation {
  const b = grid.map((row) => row.slice())
  const born: Flip[] = []
  const died: Flip[] = []

  for (let i = 0; i < M; i++) {
    for (let j = 0; j < N; j++) {
      let liveNeighbors = 0
      for (const [di, dj] of DIRS) {
        const ni = i + di
        const nj = j + dj
        if (ni < 0 || ni >= M || nj < 0 || nj >= N) continue
        // 1 与 2 都表示「原本是活细胞」
        if (b[ni][nj] === 1 || b[ni][nj] === 2) liveNeighbors++
      }

      if (b[i][j] === 1) {
        // 活细胞：邻居少于 2 或多于 3 就写 2（活→死）
        if (liveNeighbors < 2 || liveNeighbors > 3) {
          b[i][j] = 2
          died.push({ r: i, c: j, n: liveNeighbors })
        }
      } else if (liveNeighbors === 3) {
        // 死细胞：邻居正好 3 个就写 3（死→活）
        b[i][j] = 3
        born.push({ r: i, c: j, n: liveNeighbors })
      }
    }
  }

  // 第二遍：编码对 2 取模，2 → 0、3 → 1
  for (let i = 0; i < M; i++) {
    for (let j = 0; j < N; j++) b[i][j] = b[i][j] % 2
  }

  return { grid: b, born, died, live: countLive(b) }
}

/* ---------------- 文案与格式化 ---------------- */

const fmtPos = (f: Flip) => `(${f.r},${f.c})`

const fmtBoard = (grid: number[][]) => `[${grid.map((row) => `[${row.join(',')}]`).join(',')}]`

/** 本代为什么这样翻转：逐格给出邻居数与命中的规则 */
function verdict(born: Flip[], died: Flip[]): string {
  return [
    ...born.map((f) => `${fmtPos(f)} 原本是死细胞、活邻居 ${f.n} 个，正好 3 个而复活`),
    ...died.map(
      (f) =>
        `${fmtPos(f)} 原本是活细胞、活邻居 ${f.n} 个，${
          f.n < 2 ? '少于 2 而孤独死亡' : '超过 3 而拥挤死亡'
        }`
    ),
  ].join('；')
}

/** 各代「为什么这样做」的收尾，避免每一步重复同一句话（第 5 代走 done 分支，不查这张表） */
const WHY: Record<number, string> = {
  1: `编码把旧状态留在低位，任何格子取模后都能拿回原值，${M * N} 格因此等价于同时翻转`,
  2: `计数时 1 和 2 都算「原本活着」，否则已被标成 2 的邻居会被漏掉`,
  3: `活细胞的存活区间是邻居数 2 或 3，写成 2 的格子仍算原本活着，第二遍取模才把它变回 0`,
  4: `哪怕整盘只有一格翻转，也必须先编码再解码，直接改值会让后面计数的格子读到新状态`,
}

function buildSteps(): Step[] {
  const grid0 = INPUT.map((row) => row.slice())
  const live0 = countLive(grid0)

  // 连跑 GENERATIONS 代：gens[i] 是第 i+1 代，带着这一代的翻转记录
  const gens: Generation[] = []
  let cur = grid0
  for (let g = 0; g < GENERATIONS; g++) {
    const next = evolve(cur)
    gens.push(next)
    cur = next.grid
  }
  // 再跑一代：若第 5 代已是静物，这一遍不会有任何翻转，用它确认「不再变化」
  const afterLast = evolve(gens[GENERATIONS - 1].grid)

  const frames: Omit<Step, 'note' | 'next'>[] = [
    {
      phase: 'init',
      gen: 0,
      grid: grid0,
      live: live0,
      born: [],
      died: [],
      nextBorn: gens[0].born,
      nextDied: gens[0].died,
      stable: false,
    },
  ]

  gens.forEach((g, i) => {
    const after = i + 1 < gens.length ? gens[i + 1] : afterLast
    frames.push({
      phase: i === gens.length - 1 ? 'done' : 'step',
      gen: i + 1,
      grid: g.grid,
      live: g.live,
      born: g.born,
      died: g.died,
      nextBorn: after.born,
      nextDied: after.died,
      stable: after.born.length === 0 && after.died.length === 0,
    })
  })

  const steps: Step[] = frames.map((f, i) => {
    const prevLive = i === 0 ? live0 : frames[i - 1].live
    let note: string

    if (f.phase === 'init') {
      note = `观察：输入是题解「示例 1」的 ${M} 行 ${N} 列面板，${
        M * N
      } 格里现在有 ${f.live} 个活细胞，题目要求所有细胞同时更新。判断：若直接把新状态写回原格，后面的格子就会读到新值，所以用状态编码把旧状态压进低位——1、2 表示原本活着，0、3 表示原本是死的。动作：第一遍逐格统计 8 个邻居中「原本活着」的个数（值 1 或 2 都算）并按规则写出 0/1/2/3，第二遍全部 % 2 解码；琥珀圈出的 ${
        f.nextBorn.length + f.nextDied.length
      } 格就是这一步将要翻转的细胞。为什么：写的是编码而不是最终值，任何格子取模后都能拿回旧状态，${
        M * N
      } 格因此等价于同时翻转。`
    } else if (f.phase === 'done') {
      note = `观察：第 ${f.gen} 代扫描完成，存活数由 ${prevLive} 变为 ${f.live}：${
        f.born.length
      } 格复活、${
        f.died.length
      } 格死亡。判断：${verdict(
        f.born,
        f.died
      )}；把这一代再交给同一段代码依旧没有任何翻转，说明右下角的 2×2 方块是静物 —— 方块里每格恰好 3 个活邻居，所以第 5 代之后再跑也不会变。动作：读出最终面板 ${fmtBoard(
        f.grid
      )} 并写回 board；注意题目只要求调用一次 gameOfLife 求下一状态，示例 1 的返回值就是第 1 代 ${fmtBoard(
        gens[0].grid
      )}。为什么：两遍扫描中每格只检查 8 个邻居，时间 O(mn)；编码就地写在原格上，额外空间 O(1)。`
    } else {
      note = `观察：第 ${f.gen} 代扫描完成，存活数由 ${prevLive} 变为 ${f.live}：${
        f.born.length
      } 格复活、${
        f.died.length
      } 格死亡。判断：${verdict(
        f.born,
        f.died
      )}。动作：第一遍把死→活写成 3、活→死写成 2，其余格保持 0 或 1，第二遍整盘 % 2 解码得到第 ${
        f.gen
      } 代面板。为什么：${WHY[f.gen]}。`
    }

    return { ...f, note, next: '' }
  })

  // 「下一步动作」由后一个快照推导，保证提示与步骤数据一致
  steps.forEach((s, i) => {
    const b = steps[i + 1]
    if (!b) return
    s.next =
      s.phase === 'init'
        ? `逐格统计 8 个邻居并写出编码，解出第 ${b.gen} 代`
        : `对第 ${s.gen} 代重新统计邻居，解出第 ${b.gen} 代`
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

const GAP = 6
const LABEL_W = 30
const CELL_W = 60
const GRID_MAX = LABEL_W + GAP + N * CELL_W + (N - 1) * GAP

/** 格内小标记的配色（字面量写在源码里，Tailwind 才能扫到），颜色 + 文字双通道 */
const CHIP: Record<'easy' | 'hard' | 'amber' | 'teal', string> = {
  easy: 'bg-[hsl(var(--easy-soft))] text-[hsl(var(--easy))]',
  hard: 'bg-[hsl(var(--hard-soft))] text-[hsl(var(--hard))]',
  amber: 'bg-[hsl(var(--amber-soft))] text-[hsl(var(--amber))]',
  teal: 'bg-[hsl(var(--teal-soft))] text-[hsl(var(--teal))]',
}

function Chip({ tone, children }: { tone: keyof typeof CHIP; children: string }) {
  return (
    <span className={`rounded-sm px-1 text-[9px] font-bold leading-none ${CHIP[tone]}`}>
      {children}
    </span>
  )
}

function Stage(step: Step) {
  const done = step.phase === 'done'
  const born = new Set(step.born.map((f) => f.r * N + f.c))
  const died = new Set(step.died.map((f) => f.r * N + f.c))
  const flipping = new Set([...step.nextBorn, ...step.nextDied].map((f) => f.r * N + f.c))

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 正方形单元格网格；行列数 ≤ 10，因此在左侧与上方标出行列号 */}
      <div
        className="grid w-full gap-1.5"
        style={{
          gridTemplateColumns: `1.875rem repeat(${N}, minmax(0, 1fr))`,
          maxWidth: GRID_MAX,
        }}
      >
        <span aria-hidden />
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
              const k = r * N + c
              const alive = step.grid[r][c] === 1
              const isBorn = born.has(k)
              const isDied = died.has(k)
              const willFlip = flipping.has(k)
              const still = done && step.stable && alive
              const ring = willFlip
                ? 'ring-2 ring-[hsl(var(--amber))]'
                : still
                  ? 'ring-2 ring-[hsl(var(--teal))]'
                  : ''
              return (
                <Cell
                  key={`cell-${r}-${c}`}
                  size="sm"
                  className={`h-auto w-full min-w-0 flex-col gap-0.5 aspect-square sm:text-[15px] ${
                    alive ? 'border-[hsl(var(--ink))] bg-[hsl(var(--ink))]' : ''
                  } ${ring}`}
                >
                  <span
                    className="font-code"
                    aria-label={`board[${r}][${c}]`}
                    style={alive ? { color: 'hsl(var(--card))' } : undefined}
                  >
                    {alive ? 1 : 0}
                  </span>
                  <span className="flex h-3 items-center justify-center gap-0.5 leading-none">
                    {isBorn && <Chip tone="easy">生</Chip>}
                    {isDied && <Chip tone="hard">亡</Chip>}
                    {willFlip && <Chip tone="amber">翻</Chip>}
                    {still && <Chip tone="teal">静</Chip>}
                  </span>
                </Cell>
              )
            })}
          </Fragment>
        ))}
      </div>

      <Badges className="justify-center">
        <Stat label="代数" value={`第 ${step.gen} 代`} tone="amber" />
        <Stat label="存活" value={`${step.live} / ${M * N}`} tone="easy" />
        {step.phase === 'init' ? (
          <Badge tone="medium">
            第 {step.gen + 1} 代将翻转{' '}
            <b className="font-code text-xs">{step.nextBorn.length + step.nextDied.length}</b> 格
          </Badge>
        ) : (
          <Badge>
            本代变化{' '}
            <b className="font-code text-xs text-[hsl(var(--easy))]">生 {step.born.length}</b>
            {' · '}
            <b className="font-code text-xs text-[hsl(var(--hard))]">亡 {step.died.length}</b>
          </Badge>
        )}
        {!done && step.next && <Hint>{step.next}</Hint>}
        {done && (
          <Answer>
            最终面板 <b className="font-code">{fmtBoard(step.grid)}</b>
          </Answer>
        )}
      </Badges>
    </div>
  )
}

export default function GameOfLifeDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="逐代演进：状态编码实现同时更新"
      info={`输入取自题解「示例 1」：board = [[0,1,0],[0,0,1],[1,1,1],[0,0,0]]，4 行 3 列、5 个活细胞，是能完整看到「孤独死亡 / 拥挤死亡 / 复活」三类规则的官方样例（示例 2 的 2×2 一代之后就凝固了，看不出过程）。题目只要求调用一次 gameOfLife 返回下一状态，即第 1 代 [[0,0,0],[1,0,1],[0,1,1],[0,1,0]]；演示把同一段算法连跑 5 代以看清规则的反复作用，第 5 代起凝固为 2×2 静物，共 6 步（初始 + 5 代）。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.ink, label: '活细胞（实心）' },
        { color: TONE.amber, label: '下一代将翻转（翻）' },
        { color: TONE.easy, label: '本代新生（生）' },
        { color: TONE.hard, label: '本代死亡（亡）' },
        { color: TONE.teal, label: '第 5 代起的 2×2 静物（静）' },
      ]}
    />
  )
}
