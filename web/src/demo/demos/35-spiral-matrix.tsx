import { Fragment, useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badge, Badges, Cell, Hint, Stat, TONE, type CellState } from './stage'

/* ------------------------------------------------------------------ */
/* 35. 螺旋矩阵 —— 模式 C：二维网格 + 边界收缩法                         */
/* ------------------------------------------------------------------ */

const MATRIX = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
]

const M = MATRIX.length
const N = MATRIX[0].length
const ROWS = MATRIX.map((_, r) => r)
const COLS = MATRIX[0].map((_, c) => c)

/** 四段方向：0 上边界右行 · 1 右边界下行 · 2 下边界左行 · 3 左边界上行 */
const DIR_NAME = ['左→右（上边界）', '上→下（右边界）', '右→左（下边界）', '下→上（左边界）']
const DIR_VERB = ['继续向右', '继续向下', '继续向左', '继续向上']
/** 段号 → 边缘标记字母，与网格行列号旁标注的字母一致 */
const DIR_MARK = ['T', 'R', 'B', 'L']

interface Step {
  phase: 'init' | 'visit' | 'done'
  dir: 0 | 1 | 2 | 3 | null
  top: number
  bottom: number
  left: number
  right: number
  cell: { r: number; c: number; v: number } | null
  /** 收集顺序：0 = 未访问，n = 第 n 个被取出 */
  orders: number[][]
  result: number[]
  note: string
  next: string
}

