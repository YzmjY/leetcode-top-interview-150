import { Fragment, useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badge, Badges, Cell, Hint, Stat, TONE, type CellState } from './stage'

/* ------------------------------------------------------------------ */
/* 37. 矩阵置零 —— 模式 C：二维网格 + 首行首列当标记数组的原地解法      */
/* ------------------------------------------------------------------ */

/** 题解「示例 1」：最小且能同时演示标记与置零的官方例子 */
const MATRIX = [
  [1, 1, 1],
  [1, 0, 1],
  [1, 1, 1],
]

const M = MATRIX.length
const N = MATRIX[0].length
const ROWS = MATRIX.map((_, r) => r)
const COLS = MATRIX[0].map((_, c) => c)

/** 格子扮演的角色：row = 第 i 行的行标记，col = 第 j 列的列标记 */
type MarkKind = 'row' | 'col' | null

interface Step {
  /** 阶段标记：首步 init、末步 done；kind 保留作阶段内的动作细分 */
  phase: 'init' | 'check' | 'mark' | 'apply' | 'done'
  kind:
    | 'init'
    | 'check-first-row'
    | 'check-first-col'
    | 'scan'
    | 'mark'
    | 'mark-done'
    | 'apply'
    | 'skip'
    | 'first-row'
    | 'first-col'
    | 'done'
  /** 矩阵当前快照（标记会被写进首行/首列，所以这里显示的是「算法眼中的真实值」） */
  grid: number[][]
  /** 未被算法改写的原始输入，用来标出「这个 0 是本来就有的」 */
  original: number[][]
  cell: { r: number; c: number } | null
  /** marks[r][c]：该格此刻是否正在充当行 / 列标记 */
  marks: MarkKind[][]
  firstRowZero: boolean
  firstColZero: boolean
  rowMarked: boolean[]
  colMarked: boolean[]
  note: string
  next: string
}

/** kind → phase 的归并：init / 首行首列检查 / 打标记 / 置零 / done */
const PHASE_OF: Record<Step['kind'], Step['phase']> = {
  init: 'init',
  'check-first-row': 'check',
  'check-first-col': 'check',
  scan: 'mark',
  mark: 'mark',
  'mark-done': 'mark',
  apply: 'apply',
  skip: 'apply',
  'first-row': 'apply',
  'first-col': 'apply',
  done: 'done',
}

