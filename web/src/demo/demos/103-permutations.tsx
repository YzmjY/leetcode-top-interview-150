import { useMemo } from 'react'
import { DemoShell } from '../DemoShell'
import { Answer, Badges, Cell, Hint, Stat, TONE, type CellState } from './stage'

/* ------------------------------------------------------------------ */
/* 103. 全排列 —— 模式 E：递归决策树（used 标记 + 成对撤销选择）         */
/* ------------------------------------------------------------------ */

/** 题解示例 1：nums = [1,2,3]，答案 6 个排列（用最小的完整示例看清剪枝与回溯） */
const NUMS = [1, 2, 3]
const N = NUMS.length
const INPUT_TEXT = `[${NUMS.join(', ')}]`
const FACTORIAL = NUMS.reduce((acc, _, i) => acc * (i + 1), 1)

interface Step {
  phase: 'init' | 'choose' | 'collect' | 'undo' | 'done'
  /** 当前排列前缀（不可变快照） */
  path: number[]
  /** used 快照：哪些下标已在当前路径上用过 */
  used: boolean[]
  /** 已收集到的完整排列（不可变快照） */
  results: number[][]
  /** 本步被撤销的下标；其余步骤为 -1 */
  undoIdx: number
  note: string
  /** 下一步动作（最后按后一个快照统一回填，供 Hint 使用） */
  next: string
}

function buildSteps(): Step[] {
  const steps: Step[] = []
  const path: number[] = []
  const used: boolean[] = NUMS.map(() => false)
  const results: number[][] = []

  const snap = (phase: Step['phase'], undoIdx: number, note: string): Step => {
    steps.push({
      phase,
      path: path.slice(),
      used: used.slice(),
      results: results.map((r) => r.slice()),
      undoIdx,
      note,
      next: '',
    })
    return steps[steps.length - 1]
  }

  snap(
    'init',
    -1,
    `观察：nums = ${INPUT_TEXT}，path 为空、used 全为 false。判断：排列区分顺序，所以每一层都从下标 0 开始重新扫描整个数组，而不是像组合那样用 start 限制起点；去重完全依赖 used，确保同一条路径里每个元素只用一次。动作：从 path 长度为 0 的第 1 层开始，逐个尝试还没被用过的元素。为什么：每层选一个未用元素，长度达到 n = ${N} 时正好每个元素各用一次，这样生成的排列既不重复也不遗漏。`
  )

  function backtrack(): void {
    if (path.length === N) {
      results.push(path.slice())
      snap(
        'collect',
        -1,
        `观察：path 长度达到 n = ${N}，${N} 个元素各用了一次。判断：这就是一个完整排列 [${path.join(', ')}]，可以收进结果集。动作：把 path 深拷贝一份加入 result（必须拷贝，否则所有结果会共享同一个底层数组），然后返回上一层。为什么：每层选一个未用元素，所以每个排列恰好对应一条从第 1 层走到第 ${N} 层的完整决策路径。`
      )
      return
    }

    const depth = path.length
    for (let i = 0; i < N; i++) {
      if (used[i]) continue

      used[i] = true
      path.push(NUMS[i])
      snap(
        'choose',
        -1,
        `观察：第 ${depth + 1} 层扫描到下标 ${i}，used[${i}] 为 false，说明 nums[${i}] = ${NUMS[i]} 还没出现在当前路径上。判断：它可以作为第 ${depth + 1} 位的候选。动作：置 used[${i}] = true，把 ${NUMS[i]} 追加到 path，path 变为 [${path.join(', ')}]，随即递归到第 ${depth + 2} 层。为什么：排列靠 used 排除同一路径上已用的元素，而每层都从下标 0 重新扫描，正是排列模板与组合模板的关键区别。`
      )

      backtrack()

      path.pop()
      used[i] = false
      const undonePath = [...path, NUMS[i]]
      snap(
        'undo',
        i,
        `观察：以 path = [${undonePath.join(', ')}] 为前缀的子树已经全部走完。判断：继续留在这个前缀上不会再有新排列。动作：把 nums[${i}] = ${NUMS[i]} 从 path 末尾弹出，并把 used[${i}] 复位为 false，回到分支 ${path.length === 0 ? '（空路径）' : `[${path.join(', ')}]`} 继续扫描下标 ${i + 1}。为什么：used[${i}] = false 与 path 的弹出必须成对执行，漏掉任一个都会让后面的分支出错。`
      )
    }
  }

  backtrack()

  const listed = results.map((r) => `[${r.join(',')}]`).join(', ')
  snap(
    'done',
    -1,
    `观察：backtrack 全部返回，path 与 used 都清空，结果集里留下 ${results.length} 个排列：${listed}。判断：${results.length} 等于 ${N}! = ${FACTORIAL}，每个排列由「每一层选哪个未用元素」唯一确定，不同分支在第 1 位就选了不同的元素，所以不可能重复。动作：答案就是这 ${results.length} 个排列，读法是把每条从第 1 层到第 ${N} 层的完整路径依次写下。为什么：共有 n! 个排列，每个排列拷贝一次需要 O(n)，时间 O(n × n!)；path、used 与递归栈深度都不超过 n，空间 O(n)（不计存放答案的空间）。`
  )

  // 「下一步动作」由后一个快照统一回填，保证 Hint 始终描述真正的下一步
  steps.forEach((s, i) => {
    const b = steps[i + 1]
    if (!b) return
    if (b.phase === 'choose') {
      const picked = b.path[b.path.length - 1]
      s.next = `在第 ${b.path.length} 层选 nums[${b.path.indexOf(picked)}] = ${picked}，置 used 为 true 并追加进 path`
    } else if (b.phase === 'collect') {
      s.next = `path 长度已到 ${N}，把 [${b.path.join(', ')}] 收进结果集`
    } else if (b.phase === 'undo') {
      s.next = `撤销选择：弹出 nums[${b.undoIdx}] = ${NUMS[b.undoIdx]} 并复位 used[${b.undoIdx}]`
    } else if (b.phase === 'done') {
      s.next = '回溯结束，输出全部排列'
    }
  })

  return steps
}

