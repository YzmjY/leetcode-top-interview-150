import { Fragment, useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badge, Badges, Cell, Hint, Stat, TONE, type CellState, type Tone } from './stage'

/* ------------------------------------------------------------------ */
/* 34. 有效的数独 —— 模式 C：9×9 网格，按行推进做行 / 列 / 宫三重查重    */
/* ------------------------------------------------------------------ */

/** 题解「示例 2」：唯一输出 false 的官方示例，与示例 1 只差 (0,0) 由 '5' 改成 '8' */
const BOARD = [
  ['8', '3', '.', '.', '7', '.', '.', '.', '.'],
  ['6', '.', '.', '1', '9', '5', '.', '.', '.'],
  ['.', '9', '8', '.', '.', '.', '.', '6', '.'],
  ['8', '.', '.', '.', '6', '.', '.', '.', '3'],
  ['4', '.', '.', '8', '.', '3', '.', '.', '1'],
  ['7', '.', '.', '.', '2', '.', '.', '.', '6'],
  ['.', '6', '.', '.', '.', '.', '2', '8', '.'],
  ['.', '.', '.', '4', '1', '9', '.', '.', '5'],
  ['.', '.', '.', '.', '8', '.', '.', '7', '9'],
]

const N = 9
const RANGE9 = Array.from({ length: N }, (_, i) => i)
const BANDS = [0, 1, 2]
/** 题解示例 2 的已填数字总数：30（其余 51 格是 '.'） */
const FILLED = BOARD.flat().filter((v) => v !== '.').length

/** 题解：宫下标 boxIdx = (i/3)*3 + j/3，取值 0-8 */
const boxOf = (r: number, c: number) => Math.floor(r / 3) * 3 + Math.floor(c / 3)
const filledInRow = (r: number) => BOARD[r].filter((v) => v !== '.').length
const filledCols = (r: number) => RANGE9.filter((c) => BOARD[r][c] !== '.')
/** 占用表 → 已出现的数字（升序），例如 {3,7,8} */
const digitsOf = (occ: boolean[]) => occ.map((v, d) => (v ? d + 1 : 0)).filter((d) => d > 0)
const fmtSet = (list: number[]) => (list.length > 0 ? `{${list.join(',')}}` : '{}')
const describeRow = (r: number) =>
  filledCols(r)
    .map((c) => `(${r},${c})=${BOARD[r][c]}`)
    .join('、')

interface Clash {
  r: number
  c: number
  /** 数字下标 0-8，来自题解的 num = ch - '1' */
  num: number
  /** 更早出现同一个数字的格子 */
  at: { r: number; c: number }
  box: number
  via: 'row' | 'col' | 'box'
}

interface Step {
  phase: 'init' | 'check' | 'mark' | 'conflict' | 'done'
  /** 本步正在处理的行 */
  row: number | null
  /** 本步焦点格：正在检查 / 刚登记的格子 */
  cursor: { r: number; c: number; v: string } | null
  /** 焦点格所属的 3×3 宫（用于外框高亮） */
  box: number | null
  clash: Clash | null
  /** 9×9 每格状态的不可变快照 */
  states: CellState[][]
  /** 已通过校验并登记的数字个数 */
  marked: number
  /** 焦点格此刻对应的三张表（rows / cols / boxes） */
  sets: { row: number[]; col: number[]; box: number[] } | null
  note: string
  next: string
}

