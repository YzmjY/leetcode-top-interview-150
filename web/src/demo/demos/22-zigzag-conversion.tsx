import { Fragment, useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badge, Badges, Cell, Hint, Stat, TONE, type CellState } from './stage'

/* ------------------------------------------------------------------ */
/* 22. Z 字形变换 —— 模式 C：二维网格 + Z 字形落点 + 逐行读取             */
/* ------------------------------------------------------------------ */

/** 题解示例 1：s = "PAYPALISHIRING", numRows = 3（完整 14 个字符占 7 列，这里取前 LEN 个演示） */
const S = 'PAYPALISHIRING'
const NUM_ROWS = 3
/** 只演示前 7 个字符：3 × 3 的网格刚好走完「首列向下 + 右上回升 + 再向下」，全程只有 7 个落点，看得清 */
const LEN = 7
const CHARS = S.slice(0, LEN).split('')

/** 行标签的语义色（取自 CSS 变量），保证 3 行标签互相区分；网格里的字符格不按行分色，另见图例 */
const ROW_TONE = [TONE.teal, TONE.hard, TONE.easy] as const

interface Step {
  phase: 'init' | 'place' | 'read' | 'done'
  /** 每行已收集的字符（不可变快照） */
  rows: string[]
  /** 已落格的字符：行 → 列 → 字符 */
  cells: string[][]
  /** 本步刚落下的字符，init / read / done 时为 null */
  placed: { i: number; ch: string; row: number; col: number } | null
  /** 当前写入行（place 步为刚落点那行） */
  curRow: number
  /** 写完后方向是否向下 */
  goingDown: boolean
  /** 已落格字符数 */
  count: number
  /** 已拼接完成的文本 */
  result: string
  /** 正在读取的行 */
  readRow: number | null
  /** 本步网格列数 */
  cols: number
  /** 下一步动作（Hint 文案） */
  hint: string
  note: string
}

