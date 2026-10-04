import { Fragment, useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badge, Badges, Cell, Hint, Stat, TONE, type CellState } from './stage'

/* ------------------------------------------------------------------ */
/* 36. 旋转图像 —— 模式 C：二维网格 + 「转置 + 水平翻转」的成对交换        */
/* ------------------------------------------------------------------ */

/** 题解示例 1（规模最小的官方示例）：3×3，原地顺时针旋转 90° */
const INPUT = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
]

/** 题解示例 1 的输出，用于最终核对 */
const TARGET = [
  [7, 4, 1],
  [8, 5, 2],
  [9, 6, 3],
]

const N = INPUT.length
const ROWS = INPUT.map((_, r) => r)
const COLS = INPUT[0].map((_, c) => c)
const HALF = Math.floor(N / 2)
const DIAG = INPUT.map((_, k) => INPUT[k][k]).join(', ')

/** 转置遍历上三角：n(n-1)/2 对；水平翻转遍历每行前一半：n·⌊n/2⌋ 对 */
const TRANSPOSE_PAIRS = (N * (N - 1)) / 2
const FLIP_PAIRS = N * HALF
const TOTAL_SWAPS = TRANSPOSE_PAIRS + FLIP_PAIRS

/** 步骤类别：与其他演示统一 —— 首步 init、中间 step、末步 done */
type Phase = 'init' | 'step' | 'done'
/** 阶段细分（原 phase 字段改名）：转置 / 水平翻转 / 全部完成 */
type StageName = 'transpose' | 'reverse' | 'done'
/** 阶段内的动作细分：成对交换的前 / 后快照，'handoff' 是转置收尾的过渡步 */
type Kind = 'swap-before' | 'swap-after' | 'handoff'

interface Pos {
  r: number
  c: number
}

interface Step {
  phase: Phase
  stage: StageName
  /** 本步形态：init / done 步没有具体动作，为 null */
  kind: Kind | null
  /** 本步要交换的一对格子：两者同色高亮，格内分别标 A / B */
  pair: [Pos, Pos] | null
  matrix: number[][]
  /** 已完成转置（(i,j) ↔ (j,i) 已处理）的格子 */
  transposed: boolean[][]
  /** 最终值已确定的格子 */
  settled: boolean[][]
  /** 到此步为止已完成的交换对数 */
  swaps: number
  note: string
  next: string
}

const fmt = (m: number[][]) => `[${m.map((r) => `[${r.join(',')}]`).join(', ')}]`
/** 单行格式，例如 [1,4,7] */
const fmtRow = (r: number[]) => `[${r.join(',')}]`
const pos = (p: Pos) => `(${p.r},${p.c})`