function buildSteps(): Step[] {
  const orders = MATRIX.map((row) => row.map(() => 0))
  const result: number[] = []
  const steps: Step[] = []
  let top = 0
  let bottom = M - 1
  let left = 0
  let right = N - 1

  const snapshot = (
    phase: Step['phase'],
    dir: Step['dir'],
    cell: Step['cell'],
    note: string
  ): Step => ({
    phase,
    dir,
    top,
    bottom,
    left,
    right,
    cell,
    orders: orders.map((row) => row.slice()),
    result: result.slice(),
    note,
    next: '',
  })

  const visitNote = (dir: 0 | 1 | 2 | 3, r: number, c: number): string => {
    const v = MATRIX[r][c]
    const k = result.length
    const lone = top === bottom && left === right ? `，矩形此刻只剩这一格` : ''
    if (dir === 0) {
      return `观察：上边界 top = ${top} 这一行尚未走完，当前格是 (${r},${c})${lone}。判断：它位于未访问矩形的最上一行，属于第 1 段「左→右」。动作：取 matrix[${r}][${c}] = ${v}，成为结果第 ${k} 个元素，整行走完后 top 下移。为什么：左上角是螺旋起点，取完这一行后剩余格子仍是矩形，边界不变量得以保持。`
    }
    if (dir === 1) {
      return `观察：右边界 right = ${right} 这一列尚未走完，当前格是 (${r},${c})${lone}。判断：右上角已被上边界那趟取走，所以本段从 top = ${top} 开始向下，属于第 2 段「上→下」。动作：取 matrix[${r}][${c}] = ${v}，成为结果第 ${k} 个元素，整列走完后 right 左移。为什么：起点必须取 top 而非 0，否则角落那格会被重复收集。`
    }
    if (dir === 2) {
      return `观察：下边界 bottom = ${bottom} 这一行尚未走完，当前格是 (${r},${c})${lone}。判断：进入本段前已确认 top = ${top} ≤ bottom = ${bottom}，下边界确实还有没走过的行，属于第 3 段「右→左」。动作：取 matrix[${r}][${c}] = ${v}，成为结果第 ${k} 个元素，整行走完后 bottom 上移。为什么：这个比较挡住的正是单行矩阵——否则刚走过的行会被从右到左再收一遍。`
    }
    return `观察：左边界 left = ${left} 这一列尚未走完，当前格是 (${r},${c})${lone}。判断：进入本段前已确认 left = ${left} ≤ right = ${right}，属于第 4 段「下→上」。动作：取 matrix[${r}][${c}] = ${v}，成为结果第 ${k} 个元素，整列走完后 left 右移。为什么：与第 3 段同理，这个判断防止单列矩阵把已取过的格子再走一遍，一圈到此闭合。`
  }

  const take = (r: number, c: number, dir: 0 | 1 | 2 | 3) => {
    result.push(MATRIX[r][c])
    orders[r][c] = result.length
    steps.push(snapshot('visit', dir, { r, c, v: MATRIX[r][c] }, visitNote(dir, r, c)))
  }

  steps.push(
    snapshot(
      'init',
      null,
      null,
      `观察：输入是 ${M} 行 ${N} 列的矩阵，四条边界初始化为 top = 0、bottom = ${M - 1}、left = 0、right = ${N - 1}，result 为空。判断：尚未访问的格子恰好构成矩形 [top..bottom] × [left..right]，所以不需要额外的 visited 数组。动作：每轮按「上边界 → 右边界 → 下边界 → 左边界」顺时针走一圈，每走完一条边就把对应边界向内收缩一格。`
    )
  )

  while (top <= bottom && left <= right) {
    for (let j = left; j <= right; j++) take(top, j, 0)
    top++
    for (let i = top; i <= bottom; i++) take(i, right, 1)
    right--
    if (top <= bottom) {
      for (let j = right; j >= left; j--) take(bottom, j, 2)
      bottom--
    }
    if (left <= right) {
      for (let i = bottom; i >= top; i--) take(i, left, 3)
      left++
    }
  }

  const stopped =
    top > bottom ? `top = ${top} > bottom = ${bottom}` : `left = ${left} > right = ${right}`
  steps.push(
    snapshot(
      'done',
      null,
      null,
      `观察：边界不再有交集（${stopped}），未访问矩形已空，循环结束。动作：共取出 ${result.length} 个元素，恰好等于 m × n = ${M} × ${N}，螺旋顺序为 [${result.join(', ')}]。为什么：每格只被取出一次，时间 O(mn)；额外空间只有四个边界变量，O(1)。`
    )
  )

  // 「下一步动作」由后一个快照推导，保证与步骤数据完全一致
  steps.forEach((s, i) => {
    const b = steps[i + 1]
    if (!b) return
    if (!b.cell || b.dir === null) {
      s.next = '边界交叉，输出完整螺旋顺序'
      return
    }
    const pos = `(${b.cell.r},${b.cell.c})`
    if (s.dir === b.dir) {
      s.next = `${DIR_VERB[b.dir]}，取 ${pos}`
    } else if (s.dir === null) {
      s.next = `从 ${pos} 起步，第 1 段 ${DIR_NAME[b.dir]}`
    } else {
      s.next = `第 ${s.dir + 1} 段结束、边界内缩，转第 ${b.dir + 1} 段 ${DIR_NAME[b.dir]}`
    }
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

const GAP = 6
const LABEL_W = 30
const CELL_W = 44
const GRID_MAX = LABEL_W + GAP + N * CELL_W + (N - 1) * GAP

function Stage(step: Step) {
  const activeMark = step.dir === null ? null : DIR_MARK[step.dir]
  const count = step.result.length
  const done = step.phase === 'done'

  const stateOf = (r: number, c: number): CellState => {
    if (step.cell && step.cell.r === r && step.cell.c === c) return 'active'
    return step.orders[r][c] > 0 ? 'ok' : 'dim'
  }

  /** 正在走的那条边的标记字母用琥珀，其余边界标记用青绿；两种都带字母，不只靠颜色 */
  const labelClass = (marks: string[]) =>
    marks.includes(activeMark ?? '')
      ? 'font-code text-[10px] font-bold text-[hsl(var(--amber))]'
      : 'font-code text-[10px] font-bold text-[hsl(var(--teal))]'

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
        {COLS.map((c) => {
          const marks: string[] = []
          if (c === step.left) marks.push('L')
          if (c === step.right) marks.push('R')
          const arrow =
            step.dir === 1 && c === step.right ? '↓' : step.dir === 3 && c === step.left ? '↑' : ''
          return (
            <div key={`col-${c}`} className="flex h-4 items-center justify-center gap-0.5 leading-none">
              {marks.length > 0 && (
                <span className={labelClass(marks)}>
                  {marks.join('')}
                  {arrow}
                </span>
              )}
              <span className="font-code text-[11px] text-ink-soft">{c}</span>
            </div>
          )
        })}
        {ROWS.map((r) => {
          const marks: string[] = []
          if (r === step.top) marks.push('T')
          if (r === step.bottom) marks.push('B')
          const arrow =
            step.dir === 0 && r === step.top ? '→' : step.dir === 2 && r === step.bottom ? '←' : ''
          return (
            <Fragment key={`row-${r}`}>
              <div className="flex flex-col items-center justify-center gap-0.5 leading-none">
                {marks.length > 0 && (
                  <span className={labelClass(marks)}>
                    {marks.join('')}
                    {arrow}
                  </span>
                )}
                <span className="font-code text-[11px] text-ink-soft">{r}</span>
              </div>
              {COLS.map((c) => (
                <Cell
                  key={`cell-${r}-${c}`}
                  state={stateOf(r, c)}
                  size="sm"
                  className="h-auto w-full aspect-square sm:text-[15px]"
                >
                  {MATRIX[r][c]}
                </Cell>
              ))}
            </Fragment>
          )
        })}
      </div>

      <Badges className="justify-center">
        <Stat label="已收集" value={`${count} / ${M * N}`} tone="easy" />
        {step.cell && (
          <Stat label="当前格" value={`(${step.cell.r},${step.cell.c}) = ${step.cell.v}`} tone="amber" />
        )}
        <Badge>
          边界{' '}
          <b className="font-code text-xs text-[hsl(var(--teal))]">
            top {step.top} · right {step.right} · bottom {step.bottom} · left {step.left}
          </b>
        </Badge>
        {!done && step.next && <Hint>{step.next}</Hint>}
        {done && (
          <Answer>
            <b className="font-code">[{step.result.join(', ')}]</b>
          </Answer>
        )}
      </Badges>
    </div>
  )
}

export default function SpiralMatrixDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="边界收缩，顺时针剥圈"
      info={`输入：matrix = [[1,2,3],[4,5,6],[7,8,9]]（3 行 3 列），按顺时针螺旋顺序返回全部 9 个元素。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '当前访问的格子 / 正在走的这条边' },
        { color: TONE.easy, label: '已输出的格子' },
        { color: TONE.teal, label: '边界标记 T / B / L / R' },
        { color: TONE.muted, label: '未访问区域' },
      ]}
    />
  )
}