function buildSteps(): Step[] {
  /* 题解的三张 9×9 布尔表，外加「数字首次出现在哪一格」用于指认冲突对 */
  const rowsOcc = RANGE9.map(() => new Array<boolean>(N).fill(false))
  const colsOcc = RANGE9.map(() => new Array<boolean>(N).fill(false))
  const boxesOcc = RANGE9.map(() => new Array<boolean>(N).fill(false))
  const rowsAt: ({ r: number; c: number } | null)[][] = RANGE9.map(() => new Array(N).fill(null))
  const colsAt: ({ r: number; c: number } | null)[][] = RANGE9.map(() => new Array(N).fill(null))
  const boxesAt: ({ r: number; c: number } | null)[][] = RANGE9.map(() => new Array(N).fill(null))

  /** dim = 尚未校验（含空格 '.'）、active = 正在校验、ok = 已登记、bad = 冲突 */
  const states: CellState[][] = BOARD.map((row) => row.map(() => 'dim' as CellState))
  let marked = 0
  const steps: Step[] = []

  const setsOf = (r: number, c: number) => ({
    row: digitsOf(rowsOcc[r]),
    col: digitsOf(colsOcc[c]),
    box: digitsOf(boxesOcc[boxOf(r, c)]),
  })

  const snap = (
    phase: Step['phase'],
    row: number | null,
    cursor: Step['cursor'],
    box: number | null,
    clash: Clash | null,
    sets: Step['sets'],
    note: string
  ): Step => ({
    phase,
    row,
    cursor,
    box,
    clash,
    states: states.map((line) => line.slice()),
    marked,
    sets,
    note,
    next: '',
  })

  steps.push(
    snap(
      'init',
      null,
      null,
      0,
      null,
      null,
      `观察：输入是 9×9 棋盘，共 ${FILLED} 个已填数字、${81 - FILLED} 个空格 '.'，扫描从 (0,0) 起、逐行从左到右。判断：行、列、宫三类约束互不干扰，可以各用一张 9×9 布尔表 rows、cols、boxes 记录某个数字出现过没有。动作：把数字字符减 '1' 得到下标 0-8，宫下标用 (i/3)*3 + j/3，遇到 '.' 直接跳过。为什么：数字只有 1-9，三处各查一次写一次都是 O(1)，不需要任何额外结构。`
    )
  )

  let finalClash: Clash | null = null

  for (let i = 0; i < N && finalClash === null; i++) {
    const first = BOARD[i].findIndex((v) => v !== '.')
    const head = { r: i, c: first, v: BOARD[i][first] }
    const headSets = setsOf(i, first)

    /* 「检查」阶段：本行格子待校验，三张表此刻只积累了前 i 行 */
    for (const c of filledCols(i)) states[i][c] = 'active'
    steps.push(
      snap(
        'check',
        i,
        head,
        boxOf(i, first),
        null,
        headSets,
        `观察：行 ${i} 的已填数字是 ${describeRow(i)}，其余 ${N - filledInRow(i)} 格是 '.'，直接跳过。判断：从 (${i},${first}) = ${head.v} 起逐格查重，它此刻的三张表是 rows[${i}] = ${fmtSet(headSets.row)}、cols[${first}] = ${fmtSet(headSets.col)}、boxes[${boxOf(i, first)}] = ${fmtSet(headSets.box)}。动作：从左到右逐格「先查重、后登记」。为什么：顺序反了的话，刚写下的记录会掩盖同一行内的重复。`
      )
    )

    /* 真正按题解跑这一行：先查重，命中就停；否则三处登记 */
    for (const c of RANGE9) {
      const v = BOARD[i][c]
      if (v === '.') continue
      const num = Number(v) - 1
      const b = boxOf(i, c)
      if (rowsOcc[i][num] || colsOcc[c][num] || boxesOcc[b][num]) {
        const via: Clash['via'] = rowsOcc[i][num] ? 'row' : colsOcc[c][num] ? 'col' : 'box'
        const at =
          (via === 'row' ? rowsAt[i][num] : via === 'col' ? colsAt[c][num] : boxesAt[b][num]) ?? { r: i, c }
        finalClash = { r: i, c, num, at, box: b, via }
        break
      }
      rowsOcc[i][num] = true
      rowsAt[i][num] = { r: i, c }
      colsOcc[c][num] = true
      colsAt[c][num] = { r: i, c }
      boxesOcc[b][num] = true
      boxesAt[b][num] = { r: i, c }
      marked += 1
      states[i][c] = 'ok'
    }

    const clash = finalClash
    if (clash) {
      /* 冲突之后本行再没有格子被检查过，撤掉「检查阶段」的高亮 */
      for (const c of filledCols(i)) if (c > clash.c) states[i][c] = 'dim'
      states[clash.r][clash.c] = 'bad'
      states[clash.at.r][clash.at.c] = 'bad'
      const hit =
        clash.via === 'row'
          ? `rows[${clash.r}][${clash.num}]`
          : clash.via === 'col'
            ? `cols[${clash.c}][${clash.num}]`
            : `boxes[${clash.box}][${clash.num}]`
      const scope =
        clash.via === 'row'
          ? `同在第 ${clash.r} 行`
          : clash.via === 'col'
            ? `同在第 ${clash.c} 列`
            : `同属${clash.box === 0 ? '左上角的' : ''}宫 ${clash.box}（boxIdx = (${clash.r}/3)*3 + ${clash.c}/3 = ${clash.box}）`
      /* 命中的是三类约束里的哪一类 —— 对应题解的三条规则 */
      const rule =
        clash.via === 'box'
          ? `宫 ${clash.box} 内出现两个`
          : clash.via === 'row'
            ? `行 ${clash.r} 内出现两个`
            : `列 ${clash.c} 内出现两个`
      const ruleNo = clash.via === 'box' ? 3 : clash.via === 'row' ? 1 : 2
      /* 冲突前本行最后一个已登记的格子，用来交代「冲突是在它之后才被撞上」 */
      const prev = filledCols(i).filter((c) => c < clash.c).slice(-1)[0]
      const prevText =
        prev === undefined ? '' : `在它之前 (${i},${prev}) 的 ${BOARD[i][prev]} 刚正常登记，`
      const rest = filledCols(i).filter((c) => c > clash.c).length
      steps.push(
        snap(
          'conflict',
          i,
          { r: i, c: clash.c, v: BOARD[i][clash.c] },
          clash.box,
          clash,
          setsOf(i, clash.c),
          `观察：(${i},${clash.c}) 的数字 ${BOARD[i][clash.c]} 与 (${clash.at.r},${clash.at.c}) 的 ${BOARD[clash.at.r][clash.at.c]} ${scope}，两者是同一个数字。判断：三处查重里 ${hit} 已为 true —— ${prevText}${clash.via === 'box' ? `宫 ${clash.box} 记到 ${fmtSet(digitsOf(boxesOcc[clash.box]))}` : '该组已被占用'}。动作：立即 return false —— 行 ${i} 余下的 ${rest} 个已填数字与第 ${i + 1} 行起的所有格子（合计 ${FILLED - marked - 1} 个已填数字）都不再扫描。为什么：${rule} ${BOARD[i][clash.c]} 已经违反题解规则 ${ruleNo}，提前返回不改变结论。`
        )
      )
    } else {
      const cols = filledCols(i)
      const last = cols[cols.length - 1]
      const colsTouched = cols.map((c) => `列${c}=${fmtSet(digitsOf(colsOcc[c]))}`).join('、')
      const boxesTouched = Array.from(new Set(cols.map((c) => boxOf(i, c))))
        .map((b) => `宫${b}=${fmtSet(digitsOf(boxesOcc[b]))}`)
        .join('、')
      steps.push(
        snap(
          'mark',
          i,
          { r: i, c: last, v: BOARD[i][last] },
          boxOf(i, last),
          null,
          setsOf(i, last),
          `观察：行 ${i} 的 ${filledInRow(i)} 个数字在三处查重里都没有命中，可以整行登记。判断：rows[${i}] 变为 ${fmtSet(digitsOf(rowsOcc[i]))}，同时并入 ${colsTouched} 与 ${boxesTouched}。动作：这 ${filledInRow(i)} 格状态转为「已校验」，累计 ${marked} 个数字通过。为什么：它们与前面已登记的行在行、列、宫三个维度都不冲突，算法的不变量继续成立。`
        )
      )
    }
  }

  const clash = finalClash
  steps.push(
    snap(
      'done',
      null,
      clash ? { r: clash.r, c: clash.c, v: BOARD[clash.r][clash.c] } : null,
      clash ? clash.box : null,
      clash,
      clash ? setsOf(clash.r, clash.c) : null,
      clash
        ? `观察：扫描在 (${clash.r},${clash.c}) 停下并返回 false —— 宫 ${clash.box} 里 (${clash.at.r},${clash.at.c}) 与 (${clash.r},${clash.c}) 同为 ${BOARD[clash.r][clash.c]}，题解示例 2 因此无效。判断：通过校验的只有行 0、行 1 整行以及行 ${clash.r} 中 (${clash.r},${clash.c}) 之前的那个数字，共 ${marked} 个，其余 ${FILLED - marked - 1} 个已填数字没被检查到。动作：读出答案 false；作为对照，示例 1 只把 (0,0) 的 8 换成 5，宫内不再重复，返回 true。为什么：列 0 的 (0,0) 与 (3,0) 其实也都是 8，只是行优先扫描先撞上宫冲突；固定 9×9 棋盘每格只做常数次查表，时间与空间都是 O(1)。`
        : `观察：81 格全部扫描完，三张表自始至终没有命中过重复。判断：每一行、每一列、每个 3×3 宫内数字都只出现一次。动作：读出答案为 true，共登记 ${marked} 个数字。为什么：固定 9×9 棋盘每格只做常数次查表，时间与空间都是 O(1)。`
    )
  )

  /* 「下一步」动作由后一个快照推导，保证提示与步骤数据一致 */
  steps.forEach((s, idx) => {
    const b = steps[idx + 1]
    if (!b) return
    if (s.phase === 'init') {
      s.next = `从行 ${b.row} 开始逐格查重，通过就登记`
    } else if (s.phase === 'check' && b.phase === 'mark') {
      s.next = `行 ${b.row} 三处都无命中，把本行 ${filledInRow(b.row ?? 0)} 个数字登记进 rows / cols / boxes`
    } else if (s.phase === 'check' && b.phase === 'conflict' && b.clash) {
      const r = b.clash.r
      const c = b.clash.c
      /* 冲突格之前本行最后一个已填格子：它会在冲突之前先被登记进三张表 */
      const prev = filledCols(r).filter((k) => k < c).slice(-1)[0]
      const lead = prev === undefined ? '' : `先登记 (${r},${prev}) = ${BOARD[r][prev]}，`
      s.next = `${lead}再查 (${r},${c}) = ${b.cursor?.v ?? ''} —— 命中行/列/宫任一张表就返回 false`
    } else if (s.phase === 'mark') {
      s.next = `行 ${s.row} 校验通过，接着校验行 ${b.row}`
    } else if (s.phase === 'conflict') {
      s.next = '返回 false，读出结论并说明复杂度'
    }
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

/** 行号旁的字母标记：R = 正在校验，✓ = 已校验完，✕ = 冲突所在行 */
function rowStatus(step: Step, r: number): { label: string; tone: Tone } | null {
  if (step.clash && step.clash.r === r) return { label: '✕', tone: 'hard' }
  const cols = filledCols(r)
  /* 本行自己的数字都处理完了（其中的某一格可能被标成「先出现」的红格，但本行内部并不重复） */
  if (cols.length > 0 && cols.every((c) => step.states[r][c] === 'ok' || step.states[r][c] === 'bad')) {
    return { label: '✓', tone: 'easy' }
  }
  if (step.row === r) return { label: 'R', tone: 'amber' }
  return null
}

/** 格内文字标记，保证冲突不只靠颜色区分 */
function cellTag(step: Step, r: number, c: number): string | null {
  if (!step.clash) return null
  if (step.clash.r === r && step.clash.c === c) return '重复'
  if (step.clash.at.r === r && step.clash.at.c === c) return '先出现'
  return null
}

function Stage(step: Step) {
  const done = step.phase === 'done'

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 9×9 网格：外层 3×3 分组就是九个 3×3 宫；行列数 ≤ 10，故左侧与上方标行 / 列号 */}
      <div
        className="grid w-full gap-2"
        style={{ gridTemplateColumns: '1.75rem repeat(3, minmax(0, 1fr))', maxWidth: 460 }}
      >
        <span aria-hidden />
        {BANDS.map((bc) => (
          <div key={`head-${bc}`} className="grid grid-cols-3 gap-1">
            {BANDS.map((k) => (
              <span
                key={`col-${bc * 3 + k}`}
                className="flex h-4 items-center justify-center font-code text-[11px] text-ink-soft"
              >
                {bc * 3 + k}
              </span>
            ))}
          </div>
        ))}

        {BANDS.map((br) => (
          <Fragment key={`band-${br}`}>
            <div className="grid grid-rows-3 gap-1">
              {BANDS.map((k) => {
                const r = br * 3 + k
                const st = rowStatus(step, r)
                return (
                  <span key={`row-${r}`} className="flex items-center justify-center gap-0.5 leading-none">
                    {st && (
                      <span className="font-code text-[10px] font-bold" style={{ color: TONE[st.tone] }}>
                        {st.label}
                      </span>
                    )}
                    <span className="font-code text-[11px] text-ink-soft">{r}</span>
                  </span>
                )
              })}
            </div>

            {BANDS.map((bc) => {
              const b = br * 3 + bc
              return (
                <div
                  key={`box-${b}`}
                  className={
                    'grid grid-cols-3 gap-1 rounded-lg' +
                    (step.box === b ? ' ring-2 ring-[hsl(var(--teal))]' : '')
                  }
                >
                  {BANDS.map((dr) =>
                    BANDS.map((dc) => {
                      const r = br * 3 + dr
                      const c = bc * 3 + dc
                      const tag = cellTag(step, r, c)
                      return (
                        <Cell
                          key={`cell-${r}-${c}`}
                          state={step.states[r][c]}
                          size="sm"
                          className="aspect-square h-auto w-full min-w-0 flex-col gap-0 overflow-hidden text-[13px] sm:text-[15px]"
                        >
                          <span aria-label={`board[${r}][${c}]`}>
                            {BOARD[r][c] === '.' ? '·' : BOARD[r][c]}
                          </span>
                          {tag && (
                            <span className="font-code text-[8px] leading-none opacity-80">{tag}</span>
                          )}
                        </Cell>
                      )
                    })
                  )}
                </div>
              )
            })}
          </Fragment>
        ))}
      </div>

      <Badges className="justify-center">
        <Stat label="已校验数字" value={`${step.marked} / ${FILLED}`} tone="easy" />
        <Stat
          label={step.clash ? '冲突格' : '当前格'}
          value={step.cursor ? `(${step.cursor.r},${step.cursor.c}) = ${step.cursor.v}` : '—'}
          tone={step.clash ? 'hard' : 'amber'}
        />
        {step.sets && step.cursor && step.box !== null ? (
          <Badge tone={step.clash ? 'hard' : 'plain'}>
            三张表{' '}
            <span className="font-code">
              {`行${step.cursor.r}=${fmtSet(step.sets.row)} 列${step.cursor.c}=${fmtSet(step.sets.col)} 宫${step.box}=${fmtSet(step.sets.box)}`}
            </span>
          </Badge>
        ) : (
          <Badge>
            三张表 <span className="font-code">rows · cols · boxes</span> 初始全为 false
          </Badge>
        )}
        {!done && step.next && <Hint>{step.next}</Hint>}
        {done && (
          <Answer>
            {step.clash ? (
              <>
                返回 <b className="font-code">false</b> —— 宫 {step.clash.box} 内 (
                {step.clash.at.r},{step.clash.at.c}) 与 ({step.clash.r},{step.clash.c}) 都是{' '}
                {BOARD[step.clash.r][step.clash.c]}
              </>
            ) : (
              <>
                返回 <b className="font-code">true</b> —— 81 格无重复
              </>
            )}
          </Answer>
        )}
      </Badges>
    </div>
  )
}

export default function ValidSudokuDemo() {
  const steps = useMemo(buildSteps, [])
  /* 用最后一步（done）里保留的冲突信息生成 info，保证取舍说明与算法真实结果一致 */
  const last = steps[steps.length - 1]
  const clash = last.clash
  const restInRow = clash ? filledCols(clash.r).filter((c) => c > clash.c).length : 0
  const afterRow = clash ? FILLED - last.marked - 1 - restInRow : 0
  const info = clash
    ? `输入取题解「示例 2」：唯一返回 false 的官方示例，与示例 1 只差 (0,0) 由 '5' 改成 '8'，棋盘固定 9×9、${FILLED} 个已填数字。为把步骤控制在 40 以内，演示按行推进 —— 每行拆成「检查」与「登记」两步（行内格子仍按从左到右处理），不做逐格演示。算法真实结果：行 0、行 1 整行通过，行 ${clash.r} 处理到 (${clash.r},${clash.c}) 时发现宫 ${clash.box} 内 (${clash.at.r},${clash.at.c}) 与它都是 ${BOARD[clash.r][clash.c]}，立即返回 false —— 行 ${clash.r} 余下的 ${restInRow} 个已填数字与第 ${clash.r + 1} 行起的 ${afterRow} 个都不会被扫描到。`
    : `输入取题解「示例 1」：固定 9×9、${FILLED} 个已填数字，全部通过校验并返回 true。演示按行推进 —— 每行拆成「检查」与「登记」两步（行内格子仍按从左到右处理），不做逐格演示。`
  return (
    <DemoShell
      title="行 / 列 / 宫三表联动查重"
      info={info}
      steps={steps}
      autoMs={1600}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '正在校验的这一行（行号旁标 R）' },
        { color: TONE.easy, label: '已通过校验并登记的数字（✓）' },
        { color: TONE.hard, label: '宫 0 内重复的两个 8（格内标「先出现 / 重复」）' },
        { color: TONE.teal, label: '当前关注的 3×3 宫（外框）' },
        { color: TONE.muted, label: "尚未校验的数字与空格 '.'" },
      ]}
    />
  )
}