function buildSteps(): Step[] {
  const grid = MATRIX.map((row) => row.slice())
  const original = MATRIX.map((row) => row.slice())
  const marks: MarkKind[][] = MATRIX.map((row) => row.map(() => null))
  const rowMarked = new Array<boolean>(M).fill(false)
  const colMarked = new Array<boolean>(N).fill(false)
  let firstRowZero = false
  let firstColZero = false

  const steps: Step[] = []

  const snap = (
    kind: Step['kind'],
    cell: Step['cell'],
    note: string
  ): Step => ({
    phase: PHASE_OF[kind],
    kind,
    cell,
    grid: grid.map((row) => row.slice()),
    original: original.map((row) => row.slice()),
    marks: marks.map((row) => row.slice()),
    firstRowZero,
    firstColZero,
    rowMarked: rowMarked.slice(),
    colMarked: colMarked.slice(),
    note,
    next: '',
  })

  /* 初始化：先声明两个布尔变量保存首行 / 首列的原始状态 */
  steps.push(
    snap(
      'init',
      null,
      `观察：输入是 ${M}×${N} 矩阵 matrix = [[1,1,1],[1,0,1],[1,1,1]]，唯一的 0 在内部格子 (1,1)。判断：题目要求原地算法，但首行与首列本身可能含 0，不能直接把它们当纯标记用。动作：先用布尔变量 firstRowZero、firstColZero 保存首行 / 首列是否含 0，再把首行当作「列标记数组」、首列当作「行标记数组」。为什么：把标记信息寄存在矩阵自身里，额外空间才能是 O(1)。`
    )
  )

  /* 第 1 步：检查首行 */
  for (let j = 0; j < N; j++) if (grid[0][j] === 0) firstRowZero = true
  steps.push(
    snap(
      'check-first-row',
      { r: 0, c: 0 },
      `观察：逐列检查首行 —— matrix[0][0] = ${grid[0][0]}、matrix[0][1] = ${grid[0][1]}、matrix[0][2] = ${grid[0][2]}，没有 0。判断：首行不含 0，所以 firstRowZero = ${firstRowZero}，首行最后不需要整体清零。动作：把结论存进布尔变量，随后才能放心用首行做列标记。为什么：这个检查必须早于任何标记写入，否则标记的 0 会被误当成「首行本来就有 0」。`
    )
  )

  /* 第 2 步：检查首列 */
  for (let i = 0; i < M; i++) if (grid[i][0] === 0) firstColZero = true
  steps.push(
    snap(
      'check-first-col',
      { r: 0, c: 0 },
      `观察：逐行检查首列 —— matrix[0][0] = ${grid[0][0]}、matrix[1][0] = ${grid[1][0]}、matrix[2][0] = ${grid[2][0]}，没有 0。判断：首列不含 0，所以 firstColZero = ${firstColZero}，首列最后也不需要整体清零。动作：与首行同理，先把原始状态寄存在布尔变量里。为什么：这两次检查共 2(m + n) 次比较，代价是常数级空间换来的。`
    )
  )

  /* 第 3 步：扫描内部格子打标记（下标都从 1 开始，跳过首行首列） */
  for (let i = 1; i < M; i++) {
    for (let j = 1; j < N; j++) {
      if (grid[i][j] === 0) {
        grid[i][0] = 0
        grid[0][j] = 0
        marks[i][0] = 'row'
        marks[0][j] = 'col'
        rowMarked[i] = true
        colMarked[j] = true
        steps.push(
          snap(
            'mark',
            { r: i, c: j },
            `观察：内部格子 (${i},${j}) = 0，它所在的行必须清零、所在的列也必须清零。判断：矩阵的存储位置还没用，正好把「第 ${i} 行要清零」记到 matrix[${i}][0]、「第 ${j} 列要清零」记到 matrix[0][${j}]。动作：写下这两个标记（matrix[${i}][0] 与 matrix[0][${j}] 都变成 0 的橙色待处理格），rowMarked[${i}] 与 colMarked[${j}] 置真。为什么：行标记全部落在第 0 列、列标记全部落在第 0 行，两类标记互不干扰，无需任何额外数组。`
          )
        )
      } else {
        steps.push(
          snap(
            'scan',
            { r: i, c: j },
            `观察：内部格子 (${i},${j}) = ${grid[i][j]}，不是 0。判断：它既不触发行标记，也不触发列标记。动作：跳过，不写入任何数据。为什么：标记只由内部值为 0 的格子产生，误标会让不相干的行列被清空。`
          )
        )
      }
    }
  }

  steps.push(
    snap(
      'mark-done',
      null,
      `观察：内部格子已全部扫描完，此时待清零的行 = {${rowMarked
        .map((v, i) => (v ? i : -1))
        .filter((i) => i > 0)
        .join(', ')}}，待清零的列 = {${colMarked
        .map((v, j) => (v ? j : -1))
        .filter((j) => j > 0)
        .join(', ')}}。判断：这些行列信息全部寄存在首行与首列的 0 里。动作：进入置零扫描，改用首行 / 首列的标记去判定每个内部格子。为什么：标记写的是「行 / 列含零」，而不是「这一格要清零」，两者恰好等价，可以就地保存。`
    )
  )

  /* 第 4 步：按标记清零内部格子 */
  for (let i = 1; i < M; i++) {
    for (let j = 1; j < N; j++) {
      const byRow = grid[i][0] === 0
      const byCol = grid[0][j] === 0
      if (byRow || byCol) {
        grid[i][j] = 0
        steps.push(
          snap(
            'apply',
            { r: i, c: j },
            `观察：内部格子 (${i},${j}) 的行标记 matrix[${i}][0] = ${grid[i][0]}，列标记 matrix[0][${j}] = ${grid[0][j]}。判断：${
              byRow && byCol
                ? `行与列都被标记，成立`
                : byRow
                  ? `第 ${i} 行被标记，条件 matrix[${i}][0] == 0 || matrix[0][${j}] == 0 成立`
                  : `第 ${j} 列被标记，条件 matrix[${i}][0] == 0 || matrix[0][${j}] == 0 成立`
            }。动作：把 matrix[${i}][${j}] 置为 0（原本就是 0 的格子是空操作，红色只表示该格属于含零行/列）。为什么：含零行与含零列的并集正好就是所有该清零的格子。`
          )
        )
      } else {
        steps.push(
          snap(
            'skip',
            { r: i, c: j },
            `观察：内部格子 (${i},${j})，行标记 matrix[${i}][0] = ${grid[i][0]}、列标记 matrix[0][${j}] = ${grid[0][j]}，都不是 0。判断：条件 matrix[${i}][0] == 0 || matrix[0][${j}] == 0 不成立。动作：保持原值 ${grid[i][j]} 不变。为什么：这一行、这一列都不含零，不该被误清。`
          )
        )
      }
    }
  }

  /* 第 5 步：用布尔变量处理首行 */
  if (firstRowZero) {
    for (let j = 0; j < N; j++) grid[0][j] = 0
    steps.push(
      snap(
        'first-row',
        null,
        `观察：首行此前不参与置零扫描，只能靠 firstRowZero 决定，而它为 true。判断：首行原本就含 0。动作：把整个首行 {j = 0…${N - 1}} 置为 0。为什么：首行既存过列标记又是数据行，必须在标记全部用完之后才能整体清零。`
      )
    )
  } else {
    steps.push(
      snap(
        'first-row',
        null,
        `观察：首行此前不参与置零扫描，只能靠 firstRowZero 决定，而它为 false。判断：首行原本不含 0。动作：首行保持不动，只保留其中作为列标记的格子。为什么：若在此处不分青红皂白清零，就会清掉本来没有零的列。`
      )
    )
  }

  /* 第 6 步：用布尔变量处理首列 */
  if (firstColZero) {
    for (let i = 0; i < M; i++) grid[i][0] = 0
    steps.push(
      snap(
        'first-col',
        null,
        `观察：最后处理首列，firstColZero = true。判断：首列原本就含 0。动作：把整个首列 {i = 0…${M - 1}} 置为 0。为什么：与首行同理，它同时承担行标记与数据两种角色，只能在最后处理。`
      )
    )
  } else {
    steps.push(
      snap(
        'first-col',
        null,
        `观察：最后处理首列，firstColZero = false。判断：首列原本不含 0，但它里面的 0 是行标记。动作：首列保持现状，不整体清零。为什么：标记格子本身就是含零行上的格子，早该是 0，保持现状正好正确。`
      )
    )
  }

  const flat = `[[${grid[0].join(',')}],[${grid[1].join(',')}],[${grid[2].join(',')}]]`
  steps.push(
    snap(
      'done',
      null,
      `观察：四次扫描与首行 / 首列兜底都已完成，最终矩阵为 ${flat}，与题解示例 1 的输出一致。判断：含零行是第 1 行、含零列是第 1 列，只有它们的并集被清零。动作：按行读回矩阵即为答案。为什么：每格至多被访问常数次，时间 O(mn)；额外空间只有两个布尔变量与常数个下标，O(1)。`
    )
  )

  /* 「下一步」动作由后一个快照推导，保证提示与步骤数据一致 */
  const pos = (c: Step['cell']) => (c ? `(${c.r},${c.c})` : '')
  steps.forEach((s, i) => {
    const b = steps[i + 1]
    if (!b) return
    switch (b.kind) {
      case 'check-first-row':
        s.next = '逐列检查首行有没有 0，确定 firstRowZero'
        break
      case 'check-first-col':
        s.next = '逐行检查首列有没有 0，确定 firstColZero'
        break
      case 'scan':
        s.next = `从 (1,1) 起按行扫描内部格子，检查 ${pos(b.cell)} 是不是 0`
        break
      case 'mark':
        s.next = `扫描到 (${b.cell?.r},${b.cell?.c}) = 0，写下 matrix[${b.cell?.r}][0] 与 matrix[0][${b.cell?.c}] 两个行 / 列标记`
        break
      case 'mark-done':
        s.next = '标记阶段结束，进入按标记置零的第二次扫描'
        break
      case 'apply':
        s.next = `检查 ${pos(b.cell)} 的行 / 列标记，命中就把 ${pos(b.cell)} 置 0`
        break
      case 'skip':
        s.next = `检查 ${pos(b.cell)} 的行 / 列标记，行与列都无标记就跳过`
        break
      case 'first-row':
        s.next = `用 firstRowZero 兜底处理首行`
        break
      case 'first-col':
        s.next = '用 firstColZero 兜底处理首列'
        break
      case 'done':
        s.next = '读出最终矩阵并说明复杂度'
        break
      default:
        break
    }
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

const GAP = 6
const LABEL_W = 34
const CELL_W = 44
const GRID_MAX = LABEL_W + GAP + N * CELL_W + (N - 1) * GAP

/** 原始输入里本来就有的 0（不是标记写出来的 0） */
function isOriginalZero(step: Step, r: number, c: number): boolean {
  return step.original[r][c] === 0 && step.grid[r][c] === 0 && !step.marks[r][c]
}

function cellState(step: Step, r: number, c: number): CellState {
  if (step.cell && step.cell.r === r && step.cell.c === c) return 'active'
  if (step.marks[r][c]) return 'warn'
  if (step.grid[r][c] === 0) return 'bad'
  if (step.kind === 'done') return 'ok'
  return 'idle'
}

/** 格内角色标签：保证状态不只靠颜色区分 */
function cellTag(step: Step, r: number, c: number): string | null {
  if (step.marks[r][c] === 'row') return '行标记'
  if (step.marks[r][c] === 'col') return '列标记'
  if (isOriginalZero(step, r, c)) return '原 0'
  return null
}

/** 被标记覆盖掉的原始值，用小字划掉保留信息 */
function overwritten(step: Step, r: number, c: number): number | null {
  if (!step.marks[r][c]) return null
  const v = step.original[r][c]
  return v === 0 ? null : v
}

function Stage(step: Step) {
  const done = step.kind === 'done'
  const markedRows = step.rowMarked.map((v, i) => (v ? i : -1)).filter((i) => i > 0)
  const markedCols = step.colMarked.map((v, j) => (v ? j : -1)).filter((j) => j > 0)
  const marking = step.kind === 'mark' || step.kind === 'mark-done'
  const zeroes = step.rowMarked.filter(Boolean).length > 0 || step.colMarked.filter(Boolean).length > 0

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 正方形单元格网格；行列数 ≤ 10，因此在左侧与上方标出行列号 */}
      <div
        className="grid w-full gap-1.5"
        style={{
          gridTemplateColumns: `2.125rem repeat(${N}, minmax(0, 1fr))`,
          maxWidth: GRID_MAX,
        }}
      >
        <span aria-hidden />
        {COLS.map((c) => (
          <div key={`col-${c}`} className="flex h-4 items-center justify-center gap-1 leading-none">
            <span className="font-code text-[11px] text-ink-soft">{c}</span>
            {c === 0 && <span className="text-[10px] text-ink-soft">首列</span>}
          </div>
        ))}
        {ROWS.map((r) => (
          <Fragment key={`row-${r}`}>
            <div className="flex flex-col items-center justify-center gap-0.5 leading-none">
              <span className="font-code text-[11px] text-ink-soft">{r}</span>
              {r === 0 && <span className="text-[10px] text-ink-soft">首行</span>}
            </div>
            {COLS.map((c) => {
              const tag = cellTag(step, r, c)
              const old = overwritten(step, r, c)
              return (
                <Cell
                  key={`cell-${r}-${c}`}
                  state={cellState(step, r, c)}
                  size="sm"
                  className="h-auto w-full min-w-0 flex-col gap-0 aspect-square sm:text-[15px]"
                >
                  <span aria-label={`matrix[${r}][${c}]`}>{step.grid[r][c]}</span>
                  {tag && (
                    <span className="font-code text-[9px] leading-none opacity-80">{tag}</span>
                  )}
                  {old !== null && (
                    <span className="font-code text-[9px] leading-none line-through opacity-70">
                      {old}
                    </span>
                  )}
                </Cell>
              )
            })}
          </Fragment>
        ))}
      </div>

      <Badges className="justify-center">
        {step.cell && (
          <Stat
            label="当前格"
            value={`(${step.cell.r},${step.cell.c}) = ${step.grid[step.cell.r][step.cell.c]}`}
            tone="amber"
          />
        )}
        <Stat
          label="首行 / 首列含 0"
          value={`firstRowZero = ${step.firstRowZero ? 'true' : 'false'} · firstColZero = ${
            step.firstColZero ? 'true' : 'false'
          }`}
          tone={step.firstRowZero || step.firstColZero ? 'medium' : 'ink'}
        />
        <Badge tone={marking ? 'medium' : 'plain'}>
          行标记{' '}
          <b className="font-code text-xs">{markedRows.length > 0 ? markedRows.join(',') : '无'}</b>
          {' · '}列标记{' '}
          <b className="font-code text-xs">{markedCols.length > 0 ? markedCols.join(',') : '无'}</b>
        </Badge>
        {!done && step.next && <Hint>{step.next}</Hint>}
        {done && (
          <Answer>
            最终矩阵{' '}
            <b className="font-code">
              [
              {step.grid
                .map((row) => `[${row.join(',')}]`)
                .join(',')}
              ]
            </b>
            {zeroes ? '，含零行列为 1 行 1 列' : ''}
          </Answer>
        )}
      </Badges>
    </div>
  )
}

export default function SetMatrixZeroesDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="首行首列当标记，原地置零"
      info="输入取自题解「示例 1」：matrix = [[1,1,1],[1,0,1],[1,1,1]]，3×3 且内部恰好一个 0，是能同时演示「打标记」与「按标记置零」的最小样例。完整走完 6 个阶段（首行检查、首列检查、内部打标记、按标记置零、首行兜底、首列兜底），共 15 步；更大的输入只是重复同样的扫描，故未换用示例 2。"
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '当前扫描的格子' },
        { color: TONE.medium, label: '行标记 / 列标记（待处理）' },
        { color: TONE.hard, label: '值为 0 或被置零' },
        { color: TONE.easy, label: '结束后保留的值' },
      ]}
    />
  )
}
