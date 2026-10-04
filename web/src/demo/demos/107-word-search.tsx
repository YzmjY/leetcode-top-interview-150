import { Fragment, useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badge, Badges, Cell, Hint, Stat, TONE, type CellState } from './stage'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/* 107. 单词搜索 —— 模式 C：二维网格 DFS + 当前路径 / 回溯撤销高亮        */
/* ------------------------------------------------------------------ */

/** 固定示例输入（题解「示例 2」：board 3×4，word = "SEE"，输出 true） */
const BOARD = [
  ['A', 'B', 'C', 'E'],
  ['S', 'F', 'C', 'S'],
  ['A', 'D', 'E', 'E'],
]
const WORD = 'SEE'

const M = BOARD.length
const N = BOARD[0].length
const ROWS = BOARD.map((_, r) => r)
const COLS = BOARD[0].map((_, c) => c)

/** 四邻方向：先下、再上、再右、最后左；失败一个就换下一个 */
const DIRS: ReadonlyArray<{ dr: number; dc: number; name: string; code: string }> = [
  { dr: 1, dc: 0, name: '下', code: 'D' },
  { dr: -1, dc: 0, name: '上', code: 'U' },
  { dr: 0, dc: 1, name: '右', code: 'R' },
  { dr: 0, dc: -1, name: '左', code: 'L' },
]
const DIR_ORDER = DIRS.map((d) => d.name).join(' → ')

interface Step {
  phase: 'init' | 'start' | 'enter' | 'move' | 'back' | 'found' | 'done'
  /** 当前处理的格子；init / done 为 null */
  cur: { r: number; c: number } | null
  /** 扫描到的起点格子；非 start / found 步为 null */
  start: { r: number; c: number } | null
  /** 本次移动的方向下标；init 为 null */
  dir: number | null
  /** 本次移动是否越界（越界时 cur 记录越界后的坐标） */
  oob: boolean
  /** 当前 DFS 路径（按进入顺序） */
  path: Array<[number, number]>
  /** 已探索且四个方向都失败、访问标记已撤销的格子 */
  dim: boolean[][]
  /** 已匹配的字符个数，等于进入路径前的 path.length */
  matched: number
  /** 是否已找到完整单词 */
  found: boolean
  /** 找到时的完整路径；未找到为空数组 */
  foundPath: Array<[number, number]>
  note: string
  /** 下一步动作（由后一个快照推导，供 Hint 使用） */
  next: string
}