function buildSteps(): Step[] {
  const rows: string[] = new Array(NUM_ROWS).fill('')
  /** 网格坐标：cells[r][c]，'#' 表示这一格没有字符 */
  const cells: string[][] = Array.from({ length: NUM_ROWS }, () => ['#'])
  /** LEN 个字符实际用到的列数 = 最大落点列 + 1（向下时 col 不变，向上时 col + 1）。
   *  每轮写完之后还会再 col++ 指向下一格，最后一次 col++ 会落到没有任何落点的空列，
   *  所以取落点列的最大值，而不是循环结束时的 col。 */
  const totalCols = (() => {
    let col = 0
    let maxCol = 0
    let curRow = 0
    let goingDown = false
    for (let i = 0; i < LEN; i++) {
      if (col > maxCol) maxCol = col // 本轮落点所在的列
      if (curRow === 0 || curRow === NUM_ROWS - 1) goingDown = !goingDown
      if (goingDown) curRow++
      else {
        curRow--
        col++
      }
    }
    return maxCol + 1
  })()

  const steps: Step[] = []

  const snap = (
    phase: Step['phase'],
    extra: Partial<Step> & { note: string }
  ): void => {
    steps.push({
      phase,
      rows: rows.slice(),
      cells: Array.from({ length: NUM_ROWS }, (_, r) =>
        Array.from({ length: totalCols }, (_, c) => cells[r][c] ?? '#')
      ),
      placed: null,
      curRow: 0,
      goingDown: false,
      count: 0,
      result: '',
      readRow: null,
      cols: totalCols,
      hint: '',
      ...extra,
    })
  }

  snap('init', {
    note: `观察：输入 s = "${S}"、numRows = ${NUM_ROWS}，每行先给一个空字符串，curRow = 0，goingDown = false。判断：Z 字形只会在这两条边界上折返 —— 首行（第 0 行）转向下，末行（第 ${NUM_ROWS - 1} 行）转向上，中间各行方向不变。动作：按 ${S[0]} 到 ${S[LEN - 1]} 的先后顺序逐个字符落格，先把 s[0] 写入第 0 行；为什么：落格顺序与字符顺序一致后，逐行拼接就是题目要的从左往右逐行读取。`,
  })

  let curRow = 0
  let goingDown = false
  let col = 0

  for (let i = 0; i < LEN; i++) {
    const ch = CHARS[i]
    const row = curRow
    const atCol = col

    // 1. 把字符追加到 rows[curRow]，并记到网格坐标上
    rows[row] += ch
    cells[row][atCol] = ch

    // 2. 写入之后才判断折返（题解易错点 2），再按方向移动 curRow
    const bounced = row === 0 || row === NUM_ROWS - 1
    if (bounced) goingDown = !goingDown
    let nextRow: number
    if (goingDown) {
      nextRow = row + 1
    } else {
      nextRow = row - 1
      col++
    }
    curRow = nextRow

    const head = `观察：s[${i}] = '${ch}'，本步把它放到第 ${row} 行第 ${atCol} 列。判断：`
    // 「为什么」按本步所在的行选取：折返只发生在首行和末行，若按折返之后的 goingDown 选取会讲到另一个边界
    const why =
      row === 0
        ? `第 0 行是回到顶端后的起点，必须转回向下，否则会越出第 0 行继续往上走`
        : row === NUM_ROWS - 1
          ? `折返点只在首行和末行出现 —— 到第 ${NUM_ROWS - 1} 行后必须转为向上，才能画出斜着回到首行的那一笔`
          : `折返点只在首行和末行出现 —— 第 ${row} 行还在半途，方向保持向${goingDown ? '下' : '上'}不变`
    const tail = `动作：${row} 行的字符串变成 "${rows[row]}"，curRow 移到第 ${nextRow} 行${goingDown ? '' : '、列号 +1'}。为什么：${why}。`
    let note: string
    if (row === 0) {
      note = `${head}第 0 行正是折返点，方向翻转为向${goingDown ? '下' : '上'}。${tail}`
    } else if (row === NUM_ROWS - 1) {
      note = `${head}第 ${NUM_ROWS - 1} 行是最后一行、同样是折返点，方向翻转为向${goingDown ? '下' : '上'}。${tail}`
    } else {
      note = `${head}第 ${row} 行既不是首行也不是末行，方向保持向${goingDown ? '下' : '上'}不变。${tail}`
    }

    snap('place', {
      placed: { i, ch, row, col: atCol },
      curRow: row,
      goingDown,
      count: i + 1,
      note,
    })
  }

  let result = ''
  for (let r = 0; r < NUM_ROWS; r++) {
    result += rows[r]
    snap('read', {
      curRow: NUM_ROWS - 1,
      goingDown,
      readRow: r,
      count: LEN,
      result,
      note: `观察：${NUM_ROWS} 行都已落满字符，现在按行号从小到大顺序拼接。判断：Z 字形排列的行内先后正是读取顺序，所以第 ${r} 行的 "${rows[r]}" 直接追加到末尾。动作：result 从 "${result.slice(0, result.length - rows[r].length)}" 变为 "${result}"。为什么：题目要的就是从左往右逐行读取，落格时字符已经按行归位，这一步不需要再比较或排序。`,
    })
  }

  snap('done', {
    curRow: NUM_ROWS - 1,
    goingDown,
    count: LEN,
    result,
    note: `观察：三行依次拼完，result = "${result}"。判断：它就是逐行读出的 Z 字形字符串。动作：返回 "${result}" —— 本演示只放了前 ${LEN} 个字符，所以这是题解示例 1 取前 ${LEN} 个字符时的输出，字符多的完整示例（${S.length} 个字符）输出是 "${FULL_OUT}"，规则完全相同。为什么：每个字符只写入一次、每行只拼接一次，时间 O(n)；rows 要保存全部字符，空间 O(n)。`,
  })

  // 「下一步动作」由后一个快照推导，保证与步骤数据完全一致
  steps.forEach((s, i) => {
    const b = steps[i + 1]
    if (!b) return
    if (s.phase === 'init' && b.placed) {
      s.hint = `把 s[0] = '${b.placed.ch}' 写入第 ${b.placed.row} 行、列 ${b.placed.col}`
      return
    }
    if (s.phase === 'place' && b.placed) {
      // 折返发生在写完该字符之后：只有下一步的落点本身在第 0 行 / 末行时才会转向，
      // 转向后的方向要取那一步写完之后的 goingDown，而不是两步 goingDown 的比较结果
      const bounce = b.placed.row === 0 || b.placed.row === NUM_ROWS - 1
      s.hint = `写 s[${b.placed.i}] = '${b.placed.ch}' 到第 ${b.placed.row} 行${
        bounce ? `（第 ${b.placed.row} 行是折返点，写完后转向${b.goingDown ? '下' : '上'}）` : ''
      }`
      return
    }
    if (s.phase === 'place' && b.phase === 'read') {
      s.hint = `字符全部落格，从第 0 行开始逐行拼接`
      return
    }
    if (s.phase === 'read') {
      s.hint =
        b.readRow === null
          ? `再拼完这一行就得到结果`
          : `拼第 ${b.readRow} 行的 "${b.rows[b.readRow]}"`
    }
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

/** 缩短输入后的期望输出（由题解算法跑出的结果，用于 info 里如实说明取舍） */
const SHORT_OUT = 'PAAPLYI'
/** 题解示例 1（14 个字符）的官方输出，用于对照说明 */
const FULL_OUT = 'PAHNAPLSIIGYIR'

function Stage(step: Step) {
  const done = step.phase === 'done'
  const reading = step.phase === 'read'
  const readRow = reading ? step.readRow : null

  const stateOf = (r: number, c: number): CellState => {
    const filled = step.cells[r][c] !== '#'
    if (!filled) return 'dim'
    if (step.placed && step.placed.row === r && step.placed.col === c) return 'active'
    return done || reading ? 'ok' : 'new'
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Z 字形矩阵：单元格正方形，左侧标行号、上方标列号 */}
      <div
        className="grid w-full gap-1.5"
        style={{
          gridTemplateColumns: `2.25rem repeat(${step.cols}, minmax(0, 1fr))`,
          maxWidth: 36 + step.cols * 56,
        }}
      >
        <span aria-hidden />
        {Array.from({ length: step.cols }, (_, c) => (
          <span
            key={`col-${c}`}
            className="flex h-4 items-center justify-center font-code text-[11px] text-ink-soft"
          >
            列{c}
          </span>
        ))}

        {step.cells.map((line, r) => (
          <Fragment key={`row-${r}`}>
            <span
              className="flex items-center justify-end pr-1 font-code text-[11px] font-bold"
              style={{ color: ROW_TONE[r] }}
            >
              第{r}行
            </span>
            {line.map((ch, c) => (
              <div key={`cell-${r}-${c}`} className="relative">
                <Cell
                  state={stateOf(r, c)}
                  size="sm"
                  className="h-auto w-full min-w-0 aspect-square"
                >
                  {ch === '#' ? '' : ch}
                </Cell>
                {step.placed && step.placed.row === r && step.placed.col === c && (
                  <span
                    className="pointer-events-none absolute left-0 top-1 w-full text-center font-code text-[10px] font-bold"
                    style={{ color: TONE.amber }}
                  >
                    落点
                  </span>
                )}
              </div>
            ))}
          </Fragment>
        ))}
      </div>

      {/* 每行字符汇总：已拼接进 result 的行转为「已定稿」色，其余保持「已落格」色 */}
      <div className="flex w-full flex-col gap-1.5">
        {step.rows.map((text, r) => (
          <div key={`line-${r}`} className="flex flex-wrap items-center gap-2">
            <span
              className="w-9 shrink-0 pr-1 text-right font-code text-[11px] font-bold"
              style={{ color: ROW_TONE[r] }}
            >
              第{r}行
            </span>
            {text.length === 0 ? (
              <span className="font-code text-[11px] text-ink-soft">（空）</span>
            ) : (
              text.split('').map((ch, k) => (
                <Cell
                  key={`${r}-${k}`}
                  size="sm"
                  state={done || (readRow !== null && r <= readRow) ? 'ok' : 'new'}
                  className="w-8"
                >
                  {ch}
                </Cell>
              ))
            )}
            <span className="font-code text-[11px] text-ink-soft">{text ? `"${text}"` : ''}</span>
          </div>
        ))}
      </div>

      <Badges className="justify-center">
        {step.phase === 'init' && (
          <>
            <Stat label="s.length" value={S.length} />
            <Stat label="numRows" value={NUM_ROWS} />
            <Hint>{step.hint}</Hint>
          </>
        )}
        {step.phase === 'place' && (
          <>
            <Stat label="已落格" value={`${step.count} / ${LEN}`} tone="easy" />
            <Stat
              label={`curRow = ${step.curRow} · 方向`}
              value={step.goingDown ? '向下' : '向上'}
              tone={step.goingDown ? 'easy' : 'teal'}
            />
            <Hint>{step.hint}</Hint>
          </>
        )}
        {reading && (
          <>
            <Stat
              label="正在拼接"
              value={`第 ${readRow} 行 "${step.rows[readRow ?? 0]}"`}
              tone="amber"
            />
            <Stat label="result" value={step.result} tone="easy" />
            <Hint>{step.hint}</Hint>
          </>
        )}
        {done && (
          <>
            <Stat label="输出长度" value={step.result.length} tone="easy" />
            <Answer>
              <b className="font-code">"{step.result}"</b>
              {`（前 ${LEN} 个字符）`}
            </Answer>
            <Badge>时间 O(n) · 空间 O(n)（每行一个字符串）</Badge>
          </>
        )}
      </Badges>
    </div>
  )
}

export default function ZigzagConversionDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="沿 Z 字落下，再逐行读出"
      info={`输入：s = "${S}"、numRows = ${NUM_ROWS}（题解示例 1）。示例共 ${S.length} 个字符、占 7 列，一屏看不清每个落点，这里只演示前 ${LEN} 个字符 "${S.slice(0, LEN)}"：它刚好走完「首列向下 → 右上回升到第 0 行 → 再向下」一个完整往返。注意输入缩短后输出也随之变短，得 "${SHORT_OUT}"，不再等于题解示例 1 的 "${FULL_OUT}"，但落行规则完全一致。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '本步落点（格上有「落点」标注）' },
        { color: TONE.teal, label: '已落格（待拼接）' },
        { color: TONE.easy, label: '已定稿 / 已拼接' },
        { color: TONE.muted, label: '这一格没有字符' },
      ]}
    />
  )
}