/* ---------------- 舞台渲染 ---------------- */

const W = 780
const H = 340
const PAD = 60
const NODE_R = 22
const TOP = 56
const LAYER_GAP = 82

/** 每层的期望槽位数：第 k 层每个节点管辖 (n-k)! 个子节点，取 2 的幂以留足横向间距 */
function slotsAt(layer: number): number {
  let per = 1
  for (let k = layer + 1; k <= N; k++) per *= N - k + 1
  let pow = 1
  while (pow < per) pow *= 2
  return pow
}

/** 每个节点按「层内序号」放到该层等分的槽位里：同层永不重叠，父节点居中于自己的子树 */
function coord(path: number[]): { x: number; y: number } {
  const layer = path.length
  const usable = W - 2 * PAD
  if (layer === 0) return { x: W / 2, y: TOP }
  const slots = slotsAt(layer)
  const parent = path.slice(0, -1)
  const avail = NUMS.map((_, i) => i).filter((i) => !parent.includes(i))
  const idx = avail.indexOf(path[path.length - 1])
  return {
    x: PAD + (usable * (2 * idx + 1)) / (2 * slots),
    y: TOP + layer * LAYER_GAP,
  }
}

function Stage(step: Step) {
  const n = step.path.length
  const done = step.phase === 'done'
  const undoNode = step.undoIdx >= 0 ? [...step.path, step.undoIdx].join('.') : ''
  /** 已经出现在某条完整排列路径上的节点（整条路径转绿） */
  const collected = (path: number[]) =>
    path.length > 0 && step.results.some((r) => path.every((v, k) => r[k] === v))
  const onCurrent = (path: number[]) =>
    path.length > 0 && path.every((v, k) => step.path[k] === v)

  const accumulated = done ? (step.results[step.results.length - 1] ?? []) : step.path
  const last = accumulated.length > 0 ? accumulated[accumulated.length - 1] : null
  const cellState = (i: number): CellState => {
    if (step.phase === 'undo' && i === step.undoIdx) return 'bad'
    if (done || step.phase === 'collect') return 'ok'
    if (i === last) return 'active'
    if (step.used[i]) return 'ok'
    return 'dim'
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full select-none">
        {/* 1. 决策树的边：先画线，节点圆后画盖住端点 */}
        {step.results.flatMap((r) =>
          r.map((_, k) => {
            const child = r.slice(0, k + 1)
            const a = coord(child.slice(0, -1))
            const b = coord(child)
            return (
              <line
                key={`edge-${r.join('.')}-${k}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="hsl(var(--easy))"
                strokeWidth={2}
              />
            )
          })
        )}
        {n > 0 &&
          step.path.map((_, k) => {
            const child = step.path.slice(0, k + 1)
            const a = coord(child.slice(0, -1))
            const b = coord(child)
            const green = collected(child)
            return (
              <line
                key={`live-edge-${child.join('.')}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={green ? 'hsl(var(--easy))' : 'hsl(var(--amber))'}
                strokeWidth={green ? 2 : 2.5}
              />
            )
          })}

        {/* 2. 这一层未被选中的候选分支（虚边 + 灰点） */}
        {n > 0 &&
          n < N &&
          step.used
            .map((u, i) => ({ u, i }))
            .filter(({ u }) => !u)
            .map(({ i }) => {
              const a = coord(step.path)
              const b = coord([...step.path, i])
              return (
                <g key={`cand-${i}`}>
                  <line
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke="hsl(var(--border))"
                    strokeWidth={2}
                    strokeDasharray="5 4"
                  />
                  <circle cx={b.x} cy={b.y} r={7} fill="hsl(var(--ink) / 0.18)" />
                  <text
                    x={b.x}
                    y={b.y + 4}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="700"
                    className="font-code"
                    fill="hsl(var(--ink-soft))"
                  >
                    {NUMS[i]}
                  </text>
                </g>
              )
            })}

        {/* 3. 决策树节点圆 + 值（节点只画真实走过的分支） */}
        {step.results.flatMap((r) =>
          r.map((_, k) => {
            const path = r.slice(0, k + 1)
            const id = path.join('.')
            const { x, y } = coord(path)
            const undo = id === undoNode
            const on = onCurrent(path)
            const fill = undo
              ? 'hsl(var(--paper))'
              : on
                ? 'hsl(var(--amber-soft))'
                : 'hsl(var(--easy-soft))'
            const stroke = undo ? 'hsl(var(--hard))' : on ? 'hsl(var(--amber))' : 'hsl(var(--easy))'
            return (
              <g key={id}>
                <circle cx={x} cy={y} r={NODE_R} fill={fill} stroke={stroke} strokeWidth={2.5} />
                <text
                  x={x}
                  y={y + 6}
                  textAnchor="middle"
                  fontSize={k === N - 1 ? 15 : 17}
                  fontWeight="700"
                  className="font-code"
                  fill={
                    undo
                      ? 'hsl(var(--hard))'
                      : on
                        ? 'hsl(var(--amber))'
                        : 'hsl(var(--easy))'
                  }
                >
                  {k === N - 1 ? path.join('') : NUMS[path[k]]}
                </text>
              </g>
            )
          })
        )}

        {/* 4. 文字标签：层号、当前层、撤销标记 —— 状态不只靠颜色区分 */}
        {step.results.flatMap((r) =>
          r.map((_, k) => {
            const path = r.slice(0, k + 1)
            const id = path.join('.')
            const { x, y } = coord(path)
            const undo = id === undoNode
            const on = onCurrent(path)
            const isLeaf = k === N - 1
            return (
              <g key={`label-${id}`}>
                {isLeaf ? (
                  <text
                    x={x}
                    y={y + NODE_R + 16}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="600"
                    className="font-code"
                    fill="hsl(var(--easy))"
                  >
                    第{N}层 · 完整排列
                  </text>
                ) : (
                  <text
                    x={x}
                    y={y - NODE_R - 8}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="600"
                    className="font-code"
                    fill={on ? 'hsl(var(--amber))' : 'hsl(var(--ink-soft))'}
                  >
                    第{k + 1}层
                  </text>
                )}
                {undo && (
                  <text
                    x={x + NODE_R + 6}
                    y={y + 4}
                    textAnchor="start"
                    fontSize="10"
                    fontWeight="700"
                    className="font-code"
                    fill="hsl(var(--hard))"
                  >
                    撤销
                  </text>
                )}
                {isLeaf && (
                  <text
                    x={x + NODE_R + 6}
                    y={y + 4}
                    textAnchor="start"
                    fontSize="10"
                    fontWeight="700"
                    className="font-code"
                    fill="hsl(var(--easy))"
                  >
                    已收集
                  </text>
                )}
              </g>
            )
          })
        )}

        <text
          x={W / 2}
          y={H - 6}
          textAnchor="middle"
          fontSize="11"
          className="font-code"
          fill="hsl(var(--ink-soft))"
        >
          未选中的候选分支只画成虚边 + 灰点：排列每层都从下标 0 重新扫描，靠 used 跳过已用元素
        </text>
      </svg>

      {/* nums 原数组 + used 标记 */}
      <div className="flex w-full flex-col items-center gap-1.5">
        <span className="text-[11px] text-ink-soft">
          nums 与 used：琥珀 = 本步刚选中 · 绿 = 已在本路径用过 · 灰 = 本轮候选 · 红 = 刚撤销
        </span>
        <div
          className="grid w-full gap-1.5"
          style={{
            gridTemplateColumns: `repeat(${N}, minmax(0, 1fr))`,
            maxWidth: `${N * 54}px`,
          }}
        >
          {NUMS.map((value, i) => (
            <div key={`num-${i}`} className="flex flex-col items-center gap-1">
              <Cell state={cellState(i)} className="w-full min-w-0 sm:min-w-0">
                {value}
              </Cell>
              <span
                className={
                  step.used[i]
                    ? 'font-code text-[10px] font-bold text-[hsl(var(--easy))]'
                    : 'font-code text-[10px] text-ink-soft'
                }
              >
                {step.used[i] ? 'used=true' : 'used=false'}
              </span>
              <span className="font-code text-[10px] text-ink-soft">[{i}]</span>
            </div>
          ))}
        </div>
      </div>

      {/* 当前 path 与已收集的结果集 */}
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[11px]">
        <span className="flex items-center gap-1.5">
          <span className="text-ink-soft">path：</span>
          {step.path.length === 0 ? (
            <span className="font-code text-ink-soft">（空，第 1 层开始选）</span>
          ) : (
            step.path.map((v, k) => (
              <span key={`path-${k}`} className="flex items-center gap-1.5">
                {k > 0 && <span className="text-ink-soft">→</span>}
                <span
                  className={
                    done || step.phase === 'collect'
                      ? 'rounded-md border border-[hsl(var(--easy))]/50 bg-[hsl(var(--easy-soft))] px-2 py-0.5 font-code font-semibold text-[hsl(var(--easy))]'
                      : k === step.path.length - 1
                        ? 'rounded-md border border-[hsl(var(--amber))]/50 bg-[hsl(var(--amber-soft))] px-2 py-0.5 font-code font-semibold text-[hsl(var(--amber))]'
                        : 'rounded-md border border-border bg-card px-2 py-0.5 font-code text-ink-soft'
                  }
                >
                  {v}
                </span>
              </span>
            ))
          )}
        </span>
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="text-ink-soft">结果集：</span>
          {step.results.length === 0 ? (
            <span className="font-code text-ink-soft">（还没有收集到排列）</span>
          ) : (
            step.results.map((r, k) => (
              <span
                key={`res-${k}`}
                className="rounded-md border border-[hsl(var(--easy))]/50 bg-[hsl(var(--easy-soft))] px-1.5 py-0.5 font-code font-semibold text-[hsl(var(--easy))]"
              >
                [{r.join(',')}]
              </span>
            ))
          )}
        </span>
      </div>

      <Badges className="justify-center">
        <Stat label="当前 path" value={n === 0 ? '（空）' : step.path.join(' → ')} tone="amber" />
        <Stat label="已收集排列" value={step.results.length} tone="easy" />
        {!done && step.next && <Hint>{step.next}</Hint>}
        {done && (
          <Answer>
            共 <b className="font-code">{step.results.length}</b> ={' '}
            <b className="font-code">{N}!</b> 个排列：{step.results.map((r) => `[${r.join(',')}]`).join(' ')}
          </Answer>
        )}
      </Badges>
    </div>
  )
}

export default function PermutationsDemo() {
  const steps = useMemo(buildSteps, [])
  return (
    <DemoShell
      title="决策树上的 used 标记与成对撤销"
      info={`输入：nums = ${INPUT_TEXT}（题解示例 1，输出 6 个排列）。示例 2 的 [0,1] 只有 2 个排列，看不全「每层从下标 0 重新扫描 + 撤销后再走兄弟分支」的全过程，所以这里取能完整展示剪枝与回溯的最小官方示例 —— 规模再大一级，步数会随 n! 爆炸。`}
      steps={steps}
      autoMs={1200}
      renderStep={(s) => <Stage {...s} />}
      describe={(s) => s.note}
      legend={[
        { color: TONE.amber, label: '当前路径 / 本步刚选中的元素' },
        { color: TONE.easy, label: '已收集的完整排列（整条路径转绿）' },
        { color: TONE.hard, label: '本步刚被撤销的选择' },
        { color: TONE.muted, label: '本轮候选 / 尚未使用（虚边灰点）' },
      ]}
    />
  )
}