function buildSteps(): Step[] {
  const steps: Step[] = []
  const path: Array<[number, number]> = []
  const dim: boolean[][] = BOARD.map((row) => row.map(() => false))
  let found = false
  let foundPath: Array<[number, number]> = []

  const snap = (
    phase: Step['phase'],
    cur: Step['cur'],
    dir: Step['dir'],
    oob: boolean,
    note: string
  ): Step => ({
    phase,
    cur,
    start: null,
    dir,
    oob,
    path: path.map((p) => [p[0], p[1]] as [number, number]),
    dim: dim.map((row) => row.slice()),
    matched: path.length,
    found,
    foundPath: foundPath.map((p) => [p[0], p[1]] as [number, number]),
    note,
    next: '',
  })

  const posText = (p: Array<[number, number]>) =>
    p.length === 0 ? '（空）' : p.map(([r, c]) => `(${r},${c})`).join(' → ')

  steps.push(
    snap(
      'init',
      null,
      null,
      false,
      `观察：输入是 ${M}×${N} 的字符网格，word = "${WORD}"；dfs(i, j, index) 表示「把 word[index] 放到格子 (i,j) 上」，index 初值为 0，path 为空。判断：单词的每个字母必须落在上下左右相邻的格子上，且同一格不能重复使用，所以要在网格里找一条不重复走格的简单路径。动作：先扫描所有格子，只有字符等于 word[0] = '${WORD[0]}' 的位置才作为 DFS 起点；每个起点都从干净的棋盘开始。为什么：进入某格后把它临时改成 '#'，'#' 不等于任何字母，天然挡住走回头路，因此每步最多只有 3 个有效后继（O(m·n·3^L)）；失败分支必须恢复标记，否则会污染兄弟分支造成漏解。`
    )
  )

  /** 返回 true 表示已找到完整单词，整体停止 */
  const dfs = (i: number, j: number, index: number, dir: Step['dir']): boolean => {
    if (index === WORD.length) return true

    if (i < 0 || i >= M || j < 0 || j >= N) {
      const d = DIRS[dir ?? 0]
      steps.push(
        snap(
          'move',
          { r: i, c: j },
          dir,
          true,
          `观察：沿「${d.name}」从 (${i - d.dr},${j - d.dc}) 走到 (${i},${j})，已经越出 ${M}×${N} 网格。判断：越界位置没有格子可用，这一步不可能继续匹配 "${WORD}"。动作：该方向立即返回 false，换下一个方向。为什么：越界检查必须与字符检查一起放在递归入口——index 已经等于 ${index}（< ${WORD.length}），此时才允许访问 word[${index}]，否则会先越界访问 word 本身。`
        )
      )
      return false
    }

    if (BOARD[i][j] !== WORD[index]) {
      const ch = BOARD[i][j]
      const d = DIRS[dir ?? 0]
      steps.push(
        snap(
          'move',
          { r: i, c: j },
          dir,
          false,
          `观察：沿「${d.name}」来到 (${i},${j})，格子字符是 '${ch}'，而这一步需要 word[${index}] = '${WORD[index]}'。判断：字符不匹配，这条分支不可能再拼出 "${WORD}"。动作：剪枝返回 false，回到上一层换下一个方向。为什么：相邻只算上下左右，四个方向按 ${DIR_ORDER} 依次尝试，第一个可行的方向就会继续深入。`
        )
      )
      return false
    }

    const origin = BOARD[i][j]
    path.push([i, j])
    steps.push(
      snap(
        'enter',
        { r: i, c: j },
        dir,
        false,
        `观察：来到 (${i},${j})，格子字符 '${origin}' 正好等于 word[${index}]。判断：它是当前路径上的第 ${index + 1} 个字符，可以进入。动作：把该格暂时记为本路径已访问，压入 path，已匹配前缀成为 "${WORD.slice(0, index + 1)}"，随后按 ${DIR_ORDER} 依次递归四个方向。为什么：路径上的格子不重复，才是题目要求的「同一个单元格内的字母不允许被重复使用」。`
      )
    )

    for (let k = 0; k < DIRS.length; k++) {
      const d = DIRS[k]
      if (dfs(i + d.dr, j + d.dc, index + 1, k)) return true
    }

    path.pop()
    dim[i][j] = true
    steps.push(
      snap(
        'back',
        { r: i, c: j },
        dir,
        false,
        `观察：(${i},${j}) 的「${DIR_ORDER}」四个方向都试过，没有一个能把剩下的 "${WORD.slice(index + 1)}" 匹配完。判断：以 (${i},${j}) 为第 ${index + 1} 步的所有路径都走不通。动作：弹出路径末尾的 (${i},${j})，撤销它的访问标记并把它标成已排除，返回 false 让上一层换方向。为什么：这就是回溯的「撤销」——只有把标记恢复，兄弟分支看到的才是没被污染的棋盘。`
      )
    )
    return false
  }

  outer: for (let i = 0; i < M; i++) {
    for (let j = 0; j < N; j++) {
      if (BOARD[i][j] !== WORD[0]) continue

      steps.push({
        ...snap(
          'start',
          null,
          null,
          false,
          `观察：外层扫描到 (${i},${j})，字符 '${BOARD[i][j]}' 与首字母 word[0] = '${WORD[0]}' 相同（之前扫过的格子首字母都不匹配，已直接跳过）。判断：它可能是完整路径的起点，但首字母相同并不保证能拼出整个单词。动作：以 dfs(${i}, ${j}, 0) 出发，按 ${DIR_ORDER} 逐个方向尝试下一个字母 '${WORD[1] ?? WORD[0]}'。为什么：枚举所有可能的起点才能保证不漏解；从一个起点出发失败后要回到干净棋盘，再换下一个起点。`
        ),
        start: { r: i, c: j },
      })

      if (dfs(i, j, 0, null)) {
        found = true
        foundPath = path.map((p) => [p[0], p[1]] as [number, number])
        steps.push({
          ...snap(
            'found',
            { r: i, c: j },
            null,
            false,
            `观察：从 (${i},${j}) 出发的 DFS 一路匹配到最后一个字符。判断：index = ${WORD.length} 触发递归入口的第一条分支，整条路径正好拼出 "${WORD}"。动作：递归逐层返回 true（每层返回前都写回原字符），外层循环随即结束搜索。为什么：命中后不必再试其他起点，剩下的候选起点都可以剪掉。`
          ),
          start: { r: i, c: j },
        })
        break outer
      }
    }
  }

  steps.push(
    snap(
      'done',
      null,
      null,
      false,
      found
        ? `观察：搜索在第 ${steps.length} 个快照处提前结束，所有格子都恢复成原始字符，棋盘没有残留 '#'。判断：路径 ${posText(foundPath)} 相邻成立且逐格字符恰好拼出 "${WORD}"，所以 word 存在于网格中。动作：返回 true，答案就是这条路径（按进入顺序编号 ${foundPath.map((_, k) => k + 1).join(' → ')}）。为什么：每个起点、每条分支都只在必要时才展开，时间 O(m·n·3^L)、L = ${WORD.length}；递归栈深度等于单词长度，额外空间 O(L)。`
        : `观察：所有格子都扫过，没有以任何 word[0] 开头的起点能拼出 "${WORD}"。判断：网格中不存在这样的简单路径。动作：返回 false。为什么：搜索空间被首字母、越界、字符不匹配三重剪枝层层缩小，最坏时间 O(m·n·3^L)、L = ${WORD.length}；递归栈深度等于单词长度，额外空间 O(L)。`
    )
  )

  // 「下一步动作」由后一个快照推导，保证与步骤数据完全一致
  steps.forEach((s, i) => {
    const b = steps[i + 1]
    if (!b) return
    if (b.phase === 'done') {
      s.next = '递归逐层返回，输出答案'
      return
    }
    if (b.phase === 'start') {
      s.next = `以 (${b.start?.r},${b.start?.c}) 为起点进入 DFS，依次尝试 ${DIR_ORDER}`
      return
    }
    if (b.phase === 'found') {
      const tail = s.path[s.path.length - 1]
      s.next = tail
        ? `( ${tail[0]},${tail[1]} ) 已匹配完最后一个字符，逐层返回 true`
        : '整条路径已匹配，逐层返回 true'
      return
    }
    // move / back：目标格子都存在（越界的 move 没有目标）
    if (b.oob) {
      s.next = `沿「${DIRS[(b.dir ?? 0) % DIRS.length].name}」走到网格外，越界直接判失败`
      return
    }
    const from = s.cur
    if (!from) {
      s.next = `进入 (${b.cur?.r},${b.cur?.c})，匹配 word[0]`
      return
    }
    const d = DIRS[b.dir ?? 0]
    const target = `(${b.cur?.r},${b.cur?.c})`
    if (b.phase === 'move') {
      s.next = `沿「${d.name}」到 ${target}，检查 '${BOARD[b.cur?.r ?? 0][b.cur?.c ?? 0]}' 是否等于 word[${b.matched}]`
    } else if (b.phase === 'enter') {
      s.next = `沿「${d.name}」进入 ${target}，字符匹配，压入 path`
    } else if (b.phase === 'back') {
      s.next = `四个方向都失败，从 ${target} 弹出并撤销访问标记`
    } else {
      s.next = `回到 ${target}`
    }
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

const GAP = 6
const LABEL_W = 34
const CELL_W = 44
const GRID_MAX = LABEL_W + GAP + N * CELL_W + (N - 1) * GAP

function Stage(step: Step) {
  const done = step.phase === 'done'
  const searching = step.phase !== 'done' && step.phase !== 'found'
  /** 找到后整条路径转绿；搜索中路径用琥珀 */
  const pathTone: CellState = step.found ? 'ok' : 'active'
  const charOf = (r: number, c: number) => BOARD[r]?.[c] ?? '#'
  const inPath = (r: number, c: number) => step.path.findIndex(([pr, pc]) => pr === r && pc === c)

  const stateOf = (r: number, c: number): CellState => {
    // 越界步的 cur 落在网格外，网格里没有对应格子，因此这里只需处理网格内的坐标
    if (step.cur !== null && step.cur.r === r && step.cur.c === c) {
      return step.phase === 'move' ? 'bad' : pathTone
    }
    if (inPath(r, c) >= 0) return pathTone
    if (step.dim[r][c]) return 'dim'
    return 'idle'
  }

  /** 路径序号角标：当前格额外加 #，保证不只靠颜色区分状态 */
  const cellTag = (r: number, c: number) => {
    const k = inPath(r, c)
    if (k < 0) return null
    if (step.found) return k + 1
    const isCur = step.cur !== null && step.cur.r === r && step.cur.c === c
    return isCur ? `#${k + 1}` : String(k + 1)
  }

  const stripState = (i: number): CellState => {
    if (i < step.matched) return 'ok'
    if (searching && i === step.matched) return 'active'
    return 'idle'
  }

  const dirLabel = step.dir === null ? '—' : DIRS[step.dir].name

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 正方形单元格网格：3 行 4 列都不超过 10，因此标出行列号 */}
      <div
        className="grid w-full gap-1.5"
        style={{
          gridTemplateColumns: `${LABEL_W / 16}rem repeat(${N}, minmax(0, 1fr))`,
          maxWidth: GRID_MAX,
        }}
      >
        {/* 表头：列号 + 本次移动方向 */}
        <span aria-hidden />
        {COLS.map((c) => {
          const oobCol = step.oob && step.cur !== null && step.cur.c === c
          const here = !step.oob && step.cur !== null && step.cur.c === c
          return (
            <div key={`head-${c}`} className="flex h-4 items-center justify-center gap-0.5 leading-none">
              <span className="font-code text-[10px] text-ink-soft">{c}</span>
              {step.dir !== null && (here || oobCol) && (
                <span
                  className={cn(
                    'font-code text-[10px] font-bold',
                    oobCol ? 'text-[hsl(var(--hard))]' : 'text-[hsl(var(--amber))]'
                  )}
                >
                  {oobCol ? '!' : DIRS[step.dir].code}
                </span>
              )}
            </div>
          )
        })}

        {ROWS.map((r) => {
          const oobRow = step.oob && step.cur !== null && step.cur.r === r
          const here = !step.oob && step.cur !== null && step.cur.r === r
          return (
            <Fragment key={`row-${r}`}>
              <div className="flex items-center justify-center gap-0.5 leading-none">
                <span className="font-code text-[10px] text-ink-soft">{r}</span>
                {step.dir !== null && (here || oobRow) && (
                  <span
                    className={cn(
                      'font-code text-[10px] font-bold',
                      oobRow ? 'text-[hsl(var(--hard))]' : 'text-[hsl(var(--amber))]'
                    )}
                  >
                    {oobRow ? '!' : DIRS[step.dir].code}
                  </span>
                )}
              </div>
              {COLS.map((c) => {
                const state = stateOf(r, c)
                const tag = cellTag(r, c)
                const isCur = step.cur !== null && step.cur.r === r && step.cur.c === c
                return (
                  <div key={`cell-${r}-${c}`} className="relative min-w-0">
                    <Cell
                      state={state}
                      size="sm"
                      className={cn(
                        'h-auto w-full min-w-0 aspect-square sm:min-w-0 sm:text-[15px]',
                        // 当前路径上的格子加琥珀描边，与「已排除 / 未访问」再区分一层
                        tag !== null && !step.found && 'ring-2 ring-[hsl(var(--amber))]/40',
                        isCur && step.phase === 'move' && 'ring-2 ring-[hsl(var(--hard))]/40'
                      )}
                    >
                      {charOf(r, c)}
                    </Cell>
                    {tag !== null && (
                      <span
                        className={cn(
                          'absolute -right-1 -top-1 rounded-full border border-border bg-card px-1 font-code text-[9px] font-bold leading-tight',
                          step.found ? 'text-[hsl(var(--easy))]' : 'text-[hsl(var(--amber))]'
                        )}
                      >
                        {tag}
                      </span>
                    )}
                  </div>
                )
              })}
            </Fragment>
          )
        })}
      </div>

      {/* 目标单词进度条：按 word[index] 逐个点亮 */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-ink-soft">word</span>
        <div className="flex gap-1.5">
          {WORD.split('').map((ch, i) => (
            <Cell
              key={`word-${i}-${ch}`}
              state={stripState(i)}
              size="sm"
              className="h-8 min-w-8 px-0 text-[13px] sm:min-w-8"
            >
              {ch}
            </Cell>
          ))}
        </div>
        <span className="font-code text-[11px] text-ink-soft">index</span>
        <span className="font-code text-[11px] text-ink-soft">
          {step.matched < WORD.length ? step.matched : '完整'}
        </span>
      </div>

      <Badges className="justify-center">
        <Stat
          label="已匹配"
          value={`${step.matched} / ${WORD.length}`}
          tone={step.found ? 'easy' : 'amber'}
        />
        <Badge tone={step.oob ? 'hard' : 'plain'}>
          当前格{' '}
          <b className="font-code text-xs">
            {step.cur && !step.oob ? `(${step.cur.r},${step.cur.c})` : '越界（网格外）'}
          </b>
          {step.cur && !step.oob && (
            <>
              {' = '}
              <b className="font-code text-xs">'{charOf(step.cur.r, step.cur.c)}'</b>
            </>
          )}
        </Badge>
        <Stat
          label="方向"
          value={step.oob ? `${dirLabel}（越界）` : dirLabel}
          tone={step.oob ? 'hard' : 'teal'}
        />
        {!done && step.next && <Hint>{step.next}</Hint>}
        {done && step.found && (
          <Answer>
            <b className="font-code">true</b>（路径{' '}
            <b className="font-code">{step.foundPath.map(([r, c]) => `(${r},${c})`).join(' → ')}</b>，
            共 {step.foundPath.length} 步）
          </Answer>
        )}
        {done && !step.found && (
          <Answer>
            <b className="font-code">false</b>
          </Answer>
        )}
      </Badges>
    </div>
  )
}

export default function WordSearchDemo() {
  const steps = useMemo(buildSteps, [])

  return (
    <DemoShell
      title="网格 DFS：进入标记，失败回溯"
      info={`输入：board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]]，word = "SEE"（题解示例 2，输出 true）。示例 1 的 "ABCCED" 命中前要试更多起点、路径更长，示例 3 的 "ABCB" 则要为每个起点逐个方向搜到失败，两者都会让快照数暴涨；这里取提示同样为 true、规模最小的示例 2，它既完整展示了「首字母筛选起点 → 进入标记 → 失败回溯 → 命中」的全过程，又有一个必然失败的起点 (1,0) 用来演示回溯，共 ${steps.length} 步。`}
      steps={steps}
      autoMs={1400}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '当前路径上的格子（角标 = 进入顺序）' },
        { color: TONE.easy, label: '命中完整单词时的整条路径' },
        { color: TONE.hard, label: '方向尝试失败：越界或字符不匹配' },
        { color: TONE.muted, label: '已探索且失败（访问标记已撤销）' },
        { color: TONE.ink, label: '未访问的格子' },
      ]}
    />
  )
}
