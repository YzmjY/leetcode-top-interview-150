import { Fragment, useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badge, Badges, Cell, Flag, Hint, Stat, TONE, type CellState } from './stage'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/* 20. 最长公共前缀 —— 模式 C：多行字符网格 + 纵向逐列扫描               */
/* ------------------------------------------------------------------ */

/** 固定示例输入（题解「示例 1」：strs = ["flower","flow","flight"]，输出 "fl"） */
const STRS = ['flower', 'flow', 'flight']
const N = STRS.length
const MAX_LEN = Math.max(...STRS.map((s) => s.length))
const ROWS = STRS.map((_, r) => r)
const COLS = Array.from({ length: MAX_LEN }, (_, c) => c)

interface Step {
  phase: 'init' | 'compare' | 'mismatch' | 'done'
  /** 当前比较的列；init 为 -1 */
  col: number
  /** 当前与基准比较的行（1..N-1）；init / done 为 -1 */
  row: number
  /** 本步这一行这一列是否相等 */
  ok: boolean
  /** 已确认相同的列数 = 公共前缀长度 */
  prefixLen: number
  note: string
  /** 下一步动作（由后一个快照推导，供 Hint 使用） */
  next: string
}

function buildSteps(): Step[] {
  const first = STRS[0]
  const steps: Step[] = []
  let confirmed = 0
  let stopped = false
  let stopCol = -1

  steps.push({
    phase: 'init',
    col: -1,
    row: -1,
    ok: true,
    prefixLen: 0,
    next: '',
    note: `观察：输入 strs = ["flower","flow","flight"]，以 strs[0] = "flower" 为基准，prefixLen = 0，还没有比较过任何一列。判断：任何公共前缀都必须是 strs[0] 的前缀，所以只要按列 i = 0,1,… 检查所有字符串的第 i 位是否都等于 strs[0][i]。动作：从第 0 列开始，先让 strs[1] 与基准同列比较，再依次比较 strs[2]。为什么：一旦某一列不匹配或某个字符串长度不够，长度超过该列的公共前缀就都不可能成立。`,
  })

  for (let col = 0; col < first.length && !stopped; col++) {
    const ch = first[col]
    for (let row = 1; row < N; row++) {
      const other = STRS[row]
      const exists = col < other.length
      const same = exists && other[col] === ch
      const isLastRow = row === N - 1

      if (!same) {
        stopped = true
        stopCol = col
        steps.push({
          phase: 'mismatch',
          col,
          row,
          ok: false,
          prefixLen: confirmed,
          next: '',
          note: exists
            ? `观察：第 ${col} 列上基准 strs[0][${col}] = '${ch}'，而 strs[${row}][${col}] = '${other[col]}'，两者不等。判断：这是第一处不同，公共前缀到第 ${col} 列为止。动作：立即返回 first[:${col}] = "${first.slice(0, col)}"，不再看后面任何一列。为什么：长度超过 ${col} 的前缀都要求第 ${col} 位相同，已经不可能成立，所以这个答案不多也不少。`
            : `观察：第 ${col} 列上基准 strs[0][${col}] = '${ch}'，但 strs[${row}] = "${other}" 只有 ${other.length} 个字符，没有第 ${col} 位。判断：这个字符串更短，公共前缀不可能比它长。动作：返回 first[:${col}] = "${first.slice(0, col)}"，停止扫描。为什么：只要有一列没有全部通过，更长的前缀就不成立；这也正是必须先判 i >= len(strs[j]) 再取字符的原因。`,
        })
        break
      }

      if (isLastRow) confirmed = col + 1

      const nextMove = !isLastRow
        ? `继续用 strs[${row + 1}] 比第 ${col} 列`
        : col + 1 < first.length
          ? `第 ${col} 列所有行都通过，prefixLen 推进到 ${col + 1}，接着比第 ${col + 1} 列`
          : `第 ${col} 列所有行都通过，且基准 "${first}" 已没有下一列，扫描结束`

      steps.push({
        phase: 'compare',
        col,
        row,
        ok: true,
        prefixLen: isLastRow ? col + 1 : confirmed,
        next: '',
        note: `观察：第 ${col} 列上基准 strs[0][${col}] = '${ch}' 与 strs[${row}][${col}] = '${other[col]}' 相等。判断：这一列在这一行上通过${isLastRow ? `，且 strs[${row}] 是最后一个待比较的字符串` : ''}。动作：${nextMove}。为什么：只有所有字符串的第 ${col} 位都与基准相同，这一位才属于公共前缀。`,
      })
    }
  }

  const answer = first.slice(0, confirmed)
  steps.push({
    phase: 'done',
    col: stopCol,
    row: -1,
    ok: true,
    prefixLen: confirmed,
    next: '',
    note: stopped
      ? `观察：扫描在第 ${stopCol} 列中断，公共前缀长度停在 ${confirmed}。判断：前 ${confirmed} 列已被每个字符串确认相同，而长度超过 ${confirmed} 的前缀都要求第 ${stopCol} 列相同。动作：答案 = first[:${confirmed}] = "${answer}"，读法就是基准字符串的前 ${confirmed} 个字符。为什么：每个字符最多被检查一次，时间 O(S)（S 为所有字符串的字符总数）；额外空间只有几个下标变量，O(1)。`
      : `观察：基准 "${first}" 的每一列都被其余 ${N - 1} 个字符串匹配，没有任何一列中断。判断：strs[0] 本身就是所有字符串的公共前缀。动作：答案 = "${answer}"。为什么：所有字符串都相同是扫描的最坏情况，每个字符恰好被检查一次，时间 O(S)；额外空间只有几个下标变量，O(1)。`,
  })

  // 「下一步动作」由后一个快照推导，保证与步骤数据完全一致
  steps.forEach((s, i) => {
    const b = steps[i + 1]
    if (!b) return
    if (b.phase === 'done') {
      s.next = '前缀已定，输出答案'
    } else if (b.phase === 'compare' || b.phase === 'mismatch') {
      s.next = `比第 ${b.col} 列：strs[${b.row}][${b.col}] 是否等于基准的 '${first[b.col]}'`
    }
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

const GAP = 6
const LABEL_W = 56
const CELL_W = 44
const GRID_MAX = LABEL_W + GAP + MAX_LEN * CELL_W + (MAX_LEN - 1) * GAP

function Stage(step: Step) {
  const done = step.phase === 'done'
  const activeCol = done ? -1 : step.col
  const prefix = STRS[0].slice(0, step.prefixLen)
  const otherChar = step.row >= 0 && step.col < STRS[step.row].length ? STRS[step.row][step.col] : null

  const stateOf = (r: number, c: number): CellState => {
    if (done) return c < step.prefixLen ? 'ok' : 'dim'
    if (step.col < 0) return 'dim'
    if (c < step.col) return 'ok'
    if (c > step.col) return 'dim'
    // 当前列：第 0 行是基准，其余行按比较进度着色
    if (r === 0) return 'active'
    if (r < step.row) return 'ok'
    if (r === step.row) return step.ok ? 'ok' : 'bad'
    return 'new'
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 字符矩阵：行是字符串、列是字符下标；行 3 ≤ 10、列 6 ≤ 10，因此标出行列号 */}
      <div
        className="grid w-full gap-1.5"
        style={{
          gridTemplateColumns: `${LABEL_W / 16}rem repeat(${MAX_LEN}, minmax(0, 1fr))`,
          maxWidth: GRID_MAX,
        }}
      >
        {/* 旗标行：当前比较的列 */}
        <span aria-hidden />
        {COLS.map((c) => (
          <div key={`flag-${c}`} className="flex h-6 items-end justify-center">
            {c === activeCol && <Flag label="i" tone={step.ok ? 'amber' : 'hard'} />}
          </div>
        ))}

        {/* 列号行 */}
        <span className="flex items-center justify-end pr-1 font-code text-[10px] text-ink-soft">列</span>
        {COLS.map((c) => (
          <div key={`col-${c}`} className="flex h-5 items-center justify-center">
            <span
              className={cn(
                'font-code text-[11px]',
                c === activeCol
                  ? 'font-bold text-[hsl(var(--amber))]'
                  : done && c < step.prefixLen
                    ? 'font-bold text-[hsl(var(--easy))]'
                    : 'text-ink-soft'
              )}
            >
              {c}
            </span>
          </div>
        ))}

        {/* 每行一个字符串，单元格里是该列上的字符；· 表示该串在此列没有字符 */}
        {ROWS.map((r) => {
          const isComparing = !done && r === step.row
          return (
            <Fragment key={`row-${r}`}>
              <div className="flex flex-col items-center justify-center gap-0.5 pr-1 leading-none">
                <span
                  className={cn(
                    'font-code text-[10px] sm:text-[11px]',
                    isComparing ? 'font-bold text-[hsl(var(--amber))]' : 'text-ink-soft'
                  )}
                >
                  strs[{r}]
                </span>
                {r === 0 && <span className="text-[9px] text-ink-soft">基准</span>}
                {isComparing && (
                  <span className="text-[9px] font-bold text-[hsl(var(--amber))]">比对中</span>
                )}
              </div>
              {COLS.map((c) => (
                <Cell
                  key={`cell-${r}-${c}`}
                  state={stateOf(r, c)}
                  size="sm"
                  className="h-auto w-full min-w-0 aspect-square sm:text-[15px]"
                >
                  {c < STRS[r].length ? STRS[r][c] : '·'}
                </Cell>
              ))}
            </Fragment>
          )
        })}
      </div>

      <Badges className="justify-center">
        <Stat label="当前列 i" value={step.col < 0 ? '—' : step.col} tone="amber" />
        <Stat label="已确认前缀" value={`"${prefix}"`} tone="easy" />
        {!done && step.row >= 0 && (
          <Badge tone={step.ok ? 'teal' : 'hard'}>
            {step.ok ? '相等 ' : '不等 '}
            <b className="font-code text-xs">
              {otherChar === null
                ? `strs[${step.row}] 长度不足 ${step.col + 1}`
                : `strs[${step.row}][${step.col}] = '${otherChar}'`}
            </b>
          </Badge>
        )}
        {!done && step.next && <Hint>{step.next}</Hint>}
        {done && (
          <Answer>
            <b className="font-code">"{prefix}"</b>（{step.prefixLen} 个字符）
          </Answer>
        )}
      </Badges>
    </div>
  )
}

export default function LongestCommonPrefixDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="纵向逐列扫描，找最长公共前缀"
      info={`输入：strs = ["flower","flow","flight"]（题解示例 1，答案 "fl"）。为看清逐列比较过程，这里只用示例 1 的 3 个字符串，不再引入更长的串；以 strs[0] 为基准逐列检查其余字符串的同列字符。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '基准 strs[0] 当前列 / 正在比较的列' },
        { color: TONE.teal, label: '本列尚未比较的字符串' },
        { color: TONE.easy, label: '已确认匹配的字符（公共前缀）' },
        { color: TONE.hard, label: '第一处不同，扫描到此为止' },
        { color: TONE.muted, label: '未处理 / 不再比较（· 为该串此列无字符）' },
      ]}
    />
  )
}