function buildSteps(): Step[] {
  const m = INPUT.map((row) => row.slice())
  const transposed = INPUT.map((row) => row.map(() => false))
  const settled = INPUT.map((row) => row.map(() => false))
  const steps: Step[] = []
  let swaps = 0

  const snapshot = (
    phase: Phase,
    stage: StageName,
    kind: Kind | null,
    pair: [Pos, Pos] | null,
    note: string
  ): Step => ({
    phase,
    stage,
    kind,
    pair,
    matrix: m.map((row) => row.slice()),
    transposed: transposed.map((row) => row.slice()),
    settled: settled.map((row) => row.slice()),
    swaps,
    note,
    next: '',
  })

  steps.push(
    snapshot(
      'init',
      'transpose',
      null,
      null,
      `观察：输入 3×3 矩阵 ${fmt(INPUT)}，要求原地顺时针旋转 90°，即原 (i,j) 的最终位置是 (j,${N - 1}-i)。判断：这个映射等于「转置 (i,j)→(j,i)」再「水平翻转 (j,i)→(j,${N - 1}-i)」的复合，两趟都只需要成对交换。动作：先做转置，只遍历上三角 j > i，交换 matrix[i][j] 与 matrix[j][i]，对角线元素自己和自己换，不用处理。为什么：每对元素恰好交换一次，两趟合起来 (i,j)→(j,i)→(j,${N - 1}-i) 正是顺时针 90°，全程只借助一个临时变量，空间 O(1)。`
    )
  )

  /* 第一步：转置（只走上三角） */
  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      const a: Pos = { r: i, c: j }
      const b: Pos = { r: j, c: i }
      const va = m[i][j]
      const vb = m[j][i]
      steps.push(
        snapshot(
          'step',
          'transpose',
          'swap-before',
          [a, b],
          `观察：上三角的 ${pos(a)} = ${va} 与它的对称位置 ${pos(b)} = ${vb} 构成一对。判断：j = ${j} > i = ${i}，这对还没换过，需要交换。动作：并行赋值 matrix[${i}][${j}] ← ${vb}、matrix[${j}][${i}] ← ${va}。为什么：转置必须从 j = i + 1 出发，遍历整个矩阵会把每对换两次、等于没转置。`
        )
      )
      m[i][j] = vb
      m[j][i] = va
      transposed[i][j] = true
      transposed[j][i] = true
      swaps += 1
      const lastOfTranspose = i === N - 2 && j === N - 1
      steps.push(
        snapshot(
          'step',
          'transpose',
          'swap-after',
          [a, b],
          `观察：交换完成，${pos(a)} = ${m[i][j]}、${pos(b)} = ${m[j][i]}，两格已落到转置后的位置。判断：这一对的转置已确定，但它们的最终值还要等水平翻转才能定下来。动作：标记这两格为「已转置」，${lastOfTranspose ? `上三角 ${TRANSPOSE_PAIRS} 对全部处理完，转置结束。` : '按行优先顺序继续下一对。'}为什么：转置只做到 (i,j)→(j,i)，列下标仍是 i，必须靠第二步把它变成 ${N - 1}-i 才算完成旋转。`
        )
      )
    }
  }

  /* 转置收尾：对角线无需交换，此刻全矩阵都已完成转置 */
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) transposed[r][c] = true
  }
  steps.push(
    snapshot(
      'step',
      'transpose',
      'handoff',
      null,
      `观察：上三角 ${TRANSPOSE_PAIRS} 对交换完毕，矩阵转置为 ${fmt(m)}，对角线上的 ${DIAG} 位置不变。判断：转置只完成了 (i,j)→(j,i)，列下标还差最后一步 —— 要由 i 变成 ${N - 1}-i。动作：进入第二步水平翻转，对每一行只遍历前一半（j = 0 到 ${HALF - 1}），交换 matrix[i][j] 与 matrix[i][${N - 1}-j]，从第 0 行开始。为什么：两趟复合即 (i,j)→(j,i)→(j,${N - 1}-i)，恰好是顺时针 90°，顺序不能反。`
    )
  )

  /* 第二步：水平翻转（每行只走前一半） */
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < HALF; j++) {
      const k = N - 1 - j
      const a: Pos = { r: i, c: j }
      const b: Pos = { r: i, c: k }
      const va = m[i][j]
      const vb = m[i][k]
      steps.push(
        snapshot(
          'step',
          'reverse',
          'swap-before',
          [a, b],
          `观察：第 ${i} 行现在是 ${fmtRow(m[i])}，左右两端 ${pos(a)} = ${va} 与 ${pos(b)} = ${vb} 构成一对。判断：j = ${j} < ⌊${N}/2⌋ = ${HALF}，这一对属于该行需要翻转的前一半。动作：并行赋值 matrix[${i}][${j}] ← ${vb}、matrix[${i}][${k}] ← ${va}。为什么：行内左右对称交换等价于把列下标 j 换成 ${N - 1}-j，与转置复合后正是 (i,j)→(j,${N - 1}-i)。`
        )
      )
      m[i][j] = vb
      m[i][k] = va
      for (let t = 0; t < N; t++) settled[i][t] = true
      swaps += 1
      const lastRow = i === N - 1
      steps.push(
        snapshot(
          'step',
          'reverse',
          'swap-after',
          [a, b],
          `观察：交换完成，第 ${i} 行变为 ${fmtRow(m[i])}。判断：该行的 j 只取到 ${HALF - 1}，前一半已遍历完，整行位置确定。动作：把整行标记为「已就位」，${lastRow ? '三行全部处理完，可以读出最终矩阵。' : `接着处理第 ${i + 1} 行。`}为什么：各行翻转互相独立，处理完的行不会再被改动。`
        )
      )
    }
  }

  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) settled[r][c] = true
  }
  steps.push(
    snapshot(
      'done',
      'done',
      null,
      null,
      `观察：三行都完成水平翻转，矩阵最终为 ${fmt(m)}，与题解示例 1 的输出 ${fmt(TARGET)} 一致。判断：转置遍历上三角 ${TRANSPOSE_PAIRS} 对、水平翻转遍历每行前一半 ${FLIP_PAIRS} 对，全程共 ${TOTAL_SWAPS} 次交换。动作：函数原地修改入参 matrix、没有返回值，调用方直接读这个矩阵即可。为什么：两趟都只访问每个元素常数次，时间 O(n²)；额外空间只有一个交换用的临时变量，O(1)，满足「原地」要求。`
    )
  )

  /* 「下一步」由后一个快照推导，保证提示与步骤数据完全一致 */
  steps.forEach((s, i) => {
    const b = steps[i + 1]
    if (!b) return
    if (b.phase === 'done') {
      s.next = '没有剩余交换，读出最终矩阵'
      return
    }
    if (b.kind === 'swap-before' || b.kind === 'swap-after') {
      const p = b.pair
      if (!p) return
      const [x, y] = p
      if (b.kind === 'swap-after') {
        s.next = `两格并行赋值，完成 ${pos(x)} ↔ ${pos(y)} 的交换`
      } else if (s.pair && s.stage === b.stage) {
        s.next = `交换下一对 ${pos(x)} ↔ ${pos(y)}`
      } else {
        s.next = `${b.stage === 'transpose' ? '转置' : '水平翻转'}：交换 ${pos(x)} ↔ ${pos(y)}`
      }
      return
    }
    s.next = '上三角已换完，标记全部格子完成转置'
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

const GAP = 6
const LABEL_W = 30
const CELL_W = 56
const GRID_MAX = LABEL_W + GAP + N * CELL_W + (N - 1) * GAP

function Stage(step: Step) {
  const done = step.phase === 'done'
  const pair = step.pair
  const pairRows = new Set<number>(pair ? [pair[0].r, pair[1].r] : [])
  const pairCols = new Set<number>(pair ? [pair[0].c, pair[1].c] : [])

  const stateOf = (r: number, c: number): CellState => {
    if (pair && ((pair[0].r === r && pair[0].c === c) || (pair[1].r === r && pair[1].c === c))) {
      return 'active'
    }
    if (step.settled[r][c]) return 'ok'
    if (step.transposed[r][c]) return 'new'
    return 'idle'
  }

  /** 格内的 A / B 字母：与徽章里的 (r,c) 对应，保证不只靠颜色区分交换双方 */
  const markOf = (r: number, c: number): 'A' | 'B' | null => {
    if (!pair) return null
    if (pair[0].r === r && pair[0].c === c) return 'A'
    if (pair[1].r === r && pair[1].c === c) return 'B'
    return null
  }

  const axisClass = (on: boolean) =>
    on
      ? 'font-code text-[11px] font-bold text-[hsl(var(--amber))]'
      : 'font-code text-[11px] text-ink-soft'

  const phaseText = done
    ? '完成'
    : step.kind === 'handoff'
      ? '阶段 1/2 转置完成'
      : step.stage === 'transpose'
        ? '阶段 1/2 · 转置'
        : '阶段 2/2 · 水平翻转'
  const phaseTone = done ? 'easy' : step.stage === 'transpose' ? 'amber' : 'teal'

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 正方形单元格网格；n = 3 ≤ 10，因此在左侧与上方标出行列号 */}
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
            <span className={axisClass(pairCols.has(c))}>{c}</span>
          </div>
        ))}
        {ROWS.map((r) => (
          <Fragment key={`row-${r}`}>
            <div className="flex flex-col items-center justify-center leading-none">
              <span className={axisClass(pairRows.has(r))}>{r}</span>
            </div>
            {COLS.map((c) => {
              const mark = markOf(r, c)
              return (
                <Cell
                  key={`cell-${r}-${c}`}
                  state={stateOf(r, c)}
                  size="sm"
                  className="relative h-auto w-full min-w-0 aspect-square sm:text-[15px]"
                >
                  {mark && (
                    <span className="absolute left-1 top-0.5 font-code text-[9px] font-bold leading-none opacity-90">
                      {mark}
                    </span>
                  )}
                  {step.matrix[r][c]}
                </Cell>
              )
            })}
          </Fragment>
        ))}
      </div>

      <Badges className="justify-center">
        <Badge tone={phaseTone}>{phaseText}</Badge>
        <Stat label="已交换" value={`${step.swaps} / ${TOTAL_SWAPS}`} tone="ink" />
        {pair && !done && (
          <Badge tone="amber">
            交换 <b className="font-code">A{pos(pair[0])}</b> ↔{' '}
            <b className="font-code">B{pos(pair[1])}</b>
          </Badge>
        )}
        {!done && step.next && <Hint>{step.next}</Hint>}
        {done && (
          <Answer>
            <b className="font-code">{fmt(TARGET)}</b>
          </Answer>
        )}
      </Badges>
    </div>
  )
}

export default function RotateImageDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="转置 + 水平翻转，原地顺时针 90°"
      info={`输入：matrix = ${fmt(INPUT)}（题解示例 1，3×3），原地顺时针旋转 90° 后为 ${fmt(TARGET)}；题解示例 2 的 4×4 要交换 6 + 8 = 14 对，为看清每一步这里取规模最小的示例 1。算法分两步：转置交换上三角 ${TRANSPOSE_PAIRS} 对，水平翻转交换每行前一半 ${FLIP_PAIRS} 对，共 ${TOTAL_SWAPS} 对。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '本步交换的一对（格内标 A / B）' },
        { color: TONE.teal, label: '已完成转置、等待水平翻转' },
        { color: TONE.easy, label: '最终值已就位' },
      ]}
    />
  )
}
